import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { checkRedisHealth } from './config/redis.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import productRoutes from './routes/productRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import platformRoutes from './routes/platformRoutes.js';

dotenv.config();

const app = express();

// Database connection
connectDB();


// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/v1/health', async (req, res) => {
  const redisHealthy = await checkRedisHealth();
  res.json({
    status: 'online',
    app: 'BisonMooves Store Multi-Business Retail SaaS API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.name || 'disconnected',
    redis: redisHealthy ? 'connected (upstash)' : 'degraded',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/businesses', businessRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/platform', platformRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`BisonMooves Store SaaS Backend API running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
