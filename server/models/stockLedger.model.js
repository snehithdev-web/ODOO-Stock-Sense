import mongoose from 'mongoose';
import { OPERATION_TYPE_VALUES } from '../utils/enums.js';

/**
 * StockLedger is the append only record of every stock movement and the source
 * of truth for stock levels. Product.stock is only a cache of it.
 *
 * Rules that must hold, and which the posting service is responsible for:
 *   - Entries are never updated or deleted. A correction is a new adjustment.
 *   - quantity is signed: positive increases stock, negative decreases it.
 *   - balanceAfter is the running balance for that product, warehouse and
 *     location, so any balance can be verified by replaying the ledger.
 *   - One transfer produces two entries, a negative at the source and a positive
 *     at the destination, because total stock is unchanged but its location is not.
 */
const stockLedgerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Ledger entry must reference a product']
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Ledger entry must reference a warehouse']
    },
    location: {
      type: String,
      required: [true, 'Ledger entry must reference a location code'],
      uppercase: true,
      trim: true
    },
    /**
     * Signed change in quantity. Positive adds stock, negative removes it.
     */
    quantity: {
      type: Number,
      required: [true, 'Ledger entry must record a quantity'],
      validate: {
        validator: (value) => Number.isFinite(value) && value !== 0,
        message: 'Ledger quantity must be a non zero number'
      }
    },
    /**
     * Quantity for this product, warehouse and location immediately after this
     * entry was applied. Lets a balance be read in one query and cross checked
     * against a replay of the ledger.
     */
    balanceAfter: {
      type: Number,
      required: [true, 'Ledger entry must record the resulting balance'],
      default: 0
    },
    operationType: {
      type: String,
      enum: {
        values: OPERATION_TYPE_VALUES,
        message: '{VALUE} is not a valid operation type'
      },
      required: [true, 'Ledger entry must record the operation type'],
      index: true
    },
    /**
     * Polymorphic link to the document that caused this movement, so a receipt
     * and a transfer can both be referenced without a second field per type.
     */
    operation: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Ledger entry must reference its source document'],
      refPath: 'operationModel'
    },
    operationModel: {
      type: String,
      enum: {
        values: ['Receipt', 'Delivery', 'Transfer', 'Adjustment'],
        message: '{VALUE} is not a valid source document model'
      },
      required: [true, 'Ledger entry must record the source document model']
    },
    /**
     * Denormalised document reference, so Move History can render without
     * populating four different collections.
     */
    operationRef: {
      type: String,
      uppercase: true,
      trim: true,
      default: ''
    },
    /**
     * Only meaningful for adjustments; mirrors the adjustment reason.
     */
    reason: {
      type: String,
      trim: true,
      maxlength: 60,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    occurredAt: {
      type: Date,
      default: Date.now
    },
    /**
     * Deterministic identity for one movement, used to make posting idempotent.
     *
     * MongoDB is running standalone here, so multi document transactions are
     * unavailable and a posting that dies half way through cannot be rolled
     * back. Instead every entry is keyed by what it is: which document produced
     * it, and which balance stream (product, warehouse, location) it moves. A
     * unique index on this field means a retry of the same posting collides and
     * is recognised as already applied, instead of double counting the stock.
     *
     * Shape: "<OperationModel>:<operationId>:<productId>:<warehouseId>:<LOCATION>"
     */
    postingKey: {
      type: String,
      required: [true, 'Ledger entry must record a posting key'],
      uppercase: true,
      trim: true,
      maxlength: 160
    }
  },
  {
    timestamps: true
  }
);

// Replaying a product's history in one place, newest first.
stockLedgerSchema.index({ product: 1, warehouse: 1, location: 1, occurredAt: -1 });

// Move History: filter by document type over a date range.
stockLedgerSchema.index({ operationType: 1, occurredAt: -1 });

// Recent movements feed, and the dashboard.
stockLedgerSchema.index({ occurredAt: -1 });

// Trace every entry produced by a single document.
stockLedgerSchema.index({ operationModel: 1, operation: 1 });

// The idempotency guarantee for posting. Without this a retried posting would
// append the same movement twice and permanently inflate stock.
stockLedgerSchema.index({ postingKey: 1 }, { unique: true });

/**
 * True when this entry has already been written by an earlier attempt at
 * posting the same document. Used to tell a genuine duplicate posting from a
 * retry after a partial failure.
 */
stockLedgerSchema.statics.findByPostingKey = function findByPostingKey(postingKey) {
  return this.exists({ postingKey: String(postingKey).toUpperCase() });
};

/**
 * Current balance for one product in one location, read from the most recent
 * entry rather than by summing, which is what balanceAfter is for.
 */
stockLedgerSchema.statics.currentBalance = function currentBalance(productId, warehouseId, location) {
  return this.findOne({ product: productId, warehouse: warehouseId, location })
    .sort({ occurredAt: -1 })
    .select('balanceAfter')
    .lean();
};

const StockLedger = mongoose.model('StockLedger', stockLedgerSchema);

export default StockLedger;
