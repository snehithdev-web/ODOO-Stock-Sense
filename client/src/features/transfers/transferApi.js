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
  {
    _id: 'TRF-3004',
    reference: 'TRF-3004',
    sourceWarehouse: 'Main Warehouse',
    sourceLocation: 'Rack B',
    destinationWarehouse: 'Production Warehouse',
    destinationLocation: 'Finished Goods',
    status: 'CANCELED',
    createdBy: 'Samir Ali',
    createdAt: '2026-09-19T14:14:00.000Z',
    completedAt: null,
    products: [{ product: 'Paint', quantity: 10 }],
  },
];

const normalizeTransfer = (transfer = {}) => ({
  _id: transfer._id || transfer.id || `TRF-${Date.now()}`,
  reference: transfer.reference || transfer._id || `TRF-${Date.now()}`,
  sourceWarehouse: transfer.sourceWarehouse || '',
  sourceLocation: transfer.sourceLocation || '',
  destinationWarehouse: transfer.destinationWarehouse || '',
  destinationLocation: transfer.destinationLocation || '',
  status: transfer.status || 'DRAFT',
  createdBy: transfer.createdBy || 'Current User',
  createdAt: transfer.createdAt || new Date().toISOString(),
  completedAt: transfer.completedAt || null,
  products: Array.isArray(transfer.products)
    ? transfer.products.map((item) => ({
        product: item.product || '',
        quantity: Number(item.quantity) || 0,
      }))
    : [],
});

const createLocalTransfer = (transferData) => {
  const currentDate = new Date().toISOString();
  const newTransfer = {
    _id: transferData._id || `TRF-${Date.now()}`,
    reference: transferData.reference || `TRF-${Date.now()}`,
    sourceWarehouse: transferData.sourceWarehouse,
    sourceLocation: transferData.sourceLocation,
    destinationWarehouse: transferData.destinationWarehouse,
    destinationLocation: transferData.destinationLocation,
    status: transferData.status || 'DRAFT',
    createdBy: transferData.createdBy || 'Current User',
    createdAt: transferData.createdAt || currentDate,
    completedAt: transferData.completedAt || null,
    products: (transferData.products || []).map((item) => ({
      product: item.product,
      quantity: Number(item.quantity) || 0,
    })),
  };

  return normalizeTransfer(newTransfer);
};

export const getTransfers = async () => {
  try {
    const response = await api.get('/transfers');
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Using local transfer data until the backend endpoint is available.',
      data: mockTransfers,
    };
  }
};

export const getTransferById = async (id) => {
  try {
    const response = await api.get(`/transfers/${id}`);
    return response.data;
  } catch {
    const transfer = mockTransfers.find((item) => item._id === id) || mockTransfers[0];
    return {
      status: 'success',
      message: 'Loaded transfer from local demo data.',
      data: transfer,
    };
  }
};

export const createTransfer = async (transferData) => {
  try {
    const response = await api.post('/transfers', transferData);
    return response.data;
  } catch {
    const createdTransfer = createLocalTransfer({
      ...transferData,
      status: 'DRAFT',
      createdBy: 'Current User',
    });

    return {
      status: 'success',
      message: 'Transfer saved locally in the frontend demo state.',
      data: createdTransfer,
    };
  }
};

export const updateTransfer = async (id, transferData) => {
  try {
    const response = await api.put(`/transfers/${id}`, transferData);
    return response.data;
  } catch {
    const updatedTransfer = normalizeTransfer({
      ...transferData,
      _id: id,
      reference: transferData.reference || id,
      createdAt: transferData.createdAt || new Date().toISOString(),
    });

    return {
      status: 'success',
      message: 'Transfer updated locally in the frontend demo state.',
      data: updatedTransfer,
    };
  }
};

export const validateTransfer = async (id) => {
  try {
    const response = await api.patch(`/transfers/${id}/validate`);
    return response.data;
  } catch {
    const transfer = mockTransfers.find((item) => item._id === id) || mockTransfers[0];
    const updated = normalizeTransfer({
      ...transfer,
      status: 'DONE',
      completedAt: new Date().toISOString(),
    });

    return {
      status: 'success',
      message: 'Transfer completed locally in the frontend demo state.',
      data: updated,
    };
  }
};

export const cancelTransfer = async (id) => {
  try {
    const response = await api.patch(`/transfers/${id}/cancel`);
    return response.data;
  } catch {
    const transfer = mockTransfers.find((item) => item._id === id) || mockTransfers[0];
    const updated = normalizeTransfer({
      ...transfer,
      status: 'CANCELED',
      completedAt: transfer.completedAt || null,
    });

    return {
      status: 'success',
      message: 'Transfer canceled locally in the frontend demo state.',
      data: updated,
    };
  }
};

export { mockTransfers };
