import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { validateRequest, validationSchemas } from '../middleware/validationMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Create service instance on-demand to avoid database initialization issues
const getAuthService = () => new AuthService();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  validateRequest(validationSchemas.register),
  asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    
    const newUser = await getAuthService().registerUser(userData);
    
    logger.info('User registration successful', {
      userId: newUser.id,
      email: newUser.email,
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User registered successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT tokens
 * @access  Public
 */
router.post('/login',
  validateRequest(validationSchemas.login),
  asyncHandler(async (req: Request, res: Response) => {
    const loginData = req.body;
    
    const loginResponse = await getAuthService().loginUser(loginData);
    
    logger.info('User login successful', {
      userId: loginResponse.user.id,
      email: loginResponse.user.email,
    });

    res.status(200).json({
      success: true,
      data: loginResponse,
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate tokens
 * @access  Private
 */
router.post('/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    await getAuthService().logoutUser(userId);
    
    logger.info('User logout successful', {
      userId,
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
        timestamp: new Date().toISOString(),
      });
    }

    const tokenResponse = await getAuthService().refreshToken(refresh_token);
    
    logger.info('Token refresh successful', {
      refreshToken: refresh_token.substring(0, 20) + '...',
    });

    return res.status(200).json({
      success: true,
      data: tokenResponse,
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    const user = await getAuthService().getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile',
  validateRequest(validationSchemas.updateUser),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    const updateData = req.body;
    const updatedUser = await getAuthService().updateUser(userId, updateData);
    
    logger.info('User profile updated', {
      userId,
      updatedFields: Object.keys(updateData),
    });

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.user_id;
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      await getAuthService().changePassword(userId, currentPassword, newPassword);
      
      logger.info('Password changed successfully', {
        userId,
      });

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Password change failed:', error);
      
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email address
 * @access  Private
 */
router.post('/verify-email',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.user_id;
    const { verificationToken } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required',
        timestamp: new Date().toISOString(),
      });
    }

    // TODO: Implement email verification logic
    // This would involve:
    // 1. Validating verification token
    // 2. Checking token expiration
    // 3. Updating user email_verified status
    // 4. Logging verification event

    return res.status(501).json({
      success: false,
      error: 'Email verification not implemented yet',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
