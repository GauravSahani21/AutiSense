import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from autisense-backend directory, or from process.env on Render
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';

// Route files
import authRoutes from './routes/auth.js';
import childrenRoutes from './routes/children.js';
import screeningsRoutes from './routes/screenings.js';
import reportsRoutes from './routes/reports.js';
import doctorRoutes from './routes/doctor.js';
import adminRoutes from './routes/admin.js';
import trajectoryRoutes from './routes/trajectory.js';
import interventionsRoutes from './routes/interventions.js';
import clinicalRoutes from './routes/clinical.js';
import scanRoutes from './routes/scan.js';

// Import AI service config (must come after dotenv/config)
import './config/genkit.js';

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helmet configured to allow CDN assets, MediaPipe models, and camera streams
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cookieParser());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Python ML Microservice Proxy (port 5001) ─────────────
const ML_BASE_URL = process.env.ML_API_URL || 'http://localhost:5001';

app.use('/api/ml', async (req, res) => {
  try {
    const targetUrl = `${ML_BASE_URL}${req.url}`;
    const options = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
    }
    const mlResponse = await fetch(targetUrl, options);
    const data = await mlResponse.json().catch(() => ({}));
    res.status(mlResponse.status).json(data);
  } catch (err) {
    console.error('[ML Proxy Error]:', err.message);
    res.status(502).json({ success: false, error: 'ML prediction microservice is unavailable' });
  }
});

// ── Mount Core API Routers ──────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/screenings', screeningsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trajectory', trajectoryRoutes);
app.use('/api/interventions', interventionsRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/scan', scanRoutes);

// ── Serve React Frontend (Single Web Service) ───────────
const clientDistPath = path.join(__dirname, '../autisense/dist');
app.use(express.static(clientDistPath));

// Catch-all: serve frontend index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const message = 'Not authorized';
    error = new Error(message);
    error.statusCode = 401;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
});
