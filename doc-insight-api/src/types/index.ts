// User related types
export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_active?: boolean;
  email_verified?: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

// Authentication related types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserResponse;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface JwtPayload {
  user_id: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Document related types
export interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  metadata?: Record<string, any>;
  uploaded_by: string;
  created_at: Date;
  updated_at: Date;
  processed_at?: Date;
}

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  file: Express.Multer.File;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  status?: DocumentStatus;
}

export interface DocumentResponse {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  metadata?: Record<string, any>;
  uploaded_by: string;
  created_at: Date;
  updated_at: Date;
  processed_at?: Date;
}

// Ingestion related types
export interface IngestionJob {
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

export type IngestionJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface TriggerIngestionRequest {
  document_id: string;
}

export interface IngestionJobResponse {
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

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Request/Response with pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// File upload types
export interface FileUploadConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  uploadPath: string;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
}

// Database query types
export interface DatabaseQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  where?: Record<string, any>;
}

// Python service communication types
export interface PythonServiceConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

export interface PythonServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
