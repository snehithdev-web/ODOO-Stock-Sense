import Receipt from '../models/receipt.model.js';
import Delivery from '../models/delivery.model.js';
import Transfer from '../models/transfer.model.js';
import Adjustment from '../models/adjustment.model.js';
import { createOperationService } from './operation.service.js';
import { PREFIXES } from './reference.service.js';
import { resolveLocation, resolveItems } from './operationRefs.service.js';
import { getBalances, streamKey } from './stock.service.js';
import { OPERATION_TYPE, DOCUMENT_STATUS } from '../utils/enums.js';
import ApiError from '../utils/ApiError.js';

/**
 * The four operational document types, described as data.
 *
 * Each entry supplies the fields it accepts, how to turn a stored document into
 * the stock movements it represents, and where those movements go. Everything
 * else - the status machine, posting, permissions, pagination - is shared, so the
 * four behave identically where the spec treats them identically.
 */

/**
 * Reads the items array, rejecting anything that is not a positive quantity.
 *
 * A zero or negative quantity on a receipt line is meaningless rather than
 * merely unusual, and accepting it would let a document post a movement of 0 or
 * an opposite-signed one, which the posting engine would then have to special
 * case.
 */
const readQuantities = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('A document must contain at least one item');
  }

  return items.map((item, index) => {
    const quantity = Number(item.quantity);

    if (!Number.isFinite(quantity)) {
      throw ApiError.badRequest(`Item ${index + 1} needs a numeric quantity`);
    }

    if (quantity <= 0) {
      throw ApiError.badRequest(
        `Item ${index + 1} must have a quantity greater than zero. ` +
          'Use an adjustment to record damaged or missing stock.'
      );
    }

    return { product: item.product, quantity, notes: item.notes || '' };
  });
};

/**
 * Resolves a single warehouse/location pair on the document.
 */
const resolveSingle = async (input, label) => {
  const { warehouse, location } = input;
  return resolveLocation({ warehouse, location, label });
};

// ---------------------------------------------------------------- receipts

const receiptService = createOperationService({
  Model: Receipt,
  prefix: PREFIXES.RECEIPT,
  operationType: OPERATION_TYPE.RECEIPT,
  label: 'receipt',

  prepareInput: async ({ input }) => {
    const items = readQuantities(input.items);
    await resolveItems(items);
    const destination = await resolveSingle(input, 'destination');

    return {
      supplier: {
        name: input.supplier?.name,
        code: input.supplier?.code || ''
      },
      warehouse: destination.warehouse,
      location: destination.location,
      items,
      documentDate: input.documentDate || new Date(),
      notes: input.notes || ''
    };
  },

  // Inbound: every line adds stock to the one destination.
  toMovements: (document) =>
    document.items.map((item) => ({
      product: item.product,
      warehouse: document.warehouse,
      location: document.location,
      quantity: item.quantity,
      notes: item.notes
    })),

  listFilter: (query) =>
    query.warehouse ? { warehouse: query.warehouse } : {}
});

// ---------------------------------------------------------------- deliveries

const deliveryService = createOperationService({
  Model: Delivery,
  prefix: PREFIXES.DELIVERY,
  operationType: OPERATION_TYPE.DELIVERY,
  label: 'delivery',

  prepareInput: async ({ input }) => {
    const items = readQuantities(input.items);
    await resolveItems(items);
    const source = await resolveSingle(input, 'source');

    return {
      customer: {
        name: input.customer?.name,
        code: input.customer?.code || ''
      },
      warehouse: source.warehouse,
      location: source.location,
      items,
      documentDate: input.documentDate || new Date(),
      notes: input.notes || ''
    };
  },

  // Outbound: every line removes stock from the one source. The quantities are
  // negated here rather than in the posting engine, which stays sign agnostic.
  toMovements: (document) =>
    document.items.map((item) => ({
      product: item.product,
      warehouse: document.warehouse,
      location: document.location,
      quantity: -item.quantity,
      notes: item.notes
    })),

  listFilter: (query) =>
    query.warehouse ? { warehouse: query.warehouse } : {}
});

// ---------------------------------------------------------------- transfers

const transferService = createOperationService({
  Model: Transfer,
  prefix: PREFIXES.TRANSFER,
  operationType: OPERATION_TYPE.TRANSFER,
  label: 'transfer',

  prepareInput: async ({ input }) => {
    const items = readQuantities(input.items);
    await resolveItems(items);

    const from = await resolveLocation({
      warehouse: input.from?.warehouse,
      location: input.from?.location,
      label: 'source'
    });
    const to = await resolveLocation({
      warehouse: input.to?.warehouse,
      location: input.to?.location,
      label: 'destination'
    });

    return {
      from: { warehouse: from.warehouse, location: from.location },
      to: { warehouse: to.warehouse, location: to.location },
      items,
      documentDate: input.documentDate || new Date(),
      notes: input.notes || ''
    };
  },

  /**
   * The two-entry rule: one negative movement out of the source and one positive
   * movement into the destination, in that order.
   *
   * Order matters for the balance check. Taking the stock out first means a
   * transfer is validated against the balance it is actually spending, and the
   * paired addition can never mask an overdraft in the source.
   */
  toMovements: (document) => {
    const out = document.items.map((item) => ({
      product: item.product,
      warehouse: document.from.warehouse,
      location: document.from.location,
      quantity: -item.quantity,
      notes: item.notes
    }));

    const inbound = document.items.map((item) => ({
      product: item.product,
      warehouse: document.to.warehouse,
      location: document.to.location,
      quantity: item.quantity,
      notes: item.notes
    }));

    return [...out, ...inbound];
  },

  listFilter: (query) => {
    if (!query.warehouse) return {};
    return {
      $or: [{ 'from.warehouse': query.warehouse }, { 'to.warehouse': query.warehouse }]
    };
  }
});

