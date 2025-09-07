/**
 * Configuration for Mock Ingestion Service
 * 
 * This file contains configuration options for the mock ingestion service
 * used in development and testing environments.
 */

export interface MockIngestionConfig {
  // Processing simulation settings
  processingTime: {
    min: number; // Minimum processing time in milliseconds
    max: number; // Maximum processing time in milliseconds
  };
  
  // Failure simulation settings
  failureRate: number; // Percentage of jobs that should fail (0-1)
  
  // Processing steps simulation
  steps: Array<{
    name: string;
    duration: number; // Duration in milliseconds
    percentage: number; // Progress percentage
  }>;
  
  // Retry settings
  maxRetries: number; // Maximum number of retries allowed
  
  // Cleanup settings
  autoCleanup: {
    enabled: boolean;
    interval: number; // Cleanup interval in milliseconds
    maxAge: number; // Maximum age of completed jobs in milliseconds
  };
}

export const defaultMockIngestionConfig: MockIngestionConfig = {
  processingTime: {
    min: 2000, // 2 seconds
    max: 10000, // 10 seconds
  },
  
  failureRate: 0.1, // 10% failure rate
  
  steps: [
    { name: 'initializing', duration: 500, percentage: 10 },
    { name: 'extracting_text', duration: 1000, percentage: 30 },
    { name: 'analyzing_content', duration: 1000, percentage: 60 },
    { name: 'generating_embeddings', duration: 1000, percentage: 80 },
    { name: 'finalizing', duration: 500, percentage: 95 },
  ],
  
  maxRetries: 3,
  
  autoCleanup: {
    enabled: false, // Disabled by default
    interval: 300000, // 5 minutes
    maxAge: 3600000, // 1 hour
  },
};

/**
 * Get mock ingestion configuration from environment variables
 */
export function getMockIngestionConfig(): MockIngestionConfig {
  const config = { ...defaultMockIngestionConfig };
  
  // Override with environment variables if present
  if (process.env.MOCK_INGESTION_MIN_TIME) {
    config.processingTime.min = parseInt(process.env.MOCK_INGESTION_MIN_TIME);
  }
  
  if (process.env.MOCK_INGESTION_MAX_TIME) {
    config.processingTime.max = parseInt(process.env.MOCK_INGESTION_MAX_TIME);
  }
  
  if (process.env.MOCK_INGESTION_FAILURE_RATE) {
    config.failureRate = parseFloat(process.env.MOCK_INGESTION_FAILURE_RATE);
  }
  
  if (process.env.MOCK_INGESTION_MAX_RETRIES) {
    config.maxRetries = parseInt(process.env.MOCK_INGESTION_MAX_RETRIES);
  }
  
  if (process.env.MOCK_INGESTION_AUTO_CLEANUP === 'true') {
    config.autoCleanup.enabled = true;
  }
  
  if (process.env.MOCK_INGESTION_CLEANUP_INTERVAL) {
    config.autoCleanup.interval = parseInt(process.env.MOCK_INGESTION_CLEANUP_INTERVAL);
  }
  
  if (process.env.MOCK_INGESTION_MAX_AGE) {
    config.autoCleanup.maxAge = parseInt(process.env.MOCK_INGESTION_MAX_AGE);
  }
  
  return config;
}

/**
 * Validate mock ingestion configuration
 */
export function validateMockIngestionConfig(config: MockIngestionConfig): string[] {
  const errors: string[] = [];
  
  if (config.processingTime.min < 0) {
    errors.push('Minimum processing time must be non-negative');
  }
  
  if (config.processingTime.max < config.processingTime.min) {
    errors.push('Maximum processing time must be greater than or equal to minimum processing time');
  }
  
  if (config.failureRate < 0 || config.failureRate > 1) {
    errors.push('Failure rate must be between 0 and 1');
  }
  
  if (config.maxRetries < 0) {
    errors.push('Maximum retries must be non-negative');
  }
  
  if (config.autoCleanup.enabled) {
    if (config.autoCleanup.interval <= 0) {
      errors.push('Cleanup interval must be positive');
    }
    
    if (config.autoCleanup.maxAge <= 0) {
      errors.push('Maximum age must be positive');
    }
  }
  
  // Validate steps
  if (config.steps.length === 0) {
    errors.push('At least one processing step must be defined');
  }
  
  for (let i = 0; i < config.steps.length; i++) {
    const step = config.steps[i];
    
    if (!step.name || step.name.trim() === '') {
      errors.push(`Step ${i + 1} must have a name`);
    }
    
    if (step.duration < 0) {
      errors.push(`Step ${i + 1} duration must be non-negative`);
    }
    
    if (step.percentage < 0 || step.percentage > 100) {
      errors.push(`Step ${i + 1} percentage must be between 0 and 100`);
    }
  }
  
  // Check that percentages are in ascending order
  for (let i = 1; i < config.steps.length; i++) {
    if (config.steps[i].percentage <= config.steps[i - 1].percentage) {
      errors.push(`Step ${i + 1} percentage must be greater than previous step percentage`);
    }
  }
  
  return errors;
}
