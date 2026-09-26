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
│   │   └── favicon.svg
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
│   │   └── product.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── notFound.middleware.js
│   ├── models/
│   │   ├── product.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── health.routes.js
│   │   └── product.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── health.service.js
│   │   └── product.service.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── jwt.js
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

Create a `.env` file inside `server/` (and `client/.env`):

### `server/.env`
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/stocksense
CLIENT_URL=http://localhost:5173
NODE_ENV=development
JWT_SECRET=stocksense_jwt_secret_key_hackathon_2026
JWT_EXPIRE=30d
```

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

---

## 📡 Key API Endpoints

### Health & System
- `GET /api/health` — API health check & MongoDB connection status

### Authentication
- `POST /api/auth/register` — Register User (`inventory_manager` / `warehouse_staff`)
- `POST /api/auth/login` — Login user & obtain JWT token
- `POST /api/auth/forgot-password` — Generate & store 6-digit OTP code with expiry
- `POST /api/auth/verify-otp` — Verify OTP code before password reset
- `POST /api/auth/reset-password` — Reset password using verified OTP
- `GET /api/auth/me` — Get current logged-in user profile (Protected)

### Product Master Data Management (Protected)
- `GET /api/products` — List products (with search by SKU/name/category & category filtering)
- `GET /api/products/:id` — Get product details by ID
- `POST /api/products` — Create new product (Unique SKU check, Manager role)
- `PUT /api/products/:id` — Update existing product (Manager role)
- `DELETE /api/products/:id` — Delete product (Manager role)

---

## 🎯 Current Scope — Hour 1 & Hour 2 (COMPLETED)
- [x] Express + Mongoose connection foundation
- [x] Health check `/api/health`
- [x] User Registration & Login with bcrypt password hashing
- [x] JWT authentication & role-based middleware (`inventory_manager`, `warehouse_staff`)
- [x] Forgot Password + OTP generation + verification + password reset
- [x] Product model with SKU, Name, Category, Unit, Stock Quantity, Reorder Level, Price, Location
- [x] Product CRUD APIs with SKU uniqueness enforcement
- [x] React + Vite UI with Protected Routes, Auth Context, Product Catalog, Search & Filter Modals

---

## 🔮 Future Feature Roadmap (Hour 3+)
- **Hour 3**: Receipts (Incoming stock entries & automated stock quantity increase)
- **Hour 4**: Deliveries (Outgoing customer orders & automated stock quantity deduction)
- **Hour 5**: Internal Transfers (Inter-warehouse stock location movement)
- **Hour 6**: Inventory Adjustments & Stock Ledger audit history
- **Hour 7**: Real-time Dashboard KPIs, Stock Valuation & Low-Stock Alerts
