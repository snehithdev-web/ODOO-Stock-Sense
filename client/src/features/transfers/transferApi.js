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
 * Internal transfers: stock moving between two places inside the company.
 *
 * Request body, matching the API contract:
 *   { from: { warehouse, location }, to: { warehouse, location },
 *     items: [{ product, quantity }] }
 *
 * A transfer names two places and one quantity: the server takes the quantity
 * out of the source and adds it to the destination in a single posting, so total
 * stock is unchanged while its location is. The previous version of this file
 * sent a flat `sourceLocation` / `warehouse`, which the API does not accept.
 */

const PATH = 'transfers';

export const getTransfers = (params) => listOperations(PATH, { params });

export const getTransferById = (id) => getOperation(PATH, id);

export const createTransfer = (payload) => createOperation(PATH, payload);

export const updateTransfer = (id, payload) => updateOperation(PATH, id, payload);

export const advanceTransfer = (id, status) => transitionOperation(PATH, id, status);

export const markTransferReady = (id) => transitionOperation(PATH, id, DOCUMENT_STATUS.READY);

export const validateTransfer = (id) => postOperation(PATH, id);

export const cancelTransfer = (id, reason = '') => cancelOperation(PATH, id, reason);
export const deleteTransfer = (id) => deleteOperation(PATH, id);
