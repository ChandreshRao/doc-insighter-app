import { getDatabase } from '../database/connection';
import { 
  Document, 
  CreateDocumentRequest, 
  UpdateDocumentRequest, 
  DocumentResponse, 
  PaginationQuery,
  PaginatedResponse 
} from '../types';
import { logger } from '../utils/logger';
import { CustomError } from '../middleware/errorHandler';
import fs from 'fs';
import path from 'path';
import { ErrorCodes } from '../utils/constants';

export class DocumentService {
  private get db() {
    return getDatabase();
  }

  /**
   * Create a new document
   */
  async createDocument(userId: string, documentData: CreateDocumentRequest): Promise<DocumentResponse> {
    try {
      const { title, description, file } = documentData;

      // Validate file exists
      if (!file) {
        throw new CustomError('No file provided', 400, ErrorCodes.NO_FILE);
      }

      // Create document record
      const [newDocument] = await this.db('documents')
        .insert({
          title,
          description: description || null,
          file_name: file.originalname,
          file_path: file.path,
          file_type: path.extname(file.originalname).substring(1),
          file_size: file.size,
          mime_type: file.mimetype,
          status: 'pending',
          metadata: {
            originalName: file.originalname,
            encoding: file.encoding,
            fieldname: file.fieldname,
          },
          uploaded_by: userId,
        })
        .returning('*');

      logger.info('Document created successfully', {
        documentId: newDocument.id,
        userId,
        fileName: file.originalname,
        fileSize: file.size,
      });

      return this.mapToResponse(newDocument);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      logger.error('Error creating document:', error);
      throw new CustomError('Failed to create document', 500, ErrorCodes.DOCUMENT_CREATE_ERROR);
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string, userId: string, userRole: string): Promise<DocumentResponse> {
    try {
      const document = await this.db('documents')
        .where('id', documentId)
        .first();

      if (!document) {
        throw new CustomError('Document not found', 404, ErrorCodes.DOCUMENT_NOT_FOUND);
      }

      // Check permissions
      if (document.uploaded_by !== userId && userRole !== 'admin' && userRole !== 'editor') {
        throw new CustomError('Access denied', 403, ErrorCodes.ACCESS_DENIED);
      }

      logger.info('Document retrieved successfully', {
        documentId,
        userId,
        userRole,
      });

      return this.mapToResponse(document);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      logger.error('Error getting document:', error);
      throw new CustomError('Failed to get document', 500, ErrorCodes.DOCUMENT_FETCH_ERROR);
    }
  }

  /**
   * Get all documents with pagination
   */
  async getDocuments(
    userId: string, 
    userRole: string, 
    query: PaginationQuery
  ): Promise<PaginatedResponse<DocumentResponse>> {
    try {
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;
      const offset = (page - 1) * limit;

      // Build base query
      let baseQuery = this.db('documents')
        .select('id', 'title', 'description', 'file_name', 'file_type', 'file_size', 'status', 'created_at', 'updated_at', 'uploaded_by');

      // Apply role-based filtering
      if (userRole === 'viewer') {
        baseQuery = baseQuery.where('uploaded_by', userId);
      }

      // Get total count
      const [{ count }] = await baseQuery.clone().count('* as count');
      const total = parseInt(count as string);
      const totalPages = Math.ceil(total / limit);

      // Execute query with pagination
      const documents = await baseQuery
        .orderBy(sort_by, sort_order)
        .limit(limit)
        .offset(offset);

      // Get user information for uploaded_by
      const userIds = [...new Set(documents.map(doc => doc.uploaded_by))];
      const users = await this.db('users')
        .whereIn('id', userIds)
        .select('id', 'username', 'first_name', 'last_name');

      const userMap = users.reduce((acc: any, user: any) => {
        acc[user.id] = user;
        return acc;
      }, {});

      // Map documents with user info
      const documentsWithUsers = documents.map(doc => ({
        ...doc,
        uploaded_by: userMap[doc.uploaded_by] || { id: doc.uploaded_by, username: 'Unknown' },
      }));

      logger.info('Documents retrieved successfully', {
        userId,
        userRole,
        page,
        limit,
        total,
        totalPages,
      });

      return {
        data: documentsWithUsers.map(doc => this.mapToResponse(doc)),
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      };
    } catch (error) {
      logger.error('Error getting documents:', error);
      throw new CustomError('Failed to get documents', 500, ErrorCodes.DOCUMENTS_FETCH_ERROR);
    }
  }

  /**
   * Update document
   */
  async updateDocument(
    documentId: string, 
    userId: string, 
    userRole: string, 
    updateData: UpdateDocumentRequest
  ): Promise<DocumentResponse> {
    try {
      // Check if document exists and user has permission
      const existingDocument = await this.db('documents')
        .where('id', documentId)
        .first();

      if (!existingDocument) {
        throw new CustomError('Document not found', 404, ErrorCodes.DOCUMENT_NOT_FOUND);
      }

      // Check permissions
      if (existingDocument.uploaded_by !== userId && userRole !== 'admin' && userRole !== 'editor') {
        throw new CustomError('Access denied', 403, ErrorCodes.ACCESS_DENIED);
      }

      // Prepare update fields
      const updateFields: any = { updated_at: new Date() };
      if (updateData.title !== undefined) updateFields.title = updateData.title;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.status !== undefined) updateFields.status = updateData.status;

      // Update document
      const [updatedDocument] = await this.db('documents')
        .where('id', documentId)
        .update(updateFields)
        .returning('*');

      logger.info('Document updated successfully', {
        documentId,
        userId,
        userRole,
        updatedFields: Object.keys(updateFields),
      });

      return this.mapToResponse(updatedDocument);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      logger.error('Error updating document:', error);
      throw new CustomError('Failed to update document', 500, ErrorCodes.DOCUMENT_UPDATE_ERROR);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, userId: string, userRole: string): Promise<void> {
    try {
      // Check if document exists and user has permission
      const existingDocument = await this.db('documents')
        .where('id', documentId)
        .first();

      if (!existingDocument) {
        throw new CustomError('Document not found', 404, ErrorCodes.DOCUMENT_NOT_FOUND);
      }

      // Check permissions
      if (existingDocument.uploaded_by !== userId && userRole !== 'admin') {
        throw new CustomError('Access denied', 403, ErrorCodes.ACCESS_DENIED);
      }

      // Delete file from filesystem
      if (existingDocument.file_path && fs.existsSync(existingDocument.file_path)) {
        try {
          fs.unlinkSync(existingDocument.file_path);
          logger.info('Document file deleted from filesystem', {
            documentId,
            filePath: existingDocument.file_path,
          });
        } catch (fileError) {
          logger.warn('Failed to delete document file from filesystem', {
            documentId,
            filePath: existingDocument.file_path,
            error: fileError,
          });
        }
      }

      // Delete document record
      await this.db('documents')
        .where('id', documentId)
        .del();

      logger.info('Document deleted successfully', {
        documentId,
        userId,
        userRole,
      });
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      logger.error('Error deleting document:', error);
      throw new CustomError('Failed to delete document', 500, ErrorCodes.DOCUMENT_DELETE_ERROR);
    }
  }

  /**
   * Get documents by status
   */
  async getDocumentsByStatus(
    status: string, 
    userId: string, 
    userRole: string, 
    query: PaginationQuery
  ): Promise<PaginatedResponse<DocumentResponse>> {
    try {
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;
      const offset = (page - 1) * limit;

      // Build base query
      let baseQuery = this.db('documents')
        .where('status', status)
        .select('id', 'title', 'description', 'file_name', 'file_type', 'file_size', 'status', 'created_at', 'updated_at', 'uploaded_by');

      // Apply role-based filtering
      if (userRole === 'viewer') {
        baseQuery = baseQuery.where('uploaded_by', userId);
      }

      // Get total count
      const [{ count }] = await baseQuery.clone().count('* as count');
      const total = parseInt(count as string);
      const totalPages = Math.ceil(total / limit);

      // Execute query with pagination
      const documents = await baseQuery
        .orderBy(sort_by, sort_order)
        .limit(limit)
        .offset(offset);

      logger.info('Documents by status retrieved successfully', {
        status,
        userId,
        userRole,
        page,
        limit,
        total,
        totalPages,
      });

      return {
        data: documents.map(doc => this.mapToResponse(doc)),
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      };
    } catch (error) {
      logger.error('Error getting documents by status:', error);
      throw new CustomError('Failed to get documents by status', 500, ErrorCodes.DOCUMENTS_STATUS_FETCH_ERROR);
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(userId: string, userRole: string): Promise<any> {
    try {
      let baseQuery = this.db('documents');

      // Apply role-based filtering
      if (userRole === 'viewer') {
        baseQuery = baseQuery.where('uploaded_by', userId);
      }

      // Get counts by status
      const statusStats = await baseQuery
        .select('status')
        .count('* as count')
        .groupBy('status');

      // Get total file size
      const totalSizeResult = await baseQuery
        .sum('file_size as totalSize');
      const totalSize = totalSizeResult[0]?.totalSize || 0;

      // Get file type distribution
      const fileTypeStats = await baseQuery
        .select('file_type')
        .count('* as count')
        .groupBy('file_type');

      // Get recent uploads (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentCountResult = await baseQuery
        .where('created_at', '>=', sevenDaysAgo)
        .count('* as recentCount');
      const recentCount = recentCountResult[0]?.recentCount || 0;

      const stats = {
        byStatus: statusStats.reduce((acc: any, stat: any) => {
          acc[stat.status] = parseInt(stat.count as string);
          return acc;
        }, {}),
        totalSize: parseInt(totalSize as string) || 0,
        byFileType: fileTypeStats.reduce((acc: any, stat: any) => {
          acc[stat.file_type] = parseInt(stat.count as string);
          return acc;
        }, {}),
        recentUploads: parseInt(recentCount as string) || 0,
      };

      logger.info('Document statistics retrieved successfully', {
        userId,
        userRole,
      });

      return stats;
    } catch (error) {
      logger.error('Error getting document statistics:', error);
      throw new CustomError('Failed to get document statistics', 500, ErrorCodes.DOCUMENT_STATS_ERROR);
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(
    searchTerm: string,
    userId: string,
    userRole: string,
    query: PaginationQuery
  ): Promise<PaginatedResponse<DocumentResponse>> {
    try {
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;
      const offset = (page - 1) * limit;

      // Build search query
      let baseQuery = this.db('documents')
        .where(function() {
          this.where('title', 'ilike', `%${searchTerm}%`)
            .orWhere('description', 'ilike', `%${searchTerm}%`)
            .orWhere('file_name', 'ilike', `%${searchTerm}%`);
        })
        .select('id', 'title', 'description', 'file_name', 'file_type', 'file_size', 'status', 'created_at', 'updated_at', 'uploaded_by');

      // Apply role-based filtering
      if (userRole === 'viewer') {
        baseQuery = baseQuery.where('uploaded_by', userId);
      }

      // Get total count
      const [{ count }] = await baseQuery.clone().count('* as count');
      const total = parseInt(count as string);
      const totalPages = Math.ceil(total / limit);

      // Execute query with pagination
      const documents = await baseQuery
        .orderBy(sort_by, sort_order)
        .limit(limit)
        .offset(offset);

      logger.info('Document search completed successfully', {
        searchTerm,
        userId,
        userRole,
        page,
        limit,
        total,
        totalPages,
      });

      return {
        data: documents.map(doc => this.mapToResponse(doc)),
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      };
    } catch (error) {
      logger.error('Error searching documents:', error);
      throw new CustomError('Failed to search documents', 500, ErrorCodes.DOCUMENT_SEARCH_ERROR);
    }
  }

  /**
   * Map database document to response format
   */
  private mapToResponse(document: Document): DocumentResponse {
    const response: DocumentResponse = {
      id: document.id,
      title: document.title,
      file_name: document.file_name,
      file_type: document.file_type,
      file_size: document.file_size,
      mime_type: document.mime_type,
      status: document.status,
      uploaded_by: document.uploaded_by,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };

    // Only include optional properties if they have values
    if (document.description !== undefined) {
      response.description = document.description;
    }
    if (document.metadata !== undefined) {
      response.metadata = document.metadata;
    }
    if (document.processed_at !== undefined) {
      response.processed_at = document.processed_at;
    }

    return response;
  }
}
