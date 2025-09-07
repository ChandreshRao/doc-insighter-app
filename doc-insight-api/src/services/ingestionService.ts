import { getDatabase } from '../database/connection';
import { 
  IngestionJob, 
  IngestionJobResponse, 
  TriggerIngestionRequest,
  PythonServiceResponse 
} from '../types';
import { logger } from '../utils/logger';
import { CustomError } from '../middleware/errorHandler';
import axios from 'axios';
import config from '../config';
import { ErrorCodes } from '../utils/constants';

export class IngestionService {
  private get db() {
    return getDatabase();
  }
  private pythonServiceUrl: string;
  private pythonServiceApiKey: string;

  constructor() {
    this.pythonServiceUrl = config.pythonServiceUrl;
    this.pythonServiceApiKey = config.pythonServiceApiKey;
  }

  /**
   * Trigger ingestion process for a document
   */
  async triggerIngestion(userId: string, request: TriggerIngestionRequest): Promise<IngestionJobResponse> {
    try {
      // Verify document exists
      const document = await this.db('documents')
        .where('id', request.document_id)
        .first();

      if (!document) {
        throw new CustomError('Document not found', 404, ErrorCodes.DOCUMENT_NOT_FOUND);
      }

      // Check if document is already being processed
      const existingJob = await this.db('ingestion_jobs')
        .where('document_id', request.document_id)
        .whereIn('status', ['queued', 'processing'])
        .first();

      if (existingJob) {
        throw new CustomError('Document is already being processed', 409, ErrorCodes.ALREADY_PROCESSING);
      }

      // Create ingestion job
      const [ingestionJob] = await this.db('ingestion_jobs')
        .insert({
          document_id: request.document_id,
          status: 'queued',
          retry_count: 0,
        })
        .returning('*');

      // Update document status
      await this.db('documents')
        .where('id', request.document_id)
        .update({ 
          status: 'processing',
          updated_at: new Date() 
        });

      // Trigger Python service
      try {
        await this.callPythonService('/ingest', {
          document_id: request.document_id,
          job_id: ingestionJob.id,
          file_path: document.file_path,
          file_type: document.file_type,
        });

        // Update job status to processing
        await this.db('ingestion_jobs')
          .where('id', ingestionJob.id)
          .update({ 
            status: 'processing',
            started_at: new Date(),
            updated_at: new Date() 
          });

        logger.info('Ingestion triggered successfully', {
          jobId: ingestionJob.id,
          documentId: request.document_id,
          userId,
        });

      } catch (pythonError) {
        // If Python service fails, mark job as failed
        await this.db('ingestion_jobs')
          .where('id', ingestionJob.id)
          .update({ 
            status: 'failed',
            error_message: `Failed to trigger Python service: ${pythonError}`,
            updated_at: new Date() 
          });

        // Reset document status
        await this.db('documents')
          .where('id', request.document_id)
          .update({ 
            status: 'failed',
            updated_at: new Date() 
          });

        logger.error('Failed to trigger Python service', {
          jobId: ingestionJob.id,
          documentId: request.document_id,
          error: pythonError,
        });

        throw new CustomError('Failed to trigger ingestion process', 500, ErrorCodes.PYTHON_SERVICE_ERROR);
      }

      return this.mapToResponse(ingestionJob);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      logger.error('Error triggering ingestion:', error);
      throw new CustomError('Failed to trigger ingestion', 500, ErrorCodes.INGESTION_TRIGGER_ERROR);
    }
  }

  /**
   * Get ingestion job status
   */
  async getIngestionStatus(jobId: string, userId: string, userRole: string): Promise<IngestionJobResponse> {
    try {
      const job = await this.db('ingestion_jobs')
        .where('id', jobId)
        .first();

      if (!job) {
        throw new CustomError('Ingestion job not found', 404, ErrorCodes.INGESTION_JOB_NOT_FOUND);
      }

      // Check permissions
      const document = await this.db('documents')
        .where('id', job.document_id)
        .first();

      if (!document) {
        throw new CustomError('Document not found', 404, ErrorCodes.DOCUMENT_NOT_FOUND);
      }

      if (document.uploaded_by !== userId && userRole !== 'admin' && userRole !== 'editor') {
        throw new CustomError('Access denied', 403, ErrorCodes.ACCESS_DENIED);
      }

      logger.info('Ingestion status retrieved successfully', {
        jobId,
        userId,
        userRole,
        status: job.status,
      });

      return this.mapToResponse(job);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      logger.error('Error getting ingestion status:', error);
      throw new CustomError('Failed to get ingestion status', 500, ErrorCodes.INGESTION_STATUS_ERROR);
    }
  }

