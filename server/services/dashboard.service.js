import Product from '../models/product.model.js';
import Warehouse from '../models/warehouse.model.js';
import Receipt from '../models/receipt.model.js';
import Delivery from '../models/delivery.model.js';
import Transfer from '../models/transfer.model.js';
import StockLedger from '../models/stockLedger.model.js';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_VALUES, OPERATION_TYPE } from '../utils/enums.js';
import { parseEnumParam, exactMatch } from '../utils/query.js';
import ApiError from '../utils/ApiError.js';

/**
 * Dashboard reads.
 *
 * The dashboard is a reporting surface, so it answers "how does inventory look
 * right now" rather than moving anything. Every figure here is derived: counts
 * come from the document collections, balances from Product.quantity (which the
 * posting engine keeps in step with the ledger) and recent activity from the
 * ledger itself.
 */

/**
 * A document that has not been applied to stock yet.
 *
 * "Pending" is everything before it is either posted (done) or called off
 * (canceled), so it spans draft, waiting and ready.
 */
const PENDING_STATUSES = [
  DOCUMENT_STATUS.DRAFT,
  DOCUMENT_STATUS.WAITING,
  DOCUMENT_STATUS.READY
];

/** How many rows each dashboard panel shows before it becomes a list page. */
const PANEL_LIMIT = 20;
/** Recent movements is a feed, so it stays short. */
const MOVEMENT_LIMIT = 10;

const ALL = 'all';

/**
 * The dashboard filter bar is built from static <option> lists, so it submits
 * the label it displays ("Delivery Orders", "Inventory Adjustments", "All")
 * rather than the stored value. Translating the labels here keeps the query
 * layer working in stored values and stops the UI wording leaking into queries.
 */
const DOCUMENT_TYPE_ALIASES = {
  receipt: OPERATION_TYPE.RECEIPT,
  receipts: OPERATION_TYPE.RECEIPT,
  delivery: OPERATION_TYPE.DELIVERY,
  deliveries: OPERATION_TYPE.DELIVERY,
  'delivery order': OPERATION_TYPE.DELIVERY,
  'delivery orders': OPERATION_TYPE.DELIVERY,
  transfer: OPERATION_TYPE.TRANSFER,
  transfers: OPERATION_TYPE.TRANSFER,
  'internal transfer': OPERATION_TYPE.TRANSFER,
  'internal transfers': OPERATION_TYPE.TRANSFER,
  adjustment: OPERATION_TYPE.ADJUSTMENT,
  adjustments: OPERATION_TYPE.ADJUSTMENT,
  'inventory adjustment': OPERATION_TYPE.ADJUSTMENT,
  'inventory adjustments': OPERATION_TYPE.ADJUSTMENT
};

/** Treats "", null and "All" as "no filter". */
const isUnset = (value) => {
  if (value === undefined || value === null) return true;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '' || normalized === ALL;
};

/**
 * Normalises the four dashboard filters into stored values.
 *
 * status and documentType are validated rather than ignored: a filter that is
 * silently dropped returns the unfiltered set, which reads as "nothing matched"
 * and hides a genuine client/server disagreement.
 */
export const parseDashboardFilters = (query = {}) => {
  const status = isUnset(query.status)
    ? undefined
    : parseEnumParam(query.status, DOCUMENT_STATUS_VALUES, 'status');

  let documentType;
  if (!isUnset(query.documentType)) {
    const key = String(query.documentType).trim().toLowerCase();
    documentType = DOCUMENT_TYPE_ALIASES[key];

    if (!documentType) {
      throw ApiError.badRequest(
        `Invalid documentType '${query.documentType}'. Expected one of: ${Object.keys(
          DOCUMENT_TYPE_ALIASES
        ).join(', ')}.`
      );
    }
  }

  return {
    status,
    documentType,
    location: isUnset(query.location) ? undefined : String(query.location).trim(),
    category: isUnset(query.category) ? undefined : String(query.category).trim()
  };
};

/**
 * Resolves the "warehouse / location" filter to concrete ids and location codes.
 *
 * The one control covers both, because the spec treats a warehouse and its
 * sub-places as a single axis: Main Warehouse, Warehouse 1, Rack A and the
 * Production Floor are all places stock can sit. Returns null when unset, so
 * callers can spread it in without branching.
 */
