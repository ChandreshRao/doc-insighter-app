import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '../utils/auth';
import { UserRole, JwtPayload } from '../types';
import { logger } from '../utils/logger';
import { getDatabase } from '../database/connection';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify token
    const decoded = AuthUtils.verifyToken(token);
    
    // Check if token is blacklisted (logout)
    const db = getDatabase();
    const session = await db('user_sessions')
      .where('token_hash', AuthUtils.generateSecureToken())
      .where('is_active', true)
      .where('expires_at', '>', new Date())
      .first();

    if (!session) {
      res.status(401).json({
        success: false,
        error: 'Token invalid or expired',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Attach user info to request
    req.user = decoded;
    
    // Update last used timestamp
    await db('user_sessions')
      .where('id', session.id)
      .update({ last_used_at: new Date() });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Middleware to require specific role
 */
export const requireRole = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!AuthUtils.hasRole(req.user.role, requiredRole)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.user_id,
        userRole: req.user.role,
        requiredRole,
        endpoint: req.originalUrl,
      });
      
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require any of the specified roles
 */
export const requireAnyRole = (requiredRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!AuthUtils.hasAnyRole(req.user.role, requiredRoles)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.user_id,
        userRole: req.user.role,
        requiredRoles,
        endpoint: req.originalUrl,
      });
      
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to require editor or admin role
 */
export const requireEditor = requireAnyRole(['editor', 'admin']);

/**
 * Middleware to require any authenticated user
 */
export const requireAuth = requireAnyRole(['viewer', 'editor', 'admin']);

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = AuthUtils.verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
