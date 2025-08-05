import { useEffect, useRef } from 'react';
import { realtime, isRealtimeAvailable } from '../services/supabase';
import { debugLog } from '../config/environment';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Custom hook for managing real-time subscriptions
 * Automatically handles subscription lifecycle and cleanup
 */
export function useRealtimeSubscription(
  subscribe: () => RealtimeChannel | null,
  deps: React.DependencyList = []
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isRealtimeAvailable()) {
      debugLog('Real-time subscriptions not available');
      return;
    }

    // Subscribe
    channelRef.current = subscribe();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        realtime.unsubscribe(channelRef.current);
        channelRef.current = null;
      }
    };
  }, deps);

  return channelRef.current;
}

/**
 * Hook for subscribing to freelancer updates in real-time
 */
export function useFreelancerUpdates(
  organizationId: string,
  callbacks: {
    onInsert?: (freelancer: any) => void;
    onUpdate?: (freelancer: any) => void;
    onDelete?: (freelancer: any) => void;
  }
) {
  return useRealtimeSubscription(
    () => realtime.subscribeToFreelancers(organizationId, callbacks),
    [organizationId]
  );
}

/**
 * Hook for subscribing to freelancer platform status updates
 */
export function useFreelancerPlatformUpdates(
  freelancerId: string | null,
  onUpdate: (platform: any) => void
) {
  return useRealtimeSubscription(
    () => {
      if (!freelancerId) return null;
      return realtime.subscribeToFreelancerPlatforms(freelancerId, onUpdate);
    },
    [freelancerId]
  );
}

/**
 * Hook for subscribing to platform configuration updates
 */
export function usePlatformUpdates(
  organizationId: string,
  onUpdate: (platform: any) => void
) {
  return useRealtimeSubscription(
    () => realtime.subscribeToPlatforms(organizationId, onUpdate),
    [organizationId]
  );
}