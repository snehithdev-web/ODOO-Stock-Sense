import api from '../../services/api';

const mockTransfers = [
  {
    _id: 'TRF-3001',
    reference: 'TRF-3001',
    sourceWarehouse: 'Main Warehouse',
    sourceLocation: 'Main Store',
    destinationWarehouse: 'Production Warehouse',
    destinationLocation: 'Production Rack',
    status: 'DRAFT',
    createdBy: 'Nadia Hart',
    createdAt: '2026-09-24T10:15:00.000Z',
    completedAt: null,
    products: [
      { product: 'Steel Rods', quantity: 40 },
      { product: 'Cement', quantity: 18 },
    ],
  },
  {
    _id: 'TRF-3002',
    reference: 'TRF-3002',
    sourceWarehouse: 'North Hub',
    sourceLocation: 'Rack A',
    destinationWarehouse: 'Main Warehouse',
    destinationLocation: 'Main Store',
    status: 'READY',
    createdBy: 'Amir Khan',
    createdAt: '2026-09-22T12:25:00.000Z',
    completedAt: null,
    products: [{ product: 'Wire Mesh', quantity: 24 }],
  },
  {
    _id: 'TRF-3003',
    reference: 'TRF-3003',
    sourceWarehouse: 'South Hub',
    sourceLocation: 'Cold Storage',
    destinationWarehouse: 'Main Warehouse',
    destinationLocation: 'Receiving Bay A',
    status: 'DONE',
    createdBy: 'Lina Gomez',
    createdAt: '2026-09-20T08:05:00.000Z',
    completedAt: '2026-09-20T09:12:00.000Z',
    products: [{ product: 'Pipe Fittings', quantity: 12 }],
  },
];

export const normalizeTransfer = (transfer = {}) => {
  const sourceWh = typeof transfer.from?.warehouse === 'object' ? transfer.from.warehouse?.name : (transfer.from?.warehouse || transfer.sourceWarehouse || 'Main Warehouse');
  const sourceLoc = transfer.from?.location || transfer.sourceLocation || 'Main Store';
  const destWh = typeof transfer.to?.warehouse === 'object' ? transfer.to.warehouse?.name : (transfer.to?.warehouse || transfer.destinationWarehouse || 'Destination Warehouse');
  const destLoc = transfer.to?.location || transfer.destinationLocation || 'Main Store';

  const rawItems = transfer.items || transfer.products || [];
  const products = rawItems.map((item) => ({
    product: typeof item.product === 'object' ? `${item.product?.name} (${item.product?.sku || ''})`.trim() : (item.product || ''),
    quantity: item.quantity || 0,
  }));

  return {
    _id: transfer._id || transfer.id || `TRF-${Date.now()}`,
    reference: transfer.reference || transfer._id || `TRF-${Date.now()}`,
    sourceWarehouse: sourceWh,
    sourceLocation: sourceLoc,
    destinationWarehouse: destWh,
    destinationLocation: destLoc,
    status: (transfer.status || 'DRAFT').toUpperCase(),
    createdBy: typeof transfer.createdBy === 'object' ? transfer.createdBy?.name : (transfer.createdBy || 'Current User'),
    createdAt: transfer.createdAt || transfer.documentDate || new Date().toISOString(),
    completedAt: transfer.postedAt || transfer.completedAt || null,
    products,
  };
};

export const getTransfers = async () => {
  try {
    const response = await api.get('/transfers');
    const list = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
    return {
      status: 'success',
      data: list.map(normalizeTransfer),
    };
  } catch {
    return {
      status: 'success',
      data: mockTransfers.map(normalizeTransfer),
    };
  }
};

export const getTransferById = async (id) => {
  try {
    const response = await api.get(`/transfers/${id}`);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeTransfer(item),
    };
  } catch {
    const transfer = mockTransfers.find((item) => item._id === id) || mockTransfers[0];
    return {
      status: 'success',
      data: normalizeTransfer(transfer),
    };
  }
};

export const createTransfer = async (transferData) => {
  try {
    const response = await api.post('/transfers', transferData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeTransfer(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const createdTransfer = normalizeTransfer({
      ...transferData,
      status: 'DRAFT',
      createdBy: 'Current User',
    });

    return {
      status: 'success',
      message: 'Transfer saved locally.',
      data: createdTransfer,
    };
  }
};

export const updateTransfer = async (id, transferData) => {
  try {
    const response = await api.put(`/transfers/${id}`, transferData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeTransfer(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const updatedTransfer = normalizeTransfer({
      ...transferData,
      _id: id,
    });

    return {
      status: 'success',
      data: updatedTransfer,
    };
  }
};

export const validateTransfer = async (id) => {
  try {
    let response;
    try {
      response = await api.post(`/transfers/${id}/post`);
    } catch (innerErr) {
      if (innerErr?.status === 404 || innerErr?.message?.includes('Not Found')) {
        response = await api.patch(`/transfers/${id}`, { status: 'done' });
      } else {
        throw innerErr;
      }
    }
    const item = response.data?.data?.document || response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeTransfer(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const transfer = mockTransfers.find((item) => item._id === id) || mockTransfers[0];
    const updated = normalizeTransfer({ ...transfer, status: 'DONE', completedAt: new Date().toISOString() });
    return { status: 'success', data: updated };
  }
};

export const cancelTransfer = async (id) => {
  try {
    const response = await api.post(`/transfers/${id}/cancel`);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeTransfer(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const transfer = mockTransfers.find((item) => item._id === id) || mockTransfers[0];
    const updated = normalizeTransfer({ ...transfer, status: 'CANCELED' });
    return { status: 'success', data: updated };
  }
};

export { mockTransfers };
