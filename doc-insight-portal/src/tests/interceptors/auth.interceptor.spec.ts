import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthInterceptor } from '../../app/interceptors/auth.interceptor';
import { AuthService } from '../../app/services/auth.service';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'refreshToken', 'logout'], {
      isAuthenticated$: of(true)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add authorization header to requests', () => {
    mockAuthService.getToken.and.returnValue('mock-token');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeTruthy();
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
  });

  it('should not add authorization header when no token', () => {
    mockAuthService.getToken.and.returnValue(null);

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeFalsy();
  });

  it('should not add authorization header to auth endpoints', () => {
    mockAuthService.getToken.and.returnValue('mock-token');

    http.post('/api/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalsy();
  });

  it('should handle 401 errors by attempting token refresh', () => {
    mockAuthService.getToken.and.returnValue('mock-token');
    mockAuthService.refreshToken.and.returnValue(of({
      success: true,
      data: {
        user: {} as any,
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600
      },
      message: 'Token refreshed',
      timestamp: new Date().toISOString()
    }));

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // Should retry the request with new token
    const retryReq = httpMock.expectOne('/api/test');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({ success: true });
  });

  it('should logout user when token refresh fails', () => {
    mockAuthService.getToken.and.returnValue('mock-token');
    mockAuthService.refreshToken.and.returnValue(throwError(() => new Error('Refresh failed')));

    http.get('/api/test').subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error).toBeDefined();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should handle multiple concurrent 401 errors', () => {
    mockAuthService.getToken.and.returnValue('mock-token');
    mockAuthService.refreshToken.and.returnValue(of({
      success: true,
      data: {
        user: {} as any,
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600
      },
      message: 'Token refreshed',
      timestamp: new Date().toISOString()
    }));

    // Make multiple concurrent requests
    http.get('/api/test1').subscribe();
    http.get('/api/test2').subscribe();

    const req1 = httpMock.expectOne('/api/test1');
    const req2 = httpMock.expectOne('/api/test2');

    // Both should fail with 401
    req1.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    req2.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // Both should be retried with new token
    const retryReq1 = httpMock.expectOne('/api/test1');
    const retryReq2 = httpMock.expectOne('/api/test2');

    expect(retryReq1.request.headers.get('Authorization')).toBe('Bearer new-token');
    expect(retryReq2.request.headers.get('Authorization')).toBe('Bearer new-token');

    retryReq1.flush({ success: true });
    retryReq2.flush({ success: true });
  });

  it('should not retry requests that are not 401 errors', () => {
    mockAuthService.getToken.and.returnValue('mock-token');

    http.get('/api/test').subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error).toBeDefined();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    // Should not retry
    httpMock.expectNone('/api/test');
  });

  it('should handle network errors', () => {
    mockAuthService.getToken.and.returnValue('mock-token');

    http.get('/api/test').subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error).toBeDefined();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.error(new ErrorEvent('Network error'));
  });

  it('should add token to retry requests after refresh', () => {
    mockAuthService.getToken.and.returnValue('mock-token');
    mockAuthService.refreshToken.and.returnValue(of({
      success: true,
      data: {
        user: {} as any,
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600
      },
      message: 'Token refreshed',
      timestamp: new Date().toISOString()
    }));

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const retryReq = httpMock.expectOne('/api/test');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({ success: true });
  });

  it('should handle refresh token response without new refresh token', () => {
    mockAuthService.getToken.and.returnValue('mock-token');
    mockAuthService.refreshToken.and.returnValue(of({
      success: true,
      data: {
        user: {} as any,
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600
      },
      message: 'Token refreshed',
      timestamp: new Date().toISOString()
    }));

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const retryReq = httpMock.expectOne('/api/test');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({ success: true });
  });
});
