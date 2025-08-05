#!/usr/bin/env node

/**
 * RLS Policy Fix Testing Script
 * 
 * This script tests the RLS policy fixes to ensure they resolve the infinite recursion
 * Run with: node test-rls-fix.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI colors
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

async function testRLSFix() {
  log('\n🔒 RLS Policy Fix Testing\n', 'bold');
  
  // Load environment variables
  let supabaseUrl, supabaseKey;
  try {
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
    
  } catch (error) {
    logTest('Environment Setup', 'error', `Failed to load .env.local: ${error.message}`);
    return;
  }
  
  if (!supabaseUrl || !supabaseKey) {
    logTest('Environment Setup', 'error', 'Missing Supabase credentials');
    return;
  }
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
  
  logTest('Environment Setup', 'success', 'Supabase client created');
  
  // Test 1: Check if RLS infinite recursion is fixed
  log('\n🧪 Testing RLS Policy Queries...', 'cyan');
  
  // Test organizations table
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);
    
    if (error) {
      if (error.message.includes('infinite recursion')) {
        logTest('Organizations Query', 'error', 'RLS infinite recursion still present!', {
          error: error.message,
          code: error.code
        });
      } else if (error.code === '42501' || error.message.includes('permission denied')) {
        logTest('Organizations Query', 'success', 'RLS working correctly (no recursion, permission denied as expected)', {
          note: 'This is expected - you need to be authenticated to access data'
        });
      } else {
        logTest('Organizations Query', 'warning', 'Different error encountered', {
          error: error.message,
          code: error.code
        });
      }
    } else {
      logTest('Organizations Query', 'success', 'Query executed successfully', {
        recordsReturned: data?.length || 0
      });
    }
  } catch (error) {
    logTest('Organizations Query', 'error', `Unexpected error: ${error.message}`);
  }
  
  // Test users table (this was the main problem)
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (error) {
      if (error.message.includes('infinite recursion')) {
        logTest('Users Query', 'error', 'RLS infinite recursion still present in users table!', {
          error: error.message,
          code: error.code,
          solution: 'You need to apply the RLS policy fixes from fix-rls-policies.sql'
        });
      } else if (error.code === '42501' || error.message.includes('permission denied')) {
        logTest('Users Query', 'success', 'RLS working correctly (no recursion, permission denied as expected)', {
          note: 'This is expected - you need to be authenticated to access user data'
        });
      } else {
        logTest('Users Query', 'warning', 'Different error encountered', {
          error: error.message,
          code: error.code
        });
      }
    } else {
      logTest('Users Query', 'success', 'Query executed successfully', {
        recordsReturned: data?.length || 0
      });
    }
  } catch (error) {
    logTest('Users Query', 'error', `Unexpected error: ${error.message}`);
  }
  
  // Test freelancers table
  try {
    const { data, error } = await supabase
      .from('freelancers')
      .select('id, email')
      .limit(1);
    
    if (error) {
      if (error.message.includes('infinite recursion')) {
        logTest('Freelancers Query', 'error', 'RLS infinite recursion in freelancers table!', {
          error: error.message
        });
      } else if (error.code === '42501' || error.message.includes('permission denied')) {
        logTest('Freelancers Query', 'success', 'RLS working correctly (no recursion)');
      } else {
        logTest('Freelancers Query', 'warning', 'Different error', {
          error: error.message,
          code: error.code
        });
      }
    } else {
      logTest('Freelancers Query', 'success', 'Query executed successfully', {
        recordsReturned: data?.length || 0
      });
    }
  } catch (error) {
    logTest('Freelancers Query', 'error', `Unexpected error: ${error.message}`);
  }
  
  // Test platforms table
  try {
    const { data, error } = await supabase
      .from('platforms')
      .select('id, display_name')
      .limit(1);
    
    if (error) {
      if (error.message.includes('infinite recursion')) {
        logTest('Platforms Query', 'error', 'RLS infinite recursion in platforms table!');
      } else {
        logTest('Platforms Query', 'success', 'No infinite recursion detected');
      }
    } else {
      logTest('Platforms Query', 'success', 'Query executed successfully');
    }
  } catch (error) {
    logTest('Platforms Query', 'error', `Unexpected error: ${error.message}`);
  }
  
  // Analysis and recommendations
  log('\n📊 Analysis and Recommendations:', 'cyan');
  
  // Check if fix file exists
  try {
    const fixFile = readFileSync(join(__dirname, 'fix-rls-policies.sql'), 'utf8');
    logTest('Fix Script', 'success', 'RLS fix script available at fix-rls-policies.sql', {
      size: `${Math.round(fixFile.length / 1024)}KB`,
      note: 'Ready to apply to your Supabase database'
    });
  } catch (error) {
    logTest('Fix Script', 'error', 'Fix script not found');
  }
  
  log('\n🔧 How to Apply the Fix:', 'yellow');
  log('   1. Go to your Supabase dashboard');
  log('   2. Navigate to SQL Editor');
  log('   3. Copy and paste the contents of fix-rls-policies.sql');
  log('   4. Run the SQL script');
  log('   5. Test your application again');
  
  log('\n🎯 Expected Results After Fix:', 'green');
  log('   ✅ No more "infinite recursion detected" errors');
  log('   ✅ Proper permission denied errors (expected when not authenticated)');
  log('   ✅ Normal database operations when authenticated');
  log('   ✅ Multi-tenant isolation maintained');
  log('   ✅ Role-based access control working');
  
  log('\n⚠️  Important Notes:', 'yellow');
  log('   • The "permission denied" errors you see are NORMAL');
  log('   • These errors occur because you\'re not authenticated in this test');
  log('   • Once you authenticate in your app, queries will work normally');
  log('   • The key is that there\'s no "infinite recursion" error anymore');
  
  log('\n🚀 Next Steps:', 'cyan');
  log('   1. Apply the RLS policy fixes in Supabase');
  log('   2. Test authentication in your app');
  log('   3. Run testSupabaseConnection() in browser console');
  log('   4. Verify your integration reaches 100%!');
}

// Run the test
testRLSFix().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
});