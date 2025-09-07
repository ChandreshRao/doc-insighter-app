import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { CustomError } from './errorHandler';
import { ErrorCodes } from '../utils/constants';

/**
 * Generic validation middleware using Joi schemas
 */
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      const customError = new CustomError(errorMessage, 400, ErrorCodes.VALIDATION_ERROR);
      return next(customError);
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Validation schemas for different endpoints
 */
export const validationSchemas = {
  // User registration
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters',
        'any.required': 'Username is required',
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),
    first_name: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'First name is required',
        'string.max': 'First name must not exceed 100 characters',
        'any.required': 'First name is required',
      }),
    last_name: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Last name is required',
        'string.max': 'Last name must not exceed 100 characters',
        'any.required': 'Last name is required',
      }),
    role: Joi.string()
      .valid('admin', 'editor', 'viewer')
      .optional()
      .messages({
        'any.only': 'Role must be one of: admin, editor, viewer',
      }),
  }),

  // User login
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),

  // User update
  updateUser: Joi.object({
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Please provide a valid email address',
      }),
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .optional()
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters',
      }),
    first_name: Joi.string()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'string.min': 'First name cannot be empty',
        'string.max': 'First name must not exceed 100 characters',
      }),
    last_name: Joi.string()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Last name cannot be empty',
        'string.max': 'Last name must not exceed 100 characters',
      }),
    role: Joi.string()
      .valid('admin', 'editor', 'viewer')
      .optional()
      .messages({
        'any.only': 'Role must be one of: admin, editor, viewer',
      }),
    is_active: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'is_active must be a boolean value',
      }),
    email_verified: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'email_verified must be a boolean value',
      }),
  }),

  // Document creation
  createDocument: Joi.object({
    title: Joi.string()
      .min(1)
      .max(500)
      .required()
      .messages({
        'string.min': 'Document title is required',
        'string.max': 'Document title must not exceed 500 characters',
        'any.required': 'Document title is required',
      }),
    description: Joi.string()
      .max(2000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Document description must not exceed 2000 characters',
      }),
  }),

  // Document update
  updateDocument: Joi.object({
    title: Joi.string()
      .min(1)
      .max(500)
      .optional()
      .messages({
        'string.min': 'Document title cannot be empty',
        'string.max': 'Document title must not exceed 500 characters',
      }),
    description: Joi.string()
      .max(2000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Document description must not exceed 2000 characters',
      }),
    status: Joi.string()
      .valid('pending', 'processing', 'completed', 'failed')
      .optional()
      .messages({
        'any.only': 'Status must be one of: pending, processing, completed, failed',
      }),
  }),

  // Pagination query
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100',
      }),
    sort_by: Joi.string()
      .valid('created_at', 'updated_at', 'title', 'file_name', 'file_size')
      .default('created_at')
      .messages({
        'any.only': 'Sort by must be one of: created_at, updated_at, title, file_name, file_size',
      }),
    sort_order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc',
      }),
  }),

  // Ingestion trigger
  triggerIngestion: Joi.object({
    document_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Document ID must be a valid UUID',
        'any.required': 'Document ID is required',
      }),
  }),
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      const customError = new CustomError(errorMessage, 400, ErrorCodes.VALIDATION_ERROR);
      return next(customError);
    }

    // Replace req.query with validated and sanitized data
    req.query = value;
    next();
  };
};

/**
 * Validate URL parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      const customError = new CustomError(errorMessage, 400, ErrorCodes.VALIDATION_ERROR);
      return next(customError);
    }

    // Replace req.params with validated and sanitized data
    req.params = value;
    next();
  };
};

/**
 * UUID validation schema
 */
export const uuidSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'ID must be a valid UUID',
      'any.required': 'ID is required',
    }),
});
