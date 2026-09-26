import {
  listWarehouses,
  getWarehouseById as fetchWarehouseById,
  createWarehouse,
  updateWarehouse,
  addLocationToWarehouse
} from '../services/warehouse.service.js';
import { buildPagination, parseBooleanFlag } from '../utils/query.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Controllers for warehouse and location management.
 *
 * Reads require any authenticated user; the mutating routes are restricted to
 * inventory_manager by the router. See routes/warehouse.routes.js.
 */

// @desc    List warehouses with their locations
// @route   GET /api/warehouses
// @access  Protected
export const getWarehouses = async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const { warehouses, pagination } = await listWarehouses({
      page,
      limit,
      skip,
      isActive: parseBooleanFlag(req.query.isActive)
    });

    return sendSuccess(res, {
      message: 'Warehouses retrieved successfully',
      data: warehouses,
      pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single warehouse
// @route   GET /api/warehouses/:id
// @access  Protected
export const getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await fetchWarehouseById(req.params.id);

    return sendSuccess(res, {
      message: 'Warehouse retrieved successfully',
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new warehouse
// @route   POST /api/warehouses
// @access  Inventory manager
export const createNewWarehouse = async (req, res, next) => {
  try {
    const { name, code, address, locations } = req.body;

    const warehouse = await createWarehouse({ name, code, address, locations });

    return sendSuccess(res, {
      message: 'Warehouse created successfully',
      statusCode: 201,
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a location or rack to an existing warehouse
// @route   POST /api/warehouses/:id/locations
// @access  Inventory manager
export const addLocation = async (req, res, next) => {
  try {
    const { name, code } = req.body;

    const warehouse = await addLocationToWarehouse(req.params.id, { name, code });

    return sendSuccess(res, {
      message: 'Location added successfully',
      statusCode: 201,
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rename a warehouse or change its address
// @route   PUT /api/warehouses/:id
// @access  Inventory manager
export const updateWarehouseDetails = async (req, res, next) => {
  try {
    const { name, code, address } = req.body;

    const warehouse = await updateWarehouse(req.params.id, { name, code, address });

    return sendSuccess(res, {
      message: 'Warehouse updated successfully',
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
};
