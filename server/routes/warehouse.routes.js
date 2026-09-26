import express from 'express';
import {
  getWarehouses,
  getWarehouseById,
  createNewWarehouse,
  updateWarehouse,
  addLocation,
  updateLocation
} from '../controllers/warehouse.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getWarehouses);

// Only inventory_manager can change warehouse master data
router.post('/', authorize('inventory_manager'), createNewWarehouse);
router.route('/:id').get(getWarehouseById);
router.put('/:id', authorize('inventory_manager'), updateWarehouse);
router.post('/:id/locations', authorize('inventory_manager'), addLocation);
router.put('/:id/locations/:locationId', authorize('inventory_manager'), updateLocation);

export default router;
