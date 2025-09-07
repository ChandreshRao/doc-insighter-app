import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { IngestionPanelComponent } from '../../../app/components/ingestion-panel/ingestion-panel.component';
import { IngestionService, IngestionStatus } from '../../../app/services/ingestion.service';

describe('IngestionPanelComponent', () => {
  let component: IngestionPanelComponent;
  let fixture: ComponentFixture<IngestionPanelComponent>;
  let mockIngestionService: jasmine.SpyObj<IngestionService>;

  const mockIngestionStatus: IngestionStatus = {
    id: '1',
    status: 'idle',
    progress: 0,
    totalDocuments: 10,
    processedDocuments: 0,
    startTime: new Date('2023-01-01T10:00:00Z'),
    endTime: new Date('2023-01-01T11:00:00Z')
  };

  const mockRunningStatus: IngestionStatus = {
    id: '2',
    status: 'running',
    progress: 50,
    totalDocuments: 10,
    processedDocuments: 5,
    startTime: new Date('2023-01-01T10:00:00Z')
  };

  beforeEach(async () => {
    const ingestionServiceSpy = jasmine.createSpyObj('IngestionService', [
      'getIngestionStatus',
      'startIngestion',
      'stopIngestion'
    ]);

    await TestBed.configureTestingModule({
      declarations: [IngestionPanelComponent],
      imports: [NoopAnimationsModule],
      providers: [
        { provide: IngestionService, useValue: ingestionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IngestionPanelComponent);
    component = fixture.componentInstance;
    mockIngestionService = TestBed.inject(IngestionService) as jasmine.SpyObj<IngestionService>;
  });

  beforeEach(() => {
    mockIngestionService.getIngestionStatus.and.returnValue(of(mockIngestionStatus));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.ingestionStatus).toBeNull();
    expect(component.loading).toBeFalsy();
    expect(component.error).toBeNull();
  });

  it('should load status on init', () => {
    expect(mockIngestionService.getIngestionStatus).toHaveBeenCalled();
  });

  it('should set loading state during status loading', () => {
    component.loading = false;
    component.loadStatus();
    expect(component.loading).toBeTruthy();
  });

  it('should handle successful status loading', () => {
    component.loadStatus();
    expect(component.ingestionStatus).toEqual(mockIngestionStatus);
    expect(component.loading).toBeFalsy();
    expect(component.error).toBeNull();
  });

  it('should handle status loading error', () => {
    const consoleSpy = spyOn(console, 'error');
    mockIngestionService.getIngestionStatus.and.returnValue(throwError(() => new Error('API Error')));

    component.loadStatus();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load status:', jasmine.any(Error));
    expect(component.error).toBe('Failed to load ingestion status');
    expect(component.loading).toBeFalsy();
  });

  it('should start ingestion successfully', () => {
    mockIngestionService.startIngestion.and.returnValue(of({ status: mockRunningStatus, message: 'Started' }));

    component.startIngestion();

    expect(mockIngestionService.startIngestion).toHaveBeenCalledWith({});
    expect(component.loading).toBeFalsy();
  });

  it('should handle start ingestion error', () => {
    const consoleSpy = spyOn(console, 'error');
    mockIngestionService.startIngestion.and.returnValue(throwError(() => new Error('Start failed')));

    component.startIngestion();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to start ingestion:', jasmine.any(Error));
    expect(component.error).toBe('Failed to start ingestion process');
    expect(component.loading).toBeFalsy();
  });

  it('should stop ingestion with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockIngestionService.stopIngestion.and.returnValue(of(undefined));

    component.stopIngestion();

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to stop the ingestion process?');
    expect(mockIngestionService.stopIngestion).toHaveBeenCalled();
    expect(component.loading).toBeFalsy();
  });

  it('should not stop ingestion without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.stopIngestion();

    expect(mockIngestionService.stopIngestion).not.toHaveBeenCalled();
  });

  it('should handle stop ingestion error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const consoleSpy = spyOn(console, 'error');
    mockIngestionService.stopIngestion.and.returnValue(throwError(() => new Error('Stop failed')));

    component.stopIngestion();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to stop ingestion:', jasmine.any(Error));
    expect(component.error).toBe('Failed to stop ingestion process');
    expect(component.loading).toBeFalsy();
  });

  it('should calculate progress percentage correctly', () => {
    component.ingestionStatus = mockRunningStatus;
    expect(component.getProgressPercentage()).toBe(50);
  });

  it('should return 0 progress for null status', () => {
    component.ingestionStatus = null;
    expect(component.getProgressPercentage()).toBe(0);
  });

  it('should return 0 progress for zero total documents', () => {
    component.ingestionStatus = { ...mockRunningStatus, totalDocuments: 0 };
    expect(component.getProgressPercentage()).toBe(0);
  });

  it('should get correct status color', () => {
    component.ingestionStatus = mockIngestionStatus;
    expect(component.getStatusColor()).toBe('gray');

    component.ingestionStatus = { ...mockIngestionStatus, status: 'running' };
    expect(component.getStatusColor()).toBe('blue');

    component.ingestionStatus = { ...mockIngestionStatus, status: 'completed' };
    expect(component.getStatusColor()).toBe('green');

    component.ingestionStatus = { ...mockIngestionStatus, status: 'error' };
    expect(component.getStatusColor()).toBe('red');
  });

  it('should return gray color for null status', () => {
    component.ingestionStatus = null;
    expect(component.getStatusColor()).toBe('gray');
  });

  it('should clear error', () => {
    component.error = 'Some error';
    component.clearError();
    expect(component.error).toBeNull();
  });

  it('should poll for status updates when running', () => {
    jasmine.clock().install();
    component.ingestionStatus = mockRunningStatus;
    mockIngestionService.getIngestionStatus.and.returnValue(of(mockRunningStatus));

    component.ngOnInit();

    // Fast-forward time to trigger polling
    jasmine.clock().tick(5000);
    expect(mockIngestionService.getIngestionStatus).toHaveBeenCalledTimes(2); // Initial + polled

    jasmine.clock().uninstall();
  });

  it('should not poll when status is not running', () => {
    jasmine.clock().install();
    component.ingestionStatus = mockIngestionStatus; // idle status
    mockIngestionService.getIngestionStatus.and.returnValue(of(mockIngestionStatus));

    component.ngOnInit();

    // Fast-forward time
    jasmine.clock().tick(5000);
    expect(mockIngestionService.getIngestionStatus).toHaveBeenCalledTimes(1); // Only initial call

    jasmine.clock().uninstall();
  });

  it('should disable start button when loading', () => {
    component.loading = true;
    component.ingestionStatus = mockIngestionStatus;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const startButton = compiled.querySelector('button[color="primary"]');
    expect(startButton.disabled).toBeTruthy();
  });

  it('should disable start button when running', () => {
    component.loading = false;
    component.ingestionStatus = mockRunningStatus;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const startButton = compiled.querySelector('button[color="primary"]');
    expect(startButton.disabled).toBeTruthy();
  });

  it('should disable stop button when not running', () => {
    component.loading = false;
    component.ingestionStatus = mockIngestionStatus;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const stopButton = compiled.querySelector('button[color="warn"]');
    expect(stopButton.disabled).toBeTruthy();
  });

  it('should enable stop button when running', () => {
    component.loading = false;
    component.ingestionStatus = mockRunningStatus;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const stopButton = compiled.querySelector('button[color="warn"]');
    expect(stopButton.disabled).toBeFalsy();
  });

  it('should display status information correctly', () => {
    component.ingestionStatus = mockIngestionStatus;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Total Documents: 10');
    expect(compiled.textContent).toContain('Processed: 0');
    expect(compiled.textContent).toContain('Idle');
  });

  it('should display progress bar when running', () => {
    component.ingestionStatus = mockRunningStatus;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const progressBar = compiled.querySelector('mat-progress-bar');
    expect(progressBar).toBeTruthy();
    expect(compiled.textContent).toContain('50%');
  });

  it('should display error message when present', () => {
    component.ingestionStatus = { ...mockIngestionStatus, errorMessage: 'Processing failed' };
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Error Occurred');
    expect(compiled.textContent).toContain('Processing failed');
  });
});
