import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta, parseEnumParam } from '../utils/query.js';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_VALUES } from '../utils/enums.js';
import { postMovements, getBalances, streamKey } from './stock.service.js';
import { nextReference } from './reference.service.js';
import { isDuplicateKeyError, parseObjectId } from './operationRefs.service.js';

/**
 * The lifecycle every operational document shares: receipts, deliveries,
 * transfers and adjustments differ only in what they move and what extra fields
 * they carry. Modelling that once means a change to posting, permissions or the
 * status machine lands on all four at the same time instead of four times.
 *
 * A type is described by an adapter rather than by subclassing, because the
 * differences are data (which model, which fields, which movements) and not
 * behaviour.
 */

const MAX_REFERENCE_ATTEMPTS = 5;

/**
 * Builds the service object for one document type.
 *
 * @param {object}   args
 * @param {object}   args.Model            Mongoose model for the type.
 * @param {string}   args.prefix           Reference prefix, e.g. "RCP".
 * @param {string}   args.operationType    OPERATION_TYPE value written to ledger entries.
 * @param {string}   args.label            Human name used in messages, e.g. "receipt".
 * @param {Function} args.prepareInput     Async ({ input, mode, existing }) => payload.
 * @param {Function} args.toMovements      (document) => [{ product, warehouse, location, quantity, notes }].
 * @param {Function} [args.beforePost]     Async (document) => document, run after validation and
 *                                         before the ledger is written.
 * @param {object}   [args.listFilter]     Extra query params accepted by list().
 */
