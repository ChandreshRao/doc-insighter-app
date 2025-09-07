# Doc Insight Application

A comprehensive document management application with Angular frontend and Node.js API backend using PostgreSQL for data storage and built-in mock ingestion service for development and testing.

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
                       │   Port: 5432     │
                       └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- At least 8GB RAM and 10GB disk space

### 1. Clone and Setup
```bash
git clone <repository-url>
cd doc-insighter-app
cp env.example .env
```

### 2. Start All Services
```bash
# Start all services (recommended)
docker-compose up

# Or use helper scripts
./docker-start.ps1 core          # Windows PowerShell
./docker-start.bat core          # Windows CMD
```

### 3. Access the Application
- **Frontend**: http://localhost:80
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 4. Default Login Credentials
- **Admin**: admin@docinsight.com / Admin123!
- **Editor**: editor@docinsight.com / Editor123!
- **Viewer**: viewer@docinsight.com / Viewer123!

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
- 70%+ test coverage requirement

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

### Quick Start
```bash
# 1. Clone and setup
git clone <repository-url>
cd doc-insighter-app
cp env.example .env

# 2. Start development environment
docker-compose up -d

# 3. Access application
# Frontend: http://localhost:4200
# Backend API: http://localhost:3000
# Database: localhost:5435
```

### Automatic Database Setup
The application automatically:
- ✅ **Runs SQL migrations** on startup (creates tables, indexes, initial data)
- ✅ **Waits for database** to be ready before starting
- ✅ **Idempotent operations** - safe to run multiple times
- ✅ **No manual setup** - everything happens automatically

## ⚙️ Environment Configuration

### Consolidated Environment (.env)
The application uses a single `.env` file at the root with clear segregation between frontend and backend configurations:

```bash
# Copy the example file
cp env.example .env

# Edit with your configuration
nano .env
```

### Key Configuration Sections:
- **Frontend Configuration**: Angular portal URLs and settings
- **Backend Configuration**: Node.js API server settings
- **Database Configuration**: PostgreSQL connection settings
- **Authentication**: JWT and security settings
- **File Upload**: Document upload settings
- **Ingestion Service**: Mock and Python service settings
- **Logging**: Application logging configuration

### Required Variables:
```bash
# Authentication (Required)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Database (Required)
DB_PASSWORD=your-secure-password
POSTGRES_PASSWORD=your-secure-password

# Application URLs (Required for production)
API_URL=https://api.yourdomain.com/api
FRONTEND_URL=https://yourdomain.com
```

### Frontend Environment
Configuration is handled through Angular environment files:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

## 🗄️ Database Management

### Migration System
The project uses SQL scripts instead of Knex for database management:

```bash
# Run migrations (Linux/Mac)
npm run db:migrate

# Run migrations (Windows)
npm run db:migrate:win

# Manual execution
./bin/migrate.sh  # Linux/Mac
bin\migrate.bat   # Windows
```

### Database Schema
- **Users**: Authentication, roles, and user management
- **Documents**: File metadata and processing status
- **Ingestion Jobs**: Processing job tracking and status
- **User Sessions**: JWT token management

## 🧪 Testing

### Backend Testing
```bash
# All tests
npm test

# Specific test suites
npm run test:auth          # Authentication tests
npm run test:users         # User management tests
npm run test:integration   # Integration tests
npm run test:coverage      # Coverage report
```

### Frontend Testing
```bash
# Unit tests
ng test

# E2E tests
ng e2e

# Test coverage
ng test --code-coverage
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin, Editor, Viewer roles
- **Input Validation**: Comprehensive input validation with Joi
- **File Upload Security**: Type validation, size limits, path traversal prevention
- **Rate Limiting**: Configurable request rate limits
- **Security Headers**: Helmet middleware for security headers
- **Password Security**: Bcrypt hashing with configurable rounds

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready

# Check environment variables
docker-compose exec api-backend env | grep DATABASE
```

#### Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Debug Mode
```bash
# Backend debug
LOG_LEVEL=debug npm run dev

# View logs
docker-compose logs -f api-backend
```

## 🔧 Development

### Individual Service Development

#### Backend API Only
```bash
cd doc-insight-api
npm install
cp env.example .env
npm run dev
```

#### Frontend Only
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

### Logging
- Winston-based structured logging
- File rotation and multiple log levels
- Security event tracking
- Performance metrics

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

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (70%+ coverage)
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check individual service README files
- **Issues**: Create an issue in the repository
- **Health Check**: Visit http://localhost:3000/health when running

---

**Built with ❤️ for scalable document management applications**