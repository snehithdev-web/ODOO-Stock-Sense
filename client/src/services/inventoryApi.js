import api from './api';
import { DOCUMENT_STATUS } from '../constants/operations';

/**
 * The single place the operational documents are fetched from and shaped for the
 * UI.
 *
 * Two things live here on purpose:
 *
 *   1. The endpoints. The API exposes one lifecycle for all four document types
 *      (receipt, delivery, transfer, adjustment), so one helper per action is
 *      written once and parameterised by path instead of being copied into four
 *      feature folders, where the copies had already drifted apart.
 *
 *   2. The display mapping. The server stores lowercase enums
 *      ("draft", "receipt") because that is what the database compares against.
 *      The tables label rows in uppercase, so each mapper derives the label from
 *      the canonical value rather than the value being stored in the UI's
 *      casing. `statusValue` / `operationType` keep the canonical value
 *      alongside, so filtering and comparisons have something exact to use.
 */

/** Resolves a populated ref, an id, or nothing, to a display string. */
const refName = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.name || value.code || value.sku || '';
};

/** One line describing what a document moves, for the dashboard tables. */
const summariseItems = (items = []) =>
  items
    .map((item) => {
      const name = refName(item.product) || 'Item';
      const counted = item.countedQuantity ?? item.quantity ?? 0;
      return `${name} x ${counted}`;
    })
    .join(', ');

/**
 * Maps one operational document to the shape the list and detail tables read.
 *
 * `supplier` and `customer` are objects on the server (name plus an optional
 * code) but a single string in a table cell, so the name is flattened here
 * rather than at each call site.
 */
export const mapOperation = (document = {}, { counterparty } = {}) => {
  const items = Array.isArray(document.items) ? document.items : [];
  const status = document.status || DOCUMENT_STATUS.DRAFT;

  const mapped = {
    _id: document._id,
    reference: document.reference || '',
    status,
    statusValue: status,
    statusLabel: String(status).toUpperCase(),
    warehouse: refName(document.warehouse),
    warehouseId: document.warehouse?._id || document.warehouse || '',
    location: document.location || '',
    itemCount: items.length,
    itemSummary: summariseItems(items),
    notes: document.notes || '',
    documentDate: document.documentDate || document.createdAt,
    createdAt: document.createdAt,
    createdBy: refName(document.createdBy),
    postedAt: document.postedAt || null,
    postedBy: refName(document.postedBy),
    canceledAt: document.canceledAt || null,
    cancelReason: document.cancelReason || '',
    items: items.map((item) => ({
      _id: item._id,
      product: item.product?._id || item.product || '',
      productName: refName(item.product),
      quantity: item.quantity ?? null,
      recordedQuantity: item.recordedQuantity ?? null,
      countedQuantity: item.countedQuantity ?? null,
      delta: item.delta ?? null,
      notes: item.notes || ''
    })),
    reason: document.reason || ''
  };

  // Receipts carry a supplier, deliveries a customer, transfers both sides.
  if (counterparty === 'supplier') {
    mapped.supplier = document.supplier?.name || '';
    mapped.supplierCode = document.supplier?.code || '';
  }

  if (counterparty === 'customer') {
    mapped.customer = document.customer?.name || '';
    mapped.customerCode = document.customer?.code || '';
  }

  if (document.from || document.to) {
    mapped.from = {
      warehouse: refName(document.from?.warehouse),
      warehouseId: document.from?.warehouse?._id || document.from?.warehouse || '',
      location: document.from?.location || ''
    };
    mapped.to = {
      warehouse: refName(document.to?.warehouse),
      warehouseId: document.to?.warehouse?._id || document.to?.warehouse || '',
      location: document.to?.location || ''
    };
  }

  return mapped;
};

/**
 * Maps a ledger entry to a movement row.
 *
 * A ledger entry records one side of a movement at one place, so "from" and
 * "to" are derived from the sign of the quantity and the type of operation: a
 * receipt arrives from a supplier, a delivery leaves to a customer, and half of
 * a transfer leaves while the other half arrives. Every entry here belongs to a
 * posted document, so the status is always done.
 */
