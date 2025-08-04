import React, { useState } from 'react';
import { Settings, Database, RefreshCw, Info } from 'lucide-react';
import { config, devUtils } from '../../config/environment';

export function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Only show in development
  if (!config.FEATURES.ENABLE_DEBUG_LOGGING) {
    return null;
  }

  const dataSource = devUtils.getDataSource();
  
  const handleToggleDataSource = () => {
    devUtils.toggleDataSource();
    // Force a page reload to apply changes
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          title="Development Panel"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Dev Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Dev Panel
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {/* Data Source Status */}
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Data Source</div>
                  <div className={`text-xs ${dataSource === 'mock' ? 'text-blue-600' : 'text-green-600'}`}>
                    {dataSource === 'mock' ? '🎭 Mock Data' : '🔒 Real Data'}
                  </div>
                </div>
                <button
                  onClick={handleToggleDataSource}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    dataSource === 'mock' 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <RefreshCw className="w-3 h-3 inline mr-1" />
                  Switch
                </button>
              </div>
            </div>

            {/* Environment Info */}
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-700 mb-2">Environment</div>
              <div className="text-xs space-y-1 text-gray-600">
                <div>NODE_ENV: {process.env.NODE_ENV}</div>
                <div>Mock Data: {config.USE_MOCK_DATA ? 'Enabled' : 'Disabled'}</div>
                <div>Debug Logging: {config.FEATURES.ENABLE_DEBUG_LOGGING ? 'On' : 'Off'}</div>
              </div>
            </div>

            {/* Mock Data Info */}
            {dataSource === 'mock' && (
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                  <Info className="w-4 h-4 mr-1" />
                  Mock Data Summary
                </div>
                <div className="text-xs space-y-1 text-blue-600">
                  <div>• 3 Organizations</div>
                  <div>• 12 Freelancers</div>
                  <div>• 4 Platforms (Amove, Upwork, Fiverr, Freelancer)</div>
                  <div>• Realistic failure rates for testing</div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded transition-colors"
              >
                🔄 Reload App
              </button>
              <button
                onClick={() => localStorage.clear()}
                className="w-full text-xs bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded transition-colors"
              >
                🗑️ Clear Storage
              </button>
            </div>

            {/* Login Hint */}
            {dataSource === 'mock' && (
              <div className="p-2 bg-yellow-50 rounded-md">
                <div className="text-xs text-yellow-700">
                  <strong>Quick Login:</strong><br />
                  Email: admin@techflow.com<br />
                  Password: password
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}