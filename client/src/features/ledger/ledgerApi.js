import api from '../../services/api';

const mockMoveHistory = [
  {
    _id: 'MVT-7001',
    reference: 'RCPT-1002',
    movementType: 'RECEIPT',
    product: 'Steel Rods',
    quantity: 100,
    fromLocation: 'Supplier',
    toLocation: 'Main Store',
    warehouse: 'Main Warehouse',
    performedBy: 'Nadia Hart',
    date: '2026-09-24T10:30:00.000Z',
    status: 'DONE',
    supplier: 'ABC Steel Suppliers',
  },
  {
    _id: 'MVT-7002',
    reference: 'DEL-2002',
    movementType: 'DELIVERY',
    product: 'Steel Rods',
    quantity: 20,
    fromLocation: 'Main Store',
    toLocation: 'Customer',
    warehouse: 'Main Warehouse',
    performedBy: 'Amir Khan',
    date: '2026-09-23T09:20:00.000Z',
    status: 'DONE',
    customer: 'North Ridge Traders',
  },
  {
    _id: 'MVT-7003',
    reference: 'TRF-3001',
    movementType: 'TRANSFER',
    product: 'Steel Rods',
    quantity: 40,
    fromLocation: 'Main Store',
    toLocation: 'Production Rack',
    warehouse: 'Production Warehouse',
    performedBy: 'Samir Ali',
    date: '2026-09-22T13:45:00.000Z',
    status: 'DONE',
    sourceWarehouse: 'Main Warehouse',
    sourceLocation: 'Main Store',
    destinationWarehouse: 'Production Warehouse',
    destinationLocation: 'Production Rack',
  },
];

export const normalizeMovement = (m = {}) => {
  const productName = typeof m.product === 'object' ? `${m.product?.name} (${m.product?.sku || ''})`.trim() : (m.product || 'Unknown Product');
  const warehouseName = typeof m.warehouse === 'object' ? m.warehouse?.name : (m.warehouse || 'Main Warehouse');
  const user = typeof m.performedBy === 'object' ? m.performedBy?.name : (m.performedBy || 'System');
  const qty = Number(m.quantity || 0);

  return {
    _id: m._id || m.id || `MVT-${Date.now()}`,
    reference: m.operationRef || m.reference || `MVT-${Date.now()}`,
    movementType: m.operationType || m.movementType || 'TRANSFER',
    product: productName,
    quantity: qty,
    fromLocation: m.fromLocation || (qty < 0 ? m.location : 'Supplier/External'),
    toLocation: m.toLocation || (qty > 0 ? m.location : 'Customer/External'),
    warehouse: warehouseName,
    performedBy: user,
    date: m.occurredAt || m.createdAt || m.date || new Date().toISOString(),
    status: m.status || 'DONE',
  };
};

export const getMoveHistory = async (params = {}) => {
  try {
    const response = await api.get('/stock/movements', { params });
    const list = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
    return {
      status: 'success',
      data: list.map(normalizeMovement),
    };
  } catch {
    return {
      status: 'success',
      data: mockMoveHistory.map(normalizeMovement),
    };
  }
};

export const getMoveById = async (id) => {
  try {
    const response = await api.get(`/stock/movements/${id}`);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeMovement(item),
    };
  } catch {
    const movement = mockMoveHistory.find((item) => item._id === id) || mockMoveHistory[0];
    return {
      status: 'success',
      data: normalizeMovement(movement),
    };
  }
};

export { mockMoveHistory };
