import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorMappingService {
  
  // User-friendly error messages
  private readonly errorMessages: { [key: string]: string } = {
    // Authentication errors
    'Invalid credentials': 'The email or password you entered is incorrect. Please try again.',
    'Email already registered': 'An account with this email already exists. Please use a different email or try logging in.',
    'Username already taken': 'This username is already taken. Please choose a different username.',
    'Access token required': 'Please log in to access this feature.',
    'Token invalid or expired': 'Your session has expired. Please log in again.',
    'Invalid refresh token': 'Your session has expired. Please log in again.',
    'No refresh token available': 'Please log in to continue.',
    'User not found': 'Account not found. Please check your email or create a new account.',
    'Failed to register user': 'Unable to create your account. Please try again or contact support.',
    'Failed to trigger ingestion process': 'Unable to start document processing. Please try again.',
    'Document not found': 'The requested document could not be found.',
    'Access denied': 'You do not have permission to perform this action.',
    'Insufficient permissions': 'You do not have the required permissions for this action.',
    
    // Network errors
    'Network Error': 'Unable to connect to the server. Please check your internet connection.',
    'timeout': 'The request timed out. Please try again.',
    'Connection refused': 'Unable to connect to the server. Please try again later.',
    
    // Validation errors
    'Email is required': 'Please enter your email address.',
    'Password is required': 'Please enter your password.',
    'First name is required': 'Please enter your first name.',
    'Last name is required': 'Please enter your last name.',
    'Username is required': 'Please enter a username.',
    'Please provide a valid email address': 'Please enter a valid email address.',
    'Username must contain only alphanumeric characters': 'Username can only contain letters and numbers.',
    'Username must be at least 3 characters long': 'Username must be at least 3 characters long.',
    'Username must not exceed 30 characters': 'Username must not exceed 30 characters.',
    'Password must be at least 8 characters long': 'Password must be at least 8 characters long.',
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    'Passwords do not match': 'The passwords you entered do not match.',
    
    // File upload errors
    'File too large': 'The file is too large. Please choose a smaller file.',
    'Invalid file type': 'This file type is not supported. Please choose a different file.',
    'Upload failed': 'Unable to upload the file. Please try again.',
    
    // Generic errors
    'An error occurred': 'Something went wrong. Please try again.',
    'Server error': 'The server encountered an error. Please try again later.',
    'Unauthorized': 'You are not authorized to perform this action.',
    'Forbidden': 'You do not have permission to access this resource.',
    'Not found': 'The requested resource was not found.',
    'Internal server error': 'Something went wrong on our end. Please try again later.',
  };

  // HTTP status code mappings
  private readonly statusCodeMessages: { [key: number]: string } = {
    400: 'The request was invalid. Please check your input and try again.',
    401: 'Please log in to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This resource already exists. Please try a different option.',
    422: 'The information you provided is invalid. Please check and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Something went wrong on our end. Please try again later.',
    502: 'The server is temporarily unavailable. Please try again later.',
    503: 'The service is temporarily unavailable. Please try again later.',
    504: 'The request timed out. Please try again.',
  };

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: any): string {
    // Check for specific error messages first
    if (error?.error?.message) {
      const message = error.error.message;
      if (this.errorMessages[message]) {
        return this.errorMessages[message];
      }
    }

    // Check for error message in error object
    if (error?.message) {
      const message = error.message;
      if (this.errorMessages[message]) {
        return this.errorMessages[message];
      }
    }

    // Check for HTTP status codes
    if (error?.status) {
      if (this.statusCodeMessages[error.status]) {
        return this.statusCodeMessages[error.status];
      }
    }

    // Check for network errors
    if (error?.name === 'TimeoutError') {
      return this.errorMessages['timeout'];
    }

    if (error?.name === 'HttpErrorResponse') {
      return this.errorMessages['Network Error'];
    }

    // Default fallback
    return this.errorMessages['An error occurred'];
  }

  /**
   * Get error type for styling
   */
  getErrorType(error: any): 'warning' | 'error' | 'info' {
    if (error?.status) {
      if (error.status >= 500) {
        return 'error';
      } else if (error.status >= 400) {
        return 'warning';
      }
    }
    return 'error';
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: any): boolean {
    if (error?.status) {
      // Retry on server errors and timeouts
      return error.status >= 500 || error.status === 408 || error.status === 429;
    }
    
    // Retry on network errors
    if (error?.name === 'TimeoutError' || error?.name === 'HttpErrorResponse') {
      return true;
    }
    
    return false;
  }

  /**
   * Get retry message
   */
  getRetryMessage(error: any): string {
    if (this.isRetryable(error)) {
      return 'Try again';
    }
    return 'Contact support';
  }
}
