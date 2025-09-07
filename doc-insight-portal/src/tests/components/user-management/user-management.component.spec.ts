import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { UserManagementComponent } from '../../../app/components/user-management/user-management.component';
import { UserService } from '../../../app/services/user.service';
import { User } from '../../../app/services/auth.service';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      last_login: '2023-01-01T10:00:00Z'
    },
    {
      id: '2',
      email: 'user@example.com',
      first_name: 'Regular',
      last_name: 'User',
      role: 'user',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }
  ];

  const mockUserListResponse = {
    users: mockUsers,
    total: 2
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getUsers',
      'updateUser',
      'deleteUser',
      'changeUserRole'
    ]);

    await TestBed.configureTestingModule({
      declarations: [UserManagementComponent],
      imports: [ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        FormBuilder,
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  beforeEach(() => {
    mockUserService.getUsers.and.returnValue(of(mockUserListResponse));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.users).toEqual([]);
    expect(component.loading).toBeFalsy();
    expect(component.selectedUser).toBeNull();
    expect(component.showEditModal).toBeFalsy();
    expect(component.displayedColumns).toEqual(['name', 'role', 'status', 'lastLogin', 'actions']);
  });

  it('should load users on init', () => {
    expect(mockUserService.getUsers).toHaveBeenCalled();
    expect(component.users).toEqual(mockUsers);
  });

  it('should set loading state during user loading', () => {
    component.loading = false;
    component.loadUsers();
    expect(component.loading).toBeTruthy();
  });

  it('should handle successful user loading', () => {
    component.loadUsers();
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBeFalsy();
  });

  it('should handle user loading error', () => {
    const consoleSpy = spyOn(console, 'error');
    mockUserService.getUsers.and.returnValue(throwError(() => new Error('API Error')));

    component.loadUsers();

    expect(consoleSpy).toHaveBeenCalledWith('Error loading users:', jasmine.any(Error));
    expect(component.loading).toBeFalsy();
  });

  it('should change user role successfully', () => {
    const updatedUser = { ...mockUsers[1], role: 'editor' };
    mockUserService.changeUserRole.and.returnValue(of(updatedUser));

    component.changeUserRole('2', 'editor');

    expect(mockUserService.changeUserRole).toHaveBeenCalledWith('2', 'editor');
    expect(component.users[1].role).toBe('editor');
  });

  it('should handle role change error', () => {
    const consoleSpy = spyOn(console, 'error');
    mockUserService.changeUserRole.and.returnValue(throwError(() => new Error('Role change failed')));

    component.changeUserRole('2', 'editor');

    expect(consoleSpy).toHaveBeenCalledWith('Error changing user role:', jasmine.any(Error));
  });

  it('should edit user and show modal', () => {
    const userToEdit = mockUsers[0];
    component.editUser(userToEdit);

    expect(component.selectedUser).toBe(userToEdit);
    expect(component.showEditModal).toBeTruthy();
    expect(component.userForm.get('first_name')?.value).toBe(userToEdit.first_name);
    expect(component.userForm.get('last_name')?.value).toBe(userToEdit.last_name);
    expect(component.userForm.get('email')?.value).toBe(userToEdit.email);
    expect(component.userForm.get('role')?.value).toBe(userToEdit.role);
  });

  it('should update user successfully', () => {
    const updatedUser = { ...mockUsers[0], first_name: 'Updated' };
    component.selectedUser = mockUsers[0];
    component.userForm.patchValue({ first_name: 'Updated' });
    mockUserService.updateUser.and.returnValue(of(updatedUser));

    component.updateUser({ first_name: 'Updated' });

    expect(mockUserService.updateUser).toHaveBeenCalledWith(mockUsers[0].id, { first_name: 'Updated' });
    expect(component.users[0].first_name).toBe('Updated');
    expect(component.showEditModal).toBeFalsy();
    expect(component.selectedUser).toBeNull();
  });

  it('should create new user successfully', () => {
    const newUser = {
      id: '3',
      email: 'new@example.com',
      first_name: 'New',
      last_name: 'User',
      role: 'user',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };
    component.selectedUser = null;
    component.userForm.patchValue({
      first_name: 'New',
      last_name: 'User',
      email: 'new@example.com',
      role: 'user'
    });
    mockUserService.updateUser.and.returnValue(of(newUser));

    component.updateUser({
      first_name: 'New',
      last_name: 'User',
      email: 'new@example.com',
      role: 'user'
    });

    expect(mockUserService.updateUser).toHaveBeenCalledWith('1', {
      first_name: 'New',
      last_name: 'User',
      email: 'new@example.com',
      role: 'user'
    });
  });

  it('should handle update user error', () => {
    const consoleSpy = spyOn(console, 'error');
    component.selectedUser = mockUsers[0];
    component.userForm.patchValue({ first_name: 'Updated' });
    mockUserService.updateUser.and.returnValue(throwError(() => new Error('Update failed')));

    component.updateUser({ first_name: 'Updated' });

    expect(consoleSpy).toHaveBeenCalledWith('Error updating user:', jasmine.any(Error));
  });

  it('should delete user successfully', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockUserService.deleteUser.and.returnValue(of(undefined));

    component.deleteUser('2');

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');
    expect(mockUserService.deleteUser).toHaveBeenCalledWith('2');
    expect(component.users.length).toBe(1);
  });

  it('should not delete user without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteUser('2');

    expect(mockUserService.deleteUser).not.toHaveBeenCalled();
  });

  it('should not delete admin users', () => {
    component.deleteUser('1'); // Admin user
    expect(mockUserService.deleteUser).not.toHaveBeenCalled();
  });

  it('should handle delete user error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const consoleSpy = spyOn(console, 'error');
    mockUserService.deleteUser.and.returnValue(throwError(() => new Error('Delete failed')));

    component.deleteUser('2');

    expect(consoleSpy).toHaveBeenCalledWith('Error deleting user:', jasmine.any(Error));
  });

  it('should close edit modal', () => {
    component.showEditModal = true;
    component.selectedUser = mockUsers[0];
    component.userForm.patchValue({ first_name: 'Test' });

    component.closeEditModal();

    expect(component.showEditModal).toBeFalsy();
    expect(component.selectedUser).toBeNull();
    expect(component.userForm.get('first_name')?.value).toBe('');
  });

  it('should initialize form with empty values', () => {
    expect(component.userForm.get('first_name')?.value).toBe('');
    expect(component.userForm.get('last_name')?.value).toBe('');
    expect(component.userForm.get('email')?.value).toBe('');
    expect(component.userForm.get('role')?.value).toBe('');
  });

  it('should validate required fields', () => {
    component.userForm.patchValue({
      first_name: '',
      last_name: '',
      email: '',
      role: ''
    });

    expect(component.userForm.get('first_name')?.hasError('required')).toBeTruthy();
    expect(component.userForm.get('last_name')?.hasError('required')).toBeTruthy();
    expect(component.userForm.get('email')?.hasError('required')).toBeTruthy();
    expect(component.userForm.get('role')?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    component.userForm.patchValue({
      email: 'invalid-email'
    });

    expect(component.userForm.get('email')?.hasError('email')).toBeTruthy();
  });

  it('should display users in table', () => {
    component.users = mockUsers;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Admin User');
    expect(compiled.textContent).toContain('Regular User');
    expect(compiled.textContent).toContain('admin@example.com');
    expect(compiled.textContent).toContain('user@example.com');
  });

  it('should show loading spinner when loading', () => {
    component.loading = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const spinner = compiled.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should show no users message when empty', () => {
    component.users = [];
    component.loading = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('No users found');
  });

  it('should show edit modal when showEditModal is true', () => {
    component.showEditModal = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const modal = compiled.querySelector('.modal-overlay');
    expect(modal).toBeTruthy();
  });

  it('should disable delete button for admin users', () => {
    component.users = mockUsers;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const adminDeleteButton = compiled.querySelector('button[disabled]');
    expect(adminDeleteButton).toBeTruthy();
  });
});
