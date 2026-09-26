import { getMovements } from '../../services/inventoryApi';

/**
 * Move History, read from the stock ledger.
 *
 * The ledger lives at /api/stock/movements. The previous version of this file
 * asked for /move-history, which is not a route the API serves, so every call
 * fell through to demo rows and Move History showed stock that had never moved.
 *
 * The list filters in the browser rather than on the server, because its
 * controls are text inputs (a product name, a warehouse name) while the ledger
 * filters are keyed on ids. A cap is therefore requested explicitly: the API
 * defaults to 20 rows a page, which would silently truncate the table.
 */

const DEFAULT_LIMIT = 100;

export const getMoveHistory = (params = {}) =>
  getMovements({ limit: DEFAULT_LIMIT, ...params });

export { DEFAULT_LIMIT };
