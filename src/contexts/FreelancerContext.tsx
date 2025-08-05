import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useTenant } from './TenantContext';
import { useToast } from './ToastContext';
import { usePlatforms } from './PlatformContext';
import { useAuth } from './AuthContext';

export interface Freelancer {
  id: string;
  organization_id: string;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  phone?: string;
  status: 'pending' | 'active' | 'inactive' | 'error';
  created_at: string;
  updated_at: string;
  created_by: string;
  metadata?: Record<string, any>;
}

// Helper function to get full name from freelancer
export const getFreelancerFullName = (freelancer: Freelancer): string => {
  return `${freelancer.first_name} ${freelancer.last_name}`.trim();
};

// Input type for creating freelancers (uses first_name/last_name)
export interface FreelancerCreateInput {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  username?: string;
  metadata?: Record<string, any>;
}

export interface FreelancerPlatform {
  id: string;
  freelancer_id: string;
  platform_id: string;
  status: 'pending' | 'provisioning' | 'active' | 'failed' | 'deactivated';
  platform_user_id?: string;
  error_message?: string;
  provisioned_at?: string;
  last_sync_at?: string;
  metadata?: Record<string, any>;
}

export interface OnboardingProgress {
  freelancerId: string;
  totalPlatforms: number;
  completedPlatforms: number;
  failedPlatforms: number;
  currentPlatform?: string;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  errors: Array<{ platform: string; error: string }>;
}

interface FreelancerContextType {
  freelancers: Freelancer[];
  freelancerPlatforms: Map<string, FreelancerPlatform[]>;
  loading: boolean;
  onboardingProgress: Map<string, OnboardingProgress>;
  
  // Freelancer management
  createFreelancer: (data: FreelancerCreateInput) => Promise<Freelancer>;
  updateFreelancer: (id: string, data: Partial<Freelancer>) => Promise<void>;
  deleteFreelancer: (id: string) => Promise<void>;
  getFreelancer: (id: string) => Freelancer | undefined;
  
  // Platform operations
  onboardFreelancerToPlatforms: (freelancerId: string, platformIds: string[]) => Promise<void>;
  deactivateFreelancerFromPlatform: (freelancerId: string, platformId: string) => Promise<void>;
  retryFailedPlatform: (freelancerId: string, platformId: string) => Promise<void>;
  toggleFreelancerPlatformAccess: (freelancerId: string, platformId: string, enabled: boolean) => Promise<void>;
  
  // Bulk operations
  bulkOnboardFreelancers: (freelancerIds: string[], platformIds: string[]) => Promise<void>;
  bulkDeactivateFreelancers: (freelancerIds: string[]) => Promise<void>;
  bulkReactivateFreelancers: (freelancerIds: string[]) => Promise<void>;
  
  // Utility functions
  getFreelancerPlatforms: (freelancerId: string) => FreelancerPlatform[];
  getOnboardingProgress: (freelancerId: string) => OnboardingProgress | undefined;
  refreshFreelancers: () => Promise<void>;
}

const FreelancerContext = createContext<FreelancerContextType | undefined>(undefined);

