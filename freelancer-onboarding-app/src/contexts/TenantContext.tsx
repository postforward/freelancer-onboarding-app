import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  branding: {
    companyName: string;
    logo?: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      neutral: string;
    };
  };
  settings: {
    enabledPlatforms: string[];
    platformConfigs: Record<string, any>;
    features: {
      allowSelfSignup: boolean;
      requireApproval: boolean;
      maxUsers?: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  setTenant: (tenant: Tenant) => void;
  updateTenantBranding: (branding: Partial<Tenant['branding']>) => Promise<void>;
  updateTenantSettings: (settings: Partial<Tenant['settings']>) => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load tenant based on subdomain or stored preference
  useEffect(() => {
    loadTenant();
  }, []);
  
  const loadTenant = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get tenant from subdomain or localStorage
      const subdomain = window.location.hostname.split('.')[0];
      const storedTenantId = localStorage.getItem('currentTenantId');
      
      // In a real app, this would be an API call
      // For now, we'll use a mock tenant
      const mockTenant: Tenant = {
        id: storedTenantId || 'default',
        name: 'Default Organization',
        subdomain: subdomain || 'app',
        branding: {
          companyName: 'Creative Team Onboarding',
          colors: {
            primary: '#4f46e5',
            secondary: '#059669',
            accent: '#dc2626',
            neutral: '#6b7280',
          },
        },
        settings: {
          enabledPlatforms: ['parsec', 'truenas', 'iconik', 'lucidlink'],
          platformConfigs: {},
          features: {
            allowSelfSignup: false,
            requireApproval: true,
            maxUsers: 100,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setTenant(mockTenant);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant');
    } finally {
      setLoading(false);
    }
  };
  
  const updateTenantBranding = async (branding: Partial<Tenant['branding']>) => {
    if (!tenant) return;
    
    try {
      // In a real app, this would be an API call
      const updatedTenant = {
        ...tenant,
        branding: { ...tenant.branding, ...branding },
        updatedAt: new Date(),
      };
      
      setTenant(updatedTenant);
      localStorage.setItem(`tenant_${tenant.id}`, JSON.stringify(updatedTenant));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branding');
      throw err;
    }
  };
  
  const updateTenantSettings = async (settings: Partial<Tenant['settings']>) => {
    if (!tenant) return;
    
    try {
      // In a real app, this would be an API call
      const updatedTenant = {
        ...tenant,
        settings: { ...tenant.settings, ...settings },
        updatedAt: new Date(),
      };
      
      setTenant(updatedTenant);
      localStorage.setItem(`tenant_${tenant.id}`, JSON.stringify(updatedTenant));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  };
  
  const switchTenant = async (tenantId: string) => {
    try {
      setLoading(true);
      localStorage.setItem('currentTenantId', tenantId);
      await loadTenant();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch tenant');
      throw err;
    }
  };
  
  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        error,
        setTenant,
        updateTenantBranding,
        updateTenantSettings,
        switchTenant,
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