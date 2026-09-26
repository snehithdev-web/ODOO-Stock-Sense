# StockSense — Modular Inventory Management System

StockSense is a modular, scalable MERN stack Inventory Management System designed for warehouse operations, product catalog management, and stock control.

---

## 📌 Problem Statement Summary
Modern logistics and warehouse operations require strict control over stock movements, product master data, location tracking, and role-based access. StockSense provides a robust, layered architecture built to support full inventory workflows (Receipts, Deliveries, Transfers, Adjustments, and Stock Ledger) step-by-step.

---

## 🚀 Technology Stack
- **Frontend**: React 18, Vite, React Router v6, Axios, Lucide Icons, Vanilla CSS Design System
- **Backend**: Node.js, Express.js (ES Modules)
- **Database**: MongoDB & Mongoose ORM
- **Authentication**: JWT (JSON Web Tokens), bcryptjs password hashing, OTP reset flow
- **HTTP Client**: Axios with Request/Response interceptors

---

## 🏗️ Architecture & Design Pattern

### Backend Layered Architecture
```
Request ──> Route ──> Controller ──> Service ──> Model ──> MongoDB
```
- **Routes**: Endpoints definition & middleware attachment
- **Controllers**: Express HTTP request parsing & response serialization
- **Services**: Pure business logic, DB queries, validation rules, token generation
- **Models**: Mongoose schemas with validation and hooks
- **Middleware**: JWT authentication (`protect`), RBAC (`authorize`), 404 handler, centralized error handler

### Frontend Feature Architecture
```
Pages / Routes ──> Feature Components ──> Feature API Service ──> Axios Interceptor ──> Backend API
```

---

## 📁 Project Structure

```
ODOO-Stock-Sense/
├── client/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── authApi.js
│   │   │   │   ├── ForgotPasswordForm.jsx
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   └── ResetPasswordForm.jsx
│   │   │   └── products/
│   │   │       ├── productApi.js
│   │   │       ├── ProductDetails.jsx
│   │   │       ├── ProductForm.jsx
│   │   │       └── ProductList.jsx
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── pages/
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── NotFoundPage.jsx
│   │   │   ├── ProductDetailPage.jsx
│   │   │   ├── ProductsPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── health.controller.js
│   │   ├── product.controller.js
│   │   └── warehouse.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── notFound.middleware.js
│   ├── models/
│   │   ├── product.model.js
│   │   ├── user.model.js
│   │   ├── warehouse.model.js
│   │   ├── receipt.model.js
│   │   ├── delivery.model.js
│   │   ├── transfer.model.js
│   │   ├── adjustment.model.js
│   │   ├── stockLedger.model.js
│   │   └── schemas/
│   │       └── operation.schema.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── health.routes.js
│   │   ├── product.routes.js
│   │   └── warehouse.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── health.service.js
│   │   ├── product.service.js
│   │   └── warehouse.service.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── constants.js
│   │   ├── enums.js
│   │   ├── jwt.js
│   │   ├── query.js
│   │   └── response.js
│   ├── .env.example
│   ├── app.js
│   ├── package.json
│   └── server.js
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔑 Environment Variables Configuration

Copy `server/.env.example` to `server/.env` (and `client/.env.example` to `client/.env`).

### `server/.env`
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/stocksense
# Comma separated list of browser origins allowed by CORS.
CLIENT_URL=http://localhost:5173
NODE_ENV=development
# REQUIRED. The server refuses to start without it.
# Generate one with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
JWT_SECRET=replace_me_with_a_long_random_string
JWT_EXPIRE=30d
```

> `JWT_SECRET` has no default on purpose. The server throws on startup if it is
> missing, rather than falling back to a hardcoded key that is public in the
> source. A repo-root `.env` is also loaded as a fallback, and `server/.env`
> takes precedence over it.

### `client/.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 💻 How to Install & Run

