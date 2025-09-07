import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface IngestionStatus {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  totalDocuments: number;
  processedDocuments: number;
  startTime?: Date;
  endTime?: Date;
  errorMessage?: string;
}

export interface IngestionRequest {
  documentIds?: string[];
  processAll?: boolean;
}

export interface IngestionResponse {
  status: IngestionStatus;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class IngestionService {
  private readonly API_URL: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.API_URL = this.configService.getApiUrl('ingestion');
  }

  startIngestion(request: IngestionRequest): Observable<IngestionResponse> {
    return this.http.post<IngestionResponse>(`${this.API_URL}/trigger`, request)
      .pipe(catchError(this.handleError));
  }

  getIngestionStatus(): Observable<IngestionStatus> {
    return this.http.get<IngestionStatus>(`${this.API_URL}/status`)
      .pipe(catchError(this.handleError));
  }

  stopIngestion(): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/jobs`)
      .pipe(catchError(this.handleError));
  }

  getIngestionHistory(): Observable<IngestionStatus[]> {
    return this.http.get<IngestionStatus[]>(`${this.API_URL}/jobs`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('Ingestion Service Error:', error);
    return throwError(() => error);
  }
}
