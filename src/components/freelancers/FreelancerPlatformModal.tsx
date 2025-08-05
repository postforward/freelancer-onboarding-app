import React, { useState } from 'react';
import { X, Plus, Minus, CheckCircle2 as CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useFreelancers, getFreelancerFullName, type Freelancer } from '../../contexts/FreelancerContext';
import { usePlatforms } from '../../contexts/PlatformContext';
import { useToast } from '../../contexts/ToastContext';

interface FreelancerPlatformModalProps {
  freelancer: Freelancer;
  isOpen: boolean;
  onClose: () => void;
}

export function FreelancerPlatformModal({ freelancer, isOpen, onClose }: FreelancerPlatformModalProps) {
  const { 
    getFreelancerPlatforms, 
    onboardFreelancerToPlatforms,
    deactivateFreelancerFromPlatform 
  } = useFreelancers();
  const { platforms, platformStatuses, platformConfigs } = usePlatforms();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const freelancerPlatforms = getFreelancerPlatforms(freelancer.id);
  
  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'inactive':
        return <Minus className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'pending':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      case 'inactive':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const handleAddToPlatform = async (platformId: string) => {
    setLoading(platformId);
    try {
      await onboardFreelancerToPlatforms(freelancer.id, [platformId]);
      showToast(`Added ${freelancer.first_name} to ${platforms.get(platformId)?.metadata?.name || platformId}`, 'success');
    } catch (error) {
      showToast('Failed to add to platform', 'error');
      console.error('Error adding to platform:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveFromPlatform = async (platformId: string) => {
    if (!confirm(`Remove ${getFreelancerFullName(freelancer)} from ${platforms.get(platformId)?.metadata?.name || platformId}?`)) {
      return;
    }
    
    setLoading(platformId);
    try {
      await deactivateFreelancerFromPlatform(freelancer.id, platformId);
      showToast(`Removed ${freelancer.first_name} from ${platforms.get(platformId)?.metadata?.name || platformId}`, 'success');
    } catch (error) {
      showToast('Failed to remove from platform', 'error');
      console.error('Error removing from platform:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Platform Management</h2>
            <p className="text-sm text-gray-600">{getFreelancerFullName(freelancer)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {Array.from(platforms.entries())
              .filter(([platformId]) => {
                // Show all platforms that are configured and enabled
                const status = platformStatuses.get(platformId);
                const config = platformConfigs.find(c => c.platform_id === platformId);
                return status?.enabled && config;
              })
              .map(([platformId, platformInfo]) => {
                const freelancerPlatform = freelancerPlatforms.find(p => p.platform_id === platformId);
                const isActive = freelancerPlatform && freelancerPlatform.status === 'active';
                const isAssigned = !!freelancerPlatform;
                const isProcessing = loading === platformId;

                return (
                  <div
                    key={platformId}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isAssigned ? getStatusColor(freelancerPlatform.status) : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isAssigned ? getStatusIcon(freelancerPlatform.status) : <Plus className="w-4 h-4 text-gray-400" />}
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {platformInfo?.metadata?.name || platformId}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {isAssigned ? (
                              <>
                                Status: {freelancerPlatform.status.charAt(0).toUpperCase() + freelancerPlatform.status.slice(1)}
                                {freelancerPlatform.provisioned_at && (
                                  <> • Added: {new Date(freelancerPlatform.provisioned_at).toLocaleDateString()}</>
                                )}
                              </>
                            ) : (
                              'Not assigned to this platform'
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isAssigned ? (
                          <button
                            onClick={() => handleRemoveFromPlatform(platformId)}
                            disabled={isProcessing}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? (
                              <>
                                <Clock className="w-3 h-3 mr-1 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <Minus className="w-3 h-3 mr-1" />
                                Remove
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToPlatform(platformId)}
                            disabled={isProcessing}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? (
                              <>
                                <Clock className="w-3 h-3 mr-1 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {freelancerPlatform?.platform_user_id && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                        Platform User ID: {freelancerPlatform.platform_user_id}
                      </div>
                    )}
                  </div>
                );
              })}
            
            {Array.from(platforms.entries()).filter(([platformId]) => {
              const status = platformStatuses.get(platformId);
              const config = platformConfigs.find(c => c.platform_id === platformId);
              return status?.enabled && config;
            }).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <div className="text-sm">No platforms configured</div>
                <div className="text-xs text-gray-400 mt-1">
                  Configure platforms in Platform Settings first
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}