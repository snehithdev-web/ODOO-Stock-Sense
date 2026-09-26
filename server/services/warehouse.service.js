import Warehouse from '../models/warehouse.model.js';
import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta } from '../utils/query.js';

const DUPLICATE_KEY_ERROR = 11000;

const isDuplicateKeyError = (error) => error?.code === DUPLICATE_KEY_ERROR;

/**
 * Service for warehouse and location setup. Every failure is raised as an
 * ApiError so the controller only has to pass errors to next().
 */

export const listWarehouses = async ({ page, limit, skip, isActive }) => {
  const filter = isActive === undefined ? {} : { isActive };

  const [warehouses, total] = await Promise.all([
    Warehouse.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Warehouse.countDocuments(filter)
  ]);

  return {
    warehouses,
    pagination: buildPaginationMeta({ page, limit, total })
  };
};

export const getWarehouseById = async (id) => {
  const warehouse = await Warehouse.findById(id);

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  return warehouse;
};

export const createWarehouse = async ({ name, code, address, locations }) => {
  const existing = await Warehouse.findOne({ $or: [{ name }, { code }] });

  if (existing) {
    throw ApiError.conflict('Warehouse with this name or code already exists');
  }

  try {
    return await Warehouse.create({
      name,
      code,
      address,
      locations: locations || []
    });
  } catch (error) {
    // The unique indexes on name and code are the real guarantee; this pre-check
    // only produces a friendlier message in the common case.
    if (isDuplicateKeyError(error)) {
      throw ApiError.conflict('Warehouse with this name or code already exists');
    }
    throw error;
  }
};

export const addLocationToWarehouse = async (warehouseId, { name, code }) => {
  const warehouse = await getWarehouseById(warehouseId);

  const normalizedCode = String(code || '').trim().toUpperCase();

  const codeExists = warehouse.locations.some(
    (location) => location.code.toUpperCase() === normalizedCode
  );

  if (codeExists) {
    throw ApiError.conflict(`Location code '${normalizedCode}' already exists in this warehouse`);
  }

  warehouse.locations.push({ name, code });
  await warehouse.save();

  return warehouse;
};
