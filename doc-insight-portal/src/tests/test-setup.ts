import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Global test utilities and mocks
declare global {
  namespace jasmine {
    interface Matchers<T> {
      toHaveBeenCalledWithAuth(): boolean;
    }
  }
}

// Custom matchers for testing
beforeEach(() => {
  jasmine.addMatchers({
    toHaveBeenCalledWithAuth: () => ({
      compare: (actual: jasmine.Spy, expected: any) => {
        const result = {
          pass: actual.calls.any().args.some((call: any[]) => 
            call.some((arg: any) => 
              typeof arg === 'object' && 
              arg !== null && 
              'email' in arg && 'password' in arg
            )
          ),
          message: ''
        };
        
        if (result.pass) {
          result.message = 'Expected spy not to have been called with auth credentials';
        } else {
          result.message = 'Expected spy to have been called with auth credentials';
        }
        
        return result;
      }
    })
  });
});

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:4200',
    origin: 'http://localhost:4200',
    protocol: 'http:',
    host: 'localhost:4200',
    hostname: 'localhost',
    port: '4200',
    pathname: '/',
    search: '',
    hash: '',
    assign: jasmine.createSpy('assign'),
    replace: jasmine.createSpy('replace'),
    reload: jasmine.createSpy('reload')
  },
  writable: true
});

// Mock window.innerWidth and window.innerHeight
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jasmine.createSpy('matchMedia').and.returnValue({
    matches: false,
    media: '',
    onchange: null,
    addListener: jasmine.createSpy('addListener'),
    removeListener: jasmine.createSpy('removeListener'),
    addEventListener: jasmine.createSpy('addEventListener'),
    removeEventListener: jasmine.createSpy('removeEventListener'),
    dispatchEvent: jasmine.createSpy('dispatchEvent')
  })
});

// Helper functions for testing
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: '1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'user',
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides
});

export const createMockAuthResponse = (user: any = createMockUser()) => ({
  success: true,
  data: {
    user,
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600
  },
  message: 'Success',
  timestamp: new Date().toISOString()
});

export const createMockDashboardStats = (overrides: Partial<any> = {}) => ({
  totalDocuments: 10,
  processingStatus: 'Idle',
  questionsAsked: 5,
  activeUsers: 3,
  ...overrides
});

export const createMockDocument = (overrides: Partial<any> = {}) => ({
  id: '1',
  name: 'test.pdf',
  filename: 'test.pdf',
  size: 1024,
  type: 'application/pdf',
  status: 'pending',
  uploadedAt: new Date(),
  uploadedBy: '1',
  description: 'Test document',
  ...overrides
});

// Clean up after each test
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
