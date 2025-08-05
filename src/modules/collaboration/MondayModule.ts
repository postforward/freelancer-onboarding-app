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
      return { success: false, error: 'Monday.com not initialized' };
    }

    // Use mock response in development/mock mode
    if (useMockData()) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Simulate some failures for testing
      if (Math.random() < 0.1) { // 10% failure rate
        return { 
          success: false, 
          error: 'Mock API error: User already exists or invalid workspace' 
        };
      }

      const mockUserId = `monday-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        data: {
          id: mockUserId,
          email: credentials.email,
          username: credentials.email,
          metadata: {
            workspace_id: this.config.workspaceId,
            user_email: credentials.email,
            created_at: new Date().toISOString(),
            status: 'active'
          }
        }
      };
    }

    try {
      // Monday.com doesn't have a direct "create user" API for external integrations
      // This would typically be done through invitations
      const query = `
        mutation {
          add_users_to_account (
            user_data: [{
              name: "${credentials.firstName} ${credentials.lastName}",
              email: "${credentials.email}"
            }]
          ) {
            id
            name
            email
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
          error: `Failed to create user: ${result.errors[0].message}`,
        };
      }

      return {
        success: true,
        data: {
          id: result.data?.add_users_to_account?.[0]?.id,
          email: credentials.email,
          name: `${credentials.firstName} ${credentials.lastName}`,
          status: 'invited',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
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

  validateConfig(config: PlatformConfig): boolean {
    return !!(config.apiToken && typeof config.apiToken === 'string' && config.apiToken.length > 0);
  }
}