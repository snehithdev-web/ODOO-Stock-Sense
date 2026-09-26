import mongoose from 'mongoose';
import { buildOperationSchema } from './schemas/operation.schema.js';

/**
 * Why a count differs from the recorded quantity. The spec only gives one real
 * example (damaged goods), so this stays deliberately small.
 */
export const ADJUSTMENT_REASON = {
  DAMAGE: 'damage',
  EXPIRY: 'expiry',
  SHRINKAGE: 'shrinkage',
  RECOUNT: 'recount',
  THEFT_LOSS: 'theft_loss',
  OTHER: 'other'
};

/**
 * A counted line. Unlike the other documents this carries both sides of the
 * discrepancy, because the spec's whole point is reconciling recorded stock
 * against a physical count and logging the difference.
 */
const adjustmentItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Adjustment item must reference a product']
    },
    recordedQuantity: {
      type: Number,
      required: [true, 'Recorded quantity is required'],
      min: [0, 'Recorded quantity cannot be negative']
    },
    countedQuantity: {
      type: Number,
      required: [true, 'Counted quantity is required'],
      min: [0, 'Counted quantity cannot be negative']
    },
    /**
     * countedQuantity - recordedQuantity. Computed on every validation so the
     * stored document and its ledger entries can never disagree.
     */
    delta: {
      type: Number,
      required: true,
      default: 0
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    }
  },
  { _id: true }
);

/**
 * Adjustment: correcting recorded stock to match a physical count.
 */
const adjustmentSchema = buildOperationSchema({
  prefix: 'ADJ',
  modelName: 'Adjustment',
  fields: {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Adjustment must reference a warehouse']
    },
    location: {
      type: String,
      required: [true, 'Adjustment must reference a location code'],
      uppercase: true,
      trim: true
    },
    reason: {
      type: String,
      enum: {
        values: Object.values(ADJUSTMENT_REASON),
        message: '{VALUE} is not a valid adjustment reason'
      },
      required: [true, 'Adjustment reason is required']
    },
    items: {
      type: [adjustmentItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'An adjustment must contain at least one item'
      }
    }
  }
});

adjustmentSchema.pre('validate', function computeDeltas(next) {
  this.items.forEach((item) => {
    item.delta = item.countedQuantity - item.recordedQuantity;
  });

  next();
});

adjustmentSchema.index({ warehouse: 1, location: 1, documentDate: -1 });

const Adjustment = mongoose.model('Adjustment', adjustmentSchema);

export default Adjustment;