### 1. Install Dependencies
```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Start Backend Server
```bash
cd server
npm run dev
# Server will listen on http://localhost:5000
```

### 3. Start Frontend Client
```bash
cd client
npm run dev
# Frontend will run on http://localhost:5173
```

> The dev server uses `strictPort`, so it fails immediately instead of quietly
> moving to another port when 5173 is taken. That matters because the API's
> CORS allowlist is keyed to `CLIENT_URL`.

### 4. Lint the Client
```bash
cd client
npm run lint
```

---

## 📡 Key API Endpoints

All responses share one envelope, so a client can branch on `status` alone:

```jsonc
// success
{ "status": "success", "message": "...", "data": ..., "pagination": { ... } }
// failure
{ "status": "error", "message": "..." }
```

`data` holds the resource (a single object, or an array for list endpoints) and
`pagination` is present on list endpoints. Stack traces are never included.

### Health & System
- `GET /api/health` — API health check & MongoDB connection status

### Authentication
- `POST /api/auth/register` — Register User (`inventory_manager` / `warehouse_staff`)
- `POST /api/auth/login` — Login user & obtain JWT token
- `POST /api/auth/forgot-password` — Generate & store 6-digit OTP code with expiry
- `POST /api/auth/verify-otp` — Verify OTP code before password reset
- `POST /api/auth/reset-password` — Reset password using a verified OTP
- `GET /api/auth/me` — Get current logged-in user profile (Protected)

> Security notes: `forgot-password` returns the same response whether or not the
> address exists, so it cannot be used to enumerate accounts. `devOtp` is only
> present outside production, to let the flow be tested without a mail
> transport. `verify-otp` allows 5 attempts, after which the code is discarded.

### Product Master Data Management (Protected)
- `GET /api/products` — List products with search & smart filters
- `GET /api/products/filter-options` — Distinct categories, locations and units, plus stock bucket counts, for populating filter controls
- `GET /api/products/:id` — Get product details by ID
- `POST /api/products` — Create new product (Unique SKU check, Manager role)
- `PUT /api/products/:id` — Update existing product (Manager role)
- `DELETE /api/products/:id` — Delete product (Manager role)

> The stock field is named `quantity` (not `stockQuantity`) and may not be negative.

**`GET /api/products` query parameters**

| Param | Values | Notes |
|---|---|---|
| `search` | free text | Matches name, SKU, category and description. Case-insensitive substring, input is regex-escaped |
| `sku` | free text | SKU-only search, so a code lookup is not diluted by a matching product name. Substring, so `STL` finds `STL-001` |
| `category` | free text | Exact match, case-insensitive and anchored |
| `location` | free text | Exact match, case-insensitive and anchored |
| `unit` | free text | Exact match, case-insensitive and anchored |
| `stockStatus` | `in_stock` \| `low_stock` \| `out_of_stock` | Compared against each product's own `reorderLevel` |
| `minPrice` / `maxPrice` | number | Inclusive unit price bounds |
| `sort` | `newest` (default), `oldest`, `name_asc`, `name_desc`, `sku_asc`, `sku_desc`, `quantity_asc`, `quantity_desc`, `price_asc`, `price_desc` | Whitelisted; each ends in a stable tiebreaker so paging cannot repeat or skip a row |
| `page` / `limit` | number | `limit` defaults to 20 and is capped at 100 |

An unrecognised `sort`, `stockStatus` or a non-numeric price returns **400** rather than being dropped. A filter that is silently ignored returns the full unfiltered list, which reads as "nothing matched that filter" and is worse than an explicit error.

`out_of_stock` is `quantity <= 0`; `low_stock` is `0 < quantity <= reorderLevel`; `in_stock` is `quantity > reorderLevel`. The three are disjoint, so the low-stock and out-of-stock KPI counts add up correctly.

The catalog page keeps its whole filter state in the query string, so a filtered view is shareable and survives a reload.

### Warehouses (Protected)
- `GET /api/warehouses` — List warehouses with their locations (any role)
- `GET /api/warehouses/:id` — Get a single warehouse (any role)
- `POST /api/warehouses` — Create a warehouse (Manager role)
- `POST /api/warehouses/:id/locations` — Add a location/rack to a warehouse (Manager role)

### Operational Documents (Protected)

Receipts, deliveries, transfers and adjustments share one lifecycle, so the four
route groups below expose the same endpoints. `create`/`update`/`delete` require
`inventory_manager`; receipts, deliveries and transfers also accept
`warehouse_staff`, while adjustments (which change the book record) are
manager-only.

| Endpoint | Receipts | Deliveries | Transfers | Adjustments | Purpose |
| --- | --- | --- | --- | --- | --- |
| `GET /` | ✓ | ✓ | ✓ | ✓ | List, `?status=`, `?search=`, `?warehouse=`, paginated |
| `GET /:id` | ✓ | ✓ | ✓ | ✓ | One document |
| `POST /` | ✓ | ✓ | ✓ | ✓ | Create as a **draft** (never moves stock) |
| `PUT /:id` | ✓ | ✓ | ✓ | ✓ | Replace a draft's content |
| `PATCH /:id` | ✓ | ✓ | ✓ | ✓ | Step status, body `{ "status": "ready" }` |
| `POST /:id/post` | ✓ | ✓ | ✓ | ✓ | Apply to stock (requires `ready`) |
| `POST /:id/cancel` | ✓ | ✓ | ✓ | ✓ | Cancel, with `{ "reason" }` |
| `DELETE /:id` | ✓ | ✓ | ✓ | ✓ | Delete a document that was never posted |
| `GET /:id/stock` | ✓ | ✓ | ✓ | ✓ | On-hand balance at each line's location |

Request bodies differ per type:

```jsonc
// POST /api/receipts
{ "supplier": { "name": "ABC Steel", "code": "ABC" },
  "warehouse": "<id>", "location": "MAIN-STORE",
  "items": [{ "product": "<id>", "quantity": 100, "notes": "" }] }

