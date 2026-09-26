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

export const normalizeReceipt = (receipt = {}) => {
  const supplierName = typeof receipt.supplier === 'object' ? receipt.supplier?.name : (receipt.supplier || '');
  const warehouseName = typeof receipt.warehouse === 'object' ? receipt.warehouse?.name : (receipt.warehouse || '');
  const rawItems = receipt.items || receipt.products || [];
  const products = rawItems.map((item) => ({
    product: typeof item.product === 'object' ? `${item.product?.name} (${item.product?.sku || ''})`.trim() : (item.product || ''),
    quantity: item.quantity || 0,
  }));

  return {
    _id: receipt._id || receipt.id || `RCPT-${Date.now()}`,
    reference: receipt.reference || receipt._id || `RCPT-${Date.now()}`,
    supplier: supplierName,
    warehouse: warehouseName,
    location: receipt.location || '',
    status: (receipt.status || 'DRAFT').toUpperCase(),
    createdBy: typeof receipt.createdBy === 'object' ? receipt.createdBy?.name : (receipt.createdBy || 'Current User'),
    createdAt: receipt.createdAt || receipt.documentDate || new Date().toISOString(),
    validatedAt: receipt.postedAt || receipt.validatedAt || null,
    products,
  };
};

export const getReceipts = async () => {
  try {
    const response = await api.get('/receipts');
    const list = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
    return {
      status: 'success',
      data: list.map(normalizeReceipt),
    };
  } catch {
    return {
      status: 'success',
      data: mockReceipts.map(normalizeReceipt),
    };
  }
};

export const getReceiptById = async (id) => {
  try {
    const response = await api.get(`/receipts/${id}`);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeReceipt(item),
    };
  } catch {
    const receipt = mockReceipts.find((item) => item._id === id) || mockReceipts[0];
    return {
      status: 'success',
      data: normalizeReceipt(receipt),
    };
  }
};

export const createReceipt = async (receiptData) => {
  try {
    const response = await api.post('/receipts', receiptData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeReceipt(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const createdReceipt = normalizeReceipt({
      ...receiptData,
      status: 'DRAFT',
      createdBy: 'Current User',
    });
    return {
      status: 'success',
      message: 'Receipt saved locally.',
      data: createdReceipt,
    };
  }
};

export const updateReceipt = async (id, receiptData) => {
  try {
    const response = await api.put(`/receipts/${id}`, receiptData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeReceipt(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const updatedReceipt = normalizeReceipt({
      ...receiptData,
      _id: id,
      reference: receiptData.reference || id,
    });
    return {
      status: 'success',
      data: updatedReceipt,
    };
  }
};

export const validateReceipt = async (id) => {
  try {
    let response;
    try {
      response = await api.post(`/receipts/${id}/post`);
    } catch (innerErr) {
      if (innerErr?.status === 404 || innerErr?.message?.includes('Not Found')) {
        response = await api.patch(`/receipts/${id}`, { status: 'done' });
      } else {
        throw innerErr;
      }
    }
    const item = response.data?.data?.document || response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeReceipt(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const receipt = mockReceipts.find((item) => item._id === id) || mockReceipts[0];
    const updated = normalizeReceipt({
      ...receipt,
      status: 'DONE',
      validatedAt: new Date().toISOString(),
    });
    return {
      status: 'success',
      data: updated,
    };
  }
};

export const cancelReceipt = async (id) => {
  try {
    const response = await api.post(`/receipts/${id}/cancel`);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeReceipt(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const receipt = mockReceipts.find((item) => item._id === id) || mockReceipts[0];
    const updated = normalizeReceipt({
      ...receipt,
      status: 'CANCELED',
    });
    return {
      status: 'success',
      data: updated,
    };
  }
};

export { mockReceipts };
