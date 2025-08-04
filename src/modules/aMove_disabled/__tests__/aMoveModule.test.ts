import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aMoveModule } from '../aMoveModule';
import { aMoveApiClient } from '../aMoveApiClient';
import type { PlatformUserStatus } from '../../../types/platform.types';

// Mock the API client
vi.mock('../aMoveApiClient', () => {
  return {
    aMoveApiClient: vi.fn().mockImplementation(() => ({
      getAccountInfo: vi.fn(),
      createUser: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      listUsers: vi.fn(),
      assignUserToTeam: vi.fn(),
      removeUserFromTeam: vi.fn(),
      listTeams: vi.fn(),
      createTeam: vi.fn(),
      deleteTeam: vi.fn(),
      getUserPermissions: vi.fn(),
      updateUserPermissions: vi.fn(),
      getUserActivity: vi.fn()
    }))
  };
});

describe('aMoveModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct metadata', () => {
      expect(aMoveModule.metadata.id).toBe('amove');
      expect(aMoveModule.metadata.name).toBe('aMove');
      expect(aMoveModule.metadata.category).toBe('file-sharing');
      expect(aMoveModule.metadata.capabilities).toContain('user-management');
      expect(aMoveModule.metadata.capabilities).toContain('group-management');
    });
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const mockApiClient = {
        getAccountInfo: vi.fn().mockResolvedValue({
          id: 'acc123',
          name: 'Test Account',
          plan: 'Enterprise',
          status: 'active'
        })
      };
      vi.mocked(aMoveApiClient).mockImplementation(() => mockApiClient as any);

      const config = {
        apiUrl: 'https://api.amove.com/v1',
        apiKey: 'test-api-key',
        accountId: 'acc123'
      };

      const result = await aMoveModule.initialize(config);
      expect(result.success).toBe(true);
      expect(mockApiClient.getAccountInfo).toHaveBeenCalled();
    });

    it('should fail initialization with invalid config', async () => {
      const result = await aMoveModule.initialize({
        apiKey: '', // Invalid - empty
        accountId: 'acc123'
      } as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid config');
    });
  });

  describe('user management', () => {
    beforeEach(async () => {
      const mockApiClient = {
        getAccountInfo: vi.fn().mockResolvedValue({
          id: 'acc123',
          name: 'Test Account',
          plan: 'Enterprise',
          status: 'active'
        }),
        createUser: vi.fn(),
        getUser: vi.fn(),
        updateUser: vi.fn(),
        deleteUser: vi.fn(),
        listUsers: vi.fn()
      };
      vi.mocked(aMoveApiClient).mockImplementation(() => mockApiClient as any);

      await aMoveModule.initialize({
        apiUrl: 'https://api.amove.com/v1',
        apiKey: 'test-api-key',
        accountId: 'acc123'
      });
    });

    it('should create a user successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        active: true,
        createdAt: '2024-01-01T00:00:00Z'
      };

      const mockApiClient = (aMoveApiClient as any).mock.results[0].value;
      mockApiClient.createUser.mockResolvedValue(mockUser);

      const result = await aMoveModule.createUser({
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'member'
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 'user123',
        email: 'test@example.com',
        username: 'test@example.com',
        displayName: 'Test User',
        status: PlatformUserStatus.ACTIVE
      });
    });

    it('should handle user creation errors', async () => {
      const mockApiClient = (aMoveApiClient as any).mock.results[0].value;
      mockApiClient.createUser.mockRejectedValue(new Error('User already exists'));

      const result = await aMoveModule.createUser({
        email: 'test@example.com',
        fullName: 'Test User'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('User already exists');
    });

    it('should list users successfully', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          name: 'User One',
          role: 'admin',
          active: true,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          name: 'User Two',
          role: 'member',
          active: false,
          createdAt: '2024-01-02T00:00:00Z'
        }
      ];

      const mockApiClient = (aMoveApiClient as any).mock.results[0].value;
      mockApiClient.listUsers.mockResolvedValue(mockUsers);

      const result = await aMoveModule.listUsers();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].status).toBe(PlatformUserStatus.ACTIVE);
      expect(result.data?.[1].status).toBe(PlatformUserStatus.INACTIVE);
    });
  });

  describe('team management', () => {
    beforeEach(async () => {
      const mockApiClient = {
        getAccountInfo: vi.fn().mockResolvedValue({
          id: 'acc123',
          name: 'Test Account',
          plan: 'Enterprise',
          status: 'active'
        }),
        createTeam: vi.fn(),
        listTeams: vi.fn(),
        deleteTeam: vi.fn(),
        assignUserToTeam: vi.fn(),
        removeUserFromTeam: vi.fn()
      };
      vi.mocked(aMoveApiClient).mockImplementation(() => mockApiClient as any);

      await aMoveModule.initialize({
        apiUrl: 'https://api.amove.com/v1',
        apiKey: 'test-api-key',
        accountId: 'acc123'
      });
    });

    it('should create a team successfully', async () => {
      const mockTeam = {
        id: 'team123',
        name: 'Engineering',
        description: 'Engineering team',
        memberCount: 0,
        createdAt: '2024-01-01T00:00:00Z'
      };

      const mockApiClient = (aMoveApiClient as any).mock.results[0].value;
      mockApiClient.createTeam.mockResolvedValue(mockTeam);

      const result = await aMoveModule.createTeam('Engineering', 'Engineering team');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTeam);
    });

    it('should assign user to team successfully', async () => {
      const mockApiClient = (aMoveApiClient as any).mock.results[0].value;
      mockApiClient.assignUserToTeam.mockResolvedValue(undefined);

      const result = await aMoveModule.assignUserToTeam('user123', 'team123');

      expect(result.success).toBe(true);
      expect(mockApiClient.assignUserToTeam).toHaveBeenCalledWith('user123', 'team123');
    });
  });

  describe('permissions management', () => {
    beforeEach(async () => {
      const mockApiClient = {
        getAccountInfo: vi.fn().mockResolvedValue({
          id: 'acc123',
          name: 'Test Account',
          plan: 'Enterprise',
          status: 'active'
        }),
        getUserPermissions: vi.fn(),
        updateUserPermissions: vi.fn()
      };
      vi.mocked(aMoveApiClient).mockImplementation(() => mockApiClient as any);

      await aMoveModule.initialize({
        apiUrl: 'https://api.amove.com/v1',
        apiKey: 'test-api-key',
        accountId: 'acc123'
      });
    });

    it('should get user permissions successfully', async () => {
      const mockPermissions = {
        canUpload: true,
        canDownload: true,
        canDelete: false,
        canShare: true,
        canManageUsers: false
      };

      const mockApiClient = (aMoveApiClient as any).mock.results[0].value;
      mockApiClient.getUserPermissions.mockResolvedValue(mockPermissions);

      const result = await aMoveModule.getUserPermissions('user123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPermissions);
    });

    it('should update user permissions successfully', async () => {
      const mockApiClient = (aMoveApiClient as any).mock.results[0].value;
      mockApiClient.updateUserPermissions.mockResolvedValue(undefined);

      const newPermissions = {
        canUpload: true,
        canDownload: true,
        canDelete: true,
        canShare: true,
        canManageUsers: true
      };

      const result = await aMoveModule.updateUserPermissions('user123', newPermissions);

      expect(result.success).toBe(true);
      expect(mockApiClient.updateUserPermissions).toHaveBeenCalledWith('user123', newPermissions);
    });
  });
});