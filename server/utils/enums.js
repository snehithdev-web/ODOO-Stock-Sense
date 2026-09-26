export const DOCUMENT_STATUS = {
  DRAFT: 'draft',
  WAITING: 'waiting',
  READY: 'ready',
  DONE: 'done',
  CANCELED: 'canceled'
};

export const DOCUMENT_STATUS_VALUES = Object.values(DOCUMENT_STATUS);

export const OPERATION_TYPE = {
  RECEIPT: 'receipt',
  DELIVERY: 'delivery',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment'
};

export const OPERATION_TYPE_VALUES = Object.values(OPERATION_TYPE);

const VALID_TRANSITIONS = {
  [DOCUMENT_STATUS.DRAFT]: [DOCUMENT_STATUS.WAITING, DOCUMENT_STATUS.READY, DOCUMENT_STATUS.CANCELED],
  [DOCUMENT_STATUS.WAITING]: [DOCUMENT_STATUS.READY, DOCUMENT_STATUS.CANCELED],
  [DOCUMENT_STATUS.READY]: [DOCUMENT_STATUS.DONE, DOCUMENT_STATUS.CANCELED],
  [DOCUMENT_STATUS.DONE]: [],
  [DOCUMENT_STATUS.CANCELED]: []
};

export const canTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
};