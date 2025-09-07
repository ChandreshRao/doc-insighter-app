# Authentication & Authorization Test Suite

This directory contains comprehensive tests for the authentication and authorization system of the Doc Insight API.

## Test Structure

### Core Test Files

1. **`authService.test.ts`** - Tests for the core authentication service
   - User registration
   - User login/logout
   - Token refresh
   - User management operations
   - Password management

2. **`authRoutes.test.ts`** - Tests for authentication API endpoints
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/logout
   - POST /api/auth/refresh
   - GET /api/auth/me
   - PUT /api/auth/profile
   - POST /api/auth/change-password
   - POST /api/auth/verify-email

3. **`userRoutes.test.ts`** - Tests for user management API endpoints
   - GET /api/users (admin only)
   - GET /api/users/:id
   - POST /api/users (admin only)
   - PUT /api/users/:id (admin only)
   - DELETE /api/users/:id (admin only)
   - POST /api/users/:id/activate (admin only)
   - POST /api/users/:id/deactivate (admin only)
   - GET /api/users/:id/documents
   - GET /api/users/stats/overview (admin only)

4. **`authMiddleware.test.ts`** - Tests for authentication and authorization middleware
   - Token authentication
   - Role-based access control
   - Permission validation
   - Optional authentication

5. **`rolePermissions.test.ts`** - Tests for role-based permissions
   - Role hierarchy validation
   - Permission matrix testing
   - Access control scenarios
   - Edge cases and error handling

6. **`authIntegration.test.ts`** - End-to-end integration tests
   - Complete authentication flows
   - Cross-service interactions
   - Error handling scenarios
   - Role-based access patterns

### Supporting Files

- **`setup.ts`** - Test configuration and utilities
- **`runTests.ts`** - Comprehensive test runner script
- **`README.md`** - This documentation

## Running Tests

### Individual Test Suites

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:auth          # Authentication tests
npm run test:users         # User management tests
npm run test:roles         # Role permissions tests
npm run test:integration   # Integration tests

# Run with coverage
npm run test:coverage
```

### Comprehensive Testing

```bash
# Run all tests with coverage, linting, and type checking
npm run test:comprehensive

# Run all tests with coverage only
npm run test:all

# Run individual test file
npx jest src/tests/authService.test.ts
```

### Test Runner Script

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

## Test Coverage

The test suite aims for comprehensive coverage of:

- **Authentication flows** (registration, login, logout, token refresh)
- **Authorization mechanisms** (role-based access control, permissions)
- **API endpoints** (all auth and user management routes)
- **Middleware functions** (authentication, authorization, validation)
- **Error handling** (invalid inputs, unauthorized access, service errors)
- **Edge cases** (malformed data, missing tokens, expired sessions)

### Coverage Thresholds

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

## Test Data and Mocking

### Mock Strategy

The tests use comprehensive mocking to isolate units under test:

- **Database operations** - Mocked using Jest mocks
- **External services** - Mocked to avoid dependencies
- **Authentication utilities** - Mocked for predictable behavior
- **HTTP requests** - Tested using Supertest

### Test Utilities

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

## Role-Based Testing

### Role Hierarchy

The system implements a three-tier role hierarchy:

1. **Admin** (level 3) - Full access to all operations
2. **Editor** (level 2) - Can manage documents and view users
3. **Viewer** (level 1) - Read-only access

### Permission Matrix

| Operation | Admin | Editor | Viewer |
|-----------|-------|--------|--------|
| User Management | ✅ | ❌ | ❌ |
| Document Management | ✅ | ✅ | ❌ |
| View Documents | ✅ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ |
| View Other Profiles | ✅ | ✅ | ❌ |

## Error Scenarios Tested

### Authentication Errors
- Invalid credentials
- Expired tokens
- Missing tokens
- Malformed tokens
- Inactive user accounts

### Authorization Errors
- Insufficient permissions
- Role hierarchy violations
- Self-modification restrictions
- Resource access restrictions

### Validation Errors
- Invalid input data
- Missing required fields
- Format validation failures
- Business rule violations

### Service Errors
- Database connection failures
- External service unavailability
- Network timeouts
- Unexpected errors

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

1. **Linting** - Code quality checks
2. **Type Checking** - TypeScript compilation
3. **Unit Tests** - Individual component testing
4. **Integration Tests** - End-to-end flow testing
5. **Coverage Reporting** - Test coverage analysis

## Best Practices

### Test Organization
- Each test file focuses on a specific component
- Tests are grouped by functionality
- Clear, descriptive test names
- Comprehensive test coverage

### Mock Management
- Mocks are reset between tests
- Realistic mock data
- Proper mock cleanup
- Isolated test environments

### Assertion Strategy
- Specific, meaningful assertions
- Error message validation
- Response structure verification
- Edge case coverage

## Troubleshooting

### Common Issues

1. **Mock not working** - Ensure mocks are properly configured and reset
2. **Test timeouts** - Check for async operations not being awaited
3. **Coverage gaps** - Review uncovered code paths
4. **Flaky tests** - Ensure proper test isolation and cleanup

### Debug Mode

Run tests in debug mode for detailed output:

```bash
DEBUG=* npm test
```

### Coverage Analysis

View detailed coverage reports:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Add appropriate mocks and utilities
3. Ensure comprehensive coverage
4. Update this documentation
5. Run the full test suite before committing

## Test Maintenance

- Review and update tests when changing functionality
- Keep mocks in sync with actual implementations
- Regularly review coverage reports
- Update test data as needed
- Maintain test performance
