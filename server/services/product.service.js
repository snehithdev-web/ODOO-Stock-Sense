import Product from '../models/product.model.js';

/**
 * Fetch all products with search & category filter
 */
export const getAllProducts = async (queryParams = {}) => {
  const { search, category, page = 1, limit = 50 } = queryParams;

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  };
};

/**
 * Get product by ID
 */
export const getProductById = async (id) => {
  const product = await Product.findById(id).populate('createdBy', 'name email');
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

/**
 * Create a new product
 */
export const createProduct = async (productData, userId) => {
  const { sku } = productData;

  const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
  if (existingProduct) {
    const error = new Error(`Product with SKU '${sku}' already exists.`);
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.create({
    ...productData,
    createdBy: userId,
  });

  return product;
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
      const error = new Error(`Product SKU '${updateData.sku}' is already in use.`);
      error.statusCode = 400;
      throw error;
    }
  }

  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    const error = new Error('Product not found for update');
    error.statusCode = 404;
    throw error;
  }

  return product;
};

/**
 * Delete a product
 */
export const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    const error = new Error('Product not found for deletion');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'Product deleted successfully' };
};
