import mongoose from 'mongoose';

/**
 * A physical place where stock can sit. The spec mixes whole warehouses
 * (Main Warehouse, Warehouse 1) with sub-places (Production Floor, Rack A,
 * Rack B), so a warehouse owns a list of locations.
 *
 * Locations are embedded rather than their own collection because they have no
 * independent lifecycle and are always addressed together with their warehouse.
 */
const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: [80, 'Location name cannot exceed 80 characters']
    },
    /**
     * Stable short key for the location. Stock, documents and ledger entries all
     * reference a location by this code rather than by array position, so
     * reordering the locations array cannot corrupt existing references.
     */
    code: {
      type: String,
      required: [true, 'Location code is required'],
      uppercase: true,
      trim: true,
      maxlength: [20, 'Location code cannot exceed 20 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Warehouse name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Warehouse code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Warehouse code cannot exceed 20 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: 250,
      default: ''
    },
    locations: {
      type: [locationSchema],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Location codes are the join key used by products, documents and the ledger.
// They are only unique per warehouse, and Mongo cannot enforce uniqueness
// across an embedded array, so it is checked here instead.
warehouseSchema.pre('validate', function uniqueLocationCodes(next) {
  const codes = this.locations.map((location) => location.code);
  const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);

  if (duplicates.length > 0) {
    return next(new Error(`Duplicate location code(s) in warehouse: ${[...new Set(duplicates)].join(', ')}`));
  }

  next();
});

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

export default Warehouse;
