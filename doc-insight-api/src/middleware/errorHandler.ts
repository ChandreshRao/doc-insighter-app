import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../types';
import config from '../config';
import { ErrorCodes } from '../utils/constants';

/**
 * Custom error class for operational errors
 */
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code || '';

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle validation errors
 */
export const handleValidationError = (error: any): CustomError => {
  const message = Object.values(error.errors).map((val: any) => val.message).join(', ');
  return new CustomError(message, 400, ErrorCodes.VALIDATION_ERROR);
};

/**
 * Handle JWT errors
 */
export const handleJWTError = (): CustomError => {
  return new CustomError('Invalid token. Please log in again!', 401, ErrorCodes.JWT_ERROR);
};

/**
 * Handle JWT expired errors
 */
export const handleJWTExpiredError = (): CustomError => { 
  return new CustomError('Your token has expired! Please log in again.', 401, ErrorCodes.JWT_EXPIRED);
};

/**
 * Handle database errors
 */
export const handleDatabaseError = (error: any): CustomError => {
  if (error.code === '23505') { // Unique constraint violation
    return new CustomError('Duplicate field value', 400, ErrorCodes.DUPLICATE_FIELD);
  }
  if (error.code === '23503') { // Foreign key constraint violation
    return new CustomError('Referenced record does not exist', 400, ErrorCodes.FOREIGN_KEY_VIOLATION);
  }
  if (error.code === '23514') { // Check constraint violation
    return new CustomError('Invalid data provided', 400, ErrorCodes.CHECK_CONSTRAINT_VIOLATION);
  }
  
  logger.error('Database error:', error);
  return new CustomError('Database operation failed', 500, ErrorCodes.DATABASE_ERROR);
};

/**
 * Handle file upload errors
 */
export const handleFileUploadError = (error: any): CustomError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new CustomError('File too large', 400, ErrorCodes.FILE_TOO_LARGE);
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new CustomError('Unexpected file field', 400, ErrorCodes.UNEXPECTED_FILE);
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new CustomError('Too many files', 400, ErrorCodes.TOO_MANY_FILES);
  }
  
  logger.error('File upload error:', error);
  return new CustomError('File upload failed', 500, ErrorCodes.FILE_UPLOAD_ERROR);
};

/**
 * Main error handling middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let customError: CustomError;

  // Log the error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.user_id,
    timestamp: new Date().toISOString(),
  });

  // Handle different types of errors
  if (error instanceof CustomError) {
    customError = error;
  } else if (error.name === 'ValidationError') {
    customError = handleValidationError(error);
  } else if (error.name === 'JsonWebTokenError') {
    customError = handleJWTError();
  } else if (error.name === 'TokenExpiredError') {
    customError = handleJWTExpiredError();
  } else if (error.name === 'QueryFailedError' || (error as any).code) {
    customError = handleDatabaseError(error);
  } else if (error.message && error.message.includes('MulterError')) {
    customError = handleFileUploadError(error);
  } else {
    // Default error
    customError = new CustomError(
      error.message || 'Internal server error',
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }

  // Send error response
  res.status(customError.statusCode).json({
    success: false,
    error: customError.message,
    code: customError.code,
    timestamp: new Date().toISOString(),
    ...(config.nodeEnv === 'development' && {
      stack: error.stack,
      details: error,
    }),
  });
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason,
    timestamp: new Date().toISOString(),
  });
  
  // Close server gracefully
  process.exit(1);
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  
  // Close server gracefully
  process.exit(1);
});
