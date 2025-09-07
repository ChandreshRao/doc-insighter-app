import { Component } from '@angular/core';
import { DocumentService } from '../../services/document.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-document-upload',
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.scss']
})
export class DocumentUploadComponent {
  selectedFile: File | null = null;
  description = '';
  uploading = false;
  uploadProgress = 0;
  isDragOver = false;
  allowedFileTypes = '.pdf,.doc,.docx,.txt,.md';

  constructor(
    private documentService: DocumentService,
    private authService: AuthService
  ) {}

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    if (event.dataTransfer?.files.length) {
      this.selectedFile = event.dataTransfer.files[0];
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.description = '';
    this.uploadProgress = 0;
  }

  uploadDocument(): void {
    if (!this.selectedFile) return;
    
    this.uploading = true;
    this.uploadProgress = 0;
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.random() * 10;
      }
    }, 200);
    
    this.documentService.uploadDocument(this.selectedFile, this.description)
      .subscribe({
        next: (response) => {
          clearInterval(progressInterval);
          this.uploadProgress = 100;
          console.log('Document uploaded:', response);
          this.uploading = false;
          setTimeout(() => {
            this.resetForm();
          }, 1000);
        },
        error: (error) => {
          clearInterval(progressInterval);
          console.error('Upload failed:', error);
          this.uploading = false;
          this.uploadProgress = 0;
        }
      });
  }

  private resetForm(): void {
    this.selectedFile = null;
    this.description = '';
    this.uploadProgress = 0;
  }

  get canUpload(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'editor' || user?.role === 'admin';
  }

  get fileSizeMB(): string {
    if (!this.selectedFile) return '0 MB';
    return (this.selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB';
  }

  get isFileValid(): boolean {
    if (!this.selectedFile) return false;
    
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return allowedTypes.includes(this.selectedFile.type) && this.selectedFile.size <= maxSize;
  }
}
