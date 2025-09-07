import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SignupComponent } from '../../../app/components/auth/signup/signup.component';
import { AuthService } from '../../../app/services/auth.service';
import { ErrorMappingService } from '../../../app/services/error-mapping.service';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
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
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['signup'], {
      isAuthenticated$: of(false)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const errorMappingServiceSpy = jasmine.createSpyObj('ErrorMappingService', ['getUserFriendlyMessage']);

    await TestBed.configureTestingModule({
      declarations: [SignupComponent],
      imports: [ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ErrorMappingService, useValue: errorMappingServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
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
    expect(component.signupForm.get('username')?.value).toBe('');
    expect(component.signupForm.get('first_name')?.value).toBe('');
    expect(component.signupForm.get('last_name')?.value).toBe('');
    expect(component.signupForm.get('email')?.value).toBe('');
    expect(component.signupForm.get('password')?.value).toBe('');
    expect(component.signupForm.get('confirmPassword')?.value).toBe('');
  });

  it('should validate required fields', () => {
    component.signupForm.patchValue({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

    expect(component.signupForm.get('username')?.hasError('required')).toBeTruthy();
    expect(component.signupForm.get('first_name')?.hasError('required')).toBeTruthy();
    expect(component.signupForm.get('last_name')?.hasError('required')).toBeTruthy();
    expect(component.signupForm.get('email')?.hasError('required')).toBeTruthy();
    expect(component.signupForm.get('password')?.hasError('required')).toBeTruthy();
    expect(component.signupForm.get('confirmPassword')?.hasError('required')).toBeTruthy();
  });

  it('should validate username pattern', () => {
    component.signupForm.patchValue({
      username: 'invalid-username!',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

    expect(component.signupForm.get('username')?.hasError('pattern')).toBeTruthy();
  });

  it('should validate email format', () => {
    component.signupForm.patchValue({
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      email: 'invalid-email',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

    expect(component.signupForm.get('email')?.hasError('email')).toBeTruthy();
  });

  it('should validate password requirements', () => {
    component.signupForm.patchValue({
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'weak',
      confirmPassword: 'weak'
    });

    expect(component.signupForm.get('password')?.hasError('minlength')).toBeTruthy();
    expect(component.signupForm.get('password')?.hasError('pattern')).toBeTruthy();
  });

  it('should validate password match', () => {
    component.signupForm.patchValue({
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!'
    });

    expect(component.signupForm.hasError('passwordMismatch')).toBeTruthy();
  });

  it('should call authService.signup on valid form submission', () => {
    const signupData = {
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'Password123!'
    };

    component.signupForm.patchValue({
      ...signupData,
      confirmPassword: 'Password123!'
    });
    mockAuthService.signup.and.returnValue(of(mockUser));

    component.onSubmit();

    expect(mockAuthService.signup).toHaveBeenCalledWith(signupData);
  });

  it('should navigate to dashboard on successful signup', () => {
    component.signupForm.patchValue({
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    mockAuthService.signup.and.returnValue(of(mockUser));

    component.onSubmit();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      `Welcome to Doc Insight Portal, ${mockUser.first_name}!`,
      'Close',
      jasmine.any(Object)
    );
  });

  it('should show error message on signup failure', () => {
    const error = { status: 400, message: 'Email already exists' };
    component.signupForm.patchValue({
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    mockAuthService.signup.and.returnValue(throwError(() => error));
    mockErrorMappingService.getUserFriendlyMessage.and.returnValue('Email already exists');

    component.onSubmit();

    expect(mockErrorMappingService.getUserFriendlyMessage).toHaveBeenCalledWith(error);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Email already exists',
      'Close',
      jasmine.any(Object)
    );
  });

  it('should check password requirements correctly', () => {
    component.signupForm.patchValue({ password: 'Password123!' });

    expect(component.hasMinLength()).toBeTruthy();
    expect(component.hasLowercase()).toBeTruthy();
    expect(component.hasUppercase()).toBeTruthy();
    expect(component.hasNumber()).toBeTruthy();
    expect(component.hasSpecialChar()).toBeTruthy();
  });

  it('should navigate to login page', () => {
    component.navigateToLogin();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBeTruthy();
    component.hidePassword = false;
    expect(component.hidePassword).toBeFalsy();
  });

  it('should toggle confirm password visibility', () => {
    expect(component.hideConfirmPassword).toBeTruthy();
    component.hideConfirmPassword = false;
    expect(component.hideConfirmPassword).toBeFalsy();
  });

  it('should get correct error message for required field', () => {
    component.signupForm.get('username')?.setErrors({ required: true });
    component.signupForm.get('username')?.markAsTouched();

    const errorMessage = component.getErrorMessage('username');
    expect(errorMessage).toBe('Username is required');
  });

  it('should get correct error message for pattern validation', () => {
    component.signupForm.get('username')?.setErrors({ pattern: true });
    component.signupForm.get('username')?.markAsTouched();

    const errorMessage = component.getErrorMessage('username');
    expect(errorMessage).toBe('Username must contain only letters and numbers');
  });

  it('should get correct error message for password pattern', () => {
    component.signupForm.get('password')?.setErrors({ pattern: true });
    component.signupForm.get('password')?.markAsTouched();

    const errorMessage = component.getErrorMessage('password');
    expect(errorMessage).toBe('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  });

  it('should get correct error message for password mismatch', () => {
    component.signupForm.setErrors({ passwordMismatch: true });
    component.signupForm.get('confirmPassword')?.markAsTouched();

    const errorMessage = component.getErrorMessage('confirmPassword');
    expect(errorMessage).toBe('Passwords do not match');
  });
});