export function FreelancerProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useTenant();
  const { showToast } = useToast();
  const { platforms, getPlatformConfig } = usePlatforms();
  const { dbUser } = useAuth();
  
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [freelancerPlatforms, setFreelancerPlatforms] = useState<Map<string, FreelancerPlatform[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [onboardingProgress, setOnboardingProgress] = useState<Map<string, OnboardingProgress>>(new Map());

  // Load freelancers and their platform associations
  const loadFreelancers = useCallback(async () => {
    if (!organization?.id) {
      console.log('No current organization, skipping freelancer load');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading freelancers for organization:', organization.id);
      // Load freelancers
      const { data: freelancersData, error: freelancersError } = await supabase
        .from('freelancers')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (freelancersError) {
        console.error('Error loading freelancers:', freelancersError);
        throw freelancersError;
      }

      console.log('Loaded freelancers:', freelancersData);
      setFreelancers(freelancersData || []);

      // Load platform associations
      if (freelancersData && freelancersData.length > 0) {
        const freelancerIds = freelancersData.map((f: any) => f.id);
        const { data: platformsData, error: platformsError } = await supabase
          .from('freelancer_platforms')
          .select('*')
          .in('freelancer_id', freelancerIds);

        if (platformsError) throw platformsError;

        // Group platforms by freelancer
        const platformsMap = new Map<string, FreelancerPlatform[]>();
        freelancersData.forEach((freelancer: any) => {
          const platforms = platformsData?.filter((p: any) => p.freelancer_id === freelancer.id) || [];
          platformsMap.set(freelancer.id, platforms);
        });

        setFreelancerPlatforms(platformsMap);
      }
    } catch (error) {
      console.error('Error loading freelancers:', error);
      showToast('Failed to load freelancers', 'error');
    }
  }, [organization?.id, showToast]);

  // Create a new freelancer
  const createFreelancer = useCallback(async (data: FreelancerCreateInput) => {
    if (!organization?.id) {
      throw new Error('No organization selected');
    }

    const { data: freelancer, error } = await supabase
      .from('freelancers')
      .insert({
        ...data,
        organization_id: organization.id,
        created_by: dbUser?.id || organization.id, // Use current user ID or fallback to org ID
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Update state immediately to prevent race conditions
    setFreelancers(prev => [...prev, freelancer]);
    
    // Also reload freelancers to ensure consistency
    await loadFreelancers();
    showToast('Freelancer created successfully', 'success');
    return freelancer;
  }, [organization?.id, loadFreelancers, showToast]);

  // Update freelancer (internal version without toast)
  const updateFreelancerInternal = useCallback(async (id: string, data: Partial<Freelancer>) => {
    const { error } = await supabase
      .from('freelancers')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    await loadFreelancers();
  }, [loadFreelancers]);

  // Update freelancer (public version with toast)
  const updateFreelancer = useCallback(async (id: string, data: Partial<Freelancer>) => {
    await updateFreelancerInternal(id, data);
    showToast('Freelancer updated successfully', 'success');
  }, [updateFreelancerInternal, showToast]);

  // Delete freelancer
  const deleteFreelancer = useCallback(async (id: string) => {
    // First deactivate from all platforms
    const platforms = freelancerPlatforms.get(id) || [];
    for (const platform of platforms) {
      if (platform.status === 'active') {
        await deactivateFreelancerFromPlatform(id, platform.platform_id);
      }
    }

    // Then delete the freelancer
    const { error } = await supabase
      .from('freelancers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await loadFreelancers();
    showToast('Freelancer deleted successfully', 'success');
  }, [freelancerPlatforms, showToast]);

  // Onboard freelancer to platforms
  const onboardFreelancerToPlatforms = useCallback(async (freelancerId: string, platformIds: string[]) => {
    let freelancer = freelancers.find(f => f.id === freelancerId);
    
    // If freelancer not found in state (timing issue), fetch from database
    if (!freelancer) {
      console.log('Freelancer not found in state, fetching from database...');
      try {
        const { data: fetchedFreelancer, error } = await supabase
          .from('freelancers')
          .select('*')
          .eq('id', freelancerId)
          .single();
          
        if (error) throw error;
        if (!fetchedFreelancer) {
          throw new Error('Freelancer not found in database');
        }
        
        freelancer = fetchedFreelancer;
        console.log('Freelancer fetched from database:', freelancer);
      } catch (error) {
        console.error('Error fetching freelancer:', error);
        throw new Error('Freelancer not found');
      }
    }

    // Initialize progress tracking
    const progress: OnboardingProgress = {
      freelancerId,
      totalPlatforms: platformIds.length,
      completedPlatforms: 0,
      failedPlatforms: 0,
      status: 'processing',
      errors: []
    };
    setOnboardingProgress(prev => new Map(prev).set(freelancerId, progress));

    for (const platformId of platformIds) {
      progress.currentPlatform = platformId;
      setOnboardingProgress(prev => new Map(prev).set(freelancerId, { ...progress }));

      try {
        // Check if platform is enabled
        const platformConfig = getPlatformConfig(platformId);
        if (!platformConfig?.is_enabled) {
          throw new Error(`Platform ${platformId} is not enabled`);
        }

        // Get platform module
        const platformModule = platforms.get(platformId);
        if (!platformModule) {
          throw new Error(`Platform module ${platformId} not found`);
        }

        // Create platform association record
        const { data: platformAssoc, error: assocError } = await supabase
          .from('freelancer_platforms')
          .insert({
            freelancer_id: freelancerId,
            platform_id: platformId,
            status: 'provisioning'
          })
          .select()
          .single();

        if (assocError) throw assocError;

        // Create user on platform
        const result = await platformModule.createUser({
          email: freelancer!.email,
          fullName: `${freelancer!.first_name} ${freelancer!.last_name}`.trim(),
          ...freelancer!.metadata?.[platformId] // Platform-specific metadata
        });

        if (result.success && result.data) {
          // Update platform association with success
          await supabase
            .from('freelancer_platforms')
            .update({
              status: 'active',
              platform_user_id: result.data.id,
              provisioned_at: new Date().toISOString(),
              metadata: result.data.metadata
            })
            .eq('id', platformAssoc.id);

          progress.completedPlatforms++;
        } else {
          // Update platform association with failure
          await supabase
            .from('freelancer_platforms')
            .update({
              status: 'failed'
              // Note: error_message column doesn't exist, store error in metadata instead
            })
            .eq('id', platformAssoc.id);

          progress.failedPlatforms++;
          progress.errors.push({
            platform: platformId,
            error: result.error || 'Unknown error'
          });
        }
      } catch (error) {
        progress.failedPlatforms++;
        progress.errors.push({
          platform: platformId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update final progress
    progress.status = progress.failedPlatforms === 0 ? 'completed' : 'failed';
    progress.currentPlatform = undefined;
    setOnboardingProgress(prev => new Map(prev).set(freelancerId, progress));

    // Update freelancer status (without showing toast)
    const newStatus = progress.failedPlatforms === 0 ? 'active' : 
                     progress.completedPlatforms > 0 ? 'active' : 'error';
    await updateFreelancerInternal(freelancerId, { status: newStatus });

    await loadFreelancers();

    if (progress.failedPlatforms === 0) {
      showToast('Freelancer onboarded successfully', 'success');
    } else {
      showToast(`Onboarding completed with ${progress.failedPlatforms} errors`, 'warning');
    }
  }, [freelancers, platforms, getPlatformConfig, updateFreelancerInternal, loadFreelancers, showToast]);

  // Deactivate freelancer from platform
  const deactivateFreelancerFromPlatform = useCallback(async (freelancerId: string, platformId: string) => {
    const platformAssoc = freelancerPlatforms.get(freelancerId)?.find(p => p.platform_id === platformId);
    if (!platformAssoc || platformAssoc.status !== 'active') {
      return;
    }

    try {
      const platformModule = platforms.get(platformId);
      if (!platformModule) {
        throw new Error(`Platform module ${platformId} not found`);
      }

      // Delete user from platform
      if (platformAssoc.platform_user_id) {
        const result = await platformModule.deleteUser(platformAssoc.platform_user_id);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete user from platform');
        }
      }

      // Update platform association
      await supabase
        .from('freelancer_platforms')
        .update({
          status: 'deactivated',
          updated_at: new Date().toISOString()
        })
        .eq('id', platformAssoc.id);

      await loadFreelancers();
      showToast('Freelancer deactivated from platform', 'success');
    } catch (error) {
      showToast('Failed to deactivate freelancer', 'error');
      throw error;
    }
  }, [freelancerPlatforms, platforms, loadFreelancers, showToast]);

  // Retry failed or reactivate deactivated platform
  const retryFailedPlatform = useCallback(async (freelancerId: string, platformId: string) => {
    const platformAssoc = freelancerPlatforms.get(freelancerId)?.find(p => p.platform_id === platformId);
    if (!platformAssoc || (platformAssoc.status !== 'failed' && platformAssoc.status !== 'deactivated')) {
      return;
    }

    await onboardFreelancerToPlatforms(freelancerId, [platformId]);
  }, [freelancerPlatforms, onboardFreelancerToPlatforms]);

  // Toggle platform access for individual freelancer
  const toggleFreelancerPlatformAccess = useCallback(async (freelancerId: string, platformId: string, enabled: boolean) => {
    const platformAssoc = freelancerPlatforms.get(freelancerId)?.find(p => p.platform_id === platformId);
    
    if (enabled) {
      // Enable platform access
      if (!platformAssoc) {
        // Create new platform association
        await onboardFreelancerToPlatforms(freelancerId, [platformId]);
      } else if (platformAssoc.status === 'deactivated' || platformAssoc.status === 'failed') {
        // Reactivate existing platform
        await retryFailedPlatform(freelancerId, platformId);
      }
    } else {
      // Disable platform access
      if (platformAssoc && platformAssoc.status === 'active') {
        await deactivateFreelancerFromPlatform(freelancerId, platformId);
      }
    }
  }, [freelancerPlatforms, onboardFreelancerToPlatforms, retryFailedPlatform, deactivateFreelancerFromPlatform]);

  // Bulk operations
  const bulkOnboardFreelancers = useCallback(async (freelancerIds: string[], platformIds: string[]) => {
    for (const freelancerId of freelancerIds) {
      await onboardFreelancerToPlatforms(freelancerId, platformIds);
    }
  }, [onboardFreelancerToPlatforms]);

  const bulkDeactivateFreelancers = useCallback(async (freelancerIds: string[]) => {
    for (const freelancerId of freelancerIds) {
      await updateFreelancerInternal(freelancerId, { status: 'inactive' });
    }
    showToast(`${freelancerIds.length} freelancer(s) deactivated successfully`, 'success');
  }, [updateFreelancerInternal, showToast]);

  const bulkReactivateFreelancers = useCallback(async (freelancerIds: string[]) => {
    for (const freelancerId of freelancerIds) {
      await updateFreelancerInternal(freelancerId, { status: 'active' });
    }
    showToast(`${freelancerIds.length} freelancer(s) reactivated successfully`, 'success');
  }, [updateFreelancerInternal, showToast]);

  // Utility functions
  const getFreelancer = useCallback((id: string) => {
    return freelancers.find(f => f.id === id);
  }, [freelancers]);

  const getFreelancerPlatforms = useCallback((freelancerId: string) => {
    return freelancerPlatforms.get(freelancerId) || [];
  }, [freelancerPlatforms]);

  const getOnboardingProgress = useCallback((freelancerId: string) => {
    return onboardingProgress.get(freelancerId);
  }, [onboardingProgress]);

  const refreshFreelancers = useCallback(async () => {
    setLoading(true);
    await loadFreelancers();
    setLoading(false);
  }, [loadFreelancers]);

  // Subscribe to freelancer changes
  useEffect(() => {
    if (!organization?.id) return;

    let subscription: any;
    try {
      subscription = supabase
        .channel(`freelancers:${organization.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'freelancers',
            filter: `organization_id=eq.${organization.id}`
          },
          () => {
            loadFreelancers();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'freelancer_platforms'
          },
          () => {
            loadFreelancers();
          }
        )
        .subscribe();
    } catch (error) {
      console.log('Real-time subscriptions not available in mock mode:', error);
    }

    return () => {
      try {
        subscription?.unsubscribe();
      } catch (error) {
        console.log('Subscription cleanup error (expected in mock mode):', error);
      }
    };
  }, [organization?.id, loadFreelancers]);

  // Initial load
  useEffect(() => {
    if (organization?.id) {
      setLoading(true);
      loadFreelancers().finally(() => setLoading(false));
    }
  }, [organization?.id, loadFreelancers]);

  const value: FreelancerContextType = {
    freelancers,
    freelancerPlatforms,
    loading,
    onboardingProgress,
    createFreelancer,
    updateFreelancer,
    deleteFreelancer,
    getFreelancer,
    onboardFreelancerToPlatforms,
    deactivateFreelancerFromPlatform,
    retryFailedPlatform,
    toggleFreelancerPlatformAccess,
    bulkOnboardFreelancers,
    bulkDeactivateFreelancers,
    bulkReactivateFreelancers,
    getFreelancerPlatforms,
    getOnboardingProgress,
    refreshFreelancers
  };

  return (
    <FreelancerContext.Provider value={value}>
      {children}
    </FreelancerContext.Provider>
  );
}

export function useFreelancers() {
  const context = useContext(FreelancerContext);
  if (context === undefined) {
    throw new Error('useFreelancers must be used within a FreelancerProvider');
  }
  return context;
}