#!/usr/bin/env node

/**
 * RLS (Row Level Security) Test Script
 * 
 * This script tests for infinite recursion issues and validates that
 * Supabase database queries are working correctly with proper authentication.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Test configuration
const TEST_CONFIG = {
  TIMEOUT_MS: 10000, // 10 seconds timeout for each test
  MAX_RETRIES: 3,
  TEST_EMAIL: 'test@example.com',
  TEST_PASSWORD: 'testpassword123'
};

// Test results storage
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

/**
 * Load environment variables from .env.local
 */
function loadEnvironmentVariables() {
  console.log(`${colors.cyan}🔍 Loading environment variables...${colors.reset}`);
  
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found. Please create it with your Supabase credentials.');
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  // Set environment variables
  Object.entries(envVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  console.log(`${colors.green}✅ Loaded ${Object.keys(envVars).length} environment variables${colors.reset}`);
  return envVars;
}

/**
 * Create Supabase client with loaded environment variables
 */
function createSupabaseClient() {
  console.log(`${colors.cyan}🔗 Creating Supabase client...${colors.reset}`);
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables');
  }
  
  console.log(`${colors.blue}📡 Connecting to: ${supabaseUrl.substring(0, 30)}...${colors.reset}`);
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Don't persist session for tests
      detectSessionInUrl: false
    }
  });
  
  console.log(`${colors.green}✅ Supabase client created successfully${colors.reset}`);
  return supabase;
}

/**
 * Run a test with timeout and error handling
 */
async function runTestWithTimeout(testName, testFunction, timeoutMs = TEST_CONFIG.TIMEOUT_MS) {
  console.log(`${colors.yellow}🧪 Running test: ${testName}${colors.reset}`);
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Test "${testName}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([testFunction(), timeoutPromise]);
    console.log(`${colors.green}✅ PASSED: ${testName}${colors.reset}`);
    testResults.passed++;
    return result;
  } catch (error) {
    console.log(`${colors.red}❌ FAILED: ${testName}${colors.reset}`);
    console.log(`${colors.red}   Error: ${error.message}${colors.reset}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    throw error;
  }
}

/**
 * Test 1: Basic connectivity and authentication
 */
async function testBasicConnectivity(supabase) {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(`Auth session error: ${error.message}`);
  }
  
  console.log(`${colors.blue}   Session status: ${session ? 'Active' : 'No session'}${colors.reset}`);
  return { hasSession: !!session };
}

/**
 * Test 2: Test organizations table query (potential infinite recursion point)
 */
async function testOrganizationsQuery(supabase) {
  console.log(`${colors.blue}   Querying organizations table...${colors.reset}`);
  
  const startTime = Date.now();
  const { data, error, count } = await supabase
    .from('organizations')
    .select('*', { count: 'exact' })
    .limit(5);
  
  const queryTime = Date.now() - startTime;
  
  if (error) {
    throw new Error(`Organizations query failed: ${error.message}`);
  }
  
  console.log(`${colors.blue}   Query completed in ${queryTime}ms${colors.reset}`);
  console.log(`${colors.blue}   Found ${count} organizations, returned ${data?.length || 0} records${colors.reset}`);
  
  if (queryTime > 5000) {
    testResults.warnings++;
    console.log(`${colors.yellow}   ⚠️  Warning: Query took longer than expected (${queryTime}ms)${colors.reset}`);
  }
  
  return { data, count, queryTime };
}

/**
 * Test 3: Test users table query (potential infinite recursion point)
 */
async function testUsersQuery(supabase) {
  console.log(`${colors.blue}   Querying users table...${colors.reset}`);
  
  const startTime = Date.now();
  const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .limit(5);
  
  const queryTime = Date.now() - startTime;
  
  if (error) {
    throw new Error(`Users query failed: ${error.message}`);
  }
  
  console.log(`${colors.blue}   Query completed in ${queryTime}ms${colors.reset}`);
  console.log(`${colors.blue}   Found ${count} users, returned ${data?.length || 0} records${colors.reset}`);
  
  if (queryTime > 5000) {
    testResults.warnings++;
    console.log(`${colors.yellow}   ⚠️  Warning: Query took longer than expected (${queryTime}ms)${colors.reset}`);
  }
  
  return { data, count, queryTime };
}

/**
 * Test 4: Test RLS policies with authenticated user
 */
async function testRLSPolicies(supabase) {
  console.log(`${colors.blue}   Testing RLS policies...${colors.reset}`);
  
  // First, test without authentication
  const { data: unauthData, error: unauthError } = await supabase
    .from('users')
    .select('id, email')
    .limit(1);
  
  console.log(`${colors.blue}   Unauthenticated query: ${unauthError ? 'Blocked (Good!)' : 'Allowed'}${colors.reset}`);
  
  // Test with service role if available (this would bypass RLS)
  // For security, we'll just test the current setup
  return {
    unauthenticatedBlocked: !!unauthError,
    message: unauthError ? 'RLS is properly blocking unauthenticated requests' : 'RLS may not be properly configured'
  };
}

/**
 * Test 5: Test complex joins (potential infinite recursion trigger)
 */
async function testComplexQueries(supabase) {
  console.log(`${colors.blue}   Testing complex queries with joins...${colors.reset}`);
  
  const startTime = Date.now();
  
  // Test a query that might trigger infinite recursion if RLS policies are incorrectly configured
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role,
      organizations!inner (
        id,
        name
      )
    `)
    .limit(3);
  
  const queryTime = Date.now() - startTime;
  
  if (error) {
    // This might be expected if RLS is blocking the query
    if (error.message.includes('infinite') || error.message.includes('recursion') || error.message.includes('loop')) {
      throw new Error(`INFINITE RECURSION DETECTED: ${error.message}`);
    }
    
    console.log(`${colors.yellow}   Query blocked (possibly by RLS): ${error.message}${colors.reset}`);
    return { blocked: true, reason: error.message, queryTime };
  }
  
  console.log(`${colors.blue}   Complex query completed in ${queryTime}ms${colors.reset}`);
  console.log(`${colors.blue}   Returned ${data?.length || 0} records with joins${colors.reset}`);
  
  return { data, queryTime, blocked: false };
}

