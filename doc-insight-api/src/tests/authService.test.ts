import { AuthService } from '../services/authService';
import { getDatabase } from '../database/connection';
import { AuthUtils } from '../utils/auth';
import { CreateUserRequest, LoginRequest, UpdateUserRequest } from '../types';

// Mock the database connection
jest.mock('../database/connection');
jest.mock('../utils/auth');
jest.mock('../utils/logger');

const mockDb = {
  insert: jest.fn(),
  where: jest.fn(),
  first: jest.fn(),
  update: jest.fn(),
  del: jest.fn(),
  returning: jest.fn(),
};

const mockKnex = {
  ...mockDb,
  where: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  whereNot: jest.fn().mockReturnThis(),
  whereIn: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  del: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
};

(getDatabase as jest.Mock).mockReturnValue(mockKnex);

describe('AuthService', () => {
  let authService: AuthService;
  let mockAuthUtils: jest.Mocked<typeof AuthUtils>;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    mockAuthUtils = AuthUtils as jest.Mocked<typeof AuthUtils>;
  });

  describe('registerUser', () => {
    const validUserData: CreateUserRequest = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test123!',
      first_name: 'Test',
      last_name: 'User',
    };

    it('should register a new user successfully', async () => {
      // Mock database responses
      mockKnex.first.mockResolvedValue(null); // No existing user
      mockKnex.insert.mockReturnValue(mockKnex);
      mockKnex.returning.mockResolvedValue([{
        id: 'user-123',
        ...validUserData,
        password_hash: 'hashed_password',
        role: 'viewer',
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      }]);

      mockAuthUtils.hashPassword.mockResolvedValue('hashed_password');
      mockAuthUtils.sanitizeUser.mockReturnValue({
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
      });

      const result = await authService.registerUser(validUserData);

      expect(result).toBeDefined();
      expect(result.email).toBe(validUserData.email);
      expect(mockKnex.insert).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: 'viewer',
        is_active: true,
        email_verified: false,
      });
    });

    it('should throw error if email already exists', async () => {
      mockKnex.first.mockResolvedValue({
        email: 'test@example.com',
        username: 'differentuser',
      });

      await expect(authService.registerUser(validUserData))
        .rejects
        .toThrow('Email already registered');
    });

    it('should throw error if username already exists', async () => {
      mockKnex.first.mockResolvedValue({
        email: 'different@example.com',
        username: 'testuser',
      });

      await expect(authService.registerUser(validUserData))
        .rejects
        .toThrow('Username already taken');
    });
  });

  describe('loginUser', () => {
    const validLoginData: LoginRequest = {
      email: 'test@example.com',
      password: 'Test123!',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User',
      role: 'viewer',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should login user successfully', async () => {
      mockKnex.first.mockResolvedValue(mockUser);
      mockAuthUtils.comparePassword.mockResolvedValue(true);
      mockAuthUtils.generateAccessToken.mockReturnValue('access_token');
      mockAuthUtils.generateRefreshToken.mockReturnValue('refresh_token');
      mockAuthUtils.generateSecureToken.mockReturnValue('secure_token');
      mockKnex.insert.mockReturnValue(mockKnex);
      mockKnex.update.mockReturnValue(mockKnex);
      mockAuthUtils.sanitizeUser.mockReturnValue({
        ...mockUser,
        password_hash: undefined,
      });

      const result = await authService.loginUser(validLoginData);

      expect(result).toBeDefined();
      expect(result.access_token).toBe('access_token');
      expect(result.refresh_token).toBe('refresh_token');
      expect(result.user).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      mockKnex.first.mockResolvedValue(null);

      await expect(authService.loginUser(validLoginData))
        .rejects
        .toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      mockKnex.first.mockResolvedValue({
        ...mockUser,
        is_active: false,
      });

      await expect(authService.loginUser(validLoginData))
        .rejects
        .toThrow('Invalid credentials');
    });

    it('should throw error for wrong password', async () => {
      mockKnex.first.mockResolvedValue(mockUser);
      mockAuthUtils.comparePassword.mockResolvedValue(false);

      await expect(authService.loginUser(validLoginData))
        .rejects
        .toThrow('Invalid credentials');
    });
  });

  describe('logoutUser', () => {
    it('should logout user successfully', async () => {
      mockKnex.update.mockReturnValue(mockKnex);

      await expect(authService.logoutUser('user-123'))
        .resolves
        .toBeUndefined();

      expect(mockKnex.update).toHaveBeenCalledWith({ is_active: false });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockDecoded = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'viewer',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      mockAuthUtils.verifyToken.mockReturnValue(mockDecoded);
      mockKnex.first.mockResolvedValue({ id: 'session-123' });
      mockKnex.first.mockResolvedValueOnce({ id: 'session-123' });
      mockKnex.first.mockResolvedValueOnce(mockUser);
      mockAuthUtils.generateAccessToken.mockReturnValue('new_access_token');

      const result = await authService.refreshToken('refresh_token');

      expect(result).toBeDefined();
      expect(result.access_token).toBe('new_access_token');
    });

    it('should throw error for invalid refresh token', async () => {
      mockAuthUtils.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid_token'))
        .rejects
        .toThrow('Token refresh failed');
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      mockKnex.first.mockResolvedValue(mockUser);
      mockAuthUtils.sanitizeUser.mockReturnValue({
        ...mockUser,
        password_hash: undefined,
      });

      const result = await authService.getUserById('user-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('user-123');
    });

    it('should return null if user not found', async () => {
      mockKnex.first.mockResolvedValue(null);

      const result = await authService.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    const updateData: UpdateUserRequest = {
      first_name: 'Updated',
      last_name: 'Name',
    };

    it('should update user successfully', async () => {
      mockKnex.first.mockResolvedValue(null); // No conflicts
      mockKnex.update.mockReturnValue(mockKnex);
      mockKnex.returning.mockResolvedValue([{
        ...mockUser,
        ...updateData,
        updated_at: new Date(),
      }]);
      mockAuthUtils.sanitizeUser.mockReturnValue({
        ...mockUser,
        ...updateData,
        password_hash: undefined,
        updated_at: new Date(),
      });

      const result = await authService.updateUser('user-123', updateData);

      expect(result).toBeDefined();
      expect(result.first_name).toBe('Updated');
      expect(result.last_name).toBe('Name');
    });

    it('should throw error if email already exists', async () => {
      mockKnex.first.mockResolvedValue({
        email: 'test@example.com',
        id: 'different-user',
      });

      await expect(authService.updateUser('user-123', { email: 'test@example.com' }))
        .rejects
        .toThrow('Email already registered');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockKnex.update.mockReturnValue(mockKnex);
      mockKnex.update.mockResolvedValue(1);

      await expect(authService.deleteUser('user-123'))
        .resolves
        .toBeUndefined();

      expect(mockKnex.update).toHaveBeenCalledWith({
        is_active: false,
        updated_at: expect.any(Date),
      });
    });

    it('should throw error if user not found', async () => {
      mockKnex.update.mockResolvedValue(0);

      await expect(authService.deleteUser('nonexistent'))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions successfully', async () => {
      mockKnex.del.mockResolvedValue(5);

      const result = await authService.cleanupExpiredSessions();

      expect(result).toBe(5);
      expect(mockKnex.del).toHaveBeenCalled();
    });
  });
});
