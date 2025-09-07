import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { Subject, takeUntil } from 'rxjs';

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  route?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoading = false;
  private destroy$ = new Subject<void>();
  dashboardStats: DashboardStats | null = null;

  statCards: StatCard[] = [
    {
      title: 'Total Documents',
      value: '0',
      icon: 'folder',
      color: '#1976d2',
      route: '/dashboard/documents'
    },
    {
      title: 'Processing Status',
      value: 'Idle',
      icon: 'sync',
      color: '#4caf50',
      route: '/dashboard/ingestion'
    },
    {
      title: 'Questions Asked',
      value: '0',
      icon: 'question_answer',
      color: '#ff9800',
      route: '/dashboard/qa'
    },
    {
      title: 'Active Users',
      value: '0',
      icon: 'people',
      color: '#9c27b0',
      route: '/dashboard/users'
    }
  ];

  quickActions = [
    {
      title: 'Upload Document',
      description: 'Add new documents to the system',
      icon: 'cloud_upload',
      route: '/dashboard/documents',
      color: '#1976d2'
    },
    {
      title: 'Start Ingestion',
      description: 'Process uploaded documents',
      icon: 'play_arrow',
      route: '/dashboard/ingestion',
      color: '#4caf50'
    },
    {
      title: 'Ask Question',
      description: 'Query your document knowledge base',
      icon: 'help',
      route: '/dashboard/qa',
      color: '#ff9800'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
    });

    // Load dashboard statistics
    this.loadDashboardStats();

    // Filter admin-only items
    if (!this.authService.isAdmin()) {
      this.statCards = this.statCards.filter(card => card.title !== 'Active Users');
      this.quickActions = this.quickActions.filter(action => action.title !== 'Start Ingestion');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  private loadDashboardStats(): void {
    this.isLoading = true;
    
    this.dashboardService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.dashboardStats = stats;
          this.updateStatCards(stats);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard stats:', error);
          this.isLoading = false;
          // Keep default values on error
        }
      });
  }

  private updateStatCards(stats: DashboardStats): void {
    this.statCards = this.statCards.map(card => {
      switch (card.title) {
        case 'Total Documents':
          return { ...card, value: stats.totalDocuments };
        case 'Processing Status':
          return { ...card, value: stats.processingStatus };
        case 'Questions Asked':
          return { ...card, value: stats.questionsAsked };
        case 'Active Users':
          return { ...card, value: stats.activeUsers };
        default:
          return card;
      }
    });
  }

  refreshStats(): void {
    this.loadDashboardStats();
  }
}
