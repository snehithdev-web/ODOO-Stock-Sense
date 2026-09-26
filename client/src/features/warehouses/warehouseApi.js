import api from '../../services/api';

/**
 * Warehouses and their locations.
 *
 * The API serves reads to any signed in user and writes to an inventory
 * manager; a staff user receives a 403 from these calls, which is the intended
 * behaviour rather than something to work around.
 *
 * A previous version of this file caught every error and returned demo
 * warehouses, so a failed request produced a plausible looking list of
 * locations that did not exist in the database. Documents pick a warehouse and
 * location from these values, so silently substituting them would have produced
 * documents pointing at places that were never set up.
 *
 * There is no update-location endpoint: a location code is the join key used by
 * documents and ledger entries, so it is created once and not edited in place.
 */

const listOf = (payload) => (Array.isArray(payload) ? payload : []);

export const getWarehouses = async () => {
  const response = await api.get('/warehouses');

  return { ...response.data, data: listOf(response.data?.data) };
};

export const getWarehouseById = async (id) => {
  const response = await api.get(`/warehouses/${id}`);

  return response.data;
};

export const createWarehouse = (warehouseData) => api.post('/warehouses', warehouseData);

export const updateWarehouse = (id, warehouseData) =>
  api.put(`/warehouses/${id}`, warehouseData);

export const addLocation = (warehouseId, locationData) =>
  api.post(`/warehouses/${warehouseId}/locations`, locationData);
