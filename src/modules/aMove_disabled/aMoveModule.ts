import { BasePlatformModule } from '../../services/BasePlatformModule';
import type { 
  IPlatformModule, 
  PlatformUser, 
  PlatformResponse, 
  PlatformCredentials,
  PlatformConfig,
  PlatformCapability,
  PlatformMetadata,
  PlatformUserStatus
} from '../../types/platform.types';
import { aMoveApiClient } from './aMoveApiClient';
import { aMoveConfigSchema, aMoveCredentialsSchema, AMoveConfig, AMoveCredentials } from './schemas';

export class aMoveModule extends BasePlatformModule implements IPlatformModule {
  private apiClient: aMoveApiClient | null = null;
  
  metadata: PlatformMetadata = {
    id: 'amove',
    name: 'aMove',
    description: 'File transfer and storage platform with team collaboration',
    icon: 'folder-sync',
    category: 'file-sharing',
    capabilities: [
      PlatformCapability.USER_MANAGEMENT,
      PlatformCapability.GROUP_MANAGEMENT,
      PlatformCapability.PERMISSION_MANAGEMENT,
      PlatformCapability.ACTIVITY_MONITORING
    ],
    configSchema: aMoveConfigSchema,
    credentialsSchema: aMoveCredentialsSchema,
    documentationUrl: 'https://amove.com/docs/api',
    version: '1.0.0'
  };
  
  protected async performInitialization(config: AMoveConfig): Promise<void> {
    this.apiClient = new aMoveApiClient(config);
    
    // Test the connection
    const testResult = await this.testConnection();
    if (!testResult.success) {
      throw new Error(`Failed to initialize aMove: ${testResult.error}`);
    }
  }
  
  async testConnection(): Promise<PlatformResponse> {
    if (!this.apiClient) {
      return {
        success: false,
        error: 'aMove module not initialized'
      };
    }
    
    try {
      const account = await this.apiClient.getAccountInfo();
      return {
        success: true,
        data: {
          connected: true,
          accountName: account.name,
          accountId: account.id,
          plan: account.plan
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to aMove'
      };
    }
  }
  
  async createUser(credentials: AMoveCredentials): Promise<PlatformResponse<PlatformUser>> {
    this.ensureInitialized();
    
    try {
      const validation = aMoveCredentialsSchema.safeParse(credentials);
      if (!validation.success) {
        return {
          success: false,
          error: `Invalid credentials: ${validation.error.message}`
        };
      }
      
      const { email, fullName, role, teamId } = validation.data;
      
      // Create user in aMove
      const user = await this.apiClient!.createUser({
        email,
        name: fullName,
        role: role || 'member',
        teamId
      });
      
      // Map to platform user
      const platformUser: PlatformUser = {
        id: user.id,
        email: user.email,
        username: user.email,
        displayName: user.name,
        status: user.active ? PlatformUserStatus.ACTIVE : PlatformUserStatus.INACTIVE,
        metadata: {
          role: user.role,
          teamId: user.teamId,
          createdAt: user.createdAt,
          lastActive: user.lastActive
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
      await this.apiClient!.deleteUser(userId);
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
        updateData.name = updates.displayName;
      }
      
      if (updates.status) {
        updateData.active = updates.status === PlatformUserStatus.ACTIVE;
      }
      
      if (updates.metadata?.role) {
        updateData.role = updates.metadata.role;
      }
      
      if (updates.metadata?.teamId) {
        updateData.teamId = updates.metadata.teamId;
      }
      
      const updatedUser = await this.apiClient!.updateUser(userId, updateData);
      
      const platformUser: PlatformUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.email,
        displayName: updatedUser.name,
        status: updatedUser.active ? PlatformUserStatus.ACTIVE : PlatformUserStatus.INACTIVE,
        metadata: {
          role: updatedUser.role,
          teamId: updatedUser.teamId,
          createdAt: updatedUser.createdAt,
          lastActive: updatedUser.lastActive
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
      const user = await this.apiClient!.getUser(userId);
      
      const platformUser: PlatformUser = {
        id: user.id,
        email: user.email,
        username: user.email,
        displayName: user.name,
        status: user.active ? PlatformUserStatus.ACTIVE : PlatformUserStatus.INACTIVE,
        metadata: {
          role: user.role,
          teamId: user.teamId,
          createdAt: user.createdAt,
          lastActive: user.lastActive
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
  
  async listUsers(options?: { teamId?: string }): Promise<PlatformResponse<PlatformUser[]>> {
    this.ensureInitialized();
    
    try {
      const users = await this.apiClient!.listUsers(options);
      
      const platformUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.email,
        displayName: user.name,
        status: user.active ? PlatformUserStatus.ACTIVE : PlatformUserStatus.INACTIVE,
        metadata: {
          role: user.role,
          teamId: user.teamId,
          createdAt: user.createdAt,
          lastActive: user.lastActive
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
  
  async assignUserToTeam(userId: string, teamId: string): Promise<PlatformResponse> {
    this.ensureInitialized();
    
    try {
      await this.apiClient!.assignUserToTeam(userId, teamId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign user to team'
      };
    }
  }
  
  async removeUserFromTeam(userId: string, teamId: string): Promise<PlatformResponse> {
    this.ensureInitialized();
    
    try {
      await this.apiClient!.removeUserFromTeam(userId, teamId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove user from team'
      };
    }
  }
  
  async listTeams(): Promise<PlatformResponse<any[]>> {
    this.ensureInitialized();
    
    try {
      const teams = await this.apiClient!.listTeams();
      return {
        success: true,
        data: teams
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list teams'
      };
    }
  }
  
  async createTeam(name: string, description?: string): Promise<PlatformResponse<any>> {
    this.ensureInitialized();
    
    try {
      const team = await this.apiClient!.createTeam({ name, description });
      return {
        success: true,
        data: team
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create team'
      };
    }
  }
  
  async deleteTeam(teamId: string): Promise<PlatformResponse> {
    this.ensureInitialized();
    
    try {
      await this.apiClient!.deleteTeam(teamId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete team'
      };
    }
  }
  
  async getUserPermissions(userId: string): Promise<PlatformResponse<any>> {
    this.ensureInitialized();
    
    try {
      const permissions = await this.apiClient!.getUserPermissions(userId);
      return {
        success: true,
        data: permissions
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user permissions'
      };
    }
  }
  
  async updateUserPermissions(userId: string, permissions: any): Promise<PlatformResponse> {
    this.ensureInitialized();
    
    try {
      await this.apiClient!.updateUserPermissions(userId, permissions);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user permissions'
      };
    }
  }
  
  async getUserActivity(userId: string, options?: { startDate?: Date; endDate?: Date }): Promise<PlatformResponse<any[]>> {
    this.ensureInitialized();
    
    try {
      const activity = await this.apiClient!.getUserActivity(userId, options);
      return {
        success: true,
        data: activity
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user activity'
      };
    }
  }
}

// Export singleton instance
export const amoveModule = new aMoveModule();