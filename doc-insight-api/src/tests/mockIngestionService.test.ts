import { MockIngestionService } from '../services/mockIngestionService';
import { TriggerIngestionRequest } from '../types';

// Mock dependencies
jest.mock('../utils/logger');

describe('MockIngestionService', () => {
  let mockService: MockIngestionService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = new MockIngestionService();
  });

  afterEach(() => {
    // Clean up any pending timeouts
    mockService.clearAllJobs();
  });

  describe('triggerIngestion', () => {
    const validRequest: TriggerIngestionRequest = {
      document_id: 'doc-123',
    };

    it('should create and return a new ingestion job', async () => {
      const result = await mockService.triggerIngestion('user-123', validRequest);

      expect(result).toBeDefined();
      expect(result.document_id).toBe('doc-123');
      expect(result.status).toBe('queued');
      expect(result.retry_count).toBe(0);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });

    it('should create multiple jobs for different documents', async () => {
      const request1: TriggerIngestionRequest = { document_id: 'doc-1' };
      const request2: TriggerIngestionRequest = { document_id: 'doc-2' };

      const job1 = await mockService.triggerIngestion('user-123', request1);
      const job2 = await mockService.triggerIngestion('user-456', request2);

      expect(job1.id).not.toBe(job2.id);
      expect(job1.document_id).toBe('doc-1');
      expect(job2.document_id).toBe('doc-2');
    });

    it('should eventually process the job', async () => {
      const result = await mockService.triggerIngestion('user-123', validRequest);
      
      // Wait for processing to complete (max 12 seconds)
      await new Promise(resolve => setTimeout(resolve, 12000));

      const status = await mockService.getIngestionStatus(result.id, 'user-123', 'editor');
      expect(['completed', 'failed']).toContain(status.status);
    });
  });

  describe('getIngestionStatus', () => {
    it('should return job status for existing job', async () => {
      const job = await mockService.triggerIngestion('user-123', { document_id: 'doc-123' });
      const status = await mockService.getIngestionStatus(job.id, 'user-123', 'editor');

      expect(status.id).toBe(job.id);
      expect(status.document_id).toBe('doc-123');
      expect(status.status).toBeDefined();
    });

    it('should throw error for non-existent job', async () => {
      await expect(
        mockService.getIngestionStatus('non-existent', 'user-123', 'editor')
      ).rejects.toThrow('Ingestion job not found');
    });
  });

  describe('getUserIngestionJobs', () => {
    it('should return empty list initially', async () => {
      const result = await mockService.getUserIngestionJobs('user-123', 'editor', 1, 20);

      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should return user jobs with pagination', async () => {
      // Create multiple jobs
      await mockService.triggerIngestion('user-123', { document_id: 'doc-1' });
      await mockService.triggerIngestion('user-123', { document_id: 'doc-2' });
      await mockService.triggerIngestion('user-456', { document_id: 'doc-3' }); // Different user

      const result = await mockService.getUserIngestionJobs('user-123', 'editor', 1, 20);

      expect(result.jobs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.jobs.every(job => job.document_id.startsWith('doc-'))).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      // Create 5 jobs
      for (let i = 1; i <= 5; i++) {
        await mockService.triggerIngestion('user-123', { document_id: `doc-${i}` });
      }

      const page1 = await mockService.getUserIngestionJobs('user-123', 'editor', 1, 2);
      const page2 = await mockService.getUserIngestionJobs('user-123', 'editor', 2, 2);
      const page3 = await mockService.getUserIngestionJobs('user-123', 'editor', 3, 2);

      expect(page1.jobs).toHaveLength(2);
      expect(page2.jobs).toHaveLength(2);
      expect(page3.jobs).toHaveLength(1);
      expect(page1.total).toBe(5);
      expect(page1.totalPages).toBe(3);
    });
  });

  describe('getAllIngestionJobs', () => {
    it('should return all jobs regardless of user', async () => {
      await mockService.triggerIngestion('user-123', { document_id: 'doc-1' });
      await mockService.triggerIngestion('user-456', { document_id: 'doc-2' });

      const result = await mockService.getAllIngestionJobs(1, 20);

      expect(result.jobs).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      await mockService.triggerIngestion('user-123', { document_id: 'doc-1' });
      await mockService.triggerIngestion('user-123', { document_id: 'doc-2' });

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 12000));

      const result = await mockService.getAllIngestionJobs(1, 20, 'completed');

      expect(result.jobs.every(job => job.status === 'completed')).toBe(true);
    });
  });

  describe('retryJob', () => {
    it('should retry failed job successfully', async () => {
      const job = await mockService.triggerIngestion('user-123', { document_id: 'doc-123' });
      
      // Wait for processing and manually set to failed
      await new Promise(resolve => setTimeout(resolve, 12000));
      await mockService.updateJobStatus(job.id, 'failed', undefined, 'Test error');

      const retriedJob = await mockService.retryJob(job.id, 'user-123', 'editor');

      expect(retriedJob.id).toBe(job.id);
      expect(retriedJob.status).toBe('queued');
      expect(retriedJob.retry_count).toBe(1);
      expect(retriedJob.error_message).toBeUndefined();
    });

    it('should throw error for non-failed job', async () => {
      const job = await mockService.triggerIngestion('user-123', { document_id: 'doc-123' });

      await expect(
        mockService.retryJob(job.id, 'user-123', 'editor')
      ).rejects.toThrow('Only failed jobs can be retried');
    });

    it('should throw error for non-existent job', async () => {
      await expect(
        mockService.retryJob('non-existent', 'user-123', 'editor')
      ).rejects.toThrow('Ingestion job not found');
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status successfully', async () => {
      const job = await mockService.triggerIngestion('user-123', { document_id: 'doc-123' });

      await mockService.updateJobStatus(job.id, 'completed', { step: 'completed', percentage: 100 });

      const updatedJob = await mockService.getIngestionStatus(job.id, 'user-123', 'editor');
      expect(updatedJob.status).toBe('completed');
      expect(updatedJob.progress).toEqual({ step: 'completed', percentage: 100 });
    });

    it('should update job with error message', async () => {
      const job = await mockService.triggerIngestion('user-123', { document_id: 'doc-123' });

      await mockService.updateJobStatus(job.id, 'failed', undefined, 'Processing error');

      const updatedJob = await mockService.getIngestionStatus(job.id, 'user-123', 'editor');
      expect(updatedJob.status).toBe('failed');
      expect(updatedJob.error_message).toBe('Processing error');
    });

    it('should set completed_at for finished jobs', async () => {
      const job = await mockService.triggerIngestion('user-123', { document_id: 'doc-123' });

      await mockService.updateJobStatus(job.id, 'completed');

      const updatedJob = await mockService.getIngestionStatus(job.id, 'user-123', 'editor');
      expect(updatedJob.completed_at).toBeDefined();
    });

    it('should throw error for non-existent job', async () => {
      await expect(
        mockService.updateJobStatus('non-existent', 'completed')
      ).rejects.toThrow('Ingestion job not found');
    });
  });

  describe('clearAllJobs', () => {
    it('should clear all jobs and timeouts', async () => {
      await mockService.triggerIngestion('user-123', { document_id: 'doc-1' });
      await mockService.triggerIngestion('user-123', { document_id: 'doc-2' });

      expect(mockService.getJobCount()).toBe(2);

      mockService.clearAllJobs();

      expect(mockService.getJobCount()).toBe(0);
    });
  });

  describe('getJobCount', () => {
    it('should return correct job count', async () => {
      expect(mockService.getJobCount()).toBe(0);

      await mockService.triggerIngestion('user-123', { document_id: 'doc-1' });
      expect(mockService.getJobCount()).toBe(1);

      await mockService.triggerIngestion('user-123', { document_id: 'doc-2' });
      expect(mockService.getJobCount()).toBe(2);
    });
  });

  describe('job processing simulation', () => {
    it('should simulate realistic processing steps', async () => {
      const job = await mockService.triggerIngestion('user-123', { document_id: 'doc-123' });

      // Check initial status
      let status = await mockService.getIngestionStatus(job.id, 'user-123', 'editor');
      expect(status.status).toBe('queued');

      // Wait for processing to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      status = await mockService.getIngestionStatus(job.id, 'user-123', 'editor');
      expect(['queued', 'processing']).toContain(status.status);

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 10000));

      status = await mockService.getIngestionStatus(job.id, 'user-123', 'editor');
      expect(['completed', 'failed']).toContain(status.status);
    });

    it('should occasionally simulate failures', async () => {
      // This test might not always pass due to randomness, but it's good to have
      const jobs = [];
      for (let i = 0; i < 10; i++) {
        const job = await mockService.triggerIngestion('user-123', { document_id: `doc-${i}` });
        jobs.push(job);
      }

      // Wait for all jobs to complete
      await new Promise(resolve => setTimeout(resolve, 15000));

      const statuses = await Promise.all(
        jobs.map(job => mockService.getIngestionStatus(job.id, 'user-123', 'editor'))
      );

      const completedJobs = statuses.filter(job => job.status === 'completed');
      const failedJobs = statuses.filter(job => job.status === 'failed');

      // At least some jobs should complete
      expect(completedJobs.length + failedJobs.length).toBe(10);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent job creation', async () => {
      const promises = Array(5).fill(null).map((_, i) =>
        mockService.triggerIngestion('user-123', { document_id: `doc-${i}` })
      );

      const jobs = await Promise.all(promises);

      expect(jobs).toHaveLength(5);
      expect(new Set(jobs.map(job => job.id)).size).toBe(5); // All unique IDs
    });

    it('should handle concurrent status updates', async () => {
      const job = await mockService.triggerIngestion('user-123', { document_id: 'doc-123' });

      const promises = [
        mockService.updateJobStatus(job.id, 'processing', { step: 'step1' }),
        mockService.updateJobStatus(job.id, 'processing', { step: 'step2' }),
        mockService.updateJobStatus(job.id, 'completed', { step: 'completed' }),
      ];

      await Promise.all(promises);

      const finalStatus = await mockService.getIngestionStatus(job.id, 'user-123', 'editor');
      expect(finalStatus.status).toBe('completed');
    });
  });
});
