import mongoose from 'mongoose';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_VALUES, canTransition } from '../../utils/enums.js';

/**
 * Reusable pieces shared by the four operational document models: receipts,
 * deliveries, transfers and adjustments. Each of those models adds only its own
 * specific fields on top of `operationBaseFields`.
 */

/**
 * A single product line on a document. Shared by receipts, deliveries and
 * transfers; adjustments use their own richer line (see adjustment.model.js).
 */
export const operationItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Item must reference a product']
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [0.0001, 'Item quantity must be greater than zero']
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
 * Fields present on every operational document.
 */
export const operationBaseFields = {
  /**
   * Human readable document code, unique across all document types.
   * Auto-generated when missing, but the service layer should pass a sequential
   * value (for example "RCP-00001") so operators get tidy references.
   */
  reference: {
    type: String,
    required: [true, 'Document reference is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [32, 'Document reference cannot exceed 32 characters']
  },
  status: {
    type: String,
    enum: {
      values: DOCUMENT_STATUS_VALUES,
      message: '{VALUE} is not a valid document status'
    },
    default: DOCUMENT_STATUS.DRAFT,
    index: true
  },
  /**
   * Audit trail of status changes, so a document that reached DONE can be
   * traced back through the workflow.
   */
  statusHistory: {
    type: [
      {
        from: { type: String, enum: DOCUMENT_STATUS_VALUES },
        to: { type: String, enum: DOCUMENT_STATUS_VALUES, required: true },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        note: { type: String, trim: true, maxlength: 200, default: '' }
      }
    ],
    default: []
  },
  documentDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Document must record the user who created it']
  },
  /**
   * Set when the document reaches DONE, which is the only moment stock moves.
   */
  postedAt: {
    type: Date,
    default: null
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  canceledAt: {
    type: Date,
    default: null
  },
  cancelReason: {
    type: String,
    trim: true,
    maxlength: 300,
    default: ''
  }
};

/**
 * Builds a document schema from the shared base fields plus model specific ones.
 *
 * @param {object}   options
 * @param {string}   options.prefix Reference prefix, e.g. "RCP" for receipts.
 * @param {object}   options.fields  Model specific fields to merge in.
 * @param {string}   options.modelName Mongoose model name.
 * @param {object}   [options.schemaOptions] Extra options for mongoose.Schema.
 */
export const buildOperationSchema = ({ prefix, fields, modelName, schemaOptions = {} }) => {
  const schema = new mongoose.Schema(
    {
      ...operationBaseFields,
      ...fields
    },
    {
      timestamps: true,
      ...schemaOptions
    }
  );

  // Fallback reference so a document is always identifiable, even when it is
  // created without going through the service layer.
  schema.pre('validate', function assignReference(next) {
    if (!this.reference) {
      this.reference = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
    }
    next();
  });

  // Whether this document is allowed to move to the given status.
  schema.methods.canTransitionTo = function canTransitionTo(nextStatus) {
    return canTransition(this.status, nextStatus);
  };

  // True only for documents that may still be edited. A DONE document changed
  // stock, so editing it afterwards would silently diverge from the ledger.
  schema.methods.isEditable = function isEditable() {
    return this.status === DOCUMENT_STATUS.DRAFT;
  };

  schema.statics.MODEL_NAME = modelName;

  return schema;
};