// ---------------------------------------------------------------- adjustments

const adjustmentService = createOperationService({
  Model: Adjustment,
  prefix: PREFIXES.ADJUSTMENT,
  operationType: OPERATION_TYPE.ADJUSTMENT,
  label: 'adjustment',

  /**
   * Builds count lines from what the operator physically counted.
   *
   * The client sends only product, countedQuantity and notes. recordedQuantity is
   * taken from the live balance rather than accepted from the body, because a
   * client that supplies its own "recorded" figure is asserting a baseline it has
   * no way of knowing is current. A line whose count matches the recorded figure
   * is rejected, because posting a zero delta only adds noise to the ledger.
   */
  prepareInput: async ({ input }) => {
    const raw = Array.isArray(input.items) ? input.items : [];

    if (raw.length === 0) {
      throw ApiError.badRequest('An adjustment must contain at least one item');
    }

    const seen = new Set();
    for (const [index, item] of raw.entries()) {
      const id = String(item.product);
      if (seen.has(id)) {
        throw ApiError.badRequest(
          `The same product is listed more than once (item ${index + 1}). ` +
            'Combine the counts into a single line.'
        );
      }
      seen.add(id);
    }

    await resolveItems(raw, { label: 'count line' });

    const { warehouse, location } = await resolveSingle(input, 'counted');

    const counted = raw.map((item, index) => {
      const value = Number(item.countedQuantity);
      if (!Number.isFinite(value) || value < 0) {
        throw ApiError.badRequest(
          `Item ${index + 1} needs a counted quantity of zero or more`
        );
      }
      return { product: item.product, countedQuantity: value, notes: item.notes || '' };
    });

    const balances = await getBalances(
      counted.map((item) => ({ product: item.product, warehouse, location }))
    );

    const items = counted.map((item, index) => {
      const recordedQuantity =
        balances.get(streamKey({ product: item.product, warehouse, location })) ?? 0;

      if (recordedQuantity === item.countedQuantity) {
        throw ApiError.badRequest(
          `Item ${index + 1} was counted as ${item.countedQuantity}, which already matches ` +
            'the recorded stock at that location. Remove the line, or correct the count.'
        );
      }

      return {
        product: item.product,
        recordedQuantity,
        countedQuantity: item.countedQuantity,
        delta: item.countedQuantity - recordedQuantity,
        notes: item.notes
      };
    });

    return {
      warehouse,
      location,
      reason: input.reason,
      items,
      documentDate: input.documentDate || new Date(),
      notes: input.notes || ''
    };
  },

  /**
   * A count is a statement about the world at the moment of the count, so the
   * recorded side is re-read when the document is posted rather than trusted from
   * draft time.
   *
   * A receipt posted between drafting and posting this adjustment would otherwise
   * make the delta stale and the system would land somewhere other than the
   * number that was physically counted. Re-deriving here means the outcome is
   * always "the recorded stock now equals the count".
   */
  beforePost: async (document) => {
    if (document.status !== DOCUMENT_STATUS.READY) return document;

    const balances = await getBalances(
      document.items.map((item) => ({
        product: item.product,
        warehouse: document.warehouse,
        location: document.location
      }))
    );

    document.items.forEach((item) => {
      const recordedQuantity =
        balances.get(
          streamKey({ product: item.product, warehouse: document.warehouse, location: document.location })
        ) ?? 0;

      if (recordedQuantity !== item.recordedQuantity) {
        item.recordedQuantity = recordedQuantity;
        item.delta = item.countedQuantity - recordedQuantity;
      }
    });

    if (document.items.every((item) => item.delta === 0)) {
      throw ApiError.badRequest(
        `${document.reference} no longer changes anything: every counted quantity now matches ` +
          'the recorded stock. Cancel the adjustment instead of posting it.'
      );
    }

    return document;
  },

  // A recount moves stock by the difference, in whichever direction that is.
  toMovements: (document) =>
    document.items.map((item) => ({
      product: item.product,
      warehouse: document.warehouse,
      location: document.location,
      quantity: item.delta,
      notes: item.notes
    })),

  listFilter: (query) =>
    query.warehouse ? { warehouse: query.warehouse } : {}
});

export { receiptService, deliveryService, transferService, adjustmentService };

export const operationServices = {
  Receipt: receiptService,
  Delivery: deliveryService,
  Transfer: transferService,
  Adjustment: adjustmentService
};
