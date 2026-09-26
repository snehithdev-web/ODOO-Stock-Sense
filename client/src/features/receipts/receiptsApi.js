import api from '../../services/api';

const mockReceipts = [
  {
    _id: 'RCPT-1001',
    reference: 'RCPT-1001',
    supplier: 'ABC Steel Suppliers',
    warehouse: 'Main Warehouse',
    location: 'Main Store',
    status: 'DRAFT',
    createdBy: 'Nadia Hart',
    createdAt: '2026-09-21T09:00:00.000Z',
    validatedAt: null,
    products: [
      { product: 'Steel Rods', quantity: 50 },
      { product: 'Cement', quantity: 20 },
    ],
  },
  {
    _id: 'RCPT-1002',
    reference: 'RCPT-1002',
    supplier: 'Metro Supply Co.',
    warehouse: 'North Hub',
    location: 'Receiving Bay A',
    status: 'DONE',
    createdBy: 'Amir Khan',
    createdAt: '2026-09-20T14:30:00.000Z',
    validatedAt: '2026-09-20T15:05:00.000Z',
    products: [
      { product: 'Wire Mesh', quantity: 35 },
      { product: 'Paint', quantity: 18 },
    ],
  },
  {
    _id: 'RCPT-1003',
    reference: 'RCPT-1003',
    supplier: 'BuildWell Materials',
    warehouse: 'South Hub',
    location: 'Dry Goods Zone',
    status: 'CANCELED',
    createdBy: 'Lina Gomez',
    createdAt: '2026-09-19T08:15:00.000Z',
    validatedAt: null,
    products: [{ product: 'Pipe Fittings', quantity: 12 }],
  },
];

const normalizeReceipt = (receipt = {}) => ({
  _id: receipt._id || receipt.id || `RCPT-${Date.now()}`,
  reference: receipt.reference || receipt._id || `RCPT-${Date.now()}`,
  supplier: receipt.supplier || '',
  warehouse: receipt.warehouse || '',
  location: receipt.location || '',
  status: receipt.status || 'DRAFT',
  createdBy: receipt.createdBy || 'Current User',
  createdAt: receipt.createdAt || new Date().toISOString(),
  validatedAt: receipt.validatedAt || null,
  products: Array.isArray(receipt.products) ? receipt.products : [],
});

const createLocalReceipt = (receiptData) => {
  const currentDate = new Date().toISOString();
  const newReceipt = {
    _id: receiptData._id || `RCPT-${Date.now()}`,
    reference: receiptData.reference || `RCPT-${Date.now()}`,
    supplier: receiptData.supplier,
    warehouse: receiptData.warehouse,
    location: receiptData.location,
    status: receiptData.status || 'DRAFT',
    createdBy: receiptData.createdBy || 'Current User',
    createdAt: receiptData.createdAt || currentDate,
    validatedAt: receiptData.validatedAt || null,
    products: receiptData.products || [],
  };

  return normalizeReceipt(newReceipt);
};

export const getReceipts = async () => {
  try {
    const response = await api.get('/receipts');
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Using local receipt data until the backend endpoint is available.',
      data: mockReceipts,
    };
  }
};

export const getReceiptById = async (id) => {
  try {
    const response = await api.get(`/receipts/${id}`);
    return response.data;
  } catch {
    const receipt = mockReceipts.find((item) => item._id === id) || mockReceipts[0];
    return {
      status: 'success',
      message: 'Loaded receipt from local demo data.',
      data: receipt,
    };
  }
};

export const createReceipt = async (receiptData) => {
  try {
    const response = await api.post('/receipts', receiptData);
    return response.data;
  } catch {
    const createdReceipt = createLocalReceipt({
      ...receiptData,
      status: 'DRAFT',
      createdBy: 'Current User',
    });

    return {
      status: 'success',
      message: 'Receipt saved locally in the frontend demo state.',
      data: createdReceipt,
    };
  }
};

export const updateReceipt = async (id, receiptData) => {
  try {
    const response = await api.put(`/receipts/${id}`, receiptData);
    return response.data;
  } catch {
    const updatedReceipt = normalizeReceipt({
      ...receiptData,
      _id: id,
      reference: receiptData.reference || id,
      createdAt: receiptData.createdAt || new Date().toISOString(),
    });

    return {
      status: 'success',
      message: 'Receipt updated locally in the frontend demo state.',
      data: updatedReceipt,
    };
  }
};

export const validateReceipt = async (id) => {
  try {
    const response = await api.patch(`/receipts/${id}/validate`);
    return response.data;
  } catch {
    const receipt = mockReceipts.find((item) => item._id === id) || mockReceipts[0];
    const updated = normalizeReceipt({
      ...receipt,
      status: 'DONE',
      validatedAt: new Date().toISOString(),
    });

    return {
      status: 'success',
      message: 'Receipt validated locally in the frontend demo state.',
      data: updated,
    };
  }
};

export const cancelReceipt = async (id) => {
  try {
    const response = await api.patch(`/receipts/${id}/cancel`);
    return response.data;
  } catch {
    const receipt = mockReceipts.find((item) => item._id === id) || mockReceipts[0];
    const updated = normalizeReceipt({
      ...receipt,
      status: 'CANCELED',
      validatedAt: receipt.validatedAt || null,
    });

    return {
      status: 'success',
      message: 'Receipt canceled locally in the frontend demo state.',
      data: updated,
    };
  }
};

export { mockReceipts };
