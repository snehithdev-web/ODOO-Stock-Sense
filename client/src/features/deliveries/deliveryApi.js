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
 * Deliveries: stock leaving the warehouse for a customer.
 *
 * Request body, matching the API contract:
 *   { customer: { name, code }, warehouse, location, items: [{ product, quantity }] }
 *
 * There is no "picked" or "packed" endpoint. The workflow in the spec is
 * draft -> waiting -> ready -> done, so those steps are status transitions and
 * only "done" moves stock. The previous version of this file called /pick and
 * /pack, which do not exist.
 */

const PATH = 'deliveries';
const COUNTERPARTY = 'customer';

export const getDeliveries = (params) => listOperations(PATH, { counterparty: COUNTERPARTY, params });

export const getDeliveryById = (id) => getOperation(PATH, id, { counterparty: COUNTERPARTY });

export const createDelivery = (payload) => createOperation(PATH, payload, { counterparty: COUNTERPARTY });

export const updateDelivery = (id, payload) =>
  updateOperation(PATH, id, payload, { counterparty: COUNTERPARTY });

export const advanceDelivery = (id, status) =>
  transitionOperation(PATH, id, status, { counterparty: COUNTERPARTY });

export const markDeliveryReady = (id) =>
  transitionOperation(PATH, id, DOCUMENT_STATUS.READY, { counterparty: COUNTERPARTY });

export const validateDelivery = (id) => postOperation(PATH, id, { counterparty: COUNTERPARTY });

export const cancelDelivery = (id, reason = '') =>
  cancelOperation(PATH, id, reason, { counterparty: COUNTERPARTY });

export const deleteDelivery = (id) => deleteOperation(PATH, id);
