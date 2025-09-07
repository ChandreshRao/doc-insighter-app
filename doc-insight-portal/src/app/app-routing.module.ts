import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

// Components
import { LoginComponent } from './components/auth/login/login.component';
import { SignupComponent } from './components/auth/signup/signup.component';
import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DocumentManagementComponent } from './components/document-management/document-management.component';
import { IngestionPanelComponent } from './components/ingestion-panel/ingestion-panel.component';
import { QaInterfaceComponent } from './components/qa-interface/qa-interface.component';
import { UserManagementComponent } from './components/user-management/user-management.component';

const routes: Routes = [
  // Public routes
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  
  // Protected routes
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: DashboardComponent },
      { path: 'documents', component: DocumentManagementComponent },
      { path: 'ingestion', component: IngestionPanelComponent },
      { path: 'qa', component: QaInterfaceComponent },
      { 
        path: 'users', 
        component: UserManagementComponent, 
        canActivate: [AdminGuard] 
      }
    ]
  },
  
  // Catch all route
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
