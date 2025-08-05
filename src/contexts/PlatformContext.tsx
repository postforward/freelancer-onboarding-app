import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { PlatformRegistryService } from '../services/PlatformRegistry';
import type { PlatformResponse, IPlatformModule } from '../types/platform.types';
import { DebugLogger, debugGroup } from '../utils/debugLogger';

interface PlatformConfig {
  id: string;
  organization_id: string;
  platform_id: string;
  is_enabled: boolean;
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
  platforms: Map<string, IPlatformModule>;
  platformConfigs: PlatformConfig[];
  platformStatuses: Map<string, PlatformStatus>;
  loading: boolean;
  
  // Platform management
  enablePlatform: (platformId: string) => Promise<void>;
  disablePlatform: (platformId: string) => Promise<void>;
  configurePlatform: (platformId: string, config: Record<string, any>) => Promise<void>;
  testPlatformConnection: (platformId: string, testConfig?: Record<string, any>) => Promise<PlatformResponse>;
  
  // Bulk operations
  enableMultiplePlatforms: (platformIds: string[]) => Promise<void>;
  disableMultiplePlatforms: (platformIds: string[]) => Promise<void>;
  testAllConnections: () => Promise<Map<string, PlatformResponse>>;
  
  // Utility functions
  getPlatformConfig: (platformId: string) => PlatformConfig | undefined;
  getPlatformStatus: (platformId: string) => PlatformStatus | undefined;
  refreshPlatformStatuses: () => Promise<void>;
}

// Default context value to prevent undefined errors
const defaultContextValue: PlatformContextType = {
  platforms: new Map(),
  platformConfigs: [],
  platformStatuses: new Map(),
  loading: true,
  enablePlatform: async () => { throw new Error('Platform context not initialized'); },
  disablePlatform: async () => { throw new Error('Platform context not initialized'); },
  configurePlatform: async () => { throw new Error('Platform context not initialized'); },
  testPlatformConnection: async () => ({ success: false, error: 'Platform context not initialized' }),
  enableMultiplePlatforms: async () => { throw new Error('Platform context not initialized'); },
  disableMultiplePlatforms: async () => { throw new Error('Platform context not initialized'); },
  testAllConnections: async () => new Map(),
  getPlatformConfig: () => undefined,
  getPlatformStatus: () => undefined,
  refreshPlatformStatuses: async () => { throw new Error('Platform context not initialized'); }
};

const PlatformContext = createContext<PlatformContextType>(defaultContextValue);

