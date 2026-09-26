/**
 * Translates the dashboard filter bar's display values into API values.
 *
 * The selects are built from static option lists, so they submit what the user
 * reads ("Delivery Orders", "Internal Transfers", "Ready", "All") rather than
 * the stored value. Mapping that here means the API only ever receives stored
 * values, and "All" is dropped instead of being sent as a filter the server
 * would reject.
 */

const ALL = 'all';

const isUnset = (value) => {
  if (value === undefined || value === null) return true;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '' || normalized === ALL;
};

const DOCUMENT_TYPE_MAP = {
  'receipts': 'receipt',
  'delivery orders': 'delivery',
  'internal transfers': 'transfer',
  'inventory adjustments': 'adjustment'
};

/**
 * Drops "All" and empty values, lowercases the rest and renames the document
 * type to its stored value. Returns undefined when nothing is filtered, so the
 * caller can omit the params entirely rather than sending blanks.
 */
export const parseDashboardFilters = (filters = {}) => {
  const params = {};

  if (!isUnset(filters.documentType)) {
    const key = String(filters.documentType).trim().toLowerCase();
    const mapped = DOCUMENT_TYPE_MAP[key];

    if (mapped) {
      params.documentType = mapped;
    }
  }

  if (!isUnset(filters.status)) {
    params.status = String(filters.status).trim().toLowerCase();
  }

  if (!isUnset(filters.location)) {
    params.location = String(filters.location).trim();
  }

  if (!isUnset(filters.category)) {
    params.category = String(filters.category).trim();
  }

  return Object.keys(params).length > 0 ? params : undefined;
};
