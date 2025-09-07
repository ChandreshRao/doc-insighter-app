import { 
  TriggerIngestionRequest, 
  IngestionJobResponse, 
  IngestionJobStatus 
} from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { MockIngestionConfig } from '../config/mockIngestion';
import config from '../config';

interface MockJob {
  id: string;
  document_id: string;
  status: IngestionJobStatus;
  error_message?: string;
  progress?: Record<string, any>;
  retry_count: number;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class MockIngestionService {
  private jobs: Map<string, MockJob> = new Map();
  private processingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private config: MockIngestionConfig;
  private cleanupInterval?: NodeJS.Timeout | undefined;

  constructor(customConfig?: MockIngestionConfig) {
    // Use custom config if provided, otherwise create from main config
    if (customConfig) {
      this.config = customConfig;
    } else {
      this.config = {
        processingTime: {
          min: config.mockIngestionMinTime,
          max: config.mockIngestionMaxTime,
        },
        failureRate: config.mockIngestionFailureRate,
        steps: [
          { name: 'initializing', duration: 500, percentage: 10 },
          { name: 'extracting_text', duration: 1000, percentage: 30 },
          { name: 'analyzing_content', duration: 1000, percentage: 60 },
          { name: 'generating_embeddings', duration: 1000, percentage: 80 },
          { name: 'finalizing', duration: 500, percentage: 95 },
        ],
        maxRetries: config.mockIngestionMaxRetries,
        autoCleanup: {
          enabled: config.mockIngestionAutoCleanup,
          interval: config.mockIngestionCleanupInterval,
          maxAge: config.mockIngestionMaxAge,
        },
      };
    }
    
    // Start auto-cleanup if enabled
    if (this.config.autoCleanup.enabled) {
      this.startAutoCleanup();
    }
  }

  /**
   * Trigger ingestion process for a document (mock implementation)
   */
  async triggerIngestion(userId: string, request: TriggerIngestionRequest): Promise<IngestionJobResponse> {
    const jobId = uuidv4();
    const now = new Date();

    const job: MockJob = {
      id: jobId,
      document_id: request.document_id,
      status: 'queued',
      retry_count: 0,
      created_at: now,
      updated_at: now,
    };

    this.jobs.set(jobId, job);

    // Simulate processing delay
    const processingTime = this.getRandomProcessingTime();
    const timeout = setTimeout(() => {
      this.simulateProcessing(jobId);
    }, processingTime);

    this.processingTimeouts.set(jobId, timeout);

    logger.info('Mock ingestion triggered', {
      jobId,
      documentId: request.document_id,
      userId,
      estimatedProcessingTime: processingTime,
    });

    return this.mapToResponse(job);
  }

  /**
   * Get ingestion job status
   */
  async getIngestionStatus(jobId: string, userId: string, userRole: string): Promise<IngestionJobResponse> {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error('Ingestion job not found');
    }

    // Simulate permission check (in real implementation, this would check document ownership)
    // For mock, we'll allow access to all jobs

    logger.info('Mock ingestion status retrieved', {
      jobId,
      userId,
      userRole,
      status: job.status,
    });

    return this.mapToResponse(job);
  }

  /**
   * Get user's ingestion jobs
   */
  async getUserIngestionJobs(
    userId: string, 
    userRole: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ jobs: IngestionJobResponse[]; total: number; totalPages: number }> {
    const allJobs = Array.from(this.jobs.values());
    const total = allJobs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedJobs = allJobs
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(startIndex, endIndex);

    logger.info('Mock user ingestion jobs retrieved', {
      userId,
      userRole,
      page,
      limit,
      total,
      totalPages,
    });

    return {
      jobs: paginatedJobs.map(job => this.mapToResponse(job)),
      total,
      totalPages,
    };
  }

  /**
   * Get all ingestion jobs (admin only)
   */
  async getAllIngestionJobs(
    page: number = 1, 
    limit: number = 20,
    statusFilter?: string
  ): Promise<{ jobs: IngestionJobResponse[]; total: number; totalPages: number }> {
    let allJobs = Array.from(this.jobs.values());

    // Apply status filter if provided
    if (statusFilter) {
      allJobs = allJobs.filter(job => job.status === statusFilter);
    }

    const total = allJobs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedJobs = allJobs
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(startIndex, endIndex);

    logger.info('Mock all ingestion jobs retrieved', {
      page,
      limit,
      total,
      totalPages,
      statusFilter,
    });

    return {
      jobs: paginatedJobs.map(job => this.mapToResponse(job)),
      total,
      totalPages,
    };
  }

  /**
   * Retry failed ingestion job
   */
  async retryJob(jobId: string, userId: string, userRole: string): Promise<IngestionJobResponse> {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error('Ingestion job not found');
    }

    if (job.status !== 'failed') {
      throw new Error('Only failed jobs can be retried');
    }

    // Reset job for retry
    job.status = 'queued';
    job.retry_count += 1;
    job.updated_at = new Date();

    // Simulate processing delay
    const processingTime = this.getRandomProcessingTime();
    const timeout = setTimeout(() => {
      this.simulateProcessing(jobId);
    }, processingTime);

    // Clear existing timeout if any
    const existingTimeout = this.processingTimeouts.get(jobId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    this.processingTimeouts.set(jobId, timeout);

    logger.info('Mock ingestion job retried', {
      jobId,
      userId,
      userRole,
      retryCount: job.retry_count,
    });

    return this.mapToResponse(job);
  }

