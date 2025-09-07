import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthGuard } from '../../app/guards/auth.guard';
import { AuthService } from '../../app/services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'getToken'], {
      isAuthenticated$: of(true)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is authenticated', (done) => {
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockAuthService.getToken.and.returnValue('valid-token');

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeTruthy();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should deny access when user is not authenticated', (done) => {
    mockAuthService.getCurrentUser.and.returnValue(null);
    mockAuthService.getToken.and.returnValue(null);

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      done();
    });
  });

  it('should deny access when token is invalid', (done) => {
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockAuthService.getToken.and.returnValue(null);

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      done();
    });
  });

  it('should deny access when user is inactive', (done) => {
    const inactiveUser = { ...mockUser, is_active: false };
    mockAuthService.getCurrentUser.and.returnValue(inactiveUser);
    mockAuthService.getToken.and.returnValue('valid-token');

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      done();
    });
  });

  it('should handle authentication service errors', (done) => {
    mockAuthService.getCurrentUser.and.throwError('Service error');
    mockAuthService.getToken.and.returnValue('valid-token');

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      done();
    });
  });

  it('should check both user and token for authentication', (done) => {
    // Test with user but no token
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockAuthService.getToken.and.returnValue(null);

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      done();
    });
  });

  it('should allow access only when both user and token are valid', (done) => {
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockAuthService.getToken.and.returnValue('valid-token');

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeTruthy();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      done();
    });
  });
});