export const mapMovement = (entry = {}) => {
  const operationType = entry.operationType || '';
  const location = entry.location || '';
  const isInbound = Number(entry.quantity) > 0;

  let fromLocation = '—';
  let toLocation = '—';

  if (operationType === 'receipt') {
    fromLocation = 'Supplier';
    toLocation = location;
  } else if (operationType === 'delivery') {
    fromLocation = location;
    toLocation = 'Customer';
  } else if (operationType === 'transfer') {
    fromLocation = isInbound ? 'Source' : location;
    toLocation = isInbound ? location : 'Destination';
  } else if (operationType === 'adjustment') {
    fromLocation = isInbound ? 'Adjustment' : location;
    toLocation = isInbound ? location : 'Adjustment';
  } else {
    fromLocation = isInbound ? '—' : location;
    toLocation = isInbound ? location : '—';
  }

  return {
    _id: entry._id,
    reference: entry.operationRef || '',
    movementType: operationType.toUpperCase(),
    operationType,
    product: refName(entry.product),
    productId: entry.product?._id || entry.product || '',
    quantity: entry.quantity ?? 0,
    balanceAfter: entry.balanceAfter ?? null,
    // For a count, the ledger holds all three figures: the entry's own change is
    // the difference, and the balance it landed on is the counted total, so the
    // recorded figure is the difference between them.
    recordedQuantity:
      operationType === 'adjustment' ? (entry.balanceAfter ?? 0) - (entry.quantity ?? 0) : null,
    physicalQuantity: operationType === 'adjustment' ? (entry.balanceAfter ?? null) : null,
    difference: operationType === 'adjustment' ? (entry.quantity ?? 0) : null,
    fromLocation,
    toLocation,
    warehouse: refName(entry.warehouse),
    location,
    performedBy: refName(entry.performedBy),
    notes: entry.notes || '',
    reason: entry.reason || '',
    status: 'DONE',
    date: entry.occurredAt || entry.createdAt
  };
};

/** Maps a product for the low stock table, which reads the balance as currentStock. */
export const mapLowStockProduct = (product = {}) => ({
  ...product,
  currentStock: product.quantity ?? 0
});

const listOf = (payload) => (Array.isArray(payload) ? payload : []);

/* ------------------------------------------------------------------ reads */

export const listOperations = async (path, { counterparty, params } = {}) => {
  const response = await api.get(`/${path}`, { params });

  return {
    ...response.data,
    data: listOf(response.data?.data).map((document) => mapOperation(document, { counterparty }))
  };
};

export const getOperation = async (path, id, { counterparty } = {}) => {
  const response = await api.get(`/${path}/${id}`);

  return {
    ...response.data,
    data: response.data?.data ? mapOperation(response.data.data, { counterparty }) : null
  };
};

export const getMovements = async (params = {}) => {
  const response = await api.get('/stock/movements', { params });

  return {
    ...response.data,
    data: listOf(response.data?.data).map(mapMovement)
  };
};

/**
 * Where one product is held, with the balance at each place.
 *
 * Read from the ledger rather than from the product's cached total, so the
 * figure shown against a location is the balance recorded there and not a sum
 * across the whole catalogue.
 */
export const getProductStock = async (productId) => {
  const response = await api.get(`/stock/product/${productId}`);

  return response.data?.data || { product: null, locations: [] };
};

/* ----------------------------------------------------------------- writes */

export const createOperation = async (path, payload, { counterparty } = {}) => {
  const response = await api.post(`/${path}`, payload);

  return {
    ...response.data,
    data: response.data?.data ? mapOperation(response.data.data, { counterparty }) : null
  };
};

export const updateOperation = async (path, id, payload, { counterparty } = {}) => {
  const response = await api.put(`/${path}/${id}`, payload);

  return {
    ...response.data,
    data: response.data?.data ? mapOperation(response.data.data, { counterparty }) : null
  };
};

/**
 * Steps a document's status.
 *
 * Status is the one field the API will not accept from a document body, so it
 * is sent on its own rather than as part of an update.
 */
export const transitionOperation = async (path, id, status, { counterparty } = {}) => {
  const response = await api.patch(`/${path}/${id}`, { status });

  return {
    ...response.data,
    data: response.data?.data ? mapOperation(response.data.data, { counterparty }) : null
  };
};

/**
 * Applies a ready document to stock.
 *
 * This is the only call that moves stock, and it is deliberately not a status
 * patch: the server runs the balance check, writes the ledger and marks the
 * document done, so the client never decides that stock has moved.
 */
export const postOperation = async (path, id, { counterparty } = {}) => {
  const response = await api.post(`/${path}/${id}/post`);

  return {
    ...response.data,
    data: response.data?.data ? mapOperation(response.data.data, { counterparty }) : null
  };
};

export const cancelOperation = async (path, id, reason = '', { counterparty } = {}) => {
  const response = await api.post(`/${path}/${id}/cancel`, { reason });

  return {
    ...response.data,
    data: response.data?.data ? mapOperation(response.data.data, { counterparty }) : null
  };
};

export const deleteOperation = async (path, id) => {
  const response = await api.delete(`/${path}/${id}`);

  return response.data;
};