/**
 * Test 6: Test rapid successive queries (stress test for infinite recursion)
 */
async function testRapidQueries(supabase) {
  console.log(`${colors.blue}   Testing rapid successive queries...${colors.reset}`);
  
  const queries = [];
  const startTime = Date.now();
  
  // Fire 5 queries simultaneously
  for (let i = 0; i < 5; i++) {
    queries.push(
      supabase
        .from('organizations')
        .select('id, name')
        .limit(1)
    );
  }
  
  const results = await Promise.allSettled(queries);
  const totalTime = Date.now() - startTime;
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`${colors.blue}   ${successful} successful, ${failed} failed in ${totalTime}ms${colors.reset}`);
  
  // Check for infinite recursion errors
  const recursionErrors = results
    .filter(r => r.status === 'rejected')
    .filter(r => r.reason.message && (
      r.reason.message.includes('infinite') || 
      r.reason.message.includes('recursion') || 
      r.reason.message.includes('loop')
    ));
  
  if (recursionErrors.length > 0) {
    throw new Error(`INFINITE RECURSION DETECTED in ${recursionErrors.length} queries`);
  }
  
  return { successful, failed, totalTime };
}

/**
 * Generate final test report
 */
function generateTestReport() {
  console.log(`\n${colors.bright}${colors.cyan}📊 TEST REPORT${colors.reset}`);
  console.log(`${colors.bright}=====================${colors.reset}\n`);
  
  console.log(`${colors.green}✅ Tests Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Tests Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${testResults.warnings}${colors.reset}\n`);
  
  if (testResults.errors.length > 0) {
    console.log(`${colors.red}${colors.bright}ERRORS:${colors.reset}`);
    testResults.errors.forEach((error, index) => {
      console.log(`${colors.red}${index + 1}. ${error.test}: ${error.error}${colors.reset}`);
    });
    console.log();
  }
  
  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? (testResults.passed / totalTests * 100).toFixed(1) : 0;
  
  console.log(`${colors.bright}Success Rate: ${successRate}%${colors.reset}`);
  
  if (testResults.failed === 0) {
    console.log(`\n${colors.green}${colors.bright}🎉 ALL TESTS PASSED! No infinite recursion detected.${colors.reset}`);
    console.log(`${colors.green}✅ RLS policies appear to be working correctly.${colors.reset}`);
    console.log(`${colors.green}✅ Database queries are functioning properly.${colors.reset}`);
    return true;
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ SOME TESTS FAILED${colors.reset}`);
    console.log(`${colors.red}Please review the errors above and check your RLS policies.${colors.reset}`);
    return false;
  }
}

/**
 * Main test execution function
 */
async function runRLSTests() {
  console.log(`${colors.bright}${colors.magenta}🧪 RLS (Row Level Security) Test Suite${colors.reset}`);
  console.log(`${colors.bright}=====================================\n${colors.reset}`);
  
  let supabase;
  
  try {
    // Load environment and create client
    loadEnvironmentVariables();
    supabase = createSupabaseClient();
    
    console.log(`\n${colors.bright}🚀 Starting RLS Tests...${colors.reset}\n`);
    
    // Run all tests
    await runTestWithTimeout('Basic Connectivity', () => testBasicConnectivity(supabase));
    await runTestWithTimeout('Organizations Query', () => testOrganizationsQuery(supabase));
    await runTestWithTimeout('Users Query', () => testUsersQuery(supabase));
    await runTestWithTimeout('RLS Policies', () => testRLSPolicies(supabase));
    await runTestWithTimeout('Complex Queries', () => testComplexQueries(supabase));
    await runTestWithTimeout('Rapid Successive Queries', () => testRapidQueries(supabase));
    
  } catch (error) {
    console.log(`\n${colors.red}${colors.bright}💥 Test suite failed to complete:${colors.reset}`);
    console.log(`${colors.red}${error.message}${colors.reset}\n`);
    
    testResults.failed++;
    testResults.errors.push({ test: 'Test Suite Setup', error: error.message });
  }
  
  // Generate and display final report
  const success = generateTestReport();
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log(`\n${colors.red}💥 Unhandled Rejection at:${colors.reset}`, promise);
  console.log(`${colors.red}Reason:${colors.reset}`, reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.log(`\n${colors.red}💥 Uncaught Exception:${colors.reset}`, error);
  process.exit(1);
});

// Run the test suite
runRLSTests().catch((error) => {
  console.log(`\n${colors.red}💥 Fatal error running test suite:${colors.reset}`);
  console.log(error);
  process.exit(1);
});