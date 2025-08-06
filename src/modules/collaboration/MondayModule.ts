// Monday.com Module - Simple collaboration platform integration

import { PlatformCategory } from '../../types/platform.types';
import type {
  PlatformResponse,
  PlatformUser,
  PlatformConfig,
  PlatformCredentials,
  PlatformMetadata,
  IPlatformModule
} from '../../types/platform.types';
import { z } from 'zod';
import { useMockData } from '../../config/environment';

export class MondayModule implements IPlatformModule {
  public readonly metadata: PlatformMetadata = {
    id: 'monday',
    name: 'monday',
    displayName: 'Monday.com',
    description: 'Work management platform that helps teams collaborate and track projects',
    category: PlatformCategory.COLLABORATION,
    icon: '📊',
    color: '#FF3D71',
    website: 'https://monday.com',
    documentation: 'https://developer.monday.com/api-reference/',
    documentationUrl: 'https://developer.monday.com/api-reference/',
    features: [
      'Project management',
      'Team collaboration',
      'Task tracking',
      'Customizable boards',
      'Automation',
      'Reporting & Analytics',
    ],
    capabilities: [
      'user-management',
      'team-collaboration',
      'project-management',
      'activity-monitoring',
    ],
    requiredFields: ['apiToken'],
    optionalFields: ['workspaceId'],
    configSchema: z.object({
      apiToken: z.string().min(1, 'API Token is required').describe('Your Monday.com API token (get from Admin > Developers > API)'),
      workspaceId: z.string().optional().describe('Specific workspace ID (optional - will use main workspace if not provided)'),
    }),
  };
  
  private config: PlatformConfig = {};
  private isInitialized: boolean = false;
  
  getRequiredConfigFields(): string[] {
    return ['apiToken'];
  }
  
  async initialize(config: PlatformConfig): Promise<PlatformResponse> {
    try {
      if (!config.apiToken) {
        return {
          success: false,
          error: 'Monday.com requires an API token',
        };
      }

      this.config = config;
      this.isInitialized = true;

      return {
        success: true,
        data: {
          message: 'Monday.com module initialized successfully',
          config: {
            hasToken: !!config.apiToken,
            workspaceId: config.workspaceId || 'main'
          }
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize Monday.com: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async testConnection(): Promise<PlatformResponse> {
    if (!this.isInitialized || !this.config.apiToken) {
      return {
        success: false,
        error: 'Monday.com not initialized. Please provide API token.',
      };
    }

    // Use mock response in development/mock mode
    if (useMockData()) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      // Simulate occasional connection failures for testing
      if (Math.random() < 0.05) { // 5% failure rate
        return { 
          success: false, 
          error: 'Mock connection error: Invalid API token or network timeout' 
        };
      }

      return {
        success: true,
        data: {
          connected: true,
          account: {
            name: 'Mock Monday.com Account',
            id: 'mock-account-123',
            plan: 'Pro'
          },
          user: {
            id: 'mock-user-456',
            name: 'Mock User',
            email: 'mock.user@example.com'
          },
          workspace: {
            id: this.config.workspaceId || 'mock-workspace-123',
            name: 'Mock Workspace'
          }
        }
      };
    }

    try {
      // Test the Monday.com API by getting user info
      const query = `
        query {
          me {
            id
            name
            email
            account {
              name
              id
            }
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.apiToken as string,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Monday.com API error: ${response.status} - ${errorText}`,
        };
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        return {
          success: false,
          error: `Monday.com API error: ${result.errors[0].message}`,
        };
      }

      const userData = result.data?.me;
      if (!userData) {
        return {
          success: false,
          error: 'Unable to retrieve user data from Monday.com API',
        };
      }

      return {
        success: true,
        data: {
          status: 'connected',
          user: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
          },
          account: {
            name: userData.account?.name,
            id: userData.account?.id,
          },
          apiVersion: 'v2',
          response_time: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to connect to Monday.com: ${error instanceof Error ? error.message : 'Network error'}`,
      };
    }
  }

  async createUser(credentials: PlatformCredentials): Promise<PlatformResponse> {
    if (!this.isInitialized) {
      return { 
        success: false, 
        error: 'Monday.com not initialized. Please configure the Monday.com integration first.' 
      };
    }

    // Use mock response in development/mock mode
    if (useMockData()) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Return success with pending invitation status
      const mockUserId = `monday-pending-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        data: {
          id: mockUserId,
          email: credentials.email,
          username: credentials.email,
          status: 'pending_invitation',
          requiresManualInvitation: true,
          invitationInstructions: 'User has been added to the system. Please invite them manually through Monday.com\'s Admin panel.',
          metadata: {
            workspace_id: this.config.workspaceId || 'main',
            user_email: credentials.email,
            created_at: new Date().toISOString(),
            manual_invitation_required: true
          }
        }
      };
    }

    // Monday.com doesn't support direct user creation via API for security reasons
    // Users must be invited manually through the Monday.com interface
    // We'll return success but indicate manual invitation is required
    try {
      // First, check if user already exists in the workspace
      const existingUserCheck = await this.checkIfUserExists(credentials.email);
      
      if (existingUserCheck.exists) {
        return {
          success: true,
          data: {
            id: existingUserCheck.userId,
            email: credentials.email,
            name: credentials.fullName || `${credentials.firstName} ${credentials.lastName}`,
            status: 'active',
            message: 'User already exists in Monday.com workspace'
          }
        };
      }

      // Generate a placeholder ID for tracking
      const placeholderId = `monday-pending-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      return {
        success: true,
        data: {
          id: placeholderId,
          email: credentials.email,
          name: credentials.fullName || `${credentials.firstName} ${credentials.lastName}`,
          status: 'pending_invitation',
          requiresManualInvitation: true,
          invitationInstructions: `User has been added to the system. To complete setup:\n\n1. Go to your Monday.com Admin panel\n2. Navigate to Account > Users\n3. Click "Invite Users"\n4. Send invitation to: ${credentials.email}\n5. User will receive an email invitation to join the workspace`,
          metadata: {
            workspace_id: this.config.workspaceId || 'main',
            user_email: credentials.email,
            created_at: new Date().toISOString(),
            manual_invitation_required: true,
            platform_instructions: 'Manual invitation required through Monday.com Admin panel'
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Monday.com user setup failed: ${error instanceof Error ? error.message : 'Unknown error'}. Note: Monday.com requires manual user invitations through their Admin panel.`,
      };
    }
  }

