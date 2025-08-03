// Core platform types and interfaces

export interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformConfig {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  organizationId?: string;
  accountId?: string;
  customFields?: Record<string, any>;
}

export interface PlatformCredentials {
  username: string;
  password?: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface PlatformResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export enum PlatformCategory {
  SCREEN_SHARING = 'screen-sharing',
  FILE_SHARING = 'file-sharing',
  COLLABORATION = 'collaboration',
  COMMUNICATION = 'communication',
}

export enum PlatformStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ERROR = 'error',
}

export interface PlatformMetadata {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: PlatformCategory;
  icon?: string;
  color?: string;
  website?: string;
  documentation?: string;
  features: string[];
  requiredFields: string[];
  optionalFields?: string[];
}

// Main platform module interface that all platforms must implement
export interface IPlatformModule {
  metadata: PlatformMetadata;
  
  // Lifecycle methods
  initialize(config: PlatformConfig): Promise<PlatformResponse>;
  testConnection(): Promise<PlatformResponse>;
  
  // User management
  createUser(credentials: PlatformCredentials): Promise<PlatformResponse<PlatformUser>>;
  updateUser(userId: string, updates: Partial<PlatformCredentials>): Promise<PlatformResponse<PlatformUser>>;
  deleteUser(userId: string): Promise<PlatformResponse>;
  getUser(userId: string): Promise<PlatformResponse<PlatformUser>>;
  listUsers(): Promise<PlatformResponse<PlatformUser[]>>;
  
  // Platform-specific operations (optional)
  syncUser?(userId: string): Promise<PlatformResponse>;
  resetPassword?(userId: string): Promise<PlatformResponse>;
  assignRole?(userId: string, role: string): Promise<PlatformResponse>;
  assignPermissions?(userId: string, permissions: string[]): Promise<PlatformResponse>;
  
  // Configuration
  validateConfig(config: PlatformConfig): boolean;
  getRequiredConfigFields(): string[];
  
  // Status and health
  getStatus(): Promise<PlatformResponse<PlatformStatus>>;
}

// Platform registry type
export type PlatformRegistry = Map<string, IPlatformModule>;

// Platform event types
export interface PlatformEvent {
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'connection_test' | 'error';
  platformId: string;
  tenantId: string;
  data: any;
  timestamp: Date;
}