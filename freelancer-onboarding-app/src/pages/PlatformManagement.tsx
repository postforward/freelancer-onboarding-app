import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { PlatformProvider } from '../contexts/PlatformContext';
import { PlatformStatusDashboard } from '../components/platforms/PlatformStatusDashboard';
import { BulkPlatformOperations } from '../components/platforms/BulkPlatformOperations';
import { Shield } from 'lucide-react';

function PlatformManagementContent() {
  const { dbUser } = useAuth();
  const { canManagePlatforms } = usePermissions();

  if (!canManagePlatforms()) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to manage platforms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PlatformStatusDashboard />
      <BulkPlatformOperations />
    </div>
  );
}

export function PlatformManagement() {
  return (
    <PlatformProvider>
      <PlatformManagementContent />
    </PlatformProvider>
  );
}