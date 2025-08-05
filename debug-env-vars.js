#!/usr/bin/env node

/**
 * Environment Variables Debug Script
 * 
 * This script thoroughly checks environment variable loading in both Node.js and Vite contexts
 * Run with: node debug-env-vars.js
 */

import { readFileSync, existsSync } from 'fs';
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
    Object.entries(details).forEach(([key, value]) => {
      log(`   ${key}: ${value}`, 'blue');
    });
  }
}

async function debugEnvironmentVariables() {
  log('\n🔍 Environment Variables Debug Analysis\n', 'bold');
  
  // Check 1: File existence
  log('📁 Environment Files Check:', 'cyan');
  const envFiles = ['.env.local', '.env.development', '.env', '.env.example'];
  const fileStatus = {};
  
  envFiles.forEach(file => {
    const exists = existsSync(join(__dirname, file));
    const status = exists ? '✅ exists' : '❌ missing';
    log(`   ${file}: ${status}`, exists ? 'green' : 'red');
    fileStatus[file] = exists;
  });
  
  // Check 2: .env.local contents
  if (fileStatus['.env.local']) {
    log('\n📄 .env.local Contents:', 'cyan');
    try {
      const envLocal = readFileSync(join(__dirname, '.env.local'), 'utf8');
      const lines = envLocal.split('\n').filter(line => line.trim());
      
      lines.forEach((line, index) => {
        if (line.startsWith('#')) {
          log(`   ${index + 1}: ${line}`, 'blue');
        } else if (line.includes('=')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=');
          if (key.includes('KEY') || key.includes('SECRET')) {
            log(`   ${index + 1}: ${key}=${value.substring(0, 10)}...`, 'green');
          } else {
            log(`   ${index + 1}: ${key}=${value}`, 'green');
          }
        } else if (line.trim()) {
          log(`   ${index + 1}: ${line}`, 'yellow');
        }
      });
      
      // Parse environment variables
      const envVars = {};
      lines.forEach(line => {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
      
      log('\n🔧 Parsed Variables:', 'cyan');
      logTest('VITE_SUPABASE_URL', envVars.VITE_SUPABASE_URL ? 'success' : 'error', 
        envVars.VITE_SUPABASE_URL ? 'Set correctly' : 'Missing or empty', {
          'Value': envVars.VITE_SUPABASE_URL ? `${envVars.VITE_SUPABASE_URL.substring(0, 40)}...` : 'undefined',
          'Length': envVars.VITE_SUPABASE_URL ? `${envVars.VITE_SUPABASE_URL.length} characters` : '0'
        });
      
      logTest('VITE_SUPABASE_ANON_KEY', envVars.VITE_SUPABASE_ANON_KEY ? 'success' : 'error',
        envVars.VITE_SUPABASE_ANON_KEY ? 'Set correctly' : 'Missing or empty', {
          'Format': envVars.VITE_SUPABASE_ANON_KEY?.startsWith('eyJ') ? 'JWT format ✅' : 'Not JWT format ⚠️',
          'Length': envVars.VITE_SUPABASE_ANON_KEY ? `${envVars.VITE_SUPABASE_ANON_KEY.length} characters` : '0'
        });
      
      logTest('VITE_USE_MOCK', 'success', `Set to: ${envVars.VITE_USE_MOCK || 'undefined'}`, {
        'Will use': envVars.VITE_USE_MOCK === 'false' ? 'Real Supabase' : 'Mock data'
      });
      
    } catch (error) {
      logTest('.env.local Reading', 'error', `Failed to read file: ${error.message}`);
    }
  }
  
  // Check 3: Node.js process.env (won't see VITE_ vars)
  log('\n🖥️  Node.js Environment (process.env):', 'cyan');
  const nodeEnvVars = {
    'NODE_ENV': process.env.NODE_ENV,
    'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY,
    'VITE_USE_MOCK': process.env.VITE_USE_MOCK
  };
  
  Object.entries(nodeEnvVars).forEach(([key, value]) => {
    const status = value ? 'success' : 'warning';
    const message = value ? `${value}` : 'Not available in Node.js context';
    logTest(key, status, message);
  });
  
  log('\n📝 Important Note:', 'yellow');
  log('   VITE_ prefixed variables are only available in the Vite build process', 'yellow');
  log('   They won\'t appear in Node.js process.env but will be available in your React app', 'yellow');
  
  // Check 4: Vite config
  log('\n⚙️  Vite Configuration Check:', 'cyan');
  try {
    const viteConfig = readFileSync(join(__dirname, 'vite.config.ts'), 'utf8');
    
    if (viteConfig.includes('loadEnv') || viteConfig.includes('dotenv')) {
      logTest('Vite Config', 'success', 'Custom environment loading detected');
    } else {
      logTest('Vite Config', 'success', 'Using default Vite environment loading');
    }
    
    log('   Vite automatically loads:', 'blue');
    log('   • .env.local (highest priority)', 'blue');
    log('   • .env.development (in dev mode)', 'blue');
    log('   • .env (base environment)', 'blue');
    
  } catch (error) {
    logTest('Vite Config', 'warning', 'Could not read vite.config.ts');
  }
  
  // Check 5: .gitignore issues
  log('\n🚫 .gitignore Check:', 'cyan');
  try {
    const gitignore = readFileSync(join(__dirname, '.gitignore'), 'utf8');
    
    if (gitignore.includes('*.local')) {
      logTest('.gitignore', 'error', 'Found *.local pattern - this ignores ALL .local files!', {
        'Issue': 'The *.local pattern prevents .env.local from being committed',
        'Solution': 'This is actually correct - .env.local should be ignored for security'
      });
    } else if (gitignore.includes('.env.local')) {
      logTest('.gitignore', 'success', '.env.local is properly ignored for security');
    } else {
      logTest('.gitignore', 'warning', '.env.local not found in .gitignore - should be ignored for security');
    }
    
  } catch (error) {
    logTest('.gitignore', 'warning', 'Could not read .gitignore');
  }
  
  // Check 6: Browser runtime check script
  log('\n🌐 Browser Runtime Test Script:', 'cyan');
  const testScript = `
// Copy and paste this in your browser console when running 'npm run dev'
console.log('🔍 Environment Variables in Browser:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || 'undefined');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (' + import.meta.env.VITE_SUPABASE_ANON_KEY.length + ' chars)' : 'undefined');
console.log('VITE_USE_MOCK:', import.meta.env.VITE_USE_MOCK || 'undefined');  
console.log('MODE:', import.meta.env.MODE);
  `.trim();
  
  log('   Test your environment variables in the browser:', 'blue');
  log('   1. Run: npm run dev', 'blue');
  log('   2. Open browser console', 'blue');
  log('   3. Paste this code:', 'blue');
  console.log('\n' + testScript + '\n');
  
  // Check 7: Recommendations
  log('🎯 Recommendations:', 'cyan');
  
  if (fileStatus['.env.local']) {
    log('   ✅ .env.local exists - environment variables should be loaded', 'green');
  } else {
    log('   ❌ Create .env.local with your Supabase credentials', 'red');
  }
  
  log('   💡 To verify variables are loaded in your app:', 'blue');
  log('   • Start dev server: npm run dev', 'blue');
  log('   • Check browser console for config logs', 'blue');
  log('   • Use: getSupabaseStatus() in console', 'blue');
  log('   • Use: testSupabaseConnection() to test connection', 'blue');
  
  // Generate test connection command
  log('\n🧪 Test Real Supabase Connection:', 'cyan');
  log('   After confirming environment variables load correctly:', 'blue');
  log('   node test-supabase-connection.js', 'green');
}

// Run the debug
debugEnvironmentVariables().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
});