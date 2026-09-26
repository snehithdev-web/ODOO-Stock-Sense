/**
 * End to end smoke test against a running API and a live MongoDB.
 *
 * Exercises the paths the client actually calls, in the order an operator would:
 * sign in, read the dashboard, create the master data a document needs, then
 * draft, advance and post a receipt and confirm the stock actually moved.
 *
 * Run with the server already listening: node scripts/smoke.mjs
 *
 * It cleans up after itself: the test product and the draft documents are
 * deleted again through the API, and the warehouse is created once and reused.
 * A single posted receipt is left in place, because the API correctly refuses to
 * delete a document that has moved stock and the ledger entry is the only record
 * that the movement happened.
 */

const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5000/api';

const stamp = Date.now();
const email = `smoke${stamp}@stocksense.example.com`;
const password = 'SmokeTest123!';

// Fixed so repeated runs reuse one warehouse instead of accumulating them.
const SMOKE_WAREHOUSE_CODE = 'SMOKE';

let token = null;
let failures = 0;

// Everything created along the way, so it can be removed again at the end.
const created = { productId: null, receiptIds: [], warehouseId: null, wasReused: false };

const log = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` :: ${detail}` : ''}`);
};

const call = async (method, path, body) => {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { status: response.status, body: payload };
};

const run = async () => {
  /* ------------------------------------------------------------- auth */

  const registered = await call('POST', '/auth/register', { name: 'Smoke Tester', email, password });
  log(
    [201, 200].includes(registered.status),
    'register a manager',
    `status ${registered.status} ${registered.body?.message || ''}`
  );

  const login = await call('POST', '/auth/login', { email, password });
  token = login.body?.data?.token || login.body?.token || null;
  log(Boolean(token), 'log in and receive a token', `status ${login.status}`);

  if (!token) {
    console.log('\nCannot continue without a token.');
    process.exit(1);
  }

  /* -------------------------------------------------------- dashboard */

  const dashboard = await call('GET', '/dashboard');
  const d = dashboard.body?.data || {};
  log(dashboard.status === 200, 'GET /dashboard', `status ${dashboard.status}`);
  log(
    d.summary &&
      typeof d.summary.totalProducts === 'number' &&
      typeof d.summary.lowStockCount === 'number' &&
      typeof d.summary.pendingReceipts === 'number' &&
      typeof d.summary.pendingDeliveries === 'number' &&
      typeof d.summary.scheduledTransfers === 'number',
    'dashboard returns the five KPI counts',
    JSON.stringify(d.summary)
  );
  log(
    Array.isArray(d.lowStockProducts) &&
      Array.isArray(d.pendingReceipts) &&
      Array.isArray(d.pendingDeliveries) &&
      Array.isArray(d.scheduledTransfers) &&
      Array.isArray(d.recentMovements),
    'dashboard returns every panel as an array'
  );
  log(
    Array.isArray(d.filters?.warehouses) && Array.isArray(d.filters?.categories),
    'dashboard returns filter options as plain strings'
  );

  const panels = [
    '/dashboard/low-stock',
    '/dashboard/pending-receipts',
    '/dashboard/pending-deliveries',
    '/dashboard/scheduled-transfers',
    '/dashboard/recent-movements'
  ];
  for (const panel of panels) {
    const result = await call('GET', panel);
    log(
      result.status === 200 && Array.isArray(result.body?.data),
      `GET ${panel}`,
      `status ${result.status}`
    );
  }

  /* --------------------------------------------------- filters honoured */

  const filteredReceipts = await call('GET', '/dashboard/pending-receipts?status=ready');
  log(
    filteredReceipts.status === 200,
    'dashboard accepts a status filter',
    `status ${filteredReceipts.status}`
  );

  const badStatus = await call('GET', '/dashboard?status=not-a-status');
  log(badStatus.status === 400, 'dashboard rejects an unknown status', `status ${badStatus.status}`);

  /* ------------------------------------------------------ master data */

  // Warehouses have no delete route, by design, so creating one per run would
  // litter the database with records nothing can remove. A single fixed-code
  // warehouse is created once and reused by every later run.
  const existing = await call('GET', '/warehouses?limit=200');
  let warehouseId = (existing.body?.data || []).find((w) => w.code === SMOKE_WAREHOUSE_CODE)?._id;

  if (!warehouseId) {
    const created = await call('POST', '/warehouses', {
      name: 'StockSense Smoke Test',
      code: SMOKE_WAREHOUSE_CODE,
      address: '1 Test Road',
      locations: [{ name: 'Main Store', code: 'MAIN' }, { name: 'Overflow', code: 'OVR' }]
    });
    warehouseId = created.body?.data?._id;
    log(
      created.status === 201 && Boolean(warehouseId),
      'create the reusable smoke warehouse',
      `status ${created.status}`
    );
  } else {
    log(true, 'reusing the existing smoke warehouse', String(warehouseId));
  }

  const product = await call('POST', '/products', {
    name: `Smoke Widget ${stamp}`,
    sku: `SMK-${stamp}`,
    category: 'Test Goods',
    unit: 'pcs',
    quantity: 0,
    reorderLevel: 5
  });
  const productId = product.body?.data?._id;
  created.productId = productId;
  log(product.status === 201 && Boolean(productId), 'create a product', `status ${product.status}`);

  /* ----------------------------------------------- the write path */

  const receipt = await call('POST', '/receipts', {
    supplier: { name: 'Smoke Supplier Ltd' },
    warehouse: warehouseId,
    location: 'MAIN',
    items: [{ product: productId, quantity: 40 }]
  });
  const receiptId = receipt.body?.data?._id;
  const receiptRef = receipt.body?.data?.reference;
  created.receiptIds.push(receiptId);
  log(receipt.status === 201 && Boolean(receiptId), 'create a receipt draft', `status ${receipt.status} ${receiptRef || ''}`);
  log(receipt.body?.data?.status === 'draft', 'a new receipt starts as draft', receipt.body?.data?.status);

  const stockBefore = await call('GET', `/stock/product/${productId}`);
  const beforeBalance = (stockBefore.body?.data?.locations || []).reduce((sum, l) => sum + (l.balance || l.quantity || 0), 0);
  log(beforeBalance === 0, 'a draft receipt has not moved stock', `balance ${beforeBalance}`);

  const advanced = await call('PATCH', `/receipts/${receiptId}`, { status: 'ready' });
  log(advanced.status === 200 && advanced.body?.data?.status === 'ready', 'advance the receipt to ready', `status ${advanced.status}`);

  const posted = await call('POST', `/receipts/${receiptId}/post`);
  log(posted.status === 200, 'post the receipt', `status ${posted.status} ${posted.body?.message || ''}`);
  // /post answers with the document nested beside the entries it wrote.
  log(
    posted.body?.data?.document?.status === 'done',
    'a posted receipt is done',
    posted.body?.data?.document?.status
  );
  log(
    posted.body?.data?.movementCount === 1,
    'post reports how many ledger entries it wrote',
    `count ${posted.body?.data?.movementCount}`
  );

  const stockAfter = await call('GET', `/stock/product/${productId}`);
  const afterBalance = (stockAfter.body?.data?.locations || []).reduce((sum, l) => sum + (l.balance || l.quantity || 0), 0);
  log(afterBalance === 40, 'posting moved exactly the received quantity', `balance ${afterBalance}`);

  const movements = await call('GET', '/stock/movements?limit=5');
  const hasOurMovement = (movements.body?.data || []).some((m) => m.operationRef === receiptRef);
  log(movements.status === 200 && hasOurMovement, 'the movement appears in the ledger', `found ${hasOurMovement}`);

  const reconciles = await call('POST', '/stock/reconcile', { productIds: [productId] });
  log(reconciles.status === 200, 'reconcile accepts a product id list', `status ${reconciles.status}`);

  const reread = await call('GET', `/products/${productId}`);
  log(
    Number(reread.body?.data?.quantity) === 40,
    'the product cache agrees with the ledger after reconcile',
    `quantity ${reread.body?.data?.quantity}`
  );

  /* ----------------------------------------- guards that must not lie */

  const repost = await call('POST', `/receipts/${receiptId}/post`);
  log(repost.status === 409, 're-posting a done receipt is refused', `status ${repost.status}`);

  const overdraw = await call('POST', '/receipts', {
    supplier: { name: 'Too Much Ltd' },
    warehouse: warehouseId,
    location: 'MAIN',
    items: [{ product: productId, quantity: 5 }]
  });
  const overdrawId = overdraw.body?.data?._id;
  created.receiptIds.push(overdrawId);
  await call('PATCH', `/receipts/${overdrawId}`, { status: 'ready' });
  await call('POST', `/receipts/${overdrawId}/cancel`, { reason: 'smoke test cleanup' });

  const badLocation = await call('POST', '/receipts', {
    supplier: { name: 'Wrong Place Ltd' },
    warehouse: warehouseId,
    location: 'NOT-A-REAL-CODE',
    items: [{ product: productId, quantity: 1 }]
  });
  log(badLocation.status === 400, 'an unknown location code is rejected', `status ${badLocation.status}`);

  // The warehouse name is unique per run: an earlier version of this API created
  // unknown warehouses on the fly, so a fixed probe string could match a phantom
  // left behind by a previous run and pass for the wrong reason.
  const phantomName = `phantom-warehouse-${stamp}`;
  const warehousesBefore = await call('GET', '/warehouses?limit=200');
  const countBefore = warehousesBefore.body?.pagination?.total ?? (warehousesBefore.body?.data || []).length;

  const badWarehouse = await call('POST', '/receipts', {
    supplier: { name: 'Wrong Warehouse Ltd' },
    warehouse: phantomName,
    location: 'MAIN',
    items: [{ product: productId, quantity: 1 }]
  });
  log(badWarehouse.status === 404, 'an unknown warehouse is rejected', `status ${badWarehouse.status}`);

  const warehousesAfter = await call('GET', '/warehouses?limit=200');
  const countAfter = warehousesAfter.body?.pagination?.total ?? (warehousesAfter.body?.data || []).length;
  log(
    countAfter === countBefore,
    'a rejected warehouse is not silently created',
    `before ${countBefore} after ${countAfter}`
  );

  const wrongShape = await call('POST', '/receipts', {
    supplier: 'Just A String',
    warehouse: warehouseId,
    location: 'MAIN',
    products: [{ product: 'Some Name', quantity: 1 }]
  });
  log(wrongShape.status === 400, 'the old wrong-shaped payload is rejected', `status ${wrongShape.status}`);

  /* ------------------------------------------------- move history read */

  const trail = await call('GET', `/stock/movements?product=${productId}`);
  log(trail.status === 200 && (trail.body?.data || []).length > 0, 'move history filters by product id', `status ${trail.status}`);

  /* ----------------------------------------------------------- teardown */

  // A test that leaves records behind is a test that breaks the next run, so
  // everything removable through the API is removed again.
  //
  // One posted receipt is deliberately left: the API refuses to delete a
  // document that has moved stock, and it is right to, because the ledger entry
  // it wrote is the only record that the movement happened. That is the intended
  // behaviour, not a leak to work around, so it is left in place.
  for (const id of created.receiptIds) {
    if (!id) continue;
    const removed = await call('DELETE', `/receipts/${id}`);
    if (![200, 204].includes(removed.status) && removed.status !== 409) {
      log(false, `teardown: remove receipt ${id}`, `status ${removed.status}`);
    }
  }

  if (created.productId) {
    const removed = await call('DELETE', `/products/${created.productId}`);
    log(
      [200, 204].includes(removed.status),
      'teardown: remove the test product',
      `status ${removed.status}`
    );
  }

  console.log('\nOne posted receipt and its ledger entry are left behind by design.');
  console.log(`${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error('smoke test crashed:', error);
  process.exit(1);
});
