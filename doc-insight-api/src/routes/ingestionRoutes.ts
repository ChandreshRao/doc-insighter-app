import { Router, Request, Response } from 'express';
import { IngestionService } from '../services/ingestionService';
import { MockIngestionService } from '../services/mockIngestionService';
import { validateRequest, validationSchemas, validateParams, uuidSchema, validateQuery } from '../middleware/validationMiddleware';
import { authenticateToken, requireEditor, requireAdmin } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import config from '../config';

const router = Router();

// Create service instance on-demand - use mock service in development
const getIngestionService = () => {
  if (config.useMockIngestion) {
    return new MockIngestionService();
  }
  return new IngestionService();
};

/**
 * @route   POST /api/ingestion/trigger
 * @desc    Trigger ingestion process for a document
 * @access  Private (Editor/Admin)
 */
router.post('/trigger',
  authenticateToken,
  requireEditor,
  validateRequest(validationSchemas.triggerIngestion),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.user_id;
    const request = req.body;
    
    const ingestionJob = await getIngestionService().triggerIngestion(userId, request);
    
    logger.info('Ingestion triggered successfully', {
      jobId: ingestionJob.id,
      documentId: request.document_id,
      userId,
    });

    res.status(201).json({
      success: true,
      data: ingestionJob,
      message: 'Ingestion process triggered successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/ingestion/status/:jobId
 * @desc    Get ingestion job status
 * @access  Private
 */
router.get('/status/:jobId',
  authenticateToken,
  validateParams(uuidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    
    const job = await getIngestionService().getIngestionStatus(jobId, userId, userRole);
    
    logger.info('Ingestion status retrieved successfully', {
      jobId,
      userId,
      userRole,
      status: job.status,
    });

    res.status(200).json({
      success: true,
      data: job,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/ingestion/jobs
 * @desc    Get user's ingestion jobs
 * @access  Private
 */
router.get('/jobs',
  authenticateToken,
  validateQuery(validationSchemas.pagination),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    const { page = 1, limit = 20 } = req.query;
    
    const result = await getIngestionService().getUserIngestionJobs(
      userId, 
      userRole, 
      parseInt(page as string), 
      parseInt(limit as string)
    );
    
    logger.info('User ingestion jobs retrieved successfully', {
      userId,
      userRole,
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
    });

    res.status(200).json({
      success: true,
      data: result.jobs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        total_pages: result.totalPages,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/ingestion/jobs/all
 * @desc    Get all ingestion jobs (admin only)
 * @access  Admin
 */
router.get('/jobs/all',
  authenticateToken,
  requireAdmin,
  validateQuery(validationSchemas.pagination),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, status } = req.query;
    
    const result = await getIngestionService().getAllIngestionJobs(
      parseInt(page as string), 
      parseInt(limit as string),
      status as string
    );
    
    logger.info('All ingestion jobs retrieved successfully', {
      adminUserId: req.user!.user_id,
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
      statusFilter: status,
    });

    res.status(200).json({
      success: true,
      data: result.jobs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        total_pages: result.totalPages,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/ingestion/jobs/:jobId/retry
 * @desc    Retry failed ingestion job
 * @access  Private (Owner/Admin)
 */
router.post('/jobs/:jobId/retry',
  authenticateToken,
  validateParams(uuidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    
    const updatedJob = await getIngestionService().retryJob(jobId, userId, userRole);
    
    logger.info('Ingestion job retried successfully', {
      jobId,
      userId,
      userRole,
      retryCount: updatedJob.retry_count,
    });

    res.status(200).json({
      success: true,
      data: updatedJob,
      message: 'Ingestion job retried successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/ingestion/webhook/status-update
 * @desc    Webhook endpoint for Python service to update job status
 * @access  Public (with API key validation)
 */
router.post('/webhook/status-update',
  asyncHandler(async (req: Request, res: Response) => {
    const { job_id, status, progress, error_message, api_key } = req.body;
    
    // Validate API key (skip validation in development with mock service)
    if (!config.useMockIngestion) {
      const expectedApiKey = config.pythonServiceApiKey;
      if (!expectedApiKey || api_key !== expectedApiKey) {
        logger.warn('Invalid API key in webhook call', {
          providedKey: api_key ? '***' : 'none',
          jobId: job_id,
        });
        
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    if (!job_id || !status) {
      return res.status(400).json({
        success: false,
        error: 'job_id and status are required',
        timestamp: new Date().toISOString(),
      });
    }
    
    try {
      await getIngestionService().updateJobStatus(job_id, status, progress, error_message);
      
      logger.info('Webhook status update processed successfully', {
        jobId: job_id,
        status,
        progress,
        errorMessage: error_message,
        mockService: config.useMockIngestion,
      });
      
      return res.status(200).json({
        success: true,
        message: 'Status updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error processing webhook status update:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to update status',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * @route   GET /api/ingestion/stats/overview
 * @desc    Get ingestion statistics overview
 * @access  Private
 */
router.get('/stats/overview',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    
    // Get user's ingestion jobs
    const userJobs = await getIngestionService().getUserIngestionJobs(userId, userRole, 1, 1000);
    
    // Calculate statistics
    const stats = {
      total: userJobs.total,
      byStatus: userJobs.jobs.reduce((acc: any, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {}),
      byRetryCount: userJobs.jobs.reduce((acc: any, job) => {
        acc[job.retry_count] = (acc[job.retry_count] || 0) + 1;
        return acc;
      }, {}),
      recentJobs: userJobs.jobs.slice(0, 5), // Last 5 jobs
    };
    
    logger.info('Ingestion statistics retrieved successfully', {
      userId,
      userRole,
    });

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/ingestion/stats/admin
 * @desc    Get admin ingestion statistics (admin only)
 * @access  Admin
 */
router.get('/stats/admin',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    // Get all ingestion jobs
    const allJobs = await getIngestionService().getAllIngestionJobs(1, 1000);
    
    // Calculate comprehensive statistics
    const stats = {
      total: allJobs.total,
      byStatus: allJobs.jobs.reduce((acc: any, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {}),
      byRetryCount: allJobs.jobs.reduce((acc: any, job) => {
        acc[job.retry_count] = (acc[job.retry_count] || 0) + 1;
        return acc;
      }, {}),
      recentJobs: allJobs.jobs.slice(0, 10), // Last 10 jobs
      averageProcessingTime: 0, // TODO: Calculate from started_at and completed_at
      failureRate: 0, // TODO: Calculate percentage of failed jobs
    };
    
    // Calculate failure rate
    if (stats.total > 0) {
      stats.failureRate = ((stats.byStatus.failed || 0) / stats.total) * 100;
    }
    
    logger.info('Admin ingestion statistics retrieved successfully', {
      adminUserId: req.user!.user_id,
    });

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/ingestion/bulk/trigger
 * @desc    Trigger ingestion for multiple documents (admin only)
 * @access  Admin
 */
router.post('/bulk/trigger',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { document_ids } = req.body;
    
    if (!Array.isArray(document_ids) || document_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'document_ids array is required and must not be empty',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (document_ids.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 documents can be processed at once',
        timestamp: new Date().toISOString(),
      });
    }
    
    const results = [];
    const errors = [];
    
    // Process each document
    for (const documentId of document_ids) {
      try {
        const job = await getIngestionService().triggerIngestion(req.user!.user_id, { document_id: documentId });
        results.push({ document_id: documentId, job_id: job.id, status: 'triggered' });
      } catch (error) {
        errors.push({ document_id: documentId, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    
    logger.info('Bulk ingestion triggered', {
      adminUserId: req.user!.user_id,
      totalRequested: document_ids.length,
      successful: results.length,
      failed: errors.length,
    });

    return res.status(200).json({
      success: true,
      data: {
        results,
        errors,
        summary: {
          total_requested: document_ids.length,
          successful: results.length,
          failed: errors.length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   DELETE /api/ingestion/jobs/:jobId
 * @desc    Cancel ingestion job (admin only)
 * @access  Admin
 */
router.delete('/jobs/:jobId',
  authenticateToken,
  requireAdmin,
  validateParams(uuidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    
    try {
      const service = getIngestionService();
      
      // Check if job exists and can be cancelled
      const job = await service.getIngestionStatus(jobId, req.user!.user_id, 'admin');
      
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          error: `Job cannot be cancelled. Current status: ${job.status}`,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Cancel the job
      await service.updateJobStatus(jobId, 'cancelled', { step: 'cancelled', percentage: 0 }, 'Job cancelled by admin');
      
      logger.info('Ingestion job cancelled by admin', {
        jobId,
        adminUserId: req.user!.user_id,
        previousStatus: job.status,
      });
      
      return res.status(200).json({
        success: true,
        message: 'Job cancelled successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error cancelling ingestion job:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel job',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

export default router;
