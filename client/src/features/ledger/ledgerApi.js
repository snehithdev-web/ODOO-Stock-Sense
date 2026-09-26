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
  {
    _id: 'MVT-7004',
    reference: 'ADJ-4001',
    movementType: 'ADJUSTMENT',
    product: 'Steel Rods',
    quantity: -3,
    fromLocation: 'Main Store',
    toLocation: 'Adjustment',
    warehouse: 'Main Warehouse',
    performedBy: 'Nadia Hart',
    date: '2026-09-21T15:10:00.000Z',
    status: 'CANCELED',
    recordedQuantity: 100,
    physicalQuantity: 97,
    difference: -3,
    reason: '3 damaged items found during physical count.',
  },
];

export const getMoveHistory = async (params = {}) => {
  try {
    const response = await api.get('/move-history', { params });
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Using local movement history until the backend endpoint is available.',
      data: mockMoveHistory,
    };
  }
};

export const getMoveById = async (id) => {
  try {
    const response = await api.get(`/move-history/${id}`);
    return response.data;
  } catch {
    const movement = mockMoveHistory.find((item) => item._id === id) || mockMoveHistory[0];
    return {
      status: 'success',
      message: 'Loaded movement from local demo data.',
      data: movement,
    };
  }
};

export { mockMoveHistory };
