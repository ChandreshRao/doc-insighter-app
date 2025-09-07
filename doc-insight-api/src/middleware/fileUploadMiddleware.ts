import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler';
import { logger } from '../utils/logger';
import { ErrorCodes } from '../utils/constants';
import config from '../config';

// File upload configuration
const MAX_FILE_SIZE = config.maxFileSize;
const UPLOAD_PATH = config.uploadPath;
const ALLOWED_FILE_TYPES = config.allowedFileTypes;

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // Create subdirectories based on file type
    const fileTypeDir = path.join(UPLOAD_PATH, file.mimetype.split('/')[1] || 'other');
    if (!fs.existsSync(fileTypeDir)) {
      fs.mkdirSync(fileTypeDir, { recursive: true });
    }
    cb(null, fileTypeDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${timestamp}-${randomString}${fileExtension}`;
    cb(null, fileName);
  },
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    // Check file type
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    const mimeType = file.mimetype.toLowerCase();
    
    // Validate file extension
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      logger.warn('File upload rejected - invalid extension', {
        fileName: file.originalname,
        fileExtension,
        allowedTypes: ALLOWED_FILE_TYPES,
        userId: req.user?.user_id,
      });
      
      return cb(new CustomError(
        `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
        400,
        ErrorCodes.INVALID_FILE_TYPE
      ));
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      logger.warn('File upload rejected - invalid MIME type', {
        fileName: file.originalname,
        mimeType,
        allowedMimeTypes,
        userId: req.user?.user_id,
      });
      
      return cb(new CustomError(
        'File MIME type not allowed',
        400,
        ErrorCodes.INVALID_MIME_TYPE
      ));
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('File upload rejected - file too large', {
        fileName: file.originalname,
        fileSize: file.size,
        maxSize: MAX_FILE_SIZE,
        userId: req.user?.user_id,
      });
      
      return cb(new CustomError(
        `File too large. Maximum size: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
        400,
        'FILE_TOO_LARGE'
      ));
    }

    // Additional security checks
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      logger.warn('File upload rejected - suspicious filename', {
        fileName: file.originalname,
        userId: req.user?.user_id,
      });
      
      return cb(new CustomError(
        'Invalid filename',
        400,
        ErrorCodes.INVALID_FILENAME
      ));
    }

    // Log successful file validation
    logger.info('File upload validated successfully', {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType,
      userId: req.user?.user_id,
    });

    cb(null, true);
  } catch (error) {
    logger.error('Error in file filter:', error);
    cb(new CustomError('File validation failed', 500, 'FILE_VALIDATION_ERROR'));
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Allow only one file per request
  },
});

/**
 * Single file upload middleware
 */
export const uploadSingle = upload.single('file');

/**
 * File upload error handling middleware
 */
export const handleFileUploadError = (
  error: Error,
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (error instanceof CustomError) {
    // Custom error already formatted
    next(error);
  } else if (error instanceof multer.MulterError) {
    // Multer-specific errors
    let customError: CustomError;
    
    switch (error.code) {
      case ErrorCodes.LIMIT_FILE_SIZE:
        customError = new CustomError(
          `File too large. Maximum size: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
          400,
          ErrorCodes.FILE_TOO_LARGE
        );
        break;
      case ErrorCodes.LIMIT_FILE_COUNT:
        customError = new CustomError(
          'Too many files. Only one file allowed per request',
          400,
          ErrorCodes.TOO_MANY_FILES
        );
        break;
      case ErrorCodes.LIMIT_UNEXPECTED_FILE:
        customError = new CustomError(
          'Unexpected file field',
          400,
          ErrorCodes.UNEXPECTED_FILE
        );
        break;
      default:
        customError = new CustomError(
          'File upload failed',
          500,
          ErrorCodes.FILE_UPLOAD_ERROR
        );
    }
    
    next(customError);
  } else {
    // Generic error
    logger.error('File upload error:', error);
    next(new CustomError('File upload failed', 500, ErrorCodes.FILE_UPLOAD_ERROR));
  }
};

/**
 * Validate uploaded file exists
 */
export const validateFileUpload = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.file) {
    next(new CustomError('No file uploaded', 400, ErrorCodes.NO_FILE));
    return;
  }

  // Additional validation after upload
  const file = req.file;
  
  // Verify file was actually saved
  if (!fs.existsSync(file.path)) {
    logger.error('File not found after upload', {
      filePath: file.path,
      userId: req.user?.user_id,
    });
    next(new CustomError('File upload failed', 500, ErrorCodes.FILE_SAVE_ERROR));
    return;
  }

  // Add file metadata to request
  req.body.file = file;
  
  next();
};

/**
 * Clean up uploaded file on error
 */
export const cleanupUploadedFile = (req: Request, res: Response, next: NextFunction): void => {
  // Store original file path for cleanup
  const originalPath = req.file?.path;
  
  // Override res.end to clean up file if response indicates error
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any  {
    if (res.statusCode >= 400 && originalPath && fs.existsSync(originalPath)) {
      try {
        fs.unlinkSync(originalPath);
        logger.info('Cleaned up uploaded file due to error', {
          filePath: originalPath,
          statusCode: res.statusCode,
          userId: req.user?.user_id,
        });
      } catch (error) {
        logger.error('Failed to cleanup uploaded file:', error);
      }
    }
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Get file upload configuration
 */
export const getFileUploadConfig = () => ({
  maxFileSize: MAX_FILE_SIZE,
  allowedFileTypes: ALLOWED_FILE_TYPES,
  uploadPath: UPLOAD_PATH,
});

/**
 * Complete file upload middleware chain
 */
export const fileUploadMiddleware = [
  uploadSingle,
  handleFileUploadError,
  validateFileUpload,
  cleanupUploadedFile,
];
