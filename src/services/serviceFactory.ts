import { config, debugLog } from '../config/environment';
import { mockSupabase } from '../mock/supabase';
import { mockPlatforms } from '../mock/platforms';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Create real Supabase client if needed
let realSupabase: any = null;
if (!config.USE_MOCK_DATA && config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
  realSupabase = createClient<Database>(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

// Real platforms will be loaded here when available
let realPlatforms: any = null;

// Service factory that returns appropriate service based on configuration
export const getSupabaseClient = () => {
  const useMock = config.USE_MOCK_DATA || (window as any).__FORCE_MOCK_DATA === true;
  
  if (useMock || !realSupabase) {
    debugLog('Using mock Supabase client');
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

// Development helper to switch services at runtime
export const switchToMockServices = () => {
  (window as any).__FORCE_MOCK_DATA = true;
  console.log('⚠️  Switched to mock services. Reload the page to apply changes.');
};

export const switchToRealServices = () => {
  (window as any).__FORCE_MOCK_DATA = false;
  console.log('⚠️  Switched to real services. Reload the page to apply changes.');
};

// Make service switching available globally in development
if (config.FEATURES.ENABLE_DEBUG_LOGGING) {
  (window as any).switchToMockServices = switchToMockServices;
  (window as any).switchToRealServices = switchToRealServices;
  console.log('🔧 Service switching available: switchToMockServices(), switchToRealServices()');
}