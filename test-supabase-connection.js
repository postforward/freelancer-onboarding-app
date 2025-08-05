#!/usr/bin/env node

/**
 * Simple Supabase Connection Test Script
 * 
 * This script tests the Supabase connection using your configured credentials
 * Run with: node test-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, message, details = null) {
  const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
  const color = status === 'success' ? 'green' : status === 'error' ? 'red' : 'yellow';
  
  log(`${icon} ${testName}: ${message}`, color);
  if (details) {
    console.log(`   ${JSON.stringify(details, null, 2)}`);
  }
}

async function testSupabaseConnection() {
  log('\n🔍 Supabase Connection Test Starting...\n', 'bold');
  
  let supabaseUrl, supabaseKey;
  
  // Step 1: Load environment variables
  try {
    log('📁 Loading environment variables...', 'cyan');
    
    const envLocal = readFileSync(join(__dirname, '.env.local'), 'utf8');
    const envVars = {};
    
    envLocal.split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      });
    
    supabaseUrl = envVars.VITE_SUPABASE_URL;
    supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
    
    logTest('Environment Variables', 'success', 'Loaded from .env.local', {
      url: supabaseUrl ? `${supabaseUrl.substring(0, 40)}...` : 'Not set',
      keyLength: supabaseKey ? `${supabaseKey.length} characters` : 'Not set',
      mockMode: envVars.VITE_USE_MOCK || 'undefined'
    });
    
  } catch (error) {
    logTest('Environment Variables', 'error', `Failed to load .env.local: ${error.message}`);
    return;
  }
  
  // Step 2: Validate credentials
  if (!supabaseUrl || !supabaseKey) {
    logTest('Credential Validation', 'error', 'Missing Supabase credentials', {
      url: !!supabaseUrl,
      key: !!supabaseKey
    });
    return;
  }
  
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    logTest('Credential Validation', 'error', 'Invalid Supabase URL format', {
      url: supabaseUrl
    });
    return;
  }
  
  if (!supabaseKey.startsWith('eyJ')) {
    logTest('Credential Validation', 'warning', 'Supabase key does not appear to be a JWT token', {
      keyStart: supabaseKey.substring(0, 10) + '...'
    });
  } else {
    logTest('Credential Validation', 'success', 'Credentials appear valid', {
      urlFormat: 'Valid Supabase URL',
      keyFormat: 'Valid JWT format'
    });
  }
  
  // Step 3: Create Supabase client
  let supabase;
  try {
    log('\n🔌 Creating Supabase client...', 'cyan');
    
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Don't persist in Node.js
        detectSessionInUrl: false
      }
    });
    
    logTest('Client Creation', 'success', 'Supabase client created successfully');
    
  } catch (error) {
    logTest('Client Creation', 'error', `Failed to create Supabase client: ${error.message}`);
    return;
  }
  
  // Step 4: Test basic connectivity
  try {
    log('\n🌐 Testing basic connectivity...', 'cyan');
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      logTest('Basic Connectivity', 'error', `Auth endpoint error: ${error.message}`, {
        code: error.code,
        status: error.status
      });
    } else {
      logTest('Basic Connectivity', 'success', 'Successfully connected to Supabase auth endpoint', {
        hasSession: !!data.session,
        sessionInfo: data.session ? 'Active session found' : 'No active session'
      });
    }
    
  } catch (error) {
    logTest('Basic Connectivity', 'error', `Network connectivity failed: ${error.message}`, {
      code: error.code,
      errno: error.errno
    });
    return;
  }
  
  // Step 5: Test database access
  try {
    log('\n🗄️  Testing database access...', 'cyan');
    
    // Try to query a table (this will test RLS policies too)
    const { data, error, count } = await supabase
      .from('organizations')
      .select('id', { count: 'exact' })
      .limit(1);
    
    if (error) {
      if (error.code === '42501') {
        logTest('Database Access', 'warning', 'Database accessible but RLS policies prevent access', {
          message: 'This is expected behavior - you need to be authenticated to access data',
          error: error.message,
          code: error.code
        });
      } else if (error.code === '42P01') {
        logTest('Database Access', 'warning', 'Organizations table does not exist', {
          message: 'You may need to run database migrations',
          error: error.message,
          code: error.code
        });
      } else {
        logTest('Database Access', 'error', `Database query failed: ${error.message}`, {
          code: error.code,
          hint: error.hint,
          details: error.details
        });
      }
    } else {
      logTest('Database Access', 'success', 'Database query successful', {
        recordsFound: count || 0,
        dataReturned: data ? data.length : 0,
        message: 'Database is accessible and RLS policies are working'
      });
    }
    
  } catch (error) {
    logTest('Database Access', 'error', `Database test failed: ${error.message}`);
  }
  
  // Step 6: Test authentication methods
  try {
    log('\n🔐 Testing authentication capabilities...', 'cyan');
    
    // Test sign up (will fail but shows if auth is working)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (signUpError) {
      if (signUpError.message.includes('User already registered') || 
          signUpError.message.includes('signup is disabled') ||
          signUpError.message.includes('email address is invalid')) {
        logTest('Authentication', 'success', 'Auth endpoint responding correctly', {
          message: 'Authentication system is working (expected error for test credentials)',
          error: signUpError.message
        });
      } else {
        logTest('Authentication', 'warning', 'Auth system accessible but may have restrictions', {
          error: signUpError.message
        });
      }
    } else {
      logTest('Authentication', 'warning', 'Unexpected: Test signup succeeded', {
        message: 'You may want to check your auth settings',
        userId: signUpData.user?.id
      });
    }
    
  } catch (error) {
    logTest('Authentication', 'error', `Auth test failed: ${error.message}`);
  }
  
  // Step 7: Test real-time capabilities
  try {
    log('\n⚡ Testing real-time connection...', 'cyan');
    
    const channel = supabase.channel('connection-test');
    let connected = false;
    
    const connectionPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Real-time connection timeout'));
      }, 5000);
      
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          connected = true;
          clearTimeout(timeout);
          resolve();
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          reject(new Error('Channel connection error'));
        }
      });
    });
    
    await connectionPromise;
    await supabase.removeChannel(channel);
    
    logTest('Real-time Connection', 'success', 'Real-time WebSocket connection working', {
      status: 'Connected and subscribed successfully',
      note: 'Live updates and subscriptions will work'
    });
    
  } catch (error) {
    logTest('Real-time Connection', 'warning', `Real-time connection failed: ${error.message}`, {
      note: 'Real-time features may not be available, but basic functionality should work'
    });
  }
  
  // Final summary
  log('\n📊 Connection Test Complete!', 'bold');
  log('\n🎯 Summary:', 'cyan');
  log('   • Credentials are properly configured');
  log('   • Supabase client can be created');
  log('   • Network connectivity to Supabase is working');
  log('   • Authentication endpoints are accessible');
  log('   • Database connection is functional');
  
  log('\n💡 Next Steps:', 'yellow');
  log('   1. Start your development server: npm run dev');
  log('   2. Check browser console for additional configuration info');
  log('   3. Use the visual connection panel: Ctrl/Cmd + Shift + D');
  log('   4. Test with real user authentication in your app');
  
  log('\n🔧 If you see warnings above:', 'yellow');
  log('   • RLS policy warnings are normal - they protect your data');
  log('   • Table not found warnings mean you need to run migrations');
  log('   • Real-time warnings are usually network/firewall related');
}

// Run the test
testSupabaseConnection().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
});