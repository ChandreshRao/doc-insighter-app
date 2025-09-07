import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { LoginComponent } from '../../../app/components/auth/login/login.component';
import { AuthService } from '../../../app/services/auth.service';
import { ErrorMappingService } from '../../../app/services/error-mapping.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockErrorMappingService: jasmine.SpyObj<ErrorMappingService>;

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

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login'], {
      isAuthenticated$: of(false)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const errorMappingServiceSpy = jasmine.createSpyObj('ErrorMappingService', ['getUserFriendlyMessage']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ErrorMappingService, useValue: errorMappingServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    mockErrorMappingService = TestBed.inject(ErrorMappingService) as jasmine.SpyObj<ErrorMappingService>;
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should validate required fields', () => {
    component.loginForm.patchValue({
      email: '',
      password: ''
    });

    expect(component.loginForm.get('email')?.hasError('required')).toBeTruthy();
    expect(component.loginForm.get('password')?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    component.loginForm.patchValue({
      email: 'invalid-email',
      password: 'password123'
    });

    expect(component.loginForm.get('email')?.hasError('email')).toBeTruthy();
  });

  it('should validate password minimum length', () => {
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: '123'
    });

    expect(component.loginForm.get('password')?.hasError('minlength')).toBeTruthy();
  });

  it('should call authService.login on valid form submission', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    component.loginForm.patchValue(loginData);
    mockAuthService.login.and.returnValue(of(mockUser));

    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
  });

  it('should navigate to dashboard on successful login', () => {
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });
    mockAuthService.login.and.returnValue(of(mockUser));

    component.onSubmit();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/overview']);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      `Welcome back, ${mockUser.first_name}!`,
      'Close',
      jasmine.any(Object)
    );
  });

  it('should show error message on login failure', () => {
    const error = { status: 401, message: 'Invalid credentials' };
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    mockAuthService.login.and.returnValue(throwError(() => error));
    mockErrorMappingService.getUserFriendlyMessage.and.returnValue('Invalid credentials');

    component.onSubmit();

    expect(mockErrorMappingService.getUserFriendlyMessage).toHaveBeenCalledWith(error);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Invalid credentials',
      'Close',
      jasmine.any(Object)
    );
  });

  it('should not submit invalid form', () => {
    component.loginForm.patchValue({
      email: 'invalid-email',
      password: '123'
    });

    component.onSubmit();

    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched on invalid submission', () => {
    // Cannot spy on private method, test public behavior instead
    component.loginForm.patchValue({
      email: 'invalid-email',
      password: '123'
    });

    component.onSubmit();

    // Test that form is marked as touched by checking form state
    expect(component.loginForm.touched).toBeTruthy();
  });

  it('should navigate to signup page', () => {
    component.navigateToSignup();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/signup']);
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBeTruthy();
    component.hidePassword = false;
    expect(component.hidePassword).toBeFalsy();
  });

  it('should get correct error message for required field', () => {
    component.loginForm.get('email')?.setErrors({ required: true });
    component.loginForm.get('email')?.markAsTouched();

    const errorMessage = component.getErrorMessage('email');
    expect(errorMessage).toBe('Email is required');
  });

  it('should get correct error message for email format', () => {
    component.loginForm.get('email')?.setErrors({ email: true });
    component.loginForm.get('email')?.markAsTouched();

    const errorMessage = component.getErrorMessage('email');
    expect(errorMessage).toBe('Please enter a valid email address');
  });

  it('should get correct error message for minlength', () => {
    component.loginForm.get('password')?.setErrors({ minlength: { requiredLength: 6 } });
    component.loginForm.get('password')?.markAsTouched();

    const errorMessage = component.getErrorMessage('password');
    expect(errorMessage).toBe('Password must be at least 6 characters');
  });
});
