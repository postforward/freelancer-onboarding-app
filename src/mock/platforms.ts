import type { PlatformResponse } from '../types/platform.types';

// Simple type for mock platforms (not actual class instances)
type MockPlatform = {
  id?: string;
  name?: string;
  description?: string;
  icon?: any;
  configSchema?: any;
  metadata: any;
  initialize: (config: any) => Promise<PlatformResponse>;
  testConnection: () => Promise<PlatformResponse>;
  createUser: (credentials: any) => Promise<PlatformResponse>;
  updateUser: (userId: string, updates: any) => Promise<PlatformResponse>;
  deleteUser: (userId: string) => Promise<PlatformResponse>;
  getUser: (userId: string) => Promise<PlatformResponse>;
  listUsers: () => Promise<PlatformResponse>;
  validateConfig: (config: any) => boolean;
  getRequiredConfigFields: () => string[];
};

// Mock delay helper
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Amove API responses
const mockAmoveResponses = {
  createUser: (userData: any) => ({
    success: Math.random() > 0.1, // 90% success rate
    data: {
      id: `amove-${Date.now()}`,
      email: userData.email,
      profile_url: `https://amove.com/profile/${Date.now()}`,
      metadata: {
        rating: 0,
        verified: false
      }
    },
    error: Math.random() > 0.9 ? 'Failed to create user on Amove platform' : undefined
  }),
  updateUser: (userId: string, userData: any) => ({
    success: Math.random() > 0.05, // 95% success rate
    data: {
      id: userId,
      ...userData,
      updated_at: new Date().toISOString()
    },
    error: Math.random() > 0.95 ? 'Failed to update user on Amove platform' : undefined
  }),
  deleteUser: (userId: string) => ({
    success: Math.random() > 0.02, // 98% success rate
    data: { id: userId, deleted: true },
    error: Math.random() > 0.98 ? 'Failed to delete user from Amove platform' : undefined
  }),
  testConnection: () => ({
    success: Math.random() > 0.05, // 95% success rate
    data: {
      status: 'connected',
      response_time: Math.floor(Math.random() * 200) + 50,
      api_version: 'v1.2.3'
    },
    error: Math.random() > 0.95 ? 'Connection timeout' : undefined
  })
};

// Mock Upwork platform
export const mockUpworkPlatform: MockPlatform = {
  id: 'upwork',
  name: 'Upwork',
  description: 'Global freelancing platform for finding and hiring freelancers',
  icon: 'https://cdn.worldvectorlogo.com/logos/upwork-1.svg',
  configSchema: {
    type: 'object',
    properties: {
      clientId: { type: 'string', title: 'Client ID' },
      clientSecret: { type: 'string', title: 'Client Secret', secret: true },
      redirectUri: { type: 'string', title: 'Redirect URI' }
    },
    required: ['clientId', 'clientSecret', 'redirectUri']
  },

  async testConnection(): Promise<PlatformResponse> {
    await delay(Math.random() * 1000 + 200);
    
    // Mock validation - randomly fail sometimes
    if (Math.random() > 0.9) {
      return {
        success: false,
        error: 'Mock configuration validation failed'
      };
    }

    return {
      success: Math.random() > 0.1,
      data: {
        status: 'connected',
        response_time: Math.floor(Math.random() * 300) + 100,
        api_version: 'v2.0'
      },
      error: Math.random() > 0.9 ? 'OAuth authentication failed' : undefined
    };
  },

  async createUser(userData: any): Promise<PlatformResponse> {
    await delay(Math.random() * 2000 + 500);
    
    const shouldFail = Math.random() < 0.15; // 15% failure rate
    
    if (shouldFail) {
      const errors = [
        'Email already exists on Upwork',
        'Invalid profile data provided',
        'Rate limit exceeded',
        'Upwork API temporarily unavailable'
      ];
      return {
        success: false,
        error: errors[Math.floor(Math.random() * errors.length)]
      };
    }

    return {
      success: true,
      data: {
        id: `upwork-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        email: userData.email,
        profile_url: `https://upwork.com/freelancers/${Date.now()}`,
        metadata: {
          rating: 0,
          earnings: 0,
          completed_jobs: 0
        }
      }
    };
  },

  async updateUser(userId: string, userData: any): Promise<PlatformResponse> {
    await delay(Math.random() * 1500 + 300);
    
    return {
      success: Math.random() > 0.05,
      data: {
        id: userId,
        ...userData,
        updated_at: new Date().toISOString()
      },
      error: Math.random() > 0.95 ? 'Failed to update Upwork profile' : undefined
    };
  },

  async deleteUser(userId: string): Promise<PlatformResponse> {
    await delay(Math.random() * 1000 + 400);
    
    return {
      success: Math.random() > 0.03,
      data: { id: userId, deleted: true },
      error: Math.random() > 0.97 ? 'Cannot delete active Upwork profile' : undefined
    };
  },

  metadata: {
    id: 'upwork',
    name: 'Upwork',
    displayName: 'Upwork',
    description: 'Global freelancing platform for finding and hiring freelancers',
    category: 'freelance-platforms',
    requiresAuth: true
  },

  async initialize(config: any): Promise<PlatformResponse> {
    await delay(100);
    return { success: true, data: { initialized: true } };
  },

  async getUser(userId: string): Promise<PlatformResponse> {
    await delay(Math.random() * 500 + 100);
    return {
      success: Math.random() > 0.1,
      data: {
        id: userId,
        email: `user${userId}@example.com`,
        profile_url: `https://upwork.com/freelancers/${userId}`
      },
      error: Math.random() > 0.9 ? 'User not found' : undefined
    };
  },

  async listUsers(): Promise<PlatformResponse> {
    await delay(Math.random() * 800 + 200);
    return {
      success: true,
      data: [
        { id: 'user1', email: 'user1@example.com' },
        { id: 'user2', email: 'user2@example.com' }
      ]
    };
  },

  validateConfig(config: any): boolean {
    return !!(config.clientId && config.clientSecret && config.redirectUri);
  },

  getRequiredConfigFields(): string[] {
    return ['clientId', 'clientSecret', 'redirectUri'];
  }
};

