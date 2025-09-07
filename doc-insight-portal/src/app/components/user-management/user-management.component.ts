import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../services/auth.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  selectedUser: User | null = null;
  showEditModal = false;
  userForm: FormGroup;
  displayedColumns: string[] = ['name', 'role', 'status', 'lastLogin', 'actions'];

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder
  ) {
    this.userForm = this.formBuilder.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['viewer', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users = response.users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.loading = false;
      }
    });
  }

  changeUserRole(userId: string, newRole: string): void {
    this.userService.changeUserRole(userId, newRole).subscribe({
      next: () => {
        this.loadUsers(); // Reload users
      },
      error: (error) => {
        console.error('Failed to change user role:', error);
      }
    });
  }

  editUser(user: User): void {
    this.selectedUser = user;
    this.userForm.patchValue({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role
    });
    this.showEditModal = true;
  }

  updateUser(updates: Partial<User>): void {
    if (!this.selectedUser) return;
    
    this.userService.updateUser(this.selectedUser.id, updates).subscribe({
      next: () => {
        this.loadUsers(); // Reload users
        this.showEditModal = false;
        this.selectedUser = null;
        this.userForm.reset();
      },
      error: (error) => {
        console.error('Failed to update user:', error);
      }
    });
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers(); // Reload users
        },
        error: (error) => {
          console.error('Failed to delete user:', error);
        }
      });
    }
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
    this.userForm.reset();
  }
}
