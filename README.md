# Doc Insight Application

A comprehensive document management application with Angular frontend and Node.js API backend using PostgreSQL for data storage and built-in mock ingestion service for development and testing.

## 📋 Table of Contents

1. [Architecture](#-architecture)
2. [Prerequisites](#-prerequisites)
3. [Quick Start](#-quick-start)
4. [Testing](#-testing)
5. [Project Structure](#-project-structure)
6. [Core Services](#-core-services)
7. [Docker Setup](#-docker-setup)
8. [Environment Configuration](#️-environment-configuration)
9. [Database Management](#️-database-management)
10. [Security Features](#-security-features)
11. [Troubleshooting](#-troubleshooting)
12. [Development](#-development)
13. [Monitoring](#-monitoring)
14. [Production Deployment](#-production-deployment)
15. [Contributing](#-contributing)

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Node.js Backend │    │ Mock Ingestion  │
│   (Angular)     │◄──►│  (API Service)  │◄──►│  Service        │
│   Port: 80      │    │  Port: 3000     │    │  (Built-in)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   PostgreSQL     │
                       │   Port: 5435     │
                       └──────────────────┘
```

## 🚀 Prerequisites

### Required Software
- **Docker Desktop** - Version 4.0+ (installed and running)
- **Node.js** - Version 18+ (for local development)
- **npm** - Version 8+ (comes with Node.js)
- **Git** - For version control

### System Requirements
- **RAM**: At least 8GB (16GB recommended)
- **Disk Space**: At least 10GB free space
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **CPU**: Multi-core processor (4+ cores recommended)

### Development Tools (Optional)
- **VS Code** - Recommended IDE with extensions:
  - TypeScript and JavaScript Language Features
  - Angular Language Service
  - Docker
  - GitLens
- **Postman** - For API testing
- **pgAdmin** - For database management

## 🚀 Quick Start

### 1. Clone and Setup Environment
```bash
git clone <repository-url>
cd doc-insighter-app
cp env.example .env
```

### 2. Configure Environment Variables
Edit the `.env` file with your settings:

```bash
# Required - Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Required - Database
DB_PASSWORD=your-secure-password
POSTGRES_PASSWORD=your-secure-password

# Optional - Application URLs (defaults work for development)
API_URL=http://localhost:3000/api
FRONTEND_URL=http://localhost:4200

# Optional - Mock Service (defaults work for development)
USE_MOCK_INGESTION=true
MOCK_INGESTION_FAILURE_RATE=0.05
```

### 3. Start All Services
```bash
# Start all services (recommended)
docker-compose up

# Or use helper scripts
./docker-start.ps1          # Windows PowerShell
./docker-start.bat          # Windows CMD
```

### 4. Access the Application
- **Frontend**: http://localhost:80
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 5. Default Login Credentials
- **Admin**: admin@docinsight.com / Admin123!
- **Editor**: editor@docinsight.com / Editor123!
- **Viewer**: viewer@docinsight.com / Viewer123!

## 🧪 Testing

### Test Structure Overview

The application includes comprehensive testing for both frontend and backend components:

#### Frontend Testing (Angular Portal)
```bash
cd doc-insight-portal

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm test -- --include="**/auth.service.spec.ts"
npm test -- --include="**/dashboard.service.spec.ts"
npm test -- --include="**/login.component.spec.ts"

# Run tests in watch mode
npm run test:watch

# Run tests for CI (headless)
npm run test:ci
```

#### Backend Testing (Node.js API)
```bash
cd doc-insight-api

# Run all tests
npm test

# Run specific test suites
npm run test:auth          # Authentication tests
npm run test:users         # User management tests
npm run test:integration   # Integration tests

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Comprehensive Test Suite

#### Core Test Files

1. **Authentication Service Tests** (`authService.test.ts`)
   - User registration and validation
   - User login/logout flows
   - Token refresh mechanisms
   - User management operations
   - Password management and security

2. **Authentication Routes Tests** (`authRoutes.test.ts`)
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/logout
   - POST /api/auth/refresh
   - GET /api/auth/me
   - PUT /api/auth/profile
   - POST /api/auth/change-password
   - POST /api/auth/verify-email

3. **User Management Tests** (`userRoutes.test.ts`)
   - GET /api/users (admin only)
   - GET /api/users/:id
   - POST /api/users (admin only)
   - PUT /api/users/:id (admin only)
   - DELETE /api/users/:id (admin only)
   - POST /api/users/:id/activate (admin only)
   - POST /api/users/:id/deactivate (admin only)
   - GET /api/users/:id/documents
   - GET /api/users/stats/overview (admin only)

4. **Authentication Middleware Tests** (`authMiddleware.test.ts`)
   - Token authentication
   - Role-based access control
   - Permission validation
   - Optional authentication scenarios

5. **Role Permissions Tests** (`rolePermissions.test.ts`)
   - Role hierarchy validation
   - Permission matrix testing
   - Access control scenarios
   - Edge cases and error handling

6. **Integration Tests** (`authIntegration.test.ts`)
   - Complete authentication flows
   - Cross-service interactions
   - Error handling scenarios
   - Role-based access patterns

### Test Coverage Goals
- **Frontend**: 80%+ code coverage
- **Backend**: 70%+ code coverage
- **Focus**: Critical user paths and error scenarios

### Coverage Thresholds
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Role-Based Testing

#### Role Hierarchy
The system implements a three-tier role hierarchy:

1. **Admin** (level 3) - Full access to all operations
2. **Editor** (level 2) - Can manage documents and view users
3. **Viewer** (level 1) - Read-only access

#### Permission Matrix

| Operation | Admin | Editor | Viewer |
|-----------|-------|--------|--------|
| User Management | ✅ | ❌ | ❌ |
| Document Management | ✅ | ✅ | ❌ |
| View Documents | ✅ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ |
| View Other Profiles | ✅ | ✅ | ❌ |

### Error Scenarios Tested

#### Authentication Errors
- Invalid credentials
- Expired tokens
- Missing tokens
- Malformed tokens
- Inactive user accounts

#### Authorization Errors
- Insufficient permissions
- Role hierarchy violations
- Self-modification restrictions
- Resource access restrictions

#### Validation Errors
- Invalid input data
- Missing required fields
- Format validation failures
- Business rule violations

#### Service Errors
- Database connection failures
- External service unavailability
- Network timeouts
- Unexpected errors

### Advanced Testing Commands

#### Comprehensive Testing
```bash
# Run all tests with coverage, linting, and type checking
npm run test:comprehensive

# Run all tests with coverage only
npm run test:all

# Run individual test file
npx jest src/tests/authService.test.ts
```

#### Test Runner Script
The `runTests.ts` script provides advanced testing capabilities:

```bash
# Basic test run
ts-node src/tests/runTests.ts

# With coverage report
ts-node src/tests/runTests.ts --coverage

# With linting and type checking
ts-node src/tests/runTests.ts --coverage --lint --type-check

# Show help
ts-node src/tests/runTests.ts --help
```

### Test Data and Mocking

#### Mock Strategy
The tests use comprehensive mocking to isolate units under test:

- **Database operations** - Mocked using Jest mocks
- **External services** - Mocked to avoid dependencies
- **Authentication utilities** - Mocked for predictable behavior
- **HTTP requests** - Tested using Supertest

#### Test Utilities
The `setup.ts` file provides utility functions:

```typescript
// Create mock user data
const user = testUtils.createMockUser({ role: 'admin' });

// Create mock JWT payload
const payload = testUtils.createMockJwtPayload({ role: 'editor' });

// Create mock request/response objects
const req = testUtils.createMockRequest({ user: payload });
const res = testUtils.createMockResponse();
const next = testUtils.createMockNext();
```

### Continuous Integration

The test suite is designed to run in CI/CD pipelines:

1. **Linting** - Code quality checks
2. **Type Checking** - TypeScript compilation
3. **Unit Tests** - Individual component testing
4. **Integration Tests** - End-to-end flow testing
5. **Coverage Reporting** - Test coverage analysis

### Test Maintenance Best Practices

#### Test Organization
- Each test file focuses on a specific component
- Tests are grouped by functionality
- Clear, descriptive test names
- Comprehensive test coverage

#### Mock Management
- Mocks are reset between tests
- Realistic mock data
- Proper mock cleanup
- Isolated test environments

#### Assertion Strategy
- Specific, meaningful assertions
- Error message validation
- Response structure verification
- Edge case coverage

## 📁 Project Structure

```
doc-insighter-app/
├── README.md                    # This documentation
├── docker-compose.yml           # Master Docker orchestration
├── env.example                  # Environment template
├── docker-start.ps1/.bat        # Startup helper scripts
├── doc-insight-api/             # Node.js Backend Service
│   ├── src/                     # Source code
│   ├── sql/                     # Database migration scripts
│   ├── bin/                     # Migration execution scripts
│   └── package.json
└── doc-insight-portal/          # Angular Frontend
    ├── src/                     # Source code
    └── package.json
```

## 🔧 Core Services

### Backend API Service
**Technology**: Node.js 18+, TypeScript, Express.js, PostgreSQL

**Key Features**:
- JWT authentication with role-based access control (admin, editor, viewer)
- User management with complete CRUD operations
- Document upload, processing, and lifecycle management
- Built-in mock ingestion service for development
- Comprehensive security (rate limiting, input validation, file upload security)

**API Endpoints**:
```
Authentication:
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
POST /api/auth/logout       - User logout
POST /api/auth/refresh      - Refresh access token
GET  /api/auth/me           - Get current user profile

User Management (Admin Only):
GET    /api/users           - Get all users
POST   /api/users           - Create new user
PUT    /api/users/:id       - Update user
DELETE /api/users/:id       - Delete user

Document Management:
POST   /api/documents           - Upload document
GET    /api/documents           - Get all documents
GET    /api/documents/:id       - Get document by ID
DELETE /api/documents/:id       - Delete document

Ingestion Control:
POST   /api/ingestion/trigger      - Trigger document processing
GET    /api/ingestion/status/:id   - Get job status
GET    /api/ingestion/jobs         - Get user's jobs
```

### Frontend Portal
**Technology**: Angular 15+, TypeScript, Angular Material

**Key Features**:
- Responsive design with Angular Material
- Authentication and session management
- Document upload and management interface
- User management (admin interface)
- Real-time status updates and notifications

### Mock Ingestion Service
**Technology**: Built into Node.js API

**Key Features**:
- Configurable processing simulation
- Job lifecycle tracking
- Error simulation for testing
- Auto-cleanup and memory management
- Real-time statistics and monitoring

## 🐳 Docker Setup

### Service Profiles
- **dev** (default): Frontend + API + PostgreSQL (development mode)
- **prod**: Frontend + API + PostgreSQL + Nginx (production mode)
- **test**: Frontend tests + API tests + Test PostgreSQL

### Commands
```bash
# Development (default - no profile needed)
docker-compose up -d

# Production
docker-compose --profile prod up -d

# Testing
docker-compose --profile test up -d

# Stop all services
docker-compose down

# Rebuild services
docker-compose build --no-cache

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

## ⚙️ Environment Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment |
| `PORT` | `3000` | API server port |
| `DB_HOST` | `postgres` | Database host |
| `DB_PORT` | `5435` | Database port |
| `DB_NAME` | `doc_insight` | Database name |
| `DB_USER` | `postgres` | Database username |
| `DB_PASSWORD` | `password` | Database password |
| `JWT_SECRET` | `your_secret_key` | JWT signing secret |
| `JWT_EXPIRATION` | `1h` | JWT token expiration |
| `JWT_REFRESH_SECRET` | `your_refresh_secret_key` | Refresh token secret |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token expiration |
| `USE_MOCK_INGESTION` | `true` | Use mock service for development |
| `PYTHON_SERVICE_URL` | `http://localhost:8000` | Python RAG service URL |
| `MAX_FILE_SIZE` | `10485760` | Max file size (10MB) |
| `UPLOAD_PATH` | `./uploads` | Upload directory |
| `ALLOWED_FILE_TYPES` | `pdf,doc,docx,txt,md` | Allowed file types |

### Environment-Specific Examples

**Development**:
```bash
NODE_ENV=development
USE_MOCK_INGESTION=true
LOG_LEVEL=debug
```

**Production**:
```bash
NODE_ENV=production
USE_MOCK_INGESTION=false
PYTHON_SERVICE_URL=https://your-python-service.com
JWT_SECRET=your_very_secure_jwt_secret_key_here
```

**Testing**:
```bash
NODE_ENV=test
USE_MOCK_INGESTION=true
MOCK_INGESTION_FAILURE_RATE=0.0
LOG_LEVEL=error
```

## 🗄️ Database Management

### Automatic Setup
The application automatically:
- ✅ **Runs SQL migrations** on startup
- ✅ **Waits for database** to be ready
- ✅ **Idempotent operations** - safe to run multiple times
- ✅ **No manual setup** required

### Manual Migration (if needed)
```bash
# Run migrations (Linux/Mac)
npm run db:migrate

# Run migrations (Windows)
npm run db:migrate:win

# Manual execution
./bin/migrate.sh  # Linux/Mac
bin\migrate.bat   # Windows
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin, Editor, Viewer roles
- **Input Validation**: Comprehensive input validation
- **File Upload Security**: Type validation, size limits, path traversal prevention
- **Rate Limiting**: Configurable request rate limits
- **Security Headers**: Helmet middleware for security headers
- **Password Security**: Bcrypt hashing with configurable rounds

## 🚨 Troubleshooting

### Common Issues

**Port Conflicts**:
```bash
# Check port usage
netstat -tulpn | grep :3000

# Windows alternative
netstat -an | findstr :3000
```

**Database Connection Issues**:
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready

# Check environment variables
docker-compose exec api-backend env | grep DATABASE

# Test database connection
docker-compose exec api-backend npm run db:test
```

**Service Won't Start**:
```bash
# Check logs
docker-compose logs service-name

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up

# Check Docker resources
docker system df
docker system prune
```

**Test Failures**:
```bash
# Check specific test output
npm test -- --include="**/specific-test.spec.ts" --verbose

# Run tests with coverage to identify issues
npm run test:coverage

# Debug specific test
npm test -- --include="**/auth.service.spec.ts" --verbose --no-coverage
```

**Authentication Issues**:
```bash
# Check JWT configuration
docker-compose exec api-backend env | grep JWT

# Verify token generation
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@docinsight.com","password":"Admin123!"}'
```

**File Upload Issues**:
```bash
# Check upload directory permissions
docker-compose exec api-backend ls -la uploads/

# Check file size limits
docker-compose exec api-backend env | grep MAX_FILE_SIZE
```

### Debug Mode
```bash
# Backend debug
LOG_LEVEL=debug npm run dev

# View logs
docker-compose logs -f api-backend

# Frontend debug
cd doc-insight-portal
ng serve --verbose

# Database debug
docker-compose exec postgres psql -U postgres -d doc_insight -c "\dt"
```

### Test Troubleshooting

#### Common Test Issues

1. **Mock not working** - Ensure mocks are properly configured and reset
2. **Test timeouts** - Check for async operations not being awaited
3. **Coverage gaps** - Review uncovered code paths
4. **Flaky tests** - Ensure proper test isolation and cleanup

#### Debug Mode for Tests
```bash
# Run tests in debug mode for detailed output
DEBUG=* npm test

# Run specific test with debug
DEBUG=* npm test -- --include="**/auth.service.spec.ts"
```

#### Coverage Analysis
```bash
# Generate detailed coverage reports
npm run test:coverage

# View coverage in browser (Linux/Mac)
open coverage/lcov-report/index.html

# Windows alternative
start coverage/lcov-report/index.html
```

### Performance Issues

**Slow Startup**:
```bash
# Check Docker resources
docker stats

# Optimize Docker build
docker-compose build --parallel

# Use Docker BuildKit
DOCKER_BUILDKIT=1 docker-compose build
```

**Memory Issues**:
```bash
# Check memory usage
docker stats --no-stream

# Increase Docker memory limits
# Edit Docker Desktop settings -> Resources -> Memory
```

### Network Issues

**Connection Refused**:
```bash
# Check if services are running
docker-compose ps

# Check port bindings
docker-compose port api-backend 3000
docker-compose port frontend-portal 80
```

**CORS Issues**:
```bash
# Check CORS configuration
docker-compose exec api-backend env | grep CORS

# Test API directly
curl -H "Origin: http://localhost:80" http://localhost:3000/api/health
```

## 🔧 Development

### Individual Service Development

**Backend API Only**:
```bash
cd doc-insight-api
npm install
cp env.example .env
npm run dev
```

**Frontend Only**:
```bash
cd doc-insight-portal
npm install
ng serve
```

### Code Quality
```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run build
```

## 📊 Monitoring

### Health Checks
```bash
# API health
curl http://localhost:3000/health

# Service status
docker-compose ps

# View logs
docker-compose logs -f
```

## 🚀 Production Deployment

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
JWT_SECRET=your_production_secret
DB_PASSWORD=strong_production_password
USE_MOCK_INGESTION=false
```

### Docker Production
```bash
# Start production mode
docker-compose --profile production up -d
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository** and clone your fork
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the coding standards
4. **Add tests** for new functionality (aim for 70%+ coverage)
5. **Run the test suite** to ensure everything passes:
   ```bash
   # Backend tests
   cd doc-insight-api
   npm test
   npm run test:coverage
   
   # Frontend tests
   cd doc-insight-portal
   npm test
   npm run test:coverage
   ```
6. **Lint and format** your code:
   ```bash
   npm run lint
   npm run lint:fix
   ```
7. **Commit your changes** with descriptive messages
8. **Submit a pull request** with a clear description

### Code Quality Standards

- **TypeScript**: Use strict typing, avoid `any`
- **Testing**: Write unit tests for new features
- **Documentation**: Update README and inline comments
- **Security**: Follow security best practices
- **Performance**: Consider performance implications

### Test Requirements

When adding new functionality:

1. **Unit Tests**: Test individual functions/components
2. **Integration Tests**: Test API endpoints and workflows
3. **Error Handling**: Test error scenarios and edge cases
4. **Coverage**: Maintain 70%+ test coverage
5. **Mocking**: Use appropriate mocks for external dependencies

### Pull Request Guidelines

- **Clear Description**: Explain what changes were made and why
- **Testing**: Include test results and coverage reports
- **Screenshots**: For UI changes, include before/after screenshots
- **Breaking Changes**: Clearly mark any breaking changes
- **Documentation**: Update relevant documentation

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: At least one team member reviews the code
3. **Testing**: Manual testing of new features
4. **Approval**: Maintainer approval required for merge

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check individual service README files
- **Issues**: Create an issue in the repository
- **Health Check**: Visit http://localhost:3000/health when running

---

**Built with ❤️ for scalable document management applications**