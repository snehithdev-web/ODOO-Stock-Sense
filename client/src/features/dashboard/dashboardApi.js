import api from '../../services/api';

const emptyState = {
  summary: {
    totalProducts: 0,
    lowStockCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    scheduledTransfers: 0,
  },
  lowStockProducts: [],
  pendingReceipts: [],
  pendingDeliveries: [],
  scheduledTransfers: [],
  recentMovements: [],
  filters: {
    categories: [],
    warehouses: [],
  },
};

export const getDashboardSummary = async (params = {}) => {
  try {
    const response = await api.get('/dashboard', { params });
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Dashboard summary is unavailable until the backend endpoint is live.',
      data: emptyState,
    };
  }
};

export const getLowStockProducts = async (params = {}) => {
  try {
    const response = await api.get('/dashboard/low-stock', { params });
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Low stock data is unavailable until the backend endpoint is live.',
      data: [],
    };
  }
};

export const getPendingReceipts = async (params = {}) => {
  try {
    const response = await api.get('/dashboard/pending-receipts', { params });
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Pending receipts are unavailable until the backend endpoint is live.',
      data: [],
    };
  }
};

export const getPendingDeliveries = async (params = {}) => {
  try {
    const response = await api.get('/dashboard/pending-deliveries', { params });
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Pending deliveries are unavailable until the backend endpoint is live.',
      data: [],
    };
  }
};

export const getScheduledTransfers = async (params = {}) => {
  try {
    const response = await api.get('/dashboard/scheduled-transfers', { params });
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Scheduled transfers are unavailable until the backend endpoint is live.',
      data: [],
    };
  }
};

export const getRecentMovements = async (params = {}) => {
  try {
    const response = await api.get('/dashboard/recent-movements', { params });
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Recent movements are unavailable until the backend endpoint is live.',
      data: [],
    };
  }
};

export { emptyState };
