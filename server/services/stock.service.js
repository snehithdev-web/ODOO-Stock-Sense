import mongoose from 'mongoose';
import StockLedger from '../models/stockLedger.model.js';
import Product from '../models/product.model.js';
import ApiError from '../utils/ApiError.js';
import { DOCUMENT_STATUS } from '../utils/enums.js';

const DUPLICATE_KEY_ERROR = 11000;

const isDuplicateKeyError = (error) => error?.code === DUPLICATE_KEY_ERROR;

/**
 * Movement key used as the ledger's idempotency token.
 *
 * A transfer moves one product between two places, so the destination half is a
 * separate entry with its own key. Two entries may only share a key if they are
 * genuinely the same movement being replayed.
 */
/**
 * Uppercased so a key is stable no matter how the caller cased the inputs. The
 * ledger stores the key uppercased too, so a retry that differs only in case
 * still collides on the unique index instead of appending a second entry.
 */
export const buildPostingKey = ({ operationModel, operationId, product, warehouse, location }) =>
  [operationModel, operationId, product, warehouse, normaliseLocation(location)]
    .map((part) => String(part).trim().toUpperCase())
    .join(':');

const normaliseLocation = (location) => String(location).trim().toUpperCase();

/**
 * Identity of one balance stream: a product, a warehouse and a location within it.
 *
 * Used as the map key when reading several balances at once, so the caller and
 * the reader cannot disagree about how a stream is named.
 */
const streamKey = ({ product, warehouse, location }) =>
  `${String(product)}:${String(warehouse)}:${normaliseLocation(location)}`;

export { streamKey };

/**
 * Casts a stream reference to ObjectIds for use inside an aggregation.
 *
 * Mongoose casts values for find()/findOne(), but aggregate() pipelines run
 * directly against the server and get no casting. A pipeline left with a plain
 * string in a $match against an ObjectId field matches nothing at all, which
 * looks exactly like "this location has never held stock" and silently
 * understates every balance.
 */
const toStreamRef = ({ product, warehouse, location }) => {
  const toId = (value) =>
    value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value));

  return {
    product: toId(product),
    warehouse: toId(warehouse),
    location: normaliseLocation(location),
  };
};

/**
 * Confirms the unique index that makes posting idempotent really exists.
 *
 * Without it, a retried posting would append the same movement a second time
 * and permanently inflate stock, and nothing would report the problem. A
 * deployment that skipped index creation fails loudly here instead.
 */
const assertPostingKeyIndex = async () => {
  const indexes = await StockLedger.collection.indexes();
  const hasUniquePostingKey = indexes.some(
    (index) => index.unique === true && index.key?.postingKey === 1
  );

  if (!hasUniquePostingKey) {
    throw new ApiError(
      500,
      'The stock ledger is missing its unique postingKey index, so posting cannot be made ' +
        'idempotent. Run "npm run seed:indexes" (or db.StockLedger.createIndexes()) before posting.'
    );
  }
};

/**
 * Reads the current balance of one product in one location.
 *
 * The ledger is the source of truth, and balanceAfter carries the running
 * balance, so the latest entry answers the question without summing the history.
 */
export const getBalance = async ({ product, warehouse, location }) => {
  const latest = await StockLedger.findOne({
    product,
    warehouse,
    location: normaliseLocation(location),
  })
    .sort({ occurredAt: -1, _id: -1 })
    .select('balanceAfter')
    .lean();

  return latest?.balanceAfter ?? 0;
};

/**
 * Current balances for a set of product/warehouse/location triples in one query.
 *
 * Posting needs every affected balance before it writes anything, so it can
 * validate the whole document and reject it as a unit rather than applying half
 * of it.
 */
export const getBalances = async (triples) => {
  if (triples.length === 0) return new Map();

  // Every requested stream is seeded to zero first, so a location that has never
  // held stock is reported as an explicit 0 rather than being absent from the map.
  const balances = new Map();
  for (const triple of triples) {
    balances.set(streamKey(triple), 0);
  }

  const or = triples.map(toStreamRef);

  const rows = await StockLedger.aggregate([
    { $match: { $or: or } },
    { $sort: { occurredAt: -1, _id: -1 } },
    {
      $group: {
        _id: { product: '$product', warehouse: '$warehouse', location: '$location' },
        balance: { $first: '$balanceAfter' },
      },
    },
  ]);

  for (const row of rows) {
    balances.set(streamKey(row._id), row.balance);
  }

  return balances;
};

