import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, throwError, of } from 'rxjs';
import { catchError, map, timeout, switchMap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';

export interface DashboardStats {
  totalDocuments: number;
  processingStatus: string;
  questionsAsked: number;
  activeUsers: number;
}

export interface DocumentStats {
  total: number;
  byStatus: { [key: string]: number };
  byType: { [key: string]: number };
  recent: any[];
}

export interface UserStats {
  total: number;
  byRole: { [key: string]: number };
  recent: number;
  activeToday: number;
}

export interface IngestionStats {
  total: number;
  byStatus: { [key: string]: number };
  recentJobs: any[];
}

export interface QaStats {
  totalQuestions: number;
  recentQuestions: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private authService: AuthService
  ) {
    this.API_URL = this.configService.apiUrl;
  }

  /**
   * Get all dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    // Check if user is authenticated
    if (!this.authService.getToken()) {
      console.error('Dashboard Service: User not authenticated');
      return throwError(() => new Error('User not authenticated'));
    }

    return forkJoin({
      documents: this.getDocumentStats(),
      users: this.getUserStats(),
      ingestion: this.getIngestionStats(),
      qa: this.getQaStats()
    }).pipe(
      map(({ documents, users, ingestion, qa }) => ({
        totalDocuments: documents.total,
        processingStatus: this.getProcessingStatus(ingestion),
        questionsAsked: qa.totalQuestions,
        activeUsers: users.activeToday
      })),
      catchError(error => {
        console.error('Dashboard Service - Overall Error:', error);
        
        // If it's an authentication error, try to refresh token
        if (error.status === 401) {
          console.warn('Authentication error detected, attempting token refresh...');
          return this.authService.refreshToken().pipe(
            // After refresh, retry the dashboard stats
            switchMap(() => this.getDashboardStats())
          );
        }
        
        // For other errors, return default stats
        console.warn('Using fallback dashboard stats due to error');
        return of({
          totalDocuments: 0,
          processingStatus: 'Unknown',
          questionsAsked: 0,
          activeUsers: 0
        });
      })
    );
  }

  /**
   * Get document statistics
   */
  getDocumentStats(): Observable<DocumentStats> {
    return this.http.get<{ success: boolean; data: DocumentStats }>(`${this.API_URL}/documents/stats/overview`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Dashboard Service - Document Stats Error:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Get user statistics (admin only)
   */
  getUserStats(): Observable<UserStats> {
    return this.http.get<{ success: boolean; data: UserStats }>(`${this.API_URL}/users/stats/overview`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Dashboard Service - User Stats Error:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Get ingestion statistics
   */
  getIngestionStats(): Observable<IngestionStats> {
    return this.http.get<{ success: boolean; data: IngestionStats }>(`${this.API_URL}/ingestion/stats/overview`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Dashboard Service - Ingestion Stats Error:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Get QA statistics
   */
  getQaStats(): Observable<QaStats> {
    return this.http.get<{ success: boolean; data: QaStats }>(`${this.configService.ragServiceUrl}/api/qa/stats`)
      .pipe(
        timeout(5000), // 5 second timeout
        map(response => response.data),
        catchError(error => {
          console.warn('QA Service not available, using fallback stats:', error);
          // Return default QA stats when service is unavailable
          return of({
            totalQuestions: 0,
            recentQuestions: []
          });
        })
      );
  }

  /**
   * Determine processing status based on ingestion stats
   */
  private getProcessingStatus(ingestion: IngestionStats): string {
    if (ingestion.byStatus['processing'] > 0) {
      return 'Processing';
    } else if (ingestion.byStatus['pending'] > 0) {
      return 'Pending';
    } else if (ingestion.byStatus['failed'] > 0) {
      return 'Error';
    } else {
      return 'Idle';
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('Dashboard Service Error:', error);
    return throwError(() => error);
  }
}
