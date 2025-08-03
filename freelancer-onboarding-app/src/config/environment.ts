// Environment configuration for development vs production
export const config = {
  // Toggle this to switch between mock and real data
  USE_MOCK_DATA: process.env.NODE_ENV === 'development' || process.env.REACT_APP_USE_MOCK === 'true',
  
  // Supabase configuration (only used when not using mock data)
  SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
  
  // API endpoints
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api',
  
  // Feature flags
  FEATURES: {
    ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    ENABLE_DEBUG_LOGGING: process.env.NODE_ENV === 'development',
    ENABLE_MOCK_DELAYS: process.env.REACT_APP_ENABLE_MOCK_DELAYS !== 'false', // Enabled by default in dev
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
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production';
export const useMockData = () => config.USE_MOCK_DATA;

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
  console.log('🛠️  DevUtils available globally. Try: devUtils.toggleDataSource()');
}

export default config;