import request from 'supertest';
import express from 'express';
import userRoutes from '../routes/userRoutes';
import { AuthService } from '../services/authService';
import { AuthUtils } from '../utils/auth';
import { getDatabase } from '../database/connection';

// Mock dependencies
jest.mock('../services/authService');
jest.mock('../utils/auth');
jest.mock('../database/connection');
jest.mock('../utils/logger');

const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;
const mockAuthUtils = AuthUtils as jest.Mocked<typeof AuthUtils>;

// Mock authentication middleware
const mockAuthenticateToken = jest.fn((req: any, res: any, next: any) => {
  req.user = { user_id: 'user-123', email: 'test@example.com', role: 'admin' };
  next();
});

const mockRequireAdmin = jest.fn((req: any, res: any, next: any) => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
});

const mockRequireEditor = jest.fn((req: any, res: any, next: any) => {
  if (['admin', 'editor'].includes(req.user?.role)) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
});

// Mock the middleware
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: mockAuthenticateToken,
  requireAdmin: mockRequireAdmin,
  requireEditor: mockRequireEditor,
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  let mockAuthServiceInstance: jest.Mocked<AuthService>;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthServiceInstance = {
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      registerUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    } as any;
    mockAuthService.mockImplementation(() => mockAuthServiceInstance);

    mockDb = {
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
    };
    (getDatabase as jest.Mock).mockReturnValue(mockDb);
  });

  describe('GET /api/users', () => {
    it('should get all users successfully (admin only)', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          username: 'user1',
          first_name: 'User',
          last_name: 'One',
          role: 'viewer',
          is_active: true,
          email_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          username: 'user2',
          first_name: 'User',
          last_name: 'Two',
          role: 'editor',
          is_active: true,
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockResult = {
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          total_pages: 1,
        },
      };

      mockAuthServiceInstance.getAllUsers.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUsers,
        pagination: mockResult.pagination,
        timestamp: expect.any(String),
      });
      expect(mockAuthServiceInstance.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'desc',
      });
    });

    it('should return 403 for non-admin user', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'user-123', email: 'test@example.com', role: 'viewer' };
        next();
      });

      const response = await request(app)
        .get('/api/users')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should handle pagination parameters', async () => {
      const mockResult = {
        users: [],
        pagination: { page: 2, limit: 10, total: 0, total_pages: 0 },
      };

      mockAuthServiceInstance.getAllUsers.mockResolvedValue(mockResult);

      await request(app)
        .get('/api/users?page=2&limit=10&sort_by=email&sort_order=asc')
        .expect(200);

      expect(mockAuthServiceInstance.getAllUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        sort_by: 'email',
        sort_order: 'asc',
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID successfully (admin)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        role: 'viewer',
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAuthServiceInstance.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/user-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUser,
        timestamp: expect.any(String),
      });
      expect(mockAuthServiceInstance.getUserById).toHaveBeenCalledWith('user-123');
    });

    it('should get user by ID successfully (self)', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'user-123', email: 'test@example.com', role: 'viewer' };
        next();
      });

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        role: 'viewer',
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAuthServiceInstance.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/user-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUser,
        timestamp: expect.any(String),
      });
    });

    it('should return 403 for insufficient permissions', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'user-456', email: 'other@example.com', role: 'viewer' };
        next();
      });

      const response = await request(app)
        .get('/api/users/user-123')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
        timestamp: expect.any(String),
      });
    });

    it('should return 404 if user not found', async () => {
      mockAuthServiceInstance.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found',
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /api/users', () => {
    const validUserData = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'Password123!',
      first_name: 'New',
      last_name: 'User',
      role: 'viewer',
    };

    it('should create user successfully (admin only)', async () => {
      const mockUser = {
        id: 'user-456',
        ...validUserData,
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAuthServiceInstance.registerUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users')
        .send(validUserData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockUser,
        message: 'User created successfully',
        timestamp: expect.any(String),
      });
      expect(mockAuthServiceInstance.registerUser).toHaveBeenCalledWith(validUserData);
    });

    it('should return 403 for non-admin user', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'user-123', email: 'test@example.com', role: 'viewer' };
        next();
      });

      const response = await request(app)
        .post('/api/users')
        .send(validUserData)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'test',
        password: '123',
        first_name: '',
        last_name: '',
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/users/:id', () => {
    const updateData = {
      first_name: 'Updated',
      last_name: 'Name',
      role: 'editor',
    };

    it('should update user successfully (admin only)', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Updated',
        last_name: 'Name',
        role: 'editor',
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAuthServiceInstance.updateUser.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/users/user-123')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedUser,
        message: 'User updated successfully',
        timestamp: expect.any(String),
      });
      expect(mockAuthServiceInstance.updateUser).toHaveBeenCalledWith('user-123', updateData);
    });

    it('should return 403 for non-admin user', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'user-123', email: 'test@example.com', role: 'viewer' };
        next();
      });

      const response = await request(app)
        .put('/api/users/user-123')
        .send(updateData)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully (admin only)', async () => {
      mockAuthServiceInstance.deleteUser.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/users/user-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'User deleted successfully',
        timestamp: expect.any(String),
      });
      expect(mockAuthServiceInstance.deleteUser).toHaveBeenCalledWith('user-123');
    });

    it('should return 400 for self-deletion', async () => {
      const response = await request(app)
        .delete('/api/users/user-123')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Cannot delete your own account',
        timestamp: expect.any(String),
      });
    });

    it('should return 403 for non-admin user', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'user-123', email: 'test@example.com', role: 'viewer' };
        next();
      });

      const response = await request(app)
        .delete('/api/users/user-456')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });
  });

  describe('POST /api/users/:id/activate', () => {
    it('should activate user successfully (admin only)', async () => {
      mockDb.update.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/users/user-123/activate')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'User activated successfully',
        timestamp: expect.any(String),
      });
      expect(mockDb.update).toHaveBeenCalledWith({
        is_active: true,
        updated_at: expect.any(Date),
      });
    });

    it('should return 404 if user not found', async () => {
      mockDb.update.mockResolvedValue(0);

      const response = await request(app)
        .post('/api/users/nonexistent/activate')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found',
        timestamp: expect.any(String),
      });
    });

    it('should return 403 for non-admin user', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'user-123', email: 'test@example.com', role: 'viewer' };
        next();
      });

      const response = await request(app)
        .post('/api/users/user-456/activate')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });
  });

  describe('POST /api/users/:id/deactivate', () => {
    it('should deactivate user successfully (admin only)', async () => {
      mockDb.update.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/users/user-456/deactivate')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'User deactivated successfully',
        timestamp: expect.any(String),
      });
      expect(mockDb.update).toHaveBeenCalledWith({
        is_active: false,
        updated_at: expect.any(Date),
      });
    });

    it('should return 400 for self-deactivation', async () => {
      const response = await request(app)
        .post('/api/users/user-123/deactivate')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Cannot deactivate your own account',
        timestamp: expect.any(String),
      });
    });

    it('should return 404 if user not found', async () => {
      mockDb.update.mockResolvedValue(0);

      const response = await request(app)
        .post('/api/users/nonexistent/deactivate')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found',
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /api/users/:id/documents', () => {
    it('should get user documents successfully (admin)', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          title: 'Document 1',
          description: 'Test document',
          file_name: 'test1.pdf',
          file_type: 'pdf',
          file_size: 1024,
          status: 'completed',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDb.count.mockResolvedValue([{ count: '1' }]);
      mockDb.select.mockResolvedValue(mockDocuments);

      const response = await request(app)
        .get('/api/users/user-123/documents')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockDocuments,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
        },
        timestamp: expect.any(String),
      });
    });

    it('should get user documents successfully (self)', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'user-123', email: 'test@example.com', role: 'viewer' };
        next();
      });

      const mockDocuments = [];
      mockDb.count.mockResolvedValue([{ count: '0' }]);
      mockDb.select.mockResolvedValue(mockDocuments);

      const response = await request(app)
        .get('/api/users/user-123/documents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDocuments);
    });

    it('should return 403 for insufficient permissions', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'user-456', email: 'other@example.com', role: 'viewer' };
        next();
      });

      const response = await request(app)
        .get('/api/users/user-123/documents')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /api/users/stats/overview', () => {
    it('should get user statistics successfully (admin only)', async () => {
      const mockRoleStats = [
        { role: 'admin', count: '1' },
        { role: 'editor', count: '2' },
        { role: 'viewer', count: '5' },
      ];

      mockDb.select.mockReturnValue(mockRoleStats);
      mockDb.count.mockResolvedValueOnce([{ activeCount: '8' }]);
      mockDb.count.mockResolvedValueOnce([{ recentCount: '3' }]);
      mockDb.count.mockResolvedValueOnce([{ todayLoginCount: '2' }]);

      const response = await request(app)
        .get('/api/users/stats/overview')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          total: 8,
          byRole: {
            admin: 1,
            editor: 2,
            viewer: 5,
          },
          recent: 3,
          activeToday: 2,
        },
        timestamp: expect.any(String),
      });
    });

    it('should return 403 for non-admin user', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'user-123', email: 'test@example.com', role: 'viewer' };
        next();
      });

      const response = await request(app)
        .get('/api/users/stats/overview')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });
  });
});
