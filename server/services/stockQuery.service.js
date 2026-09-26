import StockLedger from '../models/stockLedger.model.js';
import Product from '../models/product.model.js';
import { getProductLocations, reconcileProductTotals, getBalance } from './stock.service.js';
import ApiError from '../utils/ApiError.js';
import {
  buildPagination,
  buildPaginationMeta,
  parseEnumParam,
  exactMatch
} from '../utils/query.js';
import { OPERATION_TYPE_VALUES } from '../utils/enums.js';
import { parseObjectId } from './operationRefs.service.js';

/**
 * Reads over the stock ledger, plus the one repair action.
 *
 * The ledger is append only, so nothing here writes to it. The single mutation
 * is reconciliation, which rewrites the Product.quantity cache back to what the
 * ledger says.
 */

/**
 * Move History: every stock movement, newest first, with the product and
 * warehouse resolved so the client can render a row without extra lookups.
 */
export const listMovements = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  const operationType = parseEnumParam(query.operationType, OPERATION_TYPE_VALUES, 'operationType');
  if (operationType) filter.operationType = operationType;

  if (query.product) filter.product = parseObjectId(query.product, 'product id');
  if (query.warehouse) filter.warehouse = parseObjectId(query.warehouse, 'warehouse id');
  if (query.location) filter.location = exactMatch(query.location);

  if (query.operationRef) filter.operationRef = exactMatch(query.operationRef);

  if (query.fromDate || query.toDate) {
    filter.occurredAt = {};
    if (query.fromDate) {
      const from = new Date(query.fromDate);
      if (Number.isNaN(from.getTime())) throw ApiError.badRequest('fromDate is not a valid date');
      filter.occurredAt.$gte = from;
    }
    if (query.toDate) {
      const to = new Date(query.toDate);
      if (Number.isNaN(to.getTime())) throw ApiError.badRequest('toDate is not a valid date');
      filter.occurredAt.$lte = to;
    }
  }

  const [movements, total] = await Promise.all([
    StockLedger.find(filter)
      .sort({ occurredAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name sku unit')
      .populate('warehouse', 'name code')
      .populate('performedBy', 'name role')
      .lean(),
    StockLedger.countDocuments(filter)
  ]);

  return { movements, pagination: buildPaginationMeta({ page, limit, total }) };
};

/**
 * Where a single product is held, with the balance at each place.
 */
export const getStockByLocation = async (productId) => {
  const product = await Product.findById(productId)
    .select('name sku unit quantity reorderLevel')
    .lean();

  if (!product) throw ApiError.notFound('Product not found');

  const locations = await getProductLocations(product._id);

  return { product, locations };
};

/**
 * Balance for one product in one place, and the entries that produced it.
 */
export const getStockTrail = async ({ productId, warehouseId, location }) => {
  const product = parseObjectId(productId, 'product id');
  const warehouse = parseObjectId(warehouseId, 'warehouse id');

  if (!location) throw ApiError.badRequest('A location code is required');

  const code = String(location).trim().toUpperCase();
  const balance = await getBalance({ product, warehouse, location: code });

  const entries = await StockLedger.find({ product, warehouse, location: code })
    .sort({ occurredAt: -1, _id: -1 })
    .populate('performedBy', 'name role')
    .lean();

  return { product, warehouse, location: code, balance, entries };
};

/**
 * Rebuilds Product.quantity from the ledger.
 *
 * Product.quantity is a denormalised cache so the product list and the low stock
 * filter stay a single indexed query. The ledger is the source of truth, and
 * posting rebuilds the cache every time, so this only needs running if something
 * outside the posting path changed the ledger, or after restoring a backup.
 *
 * With no productIds supplied, every product is rebuilt, which is what you want
 * after a restore and harmless otherwise: it is one aggregation plus one update
 * per product, and the values written are the same ones already there.
 */
export const reconcile = async ({ productIds } = {}) => {
  const ids = productIds?.length
    ? productIds.map((id) => parseObjectId(id, 'product id'))
    : (await Product.find({}, { _id: 1 }).lean()).map((p) => p._id);

  if (ids.length === 0) return { rebuilt: 0, totals: {} };

  const totals = await reconcileProductTotals(ids);
  const summary = Object.fromEntries([...totals.entries()].map(([id, total]) => [id, total]));

  return { rebuilt: ids.length, totals: summary };
};

/**
 * Confirms the unique postingKey index is present.
 *
 * Posting refuses to run without it, so exposing the check means the cause of a
 * 500 is visible before someone tries to post a document.
 */
export const checkIndexes = async () => {
  const indexes = await StockLedger.collection.indexes();
  const guarded = indexes.some((index) => index.unique === true && index.key?.postingKey === 1);

  return {
    postingKeyIndexPresent: guarded,
    indexes: indexes.map((index) => ({
      name: index.name,
      keys: index.key,
      unique: index.unique === true
    }))
  };
};