// Mock Amove platform
export const mockAmovePlatform: MockPlatform = {
  id: 'amove',
  name: 'Amove',
  description: 'Professional freelancer marketplace with advanced project management',
  icon: 'https://via.placeholder.com/32/4F46E5/white?text=A',  // Placeholder, replace with actual
  configSchema: {
    type: 'object',
    properties: {
      apiKey: { type: 'string', title: 'API Key', secret: true },
      apiSecret: { type: 'string', title: 'API Secret', secret: true },
      baseUrl: { type: 'string', title: 'Base URL', default: 'https://api.amove.com/v1' }
    },
    required: ['apiKey', 'apiSecret']
  },

  async testConnection(): Promise<PlatformResponse> {
    await delay(Math.random() * 800 + 150);
    return mockAmoveResponses.testConnection();
  },

  async createUser(userData: any): Promise<PlatformResponse> {
    await delay(Math.random() * 1800 + 600);
    return mockAmoveResponses.createUser(userData);
  },

  async updateUser(userId: string, userData: any): Promise<PlatformResponse> {
    await delay(Math.random() * 1200 + 400);
    return mockAmoveResponses.updateUser(userId, userData);
  },

  async deleteUser(userId: string): Promise<PlatformResponse> {
    await delay(Math.random() * 1000 + 300);
    return mockAmoveResponses.deleteUser(userId);
  },

  metadata: {
    id: 'amove',
    name: 'aMove',
    displayName: 'aMove',
    description: 'Platform integration for aMove',
    category: 'platforms',
    requiresAuth: true
  },

  async initialize(config: any): Promise<PlatformResponse> {
    await delay(100);
    return { success: true, data: { initialized: true } };
  },

  async getUser(userId: string): Promise<PlatformResponse> {
    await delay(Math.random() * 500 + 100);
    return {
      success: Math.random() > 0.1,
      data: {
        id: userId,
        email: `user${userId}@example.com`,
        profile_url: `https://amove.com/profile/${userId}`
      },
      error: Math.random() > 0.9 ? 'User not found' : undefined
    };
  },

  async listUsers(): Promise<PlatformResponse> {
    await delay(Math.random() * 800 + 200);
    return {
      success: true,
      data: [
        { id: 'user1', email: 'user1@example.com' },
        { id: 'user2', email: 'user2@example.com' }
      ]
    };
  },

  validateConfig(config: any): boolean {
    return !!(config.apiKey && config.apiSecret);
  },

  getRequiredConfigFields(): string[] {
    return ['apiKey', 'apiSecret', 'baseUrl'];
  }
};

// Mock Fiverr platform
export const mockFiverrPlatform: MockPlatform = {
  id: 'fiverr',
  name: 'Fiverr',
  description: 'Marketplace for creative and digital services starting at $5',
  icon: 'https://cdn.worldvectorlogo.com/logos/fiverr-1.svg',
  configSchema: {
    type: 'object',
    properties: {
      apiKey: { type: 'string', title: 'API Key', secret: true },
      webhook_url: { type: 'string', title: 'Webhook URL' }
    },
    required: ['apiKey']
  },

  async testConnection(): Promise<PlatformResponse> {
    await delay(Math.random() * 1200 + 200);
    
    // Fiverr is disabled in mock data, so always fail
    return {
      success: false,
      error: 'Fiverr integration is currently disabled'
    };
  },

  async createUser(_userData: any): Promise<PlatformResponse> {
    await delay(Math.random() * 2500 + 800);
    
    return {
      success: false,
      error: 'Fiverr integration is currently disabled'
    };
  },

  async updateUser(_userId: string, _userData: any): Promise<PlatformResponse> {
    await delay(Math.random() * 1500 + 400);
    
    return {
      success: false,
      error: 'Fiverr integration is currently disabled'
    };
  },

  async deleteUser(_userId: string): Promise<PlatformResponse> {
    await delay(Math.random() * 1000 + 300);
    
    return {
      success: false,
      error: 'Fiverr integration is currently disabled'
    };
  },

  metadata: {
    id: 'fiverr',
    name: 'Fiverr',
    displayName: 'Fiverr',
    description: 'Marketplace for creative and digital services starting at $5',
    category: 'freelance-platforms',
    requiresAuth: true
  },

  async initialize(_config: any): Promise<PlatformResponse> {
    return { success: false, error: 'Fiverr integration is currently disabled' };
  },

  async getUser(_userId: string): Promise<PlatformResponse> {
    return { success: false, error: 'Fiverr integration is currently disabled' };
  },

  async listUsers(): Promise<PlatformResponse> {
    return { success: false, error: 'Fiverr integration is currently disabled' };
  },

  validateConfig(_config: any): boolean {
    return false;
  },

  getRequiredConfigFields(): string[] {
    return ['apiKey', 'webhook_url'];
  }
};

