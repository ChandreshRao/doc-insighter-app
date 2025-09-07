import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { validateRequest, validationSchemas, validateParams, uuidSchema, validateQuery } from '../middleware/validationMiddleware';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { getDatabase } from '../database/connection';


const router = Router();

// Create service instance on-demand to avoid database initialization issues
const getAuthService = () => new AuthService();

// Get database instance
const getDb = () => getDatabase();

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get('/',
  authenticateToken,
  requireAdmin,
  validateQuery(validationSchemas.pagination),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    
    // Get users using the service
    const result = await getAuthService().getAllUsers({
      page: Number(page),
      limit: parseInt(limit as string),
      sort_by: sort_by as string,
      sort_order: sort_order as string
    });

    logger.info('Users retrieved successfully', {
      userId: req.user?.user_id,
      page,
      limit,
      total: result.pagination.total,
      totalPages: result.pagination.total_pages,
    });

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin/editor or self)
 * @access  Admin/Editor or Self
 */
router.get('/:id',
  authenticateToken,
  validateParams(uuidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUserId = req.user?.user_id;
    const currentUserRole = req.user?.role;

    // Check if user can access this profile
    if (id !== currentUserId && currentUserRole !== 'admin' && currentUserRole !== 'editor') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
      });
    }

    const user = await getAuthService().getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('User retrieved successfully', {
      requestedUserId: id,
      currentUserId,
      currentUserRole,
    });

    return res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/users
 * @desc    Create new user (admin only)
 * @access  Admin
 */
router.post('/',
  authenticateToken,
  requireAdmin,
  validateRequest(validationSchemas.register),
  asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    
    const newUser = await getAuthService().registerUser(userData);
    
    logger.info('User created by admin', {
      createdUserId: newUser.id,
      adminUserId: req.user?.user_id,
      userEmail: newUser.email,
    });

    return res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (admin only)
 * @access  Admin
 */
router.put('/:id',
  authenticateToken,
  requireAdmin,
  validateParams(uuidSchema),
  validateRequest(validationSchemas.updateUser),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedUser = await getAuthService().updateUser(id, updateData);
    
    logger.info('User updated by admin', {
      updatedUserId: id,
      adminUserId: req.user?.user_id,
      updatedFields: Object.keys(updateData),
    });

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (admin only)
 * @access  Admin
 */
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  validateParams(uuidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.user?.user_id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
        timestamp: new Date().toISOString(),
      });
    }

    await getAuthService().deleteUser(id);
    
    logger.info('User deleted by admin', {
      deletedUserId: id,
      adminUserId: req.user?.user_id,
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/users/:id/activate
 * @desc    Activate user account (admin only)
 * @access  Admin
 */
router.post('/:id/activate',
  authenticateToken,
  requireAdmin,
  validateParams(uuidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const db = getDb();
    const result = await db('users')
      .where('id', id)
      .update({ 
        is_active: true, 
        updated_at: new Date() 
      });


    if (result === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('User activated by admin', {
      activatedUserId: id,
      adminUserId: req.user?.user_id,
    });

    return res.status(200).json({
      success: true,
      message: 'User activated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/users/:id/deactivate
 * @desc    Deactivate user account (admin only)
 * @access  Admin
 */
router.post('/:id/deactivate',
  authenticateToken,
  requireAdmin,
  validateParams(uuidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Prevent admin from deactivating themselves
    if (id === req.user?.user_id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account',
        timestamp: new Date().toISOString(),
      });
    }

    const db = getDb();
    const result = await db('users')
      .where('id', id)
      .update({ 
        is_active: false, 
        updated_at: new Date() 
      });

    if (result === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Invalidate all user sessions
    await db('user_sessions')
      .where('user_id', id)
      .update({ is_active: false });

    logger.info('User deactivated by admin', {
      deactivatedUserId: id,
      adminUserId: req.user?.user_id,
    });

    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/users/:id/documents
 * @desc    Get user's documents (admin/editor or self)
 * @access  Admin/Editor or Self
 */
router.get('/:id/documents',
  authenticateToken,
  validateParams(uuidSchema),
  validateQuery(validationSchemas.pagination),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    const currentUserId = req.user?.user_id;
    const currentUserRole = req.user?.role;

    // Check if user can access this profile
    if (id !== currentUserId && currentUserRole !== 'admin' && currentUserRole !== 'editor') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
      });
    }

    const db = getDb();
    const offset = (Number(page) - 1) * Number(limit);
    
    // Get total count
    const [{ count }] = await db('documents')
      .where('uploaded_by', id)
      .count('* as count');
    const total = parseInt(count as string);
    const totalPages = Math.ceil(total / Number(limit));

    // Get documents
    const documents = await db('documents')
      .where('uploaded_by', id)
      .select('id', 'title', 'description', 'file_name', 'file_type', 'file_size', 'status', 'created_at', 'updated_at')
      .orderBy(sort_by as string, sort_order as string)
      .limit(Number(limit))
      .offset(offset);

    logger.info('User documents retrieved successfully', {
      requestedUserId: id,
      currentUserId,
      currentUserRole,
      page,
      limit,
      total,
    });

    return res.status(200).json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/users/stats/overview
 * @desc    Get user statistics overview (admin only)
 * @access  Admin
 */
router.get('/stats/overview',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    
    // Get user counts by role
    const roleStats = await db('users')
      .select('role')
      .count('* as count')
      .groupBy('role');

    // Get total active users
    const [{ activeCount }] = await db('users')
      .where('is_active', true)
      .count('* as activeCount');

    // Get users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [{ recentCount }] = await db('users')
      .where('created_at', '>=', thirtyDaysAgo)
      .count('* as recentCount');

    // Get users who logged in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [{ todayLoginCount }] = await db('users')
      .where('last_login', '>=', today)
      .count('* as todayLoginCount');

    const stats = {
      total: parseInt(activeCount as string),
      byRole: roleStats.reduce((acc: any, stat: any) => {
        acc[stat.role] = parseInt(stat.count as string);
        return acc;
      }, {}),
      recent: parseInt(recentCount as string),
      activeToday: parseInt(todayLoginCount as string),
    };

    logger.info('User statistics retrieved', {
      adminUserId: req.user?.user_id,
    });

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