  // Helper method to check if user already exists
  private async checkIfUserExists(email: string): Promise<{ exists: boolean; userId?: string }> {
    try {
      const query = `
        query {
          users {
            id
            email
            name
            enabled
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.apiToken as string,
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        // If we can't check, assume user doesn't exist
        return { exists: false };
      }

      const users = result.data?.users || [];
      const existingUser = users.find((user: any) => 
        user.email && user.email.toLowerCase() === email.toLowerCase()
      );

      return {
        exists: !!existingUser,
        userId: existingUser?.id
      };
    } catch (error) {
      // If we can't check, assume user doesn't exist
      return { exists: false };
    }
  }

  async updateUser(userId: string, updates: Partial<PlatformUser>): Promise<PlatformResponse> {
    if (!this.isInitialized) {
      return { success: false, error: 'Monday.com not initialized' };
    }

    // Monday.com has limited user update capabilities via API
    // Most user management is done through the UI
    return {
      success: false,
      error: 'Monday.com user updates must be done through the Monday.com interface',
    };
  }

  async deleteUser(userId: string): Promise<PlatformResponse> {
    if (!this.isInitialized) {
      return { success: false, error: 'Monday.com not initialized' };
    }

    // Use mock response in development/mock mode
    if (useMockData()) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      // Simulate occasional failures for testing
      if (Math.random() < 0.05) { // 5% failure rate
        return { 
          success: false, 
          error: 'Mock API error: User not found or insufficient permissions' 
        };
      }

      return {
        success: true,
        data: {
          deleted: true,
          userId: userId,
          timestamp: new Date().toISOString()
        }
      };
    }

    try {
      const query = `
        mutation {
          delete_users_from_account (user_ids: [${userId}]) {
            id
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.apiToken as string,
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        return {
          success: false,
          error: `Failed to delete user: ${result.errors[0].message}`,
        };
      }

      return {
        success: true,
        data: { id: userId, deleted: true },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getUser(userId: string): Promise<PlatformResponse> {
    if (!this.isInitialized) {
      return { success: false, error: 'Monday.com not initialized' };
    }

    try {
      const query = `
        query {
          users (ids: [${userId}]) {
            id
            name
            email
            created_at
            enabled
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.apiToken as string,
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        return {
          success: false,
          error: `Failed to get user: ${result.errors[0].message}`,
        };
      }

      const user = result.data?.users?.[0];
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          displayName: user.name,
          status: user.enabled ? 'active' : 'inactive',
          createdAt: user.created_at,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async listUsers(): Promise<PlatformResponse> {
    if (!this.isInitialized) {
      return { success: false, error: 'Monday.com not initialized' };
    }

    try {
      const query = `
        query {
          users {
            id
            name
            email
            created_at
            enabled
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.apiToken as string,
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        return {
          success: false,
          error: `Failed to list users: ${result.errors[0].message}`,
        };
      }

      const users = result.data?.users || [];

      return {
        success: true,
        data: users.map((user: any) => ({
          id: user.id,
          email: user.email,
          displayName: user.name,
          status: user.enabled ? 'active' : 'inactive',
          createdAt: user.created_at,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getStatus(): Promise<PlatformResponse<any>> {
    if (!this.isInitialized) {
      return {
        success: true,
        data: {
          initialized: false,
          connected: false,
          lastSync: undefined
        }
      };
    }

    try {
      // Try a simple query to check if the connection is working
      const testResult = await this.testConnection();
      return {
        success: true,
        data: {
          initialized: this.isInitialized,
          connected: testResult.success,
          lastSync: new Date()
        }
      };
    } catch (error) {
      return {
        success: true,
        data: {
          initialized: this.isInitialized,
          connected: false,
          lastSync: undefined,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  validateConfig(config: PlatformConfig): boolean {
    return !!(config.apiToken && typeof config.apiToken === 'string' && config.apiToken.length > 0);
  }
}