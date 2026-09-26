/**
 * Creates the MongoDB indexes the application relies on.
 *
 * Mongoose builds indexes on model init, but only while autoIndex is on, which
 * is normally off in production. The stock ledger in particular needs a unique
 * index on postingKey: without it a retried posting appends the same movement
 * twice and permanently inflates stock, and the posting service refuses to run.
 *
 * Safe to run repeatedly. Existing indexes are left alone; a conflicting index
 * of the same name but different options is reported rather than dropped.
 *
 * Usage:  npm run seed:indexes
 */
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import '../config/env.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Warehouse from '../models/warehouse.model.js';
import Receipt from '../models/receipt.model.js';
import Delivery from '../models/delivery.model.js';
import Transfer from '../models/transfer.model.js';
import Adjustment from '../models/adjustment.model.js';
import StockLedger from '../models/stockLedger.model.js';

const MODELS = [User, Product, Warehouse, Receipt, Delivery, Transfer, Adjustment, StockLedger];

const build = async () => {
  await connectDB();

  for (const model of MODELS) {
    await model.createIndexes();
    const indexes = await model.collection.indexes();
    const named = indexes
      .map((index) => `${index.name}${index.unique ? ' (unique)' : ''}`)
      .sort();
    console.log(`[indexes] ${model.modelName}: ${named.length ? named.join(', ') : 'none'}`);
  }

  // The one posting depends on, called out explicitly so its absence is obvious.
  const ledgerIndexes = await StockLedger.collection.indexes();
  const guarded = ledgerIndexes.some((i) => i.unique === true && i.key?.postingKey === 1);

  console.log(
    guarded
      ? '[indexes] OK: unique postingKey index present, posting is idempotent.'
      : '[indexes] FAILED: unique postingKey index is missing.'
  );

  return guarded;
};

build()
  .then((ok) => mongoose.disconnect().then(() => process.exit(ok ? 0 : 1)))
  .catch(async (error) => {
    console.error('[indexes] failed:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
