import { BasePlatformModule } from '../BasePlatformModule';
import { 
  PlatformCategory, 
  PlatformConfig, 
  PlatformCredentials, 
  PlatformMetadata, 
  PlatformResponse, 
  PlatformUser 
} from '../../types/platform.types';

export class ParsecModule extends BasePlatformModule {
  private static moduleMetadata: PlatformMetadata = {
    id: 'parsec',
    name: 'parsec',
    displayName: 'Parsec Teams',
    description: 'High-performance remote desktop and screen sharing for creative teams',
    category: PlatformCategory.SCREEN_SHARING,
    icon: '🖥️',
    color: '#00C7BE',
    website: 'https://parsec.app',
    documentation: 'https://support.parsec.app/hc/en-us',
    features: [
      'Ultra-low latency streaming',
      'Team collaboration',
      'Access control',
      'Multi-monitor support',
      '4K/60fps streaming',
    ],
    requiredFields: ['email', 'firstName', 'lastName'],
    optionalFields: ['role', 'team'],
  };
  
  constructor() {
    super(ParsecModule.moduleMetadata);
  }
  
  getRequiredConfigFields(): string[] {
    return ['apiKey', 'organizationId'];
  }
  
  protected async onInitialize(config: PlatformConfig): Promise<PlatformResponse> {
    // Validate Parsec-specific configuration
    if (!config.apiKey || !config.organizationId) {
      return {
        success: false,
        error: 'Parsec requires apiKey and organizationId',
      };
    }
    
    return { success: true };
  }
  
  protected async onTestConnection(): Promise<PlatformResponse> {
    try {
      const response = await fetch('https://api.parsec.app/v1/teams', {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data,
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Connection failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
      };
    }
  }
  
  protected async onCreateUser(credentials: PlatformCredentials): Promise<PlatformResponse<PlatformUser>> {
    try {
      const requestData = {
        email: credentials.email,
        name: `${credentials.firstName} ${credentials.lastName}`,
        role: credentials.role || 'member',
      };
      
      const response = await fetch(
        `https://api.parsec.app/v1/teams/${this.config.organizationId}/members`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(requestData),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const user: PlatformUser = {
          id: data.id || this.generateUserId(),
          email: credentials.email,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          username: credentials.username || credentials.email,
          tenantId: this.config.organizationId!,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        return {
          success: true,
          data: user,
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to create user',
          details: error,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create Parsec user: ${error}`,
      };
    }
  }
  
  protected async onUpdateUser(userId: string, updates: Partial<PlatformCredentials>): Promise<PlatformResponse<PlatformUser>> {
    // Parsec API implementation for updating users
    return {
      success: false,
      error: 'Update user not implemented for Parsec',
    };
  }
  
  protected async onDeleteUser(userId: string): Promise<PlatformResponse> {
    try {
      const response = await fetch(
        `https://api.parsec.app/v1/teams/${this.config.organizationId}/members/${userId}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );
      
      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to delete user',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete Parsec user: ${error}`,
      };
    }
  }
  
  protected async onGetUser(userId: string): Promise<PlatformResponse<PlatformUser>> {
    // Parsec API implementation for getting a specific user
    return {
      success: false,
      error: 'Get user not implemented for Parsec',
    };
  }
  
  protected async onListUsers(): Promise<PlatformResponse<PlatformUser[]>> {
    try {
      const response = await fetch(
        `https://api.parsec.app/v1/teams/${this.config.organizationId}/members`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const users: PlatformUser[] = data.members.map((member: any) => ({
          id: member.id,
          email: member.email,
          firstName: member.name?.split(' ')[0] || '',
          lastName: member.name?.split(' ').slice(1).join(' ') || '',
          username: member.email,
          tenantId: this.config.organizationId!,
          createdAt: new Date(member.createdAt || Date.now()),
          updatedAt: new Date(member.updatedAt || Date.now()),
        }));
        
        return {
          success: true,
          data: users,
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to list users',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to list Parsec users: ${error}`,
      };
    }
  }
}