// Export the client from service factory to avoid circular imports
export { supabase } from './serviceFactory';
import { supabase } from './serviceFactory';

// Auth helper functions that work with both mock and real clients
export const auth = {
  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
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

// Real-time subscription helper
export const realtime = {
  subscribe: (table: string, callback: (payload: any) => void) => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
    
    return subscription;
  },

  unsubscribe: (subscription: any) => {
    if (supabase.removeChannel) {
      supabase.removeChannel(subscription);
    } else if (subscription.unsubscribe) {
      subscription.unsubscribe();
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

export default supabase;