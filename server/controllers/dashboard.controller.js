import * as dashboardService from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Dashboard reads.
 *
 * Every handler is a thin wrapper: the service owns the filters and the
 * aggregations, and each panel has its own endpoint as well as being included
 * in the combined summary, so the page can refresh one panel without refetching
 * the page.
 */

export const getDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboard(req.query);

    return sendSuccess(res, {
      message: 'Dashboard retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStock = async (req, res, next) => {
  try {
    const data = await dashboardService.getLowStock(req.query);

    return sendSuccess(res, {
      message: 'Low and out of stock products retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingReceipts = async (req, res, next) => {
  try {
    const data = await dashboardService.getPendingReceipts(req.query);

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
    const data = await dashboardService.getPendingDeliveries(req.query);

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
    const data = await dashboardService.getScheduledTransfers(req.query);

    return sendSuccess(res, {
      message: 'Scheduled internal transfers retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentMovements = async (req, res, next) => {
  try {
    const data = await dashboardService.getRecentMovementsPanel(req.query);

    return sendSuccess(res, {
      message: 'Recent stock movements retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};
