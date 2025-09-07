import { Component } from '@angular/core';

@Component({
  selector: 'app-document-management',
  template: `
    <div class="document-management-container">
      <div class="header">
        <h1>Document Management</h1>
        <p>Upload and manage your documents</p>
      </div>
      
      <div class="content">
        <app-document-upload></app-document-upload>
        <app-document-list></app-document-list>
      </div>
    </div>
  `,
  styles: [`
    .document-management-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      margin-bottom: 32px;
      text-align: center;
    }
    
    .header h1 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 32px;
      font-weight: 500;
    }
    
    .header p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }
    
    .content {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
  `]
})
export class DocumentManagementComponent {}