// Get available platform modules from registry with error handling
let platformRegistry: PlatformRegistryService | null = null;
try {
  platformRegistry = PlatformRegistryService.getInstance();
  DebugLogger.log('PlatformContext', 'Platform registry initialized', {
    platformCount: platformRegistry?.getPlatformCount() || 0
  });
} catch (error) {
  DebugLogger.error('PlatformContext', 'Failed to initialize platform registry', error);
  platformRegistry = null;
}

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const { dbUser } = useAuth();
  const { showToast } = useToast();
  const [platformConfigs, setPlatformConfigs] = useState<PlatformConfig[]>([]);
  const [platformStatuses, setPlatformStatuses] = useState<Map<string, PlatformStatus>>(new Map());
  const [loading, setLoading] = useState(true);

  // Load platform configurations
  const loadPlatformConfigs = useCallback(async () => {
    DebugLogger.log('PlatformContext', 'loadPlatformConfigs called', { 
      organizationId: dbUser?.organization_id,
      hasUser: !!dbUser
    });
    
    if (!dbUser?.organization_id) {
      DebugLogger.warn('PlatformContext', 'No organization ID, skipping platform config load', { 
        hasUser: !!dbUser,
        userOrgId: dbUser?.organization_id
      });
      setLoading(false);
      return;
    }

    try {
      DebugLogger.api('PlatformContext', 'GET', 'platforms', { 
        organization_id: dbUser.organization_id 
      });
      // Check if supabase is available
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('organization_id', dbUser.organization_id);

      if (error) {
        DebugLogger.error('PlatformContext', 'Failed to load platform configs', error);
        throw error;
      }

      DebugLogger.success('PlatformContext', 'Platform configs loaded', { 
        count: data?.length || 0,
        configs: data,
        enabledConfigs: data?.filter((c: any) => c.is_enabled).map((c: any) => ({ id: c.platform_id, enabled: c.is_enabled })) || []
      });
      
      setPlatformConfigs(data || []);
      
      // Initialize platform statuses
      const statuses = new Map<string, PlatformStatus>();
      let allPlatforms: IPlatformModule[] = [];
      
      try {
        allPlatforms = platformRegistry?.getAllPlatforms() || [];
        DebugLogger.log('PlatformContext', 'Retrieved platforms for status initialization', {
          count: allPlatforms.length
        });
      } catch (error) {
        DebugLogger.error('PlatformContext', 'Error getting platforms from registry', error);
        allPlatforms = [];
      }
      
      DebugLogger.log('PlatformContext', 'Initializing platform statuses', {
        availablePlatforms: allPlatforms.map(p => p?.metadata?.id).filter(Boolean)
      });
      
      allPlatforms.forEach((platform) => {
        if (!platform?.metadata?.id) {
          DebugLogger.warn('PlatformContext', 'Skipping platform with missing metadata', platform);
          return;
        }
        
        const platformId = platform.metadata.id;
        const config = data?.find((c: any) => c.platform_id === platformId);
        const isEnabled = config?.is_enabled || false;
        
        // Preserve existing status data but update enabled state
        const existingStatus = platformStatuses.get(platformId);
        const status: PlatformStatus = {
          platformId,
          enabled: isEnabled,
          connected: existingStatus?.connected || false,
          lastChecked: existingStatus?.lastChecked,
          error: existingStatus?.error,
          metadata: existingStatus?.metadata
        };
        statuses.set(platformId, status);
        
        DebugLogger.log('PlatformContext', `Platform ${platformId} status updated`, { 
          previousEnabled: existingStatus?.enabled,
          newEnabled: isEnabled,
          configExists: !!config,
          configEnabled: config?.is_enabled,
          finalEnabledState: status.enabled
        });
      });
      
      DebugLogger.state('PlatformContext', 'platformStatuses', platformStatuses, statuses);
      setPlatformStatuses(statuses);
    } catch (error) {
      DebugLogger.error('PlatformContext', 'Error in loadPlatformConfigs', error);
      console.error('Error loading platform configs:', error);
      showToast({ type: 'error', title: 'Failed to load platform configurations' });
    } finally {
      DebugLogger.state('PlatformContext', 'loading', loading, false);
      setLoading(false);
    }
  }, [dbUser?.organization_id, showToast]);

  // Enable a platform
  const enablePlatform = useCallback(async (platformId: string) => {
    debugGroup(`Enable Platform: ${platformId}`, () => {
      DebugLogger.log('PlatformContext', 'enablePlatform called', { 
        platformId, 
        organizationId: dbUser?.organization_id 
      });
    });
    
    if (!dbUser?.organization_id) {
      DebugLogger.warn('PlatformContext', 'Cannot enable platform - no organization');
      return;
    }

    try {
      const existingConfig = platformConfigs.find(c => c.platform_id === platformId);
      DebugLogger.log('PlatformContext', 'Existing config check', { 
        platformId, 
        hasExistingConfig: !!existingConfig 
      });
      
      if (existingConfig) {
        DebugLogger.api('PlatformContext', 'PATCH', `platforms/${existingConfig.id}`, { 
          enabled: true 
        });
        const { error } = await supabase
          .from('platforms')
          .update({ is_enabled: true, updated_at: new Date().toISOString() })
          .eq('id', existingConfig.id);

        if (error) {
          DebugLogger.error('PlatformContext', 'Failed to update platform', error);
          throw error;
        }
        DebugLogger.success('PlatformContext', 'Platform updated successfully', { platformId, enabled: true });
        
        // Update platform status immediately for better UX
        updatePlatformStatus(platformId, { enabled: true });
      } else {
        // No existing config - create empty one and let user configure later
        DebugLogger.log('PlatformContext', 'Creating empty platform config for toggle', { platformId });
        // Get platform metadata for display name and category
        const platform = platformsMap.get(platformId);
        const insertData = {
          organization_id: dbUser.organization_id,
          platform_id: platformId,
          display_name: platform?.metadata?.name || platformId,
          category: platform?.metadata?.category || 'collaboration',
          is_enabled: true,
          config: {}
        };
        
        const { error } = await supabase
          .from('platforms')
          .insert(insertData);

        if (error) {
          DebugLogger.error('PlatformContext', 'Failed to create platform', error);
          throw error;
        }
        DebugLogger.success('PlatformContext', 'Empty platform created for toggle', { platformId });
        
        // Update platform status immediately for better UX
        updatePlatformStatus(platformId, { enabled: true });
        
        showToast({ 
          type: 'info', 
          title: 'Platform enabled. Click Configure to set up credentials.' 
        });
      }

      await loadPlatformConfigs();
      let platformName = 'Unknown Platform';
      try {
        platformName = platformRegistry?.getPlatform(platformId)?.metadata.name || 'Unknown Platform';
      } catch (error) {
        DebugLogger.warn('PlatformContext', 'Could not get platform name', { platformId, error });
      }
      DebugLogger.success('PlatformContext', 'Platform enabled workflow completed', { platformId, platformName });
      showToast({ 
        type: 'success', 
        title: `${platformName} enabled` 
      });
    } catch (error) {
      DebugLogger.error('PlatformContext', 'Error enabling platform', error);
      console.error('Error enabling platform:', error);
      showToast({ type: 'error', title: 'Failed to enable platform' });
    } finally {
      debugGroup(`Enable Platform: ${platformId} - Complete`, () => {
        DebugLogger.log('PlatformContext', 'enablePlatform completed');
      });
    }
  }, [dbUser?.organization_id, platformConfigs, loadPlatformConfigs, showToast]);

  // Disable a platform
  const disablePlatform = useCallback(async (platformId: string) => {
    debugGroup(`Disable Platform: ${platformId}`, () => {
      DebugLogger.log('PlatformContext', 'disablePlatform called', { platformId });
    });
    
    if (!dbUser?.organization_id) {
      DebugLogger.warn('PlatformContext', 'Cannot disable platform - no organization');
      return;
    }

    try {
      const existingConfig = platformConfigs.find(c => c.platform_id === platformId);
      if (!existingConfig) {
        DebugLogger.warn('PlatformContext', 'No existing config found for platform', { platformId });
        return;
      }

      DebugLogger.api('PlatformContext', 'PATCH', `platforms/${existingConfig.id}`, { enabled: false });
      const { error } = await supabase
        .from('platforms')
        .update({ is_enabled: false, updated_at: new Date().toISOString() })
        .eq('id', existingConfig.id);

      if (error) {
        DebugLogger.error('PlatformContext', 'Failed to disable platform', error);
        throw error;
      }
      DebugLogger.success('PlatformContext', 'Platform disabled successfully', { platformId });
      
      // Update platform status immediately for better UX
      updatePlatformStatus(platformId, { enabled: false });

      await loadPlatformConfigs();
      let platformName = 'Unknown Platform';
      try {
        platformName = platformRegistry?.getPlatform(platformId)?.metadata.name || 'Unknown Platform';
      } catch (error) {
        DebugLogger.warn('PlatformContext', 'Could not get platform name for disable', { platformId, error });
      }
      
      showToast({ 
        type: 'success', 
        title: `${platformName} disabled` 
      });
    } catch (error) {
      console.error('Error disabling platform:', error);
      showToast({ type: 'error', title: 'Failed to disable platform' });
    }
  }, [dbUser?.organization_id, platformConfigs, loadPlatformConfigs, showToast]);

  // Configure a platform (save credentials only, don't enable)
  const configurePlatform = useCallback(async (platformId: string, config: Record<string, any>) => {
    debugGroup(`Configure Platform: ${platformId}`, () => {
      DebugLogger.log('PlatformContext', 'configurePlatform called', { 
        platformId, 
        config,
        organizationId: dbUser?.organization_id,
        hasSupabase: !!supabase
      });
    });
    
    if (!dbUser?.organization_id) {
      DebugLogger.error('PlatformContext', 'Cannot configure platform - no organization', {
        hasUser: !!dbUser,
        userOrgId: dbUser?.organization_id
      });
      showToast({ type: 'error', title: 'No organization found. Please refresh and try again.' });
      return;
    }

    if (!supabase) {
      DebugLogger.error('PlatformContext', 'Supabase client not available');
      showToast({ type: 'error', title: 'Database connection not available' });
      return;
    }

    try {
      const existingConfig = platformConfigs.find(c => c.platform_id === platformId);
      DebugLogger.log('PlatformContext', 'Existing config search result', { 
        platformId,
        foundExisting: !!existingConfig,
        existingConfigId: existingConfig?.id,
        totalConfigs: platformConfigs.length
      });
      
      if (existingConfig) {
        DebugLogger.api('PlatformContext', 'PATCH', `platforms/${existingConfig.id}`, { config });
        
        const updateData = {
          config,
          is_enabled: true, // Auto-enable when configuration is updated
          updated_at: new Date().toISOString()
        };
        
        DebugLogger.log('PlatformContext', 'Attempting to update existing config', {
          configId: existingConfig.id,
          updateData,
          willSetEnabled: updateData.is_enabled
        });
        
        const { data, error } = await supabase
          .from('platforms')
          .update(updateData)
          .eq('id', existingConfig.id)
          .select(); // Return updated data

        if (error) {
          DebugLogger.error('PlatformContext', 'Failed to update platform config', { 
            error, 
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint,
            configId: existingConfig.id
          });
          throw error;
        }
        
        DebugLogger.success('PlatformContext', 'Platform config updated successfully', { 
          platformId, 
          updatedData: data,
          rowsAffected: data?.length || 0
        });
        
        // Update platform status immediately for better UX
        DebugLogger.log('PlatformContext', 'Updating platform status to enabled after config update', { platformId });
        updatePlatformStatus(platformId, { enabled: true });
      } else {
        // Get platform metadata for display name and category
        const platform = platformsMap.get(platformId);
        const insertData = {
          organization_id: dbUser.organization_id,
          platform_id: platformId,
          display_name: platform?.metadata?.name || platformId,
          category: platform?.metadata?.category || 'collaboration',
          is_enabled: true, // Auto-enable when configuration is saved
          config
        };
        
        DebugLogger.api('PlatformContext', 'POST', 'platforms', insertData);
        DebugLogger.log('PlatformContext', 'Attempting to create new config', {
          insertData,
          willSetEnabled: insertData.is_enabled
        });
        
        const { data, error } = await supabase
          .from('platforms')
          .insert(insertData)
          .select(); // Return inserted data

        if (error) {
          DebugLogger.error('PlatformContext', 'Failed to create platform config', {
            error,
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint,
            insertData
          });
          throw error;
        }
        
        DebugLogger.success('PlatformContext', 'Platform config created successfully', { 
          platformId, 
          createdData: data,
          rowsCreated: data?.length || 0
        });
        
        // Update platform status immediately for better UX
        DebugLogger.log('PlatformContext', 'Updating platform status to enabled after config creation', { platformId });
        updatePlatformStatus(platformId, { enabled: true });
      }

      DebugLogger.log('PlatformContext', 'Reloading platform configs after save');
      await loadPlatformConfigs();
      
      // Ensure platform status reflects enabled state after reload
      DebugLogger.log('PlatformContext', 'Final status update after config reload', { platformId });
      updatePlatformStatus(platformId, { enabled: true });
      
      DebugLogger.success('PlatformContext', 'Configuration save workflow completed', {
        platformId,
        shouldBeEnabled: true
      });
      showToast({ type: 'success', title: 'Platform configuration saved and enabled!' });
    } catch (error) {
      DebugLogger.error('PlatformContext', 'Error in configurePlatform', error);
      console.error('Error configuring platform:', error);
      showToast({ type: 'error', title: `Failed to save platform configuration: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }, [dbUser?.organization_id, platformConfigs, loadPlatformConfigs, showToast]);

  // Test platform connection
  const testPlatformConnection = useCallback(async (platformId: string, testConfig?: Record<string, any>): Promise<PlatformResponse> => {
    debugGroup(`Test Platform Connection: ${platformId}`, () => {
      DebugLogger.log('PlatformContext', 'testPlatformConnection called', { 
        platformId, 
        usingTestConfig: !!testConfig,
        testConfigKeys: testConfig ? Object.keys(testConfig) : []
      });
    });
    
    let platform: IPlatformModule | undefined;
    try {
      platform = platformRegistry?.getPlatform(platformId);
    } catch (error) {
      DebugLogger.error('PlatformContext', 'Error getting platform from registry', { platformId, error });
      return { success: false, error: 'Platform registry error' };
    }

    if (!platform) {
      DebugLogger.error('PlatformContext', 'Platform not found', { platformId });
      return { success: false, error: 'Platform not found' };
    }

    // Use provided test config or fall back to saved config
    let configToUse: Record<string, any>;
    if (testConfig) {
      DebugLogger.log('PlatformContext', 'Using provided test config for connection test', { platformId });
      configToUse = testConfig;
    } else {
      const savedConfig = platformConfigs.find(c => c.platform_id === platformId);
      if (!savedConfig || !savedConfig.is_enabled) {
        DebugLogger.warn('PlatformContext', 'Platform not enabled or configured', { platformId, hasConfig: !!savedConfig, enabled: savedConfig?.is_enabled });
        return { success: false, error: 'Platform not enabled' };
      }
      configToUse = savedConfig.config;
      DebugLogger.log('PlatformContext', 'Using saved config for connection test', { platformId });
    }

    try {
      // Initialize platform with the config to use
      DebugLogger.log('PlatformContext', 'Initializing platform', { platformId });
      const initResult = await platform.initialize(configToUse);
      if (!initResult.success) {
        DebugLogger.error('PlatformContext', 'Platform initialization failed', { platformId, error: initResult.error });
        if (!testConfig) {
          updatePlatformStatus(platformId, { connected: false, error: initResult.error });
        }
        return initResult;
      }
      DebugLogger.success('PlatformContext', 'Platform initialized', { platformId });

      // Test connection
      DebugLogger.log('PlatformContext', 'Testing platform connection', { platformId });
      const testResult = await platform.testConnection();
      
      DebugLogger.log('PlatformContext', 'Connection test result', { 
        platformId, 
        success: testResult.success, 
        error: testResult.error,
        data: testResult.data,
        usingTestConfig: !!testConfig
      });
      
      // Only update platform status if we're using saved config (not test config)
      if (!testConfig) {
        updatePlatformStatus(platformId, {
          connected: testResult.success,
          lastChecked: new Date(),
          error: testResult.error,
          metadata: testResult.data
        });
      }

      if (testResult.success) {
        DebugLogger.success('PlatformContext', 'Connection test passed', { platformId });
      } else {
        DebugLogger.error('PlatformContext', 'Connection test failed', { platformId, error: testResult.error });
      }

      return testResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      DebugLogger.error('PlatformContext', 'Connection test exception', { platformId, error });
      if (!testConfig) {
        updatePlatformStatus(platformId, { connected: false, error: errorMessage });
      }
      return { success: false, error: errorMessage };
    } finally {
      debugGroup(`Test Platform Connection: ${platformId} - Complete`, () => {
        DebugLogger.log('PlatformContext', 'testPlatformConnection completed');
      });
    }
  }, [platformConfigs]);

  // Update platform status
  const updatePlatformStatus = (platformId: string, updates: Partial<PlatformStatus>) => {
    DebugLogger.log('PlatformContext', 'Updating platform status', { platformId, updates });
    setPlatformStatuses(prev => {
      const newStatuses = new Map(prev);
      const currentStatus = newStatuses.get(platformId) || { platformId, enabled: false, connected: false };
      const newStatus = { ...currentStatus, ...updates };
      newStatuses.set(platformId, newStatus);
      DebugLogger.state('PlatformContext', `platformStatus[${platformId}]`, currentStatus, newStatus);
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
      if (config.is_enabled) {
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
    if (!dbUser?.organization_id) return;

    const subscription = supabase
      .channel(`platforms:${dbUser.organization_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platforms',
          filter: `organization_id=eq.${dbUser.organization_id}`
        },
        () => {
          loadPlatformConfigs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [dbUser?.organization_id, loadPlatformConfigs]);

  // Load initial data
  useEffect(() => {
    if (dbUser?.organization_id) {
      DebugLogger.log('PlatformContext', 'Loading initial platform data', {
        organizationId: dbUser.organization_id
      });
      setLoading(true);
      loadPlatformConfigs().finally(() => {
        DebugLogger.log('PlatformContext', 'Initial platform data load completed');
        setLoading(false);
      });
    } else {
      DebugLogger.log('PlatformContext', 'No organization available, setting loading to false', {
        hasUser: !!dbUser,
        userOrgId: dbUser?.organization_id
      });
      setLoading(false);
    }
  }, [dbUser?.organization_id, loadPlatformConfigs]);

  // Create platforms map with error handling and fallback
  let platformsMap: Map<string, IPlatformModule> = new Map();
  try {
    if (platformRegistry) {
      const allPlatforms = platformRegistry.getAllPlatforms() || [];
      if (allPlatforms.length > 0) {
        platformsMap = new Map(allPlatforms
          .filter(p => p?.metadata?.id)
          .map(p => [p.metadata.id, p]));
        
        DebugLogger.log('PlatformContext', 'Platforms map created from registry', {
          platformCount: platformsMap.size,
          platformIds: Array.from(platformsMap.keys())
        });
      } else {
        DebugLogger.warn('PlatformContext', 'Platform registry returned no platforms');
      }
    } else {
      DebugLogger.warn('PlatformContext', 'Platform registry not available');
    }
    
    // If we still have no platforms, provide a basic fallback
    if (platformsMap.size === 0) {
      DebugLogger.log('PlatformContext', 'Creating fallback platform data');
      // Create a minimal platform for testing purposes
      // This won't break the UI but will show that platforms aren't loaded
    }
  } catch (error) {
    DebugLogger.error('PlatformContext', 'Error creating platforms map', error);
    platformsMap = new Map();
  }

  const value: PlatformContextType = {
    platforms: platformsMap,
    platformConfigs: platformConfigs || [],
    platformStatuses: platformStatuses || new Map(),
    loading: loading ?? true,
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
  
  // Debug log the final context state
  DebugLogger.log('PlatformContext', 'Context value created', {
    platformCount: platformsMap.size,
    configCount: (platformConfigs || []).length,
    statusCount: (platformStatuses || new Map()).size,
    loading: loading ?? true,
    hasRegistry: !!platformRegistry
  });

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatforms() {
  const context = useContext(PlatformContext);
  
  // Check if we're getting the default context (not properly initialized)
  if (context === defaultContextValue) {
    DebugLogger.error('usePlatforms', 'Context not properly initialized - using default values');
    // Still return the context but log the error
  }
  
  return context;
}