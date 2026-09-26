import {
  getDashboardSummaryData,
  getLowStockProductsService,
  getPendingReceiptsService,
  getPendingDeliveriesService,
  getScheduledTransfersService,
  getRecentMovementsService
} from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const data = await getDashboardSummaryData();
    return sendSuccess(res, {
      message: 'Dashboard summary retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const data = await getLowStockProductsService();
    return sendSuccess(res, {
      message: 'Low stock products retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingReceipts = async (req, res, next) => {
  try {
    const data = await getPendingReceiptsService();
    return sendSuccess(res, {
      message: 'Pending receipts retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingDeliveries = async (req, res, next) => {
  try {
    const data = await getPendingDeliveriesService();
    return sendSuccess(res, {
      message: 'Pending deliveries retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getScheduledTransfers = async (req, res, next) => {
  try {
    const data = await getScheduledTransfersService();
    return sendSuccess(res, {
      message: 'Scheduled transfers retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentMovements = async (req, res, next) => {
  try {
    const data = await getRecentMovementsService();
    return sendSuccess(res, {
      message: 'Recent movements retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};
