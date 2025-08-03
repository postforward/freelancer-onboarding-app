import React, { useEffect, useState } from 'react';
import {
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Power,
  PowerOff,
  Activity,
  FolderSync,
  Clock
} from 'lucide-react';
import { usePlatforms } from '../../contexts/PlatformContext';
import { PlatformConfigModal } from './PlatformConfigModal';
import { LoadingSpinner } from '../ui/Loading';

export function PlatformStatusDashboard() {
  const {
    platforms,
    platformConfigs,
    platformStatuses,
    loading,
    enablePlatform,
    disablePlatform,
    testPlatformConnection,
    refreshPlatformStatuses
  } = usePlatforms();

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);

  useEffect(() => {
    // Refresh statuses on mount
    refreshPlatformStatuses();
  }, []);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await refreshPlatformStatuses();
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestConnection = async (platformId: string) => {
    setTestingPlatform(platformId);
    try {
      await testPlatformConnection(platformId);
    } finally {
      setTestingPlatform(null);
    }
  };

  const handleTogglePlatform = async (platformId: string, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      await disablePlatform(platformId);
    } else {
      await enablePlatform(platformId);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'file-sharing':
        return <FolderSync className="h-5 w-5" />;
      case 'infrastructure':
        return <Server className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: any) => {
    if (!status?.enabled) {
      return <PowerOff className="h-5 w-5 text-gray-400" />;
    }
    if (status.connected) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (status.error) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = (status: any) => {
    if (!status?.enabled) return 'Disabled';
    if (status.connected) return 'Connected';
    if (status.error) return 'Error';
    return 'Not Tested';
  };

  const getStatusColor = (status: any) => {
    if (!status?.enabled) return 'text-gray-500';
    if (status.connected) return 'text-green-600';
    if (status.error) return 'text-red-600';
    return 'text-yellow-600';
  };

  const formatLastChecked = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Status</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage your platform integrations
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh All
        </button>
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from(platforms.entries()).map(([platformId, platform]) => {
          const status = platformStatuses.get(platformId);
          const config = platformConfigs.find(c => c.platform_id === platformId);
          const isEnabled = status?.enabled || false;
          const isTesting = testingPlatform === platformId;

          return (
            <div
              key={platformId}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getCategoryIcon(platform.metadata.category)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {platform.metadata.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {platform.metadata.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePlatform(platformId, isEnabled)}
                    className={`
                      ml-3 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer 
                      rounded-full border-2 border-transparent transition-colors 
                      duration-200 ease-in-out focus:outline-none focus:ring-2 
                      focus:ring-blue-500 focus:ring-offset-2
                      ${isEnabled ? 'bg-blue-600' : 'bg-gray-200'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-5 w-5 transform rounded-full bg-white 
                        shadow ring-0 transition duration-200 ease-in-out
                        ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>

                {/* Status */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                    {status?.lastChecked && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatLastChecked(status.lastChecked)}
                      </div>
                    )}
                  </div>

                  {status?.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {status.error}
                    </div>
                  )}

                  {status?.metadata && status.connected && (
                    <div className="text-sm text-gray-600 space-y-1">
                      {status.metadata.accountName && (
                        <div>Account: {status.metadata.accountName}</div>
                      )}
                      {status.metadata.version && (
                        <div>Version: {status.metadata.version}</div>
                      )}
                      {status.metadata.hostname && (
                        <div>Host: {status.metadata.hostname}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedPlatform(platformId)}
                    disabled={!isEnabled}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </button>
                  <button
                    onClick={() => handleTestConnection(platformId)}
                    disabled={!isEnabled || !config?.config?.apiKey || isTesting}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTesting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Test
                      </>
                    )}
                  </button>
                </div>

                {/* Capabilities */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {platform.metadata.capabilities.map(capability => (
                    <span
                      key={capability}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {capability.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform Configuration Modal */}
      {selectedPlatform && (
        <PlatformConfigModal
          isOpen={!!selectedPlatform}
          onClose={() => setSelectedPlatform(null)}
          platformId={selectedPlatform}
          platform={platforms.get(selectedPlatform)!}
        />
      )}
    </div>
  );
}