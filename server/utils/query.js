/**
 * Shared helpers for building list responses. Kept separate from the response
 * envelope so the two concerns do not get mixed together.
 */

import ApiError from './ApiError.js';

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

/**
 * Reads a query param that must be one of a known set of values.
 *
 * An unrecognised value is rejected with a 400 rather than quietly ignored: a
 * filter that is silently dropped returns a full unfiltered result set, which
 * reads as "no matches for that filter" and is worse than an explicit error.
 * Returns undefined when the param is absent or empty, so callers can use a
 * plain truthiness check.
 */
export const parseEnumParam = (value, allowed, label) => {
  if (value === undefined || value === null || value === '') return undefined;

  const normalized = String(value).trim().toLowerCase();
  if (!allowed.includes(normalized)) {
    throw ApiError.badRequest(
      `Invalid ${label} '${value}'. Expected one of: ${allowed.join(', ')}.`
    );
  }

  return normalized;
};

/**
 * Reads a numeric query param such as minPrice, clamped to a lower bound.
 *
 * Unlike Number.parseInt this rejects "12abc" and "abc" outright instead of
 * quietly reading them as 12 and 0, so a malformed range cannot widen a filter
 * into something the caller did not ask for.
 */
export const parseNonNegativeNumber = (value, label, { min = 0 } = {}) => {
  if (value === undefined || value === null || value === '') return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw ApiError.badRequest(`${label} must be a number.`);
  }

  if (parsed < min) {
    throw ApiError.badRequest(`${label} cannot be less than ${min}.`);
  }

  return parsed;
};

/**
 * Case-insensitive exact match on a string field.
 *
 * Anchored so a filter value can never behave as a pattern, and routed through
 * escapeRegex so the value is matched literally even if it contains regex
 * metacharacters.
 */
export const exactMatch = (value) => ({
  $regex: `^${escapeRegex(String(value).trim())}$`,
  $options: 'i',
});
