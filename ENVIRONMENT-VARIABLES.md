# Environment Variables Configuration

This document describes all environment variables used in the Doc Insight API application.

## Table of Contents

- [Server Configuration](#server-configuration)
- [Database Configuration](#database-configuration)
- [JWT Configuration](#jwt-configuration)
- [Security Configuration](#security-configuration)
- [File Upload Configuration](#file-upload-configuration)
- [Python Service Configuration](#python-service-configuration)
- [Mock Ingestion Service Configuration](#mock-ingestion-service-configuration)
- [Logging Configuration](#logging-configuration)
- [CORS Configuration](#cors-configuration)

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment (development, production, test) |
| `PORT` | `3000` | Port number for the API server |
| `HOST` | `0.0.0.0` | Host address for the API server |

## Database Configuration

### Individual Database Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `postgres` | Database host address |
| `DB_PORT` | `5435` | Database port number |
| `DB_NAME` | `doc_insight` | Database name |
| `DB_USER` | `postgres` | Database username |
| `DB_PASSWORD` | `password` | Database password |
| `DB_SSL` | `false` | Enable SSL connection to database |

### Database URLs (Alternative)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `''` | Complete database connection URL for production |
| `DATABASE_URL_TEST` | `''` | Database connection URL for testing |
| `DB_NAME_TEST` | `doc_insight_test` | Test database name |

## JWT Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `your_secret_key` | Secret key for JWT token signing |
| `JWT_EXPIRATION` | `1h` | JWT token expiration time |
| `JWT_REFRESH_SECRET` | `your_refresh_secret_key` | Secret key for refresh tokens |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token expiration time |
| `JWT_ISSUER` | `doc-insight-api` | JWT issuer claim |
| `JWT_AUDIENCE` | `doc-insight-portal` | JWT audience claim |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |

## Security Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BCRYPT_ROUNDS` | `12` | Number of bcrypt rounds for password hashing |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limiting window in milliseconds (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Maximum requests per window per IP |

## File Upload Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILE_SIZE` | `10485760` | Maximum file size in bytes (10MB) |
| `UPLOAD_PATH` | `./uploads` | Directory for uploaded files |
| `ALLOWED_FILE_TYPES` | `pdf,doc,docx,txt,md` | Comma-separated list of allowed file types |

## Python Service Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PYTHON_SERVICE_URL` | `http://localhost:8000` | URL of the Python RAG service |
| `PYTHON_SERVICE_API_KEY` | `''` | API key for Python service authentication |

## Mock Ingestion Service Configuration

The mock ingestion service is used when `USE_MOCK_INGESTION=true` or when no Python service API key is provided.

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_MOCK_INGESTION` | `true` (if NODE_ENV=development or no PYTHON_SERVICE_API_KEY) | Force use of mock service |
| `MOCK_INGESTION_MIN_TIME` | `2000` | Minimum processing time in milliseconds |
| `MOCK_INGESTION_MAX_TIME` | `10000` | Maximum processing time in milliseconds |
| `MOCK_INGESTION_FAILURE_RATE` | `0.1` | Failure rate (0.0 to 1.0, where 0.1 = 10%) |
| `MOCK_INGESTION_MAX_RETRIES` | `3` | Maximum number of retries for failed jobs |
| `MOCK_INGESTION_AUTO_CLEANUP` | `false` | Enable automatic cleanup of old jobs |
| `MOCK_INGESTION_CLEANUP_INTERVAL` | `300000` | Cleanup interval in milliseconds (5 minutes) |
| `MOCK_INGESTION_MAX_AGE` | `3600000` | Maximum age of completed jobs in milliseconds (1 hour) |

## Logging Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level (error, warn, info, debug) |
| `LOG_FILE` | `app.log` | Main log file name |
| `LOG_ERROR_FILE` | `error.log` | Error log file name |

## CORS Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001,http://localhost:4200` | Comma-separated list of allowed CORS origins |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend application URL |

## Environment-Specific Examples

### Development Environment

```bash
NODE_ENV=development
PORT=3000
HOST=localhost

# Use mock service for development
USE_MOCK_INGESTION=true
MOCK_INGESTION_FAILURE_RATE=0.05
MOCK_INGESTION_AUTO_CLEANUP=true

# Local database
DB_HOST=localhost
DB_PORT=5435
DB_NAME=doc_insight_dev
DB_USER=postgres
DB_PASSWORD=dev_password

# Debug logging
LOG_LEVEL=debug
```

### Production Environment

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Use real Python service
USE_MOCK_INGESTION=false
PYTHON_SERVICE_URL=https://your-python-service.com
PYTHON_SERVICE_API_KEY=your_production_api_key

# Production database
DATABASE_URL=postgresql://user:password@db-host:5435/doc_insight_prod

# Production logging
LOG_LEVEL=info
LOG_FILE=/var/log/doc-insight/app.log
LOG_ERROR_FILE=/var/log/doc-insight/error.log

# Security
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_key_here
BCRYPT_ROUNDS=14
```

### Testing Environment

```bash
NODE_ENV=test
PORT=3001

# Use mock service for testing
USE_MOCK_INGESTION=true
MOCK_INGESTION_FAILURE_RATE=0.0
MOCK_INGESTION_AUTO_CLEANUP=true
MOCK_INGESTION_CLEANUP_INTERVAL=10000

# Test database
DATABASE_URL_TEST=postgresql://user:password@localhost:5435/doc_insight_test

# Test logging
LOG_LEVEL=error
```

## Configuration Validation

The application validates environment variables on startup and will:

1. **Warn** about missing optional variables
2. **Error** and exit for missing required variables
3. **Use defaults** for variables with fallback values

## Best Practices

### Security
- Use strong, unique secrets for JWT keys
- Rotate API keys regularly
- Use environment-specific database credentials
- Enable SSL for production databases

### Performance
- Adjust `BCRYPT_ROUNDS` based on server performance
- Configure appropriate rate limits
- Set reasonable file size limits
- Use connection pooling for databases

### Development
- Use mock services for local development
- Enable debug logging in development
- Use separate databases for different environments
- Configure auto-cleanup for mock services

### Monitoring
- Set appropriate log levels for each environment
- Configure log rotation
- Monitor rate limiting metrics
- Track mock service statistics

## Docker Environment

When using Docker, you can pass environment variables through:

1. **Docker Compose**:
   ```yaml
   environment:
     - NODE_ENV=production
     - DATABASE_URL=postgresql://user:pass@db:5435/doc_insight
   ```

2. **Docker Run**:
   ```bash
   docker run -e NODE_ENV=production -e DATABASE_URL=... your-image
   ```

3. **Environment File**:
   ```bash
   docker run --env-file .env your-image
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - Verify database is running and accessible
   - Check `DB_SSL` setting

2. **JWT Token Errors**:
   - Ensure `JWT_SECRET` is set and consistent
   - Check token expiration settings
   - Verify issuer and audience claims

3. **File Upload Issues**:
   - Check `MAX_FILE_SIZE` setting
   - Verify `UPLOAD_PATH` exists and is writable
   - Check `ALLOWED_FILE_TYPES` includes your file type

4. **Mock Service Issues**:
   - Check `USE_MOCK_INGESTION` setting
   - Verify mock service configuration
   - Check auto-cleanup settings

5. **CORS Errors**:
   - Add your frontend URL to `CORS_ORIGINS`
   - Check `FRONTEND_URL` setting
   - Verify protocol (http vs https)

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
LOG_LEVEL=debug
```

This will provide detailed information about:
- Database connections
- JWT token processing
- File upload handling
- Mock service operations
- API request/response details
