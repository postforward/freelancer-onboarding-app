import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trueNASModule } from '../TrueNASModule';
import { TrueNASApiClient } from '../TrueNASApiClient';
import { PlatformUserStatus } from '../../../types/platform.types';

// Mock the API client
vi.mock('../TrueNASApiClient', () => {
  return {
    TrueNASApiClient: vi.fn().mockImplementation(() => ({
      testConnection: vi.fn(),
      createUser: vi.fn(),
      getUser: vi.fn(),
      getUserByUsername: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      listUsers: vi.fn(),
      createGroup: vi.fn(),
      getGroup: vi.fn(),
      getGroupByName: vi.fn(),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
      listGroups: vi.fn(),
      addUserToGroup: vi.fn(),
      removeUserFromGroup: vi.fn(),
      createSMBShare: vi.fn(),
      getSMBShare: vi.fn(),
      updateSMBShare: vi.fn(),
      deleteSMBShare: vi.fn(),
      listSMBShares: vi.fn(),
      setSharePermissions: vi.fn(),
      getShareACL: vi.fn(),
      setShareACL: vi.fn()
    }))
  };
});

describe('TrueNASModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct metadata', () => {
      expect(trueNASModule.metadata.id).toBe('truenas');
      expect(trueNASModule.metadata.name).toBe('TrueNAS');
      expect(trueNASModule.metadata.category).toBe('infrastructure');
      expect(trueNASModule.metadata.capabilities).toContain('user-management');
      expect(trueNASModule.metadata.capabilities).toContain('group-management');
      expect(trueNASModule.metadata.capabilities).toContain('share-management');
    });
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const mockApiClient = {
        testConnection: vi.fn().mockResolvedValue({
          version: 'TrueNAS-13.0-U5.3',
          hostname: 'truenas.local'
        })
      };
      vi.mocked(TrueNASApiClient).mockImplementation(() => mockApiClient as any);

      const config = {
        apiUrl: 'https://truenas.local/api/v2.0',
        apiKey: 'test-api-key'
      };

      const result = await trueNASModule.initialize(config);
      expect(result.success).toBe(true);
      expect(mockApiClient.testConnection).toHaveBeenCalled();
    });

    it('should fail initialization with invalid config', async () => {
      const result = await trueNASModule.initialize({
        apiUrl: 'not-a-url', // Invalid URL
        apiKey: 'test-api-key'
      } as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid config');
    });
  });

  describe('user management', () => {
    beforeEach(async () => {
      const mockApiClient = {
        testConnection: vi.fn().mockResolvedValue({
          version: 'TrueNAS-13.0-U5.3',
          hostname: 'truenas.local'
        }),
        createUser: vi.fn(),
        getUser: vi.fn(),
        getUserByUsername: vi.fn(),
        updateUser: vi.fn(),
        deleteUser: vi.fn(),
        listUsers: vi.fn(),
        getGroupByName: vi.fn()
      };
      vi.mocked(TrueNASApiClient).mockImplementation(() => mockApiClient as any);

      await trueNASModule.initialize({
        apiUrl: 'https://truenas.local/api/v2.0',
        apiKey: 'test-api-key'
      });
    });

    it('should create a user successfully', async () => {
      const mockUser = {
        id: 1001,
        uid: 1001,
        username: 'testuser',
        full_name: 'Test User',
        email: 'test@example.com',
        group: {
          id: 100,
          gid: 100,
          name: 'users'
        },
        groups: [100],
        home: '/mnt/data/home/testuser',
        shell: '/usr/bin/zsh',
        locked: false,
        smb: true,
        builtin: false
      };

      const mockApiClient = (TrueNASApiClient as any).mock.results[0].value;
      mockApiClient.getUserByUsername.mockResolvedValue(null); // User doesn't exist
      mockApiClient.createUser.mockResolvedValue(mockUser);

      const result = await trueNASModule.createUser({
        username: 'testuser',
        password: 'SecurePass123!',
        fullName: 'Test User',
        email: 'test@example.com'
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: '1001',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        status: PlatformUserStatus.ACTIVE
      });
    });

    it('should not create user if already exists', async () => {
      const mockApiClient = (TrueNASApiClient as any).mock.results[0].value;
      mockApiClient.getUserByUsername.mockResolvedValue({
        id: 1001,
        username: 'testuser'
      });

      const result = await trueNASModule.createUser({
        username: 'testuser',
        password: 'SecurePass123!',
        fullName: 'Test User'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should list users successfully', async () => {
      const mockUsers = [
        {
          id: 1001,
          uid: 1001,
          username: 'user1',
          full_name: 'User One',
          email: 'user1@example.com',
          group: { id: 100, gid: 100, name: 'users' },
          groups: [100],
          home: '/mnt/data/home/user1',
          shell: '/usr/bin/zsh',
          locked: false,
          smb: true,
          builtin: false
        },
        {
          id: 1002,
          uid: 1002,
          username: 'user2',
          full_name: 'User Two',
          email: 'user2@example.com',
          group: { id: 100, gid: 100, name: 'users' },
          groups: [100],
          home: '/mnt/data/home/user2',
          shell: '/usr/bin/zsh',
          locked: true,
          smb: true,
          builtin: false
        }
      ];

      const mockApiClient = (TrueNASApiClient as any).mock.results[0].value;
      mockApiClient.listUsers.mockResolvedValue(mockUsers);

      const result = await trueNASModule.listUsers();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].status).toBe(PlatformUserStatus.ACTIVE);
      expect(result.data?.[1].status).toBe(PlatformUserStatus.INACTIVE);
    });
  });

  describe('group management', () => {
    beforeEach(async () => {
      const mockApiClient = {
        testConnection: vi.fn().mockResolvedValue({
          version: 'TrueNAS-13.0-U5.3',
          hostname: 'truenas.local'
        }),
        createGroup: vi.fn(),
        getGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        listGroups: vi.fn(),
        addUserToGroup: vi.fn(),
        removeUserFromGroup: vi.fn()
      };
      vi.mocked(TrueNASApiClient).mockImplementation(() => mockApiClient as any);

      await trueNASModule.initialize({
        apiUrl: 'https://truenas.local/api/v2.0',
        apiKey: 'test-api-key'
      });
    });

    it('should create a group successfully', async () => {
      const mockGroup = {
        id: 2001,
        gid: 2001,
        name: 'developers',
        builtin: false,
        sudo: false,
        smb: true,
        users: []
      };

      const mockApiClient = (TrueNASApiClient as any).mock.results[0].value;
      mockApiClient.createGroup.mockResolvedValue(mockGroup);

      const result = await trueNASModule.createGroup('developers', { smb: true });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 2001,
        gid: 2001,
        name: 'developers',
        sudo: false,
        smb: true
      });
    });

    it('should assign user to group successfully', async () => {
      const mockApiClient = (TrueNASApiClient as any).mock.results[0].value;
      mockApiClient.addUserToGroup.mockResolvedValue(undefined);

      const result = await trueNASModule.assignUserToGroup('1001', '2001');

      expect(result.success).toBe(true);
      expect(mockApiClient.addUserToGroup).toHaveBeenCalledWith(1001, 2001);
    });
  });

  describe('share management', () => {
    beforeEach(async () => {
      const mockApiClient = {
        testConnection: vi.fn().mockResolvedValue({
          version: 'TrueNAS-13.0-U5.3',
          hostname: 'truenas.local'
        }),
        createSMBShare: vi.fn(),
        getSMBShare: vi.fn(),
        updateSMBShare: vi.fn(),
        deleteSMBShare: vi.fn(),
        listSMBShares: vi.fn(),
        setSharePermissions: vi.fn()
      };
      vi.mocked(TrueNASApiClient).mockImplementation(() => mockApiClient as any);

      await trueNASModule.initialize({
        apiUrl: 'https://truenas.local/api/v2.0',
        apiKey: 'test-api-key'
      });
    });

    it('should create a share successfully', async () => {
      const mockShare = {
        id: 1,
        name: 'projects',
        path: '/mnt/data/projects',
        comment: 'Projects share',
        enabled: true,
        browsable: true,
        readonly: false,
        guestok: false
      };

      const mockApiClient = (TrueNASApiClient as any).mock.results[0].value;
      mockApiClient.createSMBShare.mockResolvedValue(mockShare);

      const result = await trueNASModule.createShare({
        name: 'projects',
        path: '/mnt/data/projects',
        comment: 'Projects share'
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 1,
        name: 'projects',
        path: '/mnt/data/projects',
        readonly: false,
        guestAccess: false
      });
    });

    it('should list shares successfully', async () => {
      const mockShares = [
        {
          id: 1,
          name: 'public',
          path: '/mnt/data/public',
          comment: 'Public share',
          enabled: true,
          browsable: true,
          readonly: false,
          guestok: true
        },
        {
          id: 2,
          name: 'private',
          path: '/mnt/data/private',
          comment: 'Private share',
          enabled: true,
          browsable: false,
          readonly: false,
          guestok: false
        }
      ];

      const mockApiClient = (TrueNASApiClient as any).mock.results[0].value;
      mockApiClient.listSMBShares.mockResolvedValue(mockShares);

      const result = await trueNASModule.listShares();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].guestAccess).toBe(true);
      expect(result.data?.[1].guestAccess).toBe(false);
    });

    it('should set share permissions successfully', async () => {
      const mockApiClient = (TrueNASApiClient as any).mock.results[0].value;
      mockApiClient.getSMBShare.mockResolvedValue({
        id: 1,
        path: '/mnt/data/projects'
      });
      mockApiClient.setSharePermissions.mockResolvedValue(undefined);

      const permissions = {
        owner: 'user1',
        group: 'developers',
        mode: '770',
        recursive: true
      };

      const result = await trueNASModule.setSharePermissions('1', permissions);

      expect(result.success).toBe(true);
      expect(mockApiClient.setSharePermissions).toHaveBeenCalledWith(
        '/mnt/data/projects',
        permissions
      );
    });
  });
});