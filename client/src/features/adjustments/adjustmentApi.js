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
  {
    _id: 'ADJ-4003',
    reference: 'ADJ-4003',
    product: 'Paint',
    warehouse: 'Production Warehouse',
    location: 'Production Rack',
    recordedQuantity: 12,
    physicalQuantity: 8,
    difference: -4,
    reason: 'Inventory count showed shortage after the last shipment.',
    status: 'CANCELED',
    createdBy: 'Lina Gomez',
    createdAt: '2026-09-21T16:55:00.000Z',
    completedAt: null,
  },
];

const normalizeAdjustment = (adjustment = {}) => {
  const recordedQuantity = Number(adjustment.recordedQuantity ?? 0);
  const physicalQuantity = Number(adjustment.physicalQuantity ?? 0);
  const difference = physicalQuantity - recordedQuantity;

  return {
    _id: adjustment._id || adjustment.id || `ADJ-${Date.now()}`,
    reference: adjustment.reference || adjustment._id || `ADJ-${Date.now()}`,
    product: adjustment.product || '',
    warehouse: adjustment.warehouse || '',
    location: adjustment.location || '',
    recordedQuantity: Number.isFinite(recordedQuantity) ? recordedQuantity : 0,
    physicalQuantity: Number.isFinite(physicalQuantity) ? physicalQuantity : 0,
    difference,
    reason: adjustment.reason || '',
    status: adjustment.status || 'DRAFT',
    createdBy: adjustment.createdBy || 'Current User',
    createdAt: adjustment.createdAt || new Date().toISOString(),
    completedAt: adjustment.completedAt || null,
  };
};

const createLocalAdjustment = (adjustmentData) => {
  const currentDate = new Date().toISOString();
  const newAdjustment = {
    _id: adjustmentData._id || `ADJ-${Date.now()}`,
    reference: adjustmentData.reference || `ADJ-${Date.now()}`,
    product: adjustmentData.product,
    warehouse: adjustmentData.warehouse,
    location: adjustmentData.location,
    recordedQuantity: Number(adjustmentData.recordedQuantity) || 0,
    physicalQuantity: Number(adjustmentData.physicalQuantity) || 0,
    reason: adjustmentData.reason,
    status: adjustmentData.status || 'DRAFT',
    createdBy: adjustmentData.createdBy || 'Current User',
    createdAt: adjustmentData.createdAt || currentDate,
    completedAt: adjustmentData.completedAt || null,
  };

  return normalizeAdjustment(newAdjustment);
};

export const getAdjustments = async () => {
  try {
    const response = await api.get('/adjustments');
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Using local adjustment data until the backend endpoint is available.',
      data: mockAdjustments,
    };
  }
};

export const getAdjustmentById = async (id) => {
  try {
    const response = await api.get(`/adjustments/${id}`);
    return response.data;
  } catch {
    const adjustment = mockAdjustments.find((item) => item._id === id) || mockAdjustments[0];
    return {
      status: 'success',
      message: 'Loaded adjustment from local demo data.',
      data: adjustment,
    };
  }
};

export const createAdjustment = async (adjustmentData) => {
  try {
    const response = await api.post('/adjustments', adjustmentData);
    return response.data;
  } catch {
    const createdAdjustment = createLocalAdjustment({
      ...adjustmentData,
      status: 'DRAFT',
      createdBy: 'Current User',
    });

    return {
      status: 'success',
      message: 'Adjustment saved locally in the frontend demo state.',
      data: createdAdjustment,
    };
  }
};

export const updateAdjustment = async (id, adjustmentData) => {
  try {
    const response = await api.put(`/adjustments/${id}`, adjustmentData);
    return response.data;
  } catch {
    const updatedAdjustment = normalizeAdjustment({
      ...adjustmentData,
      _id: id,
      reference: adjustmentData.reference || id,
      createdAt: adjustmentData.createdAt || new Date().toISOString(),
    });

    return {
      status: 'success',
      message: 'Adjustment updated locally in the frontend demo state.',
      data: updatedAdjustment,
    };
  }
};

export const validateAdjustment = async (id) => {
  try {
    const response = await api.patch(`/adjustments/${id}/validate`);
    return response.data;
  } catch {
    const adjustment = mockAdjustments.find((item) => item._id === id) || mockAdjustments[0];
    const updated = normalizeAdjustment({
      ...adjustment,
      status: 'DONE',
      completedAt: new Date().toISOString(),
    });

    return {
      status: 'success',
      message: 'Adjustment applied locally in the frontend demo state.',
      data: updated,
    };
  }
};

export const cancelAdjustment = async (id) => {
  try {
    const response = await api.patch(`/adjustments/${id}/cancel`);
    return response.data;
  } catch {
    const adjustment = mockAdjustments.find((item) => item._id === id) || mockAdjustments[0];
    const updated = normalizeAdjustment({
      ...adjustment,
      status: 'CANCELED',
      completedAt: adjustment.completedAt || null,
    });

    return {
      status: 'success',
      message: 'Adjustment canceled locally in the frontend demo state.',
      data: updated,
    };
  }
};

export { mockAdjustments };
