// Export the client from service factory to avoid circular imports
export { supabase } from './serviceFactory';
import { supabase, isUsingRealSupabase } from './serviceFactory';
import { debugLog } from '../config/environment';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Type definitions for real-time payloads
type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

export type RealtimePayload<T extends TableName> = RealtimePostgresChangesPayload<TableRow<T>>;

// Auth helper functions that work with both mock and real clients
export const auth = {
  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  updateUser: async (attributes: { email?: string; password?: string; data?: Record<string, any> }) => {
    const { data, error } = await supabase.auth.updateUser(attributes);
    return { data, error };
  },
};

// Real-time subscription helper with enhanced functionality
export const realtime = {
  // Subscribe to all changes on a table
  subscribe: <T extends TableName>(
    table: T,
    callback: (payload: RealtimePayload<T>) => void,
    options?: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      filter?: string;
      onSubscribed?: () => void;
      onError?: (error: Error) => void;
    }
  ): RealtimeChannel | null => {
    if (!isUsingRealSupabase()) {
      debugLog('Real-time subscriptions not available in mock mode');
      return null;
    }

    try {
      const channelName = `${table}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const channel = supabase.channel(channelName);
      
      // Set up the subscription
      const subscription = channel.on(
        'postgres_changes',
        {
          event: options?.event || '*',
          schema: 'public',
          table: table as string,
          filter: options?.filter,
        },
        (payload: any) => {
          debugLog(`Real-time event on ${table}:`, payload);
          callback(payload as RealtimePayload<T>);
        }
      );
      
      // Subscribe and handle status
      subscription.subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          debugLog(`Successfully subscribed to ${table}`);
          options?.onSubscribed?.();
        } else if (status === 'CHANNEL_ERROR') {
          const error = new Error(`Failed to subscribe to ${table}`);
          debugLog('Subscription error:', error);
          options?.onError?.(error);
        } else if (status === 'TIMED_OUT') {
          const error = new Error(`Subscription to ${table} timed out`);
          debugLog('Subscription timeout:', error);
          options?.onError?.(error);
        }
      });
      
      return channel;
    } catch (error) {
      debugLog('Error setting up real-time subscription:', error);
      options?.onError?.(error as Error);
      return null;
    }
  },

  // Subscribe to specific changes for freelancers
  subscribeToFreelancers: (
    organizationId: string,
    callbacks: {
      onInsert?: (freelancer: TableRow<'freelancers'>) => void;
      onUpdate?: (freelancer: TableRow<'freelancers'>) => void;
      onDelete?: (freelancer: TableRow<'freelancers'>) => void;
    }
  ): RealtimeChannel | null => {
    return realtime.subscribe(
      'freelancers',
      (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            callbacks.onInsert?.(payload.new as TableRow<'freelancers'>);
            break;
          case 'UPDATE':
            callbacks.onUpdate?.(payload.new as TableRow<'freelancers'>);
            break;
          case 'DELETE':
            callbacks.onDelete?.(payload.old as TableRow<'freelancers'>);
            break;
        }
      },
      {
        filter: `organization_id=eq.${organizationId}`,
      }
    );
  },

  // Subscribe to freelancer platform status updates
  subscribeToFreelancerPlatforms: (
    freelancerId: string,
    onUpdate: (platform: TableRow<'freelancer_platforms'>) => void
  ): RealtimeChannel | null => {
    return realtime.subscribe(
      'freelancer_platforms',
      (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          onUpdate(payload.new as TableRow<'freelancer_platforms'>);
        }
      },
      {
        event: 'UPDATE',
        filter: `freelancer_id=eq.${freelancerId}`,
      }
    );
  },

  // Subscribe to platform configuration changes
  subscribeToPlatforms: (
    organizationId: string,
    onUpdate: (platform: TableRow<'platforms'>) => void
  ): RealtimeChannel | null => {
    return realtime.subscribe(
      'platforms',
      (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          onUpdate(payload.new as TableRow<'platforms'>);
        }
      },
      {
        event: 'UPDATE',
        filter: `organization_id=eq.${organizationId}`,
      }
    );
  },

  // Unsubscribe from a channel
  unsubscribe: async (channel: RealtimeChannel | null): Promise<void> => {
    if (!channel) return;
    
    try {
      debugLog('Unsubscribing from channel');
      await supabase.removeChannel(channel);
    } catch (error) {
      debugLog('Error unsubscribing from channel:', error);
    }
  },

  // Unsubscribe from all channels
  unsubscribeAll: async (): Promise<void> => {
    try {
      debugLog('Unsubscribing from all channels');
      await supabase.removeAllChannels();
    } catch (error) {
      debugLog('Error unsubscribing from all channels:', error);
    }
  },
};

// Storage helper functions
export const storage = {
  upload: async (bucket: string, path: string, file: File) => {
    if (!supabase.storage) {
      return { data: null, error: { message: 'Storage not available in mock mode' } };
    }
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    return { data, error };
  },

  download: async (bucket: string, path: string) => {
    if (!supabase.storage) {
      return { data: null, error: { message: 'Storage not available in mock mode' } };
    }
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    return { data, error };
  },

  getPublicUrl: (bucket: string, path: string) => {
    if (!supabase.storage) {
      return `https://mock-storage.example.com/${bucket}/${path}`;
    }
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  remove: async (bucket: string, paths: string[]) => {
    if (!supabase.storage) {
      return { data: null, error: { message: 'Storage not available in mock mode' } };
    }
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);
    return { data, error };
  },
};

// Helper to check if real-time is available
export const isRealtimeAvailable = (): boolean => {
  return isUsingRealSupabase() && typeof supabase.channel === 'function';
};

export default supabase;