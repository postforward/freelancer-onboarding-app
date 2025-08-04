import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Power, 
  PowerOff, 
  TestTube,
  AlertTriangle
} from 'lucide-react';
import { usePlatforms } from '../../contexts/PlatformContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../ui/Loading';

export function BulkPlatformOperations() {
  const {
    platforms,
    platformStatuses,
    enableMultiplePlatforms,
    disableMultiplePlatforms,
    testAllConnections
  } = usePlatforms();
  const { showToast } = useToast();
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [operation, setOperation] = useState<'enable' | 'disable' | 'test' | null>(null);

  const allPlatformIds = Array.from(platforms.keys());
  const enabledPlatforms = allPlatformIds.filter(id => platformStatuses.get(id)?.enabled);
  const isAllSelected = selectedPlatforms.size === allPlatformIds.length;
  const isNoneSelected = selectedPlatforms.size === 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPlatforms(new Set());
    } else {
      setSelectedPlatforms(new Set(allPlatformIds));
    }
  };

  const handleSelectPlatform = (platformId: string) => {
    const newSelected = new Set(selectedPlatforms);
    if (newSelected.has(platformId)) {
      newSelected.delete(platformId);
    } else {
      newSelected.add(platformId);
    }
    setSelectedPlatforms(newSelected);
  };

  const handleBulkEnable = async () => {
    if (selectedPlatforms.size === 0) {
      showToast('Please select platforms to enable', 'warning');
      return;
    }

    setIsProcessing(true);
    setOperation('enable');
    try {
      await enableMultiplePlatforms(Array.from(selectedPlatforms));
      showToast(`Enabled ${selectedPlatforms.size} platforms`, 'success');
      setSelectedPlatforms(new Set());
    } catch (error) {
      showToast('Failed to enable some platforms', 'error');
    } finally {
      setIsProcessing(false);
      setOperation(null);
    }
  };

  const handleBulkDisable = async () => {
    if (selectedPlatforms.size === 0) {
      showToast('Please select platforms to disable', 'warning');
      return;
    }

    setIsProcessing(true);
    setOperation('disable');
    try {
      await disableMultiplePlatforms(Array.from(selectedPlatforms));
      showToast(`Disabled ${selectedPlatforms.size} platforms`, 'success');
      setSelectedPlatforms(new Set());
    } catch (error) {
      showToast('Failed to disable some platforms', 'error');
    } finally {
      setIsProcessing(false);
      setOperation(null);
    }
  };

  const handleTestAll = async () => {
    setIsProcessing(true);
    setOperation('test');
    try {
      const results = await testAllConnections();
      const successful = Array.from(results.values()).filter(r => r.success).length;
      const failed = results.size - successful;
      
      if (failed === 0) {
        showToast(`All ${results.size} platforms connected successfully`, 'success');
      } else {
        showToast(`${successful} connected, ${failed} failed`, 'warning');
      }
    } catch (error) {
      showToast('Failed to test connections', 'error');
    } finally {
      setIsProcessing(false);
      setOperation(null);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Bulk Operations
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Perform operations on multiple platforms at once</p>
        </div>

        {/* Platform Selection */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center">
            <button
              onClick={handleSelectAll}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {isAllSelected ? (
                <CheckSquare className="h-5 w-5 mr-2 text-blue-600" />
              ) : (
                <Square className="h-5 w-5 mr-2" />
              )}
              Select All
            </button>
            {selectedPlatforms.size > 0 && (
              <span className="ml-3 text-sm text-gray-500">
                {selectedPlatforms.size} selected
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {allPlatformIds.map(platformId => {
              const platform = platforms.get(platformId)!;
              const status = platformStatuses.get(platformId);
              const isSelected = selectedPlatforms.has(platformId);

              return (
                <div
                  key={platformId}
                  className="relative flex items-start py-2"
                >
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectPlatform(platformId)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm flex-1">
                    <label className="font-medium text-gray-700">
                      {platform.metadata.name}
                    </label>
                    <span className={`ml-2 text-xs ${
                      status?.enabled ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {status?.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handleBulkEnable}
            disabled={isProcessing || isNoneSelected}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing && operation === 'enable' ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            Enable Selected
          </button>

          <button
            onClick={handleBulkDisable}
            disabled={isProcessing || isNoneSelected}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing && operation === 'disable' ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <PowerOff className="h-4 w-4 mr-2" />
            )}
            Disable Selected
          </button>

          <button
            onClick={handleTestAll}
            disabled={isProcessing || enabledPlatforms.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing && operation === 'test' ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Test All Enabled
          </button>
        </div>

        {enabledPlatforms.length === 0 && (
          <div className="mt-4 rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  No platforms are currently enabled. Enable platforms to test connections.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}