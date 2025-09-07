import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { ErrorMappingService } from '../../../services/error-mapping.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private errorMappingService: ErrorMappingService
  ) {
    this.signupForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // Add method to check if passwords match for better UX
  getPasswordMatchError(): string {
    if (this.signupForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  // Add method to check form validity with better debugging
  isFormValid(): boolean {
    const isValid = this.signupForm.valid;
    console.log('Form validation check:', {
      valid: isValid,
      errors: this.signupForm.errors,
      passwordMatchError: this.signupForm.hasError('passwordMismatch'),
      individualFields: {
        username: this.signupForm.get('username')?.valid,
        first_name: this.signupForm.get('first_name')?.valid,
        last_name: this.signupForm.get('last_name')?.valid,
        email: this.signupForm.get('email')?.valid,
        password: this.signupForm.get('password')?.valid,
        confirmPassword: this.signupForm.get('confirmPassword')?.valid
      }
    });
    return isValid;
  }

  // Password requirement check methods
  hasMinLength(): boolean {
    const password = this.signupForm.get('password')?.value;
    return password && password.length >= 8;
  }

  hasLowercase(): boolean {
    const password = this.signupForm.get('password')?.value;
    return password && /[a-z]/.test(password);
  }

  hasUppercase(): boolean {
    const password = this.signupForm.get('password')?.value;
    return password && /[A-Z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.signupForm.get('password')?.value;
    return password && /\d/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.signupForm.get('password')?.value;
    return password && /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.isLoading = true;
      
      const { confirmPassword, ...signupData } = this.signupForm.value;
      
      this.authService.signup(signupData).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.snackBar.open(`Welcome to Doc Insight Portal, ${user.first_name}!`, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          const userFriendlyMessage = this.errorMappingService.getUserFriendlyMessage(error);
          this.snackBar.open(userFriendlyMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.signupForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      if (fieldName === 'password') {
        return `Password must be at least ${minLength} characters`;
      }
      if (fieldName === 'username') {
        return `Username must be at least ${minLength} characters`;
      }
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${minLength} characters`;
    }
    
    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      if (fieldName === 'username') {
        return `Username must not exceed ${maxLength} characters`;
      }
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed ${maxLength} characters`;
    }
    
    if (field?.hasError('pattern')) {
      if (fieldName === 'username') {
        return 'Username must contain only letters and numbers';
      }
      if (fieldName === 'password') {
        return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      }
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} format is invalid`;
    }
    
    if (this.signupForm.hasError('passwordMismatch') && fieldName === 'confirmPassword') {
      return 'Passwords do not match';
    }
    
    return '';
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
