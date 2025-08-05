import { createClient } from '@supabase/supabase-js';
import { config, debugLog } from '../config/environment';
import type { Database } from '../types/database.types';

/**
 * Test Real Supabase Connection Function
 * 
 * This function tests the real Supabase connection using environment variables
 * and provides detailed feedback about what's working or failing.
 */

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: any;
}

export interface SupabaseConnectionTest {
  overall: boolean;
  credentials: ConnectionTestResult;
  connection: ConnectionTestResult;
  authentication: ConnectionTestResult;
  database: ConnectionTestResult;
  realtime: ConnectionTestResult;
  recommendations: string[];
}

export async function testRealSupabaseConnection(): Promise<SupabaseConnectionTest> {
  debugLog('🧪 Testing real Supabase connection...');
  
  const results: SupabaseConnectionTest = {
    overall: false,
    credentials: { success: false, message: '' },
    connection: { success: false, message: '' },
    authentication: { success: false, message: '' },
    database: { success: false, message: '' },
    realtime: { success: false, message: '' },
    recommendations: []
  };
  
  // Test 1: Credentials Check
  try {
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      results.credentials = {
        success: false,
        message: 'Missing Supabase credentials',
        details: {
          url: !!config.SUPABASE_URL,
          key: !!config.SUPABASE_ANON_KEY,
          source: 'Environment variables not loaded correctly'
        }
      };
      results.recommendations.push('Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local');
      return results;
    }
    
    // Validate URL format
    if (!config.SUPABASE_URL.startsWith('https://') || !config.SUPABASE_URL.includes('.supabase.co')) {
      results.credentials = {
        success: false,
        message: 'Invalid Supabase URL format',
        details: { url: config.SUPABASE_URL }
      };
      results.recommendations.push('Ensure VITE_SUPABASE_URL follows format: https://your-project.supabase.co');
      return results;
    }
    
    // Validate key format
    if (!config.SUPABASE_ANON_KEY.startsWith('eyJ')) {
      results.credentials = {
        success: false,
        message: 'Supabase key does not appear to be a valid JWT token',
        details: { keyStart: config.SUPABASE_ANON_KEY.substring(0, 10) }
      };
      results.recommendations.push('Ensure VITE_SUPABASE_ANON_KEY is the correct anon/public key from Supabase dashboard');
    }
    
    results.credentials = {
      success: true,
      message: 'Credentials are properly configured',
      details: {
        url: `${config.SUPABASE_URL.substring(0, 30)}...`,
        keyFormat: 'Valid JWT format',
        keyLength: config.SUPABASE_ANON_KEY.length
      }
    };
    
  } catch (error) {
    results.credentials = {
      success: false,
      message: 'Error validating credentials',
      error: error instanceof Error ? error.message : error
    };
    return results;
  }
  
  // Test 2: Create Client and Basic Connection
  let supabase;
  try {
    debugLog('Creating Supabase client for testing...');
    supabase = createClient<Database>(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Don't persist in tests
        detectSessionInUrl: false
      }
    });
    
    // Test basic connectivity with auth endpoint
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      results.connection = {
        success: false,
        message: 'Failed to connect to Supabase',
        error: error.message,
        details: { code: error.message }
      };
      results.recommendations.push('Check your internet connection and Supabase service status');
      return results;
    }
    
    results.connection = {
      success: true,
      message: 'Successfully connected to Supabase',
      details: {
        hasSession: !!data.session,
        endpoint: 'Auth endpoint responding correctly'
      }
    };
    
  } catch (error) {
    results.connection = {
      success: false,
      message: 'Network error connecting to Supabase',
      error: error instanceof Error ? error.message : error
    };
    results.recommendations.push('Check network connectivity and firewall settings');
    return results;
  }
  
  // Test 3: Authentication Capabilities
  try {
    debugLog('Testing authentication endpoints...');
    
    // Test with invalid credentials to see if auth is working
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    
    if (signInError) {
      // This is expected - means auth is working
      if (signInError.message.includes('Invalid login credentials') || 
          signInError.message.includes('invalid')) {
        results.authentication = {
          success: true,
          message: 'Authentication endpoints working correctly',
          details: {
            expectedError: signInError.message,
            status: 'Auth system properly rejecting invalid credentials'
          }
        };
      } else {
        results.authentication = {
          success: false,
          message: 'Authentication endpoint error',
          error: signInError.message,
          details: { unexpectedError: true }
        };
        results.recommendations.push('Check Supabase auth configuration in dashboard');
      }
    } else {
      results.authentication = {
        success: false,
        message: 'Authentication accepted invalid credentials - check auth settings',
        details: { securityConcern: true }
      };
      results.recommendations.push('Review authentication settings in Supabase dashboard');
    }
    
  } catch (error) {
    results.authentication = {
      success: false,
      message: 'Error testing authentication',
      error: error instanceof Error ? error.message : error
    };
  }
  
  // Test 4: Database Access
  try {
    debugLog('Testing database access...');
    
    // Try a simple query to test database connectivity and RLS
    const { data, error, count } = await supabase
      .from('organizations')
      .select('id', { count: 'exact' })
      .limit(1);
    
    if (error) {
      if (error.code === '42501') {
        // Permission denied - RLS working correctly
        results.database = {
          success: true,
          message: 'Database accessible with RLS protection working',
          details: {
            rlsStatus: 'Row Level Security is properly configured',
            note: 'Permission denied is expected when not authenticated'
          }
        };
      } else if (error.code === '42P01') {
        // Table doesn't exist
        results.database = {
          success: false,
          message: 'Database schema not found',
          error: error.message,
          details: { missingTables: true }
        };
        results.recommendations.push('Run database migrations: execute the schema.sql file in Supabase SQL editor');
      } else if (error.code === '42P17') {
        // Infinite recursion in RLS policies
        results.database = {
          success: false,
          message: 'RLS policy infinite recursion detected',
          error: error.message,
          details: { rlsIssue: true }
        };
        results.recommendations.push('Apply RLS policy fixes: run fix-rls-policies.sql in Supabase SQL editor');
      } else {
        results.database = {
          success: false,
          message: 'Database query failed',
          error: error.message,
          details: { code: error.code, hint: error.hint }
        };
        results.recommendations.push('Check database configuration and RLS policies');
      }
    } else {
      results.database = {
        success: true,
        message: 'Database query successful',
        details: {
          recordsFound: count || 0,
          accessLevel: 'Full database access working'
        }
      };
    }
    
  } catch (error) {
    results.database = {
      success: false,
      message: 'Database connection error',
      error: error instanceof Error ? error.message : error
    };
  }
  
  // Test 5: Real-time Connection
  try {
    debugLog('Testing real-time connection...');
    
    const testChannel = supabase.channel('connection-test');
    let realtimeWorking = false;
    
    const realtimePromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Real-time connection timeout'));
      }, 5000);
      
      testChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          realtimeWorking = true;
          clearTimeout(timeout);
          resolve();
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          reject(new Error('Real-time channel error'));
        }
      });
    });
    
    await realtimePromise;
    await supabase.removeChannel(testChannel);
    
    results.realtime = {
      success: true,
      message: 'Real-time connection working',
      details: {
        websocket: 'Connected successfully',
        subscriptions: 'Channel subscription/unsubscription working'
      }
    };
    
  } catch (error) {
    results.realtime = {
      success: false,
      message: 'Real-time connection failed',
      error: error instanceof Error ? error.message : error,
      details: {
        note: 'Real-time may not be available in all environments',
        impact: 'Live updates may not work, but basic functionality should be fine'
      }
    };
    results.recommendations.push('Real-time issues are often network/firewall related and may not affect basic functionality');
  }
  
  // Calculate overall success
  const criticalTests = [results.credentials, results.connection, results.database];
  const nonCriticalTests = [results.authentication, results.realtime];
  
  const criticalSuccess = criticalTests.every(test => test.success);
  const hasMinorIssues = nonCriticalTests.some(test => !test.success);
  
  results.overall = criticalSuccess;
  
  if (results.overall) {
    if (!hasMinorIssues) {
      results.recommendations.push('🎉 All tests passed! Your Supabase integration is fully functional.');
    } else {
      results.recommendations.push('✅ Core functionality working! Minor issues detected but won\'t affect basic operations.');
    }
  }
  
  debugLog('Real Supabase connection test completed', results);
  return results;
}

// Make function available globally in development
if (config.FEATURES.ENABLE_DEBUG_LOGGING) {
  (window as any).testRealSupabaseConnection = testRealSupabaseConnection;
  console.log('🧪 Real Supabase connection test available: testRealSupabaseConnection()');
}