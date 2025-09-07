import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DocumentUploadComponent } from '../../../app/components/document-upload/document-upload.component';
import { DocumentService } from '../../../app/services/document.service';
import { AuthService } from '../../../app/services/auth.service';

describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent;
  let fixture: ComponentFixture<DocumentUploadComponent>;
  let mockDocumentService: jasmine.SpyObj<DocumentService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'editor',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  const mockUploadResponse = {
    document: {
      id: '1',
      name: 'test.pdf',
      filename: 'test.pdf',
      size: 1024,
      type: 'application/pdf',
      status: 'pending' as const,
      uploadedAt: new Date(),
      uploadedBy: '1',
      description: 'Test document'
    },
    message: 'Document uploaded successfully'
  };

  beforeEach(async () => {
    const documentServiceSpy = jasmine.createSpyObj('DocumentService', ['uploadDocument']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      declarations: [DocumentUploadComponent],
      imports: [NoopAnimationsModule],
      providers: [
        { provide: DocumentService, useValue: documentServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    mockDocumentService = TestBed.inject(DocumentService) as jasmine.SpyObj<DocumentService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.selectedFile).toBeNull();
    expect(component.description).toBe('');
    expect(component.uploading).toBeFalsy();
    expect(component.uploadProgress).toBe(0);
    expect(component.isDragOver).toBeFalsy();
    expect(component.allowedFileTypes).toBe('.pdf,.doc,.docx,.txt,.md');
  });

  it('should handle file selection', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const event = {
      target: {
        files: [mockFile]
      }
    };

    component.onFileSelected(event);
    expect(component.selectedFile).toBe(mockFile);
  });

  it('should handle drag over event', () => {
    const event = new DragEvent('dragover');
    spyOn(event, 'preventDefault');

    component.onDragOver(event);
    expect(component.isDragOver).toBeTruthy();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should handle drag leave event', () => {
    const event = new DragEvent('dragleave');
    spyOn(event, 'preventDefault');

    component.onDragLeave(event);
    expect(component.isDragOver).toBeFalsy();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should handle drop event', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const event = new DragEvent('drop');
    spyOn(event, 'preventDefault');
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        files: [mockFile]
      }
    });

    component.onDrop(event);
    expect(component.selectedFile).toBe(mockFile);
    expect(component.isDragOver).toBeFalsy();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should remove file and reset form', () => {
    component.selectedFile = new File(['test'], 'test.pdf');
    component.description = 'Test description';
    component.uploadProgress = 50;

    component.removeFile();

    expect(component.selectedFile).toBeNull();
    expect(component.description).toBe('');
    expect(component.uploadProgress).toBe(0);
  });

  it('should upload document successfully', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    component.selectedFile = mockFile;
    component.description = 'Test document';
    mockDocumentService.uploadDocument.and.returnValue(of(mockUploadResponse));

    component.uploadDocument();

    expect(component.uploading).toBeTruthy();
    expect(mockDocumentService.uploadDocument).toHaveBeenCalledWith(mockFile, 'Test document');
  });

  it('should handle upload error', () => {
    const consoleSpy = spyOn(console, 'error');
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    component.selectedFile = mockFile;
    mockDocumentService.uploadDocument.and.returnValue(throwError(() => new Error('Upload failed')));

    component.uploadDocument();

    expect(consoleSpy).toHaveBeenCalledWith('Upload failed:', jasmine.any(Error));
    expect(component.uploading).toBeFalsy();
    expect(component.uploadProgress).toBe(0);
  });

  it('should not upload if no file selected', () => {
    component.selectedFile = null;
    component.uploadDocument();

    expect(mockDocumentService.uploadDocument).not.toHaveBeenCalled();
  });

  it('should calculate file size in MB correctly', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(mockFile, 'size', { value: 1048576 }); // 1MB

    component.selectedFile = mockFile;
    expect(component.fileSizeMB).toBe('1.00 MB');
  });

  it('should return 0 MB for no file', () => {
    component.selectedFile = null;
    expect(component.fileSizeMB).toBe('0 MB');
  });

  it('should validate file correctly', () => {
    const validFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB

    component.selectedFile = validFile;
    expect(component.isFileValid).toBeTruthy();
  });

  it('should reject invalid file type', () => {
    const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(invalidFile, 'size', { value: 1024 * 1024 }); // 1MB

    component.selectedFile = invalidFile;
    expect(component.isFileValid).toBeFalsy();
  });

  it('should reject file that is too large', () => {
    const largeFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB

    component.selectedFile = largeFile;
    expect(component.isFileValid).toBeFalsy();
  });

  it('should return false for file validation when no file selected', () => {
    component.selectedFile = null;
    expect(component.isFileValid).toBeFalsy();
  });

  it('should allow upload for editor role', () => {
    mockAuthService.getCurrentUser.and.returnValue({ ...mockUser, role: 'editor' });
    expect(component.canUpload).toBeTruthy();
  });

  it('should allow upload for admin role', () => {
    mockAuthService.getCurrentUser.and.returnValue({ ...mockUser, role: 'admin' });
    expect(component.canUpload).toBeTruthy();
  });

  it('should not allow upload for viewer role', () => {
    mockAuthService.getCurrentUser.and.returnValue({ ...mockUser, role: 'viewer' });
    expect(component.canUpload).toBeFalsy();
  });

  it('should not allow upload when no user', () => {
    mockAuthService.getCurrentUser.and.returnValue(null);
    expect(component.canUpload).toBeFalsy();
  });

  it('should reset form after successful upload', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    component.selectedFile = mockFile;
    component.description = 'Test document';
    mockDocumentService.uploadDocument.and.returnValue(of(mockUploadResponse));

    component.uploadDocument();

    // Wait for the timeout to complete
    setTimeout(() => {
      expect(component.selectedFile).toBeNull();
      expect(component.description).toBe('');
      expect(component.uploadProgress).toBe(0);
    }, 1100);
  });
});
