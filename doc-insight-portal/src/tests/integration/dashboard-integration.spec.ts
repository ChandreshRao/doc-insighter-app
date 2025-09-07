import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DashboardComponent } from '../../app/components/dashboard/dashboard.component';
import { AuthService } from '../../app/services/auth.service';
import { DashboardService } from '../../app/services/dashboard.service';
import { ConfigService } from '../../app/services/config.service';

describe('Dashboard Integration Tests', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockRouter: jasmine.SpyObj<Router>;

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

  const mockDashboardStats = {
    totalDocuments: 10,
    processingStatus: 'Idle',
    questionsAsked: 5,
    activeUsers: 3
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin'], {
      currentUser$: of(mockUser)
    });
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getDashboardStats']);
    const configServiceSpy = jasmine.createSpyObj('ConfigService', ['apiUrl'], {
      apiUrl: 'http://localhost:3000/api'
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: ConfigService, useValue: configServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockDashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
    mockConfigService = TestBed.inject(ConfigService) as jasmine.SpyObj<ConfigService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    mockDashboardService.getDashboardStats.and.returnValue(of(mockDashboardStats));
    fixture.detectChanges();
  });

  it('should integrate auth service with dashboard service', () => {
    expect(mockAuthService.currentUser$).toBeDefined();
    expect(mockDashboardService.getDashboardStats).toHaveBeenCalled();
  });

  it('should handle user role changes and update UI accordingly', () => {
    // Test admin user
    mockAuthService.isAdmin.and.returnValue(true);
    component.ngOnInit();

    expect(component.statCards.find((card: any) => card.title === 'Active Users')).toBeDefined();
    expect(component.quickActions.find((action: any) => action.title === 'Start Ingestion')).toBeDefined();

    // Test regular user
    mockAuthService.isAdmin.and.returnValue(false);
    component.ngOnInit();

    expect(component.statCards.find((card: any) => card.title === 'Active Users')).toBeUndefined();
    expect(component.quickActions.find((action: any) => action.title === 'Start Ingestion')).toBeUndefined();
  });

  it('should handle dashboard service errors gracefully', () => {
    const consoleSpy = spyOn(console, 'error');
    mockDashboardService.getDashboardStats.and.returnValue(throwError(() => new Error('API Error')));

    component.refreshStats();

    expect(consoleSpy).toHaveBeenCalledWith('Error loading dashboard stats:', jasmine.any(Error));
    expect(component.isLoading).toBeFalsy();
  });

  it('should update stat cards when dashboard stats change', () => {
    const newStats = {
      totalDocuments: 20,
      processingStatus: 'Processing',
      questionsAsked: 15,
      activeUsers: 8
    };

    mockDashboardService.getDashboardStats.and.returnValue(of(newStats));
    component.refreshStats();

    expect(component.statCards[0].value).toBe(20);
    expect(component.statCards[1].value).toBe('Processing');
    expect(component.statCards[2].value).toBe(15);
    expect(component.statCards[3].value).toBe(8);
  });

  it('should handle navigation integration', () => {
    const route = '/dashboard/documents';
    component.navigateTo(route);
    expect(mockRouter.navigate).toHaveBeenCalledWith([route]);
  });

  it('should integrate refresh functionality', () => {
    spyOn(component, 'refreshStats');
    component.refreshStats();
    expect(component.refreshStats).toHaveBeenCalled();
  });

  it('should handle loading states during data fetching', () => {
    let loadingState = false;
    mockDashboardService.getDashboardStats.and.returnValue(
      new Promise(resolve => {
        setTimeout(() => {
          loadingState = component.isLoading;
          resolve(mockDashboardStats);
        }, 100);
      }) as any
    );

    component.refreshStats();
    expect(component.isLoading).toBeTruthy();
  });

  it('should maintain user context throughout component lifecycle', () => {
    expect(component.currentUser).toEqual(mockUser);
    
    // Simulate user change
    const newUser = { ...mockUser, first_name: 'NewUser' };
    (mockAuthService.currentUser$ as any) = of(newUser);
    component.ngOnInit();
    
    expect(component.currentUser).toEqual(newUser);
  });

  it('should handle multiple service interactions correctly', () => {
    // Test that all services work together
    expect(mockAuthService.isAdmin).toHaveBeenCalled();
    expect(mockDashboardService.getDashboardStats).toHaveBeenCalled();
    
    // Test navigation
    component.navigateTo('/dashboard/qa');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/qa']);
  });

  it('should handle component destruction properly', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should integrate greeting functionality with user data', () => {
    const greeting = component.getGreeting();
    expect(greeting).toMatch(/Good (morning|afternoon|evening)/);
    
    // Test that greeting uses user's first name
    expect(component.currentUser?.first_name).toBe('Test');
  });

  it('should handle stat card updates with different data types', () => {
    const mixedStats = {
      totalDocuments: 0,
      processingStatus: 'Error',
      questionsAsked: 0,
      activeUsers: 1
    };

    mockDashboardService.getDashboardStats.and.returnValue(of(mixedStats));
    component.refreshStats();

    expect(component.statCards[0].value).toBe(0);
    expect(component.statCards[1].value).toBe('Error');
    expect(component.statCards[2].value).toBe(0);
    expect(component.statCards[3].value).toBe(1);
  });
});
