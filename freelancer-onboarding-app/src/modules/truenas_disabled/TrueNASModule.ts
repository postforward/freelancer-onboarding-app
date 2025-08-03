import { BasePlatformModule } from '../../services/BasePlatformModule';
import { 
  IPlatformModule, 
  PlatformUser, 
  PlatformResponse, 
  PlatformCredentials,
  PlatformConfig,
  PlatformCapability,
  PlatformMetadata,
  PlatformUserStatus
} from '../../types/platform.types';
import { TrueNASApiClient } from './TrueNASApiClient';
import { trueNASConfigSchema, trueNASCredentialsSchema, TrueNASConfig, TrueNASCredentials } from './schemas';

export class TrueNASModule extends BasePlatformModule implements IPlatformModule {
  private apiClient: TrueNASApiClient | null = null;
  
  metadata: PlatformMetadata = {
    id: 'truenas',
    name: 'TrueNAS',
    description: 'Network-attached storage with SMB/CIFS support',
    icon: 'server',
    category: 'infrastructure',
    capabilities: [
      PlatformCapability.USER_MANAGEMENT,
      PlatformCapability.GROUP_MANAGEMENT,
      PlatformCapability.PERMISSION_MANAGEMENT,
      PlatformCapability.SHARE_MANAGEMENT
    ],
    configSchema: trueNASConfigSchema,
    credentialsSchema: trueNASCredentialsSchema,
    documentationUrl: 'https://www.truenas.com/docs/api',
    version: '1.0.0'
  };
  
  protected async performInitialization(config: TrueNASConfig): Promise<void> {
    this.apiClient = new TrueNASApiClient(config);
    
    // Test the connection
    const testResult = await this.testConnection();
    if (!testResult.success) {
      throw new Error(`Failed to initialize TrueNAS: ${testResult.error}`);
    }
  }
  
  async testConnection(): Promise<PlatformResponse> {
    if (!this.apiClient) {
      return {
        success: false,
        error: 'TrueNAS module not initialized'
      };
    }
    
    try {
      const info = await this.apiClient.testConnection();
      return {
        success: true,
        data: {
          connected: true,
          version: info.version,
          hostname: info.hostname
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to TrueNAS'
      };
    }
  }
  
  async createUser(credentials: TrueNASCredentials): Promise<PlatformResponse<PlatformUser>> {
    this.ensureInitialized();
    
    try {
      const validation = trueNASCredentialsSchema.safeParse(credentials);
      if (!validation.success) {
        return {
          success: false,
          error: `Invalid credentials: ${validation.error.message}`
        };
      }
      
      const { username, password, fullName, email, groups, homeDirectory, shell, smbAccess } = validation.data;
      
      // Check if user already exists
      const existingUser = await this.apiClient!.getUserByUsername(username);
      if (existingUser) {
        return {
          success: false,
          error: `User ${username} already exists`
        };
      }
      
      // Get group IDs if groups are specified
      let groupIds: number[] = [];
      if (groups && groups.length > 0) {
        for (const groupName of groups) {
          const group = await this.apiClient!.getGroupByName(groupName);
          if (group) {
            groupIds.push(group.id);
          }
        }
      }
      
      // Create user in TrueNAS
      const user = await this.apiClient!.createUser({
        username,
        password,
        full_name: fullName,
        email,
        groups: groupIds,
        home: homeDirectory || `/mnt/data/home/${username}`,
        shell: shell || '/usr/bin/zsh',
        smb: smbAccess !== false
      });
      
      // Map to platform user
      const platformUser: PlatformUser = {
        id: user.id.toString(),
        email: user.email || '',
        username: user.username,
        displayName: user.full_name,
        status: user.locked ? PlatformUserStatus.INACTIVE : PlatformUserStatus.ACTIVE,
        metadata: {
          uid: user.uid,
          gid: user.group.gid,
          groups: user.groups,
          homeDirectory: user.home,
          shell: user.shell,
          smbEnabled: user.smb
        }
      };
      
      return {
        success: true,
        data: platformUser
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user'
      };
    }
  }
  
  async deleteUser(userId: string): Promise<PlatformResponse> {
    this.ensureInitialized();
    
    try {
      await this.apiClient!.deleteUser(parseInt(userId));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user'
      };
    }
  }
  
  async updateUser(userId: string, updates: Partial<PlatformUser>): Promise<PlatformResponse<PlatformUser>> {
    this.ensureInitialized();
    
    try {
      const updateData: any = {};
      
      if (updates.displayName) {
        updateData.full_name = updates.displayName;
      }
      
      if (updates.status) {
        updateData.locked = updates.status === PlatformUserStatus.INACTIVE;
      }
      
      if (updates.metadata?.groups) {
        updateData.groups = updates.metadata.groups;
      }
      
      if (updates.metadata?.shell) {
        updateData.shell = updates.metadata.shell;
      }
      
      const updatedUser = await this.apiClient!.updateUser(parseInt(userId), updateData);
      
      const platformUser: PlatformUser = {
        id: updatedUser.id.toString(),
        email: updatedUser.email || '',
        username: updatedUser.username,
        displayName: updatedUser.full_name,
        status: updatedUser.locked ? PlatformUserStatus.INACTIVE : PlatformUserStatus.ACTIVE,
        metadata: {
          uid: updatedUser.uid,
          gid: updatedUser.group.gid,
          groups: updatedUser.groups,
          homeDirectory: updatedUser.home,
          shell: updatedUser.shell,
          smbEnabled: updatedUser.smb
        }
      };
      
      return {
        success: true,
        data: platformUser
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user'
      };
    }
  }
  
