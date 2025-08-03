import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useFreelancers } from '../../contexts/FreelancerContext';
import { usePlatforms } from '../../contexts/PlatformContext';

interface OnboardingProgressTrackerProps {
  freelancerId: string;
  className?: string;
}

export function OnboardingProgressTracker({ freelancerId, className = '' }: OnboardingProgressTrackerProps) {
  const { getOnboardingProgress, getFreelancerPlatforms } = useFreelancers();
  const { platforms } = usePlatforms();
  
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
          {freelancerPlatforms.map((platform) => {
            const platformInfo = platforms.get(platform.platform_id);
            
            return (
              <div
                key={platform.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(platform.status)}`}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(platform.status)}
                  <div>
                    <div className="text-sm font-medium">
                      {platformInfo?.name || platform.platform_id}
                    </div>
                    {platform.error_message && (
                      <div className="text-xs text-red-600 mt-1">
                        {platform.error_message}
                      </div>
                    )}
                    {platform.provisioned_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Provisioned: {new Date(platform.provisioned_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(platform.status)}`}>
                    {platform.status.charAt(0).toUpperCase() + platform.status.slice(1)}
                  </div>
                  {platform.platform_user_id && (
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {platform.platform_user_id}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {freelancerPlatforms.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No platforms configured
            </div>
          )}
        </div>
      </div>
    </div>
  );
}