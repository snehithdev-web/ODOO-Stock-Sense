import mongoose from 'mongoose';

/**
 * Human readable document references such as "RCP-00042".
 *
 * The operation schema already falls back to a timestamp based reference when one
 * is not supplied, but that produces an opaque code like "RCP-MF3K9XZ". Operators
 * type and read these all day, so the service layer supplies a sequential one.
 *
 * The counter is a single document incremented with $inc, which is atomic per
 * document. That matters here: MongoDB is running standalone, so there is no
 * transaction to hide a race inside, and a naive read-then-write would hand two
 * concurrent requests the same number.
 */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String },
    value: { type: Number, default: 0 }
  },
  { versionKey: false }
);

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

export const PREFIXES = {
  RECEIPT: 'RCP',
  DELIVERY: 'DEL',
  TRANSFER: 'TRF',
  ADJUSTMENT: 'ADJ'
};

/**
 * Claims the next number for a document prefix and returns it formatted as a
 * reference, e.g. "RCP-00001".
 *
 * Numbers are per prefix, so each document type has its own sequence. A claimed
 * number can already belong to a document that was never deleted (if the
 * counter was reset), so the caller is expected to surface a duplicate key error
 * as a 409 and retry with the next number. A gap in the numbering is harmless
 * and preferable to handing out a reference that already exists.
 */
export const nextReference = async (prefix) => {
  const counter = await Counter.findByIdAndUpdate(
    prefix,
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `${prefix}-${String(counter.value).padStart(5, '0')}`;
};
