import { Router, Request, Response } from 'express';
import { DocumentService } from '../services/documentService';
import { IngestionService } from '../services/ingestionService';
import { validateRequest, validationSchemas, validateParams, uuidSchema, validateQuery } from '../middleware/validationMiddleware';
import { authenticateToken, requireEditor } from '../middleware/authMiddleware';
import { fileUploadMiddleware, getFileUploadConfig } from '../middleware/fileUploadMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { PaginationQuery } from '../types';

const router = Router();

// Create service instance on-demand to avoid database initialization issues
const getDocumentService = () => new DocumentService();

/**
 * @route   POST /api/documents
 * @desc    Upload a new document
 * @access  Private (Editor/Admin)
 */
router.post('/',
  authenticateToken,
  requireEditor,
  fileUploadMiddleware,
  validateRequest(validationSchemas.createDocument),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.user_id;
    const documentData = req.body;
    
    const newDocument = await getDocumentService().createDocument(userId, documentData);
    
    logger.info('Document uploaded successfully', {
      documentId: newDocument.id,
      userId,
      fileName: newDocument.file_name,
    });

    res.status(201).json({
      success: true,
      data: newDocument,
      message: 'Document uploaded successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/documents
 * @desc    Get all documents with pagination
 * @access  Private
 */
router.get('/',
  authenticateToken,
  validateQuery(validationSchemas.pagination),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    const query = req.query;
    
    const documents = await getDocumentService().getDocuments(userId, userRole, query);
    
    logger.info('Documents retrieved successfully', {
      userId,
      userRole,
      page: query.page,
      limit: query.limit,
      total: documents.pagination.total,
    });

    res.status(200).json({
      success: true,
      data: documents.data,
      pagination: documents.pagination,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/documents/:id
 * @desc    Get document by ID
 * @access  Private
 */
router.get('/:id',
  authenticateToken,
  validateParams(uuidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    
    const document = await getDocumentService().getDocumentById(id, userId, userRole);
    
    logger.info('Document retrieved successfully', {
      documentId: id,
      userId,
      userRole,
    });

    res.status(200).json({
      success: true,
      data: document,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   PUT /api/documents/:id
 * @desc    Update document
 * @access  Private (Owner/Editor/Admin)
 */
router.put('/:id',
  authenticateToken,
  validateParams(uuidSchema),
  validateRequest(validationSchemas.updateDocument),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    const updateData = req.body;
    
    const updatedDocument = await getDocumentService().updateDocument(id, userId, userRole, updateData);
    
    logger.info('Document updated successfully', {
      documentId: id,
      userId,
      userRole,
      updatedFields: Object.keys(updateData),
    });

    res.status(200).json({
      success: true,
      data: updatedDocument,
      message: 'Document updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document
 * @access  Private (Owner/Admin)
 */
router.delete('/:id',
  authenticateToken,
  validateParams(uuidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    
    await getDocumentService().deleteDocument(id, userId, userRole);
    
    logger.info('Document deleted successfully', {
      documentId: id,
      userId,
      userRole,
    });

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/documents/status/:status
 * @desc    Get documents by status
 * @access  Private
 */
router.get('/status/:status',
  authenticateToken,
  validateQuery(validationSchemas.pagination),
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params;
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    const query = req.query;
    
    const documents = await getDocumentService().getDocumentsByStatus(status, userId, userRole, query);
    
    logger.info('Documents by status retrieved successfully', {
      status,
      userId,
      userRole,
      page: query.page,
      limit: query.limit,
      total: documents.pagination.total,
    });

    res.status(200).json({
      success: true,
      data: documents.data,
      pagination: documents.pagination,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/documents/search
 * @desc    Search documents
 * @access  Private
 */
router.get('/search',
  authenticateToken,
  validateQuery(validationSchemas.pagination),
  asyncHandler(async (req: Request, res: Response) => {
    const { q: searchTerm, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term is required',
        timestamp: new Date().toISOString(),
      });
    }
    
    const query: PaginationQuery = { page: Number(page), limit: Number(limit), sort_by: sort_by as string, sort_order: sort_order as 'asc' | 'desc' };
    const documents = await getDocumentService().searchDocuments(searchTerm as string, userId, userRole, query);
    
    logger.info('Document search completed successfully', {
      searchTerm,
      userId,
      userRole,
      page,
      limit,
      total: documents.pagination.total,
    });

    return res.status(200).json({
      success: true,
      data: documents.data,
      pagination: documents.pagination,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/documents/stats/overview
 * @desc    Get document statistics
 * @access  Private
 */
router.get('/stats/overview',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    
    const stats = await getDocumentService().getDocumentStats(userId, userRole);
    
    logger.info('Document statistics retrieved successfully', {
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
 * @route   GET /api/documents/:id/download
 * @desc    Download document file
 * @access  Private
 */
router.get('/:id/download',
  authenticateToken,
  validateParams(uuidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    
    // Get document with file path
    const document = await getDocumentService().getDocumentById(id, userId, userRole);
    
    // Return file metadata for client-side download
    // The actual file streaming would be implemented with proper file system handling
    res.status(200).json({
      success: true,
      data: {
        document_id: id,
        file_name: document.file_name,
        file_type: document.file_type,
        file_size: document.file_size,
        download_url: `/api/documents/${id}/stream`, // Separate endpoint for actual file streaming
        message: 'Use the download_url to stream the actual file'
      },
      timestamp: new Date().toISOString(),
    });

    // Log download request
    logger.info('Document download requested', {
      documentId: id,
      userId,
      userRole,
      fileName: document.file_name,
    });
  })
);

/**
 * @route   POST /api/documents/:id/retry
 * @desc    Retry failed document processing
 * @access  Private (Owner/Admin)
 */
router.post('/:id/retry',
  authenticateToken,
  validateParams(uuidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.user_id;
    const userRole = req.user!.role;
    
    // Check if user can retry this document
    if (userRole !== 'admin' && userRole !== 'editor') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to retry documents',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Get document and check if it can be retried
      const document = await getDocumentService().getDocumentById(id, userId, userRole);
      
      if (document.status !== 'failed') {
        return res.status(400).json({
          success: false,
          error: 'Only failed documents can be retried',
          timestamp: new Date().toISOString(),
        });
      }

      // Reset document status to pending
      const updatedDocument = await getDocumentService().updateDocument(id, userId, userRole, {
        status: 'pending',
      });

      // Trigger ingestion process again
      const ingestionService = new IngestionService();
      await ingestionService.triggerIngestion(userId, { document_id: id });

      logger.info('Document retry initiated successfully', {
        documentId: id,
        userId,
        userRole,
      });

      return res.status(200).json({
        success: true,
        data: updatedDocument,
        message: 'Document retry initiated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Document retry failed:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to retry document processing',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * @route   GET /api/documents/upload/config
 * @desc    Get file upload configuration
 * @access  Private
 */
router.get('/upload/config',
  authenticateToken,
  asyncHandler(async (_req: Request, res: Response) => {
    // Import the function to get upload config
    const config = getFileUploadConfig();
    
    res.status(200).json({
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
