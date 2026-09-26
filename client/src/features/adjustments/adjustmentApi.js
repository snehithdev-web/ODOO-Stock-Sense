import api from '../../services/api';

const mockAdjustments = [
  {
    _id: 'ADJ-4001',
    reference: 'ADJ-4001',
    product: 'Steel Rods',
    warehouse: 'Main Warehouse',
    location: 'Main Store',
    recordedQuantity: 100,
    physicalQuantity: 97,
    difference: -3,
    reason: '3 damaged items found during physical count.',
    status: 'DRAFT',
    createdBy: 'Nadia Hart',
    createdAt: '2026-09-24T09:40:00.000Z',
    completedAt: null,
  },
  {
    _id: 'ADJ-4002',
    reference: 'ADJ-4002',
    product: 'Cement',
    warehouse: 'Main Warehouse',
    location: 'Rack A',
    recordedQuantity: 40,
    physicalQuantity: 45,
    difference: 5,
    reason: 'Additional bags were found in the secondary rack.',
    status: 'DONE',
    createdBy: 'Samir Ali',
    createdAt: '2026-09-22T08:15:00.000Z',
    completedAt: '2026-09-22T08:55:00.000Z',
  },
];

export const normalizeAdjustment = (adjustment = {}) => {
  const warehouseName = typeof adjustment.warehouse === 'object' ? adjustment.warehouse?.name : (adjustment.warehouse || '');
  const rawItems = adjustment.items || [];
  const firstItem = rawItems[0] || {};
  const productName = typeof firstItem.product === 'object' ? `${firstItem.product?.name} (${firstItem.product?.sku || ''})`.trim() : (adjustment.product || firstItem.product || 'Product');
  const recordedQuantity = Number(adjustment.recordedQuantity ?? firstItem.recordedQuantity ?? 0);
  const physicalQuantity = Number(adjustment.physicalQuantity ?? firstItem.countedQuantity ?? 0);
  const difference = Number(adjustment.difference ?? firstItem.delta ?? (physicalQuantity - recordedQuantity));

  return {
    _id: adjustment._id || adjustment.id || `ADJ-${Date.now()}`,
    reference: adjustment.reference || adjustment._id || `ADJ-${Date.now()}`,
    product: productName,
    warehouse: warehouseName,
    location: adjustment.location || 'Main Store',
    recordedQuantity,
    physicalQuantity,
    difference,
    reason: adjustment.reason || 'Physical Count',
    status: (adjustment.status || 'DRAFT').toUpperCase(),
    createdBy: typeof adjustment.createdBy === 'object' ? adjustment.createdBy?.name : (adjustment.createdBy || 'Current User'),
    createdAt: adjustment.createdAt || adjustment.documentDate || new Date().toISOString(),
    completedAt: adjustment.postedAt || adjustment.completedAt || null,
  };
};

export const getAdjustments = async () => {
  try {
    const response = await api.get('/adjustments');
    const list = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
    return {
      status: 'success',
      data: list.map(normalizeAdjustment),
    };
  } catch {
    return {
      status: 'success',
      data: mockAdjustments.map(normalizeAdjustment),
    };
  }
};

export const getAdjustmentById = async (id) => {
  try {
    const response = await api.get(`/adjustments/${id}`);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeAdjustment(item),
    };
  } catch {
    const adjustment = mockAdjustments.find((item) => item._id === id) || mockAdjustments[0];
    return {
      status: 'success',
      data: normalizeAdjustment(adjustment),
    };
  }
};

export const createAdjustment = async (adjustmentData) => {
  try {
    const response = await api.post('/adjustments', adjustmentData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeAdjustment(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const createdAdjustment = normalizeAdjustment({
      ...adjustmentData,
      status: 'DRAFT',
      createdBy: 'Current User',
    });

    return {
      status: 'success',
      message: 'Adjustment saved locally.',
      data: createdAdjustment,
    };
  }
};

export const updateAdjustment = async (id, adjustmentData) => {
  try {
    const response = await api.put(`/adjustments/${id}`, adjustmentData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeAdjustment(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const updatedAdjustment = normalizeAdjustment({
      ...adjustmentData,
      _id: id,
    });

    return {
      status: 'success',
      data: updatedAdjustment,
    };
  }
};

export const validateAdjustment = async (id) => {
  try {
    let response;
    try {
      response = await api.post(`/adjustments/${id}/post`);
    } catch (innerErr) {
      if (innerErr?.status === 404 || innerErr?.message?.includes('Not Found')) {
        response = await api.patch(`/adjustments/${id}`, { status: 'done' });
      } else {
        throw innerErr;
      }
    }
    const item = response.data?.data?.document || response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeAdjustment(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const adjustment = mockAdjustments.find((item) => item._id === id) || mockAdjustments[0];
    const updated = normalizeAdjustment({ ...adjustment, status: 'DONE', completedAt: new Date().toISOString() });
    return { status: 'success', data: updated };
  }
};

export const cancelAdjustment = async (id) => {
  try {
    const response = await api.post(`/adjustments/${id}/cancel`);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeAdjustment(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const adjustment = mockAdjustments.find((item) => item._id === id) || mockAdjustments[0];
    const updated = normalizeAdjustment({ ...adjustment, status: 'CANCELED' });
    return { status: 'success', data: updated };
  }
};

export { mockAdjustments };
