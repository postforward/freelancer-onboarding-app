import { 
  IPlatformModule, 
  PlatformConfig, 
  PlatformCredentials, 
  PlatformMetadata, 
  PlatformResponse, 
  PlatformStatus, 
  PlatformUser 
} from '../types/platform.types';

/**
 * Abstract base class for all platform modules
 * Provides common functionality and enforces the platform interface
 */
export abstract class BasePlatformModule implements IPlatformModule {
  protected config: PlatformConfig = {};
  protected isInitialized: boolean = false;
  
  constructor(public readonly metadata: PlatformMetadata) {}
  
  /**
   * Initialize the platform module with configuration
   */
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
  
  /**
   * Test the connection to the platform
   */
  async testConnection(): Promise<PlatformResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    return this.onTestConnection();
  }
  
  /**
   * Create a new user on the platform
   */
  async createUser(credentials: PlatformCredentials): Promise<PlatformResponse<PlatformUser>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    // Validate required fields
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
  
  /**
   * Update an existing user
   */
  async updateUser(userId: string, updates: Partial<PlatformCredentials>): Promise<PlatformResponse<PlatformUser>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    return this.onUpdateUser(userId, updates);
  }
  
  /**
   * Delete a user from the platform
   */
  async deleteUser(userId: string): Promise<PlatformResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    return this.onDeleteUser(userId);
  }
  
  /**
   * Get a specific user by ID
   */
  async getUser(userId: string): Promise<PlatformResponse<PlatformUser>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    return this.onGetUser(userId);
  }
  
  /**
   * List all users on the platform
   */
  async listUsers(): Promise<PlatformResponse<PlatformUser[]>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Platform not initialized',
      };
    }
    
    return this.onListUsers();
  }
  
  /**
   * Get the current status of the platform
   */
  async getStatus(): Promise<PlatformResponse<PlatformStatus>> {
    if (!this.isInitialized) {
      return {
        success: true,
        data: PlatformStatus.INACTIVE,
      };
    }
    
    try {
      const connectionTest = await this.testConnection();
      return {
        success: true,
        data: connectionTest.success ? PlatformStatus.ACTIVE : PlatformStatus.ERROR,
      };
    } catch (error) {
      return {
        success: true,
        data: PlatformStatus.ERROR,
      };
    }
  }
  
  /**
   * Validate the provided configuration
   */
  validateConfig(config: PlatformConfig): boolean {
    const requiredFields = this.getRequiredConfigFields();
    return requiredFields.every(field => config[field as keyof PlatformConfig]);
  }
  
  /**
   * Get required configuration fields for this platform
   */
  abstract getRequiredConfigFields(): string[];
  
  // Protected methods to be implemented by concrete platform modules
  protected abstract onInitialize(config: PlatformConfig): Promise<PlatformResponse>;
  protected abstract onTestConnection(): Promise<PlatformResponse>;
  protected abstract onCreateUser(credentials: PlatformCredentials): Promise<PlatformResponse<PlatformUser>>;
  protected abstract onUpdateUser(userId: string, updates: Partial<PlatformCredentials>): Promise<PlatformResponse<PlatformUser>>;
  protected abstract onDeleteUser(userId: string): Promise<PlatformResponse>;
  protected abstract onGetUser(userId: string): Promise<PlatformResponse<PlatformUser>>;
  protected abstract onListUsers(): Promise<PlatformResponse<PlatformUser[]>>;
  
  // Helper methods for common operations
  protected generateUserId(): string {
    return `${this.metadata.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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