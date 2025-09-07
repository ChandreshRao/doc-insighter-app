# Mock Ingestion Service

The Mock Ingestion Service is a development and testing implementation that simulates the document processing pipeline without requiring external Python services or complex infrastructure.

## Overview

This service provides a realistic simulation of document ingestion processes, including:
- Job creation and management
- Status tracking and updates
- Processing simulation with configurable steps
- Error simulation and retry mechanisms
- Auto-cleanup of old jobs
- Comprehensive statistics

## Features

### 🔄 **Processing Simulation**
- **Configurable processing time** (2-10 seconds by default)
- **Step-by-step progress** with realistic percentages
- **Configurable failure rate** (10% by default)
- **Realistic processing steps** (initializing, extracting text, analyzing content, etc.)

### 📊 **Job Management**
- **Job lifecycle tracking** (queued → processing → completed/failed)
- **Retry mechanisms** for failed jobs
- **Job cancellation** by admins
- **Bulk processing** capabilities

### 🧹 **Auto-Cleanup**
- **Configurable cleanup intervals** (5 minutes by default)
- **Age-based job removal** (1 hour by default)
- **Memory management** for long-running services

### 📈 **Statistics & Monitoring**
- **Real-time job statistics**
- **Processing time analytics**
- **Failure rate tracking**
- **Status distribution**

## Configuration

The service can be configured through environment variables or programmatically:

### Environment Variables

```bash
# Processing time (milliseconds)
MOCK_INGESTION_MIN_TIME=2000
MOCK_INGESTION_MAX_TIME=10000

# Failure simulation
MOCK_INGESTION_FAILURE_RATE=0.1

# Retry settings
MOCK_INGESTION_MAX_RETRIES=3

# Auto-cleanup
MOCK_INGESTION_AUTO_CLEANUP=true
MOCK_INGESTION_CLEANUP_INTERVAL=300000
MOCK_INGESTION_MAX_AGE=3600000
```

### Programmatic Configuration

```typescript
import { MockIngestionService } from './mockIngestionService';
import { MockIngestionConfig } from './config/mockIngestion';

const config: MockIngestionConfig = {
  processingTime: { min: 1000, max: 5000 },
  failureRate: 0.05,
  steps: [
    { name: 'initializing', duration: 200, percentage: 10 },
    { name: 'processing', duration: 1000, percentage: 50 },
    { name: 'finalizing', duration: 300, percentage: 100 },
  ],
  maxRetries: 5,
  autoCleanup: {
    enabled: true,
    interval: 60000,
    maxAge: 1800000,
  },
};

const service = new MockIngestionService(config);
```

## Usage

### Basic Usage

```typescript
import { MockIngestionService } from './mockIngestionService';

const service = new MockIngestionService();

// Trigger ingestion
const job = await service.triggerIngestion('user-123', {
  document_id: 'doc-456'
});

// Check status
const status = await service.getIngestionStatus(job.id, 'user-123', 'editor');

// Get user jobs
const jobs = await service.getUserIngestionJobs('user-123', 'editor', 1, 20);
```

### Advanced Usage

```typescript
// Update configuration
service.updateConfig({
  failureRate: 0.2, // 20% failure rate
  processingTime: { min: 500, max: 2000 }
});

// Get statistics
const stats = service.getStats();
console.log(`Total jobs: ${stats.totalJobs}`);
console.log(`Failure rate: ${stats.failureRate}`);

// Manual cleanup
service.clearAllJobs();

// Stop auto-cleanup
service.stopAutoCleanup();
```

## API Endpoints

The mock service works with all existing ingestion API endpoints:

### **POST /api/ingestion/trigger**
Triggers document processing (Editor/Admin only)

### **GET /api/ingestion/status/:jobId**
Gets job status and progress

### **GET /api/ingestion/jobs**
Gets user's ingestion jobs with pagination

### **GET /api/ingestion/jobs/all**
Gets all jobs (Admin only)

### **POST /api/ingestion/jobs/:jobId/retry**
Retries failed jobs

### **POST /api/ingestion/webhook/status-update**
Webhook for status updates (bypasses API key validation in mock mode)

### **GET /api/ingestion/stats/overview**
Gets user statistics

### **GET /api/ingestion/stats/admin**
Gets admin statistics

### **POST /api/ingestion/bulk/trigger**
Bulk job processing (Admin only)

### **DELETE /api/ingestion/jobs/:jobId**
Cancels jobs (Admin only)

## Testing

The mock service includes comprehensive test coverage:

```bash
# Run ingestion tests
npm run test:ingestion

# Run specific test files
npx jest src/tests/ingestionRoutes.test.ts
npx jest src/tests/mockIngestionService.test.ts
```

### Test Features
- **Unit tests** for all service methods
- **Integration tests** for API endpoints
- **Concurrent operation testing**
- **Configuration validation**
- **Error scenario testing**

## Development vs Production

### **Development Mode** (Default)
- Uses mock service automatically
- No external dependencies
- Realistic processing simulation
- Easy debugging and testing

### **Production Mode**
- Uses real ingestion service
- Requires Python service integration
- Full document processing pipeline
- Production-grade error handling

### **Switching Modes**

```typescript
// Force mock service
process.env.USE_MOCK_INGESTION = 'true';

// Force real service
process.env.USE_MOCK_INGESTION = 'false';
process.env.PYTHON_SERVICE_API_KEY = 'your-api-key';
```

## Benefits

### **For Development**
- **No external dependencies** - works offline
- **Predictable behavior** - easy to test
- **Fast iteration** - no waiting for real processing
- **Easy debugging** - full control over job states

### **For Testing**
- **Deterministic outcomes** - configurable failure rates
- **Isolated testing** - no external service calls
- **Performance testing** - simulate high load
- **Error testing** - simulate various failure scenarios

### **For Frontend Development**
- **Complete API coverage** - all endpoints work
- **Realistic data** - proper response formats
- **Real-time updates** - status changes over time
- **Error handling** - proper error responses

## Migration to Real Service

When ready to use the real ingestion service:

1. **Set environment variables**:
   ```bash
   USE_MOCK_INGESTION=false
   PYTHON_SERVICE_API_KEY=your-api-key
   ```

2. **Update service configuration**:
   ```typescript
   // The service automatically switches based on environment
   const service = getIngestionService(); // Returns real service
   ```

3. **No code changes required** - the API remains the same

## Troubleshooting

### **Common Issues**

1. **Jobs not processing**:
   - Check if auto-cleanup is enabled
   - Verify processing time configuration
   - Check for JavaScript errors in console

2. **High memory usage**:
   - Enable auto-cleanup
   - Reduce max age for completed jobs
   - Clear jobs manually in testing

3. **Unexpected failures**:
   - Check failure rate configuration
   - Verify job retry logic
   - Check error message handling

### **Debug Mode**

```typescript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';

// Get detailed statistics
const stats = service.getStats();
console.log('Service stats:', stats);

// Check configuration
const config = service.getConfig();
console.log('Service config:', config);
```

## Performance Considerations

- **Memory usage**: Jobs are stored in memory (consider cleanup for production)
- **Processing time**: Configurable to match real service expectations
- **Concurrent jobs**: No limit by default (add limits if needed)
- **Cleanup frequency**: Balance between memory usage and data retention

## Future Enhancements

- **Persistent storage** for job data
- **More realistic processing steps**
- **Network simulation** for external service calls
- **Load testing utilities**
- **Metrics collection and reporting**
