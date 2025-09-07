import { Component, OnInit } from '@angular/core';
import { IngestionService } from '../../services/ingestion.service';
import { IngestionStatus } from '../../services/ingestion.service';

@Component({
  selector: 'app-ingestion-panel',
  templateUrl: './ingestion-panel.component.html',
  styleUrls: ['./ingestion-panel.component.scss']
})
export class IngestionPanelComponent implements OnInit {
  ingestionStatus: IngestionStatus | null = null;
  loading = false;
  error: string | null = null;

  constructor(private ingestionService: IngestionService) {}

  ngOnInit(): void {
    this.loadStatus();
    // Poll for status updates every 5 seconds
    setInterval(() => {
      if (this.ingestionStatus?.status === 'running') {
        this.loadStatus();
      }
    }, 5000);
  }

  loadStatus(): void {
    this.loading = true;
    this.error = null;
    
    this.ingestionService.getIngestionStatus().subscribe({
      next: (status) => {
        this.ingestionStatus = status;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load status:', error);
        this.error = 'Failed to load ingestion status';
        this.loading = false;
      }
    });
  }

  startIngestion(): void {
    this.loading = true;
    this.error = null;
    
    this.ingestionService.startIngestion({}).subscribe({
      next: () => {
        this.loadStatus();
      },
      error: (error) => {
        console.error('Failed to start ingestion:', error);
        this.error = 'Failed to start ingestion process';
        this.loading = false;
      }
    });
  }

  stopIngestion(): void {
    if (confirm('Are you sure you want to stop the ingestion process?')) {
      this.loading = true;
      this.error = null;
      
      this.ingestionService.stopIngestion().subscribe({
        next: () => {
          this.loadStatus();
        },
        error: (error) => {
          console.error('Failed to stop ingestion:', error);
          this.error = 'Failed to stop ingestion process';
          this.loading = false;
        }
      });
    }
  }

  getProgressPercentage(): number {
    if (!this.ingestionStatus) return 0;
    return (this.ingestionStatus.processedDocuments / this.ingestionStatus.totalDocuments) * 100;
  }

  getStatusColor(): string {
    if (!this.ingestionStatus) return 'gray';
    
    switch (this.ingestionStatus.status) {
      case 'idle': return 'gray';
      case 'running': return 'blue';
      case 'completed': return 'green';
      case 'error': return 'red';
      default: return 'gray';
    }
  }

  clearError(): void {
    this.error = null;
  }
}
