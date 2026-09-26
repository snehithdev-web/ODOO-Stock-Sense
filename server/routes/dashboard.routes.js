import express from 'express';
import {
  getDashboardSummary,
  getLowStockProducts,
  getPendingReceipts,
  getPendingDeliveries,
  getScheduledTransfers,
  getRecentMovements
} from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getDashboardSummary);
router.get('/low-stock', getLowStockProducts);
router.get('/pending-receipts', getPendingReceipts);
router.get('/pending-deliveries', getPendingDeliveries);
router.get('/scheduled-transfers', getScheduledTransfers);
router.get('/recent-movements', getRecentMovements);

export default router;
