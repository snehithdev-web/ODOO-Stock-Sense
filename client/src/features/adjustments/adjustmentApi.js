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
 * Stock adjustments: correcting the book record to a physical count.
 *
 * Request body, matching the API contract:
 *   { warehouse, location, reason,
 *     items: [{ product, countedQuantity }] }
 *
 * Only the count is sent. The recorded side is read by the server from the live
 * balance and re-read again at post time, because a client cannot know what the
 * book record says right now, and a count has to land on the number that was
 * physically counted even if stock moved while the document sat in draft.
 *
 * A count changes the book record, so these endpoints are manager only; a
 * warehouse_staff user receives a 403 from the API.
 */

const PATH = 'adjustments';

export const getAdjustments = (params) => listOperations(PATH, { params });

export const getAdjustmentById = (id) => getOperation(PATH, id);

export const createAdjustment = (payload) => createOperation(PATH, payload);

export const updateAdjustment = (id, payload) => updateOperation(PATH, id, payload);

export const advanceAdjustment = (id, status) => transitionOperation(PATH, id, status);

export const markAdjustmentReady = (id) => transitionOperation(PATH, id, DOCUMENT_STATUS.READY);

export const validateAdjustment = (id) => postOperation(PATH, id);

export const cancelAdjustment = (id, reason = '') => cancelOperation(PATH, id, reason);

export const deleteAdjustment = (id) => deleteOperation(PATH, id);
