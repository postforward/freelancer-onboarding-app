import axios, { AxiosInstance, AxiosError } from 'axios';
import { TrueNASConfig, TrueNASGroup, TrueNASShare } from './schemas';

interface TrueNASUser {
  id: number;
  uid: number;
  username: string;
  full_name: string;
  email?: string;
  group: {
    id: number;
    gid: number;
    name: string;
  };
  groups: number[];
  home: string;
  shell: string;
  locked: boolean;
  smb: boolean;
  sshpubkey?: string;
  builtin: boolean;
}

interface TrueNASGroupResponse {
  id: number;
  gid: number;
  name: string;
  builtin: boolean;
  sudo: boolean;
  smb: boolean;
  users: number[];
}

interface TrueNASSMBShare {
  id: number;
  name: string;
  path: string;
  comment?: string;
  enabled: boolean;
  browsable: boolean;
  readonly: boolean;
  guestok: boolean;
  hostsallow?: string[];
  hostsdeny?: string[];
  auxsmbconf?: string;
}

interface CreateUserRequest {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  group?: number;
  groups?: number[];
  home?: string;
  shell?: string;
  smb?: boolean;
  locked?: boolean;
}

interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  password?: string;
  group?: number;
  groups?: number[];
  home?: string;
  shell?: string;
  smb?: boolean;
  locked?: boolean;
}

export class TrueNASApiClient {
  private client: AxiosInstance;
  private config: TrueNASConfig;
  