const resolvePlace = async (value) => {
  if (!value) return null;

  const warehouses = await Warehouse.find({
    $or: [{ name: exactMatch(value) }, { code: exactMatch(value) }]
  })
    .select('_id locations.code')
    .lean();

  return {
    warehouseIds: warehouses.map((warehouse) => warehouse._id),
    locationCodes: warehouses.flatMap((warehouse) =>
      (warehouse.locations || []).map((location) => location.code)
    )
  };
};

/**
 * Resolves the category filter to the product ids in it, so a document filter
 * can be applied to documents whose items reference those products.
 */
const resolveProductIds = async (category) => {
  if (!category) return null;

  const products = await Product.find({ category: exactMatch(category) })
    .select('_id')
    .lean();

  return products.map((product) => product._id);
};

/**
 * Builds the Mongo filter for one document type.
 *
 * Single-place documents (receipt, delivery, adjustment) carry warehouse and
 * location at the top level; a transfer carries both sides, so it has to match
 * on either.
 */
const buildDocumentFilter = async ({ type, filters, place, productIds }) => {
  const filter = {};

  if (filters.status) {
    filter.status = filters.status;
  } else {
    filter.status = { $in: PENDING_STATUSES };
  }

  if (place) {
    const clauses = [];
    if (place.warehouseIds.length > 0) clauses.push({ warehouse: { $in: place.warehouseIds } });
    if (place.locationCodes.length > 0) clauses.push({ location: { $in: place.locationCodes } });

    if (clauses.length > 0) {
      if (type === OPERATION_TYPE.TRANSFER) {
        filter.$or = [
          { 'from.warehouse': { $in: place.warehouseIds } },
          { 'to.warehouse': { $in: place.warehouseIds } },
          { 'from.location': { $in: place.locationCodes } },
          { 'to.location': { $in: place.locationCodes } }
        ].filter((clause) => {
          const value = Object.values(clause)[0]?.$in;
          return Array.isArray(value) && value.length > 0;
        });
      } else {
        filter.$or = clauses;
      }
    }
  }

  if (productIds) {
    filter['items.product'] = { $in: productIds };
  }

  return filter;
};

/**
 * The warehouse and category values offered by the filter bar.
 *
 * Returned as plain strings because the control is a <select> of them; a
 * warehouse code is included alongside its name so either can be submitted.
 */
const getFilterOptions = async () => {
  const [warehouses, categories] = await Promise.all([
    Warehouse.find({}).select('name code').sort({ name: 1 }).lean(),
    Product.distinct('category'),
  ]);

  const warehouseOptions = warehouses.flatMap((warehouse) =>
    [warehouse.name, warehouse.code].filter(Boolean)
  );

  return {
    warehouses: [...new Set(warehouseOptions)].sort(),
    categories: (categories || []).filter(Boolean).sort()
  };
};

/** Low and out of stock combined, which is what the KPI card shows. */
const LOW_STOCK_EXPR = { $expr: { $lte: ['$quantity', '$reorderLevel'] } };

/**
 * Dashboard KPIs.
 *
 * totalProducts counts products actually held (quantity > 0), matching the
 * "Total Products in Stock" label, rather than the size of the catalogue. The
 * low/out-of-stock figure uses the same threshold as the product list filter, so
 * the two views can never disagree.
 */
const getSummary = async ({ place, productIds }) => {
  const productFilter = {};
  if (productIds) productFilter._id = { $in: productIds };

  const [totalProducts, lowStockCount, pendingReceipts, pendingDeliveries, scheduledTransfers] =
    await Promise.all([
      Product.countDocuments({ ...productFilter, quantity: { $gt: 0 } }),
      Product.countDocuments({ ...productFilter, ...LOW_STOCK_EXPR }),
      Receipt.countDocuments(await buildDocumentFilter({ type: OPERATION_TYPE.RECEIPT, place, productIds })),
      Delivery.countDocuments(await buildDocumentFilter({ type: OPERATION_TYPE.DELIVERY, place, productIds })),
      Transfer.countDocuments(await buildDocumentFilter({ type: OPERATION_TYPE.TRANSFER, place, productIds }))
    ]);

  return {
    totalProducts,
    lowStockCount,
    pendingReceipts,
    pendingDeliveries,
    scheduledTransfers
  };
};

