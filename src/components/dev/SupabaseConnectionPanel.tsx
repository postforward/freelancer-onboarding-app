import { useState, useEffect } from 'react';
import { connectionTester, type SupabaseConnectionStatus, type ConnectionTestResult } from '../../utils/supabaseConnectionTest';
import { config } from '../../config/environment';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export function SupabaseConnectionPanel() {
  const [status, setStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const results = await connectionTester.runAllTests();
      setStatus(results);
    } catch (error) {
      console.error('Failed to run connection tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run tests on mount
    runTests();

    // Set up auto-refresh if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(runTests, 30000); // Every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (!config.FEATURES.ENABLE_DEBUG_LOGGING) {
    return null;
  }

  const getStatusIcon = (status: ConnectionTestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: ConnectionTestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Supabase Connection Status</h3>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto
            </label>
            <button
              onClick={runTests}
              disabled={loading}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {status && (
          <div className="mt-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${
                status.isConnected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span>
                {status.isUsingReal ? 'Real Supabase' : 'Mock Mode'}
              </span>
              <span className="text-gray-400">
                {new Date(status.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {status.connectionError && (
              <div className="mt-1 text-red-300 text-xs">
                {status.connectionError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Results */}
      <div className="overflow-y-auto max-h-[500px]">
        {status?.results.map((result, index) => (
          <div
            key={index}
            className={`p-3 border-b ${getStatusColor(result.status)}`}
          >
            <div className="flex items-start gap-2">
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <div className="font-medium text-sm">{result.test}</div>
                <div className="text-sm text-gray-600 mt-0.5">
                  {result.message}
                </div>
                {result.details && (
                  <details className="mt-1">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      View details
                    </summary>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
                {result.duration && (
                  <div className="text-xs text-gray-400 mt-1">
                    {result.duration}ms
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-3 bg-gray-50 border-t text-xs">
        <div className="space-y-1">
          <button
            onClick={() => {
              console.log('🔍 Full test results:', status);
              alert('Check console for full test results');
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Export to Console
          </button>
          <div className="text-gray-500">
            Run <code className="bg-gray-200 px-1">testSupabaseConnection()</code> in console
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a function to programmatically show/hide the panel
export const toggleConnectionPanel = () => {
  const event = new CustomEvent('toggleSupabasePanel');
  window.dispatchEvent(event);
};