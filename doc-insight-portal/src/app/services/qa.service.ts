import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface Question {
  id: string;
  text: string;
  askedAt: Date;
  askedBy: string;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  confidence: number;
  sources: Source[];
  answeredAt: Date;
}

export interface Source {
  documentId: string;
  documentName: string;
  excerpt: string;
  pageNumber?: number;
  relevance: number;
}

export interface QaRequest {
  question: string;
  context?: string;
}

export interface QaResponse {
  answer: Answer;
  question: Question;
}

@Injectable({
  providedIn: 'root'
})
export class QaService {
  private readonly API_URL: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.API_URL = this.configService.getRagServiceUrl('api/qa');
  }

  askQuestion(request: QaRequest): Observable<QaResponse> {
    return this.http.post<QaResponse>(`${this.API_URL}/ask`, request)
      .pipe(catchError(this.handleError));
  }

  getQuestionHistory(): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.API_URL}/history`)
      .pipe(catchError(this.handleError));
  }

  getAnswer(questionId: string): Observable<Answer> {
    return this.http.get<Answer>(`${this.API_URL}/answers/${questionId}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('QA Service Error:', error);
    return throwError(() => error);
  }
}
