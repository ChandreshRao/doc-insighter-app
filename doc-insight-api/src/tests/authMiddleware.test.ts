import { Request, Response, NextFunction } from 'express';
import { 
  authenticateToken, 
  requireRole, 
  requireAnyRole, 
  requireAdmin, 
  requireEditor, 
  requireAuth,
  optionalAuth 
} from '../middleware/authMiddleware';
import { AuthUtils } from '../utils/auth';
import { getDatabase } from '../database/connection';

// Mock dependencies
jest.mock('../utils/auth');
jest.mock('../database/connection');
jest.mock('../utils/logger');

const mockAuthUtils = AuthUtils as jest.Mocked<typeof AuthUtils>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      headers: {},
      user: undefined,
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();

    mockDb = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
      update: jest.fn(),
    };
    (getDatabase as jest.Mock).mockReturnValue(mockDb);
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', async () => {
      const mockDecoded = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      mockAuthUtils.extractTokenFromHeader.mockReturnValue('valid_token');
      mockAuthUtils.verifyToken.mockReturnValue(mockDecoded);
      mockAuthUtils.generateSecureToken.mockReturnValue('secure_token');
      mockDb.first.mockResolvedValue({ id: 'session-123' });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockDecoded);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 for missing authorization header', async () => {
      mockRequest.headers = {};

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token required',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      mockAuthUtils.extractTokenFromHeader.mockReturnValue(null);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token required',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token',
      };

      mockAuthUtils.extractTokenFromHeader.mockReturnValue('invalid_token');
      mockAuthUtils.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for inactive session', async () => {
      const mockDecoded = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      mockAuthUtils.extractTokenFromHeader.mockReturnValue('valid_token');
      mockAuthUtils.verifyToken.mockReturnValue(mockDecoded);
      mockAuthUtils.generateSecureToken.mockReturnValue('secure_token');
      mockDb.first.mockResolvedValue(null); // No active session

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token invalid or expired',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update last used timestamp on successful authentication', async () => {
      const mockDecoded = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      mockAuthUtils.extractTokenFromHeader.mockReturnValue('valid_token');
      mockAuthUtils.verifyToken.mockReturnValue(mockDecoded);
      mockAuthUtils.generateSecureToken.mockReturnValue('secure_token');
      mockDb.first.mockResolvedValue({ id: 'session-123' });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockDb.update).toHaveBeenCalledWith({ last_used_at: expect.any(Date) });
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      mockRequest.user = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'editor',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };
    });

    it('should allow access for sufficient role', () => {
      const middleware = requireRole('viewer');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access for exact role', () => {
      const middleware = requireRole('editor');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for insufficient role', () => {
      const middleware = requireRole('admin');

      mockAuthUtils.hasRole.mockReturnValue(false);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', () => {
      mockRequest.user = undefined;
      const middleware = requireRole('viewer');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAnyRole', () => {
    beforeEach(() => {
      mockRequest.user = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'editor',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };
    });

    it('should allow access for user with one of the required roles', () => {
      const middleware = requireAnyRole(['editor', 'admin']);

      mockAuthUtils.hasAnyRole.mockReturnValue(true);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for user without any of the required roles', () => {
      const middleware = requireAnyRole(['admin']);

      mockAuthUtils.hasAnyRole.mockReturnValue(false);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', () => {
      mockRequest.user = undefined;
      const middleware = requireAnyRole(['viewer']);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should be an alias for requireRole("admin")', () => {
      expect(requireAdmin).toBe(requireRole('admin'));
    });
  });

  describe('requireEditor', () => {
    it('should be an alias for requireAnyRole(["editor", "admin"])', () => {
      expect(requireEditor).toBe(requireAnyRole(['editor', 'admin']));
    });
  });

  describe('requireAuth', () => {
    it('should be an alias for requireAnyRole(["viewer", "editor", "admin"])', () => {
      expect(requireAuth).toBe(requireAnyRole(['viewer', 'editor', 'admin']));
    });
  });

  describe('optionalAuth', () => {
    it('should continue without authentication when no token provided', async () => {
      mockRequest.headers = {};

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should authenticate user when valid token provided', async () => {
      const mockDecoded = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      mockAuthUtils.extractTokenFromHeader.mockReturnValue('valid_token');
      mockAuthUtils.verifyToken.mockReturnValue(mockDecoded);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockDecoded);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication when invalid token provided', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token',
      };

      mockAuthUtils.extractTokenFromHeader.mockReturnValue('invalid_token');
      mockAuthUtils.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should continue without authentication when malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      mockAuthUtils.extractTokenFromHeader.mockReturnValue(null);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });
  });
});
