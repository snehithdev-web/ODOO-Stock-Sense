/**
 * Shared helpers for building list responses. Kept separate from the response
 * envelope so the two concerns do not get mixed together.
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Reads ?page and ?limit into a Mongo skip/limit pair, clamped to sane bounds
 * so a caller cannot ask for an unbounded result set.
 */
export const buildPagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Pagination block returned alongside a list, so the client knows whether to
 * ask for another page.
 */
export const buildPaginationMeta = ({ page, limit, total }) => {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
};

/**
 * Escapes a user supplied string before it goes into a $regex, so a search of
 * "[" is treated as a literal character instead of an invalid pattern, and a
 * pathological pattern cannot be used to stall the database.
 */
export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Normalises the loose query string flags these list endpoints accept.
 * Anything unrecognised is simply ignored rather than treated as truthy.
 */
export const parseBooleanFlag = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};
