import dotenv from 'dotenv';

interface Config extends Record<string, any> { 
    jwtSecret: string;
    jwtExpiration: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiration: string;
    jwtIssuer: string;
    jwtAudience: string;
    jwtAlgorithm: string;
    nodeEnv: string;
    port: number;
    host: string;
    corsOrigins: string;
    frontendUrl: string;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    logLevel: string;
    logFile: string;
    logErrorFile: string;
    dbHost: string;
    dbPort: number;
    dbName: string;
    dbUser: string;
    dbPassword: string;
    dbSsl: boolean;
    dbUrl: string;
    dbUrlTest: string;
    dbNameTest: string;
    bcryptRounds: number;
    maxFileSize: number;
    uploadPath: string;
    allowedFileTypes: string[];
    pythonServiceUrl: string;
    pythonServiceApiKey: string;
    // Mock Ingestion Service Configuration
    useMockIngestion: boolean;
    mockIngestionMinTime: number;
    mockIngestionMaxTime: number;
    mockIngestionFailureRate: number;
    mockIngestionMaxRetries: number;
    mockIngestionAutoCleanup: boolean;
    mockIngestionCleanupInterval: number;
    mockIngestionMaxAge: number;
}

// Load environment variables
dotenv.config();

const config: Config = {
    jwtSecret: process.env.JWT_SECRET || 'your_secret_key',
    jwtExpiration: process.env.JWT_EXPIRATION || '1h',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key',
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    jwtIssuer: process.env.JWT_ISSUER || 'doc-insight-api',
    jwtAudience: process.env.JWT_AUDIENCE || 'doc-insight-portal',
    jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:4200',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    logLevel: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || 'app.log',
    logErrorFile: process.env.LOG_ERROR_FILE || 'error.log',
    dbHost: process.env.DB_HOST || 'postgres',
    dbPort: parseInt(process.env.DB_PORT || '5432'),
    dbName: process.env.DB_NAME || 'doc_insight',
    dbUser: process.env.DB_USER || 'postgres',
    dbPassword: process.env.DB_PASSWORD || 'password',
    dbSsl: process.env.DB_SSL === 'true',
    dbUrl: process.env.DATABASE_URL || '',
    dbUrlTest: process.env.DATABASE_URL_TEST || '',
    dbNameTest: process.env.DB_NAME_TEST || 'doc_insight_test',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,md').split(','),
    pythonServiceUrl: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000',
    pythonServiceApiKey: process.env.PYTHON_SERVICE_API_KEY || '',
    // Mock Ingestion Service Configuration
    useMockIngestion: process.env.USE_MOCK_INGESTION === 'true' || process.env.NODE_ENV === 'development' || !process.env.PYTHON_SERVICE_API_KEY,
    mockIngestionMinTime: parseInt(process.env.MOCK_INGESTION_MIN_TIME || '2000'),
    mockIngestionMaxTime: parseInt(process.env.MOCK_INGESTION_MAX_TIME || '10000'),
    mockIngestionFailureRate: parseFloat(process.env.MOCK_INGESTION_FAILURE_RATE || '0.1'),
    mockIngestionMaxRetries: parseInt(process.env.MOCK_INGESTION_MAX_RETRIES || '3'),
    mockIngestionAutoCleanup: process.env.MOCK_INGESTION_AUTO_CLEANUP === 'true',
    mockIngestionCleanupInterval: parseInt(process.env.MOCK_INGESTION_CLEANUP_INTERVAL || '300000'),
    mockIngestionMaxAge: parseInt(process.env.MOCK_INGESTION_MAX_AGE || '3600000'),
}

export default config;