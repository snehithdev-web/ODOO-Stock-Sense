import api from '../../services/api';

const mockWarehouses = [
  {
    _id: 'WH-01',
    name: 'Main Warehouse',
    code: 'MW-01',
    status: 'ACTIVE',
    locations: [
      { _id: 'LOC-01', name: 'Main Store', code: 'MS-01' },
      { _id: 'LOC-02', name: 'Rack A', code: 'RA-01' },
      { _id: 'LOC-03', name: 'Rack B', code: 'RB-01' },
    ],
  },
  {
    _id: 'WH-02',
    name: 'Production Warehouse',
    code: 'PW-01',
    status: 'ACTIVE',
    locations: [
      { _id: 'LOC-04', name: 'Production Rack', code: 'PR-01' },
      { _id: 'LOC-05', name: 'Finished Goods', code: 'FG-01' },
    ],
  },
  {
    _id: 'WH-03',
    name: 'North Hub',
    code: 'NH-01',
    status: 'ACTIVE',
    locations: [{ _id: 'LOC-06', name: 'Receiving Bay A', code: 'RBA-01' }],
  },
];

const normalizeWarehouse = (warehouse = {}) => ({
  _id: warehouse._id || warehouse.id || `WH-${Date.now()}`,
  name: warehouse.name || '',
  code: warehouse.code || '',
  status: warehouse.status || 'ACTIVE',
  locations: Array.isArray(warehouse.locations)
    ? warehouse.locations.map((location) => ({
        _id: location._id || location.id || `LOC-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        name: location.name || '',
        code: location.code || '',
      }))
    : [],
});

const createLocalWarehouse = (warehouseData) => {
  const newWarehouse = {
    _id: warehouseData._id || `WH-${Date.now()}`,
    name: warehouseData.name,
    code: warehouseData.code,
    status: warehouseData.status || 'ACTIVE',
    locations: (warehouseData.locations || []).map((location) => ({
      _id: location._id || `LOC-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      name: location.name,
      code: location.code,
    })),
  };

  return normalizeWarehouse(newWarehouse);
};

export const getWarehouses = async () => {
  try {
    const response = await api.get('/warehouses');
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Using local warehouse data until the backend endpoint is available.',
      data: mockWarehouses,
    };
  }
};

export const getWarehouseById = async (id) => {
  try {
    const response = await api.get(`/warehouses/${id}`);
    return response.data;
  } catch {
    const warehouse = mockWarehouses.find((item) => item._id === id) || mockWarehouses[0];
    return {
      status: 'success',
      message: 'Loaded warehouse from local demo data.',
      data: warehouse,
    };
  }
};

export const createWarehouse = async (warehouseData) => {
  try {
    const response = await api.post('/warehouses', warehouseData);
    return response.data;
  } catch {
    const createdWarehouse = createLocalWarehouse({
      ...warehouseData,
      status: 'ACTIVE',
    });

    return {
      status: 'success',
      message: 'Warehouse saved locally in the frontend demo state.',
      data: createdWarehouse,
    };
  }
};

export const updateWarehouse = async (id, warehouseData) => {
  try {
    const response = await api.put(`/warehouses/${id}`, warehouseData);
    return response.data;
  } catch {
    const updatedWarehouse = normalizeWarehouse({
      ...warehouseData,
      _id: id,
    });

    return {
      status: 'success',
      message: 'Warehouse updated locally in the frontend demo state.',
      data: updatedWarehouse,
    };
  }
};

export const addLocation = async (warehouseId, locationData) => {
  try {
    const response = await api.post(`/warehouses/${warehouseId}/locations`, locationData);
    return response.data;
  } catch {
    const warehouse = mockWarehouses.find((item) => item._id === warehouseId) || mockWarehouses[0];
    const createdLocation = {
      _id: locationData._id || `LOC-${Date.now()}`,
      name: locationData.name,
      code: locationData.code,
    };

    return {
      status: 'success',
      message: 'Location added locally in the frontend demo state.',
      data: { ...warehouse, locations: [...warehouse.locations, createdLocation] },
    };
  }
};

export const updateLocation = async (warehouseId, locationId, locationData) => {
  try {
    const response = await api.put(`/warehouses/${warehouseId}/locations/${locationId}`, locationData);
    return response.data;
  } catch {
    const warehouse = mockWarehouses.find((item) => item._id === warehouseId) || mockWarehouses[0];
    const updatedLocations = (warehouse.locations || []).map((location) =>
      location._id === locationId ? { ...location, ...locationData } : location
    );

    return {
      status: 'success',
      message: 'Location updated locally in the frontend demo state.',
      data: { ...warehouse, locations: updatedLocations },
    };
  }
};

export { mockWarehouses };
