import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types/database.types';

// Permission types
export type Permission = 
  | 'organizations.read'
  | 'organizations.update'
  | 'organizations.delete'
  | 'users.read'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'platforms.read'
  | 'platforms.create'
  | 'platforms.update'
  | 'platforms.delete'
  | 'freelancers.read'
  | 'freelancers.create'
  | 'freelancers.update'
  | 'freelancers.delete'
  | 'audit_logs.read'
  | 'settings.read'
  | 'settings.update';

// Role-based permission mapping
const rolePermissions: Record<User['role'], Permission[]> = {
  owner: [
    // Full access to everything
    'organizations.read',
    'organizations.update',
    'organizations.delete',
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'platforms.read',
    'platforms.create',
    'platforms.update',
    'platforms.delete',
    'freelancers.read',
    'freelancers.create',
    'freelancers.update',
    'freelancers.delete',
    'audit_logs.read',
    'settings.read',
    'settings.update',
  ],
  admin: [
    // Admin: Full access to platforms, API settings, users, and freelancers
    'organizations.read',
    'organizations.update',
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'platforms.read',
    'platforms.create',
    'platforms.update',
    'platforms.delete',
    'freelancers.read',
    'freelancers.create',
    'freelancers.update',
    'freelancers.delete',
    'audit_logs.read',
    'settings.read',
    'settings.update',
  ],
  member: [
    // Regular user: Can manage freelancers but no access to platforms/API settings
    'organizations.read',
    'users.read',
    'platforms.read', // Can view platforms but not modify
    'freelancers.read',
    'freelancers.create',
    'freelancers.update',
    'freelancers.delete', // Added delete permission for regular users
    'audit_logs.read',
    'settings.read',
    // Note: No platforms.create/update/delete or settings.update
  ],
};

/**
 * Hook to check user permissions
 */
export const usePermissions = () => {
  const { dbUser, hasRole, isAdmin, isOwner } = useAuth();
  
  const permissions = useMemo(() => {
    if (!dbUser) return [];
    return rolePermissions[dbUser.role] || [];
  }, [dbUser]);
  
  const hasPermission = (permission: Permission | Permission[]): boolean => {
    if (!dbUser) {
      return false;
    }
    
    if (Array.isArray(permission)) {
      return permission.some(p => permissions.includes(p));
    }
    
    return permissions.includes(permission);
  };
  
  const hasAllPermissions = (permissionList: Permission[]): boolean => {
    if (!dbUser) {
      return false;
    }
    return permissionList.every(p => permissions.includes(p));
  };
  
  const canManageOrganization = () => hasPermission(['organizations.update', 'organizations.delete']);
  const canManageUsers = () => hasPermission(['users.create', 'users.update', 'users.delete']);
  const canManagePlatforms = () => hasPermission(['platforms.create', 'platforms.update', 'platforms.delete']);
  const canManageFreelancers = () => hasPermission(['freelancers.create', 'freelancers.update', 'freelancers.delete']);
  const canViewAuditLogs = () => hasPermission('audit_logs.read');
  const canUpdateSettings = () => hasPermission('settings.update');
  
  return {
    permissions,
    hasPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isOwner,
    // Convenience methods
    canManageOrganization,
    canManageUsers,
    canManagePlatforms,
    canManageFreelancers,
    canViewAuditLogs,
    canUpdateSettings,
  };
};

/**
 * Hook to check if user can perform specific actions on resources
 */
export const useResourcePermissions = (resourceType: 'organization' | 'user' | 'platform' | 'freelancer') => {
  const { hasPermission } = usePermissions();
  
  const canView = () => hasPermission(`${resourceType}s.read` as Permission);
  const canCreate = () => hasPermission(`${resourceType}s.create` as Permission);
  const canUpdate = () => hasPermission(`${resourceType}s.update` as Permission);
  const canDelete = () => hasPermission(`${resourceType}s.delete` as Permission);
  
  return {
    canView,
    canCreate,
    canUpdate,
    canDelete,
  };
};