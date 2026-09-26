import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

/**
 * Allowed browser origins, from a comma separated CLIENT_URL.
 *
 * The previous setup passed a single string straight to cors(), which makes it
 * echo that one value as Access-Control-Allow-Origin no matter who asked. A
 * request from any other origin (a second dev server on a different port, a
 * preview build) was therefore answered with a mismatched origin and silently
 * blocked by the browser. Deciding per request means an unknown origin is
 * refused outright instead.
 */
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

class ApiOriginError extends Error {
  constructor(origin) {
    super(`Origin ${origin} is not allowed by CORS`);
    this.name = 'ApiOriginError';
    this.statusCode = 403;
  }
}

const corsOptions = {
  origin(origin, callback) {
    // Same-origin, curl and server-to-server calls send no Origin header.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new ApiOriginError(origin));
  },
  credentials: true,
};

// Enable CORS
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);

// 404 Not Found Middleware
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