/**
 * Every non zero balance held for a product, grouped by warehouse and location.
 * Backs "stock availability per location" on the product screen.
 */
export const getProductLocations = async (productId) => {
  return StockLedger.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $sort: { occurredAt: -1, _id: -1 } },
    { $group: { _id: { warehouse: '$warehouse', location: '$location' }, balance: { $first: '$balanceAfter' } } },
    { $match: { balance: { $ne: 0 } } },
    { $sort: { '_id.warehouse': 1, '_id.location': 1 } },
    {
      $lookup: {
        from: 'warehouses',
        localField: '_id.warehouse',
        foreignField: '_id',
        as: 'warehouse',
      },
    },
    { $unwind: { path: '$warehouse', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        warehouse: { _id: '$warehouse._id', name: '$warehouse.name', code: '$warehouse.code' },
        location: '$_id.location',
        quantity: '$balance',
      },
    },
  ]);
};

/**
 * Total stock a product holds across every location.
 *
 * A product's total is the sum of the latest balance of each
 * product/warehouse/location stream. Because balanceAfter is a running balance,
 * summing every entry would double count: the 10 and then 5 written to the same
 * stream are not 15, the 5 supersedes the 10. So only the newest entry per
 * stream counts, and those are summed.
 */
export const getProductTotal = async (productId) => {
  const rows = await StockLedger.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $sort: { occurredAt: -1, _id: -1 } },
    { $group: { _id: { warehouse: '$warehouse', location: '$location' }, balance: { $first: '$balanceAfter' } } },
    { $group: { _id: null, total: { $sum: '$balance' } } },
  ]);

  return rows[0]?.total ?? 0;
};

/**
 * Recomputes Product.quantity from the ledger for the given products.
 *
 * Every posting calls this, which is what keeps the cache honest: the ledger is
 * written first and the cache is derived from it, so a crash between the two
 * leaves a stale cache rather than wrong stock. Running this again repairs it.
 */
