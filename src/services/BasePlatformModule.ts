// BasePlatformModule using centralized types

import type {
  PlatformResponse,
  PlatformUser,
  PlatformConfig,
  PlatformCredentials,
  PlatformMetadata,
  IPlatformModule
} from '../types/platform.types';

/**
 * Simplified base class for platform modules
 */
export abstract class BasePlatformModule implements IPlatformModule {
  protected config: PlatformConfig = {};
  protected isInitialized: boolean = false;
  public readonly metadata: PlatformMetadata;
  
  constructor(metadata: PlatformMetadata) {
    this.metadata = metadata;
  }
  
  async initialize(config: PlatformConfig): Promise<PlatformResponse> {
    try {
      if (!this.validateConfig(config)) {
        return {
          success: false,
          error: 'Invalid configuration provided',
          details: this.getRequiredConfigFields(),
        };
      }
      
      this.config = config;
      const result = await this.onInitialize(config);
      
      if (result.success) {
        this.isInitialized = true;
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize ${this.metadata.displayName}: ${error}`,
      };
    }
  }
  
  async testConnection(): Promise<PlatformResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    return this.onTestConnection();
  }
  
  async createUser(credentials: PlatformCredentials): Promise<PlatformResponse<PlatformUser>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    // Basic validation
    const missingFields = this.metadata.requiredFields.filter(
      field => !credentials[field as keyof PlatformCredentials]
    );
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      };
    }
    
    return this.onCreateUser(credentials);
  }
  
  async updateUser(userId: string, updates: Partial<PlatformCredentials>): Promise<PlatformResponse<PlatformUser>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    return this.onUpdateUser(userId, updates);
  }
  
  async deleteUser(userId: string): Promise<PlatformResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    return this.onDeleteUser(userId);
  }
  
  async getUser(userId: string): Promise<PlatformResponse<PlatformUser>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    return this.onGetUser(userId);
  }
  
  async listUsers(): Promise<PlatformResponse<PlatformUser[]>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    return this.onListUsers();
  }
  
  getStatus(): { initialized: boolean; connected: boolean; lastSync?: Date } {
    return {
      initialized: this.isInitialized,
      connected: this.isInitialized,
      lastSync: this.isInitialized ? new Date() : undefined
    };
  }
  
  validateConfig(config: PlatformConfig): boolean {
    const requiredFields = this.getRequiredConfigFields();
    return requiredFields.every(field => config[field as keyof PlatformConfig]);
  }
  
  abstract getRequiredConfigFields(): string[];
  
  // Abstract methods to be implemented by concrete platforms
  protected abstract onInitialize(config: PlatformConfig): Promise<PlatformResponse>;
  protected abstract onTestConnection(): Promise<PlatformResponse>;
  protected abstract onCreateUser(credentials: PlatformCredentials): Promise<PlatformResponse<PlatformUser>>;
  protected abstract onUpdateUser(userId: string, updates: Partial<PlatformCredentials>): Promise<PlatformResponse<PlatformUser>>;
  protected abstract onDeleteUser(userId: string): Promise<PlatformResponse>;
  protected abstract onGetUser(userId: string): Promise<PlatformResponse<PlatformUser>>;
  protected abstract onListUsers(): Promise<PlatformResponse<PlatformUser[]>>;
    
  // Helper methods
  protected generateUserId(): string {
    return `${this.metadata.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  
  protected buildApiUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl || '';
    return `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  }
  
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    
    return headers;
  }
}