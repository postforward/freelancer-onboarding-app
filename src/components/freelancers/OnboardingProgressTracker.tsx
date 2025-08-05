import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useFreelancers } from '../../contexts/FreelancerContext';
import { usePlatforms } from '../../contexts/PlatformContext';

interface OnboardingProgressTrackerProps {
  freelancerId: string;
  className?: string;
}

export function OnboardingProgressTracker({ freelancerId, className = '' }: OnboardingProgressTrackerProps) {
  const { getOnboardingProgress, getFreelancerPlatforms, toggleFreelancerPlatformAccess } = useFreelancers();
  const { platforms, platformStatuses, platformConfigs } = usePlatforms();
  
  const progress = getOnboardingProgress(freelancerId);
  const freelancerPlatforms = getFreelancerPlatforms(freelancerId);

  if (!progress && freelancerPlatforms.length === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'provisioning':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'deactivated':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'provisioning':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'pending':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      case 'deactivated':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const handleTogglePlatform = async (platformId: string, enabled: boolean) => {
    try {
      await toggleFreelancerPlatformAccess(freelancerId, platformId, enabled);
    } catch (error) {
      console.error('Failed to toggle platform access:', error);
    }
  };

  const renderProgressSummary = () => {
    if (!progress) return null;

    const progressPercentage = Math.floor((progress.completedPlatforms / progress.totalPlatforms) * 100);

    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Onboarding Progress
          </span>
          <span className="text-sm text-gray-600">
            {progress.completedPlatforms}/{progress.totalPlatforms} platforms
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progress.status === 'failed' ? 'bg-red-500' :
              progress.status === 'completed' ? 'bg-green-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            {progress.status === 'processing' ? 'In Progress...' :
             progress.status === 'completed' ? 'Completed' :
             progress.status === 'failed' ? `${progress.failedPlatforms} Failed` :
             'Pending'}
          </span>
          {progress.currentPlatform && (
            <span className="text-blue-600 font-medium">
              Currently: {platforms.get(progress.currentPlatform)?.name || progress.currentPlatform}
            </span>
          )}
        </div>

        {progress.errors.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
            <div className="text-xs font-medium text-red-700 mb-1">Errors:</div>
            {progress.errors.slice(0, 3).map((error, index) => (
              <div key={index} className="text-xs text-red-600">
                • {platforms.get(error.platform)?.name || error.platform}: {error.error}
              </div>
            ))}
            {progress.errors.length > 3 && (
              <div className="text-xs text-red-500 mt-1">
                +{progress.errors.length - 3} more errors
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Platform Status</h4>
        
        {renderProgressSummary()}

        <div className="space-y-2">
          {Array.from(platforms.entries())
            .filter(([platformId]) => {
              // Only show platforms that are configured and enabled
              const status = platformStatuses.get(platformId);
              const config = platformConfigs.find(c => c.platform_id === platformId);
              return status?.enabled && config;
            })
            .map(([platformId, platformInfo]) => {
            const freelancerPlatform = freelancerPlatforms.find(p => p.platform_id === platformId);
            const isActive = freelancerPlatform?.status === 'active';
            const hasAccess = freelancerPlatform && (
              freelancerPlatform.status === 'active' || 
              freelancerPlatform.status === 'provisioning' ||
              freelancerPlatform.status === 'pending'
            );
            
            return (
              <div
                key={platformId}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  freelancerPlatform ? getStatusColor(freelancerPlatform.status) : 'text-gray-700 bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {freelancerPlatform ? getStatusIcon(freelancerPlatform.status) : <Clock className="w-5 h-5 text-gray-400" />}
                  <div>
                    <div className="text-sm font-medium">
                      {platformInfo?.metadata?.name || platformId}
                    </div>
                    {freelancerPlatform?.error_message && (
                      <div className="text-xs text-red-600 mt-1">
                        {freelancerPlatform.error_message}
                      </div>
                    )}
                    {freelancerPlatform?.provisioned_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Provisioned: {new Date(freelancerPlatform.provisioned_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      freelancerPlatform ? getStatusColor(freelancerPlatform.status) : 'text-gray-700 bg-gray-50 border-gray-200'
                    }`}>
                      {freelancerPlatform ? 
                        freelancerPlatform.status.charAt(0).toUpperCase() + freelancerPlatform.status.slice(1) :
                        'Not Assigned'
                      }
                    </div>
                    {freelancerPlatform?.platform_user_id && (
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {freelancerPlatform.platform_user_id}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleTogglePlatform(platformId, !hasAccess)}
                    className={`
                      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer 
                      rounded-full border-2 border-transparent transition-colors 
                      duration-200 ease-in-out focus:outline-none focus:ring-2 
                      focus:ring-blue-500 focus:ring-offset-2
                      ${hasAccess ? 'bg-blue-600' : 'bg-gray-200'}
                    `}
                    title={`${hasAccess ? 'Disable' : 'Enable'} access to ${platformInfo?.metadata?.name}`}
                  >
                    <span
                      className={`
                        inline-block h-5 w-5 transform rounded-md bg-white 
                        shadow ring-0 transition duration-200 ease-in-out
                        ${hasAccess ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>
              </div>
            );
          })}
          
          {Array.from(platforms.entries()).filter(([platformId]) => {
            const status = platformStatuses.get(platformId);
            const config = platformConfigs.find(c => c.platform_id === platformId);
            return status?.enabled && config;
          }).length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No platforms configured
            </div>
          )}
        </div>
      </div>
    </div>
  );
}