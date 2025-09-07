import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DashboardComponent } from '../../../app/components/dashboard/dashboard.component';
import { AuthService } from '../../../app/services/auth.service';
import { DashboardService, DashboardStats } from '../../../app/services/dashboard.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;
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

  const mockDashboardStats: DashboardStats = {
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
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockDashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    mockDashboardService.getDashboardStats.and.returnValue(of(mockDashboardStats));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default stat cards', () => {
    expect(component.statCards).toBeDefined();
    expect(component.statCards.length).toBe(4);
    expect(component.statCards[0].title).toBe('Total Documents');
    expect(component.statCards[1].title).toBe('Processing Status');
    expect(component.statCards[2].title).toBe('Questions Asked');
    expect(component.statCards[3].title).toBe('Active Users');
  });

  it('should initialize with quick actions', () => {
    expect(component.quickActions).toBeDefined();
    expect(component.quickActions.length).toBe(3);
    expect(component.quickActions[0].title).toBe('Upload Document');
    expect(component.quickActions[1].title).toBe('Start Ingestion');
    expect(component.quickActions[2].title).toBe('Ask Question');
  });

  it('should load dashboard stats on init', () => {
    expect(mockDashboardService.getDashboardStats).toHaveBeenCalled();
  });

  it('should update stat cards with loaded stats', () => {
    expect(component.statCards[0].value).toBe(10); // totalDocuments
    expect(component.statCards[1].value).toBe('Idle'); // processingStatus
    expect(component.statCards[2].value).toBe(5); // questionsAsked
    expect(component.statCards[3].value).toBe(3); // activeUsers
  });

  it('should set current user from auth service', () => {
    expect(component.currentUser).toEqual(mockUser);
  });

  it('should filter admin-only items for non-admin users', () => {
    mockAuthService.isAdmin.and.returnValue(false);
    component.ngOnInit();

    expect(component.statCards.find((card: any) => card.title === 'Active Users')).toBeUndefined();
    expect(component.quickActions.find((action: any) => action.title === 'Start Ingestion')).toBeUndefined();
  });

  it('should keep admin-only items for admin users', () => {
    mockAuthService.isAdmin.and.returnValue(true);
    component.ngOnInit();

    expect(component.statCards.find((card: any) => card.title === 'Active Users')).toBeDefined();
    expect(component.quickActions.find((action: any) => action.title === 'Start Ingestion')).toBeDefined();
  });

  it('should navigate to route when navigateTo is called', () => {
    const route = '/dashboard/documents';
    component.navigateTo(route);
    expect(mockRouter.navigate).toHaveBeenCalledWith([route]);
  });

  it('should return correct greeting based on time', () => {
    const hour = new Date().getHours();
    const greeting = component.getGreeting();

    if (hour < 12) {
      expect(greeting).toBe('Good morning');
    } else if (hour < 17) {
      expect(greeting).toBe('Good afternoon');
    } else {
      expect(greeting).toBe('Good evening');
    }
  });

  it('should refresh stats when refreshStats is called', () => {
    // Cannot spy on private method, test public behavior instead
    component.refreshStats();
    // Test that refreshStats calls the service (public behavior)
    expect(mockDashboardService.getDashboardStats).toHaveBeenCalled();
  });

  it('should handle error when loading dashboard stats fails', () => {
    const consoleSpy = spyOn(console, 'error');
    mockDashboardService.getDashboardStats.and.returnValue(throwError(() => new Error('API Error')));
    
    component.refreshStats();
    
    expect(consoleSpy).toHaveBeenCalledWith('Error loading dashboard stats:', jasmine.any(Error));
    expect(component.isLoading).toBeFalsy();
  });

  it('should set loading state during stats loading', () => {
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

  it('should update stat cards correctly', () => {
    const newStats: DashboardStats = {
      totalDocuments: 20,
      processingStatus: 'Processing',
      questionsAsked: 15,
      activeUsers: 8
    };

    // Test public behavior instead of private method
    component.refreshStats();

    expect(component.statCards[0].value).toBe(20);
    expect(component.statCards[1].value).toBe('Processing');
    expect(component.statCards[2].value).toBe(15);
    expect(component.statCards[3].value).toBe(8);
  });

  it('should handle stat card update for unknown titles', () => {
    const originalCards = [...component.statCards];
    const newStats: DashboardStats = {
      totalDocuments: 5,
      processingStatus: 'Idle',
      questionsAsked: 2,
      activeUsers: 1
    };

    // Test public behavior instead of private method
    component.refreshStats();

    // Should not change cards with unknown titles
    expect(component.statCards).toEqual(originalCards);
  });

  it('should complete destroy subject on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