  constructor(config: TrueNASConfig) {
    this.config = config;
    
    // Create axios instance with TrueNAS API configuration
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: config.timeout || 30000,
      validateStatus: (status) => status < 500,
      httpsAgent: config.verifySsl === false ? { rejectUnauthorized: false } : undefined
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
        case 422:
          throw new Error(`Validation error: ${message}`);
        case 500:
        case 502:
        case 503:
          throw new Error('TrueNAS service is temporarily unavailable');
        default:
          throw new Error(`TrueNAS API error: ${message}`);
      }
    } else if (error.request) {
      throw new Error('No response from TrueNAS. Please check your connection');
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
  
  // User Management
  async createUser(data: CreateUserRequest): Promise<TrueNASUser> {
    const response = await this.client.post<TrueNASUser>('/user', {
      ...data,
      password_disabled: false,
      microsoft_account: false,
      smb: data.smb !== false, // Default to true
      shell: data.shell || '/usr/bin/zsh'
    });
    return response.data;
  }
  
  async getUser(userId: number): Promise<TrueNASUser> {
    const response = await this.client.get<TrueNASUser>(`/user/id/${userId}`);
    return response.data;
  }
  
  async getUserByUsername(username: string): Promise<TrueNASUser | null> {
    const response = await this.client.get<TrueNASUser[]>('/user', {
      params: {
        limit: 1,
        offset: 0,
        order_by: ['username'],
        query_filters: JSON.stringify([['username', '=', username]])
      }
    });
    return response.data.length > 0 ? response.data[0] : null;
  }
  
  async updateUser(userId: number, data: UpdateUserRequest): Promise<TrueNASUser> {
    const response = await this.client.put<TrueNASUser>(`/user/id/${userId}`, data);
    return response.data;
  }
  
  async deleteUser(userId: number): Promise<void> {
    await this.client.delete(`/user/id/${userId}`);
  }
  
  async listUsers(options?: { 
    limit?: number; 
    offset?: number; 
    includeBuiltin?: boolean 
  }): Promise<TrueNASUser[]> {
    const params: any = {
      limit: options?.limit || 50,
      offset: options?.offset || 0,
      order_by: ['username']
    };
    
    if (!options?.includeBuiltin) {
      params.query_filters = JSON.stringify([['builtin', '=', false]]);
    }
    
    const response = await this.client.get<TrueNASUser[]>('/user', { params });
    return response.data;
  }
  
  // Group Management
  async createGroup(data: TrueNASGroup): Promise<TrueNASGroupResponse> {
    const response = await this.client.post<TrueNASGroupResponse>('/group', {
      name: data.name,
      gid: data.gid,
      sudo: data.sudo || false,
      smb: data.smb !== false // Default to true
    });
    return response.data;
  }
  
  async getGroup(groupId: number): Promise<TrueNASGroupResponse> {
    const response = await this.client.get<TrueNASGroupResponse>(`/group/id/${groupId}`);
    return response.data;
  }
  
  async getGroupByName(name: string): Promise<TrueNASGroupResponse | null> {
    const response = await this.client.get<TrueNASGroupResponse[]>('/group', {
      params: {
        limit: 1,
        offset: 0,
        query_filters: JSON.stringify([['name', '=', name]])
      }
    });
    return response.data.length > 0 ? response.data[0] : null;
  }
  
  async updateGroup(groupId: number, data: Partial<TrueNASGroup>): Promise<TrueNASGroupResponse> {
    const response = await this.client.put<TrueNASGroupResponse>(`/group/id/${groupId}`, data);
    return response.data;
  }
  
  async deleteGroup(groupId: number): Promise<void> {
    await this.client.delete(`/group/id/${groupId}`);
  }
  
  async listGroups(options?: { includeBuiltin?: boolean }): Promise<TrueNASGroupResponse[]> {
    const params: any = {
      limit: 100,
      offset: 0,
      order_by: ['name']
    };
    
    if (!options?.includeBuiltin) {
      params.query_filters = JSON.stringify([['builtin', '=', false]]);
    }
    
    const response = await this.client.get<TrueNASGroupResponse[]>('/group', { params });
    return response.data;
  }
  
  async addUserToGroup(userId: number, groupId: number): Promise<void> {
    const user = await this.getUser(userId);
    const currentGroups = user.groups || [];
    
    if (!currentGroups.includes(groupId)) {
      await this.updateUser(userId, {
        groups: [...currentGroups, groupId]
      });
    }
  }
  
  async removeUserFromGroup(userId: number, groupId: number): Promise<void> {
    const user = await this.getUser(userId);
    const currentGroups = user.groups || [];
    
    if (currentGroups.includes(groupId)) {
      await this.updateUser(userId, {
        groups: currentGroups.filter(id => id !== groupId)
      });
    }
  }
  
  // SMB Share Management
  async createSMBShare(data: TrueNASShare): Promise<TrueNASSMBShare> {
    const response = await this.client.post<TrueNASSMBShare>('/sharing/smb', {
      name: data.name,
      path: data.path,
      comment: data.comment,
      enabled: data.enabled !== false,
      browsable: data.browsable !== false,
      ro: data.readonly === true,
      guestok: data.guestok === true,
      hostsallow: data.hostsallow || [],
      hostsdeny: data.hostsdeny || []
    });
    return response.data;
  }
  
  async getSMBShare(shareId: number): Promise<TrueNASSMBShare> {
    const response = await this.client.get<TrueNASSMBShare>(`/sharing/smb/id/${shareId}`);
    return response.data;
  }
  
  async updateSMBShare(shareId: number, data: Partial<TrueNASShare>): Promise<TrueNASSMBShare> {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.path !== undefined) updateData.path = data.path;
    if (data.comment !== undefined) updateData.comment = data.comment;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.browsable !== undefined) updateData.browsable = data.browsable;
    if (data.readonly !== undefined) updateData.ro = data.readonly;
    if (data.guestok !== undefined) updateData.guestok = data.guestok;
    if (data.hostsallow !== undefined) updateData.hostsallow = data.hostsallow;
    if (data.hostsdeny !== undefined) updateData.hostsdeny = data.hostsdeny;
    
    const response = await this.client.put<TrueNASSMBShare>(`/sharing/smb/id/${shareId}`, updateData);
    return response.data;
  }
  
  async deleteSMBShare(shareId: number): Promise<void> {
    await this.client.delete(`/sharing/smb/id/${shareId}`);
  }
  
  async listSMBShares(): Promise<TrueNASSMBShare[]> {
    const response = await this.client.get<TrueNASSMBShare[]>('/sharing/smb');
    return response.data;
  }
  
  // ACL and Permissions
  async setSharePermissions(path: string, options: {
    owner?: string;
    group?: string;
    mode?: string;
    recursive?: boolean;
  }): Promise<void> {
    await this.client.post('/filesystem/setperm', {
      path,
      uid: options.owner,
      gid: options.group,
      mode: options.mode || '770',
      options: {
        recursive: options.recursive === true,
        traverse: false
      }
    });
  }
  
  async getShareACL(path: string): Promise<any> {
    const response = await this.client.post('/filesystem/getacl', { path });
    return response.data;
  }
  
  async setShareACL(path: string, acl: any): Promise<void> {
    await this.client.post('/filesystem/setacl', {
      path,
      dacl: acl,
      options: {
        recursive: true,
        traverse: false
      }
    });
  }
  
  // System Information
  async testConnection(): Promise<{ version: string; hostname: string }> {
    const response = await this.client.get('/system/info');
    return {
      version: response.data.version,
      hostname: response.data.hostname
    };
  }
}