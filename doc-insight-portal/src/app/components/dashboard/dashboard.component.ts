import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

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
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = false;

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Filter admin-only items
    if (!this.authService.isAdmin()) {
      this.statCards = this.statCards.filter(card => card.title !== 'Active Users');
      this.quickActions = this.quickActions.filter(action => action.title !== 'Start Ingestion');
    }
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
}