  /**
   * Update job status (for webhook simulation)
   */
  async updateJobStatus(
    jobId: string, 
    status: IngestionJobStatus, 
    progress?: Record<string, any>, 
    errorMessage?: string
  ): Promise<void> {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error('Ingestion job not found');
    }

    job.status = status;
    job.updated_at = new Date();

    if (progress) {
      job.progress = progress;
    }

    if (errorMessage) {
      job.error_message = errorMessage;
    }

    if (status === 'completed' || status === 'failed') {
      job.completed_at = new Date();
      
      // Clear timeout
      const timeout = this.processingTimeouts.get(jobId);
      if (timeout) {
        clearTimeout(timeout);
        this.processingTimeouts.delete(jobId);
      }
    }

    logger.info('Mock job status updated', {
      jobId,
      status,
      progress,
      errorMessage,
    });
  }

  /**
   * Simulate document processing
   */
  private async simulateProcessing(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);

    if (!job) {
      return;
    }

    // Update status to processing
    job.status = 'processing';
    job.started_at = new Date();
    job.updated_at = new Date();

    // Simulate step-by-step processing using configuration
    for (const step of this.config.steps) {
      await this.delay(step.duration);
      
      job.progress = { step: step.name, percentage: step.percentage };
      job.updated_at = new Date();
      
      logger.debug('Mock processing step', {
        jobId,
        step: step.name,
        percentage: step.percentage,
      });
    }

    // Determine final status (simulate occasional failures based on configuration)
    const shouldFail = Math.random() < this.config.failureRate;

    if (shouldFail) {
      job.status = 'failed';
      job.error_message = 'Simulated processing error';
    } else {
      job.status = 'completed';
      job.progress = { step: 'completed', percentage: 100 };
    }

    job.completed_at = new Date();
    job.updated_at = new Date();

    // Clear timeout
    const timeout = this.processingTimeouts.get(jobId);
    if (timeout) {
      clearTimeout(timeout);
      this.processingTimeouts.delete(jobId);
    }

    logger.info('Mock processing completed', {
      jobId,
      status: job.status,
      errorMessage: job.error_message,
      processingTime: job.completed_at.getTime() - job.started_at!.getTime(),
    });
  }

  /**
   * Get random processing time based on configuration
   */
  private getRandomProcessingTime(): number {
    const { min, max } = this.config.processingTime;
    return Math.random() * (max - min) + min;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Map internal job to response format
   */
  private mapToResponse(job: MockJob): IngestionJobResponse {
    const response: IngestionJobResponse = {
      id: job.id,
      document_id: job.document_id,
      status: job.status,
      retry_count: job.retry_count,
      created_at: job.created_at,
      updated_at: job.updated_at,
    };

    // Only include optional properties if they have values
    if (job.error_message !== undefined) {
      response.error_message = job.error_message;
    }
    if (job.progress !== undefined) {
      response.progress = job.progress;
    }
    if (job.started_at !== undefined) {
      response.started_at = job.started_at;
    }
    if (job.completed_at !== undefined) {
      response.completed_at = job.completed_at;
    }

    return response;
  }

  /**
   * Clear all jobs (for testing)
   */
  clearAllJobs(): void {
    // Clear all timeouts
    for (const timeout of this.processingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.processingTimeouts.clear();
    
    // Clear all jobs
    this.jobs.clear();
  }

  /**
   * Get job count (for testing)
   */
  getJobCount(): number {
    return this.jobs.size;
  }

  /**
   * Start auto-cleanup process
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.autoCleanup.interval);
  }

  /**
   * Perform cleanup of old jobs
   */
  private performCleanup(): void {
    const now = new Date();
    const maxAge = this.config.autoCleanup.maxAge;
    const jobsToDelete: string[] = [];

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.completed_at) {
        const age = now.getTime() - job.completed_at.getTime();
        if (age > maxAge) {
          jobsToDelete.push(jobId);
        }
      }
    }

    for (const jobId of jobsToDelete) {
      this.jobs.delete(jobId);
      
      // Clear any pending timeout
      const timeout = this.processingTimeouts.get(jobId);
      if (timeout) {
        clearTimeout(timeout);
        this.processingTimeouts.delete(jobId);
      }
    }

    if (jobsToDelete.length > 0) {
      logger.info('Mock service cleanup completed', {
        deletedJobs: jobsToDelete.length,
        remainingJobs: this.jobs.size,
      });
    }
  }

  /**
   * Stop auto-cleanup process
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MockIngestionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MockIngestionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart auto-cleanup if settings changed
    if (newConfig.autoCleanup) {
      this.stopAutoCleanup();
      if (this.config.autoCleanup.enabled) {
        this.startAutoCleanup();
      }
    }
  }

  /**
   * Get statistics about the mock service
   */
  getStats(): {
    totalJobs: number;
    jobsByStatus: Record<string, number>;
    averageProcessingTime: number;
    failureRate: number;
  } {
    const jobs = Array.from(this.jobs.values());
    const totalJobs = jobs.length;
    
    const jobsByStatus = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completedJobs = jobs.filter(job => job.completed_at && job.started_at);
    const averageProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => 
          sum + (job.completed_at!.getTime() - job.started_at!.getTime()), 0
        ) / completedJobs.length
      : 0;

    const failedJobs = jobs.filter(job => job.status === 'failed').length;
    const failureRate = totalJobs > 0 ? failedJobs / totalJobs : 0;

    return {
      totalJobs,
      jobsByStatus,
      averageProcessingTime,
      failureRate,
    };
  }

  /**
   * Cleanup method for testing
   */
  destroy(): void {
    this.stopAutoCleanup();
    this.clearAllJobs();
  }
}
