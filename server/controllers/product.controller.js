import * as productService from '../services/product.service.js';
import { sendSuccess } from '../utils/response.js';

export const getProducts = async (req, res, next) => {
  try {
    const { products, pagination } = await productService.getAllProducts(req.query);
    return sendSuccess(res, {
      message: 'Products retrieved successfully',
      data: products,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return sendSuccess(res, { message: 'Product retrieved successfully', data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user._id);
    return sendSuccess(res, {
      message: 'Product created successfully',
      statusCode: 201,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return sendSuccess(res, { message: 'Product updated successfully', data: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { message } = await productService.deleteProduct(req.params.id);
    return sendSuccess(res, { message });
  } catch (error) {
    next(error);
  }
};
