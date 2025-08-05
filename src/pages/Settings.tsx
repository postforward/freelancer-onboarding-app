import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { mockUsers } from '../mock/data';

export const Settings: React.FC = () => {
  const { showToast } = useToast();
  const { canUpdateSettings, canManagePlatforms } = usePermissions();
  const { dbUser, refreshUser } = useAuth();
  const defaultSettings = {
    organizationName: '',
    contactEmail: '',
    timeZone: 'UTC',
    notifications: {
      emailFreelancers: false,
      smsFailures: false,
      weeklyReports: false,
      platformUpdates: false
    },
    sessionTimeout: 30,
    twoFactorAuth: false,
    logApiCalls: false,
    apiRateLimit: 100,
    webhookUrl: ''
  };

  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      showToast('Failed to load saved settings', 'error');
    }
  }, [showToast]);

  const handleInputChange = (field: string, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }));
  };

  const handleBooleanChange = (field: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      // In a real app, you would also save to a backend API
      // await fetch('/api/settings', { method: 'PUT', body: JSON.stringify(settings) });
      
      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      setSettings(defaultSettings);
      localStorage.removeItem('appSettings');
      showToast('Settings reset to defaults!', 'success');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showToast('Failed to reset settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSwitch = async (userId: string) => {
    localStorage.setItem('mock-selected-user-id', userId);
    window.location.reload(); // Simple way to refresh auth context
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your application settings and preferences</p>
        
        {/* User Role Switcher for Testing */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Role Testing (Demo Mode)</h3>
          <p className="text-xs text-yellow-700 mb-3">
            Current user: {dbUser?.full_name} ({dbUser?.role})
          </p>
          <div className="flex space-x-2">
            {mockUsers.filter(u => u.organization_id === 'org-1').map(user => (
              <button
                key={user.id}
                onClick={() => handleUserSwitch(user.id)}
                disabled={dbUser?.id === user.id}
                className={`px-3 py-1 text-xs rounded-md ${
                  dbUser?.id === user.id 
                    ? 'bg-yellow-200 text-yellow-800 cursor-not-allowed' 
                    : 'bg-white text-yellow-700 border border-yellow-300 hover:bg-yellow-100'
                }`}
              >
                {user.full_name} ({user.role})
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input 
                type="text" 
                value={settings.organizationName}
                onChange={(e) => handleInputChange('organizationName', e.target.value)}
                placeholder="Enter organization name"
                disabled={!canUpdateSettings()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input 
                type="email" 
                value={settings.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                placeholder="Enter contact email"
                disabled={!canUpdateSettings()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Zone
              </label>
              <select 
                value={settings.timeZone}
                onChange={(e) => handleInputChange('timeZone', e.target.value)}
                disabled={!canUpdateSettings()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="UTC">UTC</option>
                <option value="EST">EST</option>
                <option value="PST">PST</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="mr-3" 
                checked={settings.notifications.emailFreelancers}
                onChange={(e) => handleNotificationChange('emailFreelancers', e.target.checked)}
              />
              <span className="text-gray-700">Email notifications for new freelancers</span>
            </label>
            
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="mr-3" 
                checked={settings.notifications.smsFailures}
                onChange={(e) => handleNotificationChange('smsFailures', e.target.checked)}
              />
              <span className="text-gray-700">SMS alerts for failed onboarding</span>
            </label>
            
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="mr-3" 
                checked={settings.notifications.weeklyReports}
                onChange={(e) => handleNotificationChange('weeklyReports', e.target.checked)}
              />
              <span className="text-gray-700">Weekly activity reports</span>
            </label>
            
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="mr-3" 
                checked={settings.notifications.platformUpdates}
                onChange={(e) => handleNotificationChange('platformUpdates', e.target.checked)}
              />
              <span className="text-gray-700">Platform status updates</span>
            </label>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Timeout (minutes)
              </label>
              <input 
                type="number" 
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                placeholder="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="mr-3" 
                checked={settings.twoFactorAuth}
                onChange={(e) => handleBooleanChange('twoFactorAuth', e.target.checked)}
                disabled={!canUpdateSettings()}
              />
              <span className="text-gray-700">Require two-factor authentication</span>
            </label>
            
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="mr-3" 
                checked={settings.logApiCalls}
                onChange={(e) => handleBooleanChange('logApiCalls', e.target.checked)}
                disabled={!canManagePlatforms()}
              />
              <span className="text-gray-700">Log all platform API calls</span>
            </label>
          </div>
        </div>
        
{canManagePlatforms() && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">API Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Rate Limit (requests/minute)
                </label>
                <input 
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={(e) => handleInputChange('apiRateLimit', parseInt(e.target.value) || 0)}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input 
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                  placeholder="https://your-webhook-url.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
        <p className="text-gray-600 mb-4">Settings page - placeholder component</p>
        <p className="text-sm text-gray-500 mb-6">
          Configure organization settings, notifications, security preferences, and API configurations.
        </p>
        
        <div className="flex space-x-4">
          <button 
            onClick={handleSave}
            disabled={isLoading || !canUpdateSettings()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
          </button>
          <button 
            onClick={handleReset}
            disabled={isLoading || !canUpdateSettings()}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset to Defaults'}
          </button>
        </div>
      </div>
    </div>
  );
};