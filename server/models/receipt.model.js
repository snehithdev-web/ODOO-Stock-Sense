import mongoose from 'mongoose';
import { buildOperationSchema, operationItemSchema } from './schemas/operation.schema.js';

/**
 * Receipt: stock arriving from a vendor. Inbound, so posting one increases
 * stock. Walks the shared workflow draft -> waiting -> ready -> done.
 */
const receiptSchema = buildOperationSchema({
  prefix: 'RCP',
  modelName: 'Receipt',
  fields: {
    /**
     * The vendor. The spec has receipts carrying a supplier but never defines a
     * supplier entity, so it is captured inline. If suppliers later need their
     * own catalogue, addresses or history, promote this to a ref.
     */
    supplier: {
      name: {
        type: String,
        required: [true, 'Supplier name is required'],
        trim: true,
        maxlength: [120, 'Supplier name cannot exceed 120 characters']
      },
      code: {
        type: String,
        uppercase: true,
        trim: true,
        maxlength: [30],
        default: ''
      }
    },
    /**
     * Where the received stock is put away. One warehouse plus one location,
     * because a single receipt lands in a single place.
     */
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Receipt must reference a destination warehouse']
    },
    location: {
      type: String,
      required: [true, 'Receipt must reference a destination location code'],
      uppercase: true,
      trim: true
    },
    items: {
      type: [operationItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'A receipt must contain at least one item'
      }
    }
  }
});

receiptSchema.index({ warehouse: 1, location: 1, documentDate: -1 });

const Receipt = mongoose.model('Receipt', receiptSchema);

export default Receipt;
