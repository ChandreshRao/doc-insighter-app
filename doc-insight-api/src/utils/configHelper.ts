/**
 * Configuration Helper Utilities
 * 
 * This file provides utilities for working with configuration values
 * and environment variables in the application.
 */

import config from '../config';
import { logger } from './logger';

/**
 * Check if the application is running in development mode
 */
export function isDevelopment(): boolean {
  return config.nodeEnv === 'development';
}

/**
 * Check if the application is running in production mode
 */
export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}

/**
 * Check if the application is running in test mode
 */
export function isTest(): boolean {
  return config.nodeEnv === 'test';
}

/**
 * Check if mock ingestion service should be used
 */
export function shouldUseMockIngestion(): boolean {
  return config.useMockIngestion;
}

/**
 * Get the appropriate service URL based on configuration
 */
export function getServiceUrl(): string {
  if (shouldUseMockIngestion()) {
    return 'mock://ingestion-service';
  }
  return config.pythonServiceUrl;
}

/**
 * Get database configuration for logging (without sensitive data)
 */
export function getDatabaseConfigForLogging(): {
  host: string;
  port: number;
  name: string;
  ssl: boolean;
} {
  return {
    host: config.dbHost,
    port: config.dbPort,
    name: config.dbName,
    ssl: config.dbSsl,
  };
}

/**
 * Get file upload configuration
 */
export function getFileUploadConfig(): {
  maxSize: number;
  uploadPath: string;
  allowedTypes: string[];
} {
  return {
    maxSize: config.maxFileSize,
    uploadPath: config.uploadPath,
    allowedTypes: config.allowedFileTypes,
  };
}

/**
 * Get JWT configuration
 */
export function getJWTConfig(): {
  secret: string;
  expiration: string;
  refreshSecret: string;
  refreshExpiration: string;
  issuer: string;
  audience: string;
  algorithm: string;
} {
  return {
    secret: config.jwtSecret,
    expiration: config.jwtExpiration,
    refreshSecret: config.jwtRefreshSecret,
    refreshExpiration: config.jwtRefreshExpiration,
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
    algorithm: config.jwtAlgorithm,
  };
}

/**
 * Get mock ingestion configuration
 */
export function getMockIngestionConfig(): {
  useMock: boolean;
  minTime: number;
  maxTime: number;
  failureRate: number;
  maxRetries: number;
  autoCleanup: boolean;
  cleanupInterval: number;
  maxAge: number;
} {
  return {
    useMock: config.useMockIngestion,
    minTime: config.mockIngestionMinTime,
    maxTime: config.mockIngestionMaxTime,
    failureRate: config.mockIngestionFailureRate,
    maxRetries: config.mockIngestionMaxRetries,
    autoCleanup: config.mockIngestionAutoCleanup,
    cleanupInterval: config.mockIngestionCleanupInterval,
    maxAge: config.mockIngestionMaxAge,
  };
}

/**
 * Get CORS configuration
 */
export function getCORSConfig(): {
  origins: string[];
  frontendUrl: string;
} {
  return {
    origins: config.corsOrigins.split(',').map(origin => origin.trim()),
    frontendUrl: config.frontendUrl,
  };
}

/**
 * Get logging configuration
 */
export function getLoggingConfig(): {
  level: string;
  file: string;
  errorFile: string;
} {
  return {
    level: config.logLevel,
    file: config.logFile,
    errorFile: config.logErrorFile,
  };
}

/**
 * Validate required environment variables
 */
export function validateRequiredEnvVars(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required variables
  if (!config.jwtSecret || config.jwtSecret === 'your_secret_key') {
    errors.push('JWT_SECRET must be set to a secure value');
  }

  if (!config.jwtRefreshSecret || config.jwtRefreshSecret === 'your_refresh_secret_key') {
    errors.push('JWT_REFRESH_SECRET must be set to a secure value');
  }

  if (!config.dbUrl && (!config.dbHost || !config.dbName)) {
    errors.push('Either DATABASE_URL or DB_HOST and DB_NAME must be set');
  }

  // Only enforce secure values in production
  if (isProduction()) {
    if (config.jwtSecret === 'your_secret_key') {
      errors.push('JWT_SECRET must be set to a secure value in production');
    }

    if (config.jwtRefreshSecret === 'your_refresh_secret_key') {
      errors.push('JWT_REFRESH_SECRET must be set to a secure value in production');
    }
  } else {
    // In development, warn but don't fail if using default values
    if (config.jwtSecret === 'your_secret_key') {
      logger.warn('Using default JWT_SECRET in development. Set JWT_SECRET environment variable for production.');
    }

    if (config.jwtRefreshSecret === 'your_refresh_secret_key') {
      logger.warn('Using default JWT_REFRESH_SECRET in development. Set JWT_REFRESH_SECRET environment variable for production.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration summary for logging (without sensitive data)
 */
export function getConfigSummary(): {
  environment: string;
  port: number;
  host: string;
  database: {
    host: string;
    port: number;
    name: string;
    ssl: boolean;
  };
  jwt: {
    issuer: string;
    audience: string;
    algorithm: string;
    expiration: string;
  };
  fileUpload: {
    maxSize: number;
    allowedTypes: string[];
  };
  mockIngestion: {
    enabled: boolean;
    minTime: number;
    maxTime: number;
    failureRate: number;
    autoCleanup: boolean;
  };
  logging: {
    level: string;
  };
} {
  return {
    environment: config.nodeEnv,
    port: config.port,
    host: config.host,
    database: getDatabaseConfigForLogging(),
    jwt: {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      algorithm: config.jwtAlgorithm,
      expiration: config.jwtExpiration,
    },
    fileUpload: {
      maxSize: config.maxFileSize,
      allowedTypes: config.allowedFileTypes,
    },
    mockIngestion: {
      enabled: config.useMockIngestion,
      minTime: config.mockIngestionMinTime,
      maxTime: config.mockIngestionMaxTime,
      failureRate: config.mockIngestionFailureRate,
      autoCleanup: config.mockIngestionAutoCleanup,
    },
    logging: {
      level: config.logLevel,
    },
  };
}

/**
 * Check if a feature is enabled based on configuration
 */
export function isFeatureEnabled(feature: string): boolean {
  switch (feature) {
    case 'mockIngestion':
      return config.useMockIngestion;
    case 'autoCleanup':
      return config.mockIngestionAutoCleanup;
    case 'ssl':
      return config.dbSsl;
    default:
      return false;
  }
}

/**
 * Get environment-specific recommendations
 */
export function getEnvironmentRecommendations(): string[] {
  const recommendations: string[] = [];

  if (isDevelopment()) {
    recommendations.push('Using mock ingestion service for development');
    recommendations.push('Debug logging enabled');
    recommendations.push('CORS configured for local development');
  }

  if (isProduction()) {
    if (config.useMockIngestion) {
      recommendations.push('WARNING: Using mock ingestion service in production');
    }
    if (config.logLevel === 'debug') {
      recommendations.push('WARNING: Debug logging enabled in production');
    }
    if (!config.dbSsl) {
      recommendations.push('WARNING: Database SSL not enabled');
    }
  }

  if (isTest()) {
    recommendations.push('Using test database configuration');
    recommendations.push('Mock services enabled for testing');
  }

  return recommendations;
}
