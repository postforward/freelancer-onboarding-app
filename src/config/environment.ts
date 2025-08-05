// Environment configuration for development vs production
export const config = {
  // Toggle this to switch between mock and real data
  // VITE_USE_MOCK can be 'true', 'false', or undefined
  // If undefined, defaults to true in development mode
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK === 'true' || 
                 (import.meta.env.VITE_USE_MOCK !== 'false' && import.meta.env.MODE === 'development'),
  
  // Supabase configuration (only used when not using mock data)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // Helper to check if Supabase credentials are configured
  HAS_SUPABASE_CREDENTIALS: !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // API endpoints
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  
  // Feature flags
  FEATURES: {
    ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    ENABLE_DEBUG_LOGGING: import.meta.env.MODE === 'development',
    ENABLE_MOCK_DELAYS: import.meta.env.VITE_ENABLE_MOCK_DELAYS !== 'false', // Enabled by default in dev
  },
  
  // Mock configuration
  MOCK: {
    DEFAULT_LOGIN_EMAIL: 'admin@techflow.com',
    DEFAULT_LOGIN_PASSWORD: 'password',
    SIMULATE_SLOW_NETWORK: true,
    FAILURE_RATE: 0.1, // 10% failure rate for testing error handling
  }
};

// Environment helpers
export const isDevelopment = () => import.meta.env.MODE === 'development';
export const isProduction = () => import.meta.env.MODE === 'production';
export const useMockData = () => config.USE_MOCK_DATA || (window as any).__FORCE_MOCK_DATA === true;
export const hasSupabaseCredentials = () => config.HAS_SUPABASE_CREDENTIALS;

// Console logging helper that respects debug settings
export const debugLog = (...args: any[]) => {
  if (config.FEATURES.ENABLE_DEBUG_LOGGING) {
    console.log('[DEBUG]', ...args);
  }
};

// Development utilities
export const devUtils = {
  // Force enable mock data (useful for testing)
  enableMockData: () => {
    (window as any).__FORCE_MOCK_DATA = true;
  },
  
  // Force disable mock data
  disableMockData: () => {
    (window as any).__FORCE_MOCK_DATA = false;
  },
  
  // Get current data source
  getDataSource: () => {
    if ((window as any).__FORCE_MOCK_DATA !== undefined) {
      return (window as any).__FORCE_MOCK_DATA ? 'mock' : 'real';
    }
    return config.USE_MOCK_DATA ? 'mock' : 'real';
  },
  
  // Toggle data source
  toggleDataSource: () => {
    const current = devUtils.getDataSource();
    if (current === 'mock') {
      devUtils.disableMockData();
    } else {
      devUtils.enableMockData();
    }
    console.log(`Switched to ${devUtils.getDataSource()} data source. Reload the page to apply changes.`);
  }
};

// Make dev utils available globally in development
if (isDevelopment()) {
  (window as any).devUtils = devUtils;
  (window as any).config = config;
  console.log('🛠️  DevUtils available globally. Try: devUtils.toggleDataSource()');
  
  // Add connection panel toggle
  (window as any).toggleConnectionPanel = () => {
    const event = new CustomEvent('toggleSupabasePanel');
    window.dispatchEvent(event);
  };
  
  // Log current configuration on startup
  console.log('📋 Environment Configuration:');
  console.log(`   - Mode: ${import.meta.env.MODE}`);
  console.log(`   - VITE_USE_MOCK: ${import.meta.env.VITE_USE_MOCK || 'undefined'}`);
  console.log(`   - USE_MOCK_DATA: ${config.USE_MOCK_DATA}`);
  console.log(`   - Supabase URL: ${config.SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`   - Supabase Key: ${config.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}`);
  
  console.log('\n🔍 Dev Panel Controls:');
  console.log('   - toggleConnectionPanel() - Show/hide Supabase connection panel');
  console.log('   - testSupabaseConnection() - Run connection tests in console');
  console.log('   - Keyboard shortcut: Ctrl/Cmd + Shift + D');
}

export default config;