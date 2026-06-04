import 'dotenv/config';  // ← MUST be first — loads .env before any other import reads process.env
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

// Import Genkit config to register flows (must come after dotenv/config)
import './config/genkit.js';

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(helmet());
app.use(cookieParser());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
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

// Global Error Handler (Step 16)
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
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

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
