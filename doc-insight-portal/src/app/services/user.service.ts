import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from './auth.service';
import { ConfigService } from './config.service';

export interface UserUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.API_URL = this.configService.getApiUrl('users');
  }

  getUsers(): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(this.API_URL)
      .pipe(catchError(this.handleError));
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  updateUser(id: string, updates: UserUpdateRequest): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${id}`, updates)
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  changeUserRole(id: string, role: string): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/${id}/role`, { role })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('User Service Error:', error);
    return throwError(() => error);
  }
}