export const createOperationService = ({
  Model,
  prefix,
  operationType,
  label,
  prepareInput,
  toMovements,
  beforePost,
  listFilter = () => ({})
}) => {
  const loadDocument = async (id) => {
    const _id = parseObjectId(id, `${label} id`);
    const document = await Model.findById(_id);

    if (!document) {
      throw ApiError.notFound(`${label[0].toUpperCase()}${label.slice(1)} not found`);
    }

    return document;
  };

  const requireEditable = (document) => {
    if (!document.isEditable()) {
      throw ApiError.conflict(
        `${document.reference} is ${document.status} and can no longer be edited. ` +
          'Only a draft can be changed.'
      );
    }
  };

  /**
   * Moves a document along the draft -> waiting -> ready -> done workflow.
   *
   * The transition is refused if the state machine does not allow it, and moving
   * to "done" is routed through the posting engine so stock is never changed by a
   * bare status update.
   */
  const transition = async ({ id, to, userId, note = '' }) => {
    const document = await loadDocument(id);

    if (!document.canTransitionTo(to)) {
      throw ApiError.conflict(
        `${document.reference} cannot move from "${document.status}" to "${to}".`
      );
    }

    const from = document.status;
    document.status = to;
    document.statusHistory.push({ from, to, by: userId, note });

    if (to === DOCUMENT_STATUS.CANCELED) {
      document.canceledAt = new Date();
      document.cancelReason = note;
    }

    await document.save();
    return document;
  };

  /**
   * Applies the document to stock.
   *
   * Delegates to the posting engine, which owns the ledger write, the
   * idempotency guard and the product cache rebuild. Nothing here writes stock
   * directly.
   */
  const post = async ({ id, userId }) => {
    const document = await loadDocument(id);

    if (document.status === DOCUMENT_STATUS.DONE) {
      // Checked before the transition below, because canTransitionTo treats
      // "already in that state" as allowed. Without this, re-posting a posted
      // document would return success without moving stock, which reads as if the
      // stock had been counted twice.
      throw ApiError.conflict(`${document.reference} has already been posted.`);
    }

    if (document.status !== DOCUMENT_STATUS.READY) {
      // A draft or waiting document can still be posted in one step, which is
      // what PATCH status=done does.
      if (document.canTransitionTo(DOCUMENT_STATUS.DONE)) {
        const moved = await transition({ id, to: DOCUMENT_STATUS.DONE, userId });
        return { document: moved, entries: 0, replayed: false };
      }

      throw ApiError.conflict(
        `${document.reference} must be in "${DOCUMENT_STATUS.READY}" before it can be posted. It is currently "${document.status}".`
      );
    }

    const prepared = beforePost ? await beforePost(document) : document;
    const result = await postMovements({
      document: prepared,
      operationModel: Model.modelName,
      operationType,
      movements: toMovements(prepared),
      performedBy: userId
    });

    return { document: result.document, entries: result.entries, replayed: result.replayed };
  };

  return {
    /**
     * Lists documents, newest first, with the same envelope as every other list
     * endpoint in the API.
     */
    list: async ({ page, limit, skip, query = {} }) => {
      const status = parseEnumParam(query.status, DOCUMENT_STATUS_VALUES, 'status');
      const search = query.search ? String(query.search).trim() : '';

      const filter = { ...listFilter(query) };
      if (status) filter.status = status;
      if (search) {
        // Reference is the code an operator searches by. Escaped and anchored
        // so a stray character is matched literally.
        const pattern = `^${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
        filter.reference = { $regex: pattern, $options: 'i' };
      }

      const [documents, total] = await Promise.all([
        Model.find(filter)
          .sort({ documentDate: -1, _id: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Model.countDocuments(filter)
      ]);

      return { documents, pagination: buildPaginationMeta({ page, limit, total }) };
    },

    getById: loadDocument,

    /**
     * Creates a document in draft.
     *
     * A document always starts as a draft: creating one never moves stock, so
     * the caller has to walk it to "ready" and post it deliberately.
     */
    create: async ({ input, userId }) => {
      const payload = await prepareInput({ input, mode: 'create' });

      payload.status = DOCUMENT_STATUS.DRAFT;
      payload.createdBy = userId;

      // The reference is claimed from a counter rather than generated inline, and
      // a collision is retried with the next number. A duplicate key here can only
      // be the reference, since products and warehouses have their own messages.
      for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt += 1) {
        payload.reference = input.reference || (await nextReference(prefix));

        try {
          return await Model.create(payload);
        } catch (error) {
          if (isDuplicateKeyError(error) && !input.reference) continue;
          throw error;
        }
      }

      throw ApiError.conflict(
        `Could not allocate a unique ${prefix} reference. Try again in a moment.`
      );
    },

    /**
     * Moves a document along the draft -> waiting -> ready -> done workflow.
     * Defined above as a const so post() and cancel() can call it directly
     * instead of through `this`, which is not bound when a method is passed
     * around as a bare function.
     */
    transition,

    /**
     * Applies a document to stock. Also defined above as a const, because
     * transition() calls it when the target status is "done".
     */
    post,

    /**
     * Replaces the editable content of a draft.
     *
     * Status, reference, posting metadata and audit fields are never writable
     * from the body, so a caller cannot edit a document into a state it could
     * not legitimately reach.
     */
    update: async ({ id, input, userId }) => {
      const document = await loadDocument(id);
      requireEditable(document);

      const payload = await prepareInput({ input, mode: 'update', existing: document });

      Object.assign(document, payload, {
        reference: document.reference,
        status: document.status,
        createdBy: document.createdBy,
        updatedBy: userId
      });

      return document.save();
    },

    /**
     * Cancels a document that has not been posted.
     *
     * A posted document cannot be cancelled, because the ledger has already
     * recorded the movement; reversing it is a separate document, which is how
     * the ledger stays append only.
     */
    cancel: async ({ id, userId, reason = '' }) => {
      const document = await loadDocument(id);

      if (document.status === DOCUMENT_STATUS.DONE) {
        throw ApiError.conflict(
          `${document.reference} has already moved stock and cannot be canceled. ` +
            `Post a reversing ${label} instead.`
        );
      }

      return transition({
        id,
        to: DOCUMENT_STATUS.CANCELED,
        userId,
        note: reason
      });
    },

    /**
     * Removes a document that has never been posted.
     *
     * Documents are not deleted once posted, so the ledger can always be traced
     * back to the document that caused each movement.
     */
    remove: async ({ id }) => {
      const document = await loadDocument(id);

      if (document.status === DOCUMENT_STATUS.DONE) {
        throw ApiError.conflict(
          `${document.reference} has already moved stock and cannot be deleted. Cancel it instead.`
        );
      }

      await document.deleteOne();
    },

    /**
     * Current balances for a document's lines, so a form can show what is
     * actually on hand next to what the operator is about to enter.
     */
    stockPreview: async ({ id }) => {
      const document = await loadDocument(id);
      const movements = toMovements(document);
      const balances = await getBalances(movements);

      return movements.map((movement) => ({
        ...movement,
        available: balances.get(streamKey(movement)) ?? 0
      }));
    }
  };
};
