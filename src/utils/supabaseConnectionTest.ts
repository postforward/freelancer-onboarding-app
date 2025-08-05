import { supabase, auth } from '../services/supabase';
import { db } from '../services/database.service';
import { isUsingRealSupabase, getSupabaseError } from '../services/serviceFactory';
import { config } from '../config/environment';
import type { User } from '@supabase/supabase-js';

export interface ConnectionTestResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
  duration?: number;
}

export interface SupabaseConnectionStatus {
  isConnected: boolean;
  isUsingReal: boolean;
  connectionError?: string;
  results: ConnectionTestResult[];
  timestamp: string;
}

/**
 * Comprehensive Supabase connection testing utility
 */
export class SupabaseConnectionTester {
  private results: ConnectionTestResult[] = [];

  /**
   * Run all connection tests
   */
  async runAllTests(): Promise<SupabaseConnectionStatus> {
    this.results = [];
    const startTime = Date.now();

    // Check if using real Supabase
    const isReal = isUsingRealSupabase();
    const error = getSupabaseError();

    if (!isReal) {
      this.addResult({
        test: 'Connection Mode',
        status: 'info',
        message: 'Using mock Supabase client',
        details: { reason: error || 'Mock mode enabled' }
      });

      return {
        isConnected: false,
        isUsingReal: false,
        connectionError: error || undefined,
        results: this.results,
        timestamp: new Date().toISOString()
      };
    }

    // Run tests sequentially
    await this.testConfiguration();
    await this.testConnection();
    await this.testAuthentication();
    await this.testDatabaseAccess();
    await this.testRLSPolicies();
    await this.testRealtimeConnection();

    const totalDuration = Date.now() - startTime;
    this.addResult({
      test: 'Total Test Duration',
      status: 'info',
      message: `All tests completed in ${totalDuration}ms`,
      duration: totalDuration
    });

    const hasErrors = this.results.some(r => r.status === 'error');
    
    return {
      isConnected: !hasErrors,
      isUsingReal: true,
      results: this.results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test 1: Configuration
   */
  private async testConfiguration(): Promise<void> {
    const start = Date.now();
    
    try {
      const hasUrl = !!config.SUPABASE_URL;
      const hasKey = !!config.SUPABASE_ANON_KEY;
      const urlValid = config.SUPABASE_URL.startsWith('https://') && 
                       config.SUPABASE_URL.includes('.supabase.co');

      if (!hasUrl || !hasKey) {
        this.addResult({
          test: 'Configuration',
          status: 'error',
          message: 'Missing Supabase credentials',
          details: { hasUrl, hasKey },
          duration: Date.now() - start
        });
      } else if (!urlValid) {
        this.addResult({
          test: 'Configuration',
          status: 'warning',
          message: 'Supabase URL format looks incorrect',
          details: { url: config.SUPABASE_URL },
          duration: Date.now() - start
        });
      } else {
        this.addResult({
          test: 'Configuration',
          status: 'success',
          message: 'Supabase credentials configured',
          details: { 
            url: config.SUPABASE_URL.substring(0, 30) + '...',
            hasKey: true 
          },
          duration: Date.now() - start
        });
      }
    } catch (error) {
      this.addResult({
        test: 'Configuration',
        status: 'error',
        message: 'Failed to check configuration',
        details: { error: error instanceof Error ? error.message : error },
        duration: Date.now() - start
      });
    }
  }

  /**
   * Test 2: Basic Connection
   */
  private async testConnection(): Promise<void> {
    const start = Date.now();
    
    try {
      // Try to get the current session (doesn't require auth)
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        this.addResult({
          test: 'Basic Connection',
          status: 'error',
          message: 'Failed to connect to Supabase',
          details: { error: error.message },
          duration: Date.now() - start
        });
      } else {
        this.addResult({
          test: 'Basic Connection',
          status: 'success',
          message: 'Successfully connected to Supabase',
          details: { hasSession: !!data.session },
          duration: Date.now() - start
        });
      }
    } catch (error) {
      this.addResult({
        test: 'Basic Connection',
        status: 'error',
        message: 'Connection test failed',
        details: { error: error instanceof Error ? error.message : error },
        duration: Date.now() - start
      });
    }
  }

  /**
   * Test 3: Authentication
   */
  private async testAuthentication(): Promise<void> {
    const start = Date.now();
    
    try {
      const { user, error } = await auth.getUser();
      
      if (error) {
        this.addResult({
          test: 'Authentication',
          status: 'warning',
          message: 'No authenticated user',
          details: { error: error.message },
          duration: Date.now() - start
        });
      } else if (user) {
        this.addResult({
          test: 'Authentication',
          status: 'success',
          message: 'User authenticated',
          details: { 
            userId: user.id,
            email: user.email,
            role: user.role 
          },
          duration: Date.now() - start
        });
      } else {
        this.addResult({
          test: 'Authentication',
          status: 'info',
          message: 'No user session found',
          duration: Date.now() - start
        });
      }
    } catch (error) {
      this.addResult({
        test: 'Authentication',
        status: 'error',
        message: 'Authentication test failed',
        details: { error: error instanceof Error ? error.message : error },
        duration: Date.now() - start
      });
    }
  }

  /**
   * Test 4: Database Access
   */
  private async testDatabaseAccess(): Promise<void> {
    const start = Date.now();
    
    try {
      // Try a simple query that should work even without auth
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.code === '42501') {
          this.addResult({
            test: 'Database Access',
            status: 'warning',
            message: 'Database accessible but RLS policies blocking access',
            details: { error: error.message },
            duration: Date.now() - start
          });
        } else {
          this.addResult({
            test: 'Database Access',
            status: 'error',
            message: 'Failed to access database',
            details: { error: error.message, code: error.code },
            duration: Date.now() - start
          });
        }
      } else {
        this.addResult({
          test: 'Database Access',
          status: 'success',
          message: 'Database accessible',
          details: { rowsFound: data?.length || 0 },
          duration: Date.now() - start
        });
      }
    } catch (error) {
      this.addResult({
        test: 'Database Access',
        status: 'error',
        message: 'Database access test failed',
        details: { error: error instanceof Error ? error.message : error },
        duration: Date.now() - start
      });
    }
  }

  /**
   * Test 5: RLS Policies
   */
  private async testRLSPolicies(): Promise<void> {
    const start = Date.now();
    
    try {
      // Get current user
      const { user } = await auth.getUser();
      
      if (!user) {
        this.addResult({
          test: 'RLS Policies',
          status: 'info',
          message: 'Cannot test RLS policies without authentication',
          duration: Date.now() - start
        });
        return;
      }

      // Test user table access
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, organization_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        this.addResult({
          test: 'RLS Policies',
          status: 'error',
          message: 'RLS policies may be too restrictive',
          details: { 
            table: 'users',
            error: userError.message 
          },
          duration: Date.now() - start
        });
        return;
      }

      if (!userData?.organization_id) {
        this.addResult({
          test: 'RLS Policies',
          status: 'warning',
          message: 'User not associated with an organization',
          duration: Date.now() - start
        });
        return;
      }

      // Test organization access
      const { error: orgError } = await db.organizations.getById(userData.organization_id) as any;

      if (orgError) {
        this.addResult({
          test: 'RLS Policies',
          status: 'error',
          message: 'Cannot access organization data',
          details: { error: orgError },
          duration: Date.now() - start
        });
      } else {
        this.addResult({
          test: 'RLS Policies',
          status: 'success',
          message: 'RLS policies working correctly',
          details: { 
            userId: user.id,
            organizationId: userData.organization_id 
          },
          duration: Date.now() - start
        });
      }
    } catch (error) {
      this.addResult({
        test: 'RLS Policies',
        status: 'error',
        message: 'RLS policy test failed',
        details: { error: error instanceof Error ? error.message : error },
        duration: Date.now() - start
      });
    }
  }

  /**
   * Test 6: Realtime Connection
   */
  private async testRealtimeConnection(): Promise<void> {
    const start = Date.now();
    
    try {
      // Create a test channel
      const testChannel = supabase.channel('connection-test');
      let connected = false;

      // Set up a promise that resolves when connected
      const connectionPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        testChannel.subscribe((status: any) => {
          if (status === 'SUBSCRIBED') {
            connected = true;
            clearTimeout(timeout);
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeout);
            reject(new Error('Channel error'));
          }
        });
      });

      await connectionPromise;

      // Clean up
      await supabase.removeChannel(testChannel);

      this.addResult({
        test: 'Realtime Connection',
        status: 'success',
        message: 'Realtime connection established',
        duration: Date.now() - start
      });
    } catch (error) {
      this.addResult({
        test: 'Realtime Connection',
        status: 'warning',
        message: 'Realtime connection failed',
        details: { 
          error: error instanceof Error ? error.message : error,
          note: 'Realtime may not be available in all environments'
        },
        duration: Date.now() - start
      });
    }
  }

  /**
   * Add a result to the results array
   */
  private addResult(result: ConnectionTestResult): void {
    this.results.push(result);
    
    // Log to console for debugging
    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[result.status];
    
    console.log(`${emoji} ${result.test}: ${result.message}`);
    if (result.details) {
      console.log('   Details:', result.details);
    }
  }
}

// Export singleton instance
export const connectionTester = new SupabaseConnectionTester();

// Make it available globally in development
if (config.FEATURES.ENABLE_DEBUG_LOGGING) {
  (window as any).testSupabaseConnection = async () => {
    console.log('🔍 Testing Supabase connection...\n');
    const results = await connectionTester.runAllTests();
    console.log('\n📊 Test Results:', results);
    return results;
  };
  
  console.log('🧪 Supabase connection tester available: testSupabaseConnection()');
}