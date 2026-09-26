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

export const normalizeWarehouse = (warehouse = {}) => ({
  _id: warehouse._id || warehouse.id || `WH-${Date.now()}`,
  name: warehouse.name || '',
  code: warehouse.code || '',
  status: warehouse.isActive === false ? 'INACTIVE' : (warehouse.status || 'ACTIVE'),
  locations: Array.isArray(warehouse.locations)
    ? warehouse.locations.map((location) => ({
        _id: location._id || location.id || location.code || `LOC-${Date.now()}`,
        name: location.name || '',
        code: location.code || '',
      }))
    : [],
});

export const getWarehouses = async () => {
  try {
    const response = await api.get('/warehouses');
    const list = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
    return {
      status: 'success',
      data: list.map(normalizeWarehouse),
    };
  } catch {
    return {
      status: 'success',
      data: mockWarehouses.map(normalizeWarehouse),
    };
  }
};

export const getWarehouseById = async (id) => {
  try {
    const response = await api.get(`/warehouses/${id}`);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeWarehouse(item),
    };
  } catch {
    const warehouse = mockWarehouses.find((item) => item._id === id) || mockWarehouses[0];
    return {
      status: 'success',
      data: normalizeWarehouse(warehouse),
    };
  }
};

export const createWarehouse = async (warehouseData) => {
  try {
    const response = await api.post('/warehouses', warehouseData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeWarehouse(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const createdWarehouse = normalizeWarehouse({
      ...warehouseData,
      status: 'ACTIVE',
    });

    return {
      status: 'success',
      message: 'Warehouse saved locally.',
      data: createdWarehouse,
    };
  }
};

export const updateWarehouse = async (id, warehouseData) => {
  try {
    const response = await api.put(`/warehouses/${id}`, warehouseData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeWarehouse(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const updatedWarehouse = normalizeWarehouse({
      ...warehouseData,
      _id: id,
    });

    return {
      status: 'success',
      data: updatedWarehouse,
    };
  }
};

export const addLocation = async (warehouseId, locationData) => {
  try {
    const response = await api.post(`/warehouses/${warehouseId}/locations`, locationData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeWarehouse(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const warehouse = mockWarehouses.find((item) => item._id === warehouseId) || mockWarehouses[0];
    const createdLocation = {
      _id: locationData._id || `LOC-${Date.now()}`,
      name: locationData.name,
      code: locationData.code,
    };

    return {
      status: 'success',
      data: normalizeWarehouse({ ...warehouse, locations: [...warehouse.locations, createdLocation] }),
    };
  }
};

export const updateLocation = async (warehouseId, locationId, locationData) => {
  try {
    const response = await api.put(`/warehouses/${warehouseId}/locations/${locationId}`, locationData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeWarehouse(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const warehouse = mockWarehouses.find((item) => item._id === warehouseId) || mockWarehouses[0];
    const updatedLocations = (warehouse.locations || []).map((location) =>
      location._id === locationId || location.code === locationId ? { ...location, ...locationData } : location
    );

    return {
      status: 'success',
      data: normalizeWarehouse({ ...warehouse, locations: updatedLocations }),
    };
  }
};

export { mockWarehouses };
