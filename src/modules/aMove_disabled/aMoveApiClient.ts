import axios, { AxiosInstance, AxiosError } from 'axios';
import { AMoveConfig } from './schemas';

interface AMoveUser {
  id: string;
  email: string;
  name: string;
  role: string;
  teamId?: string;
  active: boolean;
  createdAt: string;
  lastActive?: string;
}

interface AMoveTeam {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: string;
}

interface AMoveAccount {
  id: string;
  name: string;
  plan: string;
  status: string;
}

interface CreateUserRequest {
  email: string;
  name: string;
  role?: string;
  teamId?: string;
}

interface UpdateUserRequest {
  name?: string;
  role?: string;
  teamId?: string;
  active?: boolean;
}

interface CreateTeamRequest {
  name: string;
  description?: string;
}

interface AMoveActivity {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details: any;
}

export class aMoveApiClient {
  private client: AxiosInstance;
  private config: AMoveConfig;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  
  constructor(config: AMoveConfig) {
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.apiUrl || 'https://api.amove.com/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Account-ID': config.accountId,
        'Content-Type': 'application/json'
      },
      timeout: config.timeout || 30000
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => this.handleError(error)
    );
  }
  
  private async handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;
      
      switch (status) {
        case 401:
          throw new Error('Invalid API key or unauthorized access');
        case 403:
          throw new Error('Insufficient permissions');
        case 404:
          throw new Error('Resource not found');
        case 429:
          throw new Error('Rate limit exceeded. Please try again later');
        case 500:
        case 502:
        case 503:
          throw new Error('aMove service is temporarily unavailable');
        default:
          throw new Error(`aMove API error: ${message}`);
      }
    } else if (error.request) {
      throw new Error('No response from aMove. Please check your connection');
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
  
  private async retryRequest<T>(
    request: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(this.retryDelay);
        return this.retryRequest(request, retries - 1);
      }
      throw error;
    }
  }
  
  private isRetryableError(error: any): boolean {
    if (error.response) {
      const status = error.response.status;
      return status >= 500 || status === 429;
    }
    return true; // Network errors are retryable
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Account Management
  async getAccountInfo(): Promise<AMoveAccount> {
    const response = await this.retryRequest(() => 
      this.client.get<AMoveAccount>('/account')
    );
    return response.data;
  }
  
  // User Management
  async createUser(data: CreateUserRequest): Promise<AMoveUser> {
    const response = await this.retryRequest(() =>
      this.client.post<AMoveUser>('/users', data)
    );
    return response.data;
  }
  
  async getUser(userId: string): Promise<AMoveUser> {
    const response = await this.retryRequest(() =>
      this.client.get<AMoveUser>(`/users/${userId}`)
    );
    return response.data;
  }
  
  async updateUser(userId: string, data: UpdateUserRequest): Promise<AMoveUser> {
    const response = await this.retryRequest(() =>
      this.client.patch<AMoveUser>(`/users/${userId}`, data)
    );
    return response.data;
  }
  
  async deleteUser(userId: string): Promise<void> {
    await this.retryRequest(() =>
      this.client.delete(`/users/${userId}`)
    );
  }
  
  async listUsers(options?: { teamId?: string; page?: number; limit?: number }): Promise<AMoveUser[]> {
    const params = new URLSearchParams();
    if (options?.teamId) params.append('teamId', options.teamId);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const response = await this.retryRequest(() =>
      this.client.get<{ users: AMoveUser[] }>('/users', { params })
    );
    return response.data.users;
  }
  
  // Team Management
  async createTeam(data: CreateTeamRequest): Promise<AMoveTeam> {
    const response = await this.retryRequest(() =>
      this.client.post<AMoveTeam>('/teams', data)
    );
    return response.data;
  }
  
  async getTeam(teamId: string): Promise<AMoveTeam> {
    const response = await this.retryRequest(() =>
      this.client.get<AMoveTeam>(`/teams/${teamId}`)
    );
    return response.data;
  }
  
  async updateTeam(teamId: string, data: Partial<CreateTeamRequest>): Promise<AMoveTeam> {
    const response = await this.retryRequest(() =>
      this.client.patch<AMoveTeam>(`/teams/${teamId}`, data)
    );
    return response.data;
  }
  
  async deleteTeam(teamId: string): Promise<void> {
    await this.retryRequest(() =>
      this.client.delete(`/teams/${teamId}`)
    );
  }
  
  async listTeams(): Promise<AMoveTeam[]> {
    const response = await this.retryRequest(() =>
      this.client.get<{ teams: AMoveTeam[] }>('/teams')
    );
    return response.data.teams;
  }
  
  async assignUserToTeam(userId: string, teamId: string): Promise<void> {
    await this.retryRequest(() =>
      this.client.post(`/teams/${teamId}/members`, { userId })
    );
  }
  
  async removeUserFromTeam(userId: string, teamId: string): Promise<void> {
    await this.retryRequest(() =>
      this.client.delete(`/teams/${teamId}/members/${userId}`)
    );
  }
  
  async getTeamMembers(teamId: string): Promise<AMoveUser[]> {
    const response = await this.retryRequest(() =>
      this.client.get<{ members: AMoveUser[] }>(`/teams/${teamId}/members`)
    );
    return response.data.members;
  }
  
  // Permissions Management
  async getUserPermissions(userId: string): Promise<any> {
    const response = await this.retryRequest(() =>
      this.client.get(`/users/${userId}/permissions`)
    );
    return response.data;
  }
  
  async updateUserPermissions(userId: string, permissions: any): Promise<void> {
    await this.retryRequest(() =>
      this.client.put(`/users/${userId}/permissions`, permissions)
    );
  }
  
  async getTeamPermissions(teamId: string): Promise<any> {
    const response = await this.retryRequest(() =>
      this.client.get(`/teams/${teamId}/permissions`)
    );
    return response.data;
  }
  
  async updateTeamPermissions(teamId: string, permissions: any): Promise<void> {
    await this.retryRequest(() =>
      this.client.put(`/teams/${teamId}/permissions`, permissions)
    );
  }
  
  // Activity Monitoring
  async getUserActivity(
    userId: string, 
    options?: { 
      startDate?: Date; 
      endDate?: Date; 
      limit?: number;
      action?: string;
    }
  ): Promise<AMoveActivity[]> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate.toISOString());
    if (options?.endDate) params.append('endDate', options.endDate.toISOString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.action) params.append('action', options.action);
    
    const response = await this.retryRequest(() =>
      this.client.get<{ activities: AMoveActivity[] }>(`/users/${userId}/activity`, { params })
    );
    return response.data.activities;
  }
  
  async getTeamActivity(
    teamId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<AMoveActivity[]> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate.toISOString());
    if (options?.endDate) params.append('endDate', options.endDate.toISOString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const response = await this.retryRequest(() =>
      this.client.get<{ activities: AMoveActivity[] }>(`/teams/${teamId}/activity`, { params })
    );
    return response.data.activities;
  }
  
  // Share Management
  async createShare(data: {
    name: string;
    path: string;
    teamId?: string;
    permissions?: any;
  }): Promise<any> {
    const response = await this.retryRequest(() =>
      this.client.post('/shares', data)
    );
    return response.data;
  }
  
  async getShare(shareId: string): Promise<any> {
    const response = await this.retryRequest(() =>
      this.client.get(`/shares/${shareId}`)
    );
    return response.data;
  }
  
  async updateSharePermissions(shareId: string, permissions: any): Promise<void> {
    await this.retryRequest(() =>
      this.client.put(`/shares/${shareId}/permissions`, permissions)
    );
  }
  
  async deleteShare(shareId: string): Promise<void> {
    await this.retryRequest(() =>
      this.client.delete(`/shares/${shareId}`)
    );
  }
  
  async listShares(options?: { teamId?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (options?.teamId) params.append('teamId', options.teamId);
    
    const response = await this.retryRequest(() =>
      this.client.get<{ shares: any[] }>('/shares', { params })
    );
    return response.data.shares;
  }
}