import { useEffect, useState } from 'react';
import {
  Server,
  RefreshCw,
  Settings,
  Activity,
  FolderSync
} from 'lucide-react';
import { usePlatforms } from '../../contexts/PlatformContext';
import { PlatformConfigModal } from './PlatformConfigModal';
import { LoadingSpinner } from '../ui/Loading';
import { DebugLogger, debugGroup } from '../../utils/debugLogger';

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
    // Only proceed if platforms data is available
    if (!platforms || platforms.size === 0) {
      DebugLogger.warn('PlatformStatusDashboard', 'Component mounted but platforms data not yet available');
      return;
    }
    
    debugGroup('PlatformStatusDashboard Mount', () => {
      DebugLogger.log('PlatformStatusDashboard', 'Component mounted, refreshing platform statuses');
      DebugLogger.log('PlatformStatusDashboard', 'Available platforms', {
        platformCount: platforms?.size || 0,
        platformIds: platforms ? Array.from(platforms.keys()) : []
      });
    });
    
    // Refresh statuses on mount
    refreshPlatformStatuses();
  }, [platforms, refreshPlatformStatuses]);

  const handleRefreshAll = async () => {
    debugGroup('Refresh All Platforms', () => {
      DebugLogger.log('PlatformStatusDashboard', 'Starting refresh all platforms');
    });
    
    setRefreshing(true);
    try {
      await refreshPlatformStatuses();
      DebugLogger.success('PlatformStatusDashboard', 'All platform statuses refreshed');
    } catch (error) {
      DebugLogger.error('PlatformStatusDashboard', 'Failed to refresh platform statuses', error);
    } finally {
      DebugLogger.log('PlatformStatusDashboard', 'Setting refreshing state to false');
      setRefreshing(false);
    }
  };

  const handleTestConnection = async (platformId: string) => {
    debugGroup(`Test Connection: ${platformId}`, () => {
      DebugLogger.log('PlatformStatusDashboard', 'Starting connection test', { platformId });
    });
    
    setTestingPlatform(platformId);
    try {
      const result = await testPlatformConnection(platformId);
      if (result.success) {
        DebugLogger.success('PlatformStatusDashboard', 'Connection test successful', { platformId });
      } else {
        DebugLogger.error('PlatformStatusDashboard', 'Connection test failed', { platformId, error: result.error });
      }
    } catch (error) {
      DebugLogger.error('PlatformStatusDashboard', 'Connection test exception', { platformId, error });
    } finally {
      DebugLogger.log('PlatformStatusDashboard', 'Setting testing platform to null');
      setTestingPlatform(null);
    }
  };

  const handleTogglePlatform = async (platformId: string, currentlyEnabled: boolean) => {
    const action = currentlyEnabled ? 'disable' : 'enable';
    debugGroup(`Toggle Platform: ${platformId}`, () => {
      DebugLogger.log('PlatformStatusDashboard', `Starting platform ${action}`, { 
        platformId, 
        currentlyEnabled 
      });
    });
    
    try {
      if (currentlyEnabled) {
        await disablePlatform(platformId);
        DebugLogger.success('PlatformStatusDashboard', 'Platform disabled', { platformId });
      } else {
        await enablePlatform(platformId);
        DebugLogger.success('PlatformStatusDashboard', 'Platform enabled', { platformId });
      }
    } catch (error) {
      DebugLogger.error('PlatformStatusDashboard', `Failed to ${action} platform`, { platformId, error });
    }
  };

  const getCategoryIcon = (category: string | undefined) => {
    switch (category) {
      case 'file-sharing':
        return <FolderSync className="h-5 w-5" />;
      case 'infrastructure':
        return <Server className="h-5 w-5" />;
      case 'screen-sharing':
        return <Activity className="h-5 w-5" />;
      case 'collaboration':
        return <Server className="h-5 w-5" />;
      case 'communication':
        return <Activity className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusDot = (status: any, config: any) => {
    if (!config) {
      return <div className="w-2 h-2 rounded-full bg-gray-400" />;
    }
    if (!status?.enabled) {
      return <div className="w-2 h-2 rounded-full bg-blue-500" />;
    }
    if (status.connected) {
      return <div className="w-2 h-2 rounded-full bg-green-500" />;
    }
    if (status.error) {
      return <div className="w-2 h-2 rounded-full bg-red-500" />;
    }
    return <div className="w-2 h-2 rounded-full bg-orange-500" />;
  };


  const getStatusText = (status: any, config: any) => {
    if (!config) return 'Not Configured';
    if (!status?.enabled) return 'Configured';
    if (status.connected) return 'Connected';
    if (status.error) return 'Error';
    return 'Enabled';
  };


  const formatLastChecked = (date?: Date) => {
    if (!date) return 'Never checked';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 2) return 'Active';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  // Show loading state while data is being fetched
  if (loading || !platforms || platforms.size === 0) {
    DebugLogger.log('PlatformStatusDashboard', 'Showing loading state', {
      loading,
      hasPlatforms: !!platforms,
      platformCount: platforms?.size || 0
    });
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  DebugLogger.log('PlatformStatusDashboard', 'Rendering platform dashboard', {
    platformCount: platforms?.size || 0,
    configCount: platformConfigs?.length || 0,
    statusCount: platformStatuses?.size || 0,
    loading,
    refreshing,
    testingPlatform,
    selectedPlatform,
    platformIds: platforms ? Array.from(platforms.keys()) : []
  });

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

      {/* Helper Message */}
      {platforms && platforms.size > 0 && Array.from(platformStatuses.values()).every(status => !status.enabled) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                No platforms are currently enabled
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  To get started: 1) Click "Configure" to set up credentials, 2) Save the configuration (platform will be auto-enabled), 
                  3) Click "Test" to verify the connection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {platforms && Array.from(platforms.entries()).map(([platformId, platform]) => {
          const status = platformStatuses.get(platformId);
          const config = platformConfigs.find(c => c.platform_id === platformId);
          // Use status.enabled as the primary source of truth for toggle state
          const isEnabled = status?.enabled || false;
          
          // Debug the enabled state determination
          DebugLogger.log('PlatformStatusDashboard', `Toggle state for ${platformId}`, {
            statusEnabled: status?.enabled,
            configEnabled: config?.is_enabled,
            finalIsEnabled: isEnabled,
            hasStatus: !!status,
            hasConfig: !!config
          });
          const isTesting = testingPlatform === platformId;
          
          DebugLogger.log('PlatformStatusDashboard', 'Rendering platform card', {
            platformId,
            platformName: platform?.metadata?.name || 'Unknown',
            isEnabled,
            hasStatus: !!status,
            hasConfig: !!config,
            configEnabled: config?.is_enabled,
            statusEnabled: status?.enabled,
            connected: status?.connected,
            hasError: !!status?.error,
            isTesting,
            lastChecked: status?.lastChecked,
            configData: config?.config,
            toggleShouldRender: true // Always true to debug visibility
          });

          return (
            <div
              key={platformId}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getCategoryIcon(platform?.metadata?.category)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {platform?.metadata?.name || 'Unknown Platform'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {platform?.metadata?.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      DebugLogger.log('PlatformStatusDashboard', 'Toggle clicked', { 
                        platformId, 
                        currentState: isEnabled 
                      });
                      handleTogglePlatform(platformId, isEnabled);
                    }}
                    className={`
                      ml-3 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer 
                      rounded-full border-2 border-transparent transition-colors 
                      duration-200 ease-in-out focus:outline-none focus:ring-2 
                      focus:ring-blue-500 focus:ring-offset-2
                      ${isEnabled ? 'bg-blue-600' : 'bg-gray-200'}
                    `}
                    style={{ 
                      backgroundColor: isEnabled ? '#2563eb' : '#e5e7eb'
                    }}
                    title={`${isEnabled ? 'Disable' : 'Enable'} ${platform?.metadata?.name}`}
                  >
                    <span
                      className={`
                        inline-block h-5 w-5 transform rounded-md bg-white 
                        shadow ring-0 transition duration-200 ease-in-out
                        ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>

                {/* Status */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusDot(status, config)}
                      <span className="text-sm text-gray-700">
                        {getStatusText(status, config)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatLastChecked(status?.lastChecked)}
                    </span>
                  </div>

                  {status?.error && (
                    <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mb-2">
                      {status.error}
                    </div>
                  )}

                  {status?.metadata && status.connected && (
                    <div className="text-xs text-gray-500 space-y-1">
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
                    onClick={() => {
                      DebugLogger.log('PlatformStatusDashboard', 'Configure button clicked', { 
                        platformId, 
                        isEnabled,
                        hasConfig: !!config 
                      });
                      setSelectedPlatform(platformId);
                    }}
                    disabled={false}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </button>
                  <button
                    onClick={() => handleTestConnection(platformId)}
                    disabled={!isEnabled || isTesting}
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
                  {(platform?.metadata?.capabilities || []).map(capability => (
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
      {selectedPlatform && platforms && platforms.has(selectedPlatform) && (
        <PlatformConfigModal
          isOpen={!!selectedPlatform}
          onClose={() => {
            DebugLogger.log('PlatformStatusDashboard', 'Platform config modal closed', { 
              platformId: selectedPlatform 
            });
            setSelectedPlatform(null);
          }}
          platformId={selectedPlatform}
          platform={platforms.get(selectedPlatform)!}
        />
      )}
    </div>
  );
}