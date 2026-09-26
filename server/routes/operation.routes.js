import express from 'express';
import { createOperationController } from '../controllers/operation.controller.js';
import { operationServices } from '../services/operation.types.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

/**
 * One router per document type, all generated from the same template.
 *
 * The permission split follows who does what in the spec: warehouse staff
 * perform the day to day operations (receiving, picking, transfers, counts), and
 * only a manager creates them. Reading is open to any signed in user, since
 * everyone needs to see stock movements.
 */
const buildRouter = (modelName, { label, create: canCreate }) => {
  const service = operationServices[modelName];
  const controller = createOperationController(service, { label });
  const router = express.Router();

  router.use(protect);

  router.route('/').get(controller.list);
  router.route('/:id').get(controller.getById);
  router.route('/:id/stock').get(controller.stockPreview);

  // authorize() is variadic, so the role list has to be spread. Passing the
  // array itself would nest it and roles.includes(role) would never match,
  // locking out every role including the right one.
  const mayCreate = authorize(...canCreate);

  router
    .route('/')
    .post(mayCreate, controller.create);

  router
    .route('/:id')
    .put(mayCreate, controller.update)
    .patch(controller.transition)
    .delete(mayCreate, controller.remove);

  router.post('/:id/post', controller.post);
  router.post('/:id/cancel', controller.cancel);

  return router;
};

export const receiptRouter = buildRouter('Receipt', {
  label: 'receipt',
  create: ['inventory_manager', 'warehouse_staff']
});

export const deliveryRouter = buildRouter('Delivery', {
  label: 'delivery',
  create: ['inventory_manager', 'warehouse_staff']
});

export const transferRouter = buildRouter('Transfer', {
  label: 'transfer',
  create: ['inventory_manager', 'warehouse_staff']
});

// A count changes the book record, so it is limited to managers.
export const adjustmentRouter = buildRouter('Adjustment', {
  label: 'adjustment',
  create: ['inventory_manager']
});
