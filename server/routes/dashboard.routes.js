import express from 'express';
import {
  getDashboard,
  getLowStock,
  getPendingReceipts,
  getPendingDeliveries,
  getScheduledTransfers,
  getRecentMovements
} from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

/**
 * Dashboard reads.
 *
 * All of these are reads, so any signed in user may call them: the dashboard is
 * how staff and managers alike see the state of the warehouse. The figures come
 * from the same collections the operational endpoints use, so a count on the
 * dashboard can never drift from the list behind it.
 *
 * The named panel paths are declared before nothing parameterised, since none
 * of them take a path parameter.
 */
const router = express.Router();

router.use(protect);

router.get('/', getDashboard);
router.get('/low-stock', getLowStock);
router.get('/pending-receipts', getPendingReceipts);
router.get('/pending-deliveries', getPendingDeliveries);
router.get('/scheduled-transfers', getScheduledTransfers);
router.get('/recent-movements', getRecentMovements);

export default router;
