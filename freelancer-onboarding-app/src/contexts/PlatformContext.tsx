import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { PlatformRegistryService, PlatformModule } from '../services/PlatformRegistry';
import { PlatformResponse } from '../modules/screen-sharing/ParsecModule';

interface PlatformConfig {
  id: string;
  organization_id: string;
  platform_id: string;
  enabled: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface PlatformStatus {
  platformId: string;
  enabled: boolean;
  connected: boolean;
  lastChecked?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

interface PlatformContextType {
  platforms: Map<string, PlatformModule>;
  platformConfigs: PlatformConfig[];
  platformStatuses: Map<string, PlatformStatus>;
  loading: boolean;
  
  // Platform management
  enablePlatform: (platformId: string) => Promise<void>;
  disablePlatform: (platformId: string) => Promise<void>;
  configurePlatform: (platformId: string, config: Record<string, any>) => Promise<void>;
  testPlatformConnection: (platformId: string) => Promise<PlatformResponse>;
  
  // Bulk operations
  enableMultiplePlatforms: (platformIds: string[]) => Promise<void>;
  disableMultiplePlatforms: (platformIds: string[]) => Promise<void>;
  testAllConnections: () => Promise<Map<string, PlatformResponse>>;
  
  // Utility functions
  getPlatformConfig: (platformId: string) => PlatformConfig | undefined;
  getPlatformStatus: (platformId: string) => PlatformStatus | undefined;
  refreshPlatformStatuses: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

// Get available platform modules from registry
const platformRegistry = PlatformRegistryService.getInstance();

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const { user, currentOrganization } = useAuth();
  const { showToast } = useToast();
  const [platformConfigs, setPlatformConfigs] = useState<PlatformConfig[]>([]);
  const [platformStatuses, setPlatformStatuses] = useState<Map<string, PlatformStatus>>(new Map());
  const [loading, setLoading] = useState(true);

  // Load platform configurations
  const loadPlatformConfigs = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      setPlatformConfigs(data || []);
      
      // Initialize platform statuses
      const statuses = new Map<string, PlatformStatus>();
      platformRegistry.getAllPlatforms().forEach((platform) => {
        const platformId = platform.metadata.id;
        const config = data?.find(c => c.platform_id === platformId);
        statuses.set(platformId, {
          platformId,
          enabled: config?.enabled || false,
          connected: false
        });
      });
      setPlatformStatuses(statuses);
    } catch (error) {
      console.error('Error loading platform configs:', error);
      showToast('Failed to load platform configurations', 'error');
    }
  }, [currentOrganization?.id, showToast]);

  // Enable a platform
  const enablePlatform = useCallback(async (platformId: string) => {
    if (!currentOrganization?.id) return;

    try {
      const existingConfig = platformConfigs.find(c => c.platform_id === platformId);
      
      if (existingConfig) {
        const { error } = await supabase
          .from('platforms')
          .update({ enabled: true, updated_at: new Date().toISOString() })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platforms')
          .insert({
            organization_id: currentOrganization.id,
            platform_id: platformId,
            enabled: true,
            config: {}
          });

        if (error) throw error;
      }

      await loadPlatformConfigs();
      showToast(`${platformRegistry.getPlatform(platformId)?.metadata.name} enabled`, 'success');
    } catch (error) {
      console.error('Error enabling platform:', error);
      showToast('Failed to enable platform', 'error');
    }
  }, [currentOrganization?.id, platformConfigs, loadPlatformConfigs, showToast]);

  // Disable a platform
  const disablePlatform = useCallback(async (platformId: string) => {
    if (!currentOrganization?.id) return;

    try {
      const existingConfig = platformConfigs.find(c => c.platform_id === platformId);
      if (!existingConfig) return;

      const { error } = await supabase
        .from('platforms')
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .eq('id', existingConfig.id);

      if (error) throw error;

      await loadPlatformConfigs();
      showToast(`${platformRegistry.getPlatform(platformId)?.metadata.name} disabled`, 'success');
    } catch (error) {
      console.error('Error disabling platform:', error);
      showToast('Failed to disable platform', 'error');
    }
  }, [currentOrganization?.id, platformConfigs, loadPlatformConfigs, showToast]);

  // Configure a platform
  const configurePlatform = useCallback(async (platformId: string, config: Record<string, any>) => {
    if (!currentOrganization?.id) return;

    try {
      const existingConfig = platformConfigs.find(c => c.platform_id === platformId);
      
      if (existingConfig) {
        const { error } = await supabase
          .from('platforms')
          .update({ 
            config,
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platforms')
          .insert({
            organization_id: currentOrganization.id,
            platform_id: platformId,
            enabled: true,
            config
          });

        if (error) throw error;
      }

      await loadPlatformConfigs();
      showToast('Platform configuration saved', 'success');
    } catch (error) {
      console.error('Error configuring platform:', error);
      showToast('Failed to save platform configuration', 'error');
    }
  }, [currentOrganization?.id, platformConfigs, loadPlatformConfigs, showToast]);

  // Test platform connection
  const testPlatformConnection = useCallback(async (platformId: string): Promise<PlatformResponse> => {
    const platform = platformRegistry.getPlatform(platformId);
    const config = platformConfigs.find(c => c.platform_id === platformId);

    if (!platform) {
      return { success: false, error: 'Platform not found' };
    }

    if (!config || !config.enabled) {
      return { success: false, error: 'Platform not enabled' };
    }

    try {
      // Initialize platform if needed
      const initResult = await platform.initialize(config.config);
      if (!initResult.success) {
        updatePlatformStatus(platformId, { connected: false, error: initResult.error });
        return initResult;
      }

      // Test connection
      const testResult = await platform.testConnection();
      updatePlatformStatus(platformId, {
        connected: testResult.success,
        lastChecked: new Date(),
        error: testResult.error,
        metadata: testResult.data
      });

      return testResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      updatePlatformStatus(platformId, { connected: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [platformConfigs]);

  // Update platform status
  const updatePlatformStatus = (platformId: string, updates: Partial<PlatformStatus>) => {
    setPlatformStatuses(prev => {
      const newStatuses = new Map(prev);
      const currentStatus = newStatuses.get(platformId) || { platformId, enabled: false, connected: false };
      newStatuses.set(platformId, { ...currentStatus, ...updates });
      return newStatuses;
    });
  };

  // Bulk enable platforms
  const enableMultiplePlatforms = useCallback(async (platformIds: string[]) => {
    for (const platformId of platformIds) {
      await enablePlatform(platformId);
    }
  }, [enablePlatform]);

  // Bulk disable platforms
  const disableMultiplePlatforms = useCallback(async (platformIds: string[]) => {
    for (const platformId of platformIds) {
      await disablePlatform(platformId);
    }
  }, [disablePlatform]);

  // Test all connections
  const testAllConnections = useCallback(async () => {
    const results = new Map<string, PlatformResponse>();
    
    for (const config of platformConfigs) {
      if (config.enabled) {
        const result = await testPlatformConnection(config.platform_id);
        results.set(config.platform_id, result);
      }
    }
    
    return results;
  }, [platformConfigs, testPlatformConnection]);

  // Refresh platform statuses
  const refreshPlatformStatuses = useCallback(async () => {
    await testAllConnections();
  }, [testAllConnections]);

  // Utility functions
  const getPlatformConfig = useCallback((platformId: string) => {
    return platformConfigs.find(c => c.platform_id === platformId);
  }, [platformConfigs]);

  const getPlatformStatus = useCallback((platformId: string) => {
    return platformStatuses.get(platformId);
  }, [platformStatuses]);

  // Subscribe to platform config changes
  useEffect(() => {
    if (!currentOrganization?.id) return;

    const subscription = supabase
      .channel(`platforms:${currentOrganization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platforms',
          filter: `organization_id=eq.${currentOrganization.id}`
        },
        () => {
          loadPlatformConfigs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentOrganization?.id, loadPlatformConfigs]);

  // Load initial data
  useEffect(() => {
    if (currentOrganization?.id) {
      setLoading(true);
      loadPlatformConfigs().finally(() => setLoading(false));
    }
  }, [currentOrganization?.id, loadPlatformConfigs]);

  const value: PlatformContextType = {
    platforms: new Map(platformRegistry.getAllPlatforms().map(p => [p.metadata.id, p])),
    platformConfigs,
    platformStatuses,
    loading,
    enablePlatform,
    disablePlatform,
    configurePlatform,
    testPlatformConnection,
    enableMultiplePlatforms,
    disableMultiplePlatforms,
    testAllConnections,
    getPlatformConfig,
    getPlatformStatus,
    refreshPlatformStatuses
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatforms() {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatforms must be used within a PlatformProvider');
  }
  return context;
}