/** Products at or below their reorder level, soonest to run out first. */
const getLowStockProducts = async ({ productIds }) => {
  const filter = { ...LOW_STOCK_EXPR };
  if (productIds) filter._id = { $in: productIds };

  return Product.find(filter)
    .sort({ quantity: 1, name: 1, _id: 1 })
    .limit(PANEL_LIMIT)
    .select('name sku category unit quantity reorderLevel location')
    .lean();
};

/** Pending documents of one type, newest first. */
const getPendingDocuments = async ({ Model, type, filters, place, productIds }) => {
  const filter = await buildDocumentFilter({ type, filters, place, productIds });

  return Model.find(filter)
    .sort({ documentDate: -1, _id: -1 })
    .limit(PANEL_LIMIT)
    .populate('warehouse', 'name code')
    .populate('items.product', 'name sku unit')
    .lean();
};

/** The latest ledger entries, which is the dashboard's activity feed. */
const getRecentMovements = async ({ filters, place }) => {
  const filter = {};

  if (filters.documentType) {
    filter.operationType = filters.documentType;
  }

  if (place) {
    const clauses = [];
    if (place.warehouseIds.length > 0) clauses.push({ warehouse: { $in: place.warehouseIds } });
    if (place.locationCodes.length > 0) clauses.push({ location: { $in: place.locationCodes } });
    if (clauses.length > 0) filter.$or = clauses;
  }

  return StockLedger.find(filter)
    .sort({ occurredAt: -1, _id: -1 })
    .limit(MOVEMENT_LIMIT)
    .populate('product', 'name sku unit')
    .populate('warehouse', 'name code')
    .lean();
};

/**
 * Everything the dashboard renders, in one request.
 *
 * The page also fetches each panel individually, but the summary carries the
 * whole payload so a cold load paints from a single round trip and the filter
 * options arrive with the figures that depend on them.
 */
export const getDashboard = async (query = {}) => {
  const filters = parseDashboardFilters(query);
  const [place, productIds] = await Promise.all([
    resolvePlace(filters.location),
    resolveProductIds(filters.category)
  ]);

  const context = { filters, place, productIds };

  const [summary, lowStockProducts, pendingReceipts, pendingDeliveries, scheduledTransfers, recentMovements, filterOptions] =
    await Promise.all([
      getSummary(context),
      getLowStockProducts(context),
      getPendingDocuments({ ...context, Model: Receipt, type: OPERATION_TYPE.RECEIPT }),
      getPendingDocuments({ ...context, Model: Delivery, type: OPERATION_TYPE.DELIVERY }),
      getPendingDocuments({ ...context, Model: Transfer, type: OPERATION_TYPE.TRANSFER }),
      getRecentMovements(context),
      getFilterOptions()
    ]);

  return {
    summary,
    lowStockProducts,
    pendingReceipts,
    pendingDeliveries,
    scheduledTransfers,
    recentMovements,
    filters: filterOptions
  };
};

/**
 * One panel of the dashboard.
 *
 * A documentType that names a different type yields an empty list rather than
 * that type's rows, so filtering the page to "Deliveries" empties the receipts
 * panel instead of leaving it showing receipts.
 */
const panelFor = async (type, query) => {
  const filters = parseDashboardFilters(query);

  if (type && filters.documentType && filters.documentType !== type) {
    return [];
  }

  const [place, productIds] = await Promise.all([
    resolvePlace(filters.location),
    resolveProductIds(filters.category)
  ]);
  const context = { filters, place, productIds };

  if (!type) {
    return getRecentMovements(context);
  }

  const Model = {
    [OPERATION_TYPE.RECEIPT]: Receipt,
    [OPERATION_TYPE.DELIVERY]: Delivery,
    [OPERATION_TYPE.TRANSFER]: Transfer
  }[type];

  return getPendingDocuments({ ...context, Model, type });
};

export const getLowStock = async (query = {}) => {
  const filters = parseDashboardFilters(query);
  const productIds = await resolveProductIds(filters.category);

  return getLowStockProducts({ filters, place: null, productIds });
};

export const getPendingReceipts = (query = {}) =>
  panelFor(OPERATION_TYPE.RECEIPT, query);

export const getPendingDeliveries = (query = {}) =>
  panelFor(OPERATION_TYPE.DELIVERY, query);

export const getScheduledTransfers = (query = {}) =>
  panelFor(OPERATION_TYPE.TRANSFER, query);

export const getRecentMovementsPanel = (query = {}) => panelFor(null, query);
