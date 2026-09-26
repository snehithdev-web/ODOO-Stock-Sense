import api from '../../services/api';
import { mapMovement, mapLowStockProduct, mapOperation } from '../../services/inventoryApi';
import { parseDashboardFilters } from './dashboardQuery';

/**
 * Dashboard reads.
 *
 * Every figure comes from GET /api/dashboard, which aggregates the same
 * document collections the operational lists read, so a count here can never
 * disagree with the list behind it.
 *
 * Failures are allowed to propagate. An earlier version caught every error and
 * returned an empty payload labelled "success", which made a broken endpoint
 * indistinguishable from an empty warehouse.
 */

const listOf = (payload) => (Array.isArray(payload) ? payload : []);

/** Receipts, deliveries and transfers, each with the counterparty the table shows. */
const mapPending = (documents, counterparty) =>
  listOf(documents).map((document) => mapOperation(document, { counterparty }));

export const getDashboardSummary = async (filters = {}) => {
  const response = await api.get('/dashboard', { params: parseDashboardFilters(filters) });
  const data = response.data?.data || {};

  return {
    ...response.data,
    data: {
      ...data,
      lowStockProducts: listOf(data.lowStockProducts).map(mapLowStockProduct),
      pendingReceipts: mapPending(data.pendingReceipts, 'supplier'),
      pendingDeliveries: mapPending(data.pendingDeliveries, 'customer'),
      scheduledTransfers: mapPending(data.scheduledTransfers),
      recentMovements: listOf(data.recentMovements).map(mapMovement)
    }
  };
};

export const getLowStockProducts = async (filters = {}) => {
  const response = await api.get('/dashboard/low-stock', {
    params: parseDashboardFilters(filters)
  });

  return {
    ...response.data,
    data: listOf(response.data?.data).map(mapLowStockProduct)
  };
};

export const getPendingReceipts = async (filters = {}) => {
  const response = await api.get('/dashboard/pending-receipts', {
    params: parseDashboardFilters(filters)
  });

  return {
    ...response.data,
    data: mapPending(response.data?.data, 'supplier')
  };
};

export const getPendingDeliveries = async (filters = {}) => {
  const response = await api.get('/dashboard/pending-deliveries', {
    params: parseDashboardFilters(filters)
  });

  return {
    ...response.data,
    data: mapPending(response.data?.data, 'customer')
  };
};

export const getScheduledTransfers = async (filters = {}) => {
  const response = await api.get('/dashboard/scheduled-transfers', {
    params: parseDashboardFilters(filters)
  });

  return {
    ...response.data,
    data: mapPending(response.data?.data)
  };
};

export const getRecentMovements = async (filters = {}) => {
  const response = await api.get('/dashboard/recent-movements', {
    params: parseDashboardFilters(filters)
  });

  return {
    ...response.data,
    data: listOf(response.data?.data).map(mapMovement)
  };
};
