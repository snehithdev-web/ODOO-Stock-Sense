import mongoose from 'mongoose';
import { buildOperationSchema, operationItemSchema } from './schemas/operation.schema.js';

/**
 * Delivery order: stock leaving the warehouse for a customer. Outbound, so
 * posting one decreases stock. Walks the shared workflow draft -> waiting ->
 * ready -> done.
 */
const deliverySchema = buildOperationSchema({
  prefix: 'DEL',
  modelName: 'Delivery',
  fields: {
    /**
     * Who the goods ship to. As with supplier on a receipt, the spec never
     * defines a customer entity, so it is captured inline for now.
     */
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        maxlength: [120, 'Customer name cannot exceed 120 characters']
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
     * Where the stock is picked from.
     */
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Delivery must reference a source warehouse']
    },
    location: {
      type: String,
      required: [true, 'Delivery must reference a source location code'],
      uppercase: true,
      trim: true
    },
    items: {
      type: [operationItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'A delivery must contain at least one item'
      }
    }
  }
});

deliverySchema.index({ warehouse: 1, location: 1, documentDate: -1 });

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;
