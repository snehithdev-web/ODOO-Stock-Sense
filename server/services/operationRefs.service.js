import mongoose from 'mongoose';
import Warehouse from '../models/warehouse.model.js';
import Product from '../models/product.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Validation shared by every operational document.
 *
 * The schemas check shape (a location code is present, a quantity is positive)
 * but cannot check that a location code actually exists inside the warehouse it
 * is paired with, or that the referenced products are real. Those mistakes are
 * cheap to make and expensive to discover later, because a receipt into a
 * misspelled location writes a balance for a place that does not exist.
 */

const isDuplicateKeyError = (error) => error?.code === 11000;

/**
 * Confirms a warehouse exists, is active, and contains an active location code.
 *
 * Codes are matched case-insensitively and stored uppercase, because they are
 * typed by hand on forms and "main-store" must resolve to "MAIN-STORE".
 */
export const resolveLocation = async ({ warehouse, location, label = 'location' }) => {
  if (!warehouse) {
    throw ApiError.badRequest('A warehouse is required');
  }

  if (!location) {
    throw ApiError.badRequest(`A ${label} code is required`);
  }

  const warehouseDoc = await Warehouse.findById(warehouse).lean();

  if (!warehouseDoc) {
    throw ApiError.badRequest(`Warehouse '${warehouse}' does not exist`);
  }

  if (!warehouseDoc.isActive) {
    throw ApiError.badRequest(`Warehouse '${warehouseDoc.name}' is not active`);
  }

  const code = String(location).trim().toUpperCase();
  const match = (warehouseDoc.locations || []).find(
    (entry) => entry.code.toUpperCase() === code
  );

  if (!match) {
    const available = (warehouseDoc.locations || [])
      .filter((entry) => entry.isActive)
      .map((entry) => entry.code);

    throw ApiError.badRequest(
      available.length > 0
        ? `'${code}' is not a location in ${warehouseDoc.name}. Available: ${available.join(', ')}.`
        : `${warehouseDoc.name} has no locations yet. Add one before using it on a document.`
    );
  }

  if (!match.isActive) {
    throw ApiError.badRequest(`Location '${code}' in ${warehouseDoc.name} is not active`);
  }

  return { warehouse: warehouseDoc._id, location: match.code };
};

/**
 * Confirms every referenced product exists, and returns the ids in the order the
 * caller supplied them.
 *
 * Duplicates are reported rather than merged. A document listing the same
 * product twice is almost always a data entry mistake, and silently summing the
 * lines would hide it.
 */
export const resolveItems = async (items, { label = 'item' } = {}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest(`A document must contain at least one ${label}`);
  }

  const ids = items.map((item) => item.product);
  const unique = [...new Set(ids.map((id) => String(id)))];

  if (unique.length !== ids.length) {
    throw ApiError.badRequest(
      `The same product is listed more than once. Combine the lines into a single quantity.`
    );
  }

  let found;
  try {
    found = await Product.find({ _id: { $in: unique } }).select('_id sku name').lean();
  } catch {
    // An id that is not a valid ObjectId, e.g. a client sending "abc".
    throw ApiError.badRequest('One or more item product references are not valid');
  }

  if (found.length !== unique.length) {
    const known = new Set(found.map((p) => String(p._id)));
    const missing = unique.filter((id) => !known.has(id));
    throw ApiError.badRequest(`Unknown product id(s): ${missing.join(', ')}`);
  }

  return found;
};

/**
 * Reports whether an error is a duplicate key violation, so callers can tell a
 * reference collision (retryable) from other write failures.
 */
export { isDuplicateKeyError };

/**
 * Parses an ObjectId from a path parameter, rejecting malformed values with a
 * 400 instead of letting them reach the driver and surface as a cast error.
 */
export const parseObjectId = (value, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(String(value))) {
    throw ApiError.badRequest(`Invalid ${label} '${value}'`);
  }
  return new mongoose.Types.ObjectId(String(value));
};