export const reconcileProductTotals = async (productIds) => {
  const ids = [...new Set(productIds.map((id) => String(id)))];

  // StockLedger keeps a running balance per product/warehouse/location, so the
  // product total is the sum of each stream's latest balance. This cannot simply
  // be a $sum over every entry, because intermediate entries are superseded.
  const rows = await StockLedger.aggregate([
    { $match: { product: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $sort: { occurredAt: -1, _id: -1 } },
    {
      $group: {
        _id: { product: '$product', warehouse: '$warehouse', location: '$location' },
        balance: { $first: '$balanceAfter' },
      },
    },
    { $group: { _id: '$_id.product', total: { $sum: '$balance' } } },
  ]);

  const totals = new Map(rows.map((row) => [String(row._id), row.total]));

  await Promise.all(
    ids.map((id) =>
      Product.updateOne(
        { _id: id },
        { $set: { quantity: totals.get(id) ?? 0 } }
      )
    )
  );

  return totals;
};

/**
 * Creates the indexes the stock engine depends on.
 *
 * Mongoose builds these on model init, but only when autoIndex is enabled, which
 * is normally disabled in production. Posting refuses to run without the unique
 * postingKey index, so a deployment must be able to build it explicitly.
 */
export const ensureStockIndexes = async () => {
  await StockLedger.createIndexes();
  return StockLedger.collection.indexes();
};

/**
 * Applies a document's stock movements to the ledger.
 *
 * This is the only function in the codebase that changes stock, which is what
 * keeps the four document types behaving identically.
 *
 * Ordering, and why:
 *   1. Refuse if the document is not in a postable state.
 *   2. Read every affected balance, then validate the document as a whole. A
 *      document that would drive stock negative is rejected before anything is
 *      written, so a failed validation leaves no trace.
 *   3. Write the ledger entries first. The ledger is append only and each entry
 *      is uniquely keyed, so a retry after a crash collides on the key and is
 *      recognised as already applied instead of double counting.
 *   4. Mark the document posted.
 *   5. Rebuild the product cache from the ledger.
 *
 * Steps 4 and 5 are derived state and can be repaired by re-posting or by
 * reconcileProductTotals, so a crash between them cannot corrupt stock.
 *
 * @param {object}   args
 * @param {object}   args.document        The Receipt/Delivery/Transfer/Adjustment being posted.
 * @param {string}   args.operationModel  Mongoose model name, e.g. 'Receipt'.
 * @param {string}   args.operationType   OPERATION_TYPE value recorded on each entry.
 * @param {Array}    args.movements       [{ product, warehouse, location, quantity, notes }]
 *                                       quantity is signed: positive adds stock.
 * @param {string}   args.performedBy     User id credited with the movement.
 */
export const postMovements = async ({
  document,
  operationModel,
  operationType,
  movements,
  performedBy,
}) => {
  if (!document) throw ApiError.badRequest('Cannot post movements without a document');

  if (document.status === DOCUMENT_STATUS.DONE) {
    throw ApiError.conflict(`${document.reference} has already been posted.`);
  }

  if (document.status !== DOCUMENT_STATUS.READY) {
    throw ApiError.conflict(
      `${document.reference} must be in "${DOCUMENT_STATUS.READY}" before it can be posted. It is currently "${document.status}".`
    );
  }

  if (movements.length === 0) {
    throw ApiError.badRequest(`${document.reference} has no items to post.`);
  }

  // Two lines for the same product in the same place would produce the same
  // posting key, which the ledger's unique index would reject with a message
  // about duplicates rather than about the document. Caught here instead.
  const seen = new Set();
  for (const movement of movements) {
    const key = buildPostingKey({ ...movement, operationModel, operationId: document._id });
    if (seen.has(key)) {
      throw ApiError.badRequest(
        `${document.reference} lists the same product twice for one location. Combine the lines into a single quantity.`
      );
    }
    seen.add(key);
  }

  const triples = movements.map(({ product, warehouse, location }) => ({
    product: String(product),
    warehouse: String(warehouse),
    location,
  }));
  const balances = await getBalances(triples);

  // Validate the whole document before writing any of it.
  const projected = new Map();
  for (const movement of movements) {
    const key = streamKey(movement);
    const current = projected.has(key) ? projected.get(key) : balances.get(key) ?? 0;
    projected.set(key, current + movement.quantity);
  }

  const shortfalls = [...projected.entries()].filter(([, balance]) => balance < 0);
  if (shortfalls.length > 0) {
    const detail = shortfalls
      .map(([key, balance]) => {
        const location = key.slice(key.lastIndexOf(':') + 1);
        return `${location} (would fall to ${balance})`;
      })
      .join(', ');

    throw ApiError.conflict(
      `Not enough stock to post ${document.reference}. Affected location(s): ${detail}.`
    );
  }

  // Ledger first. balanceAfter is the running balance, so it is written even
  // though a later line in the same document may move the same stream again.
  const running = new Map();
  const entries = movements.map((movement) => {
    const key = streamKey(movement);
    const previous = running.has(key) ? running.get(key) : balances.get(key) ?? 0;
    const balanceAfter = previous + movement.quantity;
    running.set(key, balanceAfter);

    return {
      product: movement.product,
      warehouse: movement.warehouse,
      location: normaliseLocation(movement.location),
      quantity: movement.quantity,
      balanceAfter,
      operationType,
      operation: document._id,
      operationModel,
      operationRef: document.reference,
      notes: movement.notes || '',
      performedBy,
      occurredAt: document.postedAt || new Date(),
      postingKey: buildPostingKey({
        ...movement,
        operationModel,
        operationId: document._id,
      }),
    };
  });

  // insertMany is ordered so a duplicate key surfaces as a duplicate key rather
  // than being buried in an unordered batch.
  //
  // The unique index on postingKey is the actual guarantee here. If the index is
  // missing (a database created before it was added, or autoIndex disabled) the
  // insert would silently succeed and double count stock, so it is verified to
  // exist before anything is written.
  await assertPostingKeyIndex();

  let inserted = 0;
  try {
    const result = await StockLedger.insertMany(entries, { ordered: true });
    inserted = result.length;
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    // A duplicate key here means a previous attempt already wrote this posting.
    // Verify every key is present, so a genuine double post is still rejected
    // rather than being waved through.
    const existing = await StockLedger.countDocuments({
      postingKey: { $in: entries.map((entry) => entry.postingKey) },
    });

    if (existing !== entries.length) {
      throw ApiError.conflict(
        `${document.reference} has already been posted. Ledger entries were found for only some of its movements, which should not happen; reconcile before posting again.`
      );
    }

    inserted = 0;
  }

  document.status = DOCUMENT_STATUS.DONE;
  document.postedAt = new Date();
  document.postedBy = performedBy;
  await document.save();

  await reconcileProductTotals(movements.map((movement) => movement.product));

  return { document, entries: inserted, replayed: inserted === 0 };
};
