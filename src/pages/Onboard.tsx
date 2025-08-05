import React, { useState } from 'react';
import { useFreelancers } from '../contexts/FreelancerContext';
import { useToast } from '../contexts/ToastContext';
import { usePlatforms } from '../contexts/PlatformContext';

export const Onboard: React.FC = () => {
  const { createFreelancer, onboardFreelancerToPlatforms } = useFreelancers();
  const { showToast } = useToast();
  const { platforms, platformStatuses, platformConfigs } = usePlatforms();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    selectedPlatforms: [] as string[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...prev.selectedPlatforms, platform]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (formData.selectedPlatforms.length === 0) {
      showToast('Please select at least one platform', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Creating freelancer with data:', formData);
      
      // Create the freelancer
      const freelancer = await createFreelancer({
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone || undefined,
        metadata: {
          onboarded_via: 'manual_form',
          selected_platforms: formData.selectedPlatforms
        }
      });

      console.log('Freelancer created:', freelancer);

      // Onboard to selected platforms
      if (formData.selectedPlatforms.length > 0) {
        console.log('Onboarding to platforms:', formData.selectedPlatforms);
        await onboardFreelancerToPlatforms(freelancer.id, formData.selectedPlatforms);
      }

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        selectedPlatforms: []
      });

      // Single success message after everything is complete
      showToast('Freelancer created and onboarded successfully!', 'success');
      
    } catch (error) {
      console.error('Error creating freelancer:', error);
      showToast('Failed to create freelancer. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Onboard Freelancer</h1>
        <p className="text-gray-600">Create a new freelancer and configure their platform access</p>
      </div>
      
      <div className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Freelancer Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input 
                type="text" 
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter freelancer's full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Platforms
              </label>
              <div className="space-y-2">
                {Array.from(platforms.entries())
                  .filter(([platformId]) => {
                    // Only show platforms that are configured and enabled
                    const status = platformStatuses.get(platformId);
                    const config = platformConfigs.find(c => c.platform_id === platformId);
                    return status?.enabled && config;
                  })
                  .map(([platformId, platformInfo]) => (
                    <label key={platformId} className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={formData.selectedPlatforms.includes(platformId)}
                        onChange={() => handlePlatformToggle(platformId)}
                      />
                      <span className="text-gray-600">
                        {platformInfo?.metadata?.name || platformId}
                      </span>
                    </label>
                  ))
                }
                {Array.from(platforms.entries())
                  .filter(([platformId]) => {
                    const status = platformStatuses.get(platformId);
                    const config = platformConfigs.find(c => c.platform_id === platformId);
                    return status?.enabled && config;
                  }).length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    No platforms are currently configured. Please configure platforms in the Platform Settings first.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Onboard page - placeholder component</p>
            <p className="text-sm text-gray-500 mb-4">
              This form will collect freelancer information and automatically create accounts across selected platforms.
            </p>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isSubmitting ? 'Creating Freelancer...' : 'Start Onboarding Process'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};