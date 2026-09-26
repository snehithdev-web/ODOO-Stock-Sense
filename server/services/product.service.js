import Product from '../models/product.model.js';
import ApiError from '../utils/ApiError.js';
import {
  buildPagination,
  buildPaginationMeta,
  escapeRegex,
  exactMatch,
  parseEnumParam,
  parseNonNegativeNumber,
} from '../utils/query.js';

/**
 * Stock buckets used by the low stock alert KPI in the problem statement.
 * Kept as an enum so the filter and the facet counts cannot drift apart.
 *
 * The two threshold buckets compare quantity against each product's own
 * reorderLevel, so they are expressed with $expr. A plain query filter cannot do
 * that: `{ quantity: { $lte: '$reorderLevel' } } }` compares against the literal
 * string "$reorderLevel", which is true for every numeric quantity and silently
 * returns the whole catalog. $expr also means these two filters cannot use an
 * index on quantity, which is acceptable at catalog scale.
 */
export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
};

const STOCK_STATUS_VALUES = Object.values(STOCK_STATUS);

/**
 * Whitelisted sort orders. A caller cannot pass an arbitrary sort object
 * through the query string, and each one ends with a stable tiebreaker so
 * paging through results cannot repeat or skip a row.
 */
const SORT_OPTIONS = {
  newest: { createdAt: -1, _id: 1 },
  oldest: { createdAt: 1, _id: 1 },
  name_asc: { name: 1, _id: 1 },
  name_desc: { name: -1, _id: 1 },
  sku_asc: { sku: 1, _id: 1 },
  sku_desc: { sku: -1, _id: 1 },
  quantity_asc: { quantity: 1, _id: 1 },
  quantity_desc: { quantity: -1, _id: 1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
};

const SORT_VALUES = Object.keys(SORT_OPTIONS);

/**
 * Fetch all products with search & smart filters
 *
 * Supported query params:
 *   search       free text across name, SKU, category and description
 *   sku          SKU only search, for the "scan/find by code" flow
 *   category     exact, case-insensitive
 *   location     exact, case-insensitive
 *   unit         exact, case-insensitive
 *   stockStatus  in_stock | low_stock | out_of_stock
 *   minPrice     inclusive lower bound on unit price
 *   maxPrice     inclusive upper bound on unit price
 *   sort         one of SORT_VALUES
 *   page, limit  clamped by buildPagination
 */
export const getAllProducts = async (queryParams = {}) => {
  const {
    search,
    sku,
    category,
    location,
    unit,
    stockStatus,
    minPrice,
    maxPrice,
    sort = 'newest',
  } = queryParams;

  // Clamped, unlike a raw Number(query.limit), so a caller cannot ask for an
  // unbounded result set.
  const { page, limit, skip } = buildPagination(queryParams);

  // Rejects an unknown sort or stockStatus with a 400 instead of dropping the
  // filter and returning the whole catalog.
  const sortKey = parseEnumParam(sort, SORT_VALUES, 'sort') || 'newest';
  const stockFilter = parseEnumParam(stockStatus, STOCK_STATUS_VALUES, 'stockStatus');

  const minPriceValue = parseNonNegativeNumber(minPrice, 'minPrice');
  const maxPriceValue = parseNonNegativeNumber(maxPrice, 'maxPrice');

  if (
    minPriceValue !== undefined &&
    maxPriceValue !== undefined &&
    minPriceValue > maxPriceValue
  ) {
    throw ApiError.badRequest('minPrice cannot be greater than maxPrice.');
  }

  const filter = {};

  // A dedicated SKU search is a substring match, not an exact one: an operator
  // typing "STL" needs to find "STL-001" without knowing the full code. This
  // is deliberately separate from `search` so a SKU lookup cannot be diluted by
  // a matching product name.
  if (sku) {
    filter.sku = { $regex: escapeRegex(String(sku).trim()), $options: 'i' };
  }

  if (search) {
    // The user supplied value is matched literally. Passing it straight into
    // $regex made a value such as "[" throw inside Mongo, which surfaced as a
    // 500, and let ".*" behave as a wildcard.
    const pattern = escapeRegex(String(search).trim());

    filter.$or = [
      { name: { $regex: pattern, $options: 'i' } },
      { sku: { $regex: pattern, $options: 'i' } },
      { category: { $regex: pattern, $options: 'i' } },
      { description: { $regex: pattern, $options: 'i' } },
    ];
  }

  if (category) {
    filter.category = exactMatch(category);
  }

  if (location) {
    filter.location = exactMatch(location);
  }

  if (unit) {
    filter.unit = exactMatch(unit);
  }

  if (minPriceValue !== undefined || maxPriceValue !== undefined) {
    filter.price = {};
    if (minPriceValue !== undefined) filter.price.$gte = minPriceValue;
    if (maxPriceValue !== undefined) filter.price.$lte = maxPriceValue;
  }

  if (stockFilter === STOCK_STATUS.OUT_OF_STOCK) {
    filter.quantity = { $lte: 0 };
  } else if (stockFilter === STOCK_STATUS.LOW_STOCK) {
    // In stock but at or below the reorder level. Out of stock is a separate
    // bucket so the two KPI numbers add up to the true low stock count.
    filter.quantity = { $gt: 0 };
    filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
  } else if (stockFilter === STOCK_STATUS.IN_STOCK) {
    filter.$expr = { $gt: ['$quantity', '$reorderLevel'] };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('createdBy', 'name email')
      .sort(SORT_OPTIONS[sortKey])
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

/**
 * Distinct filter values, derived from the catalog itself.
 *
 * The client previously inferred these from whatever page of results happened to
 * be loaded, which meant a category on page 3 was missing from the dropdown and
 * the list of options shifted as filters were applied. One $facet pass gives the
 * UI every real value plus how many products sit behind it, so the options stay
 * stable and can show counts.
 */
export const getProductFilterOptions = async () => {
  const [result] = await Product.aggregate([
    {
      $facet: {
        categories: [
          { $match: { category: { $nin: [null, ''] } } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        locations: [
          { $match: { location: { $nin: [null, ''] } } },
          { $group: { _id: '$location', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        units: [
          { $match: { unit: { $nin: [null, ''] } } },
          { $group: { _id: '$unit', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        stock: [
          {
            $group: {
              _id: null,
              inStock: {
                $sum: { $cond: [{ $gt: ['$quantity', '$reorderLevel'] }, 1, 0] },
              },
              lowStock: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gt: ['$quantity', 0] },
                        { $lte: ['$quantity', '$reorderLevel'] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              outOfStock: {
                $sum: { $cond: [{ $lte: ['$quantity', 0] }, 1, 0] },
              },
            },
          },
        ],
      },
    },
  ]);

  const toOptions = (rows) =>
    rows.map((row) => ({ value: row._id, count: row.count }));

  const stock = result?.stock?.[0] || {};

  return {
    categories: toOptions(result?.categories || []),
    locations: toOptions(result?.locations || []),
    units: toOptions(result?.units || []),
    stock: {
      inStock: stock.inStock || 0,
      lowStock: stock.lowStock || 0,
      outOfStock: stock.outOfStock || 0,
    },
    sortOptions: SORT_VALUES,
    stockStatusValues: STOCK_STATUS_VALUES,
  };
};

/**
 * Get product by ID
 */
export const getProductById = async (id) => {
  const product = await Product.findById(id).populate('createdBy', 'name email');
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  return product;
};

/**
 * Create a new product
 */
export const createProduct = async (productData, userId) => {
  const { sku } = productData;

  if (!sku) {
    throw ApiError.badRequest('Please provide product SKU / Code');
  }

  const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
  if (existingProduct) {
    throw ApiError.conflict(`Product with SKU '${sku}' already exists.`);
  }

  return Product.create({
    ...productData,
    createdBy: userId,
  });
};

/**
 * Update an existing product
 */
export const updateProduct = async (id, updateData) => {
  if (updateData.sku) {
    const existingProduct = await Product.findOne({
      sku: updateData.sku.toUpperCase(),
      _id: { $ne: id },
    });

    if (existingProduct) {
      throw ApiError.conflict(`Product SKU '${updateData.sku}' is already in use.`);
    }
  }

  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw ApiError.notFound('Product not found for update');
  }

  return product;
};

/**
 * Delete a product
 */
export const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw ApiError.notFound('Product not found for deletion');
  }
  return { message: 'Product deleted successfully' };
};
