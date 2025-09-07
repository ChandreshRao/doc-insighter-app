import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import documentRoutes from './routes/documentRoutes';
import ingestionRoutes from './routes/ingestionRoutes';
import { initializeDatabase } from './database/connection';
import config from './config';
import { 
  validateRequiredEnvVars, 
  getConfigSummary, 
  getEnvironmentRecommendations,
  shouldUseMockIngestion 
} from './utils/configHelper';

const app = express();
const PORT = config.port;
const HOST = config.host;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.nodeEnv === 'production' 
    ? config.frontendUrl 
    : config.corsOrigins.split(','),
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ingestion', ingestionRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Validate environment variables
    const validation = validateRequiredEnvVars();
    if (!validation.valid) {
      logger.error('Environment validation failed:', validation.errors);
      process.exit(1);
    }

    // Log configuration summary
    const configSummary = getConfigSummary();
    logger.info('Application configuration:', configSummary);

    // Log environment recommendations
    const recommendations = getEnvironmentRecommendations();
    if (recommendations.length > 0) {
      logger.info('Environment recommendations:', recommendations);
    }

    // Initialize database
    await initializeDatabase();
    logger.info('Database connection established');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://${HOST}:${PORT}/health`);
      logger.info(`API Documentation: http://${HOST}:${PORT}/api`);
      
      // Log service configuration
      if (shouldUseMockIngestion()) {
        logger.info('Using Mock Ingestion Service for document processing');
      } else {
        logger.info(`Using Python Service: ${config.pythonServiceUrl}`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
