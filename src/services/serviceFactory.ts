import { config, debugLog } from '../config/environment';
import { mockSupabase } from '../mock/supabase';
import { mockPlatforms } from '../mock/platforms';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Create real Supabase client if needed
let realSupabase: any = null;
let supabaseError: string | null = null;

if (!config.USE_MOCK_DATA) {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    supabaseError = 'Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.';
    console.error('⚠️ Supabase configuration error:', supabaseError);
  } else {
    try {
      realSupabase = createClient<Database>(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
      debugLog('Real Supabase client initialized successfully');
    } catch (error) {
      supabaseError = `Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('⚠️ Supabase initialization error:', supabaseError);
    }
  }
}

// Real platforms will be loaded here when available
let realPlatforms: any = null;

// Service factory that returns appropriate service based on configuration
export const getSupabaseClient = () => {
  const useMock = config.USE_MOCK_DATA || (window as any).__FORCE_MOCK_DATA === true;
  
  if (useMock) {
    debugLog('Using mock Supabase client (mock mode enabled)');
    return mockSupabase;
  }
  
  if (!realSupabase) {
    if (supabaseError) {
      console.warn('⚠️ Falling back to mock Supabase client due to error:', supabaseError);
    } else {
      console.warn('⚠️ Falling back to mock Supabase client (real client not initialized)');
    }
    return mockSupabase;
  }
  
  debugLog('Using real Supabase client');
  return realSupabase;
};

export const getPlatformServices = () => {
  const useMock = config.USE_MOCK_DATA || (window as any).__FORCE_MOCK_DATA === true;
  
  if (useMock || !realPlatforms) {
    debugLog('Using mock platform services');
    return mockPlatforms;
  }
  
  debugLog('Using real platform services');
  return realPlatforms;
};

// Export the chosen services
export const supabase = getSupabaseClient();
export const platforms = getPlatformServices();

// Export a function to check if we're using real services
export const isUsingRealSupabase = () => {
  const client = getSupabaseClient();
  return client === realSupabase && realSupabase !== null;
};

// Export error state for UI components to show warnings if needed
export const getSupabaseError = () => supabaseError;

// Development helper to switch services at runtime
export const switchToMockServices = () => {
  (window as any).__FORCE_MOCK_DATA = true;
  console.log('⚠️  Switched to mock services. Reload the page to apply changes.');
};

export const switchToRealServices = () => {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    console.error('❌ Cannot switch to real services: Missing Supabase credentials');
    console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file');
    return;
  }
  (window as any).__FORCE_MOCK_DATA = false;
  console.log('⚠️  Switched to real services. Reload the page to apply changes.');
};

// Make service switching available globally in development
if (config.FEATURES.ENABLE_DEBUG_LOGGING) {
  (window as any).switchToMockServices = switchToMockServices;
  (window as any).switchToRealServices = switchToRealServices;
  (window as any).getSupabaseStatus = () => ({
    isUsingReal: isUsingRealSupabase(),
    error: getSupabaseError(),
    url: config.SUPABASE_URL ? config.SUPABASE_URL.substring(0, 30) + '...' : 'Not set',
    hasKey: !!config.SUPABASE_ANON_KEY
  });
  console.log('🔧 Service switching available: switchToMockServices(), switchToRealServices()');
  console.log('🔍 Check status with: getSupabaseStatus()');
  
  // Log current status
  if (isUsingRealSupabase()) {
    console.log('✅ Using real Supabase client');
  } else if (supabaseError) {
    console.log('⚠️  Using mock Supabase client due to:', supabaseError);
  } else {
    console.log('🔄 Using mock Supabase client (mock mode enabled)');
  }
}