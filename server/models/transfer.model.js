import mongoose from 'mongoose';
import { buildOperationSchema, operationItemSchema } from './schemas/operation.schema.js';

/**
 * Transfer: stock moving between locations inside the company. Total quantity
 * across the company does not change, only where it sits, which is why a posted
 * transfer writes two ledger entries (one negative, one positive) rather than
 * one.
 */
const transferSchema = buildOperationSchema({
  prefix: 'TRF',
  modelName: 'Transfer',
  fields: {
    from: {
      warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: [true, 'Transfer must reference a source warehouse']
      },
      location: {
        type: String,
        required: [true, 'Transfer must reference a source location code'],
        uppercase: true,
        trim: true
      }
    },
    to: {
      warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: [true, 'Transfer must reference a destination warehouse']
      },
      location: {
        type: String,
        required: [true, 'Transfer must reference a destination location code'],
        uppercase: true,
        trim: true
      }
    },
    items: {
      type: [operationItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'A transfer must contain at least one item'
      }
    }
  }
});

transferSchema.index({ 'from.warehouse': 1, 'from.location': 1, documentDate: -1 });
transferSchema.index({ 'to.warehouse': 1, 'to.location': 1, documentDate: -1 });

// A transfer to the exact same place is a mistake, not a no-op worth storing.
// Comparing warehouse and location together still allows Rack A -> Rack B within
// one warehouse, which the spec explicitly calls for.
//
// Reported with invalidate() rather than a thrown Error, so it surfaces as a
// mongoose ValidationError and the error middleware maps it to a 400. A plain
// Error here has no name the middleware recognises, and the client mistake would
// be reported as a 500.
transferSchema.pre('validate', function checkNotSelfTransfer(next) {
  const sameWarehouse =
    this.from?.warehouse?.toString() === this.to?.warehouse?.toString();
  const sameLocation = this.from?.location === this.to?.location;

  if (sameWarehouse && sameLocation) {
    this.invalidate(
      'to',
      'Transfer source and destination must be different locations'
    );
  }

  next();
});

const Transfer = mongoose.model('Transfer', transferSchema);

export default Transfer;
