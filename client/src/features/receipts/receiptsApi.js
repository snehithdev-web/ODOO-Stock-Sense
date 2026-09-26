import {
  listOperations,
  getOperation,
  createOperation,
  updateOperation,
  transitionOperation,
  postOperation,
  cancelOperation,
  deleteOperation
} from '../../services/inventoryApi';
import { DOCUMENT_STATUS } from '../../constants/operations';

/**
 * Receipts: stock arriving from a vendor.
 *
 * The request body mirrors the API contract exactly:
 *   { supplier: { name, code }, warehouse, location, items: [{ product, quantity }] }
 *
 * Note the shape differences from the earlier version of this file, which sent
 * `supplier` as a bare string, called the line items `products`, and sent a
 * warehouse name. All three were rejected by the API and then hidden by a catch
 * that reported success, so a receipt could look saved while nothing existed.
 *
 * Failures propagate. A 409 (insufficient stock), a 400 (bad payload) and an
 * expired session are all things the operator needs to see.
 */

const PATH = 'receipts';
const COUNTERPARTY = 'supplier';

export const getReceipts = (params) => listOperations(PATH, { counterparty: COUNTERPARTY, params });

export const getReceiptById = (id) => getOperation(PATH, id, { counterparty: COUNTERPARTY });

export const createReceipt = (payload) => createOperation(PATH, payload, { counterparty: COUNTERPARTY });

export const updateReceipt = (id, payload) =>
  updateOperation(PATH, id, payload, { counterparty: COUNTERPARTY });

/**
 * Walks a draft forward one step.
 *
 * The API owns the transition rules and rejects a move the state machine does
 * not allow, so the client asks for the next state rather than asserting one.
 */
export const advanceReceipt = (id, status) =>
  transitionOperation(PATH, id, status, { counterparty: COUNTERPARTY });

export const markReceiptReady = (id) =>
  transitionOperation(PATH, id, DOCUMENT_STATUS.READY, { counterparty: COUNTERPARTY });

/**
 * Applies the receipt to stock.
 *
 * Posting requires the document to be "ready": the server validates every line
 * against the current balances, writes the ledger and marks the document done.
 */
export const validateReceipt = (id) => postOperation(PATH, id, { counterparty: COUNTERPARTY });

export const cancelReceipt = (id, reason = '') =>
  cancelOperation(PATH, id, reason, { counterparty: COUNTERPARTY });

export const deleteReceipt = (id) => deleteOperation(PATH, id);
