#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define all the fixes needed
const fixes = [
  // Fix unused React imports
  {
    file: 'src/components/dev/SupabaseConnectionPanel.tsx',
    replacements: [
      { from: 'import React from \'react\';', to: '' }
    ]
  },
  {
    file: 'src/components/error/ErrorBoundary.tsx',
    replacements: [
      { from: 'import React, { Component, ErrorInfo, ReactNode } from \'react\';', to: 'import { Component } from \'react\';\nimport type { ErrorInfo, ReactNode } from \'react\';' }
    ]
  },
  {
    file: 'src/components/freelancers/FreelancerManagementDashboard.tsx',
    replacements: [
      { from: 'import React, { useState, useRef, useEffect } from \'react\';', to: 'import { useState, useRef, useEffect } from \'react\';' },
      { from: 'import { Plus, Search, Filter, MoreHorizontal, UserPlus, UserMinus, RotateCcw, Trash2, Eye, Edit, Mail, Phone } from \'lucide-react\';', to: 'import { Plus, Search, MoreHorizontal, UserPlus, UserMinus, RotateCcw, Trash2, Eye, Edit, Mail, Phone } from \'lucide-react\';' }
    ]
  },
  {
    file: 'src/components/freelancers/FreelancerOnboardingForm.tsx',
    replacements: [
      { from: 'import React, { useState } from \'react\';', to: 'import { useState } from \'react\';' },
      { from: 'import { X, AlertCircle, Loader2, CheckCircle2 } from \'lucide-react\';', to: 'import { X, AlertCircle, Loader2 } from \'lucide-react\';' }
    ]
  },
  {
    file: 'src/components/freelancers/OnboardingProgressTracker.tsx',
    replacements: [
      { from: 'import React, { useState } from \'react\';', to: 'import { useState } from \'react\';' }
    ]
  },
  {
    file: 'src/components/platforms/BulkPlatformOperations.tsx',
    replacements: [
      { from: 'import React, { useState } from \'react\';', to: 'import { useState } from \'react\';' }
    ]
  },
  {
    file: 'src/components/platforms/PlatformConfigModal.tsx',
    replacements: [
      { from: 'import React, { useState, useEffect } from \'react\';', to: 'import { useState, useEffect } from \'react\';' }
    ]
  },
  {
    file: 'src/components/platforms/PlatformStatusDashboard.tsx',
    replacements: [
      { from: 'import React, { useState } from \'react\';', to: 'import { useState } from \'react\';' },
      { from: 'import {\n  Plus,\n  Settings,\n  CheckCircle,\n  XCircle,\n  AlertCircle,\n  Loader2,\n  RefreshCw,\n  TestTube,\n  Power,\n  PowerOff,\n  ExternalLink,\n  Clock,\n  Activity\n} from \'lucide-react\';', to: 'import {\n  Plus,\n  Settings,\n  CheckCircle,\n  XCircle,\n  Loader2,\n  RefreshCw,\n  TestTube,\n  Power,\n  PowerOff,\n  ExternalLink,\n  Activity\n} from \'lucide-react\';' }
    ]
  },
  {
    file: 'src/pages/FreelancerManagement.tsx',
    replacements: [
      { from: 'import React from \'react\';', to: '' }
    ]
  },
  {
    file: 'src/pages/PlatformManagement.tsx',
    replacements: [
      { from: 'import React from \'react\';', to: '' }
    ]
  },
  {
    file: 'src/pages/TeamManagement.tsx',
    replacements: [
      { from: 'import React from \'react\';', to: '' }
    ]
  },
  {
    file: 'src/router.tsx',
    replacements: [
      { from: 'import React from \'react\';', to: '' }
    ]
  },
  // Fix type-only re-exports
  {
    file: 'src/services/platforms/types.ts',
    replacements: [
      { from: 'export {\n  PlatformCredentials,\n  PlatformTestResult,\n  PlatformProvisionResult,\n  PlatformUserInfo,\n  PlatformError,\n  PlatformIntegration,\n} from \'../../types/platform.types\';', to: 'export type {\n  PlatformCredentials,\n  PlatformTestResult,\n  PlatformProvisionResult,\n  PlatformUserInfo,\n  PlatformError,\n  PlatformIntegration,\n} from \'../../types/platform.types\';' },
      { from: 'export {\n  FreelancerProvisionRequest,\n  FreelancerPlatformUpdate,\n} from \'../../types/freelancer.types\';', to: 'export type {\n  FreelancerProvisionRequest,\n  FreelancerPlatformUpdate,\n} from \'../../types/freelancer.types\';' }
    ]
  }
];

// Apply fixes
let totalFixed = 0;
let totalErrors = 0;

for (const fix of fixes) {
  const filePath = path.join(__dirname, fix.file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const replacement of fix.replacements) {
      if (content.includes(replacement.from)) {
        content = content.replace(replacement.from, replacement.to);
        modified = true;
        console.log(`✅ Fixed: ${fix.file} - ${replacement.from.substring(0, 50)}...`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalFixed++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${fix.file}:`, error.message);
    totalErrors++;
  }
}

console.log(`\n✅ Fixed ${totalFixed} files`);
console.log(`❌ Errors: ${totalErrors}`);