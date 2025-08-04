import React, { useState } from 'react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
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
  });

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

  const handleSave = () => {
    console.log('Settings saved:', settings);
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    setSettings({
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
    });
    alert('Settings reset to defaults!');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your application settings and preferences</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Zone
              </label>
              <select 
                value={settings.timeZone}
                onChange={(e) => handleInputChange('timeZone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              />
              <span className="text-gray-700">Require two-factor authentication</span>
            </label>
            
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="mr-3" 
                checked={settings.logApiCalls}
                onChange={(e) => handleBooleanChange('logApiCalls', e.target.checked)}
              />
              <span className="text-gray-700">Log all platform API calls</span>
            </label>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Rate Limit (requests/minute)
              </label>
              <input 
                type="number" 
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
                placeholder="https://your-webhook-url.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
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
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Save Settings
          </button>
          <button 
            onClick={handleReset}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};