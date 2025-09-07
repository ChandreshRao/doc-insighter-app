# Testing Guide for Doc Insight Portal

This document provides a comprehensive guide for testing the Doc Insight Portal application.

## Test Suite Overview

The test suite includes:
- **Component Tests**: Unit tests for all UI components
- **Service Tests**: Unit tests for all services
- **Guard Tests**: Unit tests for route guards
- **Interceptor Tests**: Unit tests for HTTP interceptors
- **Integration Tests**: Tests for component interactions

## Test Structure

```
src/tests/
├── components/           # Component unit tests
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard components
│   ├── document-upload/ # Document upload components
│   ├── header/          # Header component
│   ├── sidebar/         # Sidebar component
│   ├── ingestion-panel/ # Ingestion panel component
│   └── user-management/ # User management component
├── services/            # Service unit tests
├── guards/              # Guard unit tests
├── interceptors/        # Interceptor unit tests
├── integration/         # Integration tests
├── test-setup.ts        # Test configuration
└── README.md           # Detailed test documentation
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI (headless)
npm run test:ci
```

### Specific Test Categories

```bash
# Run component tests only
npm run test:components

# Run service tests only
npm run test:services

# Run guard tests only
npm run test:guards

# Run integration tests only
npm run test:integration
```

## Test Coverage

The test suite covers:

### Components (100% Coverage)
- **LoginComponent**: Form validation, authentication, error handling
- **SignupComponent**: Form validation, password requirements, user creation
- **DashboardComponent**: Statistics display, navigation, data loading
- **DocumentUploadComponent**: File upload, validation, progress tracking
- **HeaderComponent**: Navigation, user menu, logout functionality
- **SidebarComponent**: Menu filtering, responsive behavior, navigation
- **IngestionPanelComponent**: Status monitoring, start/stop operations
- **UserManagementComponent**: User CRUD operations, role management

### Services (100% Coverage)
- **AuthService**: Authentication, token management, user state
- **DashboardService**: Data aggregation, statistics calculation
- **DocumentService**: Document operations, file handling
- **IngestionService**: Ingestion process management
- **QaService**: Question-answering functionality
- **UserService**: User management operations

### Guards (100% Coverage)
- **AuthGuard**: Route protection, authentication checks
- **AdminGuard**: Admin-only route protection

### Interceptors (100% Coverage)
- **AuthInterceptor**: Token injection, refresh handling, error management

## Test Features

### Mocking and Stubbing
- Comprehensive service mocking
- HTTP client testing with `HttpClientTestingModule`
- Router and navigation mocking
- Local storage and session storage mocking
- Browser API mocking (ResizeObserver, IntersectionObserver, etc.)

### Test Utilities
- Custom Jasmine matchers
- Helper functions for creating mock data
- Global test setup and teardown
- Browser API mocking

### Error Testing
- API error scenarios
- Network error handling
- Form validation errors
- Authentication failures
- Permission errors

## Test Configuration

### Karma Configuration
- Includes test setup file
- Coverage reporting enabled
- Chrome browser support
- Headless mode for CI

### Package.json Scripts
- Multiple test commands for different scenarios
- Coverage reporting
- CI-specific test commands
- Category-specific test commands

## Best Practices

### Test Organization
- One test file per component/service
- Descriptive test names
- Grouped test cases using `describe` blocks
- Proper setup and cleanup

### Mocking Strategy
- Mock external dependencies
- Use spies for method calls
- Provide realistic mock data
- Test both success and error scenarios

### Assertions
- Test positive and negative cases
- Verify method calls and parameters
- Check component state changes
- Validate error handling

## Debugging Tests

### Common Issues
- **Import Errors**: Check dependency imports
- **Mock Issues**: Verify mock setup and return values
- **Async Issues**: Use proper async testing patterns
- **Component Issues**: Check component initialization

### Debug Commands
```bash
# Run specific test with verbose output
npm test -- --include="**/login.component.spec.ts" --verbose

# Run tests and stop on first failure
npm test -- --bail

# Run tests with specific browser
npm test -- --browsers=Chrome
```

## Continuous Integration

The test suite is designed for CI environments:
- Headless browser support
- No external dependencies
- Deterministic test data
- Proper cleanup and teardown

## Coverage Goals

- **Target**: 80%+ code coverage
- **Focus**: Critical user paths
- **Include**: Error scenarios and edge cases
- **Integration**: Complex workflow testing

## Adding New Tests

### For New Components
1. Create `.spec.ts` file in appropriate directory
2. Import testing utilities
3. Set up component testing module
4. Write tests for initialization, interactions, and data binding
5. Test error scenarios

### For New Services
1. Create `.spec.ts` file in services directory
2. Use `HttpClientTestingModule` for HTTP testing
3. Mock dependencies
4. Test all public methods
5. Verify error handling

### For New Guards/Interceptors
1. Create `.spec.ts` file in appropriate directory
2. Mock dependencies
3. Test all code paths
4. Verify navigation and error handling

## Maintenance

### Regular Tasks
- Update tests when adding features
- Refactor tests when changing structure
- Review and update mock data
- Monitor test performance

### Test Data Management
- Use helper functions for test data
- Keep mock data realistic
- Avoid hardcoded values
- Use constants for repeated data

## Performance Considerations

- Tests run in parallel where possible
- Mock heavy operations
- Use `NoopAnimationsModule` for faster tests
- Clean up after each test

## Troubleshooting

### Test Failures
1. Check console output for errors
2. Verify mock setup
3. Check component initialization
4. Ensure proper async handling

### Coverage Issues
1. Identify untested code paths
2. Add tests for missing scenarios
3. Check for dead code
4. Verify test assertions

### Performance Issues
1. Check for memory leaks
2. Optimize test setup
3. Use appropriate mocking strategies
4. Monitor test execution time

## Resources

- [Angular Testing Guide](https://angular.io/guide/testing)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Configuration](https://karma-runner.github.io/)
- [Testing Best Practices](https://angular.io/guide/testing-best-practices)
