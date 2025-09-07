import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() currentUser: User | null = null;
  @Output() logout = new EventEmitter<void>();

  constructor(private router: Router) {}

  goToHome(): void {
    this.router.navigate(['/dashboard/overview']);
  }

  onLogout(): void {
    this.logout.emit();
  }
}
