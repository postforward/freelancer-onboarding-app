import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, UserX, Settings, Users, Eye, EyeOff, Key, CheckCircle, AlertCircle, Palette, Upload, RotateCcw } from 'lucide-react';

const FreelancerOnboardingApp = () => {
  const [activeTab, setActiveTab] = useState('onboard');
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [branding, setBranding] = useState({
    companyName: 'Creative Team Onboarding',
    logo: null,
    logoUrl: '',
    colors: {
      primary: '#4f46e5',
      secondary: '#059669',
      accent: '#dc2626',
      neutral: '#6b7280'
    }
  });
  const [apiConfig, setApiConfig] = useState({
    truenas: { baseUrl: '', apiKey: '', configured: false },
    parsec: { apiKey: '', organizationId: '', configured: false },
    iconik: { baseUrl: '', apiKey: '', appId: '', configured: false },
    lucidlink: { apiKey: '', organizationId: '', configured: false }
  });
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', username: '', password: '',
    platforms: { truenas: false, parsec: false, iconik: false, lucidlink: false },
    truenasGroups: [], parsecTeam: '', iconikRole: 'viewer',
    lucidlinkFilespace: '', lucidlinkRole: 'read-only'
  });

  useEffect(() => {
    setUsers([
      {
        id: 1, name: 'John Smith', email: 'john@freelancer.com', username: 'jsmith',
        platforms: {
          truenas: { active: true, groups: ['editors', 'projects'] },
          parsec: { active: true, team: 'creative-team-1' },
          iconik: { active: true, role: 'editor' },
          lucidlink: { active: true, filespace: 'main-projects', role: 'read-write' }
        },
        createdAt: '2025-07-25'
      },
      {
        id: 2, name: 'Sarah Johnson', email: 'sarah@designer.com', username: 'sjohnson',
        platforms: {
          truenas: { active: false },
          parsec: { active: true, team: 'creative-team-2' },
          iconik: { active: true, role: 'viewer' },
          lucidlink: { active: false }
        },
        createdAt: '2025-07-28'
      }
    ]);
  }, []);

  const handleBrandingChange = (field, value) => {
    if (field.startsWith('colors.')) {
      const colorKey = field.replace('colors.', '');
      setBranding(prev => ({ ...prev, colors: { ...prev.colors, [colorKey]: value } }));
    } else {
      setBranding(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBranding(prev => ({ ...prev, logo: file, logoUrl: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBranding = () => {
    setBranding({
      companyName: 'Creative Team Onboarding', logo: null, logoUrl: '',
      colors: { primary: '#4f46e5', secondary: '#059669', accent: '#dc2626', neutral: '#6b7280' }
    });
  };

  const handleApiConfigChange = (platform, field, value) => {
    setApiConfig(prev => ({
      ...prev, [platform]: { ...prev[platform], [field]: value,
        configured: field === 'configured' ? value : prev[platform].configured }
    }));
  };

  const testApiConnection = async (platform) => {
    setTimeout(() => {
      setApiConfig(prev => ({ ...prev, [platform]: { ...prev[platform], configured: true } }));
      alert(`${platform} API connection successful!`);
    }, 1000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('platform-')) {
      const platform = name.replace('platform-', '');
      setFormData(prev => ({ ...prev, platforms: { ...prev.platforms, [platform]: checked } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleArrayInput = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value.split(',').map(item => item.trim()).filter(item => item) }));
  };

  const handleSubmit = () => {
    const newUser = {
      id: users.length + 1, name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email, username: formData.username,
      platforms: {
        truenas: formData.platforms.truenas ? { active: true, groups: formData.truenasGroups } : { active: false },
        parsec: formData.platforms.parsec ? { active: true, team: formData.parsecTeam } : { active: false },
        iconik: formData.platforms.iconik ? { active: true, role: formData.iconikRole } : { active: false },
        lucidlink: formData.platforms.lucidlink ? { active: true, filespace: formData.lucidlinkFilespace, role: formData.lucidlinkRole } : { active: false }
      },
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setUsers(prev => [...prev, newUser]);
    setFormData({
      firstName: '', lastName: '', email: '', username: '', password: '',
      platforms: { truenas: false, parsec: false, iconik: false, lucidlink: false },
      truenasGroups: [], parsecTeam: '', iconikRole: 'viewer',
      lucidlinkFilespace: '', lucidlinkRole: 'read-only'
    });
    setShowForm(false);
  };

  const toggleUserPlatform = (userId, platform) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        return {
          ...user, platforms: {
            ...user.platforms, [platform]: { ...user.platforms[platform], active: !user.platforms[platform].active }
          }
        };
      }
      return user;
    }));
  };

  const removeUser = (userId) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const PlatformBadge = ({ platform, config, userId }) => {
    const platformNames = { truenas: 'TrueNAS SMB', parsec: 'Parsec Teams', iconik: 'Iconik', lucidlink: 'Lucidlink' };
    const platformColors = {
      truenas: config.active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500',
      parsec: config.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500',
      iconik: config.active ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500',
      lucidlink: config.active ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'
    };

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${platformColors[platform]} mr-1 mb-1`}>
        <span className="mr-1">{platformNames[platform]}</span>
        <button onClick={() => toggleUserPlatform(userId, platform)} className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5">
          {config.active ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Company Logo" className="h-8 w-8 mr-3 object-contain" />
              ) : (
                <Users className="h-8 w-8 mr-3" style={{ color: branding.colors.primary }} />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{branding.companyName}</h1>
            </div>
            <nav className="flex space-x-8">
              {['onboard', 'manage', 'settings', 'branding'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                  style={{ 
                    borderBottomColor: activeTab === tab ? branding.colors.primary : 'transparent',
                    color: activeTab === tab ? branding.colors.primary : '#6b7280'
                  }}>
                  {tab === 'onboard' ? 'Onboard Freelancer' : 
                   tab === 'manage' ? 'Manage Users' :
                   tab === 'settings' ? 'API Settings' : 'Branding'}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'onboard' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Add New Freelancer</h2>
              <p className="mt-1 text-sm text-gray-500">Create accounts across selected platforms for new team members</p>
            </div>
            {!showForm ? (
              <div className="px-6 py-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No freelancer being onboarded</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new team member.</p>
                <div className="mt-6">
                  <button onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white hover:opacity-90"
                    style={{ backgroundColor: branding.colors.primary }}>
                    <Plus className="-ml-1 mr-2 h-5 w-5" />Add Freelancer
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input type="text" name="username" value={formData.username} onChange={handleInputChange} required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="button" onClick={handleSubmit}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90"
                    style={{ backgroundColor: branding.colors.primary }}>
                    Create Accounts
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Branding & Customization</h2>
              <p className="mt-1 text-sm text-gray-500">Customize the appearance of your onboarding app</p>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={branding.companyName} onChange={(e) => handleBrandingChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <input type="color" value={branding.colors.primary} onChange={(e) => handleBrandingChange('colors.primary', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                  <input type="color" value={branding.colors.accent} onChange={(e) => handleBrandingChange('colors.accent', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer" />
                </div>
              </div>
              <button onClick={resetBranding}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <RotateCcw className="w-4 h-4 mr-1" />Reset
              </button>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Manage Freelancers</h2>
            </div>
            <div className="px-6 py-6">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-4 border-b">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: branding.colors.primary }}>
                      <span className="text-sm font-medium text-white">{user.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <button onClick={() => removeUser(user.id)} className="hover:opacity-70" style={{ color: branding.colors.accent }}>
                    <UserX size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">API Configuration</h2>
              <p className="mt-1 text-sm text-gray-500">Configure API credentials for platform integration</p>
            </div>
            <div className="px-6 py-6">
              <div className="text-center py-12">
                <Key className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">API Settings</h3>
                <p className="mt-1 text-sm text-gray-500">Configure your platform APIs here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerOnboardingApp;