// POST /api/deliveries  — same, with "customer" instead of "supplier"
{ "customer": { "name": "BuildWell" },
  "warehouse": "<id>", "location": "MAIN-STORE",
  "items": [{ "product": "<id>", "quantity": 30 }] }

// POST /api/transfers  — two places, one quantity
{ "from": { "warehouse": "<id>",  "location": "MAIN-STORE" },
  "to":   { "warehouse": "<id>",  "location": "PROD-RACK" },
  "items": [{ "product": "<id>", "quantity": 20 }] }

// POST /api/adjustments  — send the count only
{ "warehouse": "<id>", "location": "MAIN-STORE",
  "reason": "damage",   // damage | expiry | shrinkage | recount | theft_loss | other
  "items": [{ "product": "<id>", "countedQuantity": 45 }] }
```

A document is validated and applied **as a whole**: if any line would drive a
balance negative, the entire document is rejected with `409` and nothing is
written. `recordedQuantity` on an adjustment is taken from the ledger rather than
the request body, and is re-read at post time, so a count always lands on the
counted number even if stock moved while the document sat in draft.

### Stock Ledger (Protected)
- `GET /api/stock/movements` — Move History; `?operationType=`, `?product=`, `?warehouse=`, `?location=`, `?operationRef=`, `?fromDate=`, `?toDate=`
- `GET /api/stock/product/:productId` — Where a product is held, per warehouse and location
- `GET /api/stock/product/:productId/warehouse/:warehouseId/location/:location` — Balance plus every entry that produced it
- `GET /api/stock/indexes` — Confirms the unique `postingKey` index is present
- `POST /api/stock/reconcile` — Rebuild `Product.quantity` from the ledger (Manager role)

---

## 🧠 How Stock Is Tracked

The **ledger is the source of truth**; `Product.quantity` is a denormalised cache
of it, so the catalog list and the low-stock filter stay a single indexed query.
`POST /api/stock/reconcile` rebuilds the cache from the ledger at any time.

Balances are per `(product, warehouse, location)`, so a receipt into Hyderabad's
Main Store and a delivery from Mumbai's Rack A are tracked separately, and a
product's total is the sum of the latest balance of each of its streams.

### Why posting is idempotent

MongoDB is running as a **standalone server**, so multi-document transactions are
unavailable. Posting therefore follows ledger-first ordering instead of wrapping
its writes in a transaction:

1. Validate the document against current balances; reject it as a unit if it would
   go negative.
2. Write the ledger entries. Each carries a deterministic `postingKey`
   (`MODEL:id:product:warehouse:location`) with a **unique index**, so a retry
   after a crash collides and is recognised as already applied rather than
   double-counting stock.
3. Mark the document `done`.
4. Rebuild the product cache from the ledger.

Steps 3 and 4 are derived state, so a crash between them leaves stale cache rather
than wrong stock, and re-posting or reconciling repairs it. Posting refuses to run
if the unique index is missing, instead of silently risking a double count.

---

## 🎯 Current Scope

- [x] Express + Mongoose connection foundation
- [x] Health check `/api/health`
- [x] User Registration & Login with bcrypt password hashing
- [x] JWT authentication & role-based middleware (`inventory_manager`, `warehouse_staff`)
- [x] Forgot Password + OTP generation + verification + password reset
- [x] Product model with SKU, Name, Category, Unit, `quantity`, Reorder Level, Price, Location
- [x] Product CRUD APIs with SKU uniqueness enforcement
- [x] SKU search & smart filters, with a facet endpoint for the filter dropdowns
- [x] Warehouse & location model with role-protected create endpoints
- [x] Seeded warehouses: Hyderabad (`WH-HYD`) and Mumbai (`WH-MUM`), plus `WH-MAIN`
- [x] Stock ledger with per-location balances and a running `balanceAfter`
- [x] Idempotent, transaction-free posting engine
- [x] Receipts, deliveries, transfers and adjustments (APIs)
- [x] Move History and stock-by-location reads
- [x] React + Vite UI with Protected Routes, Auth Context, Product Catalog, Search & Filter Modals
- [x] ESLint (flat config) for both client and server

### Seeding and indexes

Two repeatable scripts, safe to re-run against a populated database:

```bash
cd server
npm run seed:locations   # creates WH-HYD / WH-MUM and their locations
npm run seed:indexes     # creates the indexes posting depends on
```

`seed:indexes` is required before the first posting: Mongoose only builds indexes
while `autoIndex` is on, which is normally off in production, and the ledger's
unique `postingKey` index is what makes posting safe to retry.

---

## 🔮 Not Built Yet
- Frontend screens for receipts, deliveries, transfers, adjustments, move history
  and the dashboard (the APIs exist; the UI does not)
- Dashboard KPIs, stock valuation and low-stock alerts
- Supplier and customer entities — currently captured inline on each document
