import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AdminGuard } from '../../app/guards/admin.guard';
import { AuthService } from '../../app/services/auth.service';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockAdminUser = {
    id: '1',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  const mockRegularUser = {
    id: '2',
    email: 'user@example.com',
    first_name: 'Regular',
    last_name: 'User',
    role: 'user',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin', 'getCurrentUser'], {
      isAuthenticated$: of(true)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AdminGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AdminGuard);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access for admin users', (done) => {
    mockAuthService.isAdmin.and.returnValue(true);
    mockAuthService.getCurrentUser.and.returnValue(mockAdminUser);

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeTruthy();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should deny access for non-admin users', (done) => {
    mockAuthService.isAdmin.and.returnValue(false);
    mockAuthService.getCurrentUser.and.returnValue(mockRegularUser);

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    });
  });

  it('should deny access when no user is logged in', (done) => {
    mockAuthService.isAdmin.and.returnValue(false);
    mockAuthService.getCurrentUser.and.returnValue(null);

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    });
  });

  it('should check isAdmin method for authorization', (done) => {
    mockAuthService.isAdmin.and.returnValue(false);
    mockAuthService.getCurrentUser.and.returnValue(mockAdminUser);

    guard.canActivate().subscribe((result: boolean) => {
      expect(mockAuthService.isAdmin).toHaveBeenCalled();
      expect(result).toBeFalsy();
      done();
    });
  });

  it('should handle different user roles correctly', (done) => {
    // Test editor role
    const editorUser = { ...mockRegularUser, role: 'editor' };
    mockAuthService.getCurrentUser.and.returnValue(editorUser);
    mockAuthService.isAdmin.and.returnValue(false);

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    });
  });

  it('should handle viewer role correctly', (done) => {
    const viewerUser = { ...mockRegularUser, role: 'viewer' };
    mockAuthService.getCurrentUser.and.returnValue(viewerUser);
    mockAuthService.isAdmin.and.returnValue(false);

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    });
  });

  it('should redirect to dashboard for unauthorized access', (done) => {
    mockAuthService.isAdmin.and.returnValue(false);
    mockAuthService.getCurrentUser.and.returnValue(mockRegularUser);

    guard.canActivate().subscribe((result: boolean) => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    });
  });

  it('should handle authentication service errors gracefully', (done) => {
    mockAuthService.isAdmin.and.throwError('Service error');
    mockAuthService.getCurrentUser.and.returnValue(mockAdminUser);

    guard.canActivate().subscribe((result: boolean) => {
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    });
  });
});