  async getUser(userId: string): Promise<PlatformResponse<PlatformUser>> {
    this.ensureInitialized();
    
    try {
      const user = await this.apiClient!.getUser(parseInt(userId));
      
      const platformUser: PlatformUser = {
        id: user.id.toString(),
        email: user.email || '',
        username: user.username,
        displayName: user.full_name,
        status: user.locked ? PlatformUserStatus.INACTIVE : PlatformUserStatus.ACTIVE,
        metadata: {
          uid: user.uid,
          gid: user.group.gid,
          groups: user.groups,
          homeDirectory: user.home,
          shell: user.shell,
          smbEnabled: user.smb
        }
      };
      
      return {
        success: true,
        data: platformUser
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user'
      };
    }
  }
  
  async listUsers(): Promise<PlatformResponse<PlatformUser[]>> {
    this.ensureInitialized();
    
    try {
      const users = await this.apiClient!.listUsers({ includeBuiltin: false });
      
      const platformUsers = users.map(user => ({
        id: user.id.toString(),
        email: user.email || '',
        username: user.username,
        displayName: user.full_name,
        status: user.locked ? PlatformUserStatus.INACTIVE : PlatformUserStatus.ACTIVE,
        metadata: {
          uid: user.uid,
          gid: user.group.gid,
          groups: user.groups,
          homeDirectory: user.home,
          shell: user.shell,
          smbEnabled: user.smb
        }
      }));
      
      return {
        success: true,
        data: platformUsers
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list users'
      };
    }
  }
  
  async createGroup(name: string, options?: { sudo?: boolean; smb?: boolean }): Promise<PlatformResponse<any>> {
    this.ensureInitialized();
    
    try {
      const group = await this.apiClient!.createGroup({
        name,
        sudo: options?.sudo,
        smb: options?.smb
      });
      
      return {
        success: true,
        data: {
          id: group.id,
          gid: group.gid,
          name: group.name,
          sudo: group.sudo,
          smb: group.smb,
          users: group.users
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create group'
      };
    }
  }
  
  async deleteGroup(groupId: string): Promise<PlatformResponse> {
    this.ensureInitialized();
    
    try {
      await this.apiClient!.deleteGroup(parseInt(groupId));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete group'
      };
    }
  }
  
  async listGroups(): Promise<PlatformResponse<any[]>> {
    this.ensureInitialized();
    
    try {
      const groups = await this.apiClient!.listGroups({ includeBuiltin: false });
      return {
        success: true,
        data: groups.map(group => ({
          id: group.id,
          gid: group.gid,
          name: group.name,
          sudo: group.sudo,
          smb: group.smb,
          users: group.users
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list groups'
      };
    }
  }
  
  async assignUserToGroup(userId: string, groupId: string): Promise<PlatformResponse> {
    this.ensureInitialized();
    
    try {
      await this.apiClient!.addUserToGroup(parseInt(userId), parseInt(groupId));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign user to group'
      };
    }
  }
  
  async removeUserFromGroup(userId: string, groupId: string): Promise<PlatformResponse> {
    this.ensureInitialized();
    
    try {
      await this.apiClient!.removeUserFromGroup(parseInt(userId), parseInt(groupId));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove user from group'
      };
    }
  }
  
  async createShare(data: {
    name: string;
    path: string;
    comment?: string;
    readonly?: boolean;
    guestAccess?: boolean;
  }): Promise<PlatformResponse<any>> {
    this.ensureInitialized();
    
    try {
      const share = await this.apiClient!.createSMBShare({
        name: data.name,
        path: data.path,
        comment: data.comment,
        readonly: data.readonly,
        guestok: data.guestAccess
      });
      
      return {
        success: true,
        data: {
          id: share.id,
          name: share.name,
          path: share.path,
          comment: share.comment,
          enabled: share.enabled,
          readonly: share.readonly,
          guestAccess: share.guestok
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create share'
      };
    }
  }
  
  async deleteShare(shareId: string): Promise<PlatformResponse> {
    this.ensureInitialized();
    
    try {
      await this.apiClient!.deleteSMBShare(parseInt(shareId));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete share'
      };
    }
  }
  
  async listShares(): Promise<PlatformResponse<any[]>> {
    this.ensureInitialized();
    
    try {
      const shares = await this.apiClient!.listSMBShares();
      return {
        success: true,
        data: shares.map(share => ({
          id: share.id,
          name: share.name,
          path: share.path,
          comment: share.comment,
          enabled: share.enabled,
          readonly: share.readonly,
          guestAccess: share.guestok
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list shares'
      };
    }
  }
  
  async setSharePermissions(shareId: string, permissions: any): Promise<PlatformResponse> {
    this.ensureInitialized();
    
    try {
      const share = await this.apiClient!.getSMBShare(parseInt(shareId));
      await this.apiClient!.setSharePermissions(share.path, permissions);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set share permissions'
      };
    }
  }
}

// Export singleton instance
export const trueNASModule = new TrueNASModule();