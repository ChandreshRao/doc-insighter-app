import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface Document {
  id: string;
  name: string;
  filename: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
}

export interface UploadResponse {
  document: Document;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly API_URL: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.API_URL = this.configService.getApiUrl('documents');
  }

  getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(this.API_URL)
      .pipe(catchError(this.handleError));
  }

  getDocument(id: string): Observable<Document> {
    return this.http.get<Document>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  uploadDocument(file: File, description?: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    return this.http.post<UploadResponse>(this.API_URL, formData)
      .pipe(catchError(this.handleError));
  }

  updateDocument(id: string, updates: Partial<Document>): Observable<Document> {
    return this.http.put<Document>(`${this.API_URL}/${id}`, updates)
      .pipe(catchError(this.handleError));
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('Document Service Error:', error);
    return throwError(() => error);
  }
}
