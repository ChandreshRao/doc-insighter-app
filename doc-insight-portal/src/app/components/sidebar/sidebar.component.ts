import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  currentUser: User | null = null;
  isMobile = false;
  isOpen = false;

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['user', 'admin']
    },
    {
      label: 'Documents',
      icon: 'folder',
      route: '/dashboard/documents',
      roles: ['user', 'admin']
    },
    {
      label: 'Ingestion',
      icon: 'cloud_upload',
      route: '/dashboard/ingestion',
      roles: ['user', 'admin']
    },
    {
      label: 'Q&A Interface',
      icon: 'question_answer',
      route: '/dashboard/qa',
      roles: ['user', 'admin']
    },
    {
      label: 'User Management',
      icon: 'people',
      route: '/dashboard/users',
      roles: ['admin']
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

    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  getFilteredMenuItems(): MenuItem[] {
    if (!this.currentUser) return [];
    
    return this.menuItems.filter(item => 
      item.roles.includes(this.currentUser!.role)
    );
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    
    if (this.isMobile) {
      this.isOpen = false;
    }
  }

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.isOpen = false;
    }
  }
}
