import { buildPagination } from '../utils/query.js';
import { sendSuccess } from '../utils/response.js';
import { DOCUMENT_STATUS_VALUES } from '../utils/enums.js';
import ApiError from '../utils/ApiError.js';

/**
 * Controllers for the four operational document types.
 *
 * Generated from a factory because the routes are identical apart from the
 * service they call. Every handler keeps the same try/catch shape as the rest of
 * the codebase, so a failure reaches error.middleware.js unchanged.
 */
export const createOperationController = (service, { label }) => {
  const Title = label[0].toUpperCase() + label.slice(1);

  return {
    list: async (req, res, next) => {
      try {
        const { page, limit, skip } = buildPagination(req.query);
        const { documents, pagination } = await service.list({
          page,
          limit,
          skip,
          query: req.query
        });

        return sendSuccess(res, {
          message: `${Title}s retrieved successfully`,
          data: documents,
          pagination
        });
      } catch (error) {
        next(error);
      }
    },

    getById: async (req, res, next) => {
      try {
        const document = await service.getById(req.params.id);
        return sendSuccess(res, {
          message: `${Title} retrieved successfully`,
          data: document
        });
      } catch (error) {
        next(error);
      }
    },

    create: async (req, res, next) => {
      try {
        const document = await service.create({ input: req.body, userId: req.user._id });
        return sendSuccess(res, {
          message: `${Title} ${document.reference} created as a draft`,
          statusCode: 201,
          data: document
        });
      } catch (error) {
        next(error);
      }
    },

    update: async (req, res, next) => {
      try {
        const document = await service.update({
          id: req.params.id,
          input: req.body,
          userId: req.user._id
        });
        return sendSuccess(res, {
          message: `${Title} ${document.reference} updated successfully`,
          data: document
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Steps a document along its workflow.
     *
     * PATCH rather than PUT, because the body names the target status instead of
     * replacing the document. An unrecognized status is a 400 rather than a
     * silent no-op, so a typo cannot read as a successful transition.
     */
    transition: async (req, res, next) => {
      try {
        const to = String(req.body.status || '').trim().toLowerCase();

        if (!to) {
          throw ApiError.badRequest('A target status is required');
        }

        if (!DOCUMENT_STATUS_VALUES.includes(to)) {
          throw ApiError.badRequest(
            `Invalid status '${req.body.status}'. Expected one of: ${DOCUMENT_STATUS_VALUES.join(', ')}.`
          );
        }

        const document = await service.transition({
          id: req.params.id,
          to,
          userId: req.user._id,
          note: req.body.note || ''
        });

        return sendSuccess(res, {
          message: `${Title} ${document.reference} is now "${document.status}"`,
          data: document
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Applies a document to stock.
     */
    post: async (req, res, next) => {
      try {
        const result = await service.post({ id: req.params.id, userId: req.user._id });
        const document = result.document;

        return sendSuccess(res, {
          message: result.replayed
            ? `${Title} ${document.reference} was already posted; stock is unchanged`
            : `${Title} ${document.reference} posted. ${result.entries} stock movement(s) recorded.`,
          data: { document, movements: result.entries, replayed: result.replayed }
        });
      } catch (error) {
        next(error);
      }
    },

    cancel: async (req, res, next) => {
      try {
        const document = await service.cancel({
          id: req.params.id,
          userId: req.user._id,
          reason: req.body.reason || ''
        });

        return sendSuccess(res, {
          message: `${Title} ${document.reference} canceled`,
          data: document
        });
      } catch (error) {
        next(error);
      }
    },

    remove: async (req, res, next) => {
      try {
        await service.remove({ id: req.params.id });
        return sendSuccess(res, {
          message: `${Title} deleted successfully`,
          data: null
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * What is actually on hand at each line's location, so an operator can see
     * availability before committing a document.
     */
    stockPreview: async (req, res, next) => {
      try {
        const lines = await service.stockPreview({ id: req.params.id });
        return sendSuccess(res, {
          message: 'Current stock for each line retrieved successfully',
          data: lines
        });
      } catch (error) {
        next(error);
      }
    }
  };
};
