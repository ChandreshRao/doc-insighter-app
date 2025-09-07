import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HeaderComponent } from '../../../app/components/header/header.component';
import { User } from '../../../app/services/auth.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.title).toBe('');
    expect(component.currentUser).toBeNull();
  });

  it('should accept title input', () => {
    component.title = 'Test Title';
    expect(component.title).toBe('Test Title');
  });

  it('should accept currentUser input', () => {
    component.currentUser = mockUser;
    expect(component.currentUser).toBe(mockUser);
  });

  it('should navigate to home when goToHome is called', () => {
    component.goToHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/overview']);
  });

  it('should emit logout event when onLogout is called', () => {
    spyOn(component.logout, 'emit');
    component.onLogout();
    expect(component.logout.emit).toHaveBeenCalled();
  });

  it('should display title in template', () => {
    component.title = 'Doc Insight Portal';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const titleElement = compiled.querySelector('.header-title');
    expect(titleElement.textContent).toContain('Doc Insight Portal');
  });

  it('should display user information when currentUser is provided', () => {
    component.currentUser = mockUser;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const userNameElement = compiled.querySelector('.user-name');
    const userEmailElement = compiled.querySelector('.user-email');
    const userRoleElement = compiled.querySelector('.user-role');

    expect(userNameElement.textContent).toContain('Test User');
    expect(userEmailElement.textContent).toContain('test@example.com');
    expect(userRoleElement.textContent).toContain('user');
  });

  it('should not display user information when currentUser is null', () => {
    component.currentUser = null;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const userInfoElement = compiled.querySelector('.user-info');
    expect(userInfoElement).toBeNull();
  });

  it('should have clickable title element', () => {
    component.title = 'Doc Insight Portal';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const titleElement = compiled.querySelector('.header-left');
    expect(titleElement.style.cursor).toBe('pointer');
  });

  it('should call goToHome when title is clicked', () => {
    spyOn(component, 'goToHome');
    component.title = 'Doc Insight Portal';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const titleElement = compiled.querySelector('.header-left');
    titleElement.click();

    expect(component.goToHome).toHaveBeenCalled();
  });

  it('should call onLogout when logout menu item is clicked', () => {
    spyOn(component, 'onLogout');
    component.currentUser = mockUser;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const logoutButton = compiled.querySelector('button[mat-menu-item]');
    logoutButton.click();

    expect(component.onLogout).toHaveBeenCalled();
  });
});
