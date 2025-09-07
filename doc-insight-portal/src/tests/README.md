# UI Test Suite

This directory contains comprehensive tests for the Doc Insight Portal UI components, services, guards, and interceptors.

## Test Structure

```
tests/
├── components/           # Component unit tests
│   ├── auth/            # Authentication components
│   │   ├── login.component.spec.ts
│   │   └── signup.component.spec.ts
│   ├── dashboard/       # Dashboard components
│   │   └── dashboard.component.spec.ts
│   ├── document-upload/ # Document upload components
│   │   └── document-upload.component.spec.ts
│   ├── header/          # Header component
│   │   └── header.component.spec.ts
│   └── sidebar/         # Sidebar component
│       └── sidebar.component.spec.ts
├── services/            # Service unit tests
│   ├── auth.service.spec.ts
│   └── dashboard.service.spec.ts
├── guards/              # Guard unit tests
│   ├── auth.guard.spec.ts
│   └── admin.guard.spec.ts
├── interceptors/        # Interceptor unit tests
│   └── auth.interceptor.spec.ts
├── integration/         # Integration tests
│   └── dashboard-integration.spec.ts
├── test-setup.ts        # Test configuration and utilities
└── README.md           # This file
```

## Test Categories

### 1. Component Tests
- **Authentication Components**: Tests for login and signup forms, validation, and user interactions
- **Dashboard Components**: Tests for dashboard statistics, navigation, and data display
- **Document Upload**: Tests for file upload functionality, validation, and error handling
- **Layout Components**: Tests for header, sidebar, and navigation components

### 2. Service Tests
- **AuthService**: Tests for authentication, token management, and user state
- **DashboardService**: Tests for data fetching and statistics aggregation
- **Other Services**: Tests for document, ingestion, QA, and user services

### 3. Guard Tests
- **AuthGuard**: Tests for route protection and authentication checks
- **AdminGuard**: Tests for admin-only route protection

### 4. Interceptor Tests
- **AuthInterceptor**: Tests for token injection, refresh handling, and error management

### 5. Integration Tests
- **Component Integration**: Tests for component interactions and service integration
- **End-to-End Scenarios**: Tests for complete user workflows

## Test Features

### Mocking and Stubbing
- Comprehensive mocking of Angular services
- HTTP client testing with `HttpClientTestingModule`
- Router and navigation mocking
- Local storage and session storage mocking

### Test Utilities
- Custom Jasmine matchers for authentication testing
- Helper functions for creating mock data
- Global test setup and teardown
- Browser API mocking (ResizeObserver, IntersectionObserver, etc.)

### Coverage Areas
- **Unit Tests**: Individual component and service functionality
- **Integration Tests**: Component interactions and data flow
- **Error Handling**: Error scenarios and edge cases
- **User Interactions**: Form submissions, navigation, and UI interactions
- **State Management**: Authentication state and data persistence

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Run component tests only
npm test -- --include="**/components/**/*.spec.ts"

# Run service tests only
npm test -- --include="**/services/**/*.spec.ts"

# Run integration tests only
npm test -- --include="**/integration/**/*.spec.ts"
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

## Test Configuration

The test setup includes:
- Angular testing environment initialization
- Custom matchers for authentication testing
- Mock implementations for browser APIs
- Helper functions for creating test data
- Global cleanup after each test

## Best Practices

### Test Organization
- One test file per component/service
- Descriptive test names that explain the scenario
- Group related tests using `describe` blocks
- Use `beforeEach` and `afterEach` for setup and cleanup

### Mocking Strategy
- Mock external dependencies
- Use spies for method calls
- Provide realistic mock data
- Test both success and error scenarios

### Assertions
- Test both positive and negative cases
- Verify method calls and parameters
- Check component state changes
- Validate error handling

### Coverage Goals
- Aim for 80%+ code coverage
- Focus on critical user paths
- Test error scenarios and edge cases
- Include integration tests for complex workflows

## Adding New Tests

### For New Components
1. Create a new `.spec.ts` file in the appropriate directory
2. Import necessary testing utilities
3. Set up component testing module
4. Write tests for component initialization, user interactions, and data binding
5. Test error scenarios and edge cases

### For New Services
1. Create a new `.spec.ts` file in the services directory
2. Use `HttpClientTestingModule` for HTTP testing
3. Mock dependencies and external services
4. Test all public methods and error handling
5. Verify service state management

### For New Guards/Interceptors
1. Create a new `.spec.ts` file in the appropriate directory
2. Mock the services they depend on
3. Test all code paths and conditions
4. Verify proper navigation and error handling

## Debugging Tests

### Common Issues
- **Import Errors**: Ensure all dependencies are properly imported
- **Mock Issues**: Verify mock setup and return values
- **Async Issues**: Use proper async testing patterns
- **Component Issues**: Check component initialization and fixture setup

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

Tests are designed to run in CI environments with:
- Headless browser support
- No external dependencies
- Deterministic test data
- Proper cleanup and teardown

## Maintenance

### Regular Tasks
- Update tests when adding new features
- Refactor tests when changing component structure
- Review and update mock data
- Monitor test performance and coverage

### Test Data Management
- Use helper functions for creating test data
- Keep mock data realistic and up-to-date
- Avoid hardcoded values in tests
- Use constants for repeated test data
