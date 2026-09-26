import Product from '../models/product.model.js';
import ApiError from '../utils/ApiError.js';
import { buildPagination, buildPaginationMeta, escapeRegex } from '../utils/query.js';

/**
 * Fetch all products with search & category filter
 */
export const getAllProducts = async (queryParams = {}) => {
  const { search, category } = queryParams;

  // Clamped, unlike a raw Number(query.limit), so a caller cannot ask for an
  // unbounded result set.
  const { page, limit, skip } = buildPagination(queryParams);

  const filter = {};

  if (search) {
    // The user supplied value is matched literally. Passing it straight into
    // $regex made a value such as "[" throw inside Mongo, which surfaced as a
    // 500, and let ".*" behave as a wildcard.
    const pattern = escapeRegex(search);

    filter.$or = [
      { name: { $regex: pattern, $options: 'i' } },
      { sku: { $regex: pattern, $options: 'i' } },
      { category: { $regex: pattern, $options: 'i' } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
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
