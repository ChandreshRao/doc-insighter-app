import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes';
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

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  let mockAuthServiceInstance: jest.Mocked<AuthService>;

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
    } as any;
    mockAuthService.mockImplementation(() => mockAuthServiceInstance);
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test123!',
      first_name: 'Test',
      last_name: 'User',
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        ...validUserData,
        role: 'viewer',
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAuthServiceInstance.registerUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockUser,
        message: 'User registered successfully',
        timestamp: expect.any(String),
      });
      expect(mockAuthServiceInstance.registerUser).toHaveBeenCalledWith(validUserData);
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
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 500 for service error', async () => {
      mockAuthServiceInstance.registerUser.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Service error');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Test123!',
    };

    it('should login user successfully', async () => {
      const mockLoginResponse = {
        user: {
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
        },
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_in: 3600,
      };

      mockAuthServiceInstance.loginUser.mockResolvedValue(mockLoginResponse);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockLoginResponse,
        message: 'Login successful',
        timestamp: expect.any(String),
      });
      expect(mockAuthServiceInstance.loginUser).toHaveBeenCalledWith(validLoginData);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthServiceInstance.loginUser.mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      mockAuthServiceInstance.logoutUser.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Logout successful',
        timestamp: expect.any(String),
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Authentication required',
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
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

      expect(response.body).toEqual({
        success: true,
        data: mockTokenResponse,
        message: 'Token refreshed successfully',
        timestamp: expect.any(String),
      });
      expect(mockAuthServiceInstance.refreshToken).toHaveBeenCalledWith('valid_refresh_token');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Refresh token is required',
        timestamp: expect.any(String),
      });
    });

    it('should return 500 for invalid refresh token', async () => {
      mockAuthServiceInstance.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid_token' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
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
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUser,
        timestamp: expect.any(String),
      });
      expect(mockAuthServiceInstance.getUserById).toHaveBeenCalledWith('user-123');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Authentication required',
        timestamp: expect.any(String),
      });
    });

    it('should return 404 if user not found', async () => {
      mockAuthServiceInstance.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid_token')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found',
        timestamp: expect.any(String),
      });
    });
  });

  describe('PUT /api/auth/profile', () => {
    const updateData = {
      first_name: 'Updated',
      last_name: 'Name',
    };

    it('should update user profile successfully', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Updated',
        last_name: 'Name',
        role: 'viewer',
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAuthServiceInstance.updateUser.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer valid_token')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedUser,
        message: 'Profile updated successfully',
        timestamp: expect.any(String),
      });
      expect(mockAuthServiceInstance.updateUser).toHaveBeenCalledWith('user-123', updateData);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send(updateData)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Authentication required',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        first_name: '',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer valid_token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/change-password', () => {
    const passwordData = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
    };

    it('should change password successfully', async () => {
      mockAuthServiceInstance.changePassword.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid_token')
        .send(passwordData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Password changed successfully',
        timestamp: expect.any(String),
      });
      expect(mockAuthServiceInstance.changePassword).toHaveBeenCalledWith(
        'user-123',
        passwordData.currentPassword,
        passwordData.newPassword
      );
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send(passwordData)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Authentication required',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for missing passwords', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid_token')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Current password and new password are required',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for weak new password', async () => {
      const weakPasswordData = {
        currentPassword: 'OldPassword123!',
        newPassword: '123',
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid_token')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'New password must be at least 8 characters long',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for service error', async () => {
      mockAuthServiceInstance.changePassword.mockRejectedValue(new Error('Current password is incorrect'));

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid_token')
        .send(passwordData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Current password is incorrect',
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should return 501 for not implemented', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .set('Authorization', 'Bearer valid_token')
        .send({ verificationToken: 'token123' })
        .expect(501);

      expect(response.body).toEqual({
        success: false,
        error: 'Email verification not implemented yet',
        timestamp: expect.any(String),
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ verificationToken: 'token123' })
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Authentication required',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for missing verification token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .set('Authorization', 'Bearer valid_token')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Verification token is required',
        timestamp: expect.any(String),
      });
    });
  });
});
