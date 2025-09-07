import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DashboardService, DashboardStats, DocumentStats, UserStats, IngestionStats, QaStats } from '../../app/services/dashboard.service';
import { ConfigService } from '../../app/services/config.service';
import { AuthService } from '../../app/services/auth.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockDocumentStats: DocumentStats = {
    total: 10,
    byStatus: { pending: 2, processing: 1, completed: 7, error: 0 },
    byType: { pdf: 8, doc: 2, txt: 0 },
    recent: []
  };

  const mockUserStats: UserStats = {
    total: 5,
    byRole: { admin: 1, editor: 2, viewer: 2 },
    recent: 1,
    activeToday: 3
  };

  const mockIngestionStats: IngestionStats = {
    total: 3,
    byStatus: { idle: 1, processing: 1, completed: 1, failed: 0 },
    recentJobs: []
  };

  const mockQaStats: QaStats = {
    totalQuestions: 15,
    recentQuestions: []
  };

  const mockDashboardStats: DashboardStats = {
    totalDocuments: 10,
    processingStatus: 'Idle',
    questionsAsked: 15,
    activeUsers: 3
  };

  beforeEach(() => {
    const configServiceSpy = jasmine.createSpyObj('ConfigService', ['apiUrl', 'ragServiceUrl'], {
      apiUrl: 'http://localhost:3000/api',
      ragServiceUrl: 'http://localhost:8000'
    });

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken'], {
      getToken: jasmine.createSpy().and.returnValue('mock-token')
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DashboardService,
        { provide: ConfigService, useValue: configServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
    mockConfigService = TestBed.inject(ConfigService) as jasmine.SpyObj<ConfigService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get dashboard stats', () => {
    service.getDashboardStats().subscribe((stats: DashboardStats) => {
      expect(stats).toEqual(mockDashboardStats);
    });

    // Expect multiple API calls for different stats
    const documentReq = httpMock.expectOne('http://localhost:3000/api/documents/stats/overview');
    expect(documentReq.request.method).toBe('GET');
    documentReq.flush({ success: true, data: mockDocumentStats });

    const userReq = httpMock.expectOne('http://localhost:3000/api/users/stats/overview');
    expect(userReq.request.method).toBe('GET');
    userReq.flush({ success: true, data: mockUserStats });

    const ingestionReq = httpMock.expectOne('http://localhost:3000/api/ingestion/stats/overview');
    expect(ingestionReq.request.method).toBe('GET');
    ingestionReq.flush({ success: true, data: mockIngestionStats });

    const qaReq = httpMock.expectOne('http://localhost:8000/api/qa/stats');
    expect(qaReq.request.method).toBe('GET');
    qaReq.flush({ success: true, data: mockQaStats });
  });

  it('should get document stats', () => {
    service.getDocumentStats().subscribe((stats: DocumentStats) => {
      expect(stats).toEqual(mockDocumentStats);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/documents/stats/overview');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockDocumentStats });
  });

  it('should get user stats', () => {
    service.getUserStats().subscribe((stats: UserStats) => {
      expect(stats).toEqual(mockUserStats);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/stats/overview');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockUserStats });
  });

  it('should get ingestion stats', () => {
    service.getIngestionStats().subscribe((stats: IngestionStats) => {
      expect(stats).toEqual(mockIngestionStats);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/ingestion/stats/overview');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockIngestionStats });
  });

  it('should get QA stats', () => {
    service.getQaStats().subscribe((stats: QaStats) => {
      expect(stats).toEqual(mockQaStats);
    });

    const req = httpMock.expectOne('http://localhost:8000/api/qa/stats');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockQaStats });
  });

  it('should determine processing status correctly', () => {
    const processingIngestion: IngestionStats = {
      total: 5,
      byStatus: { processing: 2, completed: 3, idle: 0 },
      recentJobs: []
    };

    const idleIngestion: IngestionStats = {
      total: 5,
      byStatus: { idle: 5, completed: 0, processing: 0 },
      recentJobs: []
    };

    const pendingIngestion: IngestionStats = {
      total: 5,
      byStatus: { pending: 3, completed: 0, processing: 0 },
      recentJobs: []
    };

    const errorIngestion: IngestionStats = {
      total: 5,
      byStatus: { failed: 2, completed: 0, processing: 0 },
      recentJobs: []
    };

    // Test processing status determination
    expect(service['getProcessingStatus'](processingIngestion)).toBe('Processing');
    expect(service['getProcessingStatus'](idleIngestion)).toBe('Idle');
    expect(service['getProcessingStatus'](pendingIngestion)).toBe('Pending');
    expect(service['getProcessingStatus'](errorIngestion)).toBe('Error');
  });

  it('should handle API errors gracefully', () => {
    const consoleSpy = spyOn(console, 'error');

    service.getDocumentStats().subscribe({
      next: () => fail('Should have failed'),
      error: (error: any) => {
        expect(error).toBeDefined();
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/api/documents/stats/overview');
    req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle network errors', () => {
    service.getDocumentStats().subscribe({
      next: () => fail('Should have failed'),
      error: (error: any) => {
        expect(error).toBeDefined();
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/api/documents/stats/overview');
    req.error(new ErrorEvent('Network error'));
  });

  it('should aggregate stats correctly in getDashboardStats', () => {
    service.getDashboardStats().subscribe((stats: DashboardStats) => {
      expect(stats.totalDocuments).toBe(mockDocumentStats.total);
      expect(stats.questionsAsked).toBe(mockQaStats.totalQuestions);
      expect(stats.activeUsers).toBe(mockUserStats.activeToday);
      expect(stats.processingStatus).toBe('Idle'); // Based on ingestion stats
    });

    // Flush all required requests
    httpMock.expectOne('http://localhost:3000/api/documents/stats/overview').flush(mockDocumentStats);
    httpMock.expectOne('http://localhost:3000/api/users/stats').flush(mockUserStats);
    httpMock.expectOne('http://localhost:3000/api/ingestion/stats').flush(mockIngestionStats);
    httpMock.expectOne('http://localhost:3000/api/qa/stats').flush(mockQaStats);
  });

  it('should handle partial API failures in getDashboardStats', () => {
    const consoleSpy = spyOn(console, 'error');

    service.getDashboardStats().subscribe((stats: DashboardStats) => {
      // Should still return stats even if some APIs fail
      expect(stats).toBeDefined();
    });

    // One API succeeds, others fail
    httpMock.expectOne('http://localhost:3000/api/documents/stats/overview').flush(mockDocumentStats);
    httpMock.expectOne('http://localhost:3000/api/users/stats').flush({ error: 'Failed' }, { status: 500, statusText: 'Internal Server Error' });
    httpMock.expectOne('http://localhost:3000/api/ingestion/stats').flush({ error: 'Failed' }, { status: 500, statusText: 'Internal Server Error' });
    httpMock.expectOne('http://localhost:3000/api/qa/stats').flush({ error: 'Failed' }, { status: 500, statusText: 'Internal Server Error' });
  });
});
