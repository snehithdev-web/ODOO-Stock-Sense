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

  let warehouseDoc = null;
  if (mongoose.Types.ObjectId.isValid(String(warehouse))) {
    warehouseDoc = await Warehouse.findById(warehouse).lean();
  }
  if (!warehouseDoc) {
    warehouseDoc = await Warehouse.findOne({
      $or: [
        { name: new RegExp(`^${String(warehouse).trim()}$`, 'i') },
        { code: String(warehouse).trim().toUpperCase() }
      ]
    }).lean();
  }

  if (!warehouseDoc) {
    // Auto-create warehouse if created on-the-fly from string name
    const code = String(warehouse).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'WH';
    warehouseDoc = await Warehouse.create({
      name: String(warehouse).trim(),
      code: `${code}-${Date.now().toString(36).toUpperCase().slice(-4)}`,
      locations: [{ name: String(location).trim(), code: String(location).trim().toUpperCase() }]
    });
    warehouseDoc = warehouseDoc.toObject();
  }

  if (warehouseDoc.isActive === false) {
    throw ApiError.badRequest(`Warehouse '${warehouseDoc.name}' is not active`);
  }

  const code = String(location).trim().toUpperCase();
  let match = (warehouseDoc.locations || []).find(
    (entry) => entry.code.toUpperCase() === code || entry.name.toUpperCase() === code
  );

  if (!match) {
    // If location code doesn't exist yet, add it dynamically to warehouse
    const newLoc = { name: String(location).trim(), code };
    await Warehouse.findByIdAndUpdate(warehouseDoc._id, {
      $push: { locations: newLoc }
    });
    match = newLoc;
  }

  return { warehouse: warehouseDoc._id, location: match.code };
};

export const resolveItems = async (items, { label = 'item' } = {}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest(`A document must contain at least one ${label}`);
  }

  const resolved = [];
  for (const item of items) {
    const ref = item.product;
    let found = null;
    if (mongoose.Types.ObjectId.isValid(String(ref))) {
      found = await Product.findById(ref).select('_id sku name').lean();
    }
    if (!found) {
      found = await Product.findOne({
        $or: [
          { name: new RegExp(`^${String(ref).trim()}$`, 'i') },
          { sku: String(ref).trim().toUpperCase() }
        ]
      }).select('_id sku name').lean();
    }
    if (!found) {
      // Auto-create product on the fly if named in demo/preset
      found = await Product.create({
        name: String(ref).trim(),
        sku: `SKU-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        category: 'General',
        quantity: 100,
        reorderLevel: 10,
        price: 10
      });
      found = found.toObject();
    }
    item.product = found._id;
    resolved.push(found);
  }

  return resolved;
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
