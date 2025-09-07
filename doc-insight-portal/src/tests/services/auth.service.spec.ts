import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService, User, LoginRequest, SignupRequest, AuthResponse } from '../../app/services/auth.service';
import { ConfigService } from '../../app/services/config.service';
import { ErrorMappingService } from '../../app/services/error-mapping.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockErrorMappingService: jasmine.SpyObj<ErrorMappingService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  const mockAuthResponse: AuthResponse = {
    success: true,
    data: {
      user: mockUser,
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600
    },
    message: 'Login successful',
    timestamp: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    const configServiceSpy = jasmine.createSpyObj('ConfigService', ['apiUrl'], {
      apiUrl: 'http://localhost:3000/api'
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const errorMappingServiceSpy = jasmine.createSpyObj('ErrorMappingService', ['getUserFriendlyMessage']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: ConfigService, useValue: configServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ErrorMappingService, useValue: errorMappingServiceSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    mockConfigService = TestBed.inject(ConfigService) as jasmine.SpyObj<ConfigService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockErrorMappingService = TestBed.inject(ErrorMappingService) as jasmine.SpyObj<ErrorMappingService>;
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with no authenticated user', () => {
    service.isAuthenticated$.subscribe((isAuth: boolean) => {
      expect(isAuth).toBeFalsy();
    });
  });

  it('should login successfully', () => {
    const loginRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };

    service.login(loginRequest).subscribe((user: User) => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush(mockAuthResponse);
  });

  it('should handle login error', () => {
    const loginRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const error = { status: 401, message: 'Invalid credentials' };
    mockErrorMappingService.getUserFriendlyMessage.and.returnValue('Invalid credentials');

    service.login(loginRequest).subscribe({
      next: () => fail('Should have failed'),
      error: (err: any) => {
        expect(err).toEqual(error);
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    req.flush(error, { status: 401, statusText: 'Unauthorized' });
  });

  it('should signup successfully', () => {
    const signupRequest: SignupRequest = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'password123'
    };

    service.signup(signupRequest).subscribe((user: User) => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/signup');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(signupRequest);
    req.flush(mockAuthResponse);
  });

  it('should handle signup error', () => {
    const signupRequest: SignupRequest = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'password123'
    };

    const error = { status: 400, message: 'Email already exists' };
    mockErrorMappingService.getUserFriendlyMessage.and.returnValue('Email already exists');

    service.signup(signupRequest).subscribe({
      next: () => fail('Should have failed'),
      error: (err: any) => {
        expect(err).toEqual(error);
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/signup');
    req.flush(error, { status: 400, statusText: 'Bad Request' });
  });

  it('should logout and clear stored data', () => {
    // Set up initial state
    localStorage.setItem('auth_token', 'mock-token');
    localStorage.setItem('refresh_token', 'mock-refresh-token');
    localStorage.setItem('current_user', JSON.stringify(mockUser));

    service.logout();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('current_user')).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should refresh token successfully', () => {
    const refreshToken = 'mock-refresh-token';
    localStorage.setItem('refresh_token', refreshToken);

    service.refreshToken().subscribe((response: any) => {
      expect(response).toEqual(mockAuthResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refresh_token: refreshToken });
    req.flush(mockAuthResponse);
  });

  it('should handle refresh token error', () => {
    const refreshToken = 'invalid-refresh-token';
    localStorage.setItem('refresh_token', refreshToken);

    const error = { status: 401, message: 'Invalid refresh token' };

    service.refreshToken().subscribe({
      next: () => fail('Should have failed'),
      error: (err: any) => {
        expect(err).toEqual(error);
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
    req.flush(error, { status: 401, statusText: 'Unauthorized' });
  });

  it('should get current user', () => {
    localStorage.setItem('current_user', JSON.stringify(mockUser));
    const currentUser = service.getCurrentUser();
    expect(currentUser).toEqual(mockUser);
  });

  it('should return null when no current user', () => {
    const currentUser = service.getCurrentUser();
    expect(currentUser).toBeNull();
  });

  it('should change password successfully', () => {
    const currentPassword = 'oldpassword';
    const newPassword = 'newpassword';

    service.changePassword(currentPassword, newPassword).subscribe((response: any) => {
      expect(response).toBeDefined();
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/change-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      current_password: currentPassword,
      new_password: newPassword
    });
    req.flush({ success: true });
  });

  it('should check if user is admin', () => {
    localStorage.setItem('current_user', JSON.stringify(mockUser));
    expect(service.isAdmin()).toBeFalsy();

    const adminUser = { ...mockUser, role: 'admin' };
    localStorage.setItem('current_user', JSON.stringify(adminUser));
    expect(service.isAdmin()).toBeTruthy();
  });

  it('should get token from localStorage', () => {
    localStorage.setItem('auth_token', 'mock-token');
    expect(service.getToken()).toBe('mock-token');
  });

  it('should return null when no token', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should get refresh token from localStorage', () => {
    localStorage.setItem('refresh_token', 'mock-refresh-token');
    expect(service.getRefreshToken()).toBe('mock-refresh-token');
  });

  it('should return null when no refresh token', () => {
    expect(service.getRefreshToken()).toBeNull();
  });

  it('should emit current user changes', () => {
    let emittedUser: User | null = null;
    service.currentUser$.subscribe((user: User | null) => {
      emittedUser = user;
    });

    // Initially should be null
    expect(emittedUser).toBeNull();

    // Simulate setting a user
    service['setStoredUser'](mockUser);
    expect(emittedUser).not.toBeNull();
    if (emittedUser) {
      expect(emittedUser).toEqual(mockUser);
    }

    // Simulate clearing user
    service['clearStoredUser']();
    expect(emittedUser).toBeNull();
  });

  it('should emit authentication state changes', () => {
    let isAuthenticated = false;
    service.isAuthenticated$.subscribe((auth: boolean) => {
      isAuthenticated = auth;
    });

    // Initially not authenticated
    expect(isAuthenticated).toBeFalsy();

    // Simulate login
    service['setStoredUser'](mockUser);
    expect(isAuthenticated).toBeTruthy();

    // Simulate logout
    service['clearStoredUser']();
    expect(isAuthenticated).toBeFalsy();
  });
});