  /**
   * Get all ingestion jobs for a user
   */
  async getUserIngestionJobs(
    userId: string, 
    userRole: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ jobs: IngestionJobResponse[]; total: number; totalPages: number }> {
    try {
      const offset = (page - 1) * limit;

      let baseQuery = this.db('ingestion_jobs')
        .join('documents', 'ingestion_jobs.document_id', 'documents.id')
        .select('ingestion_jobs.*');

      // Apply role-based filtering
      if (userRole === 'viewer') {
        baseQuery = baseQuery.where('documents.uploaded_by', userId);
      }

      // Get total count
      const [{ count }] = await baseQuery.clone().count('ingestion_jobs.id as count');
      const total = parseInt(count as string);
      const totalPages = Math.ceil(total / limit);

      // Execute query with pagination
      const jobs = await baseQuery
        .orderBy('ingestion_jobs.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      logger.info('User ingestion jobs retrieved successfully', {
        userId,
        userRole,
        page,
        limit,
        total,
        totalPages,
      });

      return {
        jobs: jobs.map(job => this.mapToResponse(job)),
        total,
        totalPages,
      };
    } catch (error) {
      logger.error('Error getting user ingestion jobs:', error);
      throw new CustomError('Failed to get ingestion jobs', 500, ErrorCodes.INGESTION_JOBS_FETCH_ERROR);
    }
  }

  /**
   * Get all ingestion jobs (admin only)
   */
  async getAllIngestionJobs(
    page: number = 1, 
    limit: number = 20,
    status?: string
  ): Promise<{ jobs: IngestionJobResponse[]; total: number; totalPages: number }> {
    try {
      const offset = (page - 1) * limit;

      let baseQuery = this.db('ingestion_jobs')
        .join('documents', 'ingestion_jobs.document_id', 'documents.id')
        .join('users', 'documents.uploaded_by', 'users.id')
        .select(
          'ingestion_jobs.*',
          'documents.title as document_title',
          'documents.file_name',
          'users.username as uploaded_by_username'
        );

      // Apply status filter if provided
      if (status) {
        baseQuery = baseQuery.where('ingestion_jobs.status', status);
      }

      // Get total count
      const [{ count }] = await baseQuery.clone().count('ingestion_jobs.id as count');
      const total = parseInt(count as string);
      const totalPages = Math.ceil(total / limit);

      // Execute query with pagination
      const jobs = await baseQuery
        .orderBy('ingestion_jobs.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      logger.info('All ingestion jobs retrieved successfully', {
        page,
        limit,
        total,
        totalPages,
        statusFilter: status,
      });

      return {
        jobs: jobs.map(job => this.mapToResponse(job)),
        total,
        totalPages,
      };
    } catch (error) {
      logger.error('Error getting all ingestion jobs:', error);
      throw new CustomError('Failed to get ingestion jobs', 500, ErrorCodes.INGESTION_JOBS_FETCH_ERROR);
    }
  }

  /**
   * Update ingestion job status (called by Python service webhook)
   */
  async updateJobStatus(
    jobId: string, 
    status: string, 
    progress?: any, 
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateFields: any = { 
        status, 
        updated_at: new Date() 
      };

      if (status === 'completed') {
        updateFields.completed_at = new Date();
        updateFields.progress = progress;
      } else if (status === 'failed') {
        updateFields.error_message = errorMessage;
        updateFields.progress = progress;
      } else if (status === 'processing') {
        updateFields.progress = progress;
      }

      await this.db('ingestion_jobs')
        .where('id', jobId)
        .update(updateFields);

      // Update document status
      const job = await this.db('ingestion_jobs')
        .where('id', jobId)
        .first();

      if (job) {
        const documentStatus = status === 'completed' ? 'completed' : 
                              status === 'failed' ? 'failed' : 'processing';
        
        await this.db('documents')
          .where('id', job.document_id)
          .update({ 
            status: documentStatus,
            processed_at: status === 'completed' ? new Date() : null,
            updated_at: new Date() 
          });
      }

      logger.info('Ingestion job status updated', {
        jobId,
        status,
        progress,
        errorMessage,
      });
    } catch (error) {
      logger.error('Error updating ingestion job status:', error);
      throw new CustomError('Failed to update job status', 500, ErrorCodes.JOB_STATUS_UPDATE_ERROR);
    }
  }

  /**
   * Retry failed ingestion job
   */
  async retryJob(jobId: string, userId: string, userRole: string): Promise<IngestionJobResponse> {
    try {
      const job = await this.db('ingestion_jobs')
        .where('id', jobId)
        .first();

      if (!job) {
        throw new CustomError('Ingestion job not found', 404, ErrorCodes.INGESTION_JOB_NOT_FOUND);
      }

      // Check permissions
      const document = await this.db('documents')
        .where('id', job.document_id)
        .first();

      if (!document) {
        throw new CustomError('Document not found', 404, ErrorCodes.DOCUMENT_NOT_FOUND);
      }

      if (document.uploaded_by !== userId && userRole !== 'admin') {
        throw new CustomError('Access denied', 403, ErrorCodes.ACCESS_DENIED);
      }

      if (job.status !== 'failed') {
        throw new CustomError('Only failed jobs can be retried', 400, ErrorCodes.INVALID_JOB_STATUS);
      }

      // Reset job status
      const [updatedJob] = await this.db('ingestion_jobs')
        .where('id', jobId)
        .update({
          status: 'queued',
          error_message: null,
          retry_count: job.retry_count + 1,
          updated_at: new Date(),
        })
        .returning('*');

      // Update document status
      await this.db('documents')
        .where('id', job.document_id)
        .update({ 
          status: 'processing',
          updated_at: new Date() 
        });

      // Trigger Python service again
      try {
        await this.callPythonService('/ingest', {
          document_id: job.document_id,
          job_id: jobId,
          file_path: document.file_path,
          file_type: document.file_type,
          retry_count: updatedJob.retry_count,
        });

        // Update job status to processing
        await this.db('ingestion_jobs')
          .where('id', jobId)
          .update({ 
            status: 'processing',
            started_at: new Date(),
            updated_at: new Date() 
          });

        logger.info('Ingestion job retried successfully', {
          jobId,
          documentId: job.document_id,
          userId,
          retryCount: updatedJob.retry_count,
        });

      } catch (pythonError) {
        // Mark job as failed again
        await this.db('ingestion_jobs')
          .where('id', jobId)
          .update({ 
            status: 'failed',
            error_message: `Retry failed: ${pythonError}`,
            updated_at: new Date() 
          });

        // Reset document status
        await this.db('documents')
          .where('id', job.document_id)
          .update({ 
            status: 'failed',
            updated_at: new Date() 
          });

        logger.error('Failed to retry ingestion job', {
          jobId,
          documentId: job.document_id,
          error: pythonError,
        });

        throw new CustomError('Failed to retry ingestion process', 500, ErrorCodes.PYTHON_SERVICE_ERROR);
      }

      return this.mapToResponse(updatedJob);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      logger.error('Error retrying ingestion job:', error);
      throw new CustomError('Failed to retry ingestion job', 500, ErrorCodes.INGESTION_RETRY_ERROR);
    }
  }

  /**
   * Call Python service
   */
  private async callPythonService(endpoint: string, data: any): Promise<PythonServiceResponse> {
    try {
      const response = await axios.post(`${this.pythonServiceUrl}${endpoint}`, data, {
        headers: {
          'Authorization': `Bearer ${this.pythonServiceApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Python service call failed', {
          endpoint,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        throw new Error(`Python service error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Map database job to response format
   */
  private mapToResponse(job: IngestionJob): IngestionJobResponse {
    const response: IngestionJobResponse = {
      id: job.id,
      document_id: job.document_id,
      status: job.status,
      retry_count: job.retry_count,
      created_at: job.created_at,
      updated_at: job.updated_at,
    };

    // Only include optional fields if they have values
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
}
