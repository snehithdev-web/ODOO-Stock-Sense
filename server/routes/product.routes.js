import express from 'express';
import {
  getProducts,
  getProductFilterOptions,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // All product routes require valid JWT

router.get('/', getProducts);

// Declared before '/:id' so the literal path is not swallowed by the id
// pattern and reported as an invalid ObjectId.
router.get('/filter-options', getProductFilterOptions);

router.get('/:id', getProduct);

// Only inventory_manager can mutate product catalog data
router.post('/', authorize('inventory_manager'), createProduct);
router.put('/:id', authorize('inventory_manager'), updateProduct);
router.delete('/:id', authorize('inventory_manager'), deleteProduct);

export default router;
