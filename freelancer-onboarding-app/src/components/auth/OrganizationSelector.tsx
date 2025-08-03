import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { db } from '../../services/database.service';
import { Organization } from '../../types/database.types';
import { Building2, Loader2, AlertCircle, CheckCircle, UserPlus, LogOut } from 'lucide-react';

interface OrganizationSelectorProps {
  onOrganizationSelected?: () => void;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ 
  onOrganizationSelected 
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  
  const { dbUser, signOut } = useAuth();
  const { setOrganization } = useTenant();
  const navigate = useNavigate();
  
  useEffect(() => {
    loadUserOrganizations();
  }, [dbUser]);
  
  const loadUserOrganizations = async () => {
    if (!dbUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if user already has an organization
      if (dbUser.organization_id) {
        const org = await db.organizations.getById(dbUser.organization_id);
        if (org) {
          // Auto-select if user already belongs to an organization
          setOrganizations([org]);
          handleOrganizationSelect(org.id);
          return;
        }
      }
      
      // Otherwise, show organization creation form
      setCreatingNew(true);
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setError('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOrganizationSelect = async (orgId: string) => {
    try {
      setSelectedOrgId(orgId);
      const org = organizations.find(o => o.id === orgId);
      if (org) {
        setOrganization(org);
        
        if (onOrganizationSelected) {
          onOrganizationSelected();
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Failed to select organization:', err);
      setError('Failed to select organization');
    }
  };
  
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser || !newOrgName.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const subdomain = newOrgName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Check subdomain availability
      const isAvailable = await db.utils.checkSubdomainAvailability(subdomain);
      if (!isAvailable) {
        setError('Organization name is already taken. Please choose another.');
        setLoading(false);
        return;
      }
      
      // Create organization
      const org = await db.organizations.create({
        name: newOrgName,
        subdomain,
        branding: {
          company_name: newOrgName,
          colors: {
            primary: '#4f46e5',
            secondary: '#059669',
            accent: '#dc2626',
            neutral: '#6b7280',
          },
        },
      });
      
      // Update user with organization
      await db.users.update(dbUser.id, {
        organization_id: org.id,
        role: 'owner',
      });
      
      // Set the organization and redirect
      setOrganization(org);
      
      if (onOrganizationSelected) {
        onOrganizationSelected();
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to create organization:', err);
      setError('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Building2 className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {creatingNew ? 'Create Your Organization' : 'Select Organization'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {creatingNew 
            ? 'Set up your organization to get started'
            : 'Choose the organization you want to access'
          }
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {creatingNew ? (
            <form onSubmit={handleCreateOrganization} className="space-y-6">
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <div className="mt-1">
                  <input
                    id="orgName"
                    name="orgName"
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Acme Corp"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This will be used to create your organization's unique subdomain
                </p>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading || !newOrgName.trim()}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Create Organization
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrganizationSelect(org.id)}
                  disabled={loading}
                  className={`w-full text-left px-4 py-3 border rounded-lg transition-colors ${
                    selectedOrgId === org.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{org.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{org.subdomain}.your-domain.com</p>
                    </div>
                    {selectedOrgId === org.id && (
                      <CheckCircle className="h-5 w-5 text-indigo-600" />
                    )}
                  </div>
                </button>
              ))}
              
              {organizations.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No organizations found</p>
                  <button
                    onClick={() => setCreatingNew(true)}
                    className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Create a new organization
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 border-t pt-6">
            <button
              onClick={handleSignOut}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};