/**
 * One-off cleanup for warehouses the old auto-creating resolveLocation invented.
 * Not part of the app; run manually then delete.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Warehouse from '../models/warehouse.model.js';
import StockLedger from '../models/stockLedger.model.js';
import Receipt from '../models/receipt.model.js';
import Delivery from '../models/delivery.model.js';

await connectDB();

const all = await Warehouse.find({}).lean();
console.log('WAREHOUSES:');
for (const w of all) {
  console.log(` - ${w.name} | ${w.code} | locs: ${(w.locations || []).map((l) => l.code).join(',')}`);
}

const phantoms = all.filter(
  (w) => /^not-an-object-id$/i.test(w.name) || /^Smoke Warehouse \d+$/.test(w.name)
);
console.log(`\nsmoke/phantom warehouses: ${phantoms.length}`);

const ids = phantoms.map((w) => w._id);

for (const phantom of phantoms) {
  console.log(` - ${phantom.name} (${phantom.code})`);
}

// Remove the documents and ledger entries that referenced them, then the
// warehouses themselves. Only records matching these test-name patterns are
// touched, so anything the developer created by hand is left alone.
const receipts = await Receipt.find({ warehouse: { $in: ids } }).select('_id reference').lean();
const deliveries = await Delivery.find({ warehouse: { $in: ids } }).select('_id reference').lean();
const ledger = await StockLedger.find({ warehouse: { $in: ids } }).select('_id').lean();

console.log(`\nreferencing receipts ${receipts.length}, deliveries ${deliveries.length}, ledger ${ledger.length}`);

await Receipt.deleteMany({ warehouse: { $in: ids } });
await Delivery.deleteMany({ warehouse: { $in: ids } });
await StockLedger.deleteMany({ warehouse: { $in: ids } });
await Warehouse.deleteMany({ _id: { $in: ids } });

const smokeProducts = await mongoose.connection.db
  .collection('products')
  .find({ sku: /^SMK-/ }, { projection: { sku: 1 } })
  .toArray();
await mongoose.connection.db.collection('products').deleteMany({ sku: /^SMK-/ });
console.log(`removed ${smokeProducts.length} smoke products`);

const smokeUsers = await mongoose.connection.db
  .collection('users')
  .deleteMany({ email: /^smoke\d+@/ });
console.log(`removed ${smokeUsers.deletedCount} smoke users`);

await mongoose.disconnect();
