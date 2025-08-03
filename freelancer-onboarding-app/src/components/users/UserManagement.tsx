import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { db } from '../../services/database.service';
import { User } from '../../types/database.types';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Crown, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  X
} from 'lucide-react';

interface InviteUserFormData {
  email: string;
  fullName: string;
  role: User['role'];
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteUserFormData>({
    email: '',
    fullName: '',
    role: 'member',
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  const { dbUser } = useAuth();
  const { organization } = useTenant();
  const { canManageUsers, isOwner } = usePermissions();
  
  useEffect(() => {
    if (organization) {
      loadUsers();
    }
  }, [organization]);
  
  const loadUsers = async () => {
    if (!organization) return;
    
    try {
      setLoading(true);
      setError(null);
      const orgUsers = await db.users.getByOrganization(organization.id);
      setUsers(orgUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !canManageUsers()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Note: In a real app, you'd send an invitation email
      // For now, we'll just show a success message
      setSuccess(`Invitation sent to ${inviteForm.email}`);
      setShowInviteForm(false);
      setInviteForm({ email: '', fullName: '', role: 'member' });
      
      // Simulate adding the user (in production, this would happen after they accept the invite)
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to invite user:', err);
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateUserRole = async (userId: string, newRole: User['role']) => {
    if (!canManageUsers()) return;
    
    try {
      setError(null);
      await db.users.update(userId, { role: newRole });
      await loadUsers();
      setEditingUser(null);
      setSuccess('User role updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update user role:', err);
      setError('Failed to update user role');
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!canManageUsers()) return;
    
    try {
      setError(null);
      setDeletingUserId(userId);
      
      // In production, you might want to soft delete or deactivate instead
      await db.users.update(userId, { is_active: false });
      await loadUsers();
      
      setSuccess('User removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to remove user');
    } finally {
      setDeletingUserId(null);
    }
  };
  
  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getRoleBadgeClasses = (role: User['role']) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (!canManageUsers()) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have permission to manage users.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Team Members</h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage users in your organization
              </p>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <button
                onClick={() => setShowInviteForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">{success}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Invite User Form */}
      {showInviteForm && (
        <div className="bg-white shadow sm:rounded-lg">
          <form onSubmit={handleInviteUser} className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Invite New User</h3>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <input
                    type="email"
                    id="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="user@example.com"
                  />
                  <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
              
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  required
                  value={inviteForm.fullName}
                  onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as User['role'] })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  {isOwner() && <option value="owner">Owner</option>}
                </select>
              </div>
            </div>
            
            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Send Invitation'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Users List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="px-4 py-5 sm:p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          </div>
        ) : users.length === 0 ? (
          <div className="px-4 py-5 sm:p-6 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by inviting team members.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.avatar_url}
                            alt={user.full_name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        {editingUser?.id === user.id ? (
                          <select
                            value={editingUser.role}
                            onChange={(e) => {
                              setEditingUser({ ...editingUser, role: e.target.value as User['role'] });
                              handleUpdateUserRole(user.id, e.target.value as User['role']);
                            }}
                            className="block w-32 px-3 py-1 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            {isOwner() && <option value="owner">Owner</option>}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClasses(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1">{user.role}</span>
                          </span>
                        )}
                      </div>
                      
                      {user.id !== dbUser?.id && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-gray-400 hover:text-gray-500"
                            disabled={user.role === 'owner' && !isOwner()}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-500"
                            disabled={user.role === 'owner' || deletingUserId === user.id}
                          >
                            {deletingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};