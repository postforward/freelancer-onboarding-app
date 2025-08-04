import React, { useState } from 'react';
import { Plus, User, Mail, Phone, Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useFreelancers } from '../../contexts/FreelancerContext';
import { usePlatforms } from '../../contexts/PlatformContext';
import { useToast } from '../../contexts/ToastContext';

interface FreelancerOnboardingFormProps {
  onClose: () => void;
  onSuccess?: (freelancer: any) => void;
}

interface FormData {
  email: string;
  full_name: string;
  phone: string;
  selectedPlatforms: string[];
  metadata: Record<string, any>;
}

export function FreelancerOnboardingForm({ onClose, onSuccess }: FreelancerOnboardingFormProps) {
  const { createFreelancer, onboardFreelancerToPlatforms } = useFreelancers();
  const { platforms, platformConfigs } = usePlatforms();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    full_name: '',
    phone: '',
    selectedPlatforms: [],
    metadata: {}
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'details' | 'platforms' | 'onboarding'>('details');
  const [createdFreelancer, setCreatedFreelancer] = useState<any>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    console.log(`[FreelancerForm] Input change: ${field} = "${value}"`);
    console.log('[FreelancerForm] Current formData:', formData);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('[FreelancerForm] New formData:', newData);
      return newData;
    });
  };

  const handlePlatformToggle = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platformId)
        ? prev.selectedPlatforms.filter(id => id !== platformId)
        : [...prev.selectedPlatforms, platformId]
    }));
  };

  const handleSubmitDetails = async () => {
    if (!formData.email || !formData.full_name) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const freelancer = await createFreelancer({
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone || undefined,
        metadata: formData.metadata
      });
      
      setCreatedFreelancer(freelancer);
      setStep('platforms');
    } catch (error) {
      showToast('Failed to create freelancer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnboard = async () => {
    if (!createdFreelancer || formData.selectedPlatforms.length === 0) {
      showToast('Please select at least one platform', 'error');
      return;
    }

    setStep('onboarding');
    setIsSubmitting(true);
    
    try {
      await onboardFreelancerToPlatforms(createdFreelancer.id, formData.selectedPlatforms);
      showToast('Freelancer onboarded successfully', 'success');
      onSuccess?.(createdFreelancer);
      onClose();
    } catch (error) {
      showToast('Onboarding failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEnabledPlatforms = () => {
    return Array.from(platforms.entries())
      .filter(([platformId]) => {
        const config = platformConfigs.find(c => c.platform_id === platformId);
        return config?.enabled;
      })
      .map(([platformId, platform]) => ({ id: platformId, ...platform }));
  };

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Freelancer Details</h3>
          <p className="text-sm text-gray-500">Enter the basic information for the new freelancer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="freelancer@example.com"
              required
            />
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 (555) 123-4567"
            />
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmitDetails}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Next: Select Platforms</span>
        </button>
      </div>
    </div>
  );

  const renderPlatformsStep = () => {
    const enabledPlatforms = getEnabledPlatforms();

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Platform Selection</h3>
            <p className="text-sm text-gray-500">Choose which platforms to onboard {createdFreelancer?.full_name}</p>
          </div>
        </div>

        {enabledPlatforms.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Platforms Available</h4>
            <p className="text-gray-500">No platforms are currently enabled. Please enable platforms first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {enabledPlatforms.map((platform) => (
              <div
                key={platform.id}
                className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.selectedPlatforms.includes(platform.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => handlePlatformToggle(platform.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {platform.icon && (
                        <img src={platform.icon} alt={platform.name} className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{platform.name}</h4>
                      <p className="text-xs text-gray-500">{platform.description}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {formData.selectedPlatforms.includes(platform.id) && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button
            onClick={() => setStep('details')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleOnboard}
              disabled={formData.selectedPlatforms.length === 0 || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Start Onboarding</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderOnboardingStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Onboarding in Progress</h3>
          <p className="text-sm text-gray-500">Creating accounts across selected platforms...</p>
        </div>
      </div>

      <div className="py-8">
        <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin mb-4" />
        <p className="text-gray-600">Please wait while we set up {createdFreelancer?.full_name} on the selected platforms.</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl bg-white rounded-lg shadow-lg">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Add New Freelancer</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Plus className="w-6 h-6 transform rotate-45" />
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center mt-4 space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'details' || step === 'platforms' || step === 'onboarding' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'details' || step === 'platforms' || step === 'onboarding' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <span className="text-sm font-medium">Details</span>
            </div>
            <div className={`w-12 h-px ${step === 'platforms' || step === 'onboarding' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center space-x-2 ${step === 'platforms' || step === 'onboarding' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'platforms' || step === 'onboarding' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <span className="text-sm font-medium">Platforms</span>
            </div>
            <div className={`w-12 h-px ${step === 'onboarding' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center space-x-2 ${step === 'onboarding' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'onboarding' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                3
              </div>
              <span className="text-sm font-medium">Onboarding</span>
            </div>
          </div>
        </div>

        {step === 'details' && renderDetailsStep()}
        {step === 'platforms' && renderPlatformsStep()}
        {step === 'onboarding' && renderOnboardingStep()}
      </div>
    </div>
  );
}