// Mock Freelancer.com platform
export const mockFreelancerPlatform: MockPlatform = {
  id: 'freelancer',
  name: 'Freelancer.com',
  description: 'One of the world\'s largest freelancing and crowdsourcing marketplaces',
  icon: 'https://cdn.worldvectorlogo.com/logos/freelancer-com.svg',
  configSchema: {
    type: 'object',
    properties: {
      oAuthToken: { type: 'string', title: 'OAuth Token', secret: true },
      sandboxMode: { type: 'boolean', title: 'Sandbox Mode', default: false }
    },
    required: ['oAuthToken']
  },

  async testConnection(): Promise<PlatformResponse> {
    await delay(Math.random() * 900 + 180);
    
    // Mock validation - randomly fail sometimes
    if (Math.random() > 0.9) {
      return {
        success: false,
        error: 'Mock OAuth token validation failed'
      };
    }

    return {
      success: Math.random() > 0.08,
      data: {
        status: 'connected',
        response_time: Math.floor(Math.random() * 250) + 120,
        api_version: 'v1.0',
        sandbox: false
      },
      error: Math.random() > 0.92 ? 'Token has expired' : undefined
    };
  },

  async createUser(userData: any): Promise<PlatformResponse> {
    await delay(Math.random() * 2200 + 700);
    
    const shouldFail = Math.random() < 0.12; // 12% failure rate
    
    if (shouldFail) {
      const errors = [
        'Username already taken',
        'Invalid email format',
        'Profile verification required',
        'Freelancer.com registration temporarily disabled'
      ];
      return {
        success: false,
        error: errors[Math.floor(Math.random() * errors.length)]
      };
    }

    return {
      success: true,
      data: {
        id: `freelancer-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        email: userData.email,
        username: userData.email.split('@')[0],
        profile_url: `https://freelancer.com/u/${Date.now()}`,
        metadata: {
          rating: 0,
          badge_level: 'newcomer',
          verified: false
        }
      }
    };
  },

  async updateUser(userId: string, userData: any): Promise<PlatformResponse> {
    await delay(Math.random() * 1400 + 350);
    
    return {
      success: Math.random() > 0.04,
      data: {
        id: userId,
        ...userData,
        updated_at: new Date().toISOString()
      },
      error: Math.random() > 0.96 ? 'Profile update failed' : undefined
    };
  },

  async deleteUser(userId: string): Promise<PlatformResponse> {
    await delay(Math.random() * 1100 + 450);
    
    return {
      success: Math.random() > 0.02,
      data: { id: userId, deleted: true },
      error: Math.random() > 0.98 ? 'Account has active contracts' : undefined
    };
  },

  metadata: {
    id: 'freelancer',
    name: 'Freelancer.com',
    displayName: 'Freelancer.com',
    description: 'One of the world\'s largest freelancing and crowdsourcing marketplaces',
    category: 'freelance-platforms',
    requiresAuth: true
  },

  async initialize(config: any): Promise<PlatformResponse> {
    await delay(100);
    return { success: true, data: { initialized: true } };
  },

  async getUser(userId: string): Promise<PlatformResponse> {
    await delay(Math.random() * 500 + 100);
    return {
      success: Math.random() > 0.1,
      data: {
        id: userId,
        email: `user${userId}@example.com`,
        profile_url: `https://freelancer.com/u/${userId}`
      },
      error: Math.random() > 0.9 ? 'User not found' : undefined
    };
  },

  async listUsers(): Promise<PlatformResponse> {
    await delay(Math.random() * 800 + 200);
    return {
      success: true,
      data: [
        { id: 'user1', email: 'user1@example.com' },
        { id: 'user2', email: 'user2@example.com' }
      ]
    };
  },

  validateConfig(config: any): boolean {
    return !!(config.oAuthToken);
  },

  getRequiredConfigFields(): string[] {
    return ['oAuthToken'];
  }
};

// Mock platforms registry
export const mockPlatforms = new Map<string, MockPlatform>([
  ['amove', mockAmovePlatform],
  ['upwork', mockUpworkPlatform],
  ['fiverr', mockFiverrPlatform],
  ['freelancer', mockFreelancerPlatform]
]);

// Export individual platforms for easy import
export {
  mockAmovePlatform as amove,
  mockUpworkPlatform as upwork,
  mockFiverrPlatform as fiverr,
  mockFreelancerPlatform as freelancer
};