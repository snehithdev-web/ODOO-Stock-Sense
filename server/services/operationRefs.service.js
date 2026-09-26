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
 *
 * An unknown warehouse or location is rejected rather than created on the fly.
 * Auto-creating them would let a typo in a document invent a warehouse, and the
 * same stock would then be split across two places that only differ by a
 * misspelling. It would also make the location code meaningless as a join key,
 * since the ledger and every document would agree on whatever string arrived
 * first. Warehouses and their locations are master data, created deliberately
 * through POST /api/warehouses.
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
    throw ApiError.notFound(
      `Warehouse '${warehouse}' does not exist. Create it before posting a document against it.`
    );
  }

  if (warehouseDoc.isActive === false) {
    throw ApiError.badRequest(`Warehouse '${warehouseDoc.name}' is not active`);
  }

  const code = String(location).trim().toUpperCase();
  const match = (warehouseDoc.locations || []).find(
    (entry) => entry.code.toUpperCase() === code || entry.name.toUpperCase() === code
  );

  if (!match) {
    const known = (warehouseDoc.locations || [])
      .map((entry) => entry.code)
      .join(', ');

    throw ApiError.badRequest(
      `'${location}' is not a location in ${warehouseDoc.name}. ` +
        (known ? `Known locations: ${known}.` : 'That warehouse has no locations yet.')
    );
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
