import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes';
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

// Mock authentication middleware for integration tests
const mockAuthenticateToken = jest.fn();
const mockRequireAdmin = jest.fn();
const mockRequireEditor = jest.fn();

jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: mockAuthenticateToken,
  requireAdmin: mockRequireAdmin,
  requireEditor: mockRequireEditor,
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

describe('Authentication Integration Tests', () => {
  let mockAuthServiceInstance: jest.Mocked<AuthService>;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuthServiceInstance = {
      registerUser: jest.fn(),
      loginUser: jest.fn(),
      logoutUser: jest.fn(),
      refreshToken: jest.fn(),
      getUserById: jest.fn(),
      updateUser: jest.fn(),
      changePassword: jest.fn(),
      getAllUsers: jest.fn(),
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

    // Reset middleware mocks
    mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
      req.user = { user_id: 'user-123', email: 'test@example.com', role: 'admin' };
      next();
    });
    mockRequireAdmin.mockImplementation((req: any, res: any, next: any) => {
      if (req.user?.role === 'admin') {
        next();
      } else {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
      }
    });
    mockRequireEditor.mockImplementation((req: any, res: any, next: any) => {
      if (['admin', 'editor'].includes(req.user?.role)) {
        next();
      } else {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
      }
    });
  });

  describe('Complete User Registration and Login Flow', () => {
    it('should complete full registration to login flow', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'Password123!',
        first_name: 'New',
        last_name: 'User',
      };

      const mockUser = {
        id: 'user-456',
        ...userData,
        role: 'viewer',
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockLoginResponse = {
        user: mockUser,
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        expires_in: 3600,
      };

      // Mock registration
      mockAuthServiceInstance.registerUser.mockResolvedValue(mockUser);

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.email).toBe(userData.email);

      // Mock login
      mockAuthServiceInstance.loginUser.mockResolvedValue(mockLoginResponse);

      // Login user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.access_token).toBe('access_token_123');
      expect(loginResponse.body.data.user.id).toBe('user-456');
    });

    it('should handle registration with existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'Password123!',
        first_name: 'New',
        last_name: 'User',
      };

      // Mock service to throw error for existing email
      mockAuthServiceInstance.registerUser.mockRejectedValue(new Error('Email already registered'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');
    });
  });

  describe('Complete Authentication and Authorization Flow', () => {
    it('should complete admin user management flow', async () => {
      const adminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        username: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockUsers = [
        adminUser,
        {
          id: 'user-456',
          email: 'user@example.com',
          username: 'user',
          first_name: 'Regular',
          last_name: 'User',
          role: 'viewer',
          is_active: true,
          email_verified: false,
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

      // Mock admin authentication
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { user_id: 'admin-123', email: 'admin@example.com', role: 'admin' };
        next();
      });

      // Mock get all users
      mockAuthServiceInstance.getAllUsers.mockResolvedValue(mockResult);

      // Get all users (admin only)
      const usersResponse = await request(app)
        .get('/api/users')
        .expect(200);

      expect(usersResponse.body.success).toBe(true);
      expect(usersResponse.body.data).toHaveLength(2);

      // Mock get specific user
      mockAuthServiceInstance.getUserById.mockResolvedValue(adminUser);

      // Get specific user
      const userResponse = await request(app)
        .get('/api/users/admin-123')
        .expect(200);

      expect(userResponse.body.success).toBe(true);
      expect(userResponse.body.data.id).toBe('admin-123');
    });

    it('should complete editor user flow', async () => {
      const editorUser = {
        id: 'editor-123',
        email: 'editor@example.com',
        username: 'editor',
        first_name: 'Editor',
        last_name: 'User',
        role: 'editor',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock editor authentication
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { user_id: 'editor-123', email: 'editor@example.com', role: 'editor' };
        next();
      });

      // Mock get user by ID
      mockAuthServiceInstance.getUserById.mockResolvedValue(editorUser);

      // Editor can view their own profile
      const profileResponse = await request(app)
        .get('/api/users/editor-123')
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.id).toBe('editor-123');

      // Editor cannot access admin-only endpoints
      mockRequireAdmin.mockImplementation((req: any, res: any, next: any) => {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
      });

      const adminResponse = await request(app)
        .get('/api/users')
        .expect(403);

      expect(adminResponse.body.success).toBe(false);
      expect(adminResponse.body.error).toBe('Insufficient permissions');
    });

    it('should complete viewer user flow', async () => {
      const viewerUser = {
        id: 'viewer-123',
        email: 'viewer@example.com',
        username: 'viewer',
        first_name: 'Viewer',
        last_name: 'User',
        role: 'viewer',
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock viewer authentication
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { user_id: 'viewer-123', email: 'viewer@example.com', role: 'viewer' };
        next();
      });

      // Mock get user by ID
      mockAuthServiceInstance.getUserById.mockResolvedValue(viewerUser);

      // Viewer can view their own profile
      const profileResponse = await request(app)
        .get('/api/users/viewer-123')
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.id).toBe('viewer-123');

      // Viewer cannot access admin or editor endpoints
      mockRequireAdmin.mockImplementation((req: any, res: any, next: any) => {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
      });

      mockRequireEditor.mockImplementation((req: any, res: any, next: any) => {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
      });

      const adminResponse = await request(app)
        .get('/api/users')
        .expect(403);

      expect(adminResponse.body.success).toBe(false);
    });
  });

  describe('Token Refresh and Logout Flow', () => {
    it('should complete token refresh flow', async () => {
      const mockTokenResponse = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 3600,
      };

      mockAuthServiceInstance.refreshToken.mockResolvedValue(mockTokenResponse);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'valid_refresh_token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.access_token).toBe('new_access_token');
    });

    it('should complete logout flow', async () => {
      mockAuthServiceInstance.logoutUser.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('Profile Management Flow', () => {
    it('should complete profile update flow', async () => {
      const originalUser = {
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

      const updatedUser = {
        ...originalUser,
        first_name: 'Updated',
        last_name: 'Name',
        updated_at: new Date(),
      };

      mockAuthServiceInstance.updateUser.mockResolvedValue(updatedUser);

      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe('Updated');
      expect(response.body.data.last_name).toBe('Name');
    });

    it('should complete password change flow', async () => {
      mockAuthServiceInstance.changePassword.mockResolvedValue(undefined);

      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid token in protected routes', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ success: false, error: 'Invalid token' });
      });

      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should handle service errors gracefully', async () => {
      mockAuthServiceInstance.loginUser.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database connection failed');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Role-Based Access Control Integration', () => {
    it('should enforce role hierarchy across all endpoints', async () => {
      const testCases = [
        { role: 'admin', canAccessAdmin: true, canAccessEditor: true, canAccessViewer: true },
        { role: 'editor', canAccessAdmin: false, canAccessEditor: true, canAccessViewer: true },
        { role: 'viewer', canAccessAdmin: false, canAccessEditor: false, canAccessViewer: true },
      ];

      for (const testCase of testCases) {
        // Mock authentication for current role
        mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
          req.user = { user_id: 'user-123', email: 'test@example.com', role: testCase.role };
          next();
        });

        // Test admin endpoint access
        if (testCase.canAccessAdmin) {
          mockRequireAdmin.mockImplementation((req: any, res: any, next: any) => next());
        } else {
          mockRequireAdmin.mockImplementation((req: any, res: any, next: any) => {
            res.status(403).json({ success: false, error: 'Insufficient permissions' });
          });
        }

        const adminResponse = await request(app).get('/api/users');
        expect(adminResponse.status).toBe(testCase.canAccessAdmin ? 200 : 403);

        // Test editor endpoint access
        if (testCase.canAccessEditor) {
          mockRequireEditor.mockImplementation((req: any, res: any, next: any) => next());
        } else {
          mockRequireEditor.mockImplementation((req: any, res: any, next: any) => {
            res.status(403).json({ success: false, error: 'Insufficient permissions' });
          });
        }

        // Test viewer endpoint access (self-access)
        const viewerResponse = await request(app).get('/api/users/user-123');
        expect(viewerResponse.status).toBe(200); // Users can always access their own profile
      }
    });
  });
});
