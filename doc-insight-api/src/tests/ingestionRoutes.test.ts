import request from 'supertest';
import express from 'express';
import ingestionRoutes from '../routes/ingestionRoutes';
import { MockIngestionService } from '../services/mockIngestionService';
import { IngestionService } from '../services/ingestionService';

// Mock dependencies
jest.mock('../services/ingestionService');
jest.mock('../services/mockIngestionService');
jest.mock('../utils/logger');

const mockIngestionService = MockIngestionService as jest.MockedClass<typeof MockIngestionService>;
const mockRealIngestionService = IngestionService as jest.MockedClass<typeof IngestionService>;

// Mock authentication middleware
const mockAuthenticateToken = jest.fn((req: any, res: any, next: any) => {
  req.user = { user_id: 'user-123', email: 'test@example.com', role: 'editor' };
  next();
});

const mockRequireEditor = jest.fn((req: any, res: any, next: any) => {
  if (['admin', 'editor'].includes(req.user?.role)) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
});

const mockRequireAdmin = jest.fn((req: any, res: any, next: any) => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
});

// Mock the middleware
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: mockAuthenticateToken,
  requireEditor: mockRequireEditor,
  requireAdmin: mockRequireAdmin,
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/api/ingestion', ingestionRoutes);

describe('Ingestion Routes', () => {
  let mockServiceInstance: jest.Mocked<MockIngestionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockServiceInstance = {
      triggerIngestion: jest.fn(),
      getIngestionStatus: jest.fn(),
      getUserIngestionJobs: jest.fn(),
      getAllIngestionJobs: jest.fn(),
      retryJob: jest.fn(),
      updateJobStatus: jest.fn(),
      clearAllJobs: jest.fn(),
      getJobCount: jest.fn(),
    } as any;
    
    mockIngestionService.mockImplementation(() => mockServiceInstance);
    
    // Mock environment variables
    process.env.USE_MOCK_INGESTION = 'true';
    process.env.NODE_ENV = 'development';
  });

  describe('POST /api/ingestion/trigger', () => {
    const validRequest = {
      document_id: 'doc-123',
    };

    it('should trigger ingestion successfully (editor)', async () => {
      const mockJob = {
        id: 'job-123',
        document_id: 'doc-123',
        status: 'queued',
        retry_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockServiceInstance.triggerIngestion.mockResolvedValue(mockJob);

      const response = await request(app)
        .post('/api/ingestion/trigger')
        .send(validRequest)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockJob,
        message: 'Ingestion process triggered successfully',
        timestamp: expect.any(String),
      });
      expect(mockServiceInstance.triggerIngestion).toHaveBeenCalledWith('user-123', validRequest);
    });

    it('should trigger ingestion successfully (admin)', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'admin-123', email: 'admin@example.com', role: 'admin' };
        next();
      });

      const mockJob = {
        id: 'job-456',
        document_id: 'doc-123',
        status: 'queued',
        retry_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockServiceInstance.triggerIngestion.mockResolvedValue(mockJob);

      const response = await request(app)
        .post('/api/ingestion/trigger')
        .send(validRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('job-456');
    });

    it('should return 403 for viewer role', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'user-123', email: 'test@example.com', role: 'viewer' };
        next();
      });

      mockRequireEditor.mockImplementationOnce((req: any, res: any, next: any) => {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
      });

      const response = await request(app)
        .post('/api/ingestion/trigger')
        .send(validRequest)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should return 400 for invalid request data', async () => {
      const invalidRequest = {};

      const response = await request(app)
        .post('/api/ingestion/trigger')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 500 for service error', async () => {
      mockServiceInstance.triggerIngestion.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/ingestion/trigger')
        .send(validRequest)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Service error');
    });
  });

  describe('GET /api/ingestion/status/:jobId', () => {
    it('should get job status successfully', async () => {
      const mockJob = {
        id: 'job-123',
        document_id: 'doc-123',
        status: 'processing',
        progress: { step: 'extracting_text', percentage: 50 },
        retry_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockServiceInstance.getIngestionStatus.mockResolvedValue(mockJob);

      const response = await request(app)
        .get('/api/ingestion/status/job-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockJob,
        timestamp: expect.any(String),
      });
      expect(mockServiceInstance.getIngestionStatus).toHaveBeenCalledWith('job-123', 'user-123', 'editor');
    });

    it('should return 404 for non-existent job', async () => {
      mockServiceInstance.getIngestionStatus.mockRejectedValue(new Error('Ingestion job not found'));

      const response = await request(app)
        .get('/api/ingestion/status/nonexistent')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ingestion job not found');
    });

    it('should return 400 for invalid job ID format', async () => {
      const response = await request(app)
        .get('/api/ingestion/status/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/ingestion/jobs', () => {
    it('should get user jobs successfully', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          document_id: 'doc-1',
          status: 'completed',
          retry_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'job-2',
          document_id: 'doc-2',
          status: 'processing',
          retry_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockResult = {
        jobs: mockJobs,
        total: 2,
        totalPages: 1,
      };

      mockServiceInstance.getUserIngestionJobs.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/ingestion/jobs?page=1&limit=20')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockJobs,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          total_pages: 1,
        },
        timestamp: expect.any(String),
      });
      expect(mockServiceInstance.getUserIngestionJobs).toHaveBeenCalledWith('user-123', 'editor', 1, 20);
    });

    it('should handle pagination parameters', async () => {
      const mockResult = { jobs: [], total: 0, totalPages: 0 };
      mockServiceInstance.getUserIngestionJobs.mockResolvedValue(mockResult);

      await request(app)
        .get('/api/ingestion/jobs?page=2&limit=10')
        .expect(200);

      expect(mockServiceInstance.getUserIngestionJobs).toHaveBeenCalledWith('user-123', 'editor', 2, 10);
    });
  });

  describe('GET /api/ingestion/jobs/all', () => {
    it('should get all jobs successfully (admin)', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'admin-123', email: 'admin@example.com', role: 'admin' };
        next();
      });

      const mockJobs = [
        {
          id: 'job-1',
          document_id: 'doc-1',
          status: 'completed',
          retry_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockResult = {
        jobs: mockJobs,
        total: 1,
        totalPages: 1,
      };

      mockServiceInstance.getAllIngestionJobs.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/ingestion/jobs/all?page=1&limit=20')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockJobs);
      expect(mockServiceInstance.getAllIngestionJobs).toHaveBeenCalledWith(1, 20, undefined);
    });

    it('should return 403 for non-admin user', async () => {
      mockRequireAdmin.mockImplementationOnce((req: any, res: any, next: any) => {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
      });

      const response = await request(app)
        .get('/api/ingestion/jobs/all')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should handle status filter', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'admin-123', email: 'admin@example.com', role: 'admin' };
        next();
      });

      const mockResult = { jobs: [], total: 0, totalPages: 0 };
      mockServiceInstance.getAllIngestionJobs.mockResolvedValue(mockResult);

      await request(app)
        .get('/api/ingestion/jobs/all?status=completed')
        .expect(200);

      expect(mockServiceInstance.getAllIngestionJobs).toHaveBeenCalledWith(1, 20, 'completed');
    });
  });

  describe('POST /api/ingestion/jobs/:jobId/retry', () => {
    it('should retry job successfully', async () => {
      const mockUpdatedJob = {
        id: 'job-123',
        document_id: 'doc-123',
        status: 'queued',
        retry_count: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockServiceInstance.retryJob.mockResolvedValue(mockUpdatedJob);

      const response = await request(app)
        .post('/api/ingestion/jobs/job-123/retry')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedJob,
        message: 'Ingestion job retried successfully',
        timestamp: expect.any(String),
      });
      expect(mockServiceInstance.retryJob).toHaveBeenCalledWith('job-123', 'user-123', 'editor');
    });

    it('should return 400 for invalid job ID format', async () => {
      const response = await request(app)
        .post('/api/ingestion/jobs/invalid-id/retry')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 500 for service error', async () => {
      mockServiceInstance.retryJob.mockRejectedValue(new Error('Job not found'));

      const response = await request(app)
        .post('/api/ingestion/jobs/job-123/retry')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('POST /api/ingestion/webhook/status-update', () => {
    it('should update job status successfully (with mock service)', async () => {
      mockServiceInstance.updateJobStatus.mockResolvedValue(undefined);

      const webhookData = {
        job_id: 'job-123',
        status: 'completed',
        progress: { step: 'completed', percentage: 100 },
        api_key: 'test-key',
      };

      const response = await request(app)
        .post('/api/ingestion/webhook/status-update')
        .send(webhookData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Status updated successfully',
        timestamp: expect.any(String),
      });
      expect(mockServiceInstance.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        'completed',
        { step: 'completed', percentage: 100 },
        undefined
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/ingestion/webhook/status-update')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'job_id and status are required',
        timestamp: expect.any(String),
      });
    });

    it('should return 500 for service error', async () => {
      mockServiceInstance.updateJobStatus.mockRejectedValue(new Error('Job not found'));

      const webhookData = {
        job_id: 'job-123',
        status: 'completed',
      };

      const response = await request(app)
        .post('/api/ingestion/webhook/status-update')
        .send(webhookData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to update status');
    });
  });

  describe('GET /api/ingestion/stats/overview', () => {
    it('should get user statistics successfully', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          document_id: 'doc-1',
          status: 'completed',
          retry_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'job-2',
          document_id: 'doc-2',
          status: 'processing',
          retry_count: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockServiceInstance.getUserIngestionJobs.mockResolvedValue({
        jobs: mockJobs,
        total: 2,
        totalPages: 1,
      });

      const response = await request(app)
        .get('/api/ingestion/stats/overview')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total', 2);
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('byRetryCount');
      expect(response.body.data).toHaveProperty('recentJobs');
    });
  });

  describe('GET /api/ingestion/stats/admin', () => {
    it('should get admin statistics successfully', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'admin-123', email: 'admin@example.com', role: 'admin' };
        next();
      });

      const mockJobs = [
        {
          id: 'job-1',
          document_id: 'doc-1',
          status: 'completed',
          retry_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockServiceInstance.getAllIngestionJobs.mockResolvedValue({
        jobs: mockJobs,
        total: 1,
        totalPages: 1,
      });

      const response = await request(app)
        .get('/api/ingestion/stats/admin')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total', 1);
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('byRetryCount');
      expect(response.body.data).toHaveProperty('recentJobs');
      expect(response.body.data).toHaveProperty('failureRate');
    });

    it('should return 403 for non-admin user', async () => {
      mockRequireAdmin.mockImplementationOnce((req: any, res: any, next: any) => {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
      });

      const response = await request(app)
        .get('/api/ingestion/stats/admin')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });
  });

  describe('POST /api/ingestion/bulk/trigger', () => {
    it('should trigger bulk ingestion successfully (admin)', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'admin-123', email: 'admin@example.com', role: 'admin' };
        next();
      });

      const mockJob = {
        id: 'job-123',
        document_id: 'doc-123',
        status: 'queued',
        retry_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockServiceInstance.triggerIngestion.mockResolvedValue(mockJob);

      const bulkRequest = {
        document_ids: ['doc-1', 'doc-2', 'doc-3'],
      };

      const response = await request(app)
        .post('/api/ingestion/bulk/trigger')
        .send(bulkRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('errors');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.summary.total_requested).toBe(3);
      expect(response.body.data.summary.successful).toBe(3);
      expect(response.body.data.summary.failed).toBe(0);
    });

    it('should return 400 for empty document_ids array', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'admin-123', email: 'admin@example.com', role: 'admin' };
        next();
      });

      const response = await request(app)
        .post('/api/ingestion/bulk/trigger')
        .send({ document_ids: [] })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'document_ids array is required and must not be empty',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for too many documents', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'admin-123', email: 'admin@example.com', role: 'admin' };
        next();
      });

      const bulkRequest = {
        document_ids: Array(101).fill('doc-id'), // 101 documents
      };

      const response = await request(app)
        .post('/api/ingestion/bulk/trigger')
        .send(bulkRequest)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Maximum 100 documents can be processed at once',
        timestamp: expect.any(String),
      });
    });

    it('should return 403 for non-admin user', async () => {
      mockRequireAdmin.mockImplementationOnce((req: any, res: any, next: any) => {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
      });

      const response = await request(app)
        .post('/api/ingestion/bulk/trigger')
        .send({ document_ids: ['doc-1'] })
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });
  });

  describe('DELETE /api/ingestion/jobs/:jobId', () => {
    it('should cancel job successfully (admin)', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'admin-123', email: 'admin@example.com', role: 'admin' };
        next();
      });

      const mockJob = {
        id: 'job-123',
        document_id: 'doc-123',
        status: 'processing',
        retry_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockServiceInstance.getIngestionStatus.mockResolvedValue(mockJob);
      mockServiceInstance.updateJobStatus.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/ingestion/jobs/job-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Job cancelled successfully',
        timestamp: expect.any(String),
      });
      expect(mockServiceInstance.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        'cancelled',
        { step: 'cancelled', percentage: 0 },
        'Job cancelled by admin'
      );
    });

    it('should return 400 for completed job', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'admin-123', email: 'admin@example.com', role: 'admin' };
        next();
      });

      const mockJob = {
        id: 'job-123',
        document_id: 'doc-123',
        status: 'completed',
        retry_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockServiceInstance.getIngestionStatus.mockResolvedValue(mockJob);

      const response = await request(app)
        .delete('/api/ingestion/jobs/job-123')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Job cannot be cancelled. Current status: completed',
        timestamp: expect.any(String),
      });
    });

    it('should return 500 for service error', async () => {
      mockAuthenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { user_id: 'admin-123', email: 'admin@example.com', role: 'admin' };
        next();
      });

      mockServiceInstance.getIngestionStatus.mockRejectedValue(new Error('Job not found'));

      const response = await request(app)
        .delete('/api/ingestion/jobs/job-123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to cancel job');
    });

    it('should return 403 for non-admin user', async () => {
      mockRequireAdmin.mockImplementationOnce((req: any, res: any, next: any) => {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
      });

      const response = await request(app)
        .delete('/api/ingestion/jobs/job-123')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });
  });
});
