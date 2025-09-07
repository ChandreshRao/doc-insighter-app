import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ConfigService } from './config.service';
import { ErrorMappingService } from './error-mapping.service';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL: string;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private errorMappingService: ErrorMappingService
  ) {
    this.API_URL = this.configService.authUrl;
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();
    
    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.data.access_token);
          this.setRefreshToken(response.data.refresh_token);
          this.setStoredUser(response.data.user);
          this.currentUserSubject.next(response.data.user);
          this.isAuthenticatedSubject.next(true);
        }),
        map(response => response.data.user),
        catchError(this.handleError)
      );
  }

  signup(userData: SignupRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData) // Changed from /signup to /register
      .pipe(
        tap(response => {
          this.setToken(response.data.access_token);
          this.setRefreshToken(response.data.refresh_token);
          this.setStoredUser(response.data.user);
          this.currentUserSubject.next(response.data.user);
          this.isAuthenticatedSubject.next(true);
        }),
        map(response => response.data.user),
        catchError(this.handleError)
      );
  }

  logout(): void {
    this.clearToken();
    this.clearRefreshToken();
    this.clearStoredUser();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    
    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap(response => {
          this.setToken(response.data.access_token);
          // Note: Backend doesn't return a new refresh token, so we keep the existing one
          this.setStoredUser(response.data.user);
          this.currentUserSubject.next(response.data.user);
        }),
        catchError(error => {
          // If refresh fails, clear all auth data and redirect to login
          this.logout();
          return throwError(() => error);
        })
      );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      catchError(this.handleError)
    );
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private clearRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  private setStoredUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  private clearStoredUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Validate current token by making a test API call
   */
  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    // Make a simple API call to validate the token
    return this.http.get(`${this.API_URL}/validate`).pipe(
      map(() => true),
      catchError(() => {
        // Token is invalid, clear auth data
        this.logout();
        return of(false);
      })
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Auth Service Error:', error);
    return throwError(() => error);
  }
}
