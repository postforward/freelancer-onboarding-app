import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { Organization, User } from '../types/database.types';

export interface TenantContextType {
  organization: Organization | null;
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  setOrganization: (org: Organization) => void;
  updateOrganizationBranding: (branding: Partial<Organization['branding']>) => Promise<void>;
  updateOrganizationSettings: (settings: Partial<Organization['settings']>) => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load organization and user data on mount
  useEffect(() => {
    loadTenantData();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        await loadTenantData();
      } else if (event === 'SIGNED_OUT') {
        setOrganization(null);
        setCurrentUser(null);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  // Subscribe to real-time organization updates
  useEffect(() => {
    if (!organization) return;
    
    let subscription: any = null;
    
    try {
      subscription = supabase
        .channel(`organization:${organization.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'organizations',
            filter: `id=eq.${organization.id}`,
          },
          (payload: any) => {
            console.log('Organization updated:', payload);
            setOrganization(payload.new as Organization);
          }
        )
        .subscribe();
    } catch (error) {
      console.log('Real-time subscriptions not available in mock mode:', error);
    }
    
    return () => {
      if (subscription) {
        try {
          supabase.removeChannel(subscription);
        } catch (error) {
          console.log('Error cleaning up subscription:', error);
        }
      }
    };
  }, [organization?.id]);
  
  const loadTenantData = async () => {
    console.log('🔄 TenantContext: Starting tenant data load...');
    try {
      setLoading(true);
      setError(null);
      
      // Get current user from auth
      console.log('🔄 TenantContext: Getting auth user...');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!authUser) {
        console.log('🔄 TenantContext: No auth user found, stopping load');
        setLoading(false);
        return;
      }
      
      console.log('🔄 TenantContext: Found auth user:', authUser.email);
      
      // Get user details from database
      console.log('🔄 TenantContext: Loading user from database...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (userError) {
        console.error('❌ TenantContext: Database user error:', userError);
        throw userError;
      }
      if (!userData) {
        console.error('❌ TenantContext: No user data found');
        throw new Error('User not found in database');
      }
      
      console.log('✅ TenantContext: Database user loaded:', userData.email);
      setCurrentUser(userData);
      
      // Get organization
      console.log('🔄 TenantContext: Loading organization:', userData.organization_id);
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single();
      
      if (orgError) {
        console.error('❌ TenantContext: Organization error:', orgError);
        throw orgError;
      }
      if (!orgData) {
        console.error('❌ TenantContext: No organization found');
        throw new Error('Organization not found');
      }
      
      console.log('✅ TenantContext: Organization loaded:', orgData.name);
      setOrganization(orgData);
      
      // Check subdomain match (optional)
      const subdomain = window.location.hostname.split('.')[0];
      if (subdomain !== 'localhost' && subdomain !== orgData.subdomain) {
        console.warn('⚠️ TenantContext: Subdomain mismatch:', subdomain, orgData.subdomain);
      }
      
      console.log('✅ TenantContext: Tenant data load complete');
      
    } catch (err) {
      console.error('❌ TenantContext: Error loading tenant data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tenant data');
    } finally {
      console.log('✅ TenantContext: Setting loading to false');
      setLoading(false);
    }
  };
  
  const updateOrganizationBranding = async (branding: Partial<Organization['branding']>) => {
    if (!organization) return;
    
    try {
      const updatedBranding = {
        ...organization.branding,
        ...branding,
      };
      
      const { error } = await supabase
        .from('organizations')
        .update({ 
          branding: updatedBranding,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id);
      
      if (error) throw error;
      
      // Update local state optimistically
      setOrganization({
        ...organization,
        branding: updatedBranding,
        updated_at: new Date().toISOString(),
      });
      
    } catch (err) {
      console.error('Error updating branding:', err);
      setError(err instanceof Error ? err.message : 'Failed to update branding');
      throw err;
    }
  };
  
  const updateOrganizationSettings = async (settings: Partial<Organization['settings']>) => {
    if (!organization) return;
    
    try {
      const updatedSettings = {
        ...(organization.settings as Record<string, any> || {}),
        ...(settings as Record<string, any>),
      };
      
      const { error } = await supabase
        .from('organizations')
        .update({ 
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id);
      
      if (error) throw error;
      
      // Update local state optimistically
      setOrganization({
        ...organization,
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      });
      
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  };
  
  const switchOrganization = async (orgId: string) => {
    try {
      setLoading(true);
      
      // Verify user has access to this organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      
      if (orgError) throw orgError;
      if (!orgData) throw new Error('Organization not found');
      
      // Verify user is a member
      const { data: membership, error: memberError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser?.id)
        .eq('organization_id', orgId)
        .single();
      
      if (memberError || !membership) {
        throw new Error('You do not have access to this organization');
      }
      
      setOrganization(orgData);
      
    } catch (err) {
      console.error('Error switching organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch organization');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const refreshOrganization = async () => {
    if (!organization) return;
    
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization.id)
        .single();
      
      if (error) throw error;
      if (data) setOrganization(data);
      
    } catch (err) {
      console.error('Error refreshing organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh organization');
    }
  };
  
  return (
    <TenantContext.Provider
      value={{
        organization,
        currentUser,
        loading,
        error,
        setOrganization,
        updateOrganizationBranding,
        updateOrganizationSettings,
        switchOrganization,
        refreshOrganization,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};