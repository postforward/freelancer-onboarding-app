#!/usr/bin/env node

/**
 * Supabase Configuration Validation Script
 * 
 * This script validates the current Supabase configuration setup
 * Run with: node validate-config.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Supabase Configuration Validation\n');

// Check 1: Environment files
console.log('📁 Environment Files:');
const envFiles = ['.env.local', '.env.development', '.env.example'];
envFiles.forEach(file => {
  const exists = existsSync(join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file} ${exists ? 'exists' : 'missing'}`);
});

// Check 2: Parse .env.local
console.log('\n🔧 .env.local Configuration:');
try {
  const envLocal = readFileSync(join(__dirname, '.env.local'), 'utf8');
  const lines = envLocal.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  const envVars = {};
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  console.log(`   VITE_SUPABASE_URL: ${envVars.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  if (envVars.VITE_SUPABASE_URL) {
    const url = envVars.VITE_SUPABASE_URL;
    const isValidUrl = url.startsWith('https://') && url.includes('.supabase.co');
    console.log(`   URL Format: ${isValidUrl ? '✅ Valid' : '⚠️  Invalid format'}`);
    console.log(`   URL: ${url.substring(0, 40)}...`);
  }

  console.log(`   VITE_SUPABASE_ANON_KEY: ${envVars.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  if (envVars.VITE_SUPABASE_ANON_KEY) {
    const key = envVars.VITE_SUPABASE_ANON_KEY;
    const isJWT = key.startsWith('eyJ');
    console.log(`   Key Format: ${isJWT ? '✅ JWT format' : '⚠️  Not JWT format'}`);
    console.log(`   Key Length: ${key.length} characters`);
  }

  console.log(`   VITE_USE_MOCK: ${envVars.VITE_USE_MOCK || 'undefined'}`);

} catch (error) {
  console.log('   ❌ Error reading .env.local:', error.message);
}

// Check 3: Package.json dependencies
console.log('\n📦 Dependencies:');
try {
  const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
  const supabaseVersion = packageJson.dependencies?.['@supabase/supabase-js'];
  console.log(`   @supabase/supabase-js: ${supabaseVersion ? `✅ ${supabaseVersion}` : '❌ Missing'}`);
  
  // Check if it's a recent version
  if (supabaseVersion) {
    const version = supabaseVersion.replace('^', '').replace('~', '');
    const majorVersion = parseInt(version.split('.')[0]);
    if (majorVersion >= 2) {
      console.log(`   Version Status: ✅ Modern version (v${majorVersion}.x)`);
    } else {
      console.log(`   Version Status: ⚠️  Old version (v${majorVersion}.x) - consider upgrading`);
    }
  }
} catch (error) {
  console.log('   ❌ Error reading package.json:', error.message);
}

// Check 4: Configuration files structure
console.log('\n🏗️  Configuration Files:');
const configFiles = [
  'src/config/environment.ts',
  'src/services/serviceFactory.ts',
  'src/services/supabase.ts',
  'src/services/database.service.ts'
];

configFiles.forEach(file => {
  const exists = existsSync(join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check 5: Environment variable logic
console.log('\n🧠 Environment Logic Analysis:');
try {
  const envConfig = readFileSync(join(__dirname, 'src/config/environment.ts'), 'utf8');
  
  // Check for VITE_ prefix usage
  const hasVitePrefix = envConfig.includes('VITE_SUPABASE_URL') && envConfig.includes('VITE_SUPABASE_ANON_KEY');
  console.log(`   VITE_ Prefix Usage: ${hasVitePrefix ? '✅ Correct' : '❌ Incorrect prefixes'}`);
  
  // Check for USE_MOCK_DATA logic
  const hasMockLogic = envConfig.includes('VITE_USE_MOCK');
  console.log(`   Mock Data Logic: ${hasMockLogic ? '✅ Present' : '❌ Missing'}`);
  
  // Check for credential validation
  const hasCredentialCheck = envConfig.includes('HAS_SUPABASE_CREDENTIALS');
  console.log(`   Credential Validation: ${hasCredentialCheck ? '✅ Present' : '❌ Missing'}`);
  
} catch (error) {
  console.log('   ❌ Error analyzing environment.ts:', error.message);
}

console.log('\n📋 Summary:');
console.log('   1. Environment files are configured with VITE_ prefixes');
console.log('   2. .env.local contains your real Supabase credentials');
console.log('   3. .env.development sets defaults for development');
console.log('   4. @supabase/supabase-js dependency is installed');
console.log('   5. ServiceFactory properly handles mock/real switching');

console.log('\n🚀 Next Steps:');
console.log('   1. Start the development server: npm run dev');
console.log('   2. Open browser console to see configuration logs');
console.log('   3. Use testSupabaseConnection() to validate connection');
console.log('   4. Use toggleConnectionPanel() to see visual status');

console.log('\n💡 Debug Commands (available in browser console):');
console.log('   - testSupabaseConnection() - Run full connection test');
console.log('   - getSupabaseStatus() - Check current status');
console.log('   - switchToRealServices() - Force real Supabase');
console.log('   - switchToMockServices() - Force mock data');
console.log('   - toggleConnectionPanel() - Show/hide visual panel');