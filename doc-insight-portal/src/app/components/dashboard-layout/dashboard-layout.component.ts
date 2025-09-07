import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  template: `
    <div class="dashboard-layout">
      <app-sidebar></app-sidebar>
      <main class="main-content">
        <app-header 
          [title]="title"
          [currentUser]="currentUser"
          (logout)="logout()">
        </app-header>
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-x: auto;
    }
    
    .content-area {
      flex: 1;
      padding: 0;
    }
    
    @media (max-width: 768px) {
      .content-area {
        padding: 0;
      }
    }
  `]
})
export class DashboardLayoutComponent implements OnInit {
  title = 'Doc Insight Portal';
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
