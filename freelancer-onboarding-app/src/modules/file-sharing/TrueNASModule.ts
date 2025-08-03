import { BasePlatformModule } from '../BasePlatformModule';
import { 
  PlatformCategory, 
  PlatformConfig, 
  PlatformCredentials, 
  PlatformMetadata, 
  PlatformResponse, 
  PlatformUser 
} from '../../types/platform.types';

export class TrueNASModule extends BasePlatformModule {
  private static moduleMetadata: PlatformMetadata = {
    id: 'truenas',
    name: 'truenas',
    displayName: 'TrueNAS SMB',
    description: 'Enterprise-grade network attached storage with SMB/CIFS file sharing',
    category: PlatformCategory.FILE_SHARING,
    icon: '💾',
    color: '#0095D5',
    website: 'https://www.truenas.com',
    documentation: 'https://www.truenas.com/docs/',
    features: [
      'SMB/CIFS file sharing',
      'User and group management',
      'Snapshots and replication',
      'ZFS file system',
      'Access control lists (ACLs)',
    ],
    requiredFields: ['username', 'password', 'email'],
    optionalFields: ['groups', 'homeDirectory', 'shell'],
  };
  
  constructor() {
    super(TrueNASModule.moduleMetadata);
  }
  
  getRequiredConfigFields(): string[] {
    return ['baseUrl', 'apiKey'];
  }
  
  protected async onInitialize(config: PlatformConfig): Promise<PlatformResponse> {
    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        error: 'TrueNAS requires baseUrl and apiKey',
      };
    }
    
    // Remove trailing slash from baseUrl
    this.config.baseUrl = config.baseUrl.replace(/\/$/, '');
    
    return { success: true };
  }
  
  protected async onTestConnection(): Promise<PlatformResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v2.0/system/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: {
            version: data.version,
            hostname: data.hostname,
            system: data.system_product,
          },
        };
      } else {
        return {
          success: false,
          error: `Connection failed: ${response.status} ${response.statusText}`,
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
      // TrueNAS user creation payload
      const requestData = {
        username: credentials.username,
        full_name: `${credentials.firstName} ${credentials.lastName}`,
        email: credentials.email,
        password: credentials.password,
        password_disabled: false,
        locked: false,
        microsoft_account: false,
        smb: true, // Enable SMB access
        shell: credentials.metadata?.shell || '/usr/bin/bash',
        home: credentials.metadata?.homeDirectory || `/mnt/tank/home/${credentials.username}`,
        groups: credentials.metadata?.groups || [],
      };
      
      const response = await fetch(`${this.config.baseUrl}/api/v2.0/user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (response.ok) {
        const data = await response.json();
        const user: PlatformUser = {
          id: data.id.toString(),
          email: credentials.email,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          username: credentials.username || credentials.email,
          tenantId: this.config.baseUrl!,
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
        error: `Failed to create TrueNAS user: ${error}`,
      };
    }
  }
  
  protected async onUpdateUser(userId: string, updates: Partial<PlatformCredentials>): Promise<PlatformResponse<PlatformUser>> {
    try {
      const updateData: any = {};
      
      if (updates.firstName || updates.lastName) {
        updateData.full_name = `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
      }
      if (updates.email) updateData.email = updates.email;
      if (updates.password) updateData.password = updates.password;
      if (updates.metadata?.groups) updateData.groups = updates.metadata.groups;
      
      const response = await fetch(`${this.config.baseUrl}/api/v2.0/user/id/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (response.ok) {
        const data = await response.json();
        const user: PlatformUser = {
          id: data.id.toString(),
          email: data.email,
          firstName: data.full_name?.split(' ')[0] || '',
          lastName: data.full_name?.split(' ').slice(1).join(' ') || '',
          username: data.username,
          tenantId: this.config.baseUrl!,
          createdAt: new Date(data.builtin ? Date.now() : data.id * 1000),
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
          error: error.message || 'Failed to update user',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to update TrueNAS user: ${error}`,
      };
    }
  }
  
  protected async onDeleteUser(userId: string): Promise<PlatformResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v2.0/user/id/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
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
        error: `Failed to delete TrueNAS user: ${error}`,
      };
    }
  }
  
  protected async onGetUser(userId: string): Promise<PlatformResponse<PlatformUser>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v2.0/user/id/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const user: PlatformUser = {
          id: data.id.toString(),
          email: data.email,
          firstName: data.full_name?.split(' ')[0] || '',
          lastName: data.full_name?.split(' ').slice(1).join(' ') || '',
          username: data.username,
          tenantId: this.config.baseUrl!,
          createdAt: new Date(data.builtin ? Date.now() : data.id * 1000),
          updatedAt: new Date(),
        };
        
        return {
          success: true,
          data: user,
        };
      } else {
        return {
          success: false,
          error: 'User not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to get TrueNAS user: ${error}`,
      };
    }
  }
  
  protected async onListUsers(): Promise<PlatformResponse<PlatformUser[]>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v2.0/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const users: PlatformUser[] = data
          .filter((user: any) => !user.builtin) // Filter out system users
          .map((user: any) => ({
            id: user.id.toString(),
            email: user.email || '',
            firstName: user.full_name?.split(' ')[0] || '',
            lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
            username: user.username,
            tenantId: this.config.baseUrl!,
            createdAt: new Date(user.id * 1000),
            updatedAt: new Date(),
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
        error: `Failed to list TrueNAS users: ${error}`,
      };
    }
  }
  
  // TrueNAS specific methods
  async assignGroups(userId: string, groups: string[]): Promise<PlatformResponse> {
    return this.updateUser(userId, { metadata: { groups } });
  }
  
  async createSMBShare(shareName: string, path: string, permissions: any): Promise<PlatformResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v2.0/sharing/smb`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: shareName,
          path: path,
          ...permissions,
        }),
      });
      
      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to create SMB share',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create SMB share: ${error}`,
      };
    }
  }
}