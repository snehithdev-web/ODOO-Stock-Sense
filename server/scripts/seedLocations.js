/**
 * Seeds the warehouses and locations the problem statement talks about.
 *
 * The spec mixes whole warehouses ("Warehouse 1", "Warehouse 2") with sub-places
 * inside them ("Production Floor", "Rack A", "Rack B"), and its worked example
 * moves stock "Main Store -> Production Rack". So a warehouse owns a list of
 * locations, and location codes are the join key used by products, documents and
 * the stock ledger.
 *
 * Idempotent: re-running adds only what is missing and never edits a location
 * that already exists, so it is safe to run against a populated database.
 *
 * Usage:  npm run seed:locations
 */
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Warehouse from '../models/warehouse.model.js';
import '../config/env.js';

/**
 * Hyderabad and Mumbai are the two city warehouses, plus the original
 * Main Warehouse, which is seeded here so it is not left location-less.
 */
const WAREHOUSES = [
  {
    name: 'Hyderabad Warehouse',
    code: 'WH-HYD',
    address: 'Hyderabad, Telangana',
    locations: [
      // "Main Store -> Production Rack" is the spec's own transfer example.
      { name: 'Main Store', code: 'MAIN-STORE' },
      { name: 'Production Rack', code: 'PROD-RACK' },
      // The spec names Rack A and Rack B explicitly.
      { name: 'Rack A', code: 'RACK-A' },
      { name: 'Rack B', code: 'RACK-B' },
      { name: 'Goods Yard', code: 'GOODS-YARD' },
    ],
  },
  {
    name: 'Mumbai Warehouse',
    code: 'WH-MUM',
    address: 'Mumbai, Maharashtra',
    locations: [
      { name: 'Main Store', code: 'MAIN-STORE' },
      { name: 'Goods Yard', code: 'GOODS-YARD' },
      { name: 'Dispatch Bay', code: 'DISPATCH-BAY' },
      { name: 'Rack A', code: 'RACK-A' },
    ],
  },
  {
    name: 'Main Warehouse',
    code: 'WH-MAIN',
    address: '',
    locations: [
      { name: 'Main Store', code: 'MAIN-STORE' },
      { name: 'Goods Yard', code: 'GOODS-YARD' },
      { name: 'Dispatch Bay', code: 'DISPATCH-BAY' },
    ],
  },
];

const seed = async () => {
  await connectDB();

  let created = 0;
  let addedLocations = 0;

  for (const spec of WAREHOUSES) {
    const existing = await Warehouse.findOne({ code: spec.code });

    if (!existing) {
      await Warehouse.create(spec);
      created += 1;
      console.log(`[seed] created warehouse ${spec.code} with ${spec.locations.length} location(s)`);
      continue;
    }

    const known = new Set(existing.locations.map((location) => location.code.toUpperCase()));
    const missing = spec.locations.filter((location) => !known.has(location.code.toUpperCase()));

    if (missing.length === 0) {
      console.log(`[seed] ${spec.code} already complete (${existing.locations.length} location(s))`);
      continue;
    }

    // addLocationToWarehouse is skipped deliberately: it re-reads and re-saves the
    // document per location, so pushing in one save is both faster and atomic.
    existing.locations.push(...missing);
    await existing.save();
    addedLocations += missing.length;
    console.log(`[seed] ${spec.code} gained ${missing.length} location(s): ${missing.map((l) => l.code).join(', ')}`);
  }

  const total = await Warehouse.countDocuments();
  const locations = await Warehouse.aggregate([
    { $unwind: '$locations' },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);

  console.log(
    `[seed] done. ${created} warehouse(s) created, ${addedLocations} location(s) added. ` +
      `Database now has ${total} warehouse(s) and ${locations[0]?.count || 0} location(s).`
  );
};

seed()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('[seed] failed:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
