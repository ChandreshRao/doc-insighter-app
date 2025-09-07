import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  /**
   * Get the current environment configuration
   */
  get environment() {
    return environment;
  }

  /**
   * Get the API base URL
   */
  get apiUrl(): string {
    return environment.apiUrl;
  }

  /**
   * Get the authentication API URL
   */
  get authUrl(): string {
    return environment.authUrl;
  }

  /**
   * Get the RAG service URL
   */
  get ragServiceUrl(): string {
    return environment.ragServiceUrl;
  }

  /**
   * Get the frontend URL
   */
  get frontendUrl(): string {
    return environment.frontendUrl;
  }

  /**
   * Get the application name
   */
  get appName(): string {
    return environment.appName;
  }

  /**
   * Get the application version
   */
  get version(): string {
    return environment.version;
  }

  /**
   * Check if running in production mode
   */
  get isProduction(): boolean {
    return environment.production;
  }

  /**
   * Get the complete URL for a specific API endpoint
   */
  getApiUrl(endpoint: string): string {
    return `${this.apiUrl}/${endpoint}`.replace(/\/+/g, '/');
  }

  /**
   * Get the complete URL for the RAG service endpoint
   */
  getRagServiceUrl(endpoint: string): string {
    return `${this.ragServiceUrl}/${endpoint}`.replace(/\/+/g, '/');
  }
}
