import express from 'express';
import {
  listMovements,
  getStockByLocation,
  getStockTrail,
  reconcile,
  checkIndexes
} from '../services/stockQuery.service.js';
import { sendSuccess } from '../utils/response.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

/**
 * Stock ledger reads: Move History, per-location balances, and reconciliation.
 *
 * Every path here is a read except POST /reconcile, which rewrites the
 * Product.quantity cache back to what the ledger says. The ledger itself is
 * never written through these routes; only posting a document can append to it.
 */
const router = express.Router();

router.use(protect);

// Move History. Declared before the parameterised paths so "reconcile" and
// "indexes" are not captured as a product or warehouse id.
router.get('/movements', async (req, res, next) => {
  try {
    const { movements, pagination } = await listMovements(req.query);

    return sendSuccess(res, {
      message: 'Stock movements retrieved successfully',
      data: movements,
      pagination
    });
  } catch (error) {
    next(error);
  }
});

// Where one product is held.
router.get('/product/:productId', async (req, res, next) => {
  try {
    const data = await getStockByLocation(req.params.productId);

    return sendSuccess(res, {
      message: 'Stock by location retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
});

// Balance and full history for one product in one place.
router.get(
  '/product/:productId/warehouse/:warehouseId/location/:location',
  async (req, res, next) => {
    try {
      const data = await getStockTrail({
        productId: req.params.productId,
        warehouseId: req.params.warehouseId,
        location: req.params.location
      });

      return sendSuccess(res, {
        message: 'Stock trail retrieved successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }
);

// Whether the unique postingKey index is in place. Posting depends on it, so it
// is worth being able to confirm without attempting a post.
router.get('/indexes', async (req, res, next) => {
  try {
    const data = await checkIndexes();

    return sendSuccess(res, {
      message: 'Ledger index check completed',
      data
    });
  } catch (error) {
    next(error);
  }
});

// Rebuilds the product quantity cache from the ledger. Manager only, because it
// rewrites a field on every product.
router.post('/reconcile', authorize('inventory_manager'), async (req, res, next) => {
  try {
    const data = await reconcile({ productIds: req.body?.productIds });

    return sendSuccess(res, {
      message: `Rebuilt product quantities from the ledger for ${data.rebuilt} product(s)`,
      data
    });
  } catch (error) {
    next(error);
  }
});

export default router;
