import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/Logger.js';
import { errorHandler } from './middlewares/error.middleware.js';

// Route Imports
import authRoutes from './modules/auth/routes/auth.routes.js';
import hierarchyRoutes from './modules/hierarchy/routes/hierarchy.routes.js';
import roleRoutes from './modules/role/routes/role.routes.js';
import productRoutes from './modules/product/routes/product.routes.js';
import inventoryRoutes from './modules/inventory/routes/inventory.routes.js';
import revenueRoutes from './modules/revenue/routes/revenue.routes.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      if (
        ENV.NODE_ENV === 'development' ||
        origin === ENV.CLIENT_URL ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many requests from this IP' },
});
app.use('/api', limiter);

// Request Logger
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/hierarchy', hierarchyRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/revenue', revenueRoutes);

// Global Error Handler
app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
    logger.info(`🚀 Invora Enterprise Server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
  });
};

startServer();
