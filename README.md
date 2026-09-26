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
- `GET /api/products` — List products (search by SKU/name/category, category filter, `?page` & `?limit`, max 100)
- `GET /api/products/:id` — Get product details by ID
- `POST /api/products` — Create new product (Unique SKU check, Manager role)
- `PUT /api/products/:id` — Update existing product (Manager role)
- `DELETE /api/products/:id` — Delete product (Manager role)

> The stock field is named `quantity` (not `stockQuantity`) and may not be negative.

### Warehouses (Protected)
- `GET /api/warehouses` — List warehouses with their locations (any role)
- `GET /api/warehouses/:id` — Get a single warehouse (any role)
- `POST /api/warehouses` — Create a warehouse (Manager role)
- `POST /api/warehouses/:id/locations` — Add a location/rack to a warehouse (Manager role)

---

## 🎯 Current Scope — Hour 1 & Hour 2 (COMPLETED)
- [x] Express + Mongoose connection foundation
- [x] Health check `/api/health`
- [x] User Registration & Login with bcrypt password hashing
- [x] JWT authentication & role-based middleware (`inventory_manager`, `warehouse_staff`)
- [x] Forgot Password + OTP generation + verification + password reset
- [x] Product model with SKU, Name, Category, Unit, `quantity`, Reorder Level, Price, Location
- [x] Product CRUD APIs with SKU uniqueness enforcement
- [x] Warehouse & location model with role-protected create endpoints
- [x] React + Vite UI with Protected Routes, Auth Context, Product Catalog, Search & Filter Modals
- [x] ESLint (flat config) wired to `npm run lint`

---

## 🔮 Future Feature Roadmap (Hour 3+)
- **Hour 3**: Receipts (Incoming stock entries & automated stock quantity increase)
- **Hour 4**: Deliveries (Outgoing customer orders & automated stock quantity deduction)
- **Hour 5**: Internal Transfers (Inter-warehouse stock location movement)
- **Hour 6**: Inventory Adjustments & Stock Ledger audit history
- **Hour 7**: Real-time Dashboard KPIs, Stock Valuation & Low-Stock Alerts
