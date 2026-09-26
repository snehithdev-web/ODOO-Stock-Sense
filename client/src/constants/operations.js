/**
 * Operational document states, mirroring server/utils/enums.js.
 *
 * The server stores these lowercase because that is what the database compares
 * against and what the `?status=` filter validates. Anything the UI needs to
 * present is uppercased at the point of display, not stored in a different case
 * from the one the API speaks.
 */
export const DOCUMENT_STATUS = {
  DRAFT: 'draft',
  WAITING: 'waiting',
  READY: 'ready',
  DONE: 'done',
  CANCELED: 'canceled'
};

export const DOCUMENT_STATUS_VALUES = Object.values(DOCUMENT_STATUS);

/** The states a document can still be worked on from. */
export const OPEN_STATUSES = [
  DOCUMENT_STATUS.DRAFT,
  DOCUMENT_STATUS.WAITING,
  DOCUMENT_STATUS.READY
];

/** The two states that mean the document will never move stock. */
export const CLOSED_STATUSES = [DOCUMENT_STATUS.DONE, DOCUMENT_STATUS.CANCELED];

export const OPERATION_TYPE = {
  RECEIPT: 'receipt',
  DELIVERY: 'delivery',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment'
};

export const ADJUSTMENT_REASON = {
  DAMAGE: 'damage',
  EXPIRY: 'expiry',
  SHRINKAGE: 'shrinkage',
  RECOUNT: 'recount',
  THEFT_LOSS: 'theft_loss',
  OTHER: 'other'
};

export const ADJUSTMENT_REASON_LABELS = {
  [ADJUSTMENT_REASON.DAMAGE]: 'Damage',
  [ADJUSTMENT_REASON.EXPIRY]: 'Expiry',
  [ADJUSTMENT_REASON.SHRINKAGE]: 'Shrinkage',
  [ADJUSTMENT_REASON.RECOUNT]: 'Re-count',
  [ADJUSTMENT_REASON.THEFT_LOSS]: 'Theft / Loss',
  [ADJUSTMENT_REASON.OTHER]: 'Other'
};
