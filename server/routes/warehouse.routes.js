import express from 'express';
import {
  getWarehouses,
  getWarehouseById,
  createNewWarehouse,
  addLocation
} from '../controllers/warehouse.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getWarehouses);

// Only inventory_manager can change warehouse master data
router.post('/', authorize('inventory_manager'), createNewWarehouse);
router.route('/:id').get(getWarehouseById);
router.post('/:id/locations', authorize('inventory_manager'), addLocation);

export default router;
