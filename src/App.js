import React, { useState, useEffect } from 'react';
import { Plus, Users, Eye, EyeOff, Key, UserX, RotateCcw, LogIn, LogOut, Upload, X, Shield } from 'lucide-react';

const FreelancerOnboardingApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('onboard');
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [appUsers, setAppUsers] = useState([]);
  const [newAppUser, setNewAppUser] = useState({ username: '', password: '', role: 'user' });
  
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
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', username: '', password: '',
    platforms: { truenas: false, parsec: false, iconik: false, lucidlink: false },
    truenasGroups: [], parsecTeam: '', iconikRole: 'viewer',
    lucidlinkFilespace: '', lucidlinkRole: 'read-only'
  });

  const [apiSettings, setApiSettings] = useState({
    truenasUrl: '', truenasKey: '', parsecKey: '', parsecOrgId: '',
    iconikUrl: '', iconikKey: '', iconikAppId: '', lucidlinkKey: '', lucidlinkOrgId: ''
  });

  // API Integration Functions
  // eslint-disable-next-line no-unused-vars
  const createParsecUser = async (userData) => {
    console.log('🚀 Creating Parsec user:', userData);
    console.log('🔑 Using API Key (first 8 chars):', apiSettings.parsecKey.substring(0, 8) + '...');
    console.log('🏢 Organization ID:', apiSettings.parsecOrgId);
    
    const requestData = {
      email: userData.email,
      name: userData.name,
      role: 'member' // Can be 'member' or 'admin'
    };

    console.log('📤 Request payload:', requestData);
    console.log('📡 API Endpoint:', `https://api.parsec.app/v1/teams/${apiSettings.parsecOrgId}/members`);

    try {
      const response = await fetch(`https://api.parsec.app/v1/teams/${apiSettings.parsecOrgId}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiSettings.parsecKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 Response Status:', response.status);
      console.log('📡 Response Status Text:', response.statusText);
      console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

      const responseData = await response.json();
      console.log('📦 Full Response Data:', responseData);

      if (response.ok) {
        console.log('✅ Parsec user created successfully');
        return { success: true, data: responseData };
      } else {
        console.error('❌ Failed to create Parsec user');
        console.error('Error details:', responseData);
        return { success: false, error: responseData };
      }
    } catch (error) {
      console.error('💥 Network/API Error:', error);
      console.error('Error stack:', error.stack);
      return { success: false, error: error.message };
    }
  };

  // Initialize default admin and demo users
  useEffect(() => {
    const defaultAppUsers = [
      { id: 1, username: 'admin', password: 'admin123', role: 'admin', lastLogin: null },
      { id: 2, username: 'manager', password: 'manager123', role: 'user', lastLogin: null }
    ];
    setAppUsers(defaultAppUsers);
    
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

  const handleLogin = (e) => {
    e.preventDefault();
    const user = appUsers.find(u => u.username === loginForm.username && u.password === loginForm.password);
    
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      setLoginError('');
      setLoginForm({ username: '', password: '' });
      
      // Update last login
      setAppUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u
      ));
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('onboard');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setBranding(prev => ({
          ...prev,
          logo: file,
          logoUrl: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setBranding(prev => ({
      ...prev,
      logo: null,
      logoUrl: ''
    }));
  };

  const handleBrandingChange = (field, value) => {
    if (field.startsWith('colors.')) {
      const colorKey = field.replace('colors.', '');
      setBranding(prev => ({ ...prev, colors: { ...prev.colors, [colorKey]: value } }));
    } else {
      setBranding(prev => ({ ...prev, [field]: value }));
    }
  };

  const resetBranding = () => {
    setBranding({
      companyName: 'Creative Team Onboarding', logo: null, logoUrl: '',
      colors: { primary: '#4f46e5', secondary: '#059669', accent: '#dc2626', neutral: '#6b7280' }
    });
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

  const handleSubmit = async () => {
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

    console.log('🎯 Creating new user:', newUser);

    // Create accounts on selected platforms
    if (formData.platforms.parsec && apiSettings.parsecKey && apiSettings.parsecOrgId) {
      console.log('📤 Creating Parsec account...');
      
      try {
        const parsecResult = await createParsecUser({
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`
        });
        
        if (parsecResult.success) {
          console.log('✅ Parsec account created successfully');
          alert(`✅ Parsec account created successfully for ${formData.email}!`);
        } else {
          console.error('❌ Failed to create Parsec account:', parsecResult.error);
          alert(`❌ Failed to create Parsec account: ${JSON.stringify(parsecResult.error, null, 2)}`);
          // Still continue with local user creation even if API fails
        }
      } catch (error) {
        console.error('💥 Error calling createParsecUser:', error);
        alert(`💥 Error creating Parsec account: ${error.message}`);
      }
    } else {
      console.log('⏭️ Skipping Parsec - either not selected or missing API credentials');
    }
    
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

  const addAppUser = () => {
    if (!newAppUser.username || !newAppUser.password) {
      alert('Please fill in all fields');
      return;
    }
    
    if (appUsers.some(u => u.username === newAppUser.username)) {
      alert('Username already exists');
      return;
    }

    const user = {
      id: Date.now(),
      ...newAppUser,
      lastLogin: null
    };
    
    setAppUsers(prev => [...prev, user]);
    setNewAppUser({ username: '', password: '', role: 'user' });
  };

  const removeAppUser = (userId) => {
    if (appUsers.length <= 1) {
      alert('Cannot remove the last user');
      return;
    }
    setAppUsers(prev => prev.filter(u => u.id !== userId));
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

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12" style={{ color: branding.colors.primary }} />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{branding.companyName}</h2>
            <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="text-red-600 text-sm text-center">{loginError}</div>
            )}

            <button
              type="submit"
              onClick={handleLogin}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: branding.colors.primary }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign in
            </button>

            <div className="mt-6 bg-gray-100 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Demo Credentials:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Admin:</strong> admin / admin123</div>
                <div><strong>User:</strong> manager / manager123</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            
            <div className="flex items-center space-x-6">
              <nav className="flex space-x-8">
                {['onboard', 'manage', 'branding', 'settings'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                    style={{ 
                      borderBottomColor: activeTab === tab ? branding.colors.primary : 'transparent',
                      color: activeTab === tab ? branding.colors.primary : '#6b7280'
                    }}>
                    {tab === 'onboard' ? 'Onboard Freelancer' : 
                     tab === 'manage' ? 'Manage Users' :
                     tab === 'branding' ? 'Branding' : 'API Settings'}
                  </button>
                ))}
              </nav>
              
              <div className="flex items-center space-x-4">
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setShowUserManagement(!showUserManagement)}
                    className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                    title="User Management"
                  >
                    <Shield size={20} />
                  </button>
                )}
                <div className="text-sm text-gray-600">
                  {currentUser?.username} ({currentUser?.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Modal */}
      {showUserManagement && currentUser?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              <button onClick={() => setShowUserManagement(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Add New User</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newAppUser.username}
                    onChange={(e) => setNewAppUser(prev => ({ ...prev, username: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newAppUser.password}
                    onChange={(e) => setNewAppUser(prev => ({ ...prev, password: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <select
                    value={newAppUser.role}
                    onChange={(e) => setNewAppUser(prev => ({ ...prev, role: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  onClick={addAppUser}
                  className="mt-3 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90"
                  style={{ backgroundColor: branding.colors.primary }}
                >
                  Add User
                </button>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Existing Users</h4>
                <div className="space-y-2">
                  {appUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{user.username}</div>
                        <div className="text-xs text-gray-500">
                          Role: {user.role} | Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      <button
                        onClick={() => removeAppUser(user.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove user"
                      >
                        <UserX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Select Platforms</label>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input id="platform-truenas" name="platform-truenas" type="checkbox" checked={formData.platforms.truenas} onChange={handleInputChange}
                          className="h-4 w-4 border-gray-300 rounded" style={{ accentColor: branding.colors.primary }} />
                      </div>
                      <div className="ml-3 text-sm flex-1">
                        <label htmlFor="platform-truenas" className="font-medium text-gray-700">TrueNAS SMB User</label>
                        <p className="text-gray-500">Create SMB user account for file server access</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input id="platform-parsec" name="platform-parsec" type="checkbox" checked={formData.platforms.parsec} onChange={handleInputChange}
                          className="h-4 w-4 border-gray-300 rounded" style={{ accentColor: branding.colors.primary }} />
                      </div>
                      <div className="ml-3 text-sm flex-1">
                        <label htmlFor="platform-parsec" className="font-medium text-gray-700">Parsec Teams User</label>
                        <p className="text-gray-500">Add user to Parsec Teams for remote desktop access</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input id="platform-iconik" name="platform-iconik" type="checkbox" checked={formData.platforms.iconik} onChange={handleInputChange}
                          className="h-4 w-4 border-gray-300 rounded" style={{ accentColor: branding.colors.primary }} />
                      </div>
                      <div className="ml-3 text-sm flex-1">
                        <label htmlFor="platform-iconik" className="font-medium text-gray-700">Iconik User</label>
                        <p className="text-gray-500">Create user account in Iconik media management</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input id="platform-lucidlink" name="platform-lucidlink" type="checkbox" checked={formData.platforms.lucidlink} onChange={handleInputChange}
                          className="h-4 w-4 border-gray-300 rounded" style={{ accentColor: branding.colors.primary }} />
                      </div>
                      <div className="ml-3 text-sm flex-1">
                        <label htmlFor="platform-lucidlink" className="font-medium text-gray-700">Lucidlink User</label>
                        <p className="text-gray-500">Create user account for cloud-native file system access</p>
                      </div>
                    </div>
                  </div>
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

        {activeTab === 'manage' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Manage Freelancers</h2>
              <p className="mt-1 text-sm text-gray-500">View and manage existing freelancer accounts across platforms</p>
            </div>
            <div className="px-6 py-6">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No freelancers</h3>
                  <p className="mt-1 text-sm text-gray-500">Start by onboarding your first team member.</p>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: branding.colors.primary }}>
                        <span className="text-sm font-medium text-white">{user.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="flex flex-wrap mt-1">
                          <PlatformBadge platform="truenas" config={user.platforms.truenas} userId={user.id} />
                          <PlatformBadge platform="parsec" config={user.platforms.parsec} userId={user.id} />
                          <PlatformBadge platform="iconik" config={user.platforms.iconik} userId={user.id} />
                          <PlatformBadge platform="lucidlink" config={user.platforms.lucidlink} userId={user.id} />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeUser(user.id)} className="hover:opacity-70" style={{ color: branding.colors.accent }}>
                      <UserX size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Branding & Customization</h2>
              <p className="mt-1 text-sm text-gray-500">Customize the appearance of your onboarding app with your company branding</p>
            </div>
            <div className="px-6 py-6 space-y-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input type="text" value={branding.companyName} onChange={(e) => handleBrandingChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" 
                      placeholder="Enter your company name" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                    <div className="flex items-center space-x-4">
                      {branding.logoUrl ? (
                        <div className="flex items-center space-x-3">
                          <img src={branding.logoUrl} alt="Logo preview" className="h-12 w-12 object-contain border border-gray-300 rounded" />
                          <button
                            onClick={removeLogo}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="h-12 w-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                          <Upload className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {branding.logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG (max 5MB)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Color Scheme</h3>
                  <button onClick={resetBranding}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <RotateCcw className="w-4 h-4 mr-1" />Reset
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value={branding.colors.primary} onChange={(e) => handleBrandingChange('colors.primary', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer" />
                      <input type="text" value={branding.colors.primary} onChange={(e) => handleBrandingChange('colors.primary', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Buttons, links, active states</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value={branding.colors.secondary} onChange={(e) => handleBrandingChange('colors.secondary', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer" />
                      <input type="text" value={branding.colors.secondary} onChange={(e) => handleBrandingChange('colors.secondary', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Success states, confirmations</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value={branding.colors.accent} onChange={(e) => handleBrandingChange('colors.accent', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer" />
                      <input type="text" value={branding.colors.accent} onChange={(e) => handleBrandingChange('colors.accent', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Warnings, delete actions</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Neutral Color</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value={branding.colors.neutral} onChange={(e) => handleBrandingChange('colors.neutral', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer" />
                      <input type="text" value={branding.colors.neutral} onChange={(e) => handleBrandingChange('colors.neutral', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Subtle text, borders</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Live Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-3">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="Logo Preview" className="h-6 w-6 object-contain" />
                    ) : (
                      <Users className="h-6 w-6" style={{ color: branding.colors.primary }} />
                    )}
                    <span className="font-medium text-gray-900">{branding.companyName}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 rounded text-sm text-white font-medium" style={{ backgroundColor: branding.colors.primary }}>
                      Primary Button
                    </button>
                    <button className="px-3 py-1 rounded text-sm text-white font-medium" style={{ backgroundColor: branding.colors.secondary }}>
                      Secondary Button
                    </button>
                    <button className="px-3 py-1 rounded text-sm text-white font-medium" style={{ backgroundColor: branding.colors.accent }}>
                      Accent Button
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" style={{ accentColor: branding.colors.primary }} checked readOnly />
                      <span className="text-sm">Checkbox with primary color</span>
                    </div>
                    <div>
                      <span className="text-sm" style={{ color: branding.colors.neutral }}>Sample neutral text color</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Branding Tips</h3>
                <div className="text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use your brand guidelines to maintain consistency</li>
                    <li>Ensure sufficient contrast for accessibility</li>
                    <li>Test colors in both light and dark environments</li>
                    <li>Consider how colors appear on different displays</li>
                  </ul>
                </div>
              </div>
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
              {currentUser?.role === 'admin' ? (
                <div className="space-y-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">Security Notice</h3>
                    <p className="text-sm text-yellow-700">
                      API credentials should be stored as environment variables in your deployment platform (Netlify, Vercel, etc.) for security.
                      Never commit these values to your source code repository.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">TrueNAS Configuration</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                        <input
                          type="text"
                          value={apiSettings.truenasUrl}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, truenasUrl: e.target.value }))}
                          placeholder="https://your-truenas-server.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input
                          type="password"
                          value={apiSettings.truenasKey}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, truenasKey: e.target.value }))}
                          placeholder="Enter API key"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Parsec Teams Configuration</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input
                          type="password"
                          value={apiSettings.parsecKey}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, parsecKey: e.target.value }))}
                          placeholder="Enter API key"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID</label>
                        <input
                          type="text"
                          value={apiSettings.parsecOrgId}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, parsecOrgId: e.target.value }))}
                          placeholder="Enter organization ID"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Iconik Configuration</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                        <input
                          type="text"
                          value={apiSettings.iconikUrl}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, iconikUrl: e.target.value }))}
                          placeholder="https://app.iconik.io"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input
                          type="password"
                          value={apiSettings.iconikKey}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, iconikKey: e.target.value }))}
                          placeholder="Enter API key"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
                        <input
                          type="text"
                          value={apiSettings.iconikAppId}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, iconikAppId: e.target.value }))}
                          placeholder="Enter app ID"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Lucidlink Configuration</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input
                          type="password"
                          value={apiSettings.lucidlinkKey}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, lucidlinkKey: e.target.value }))}
                          placeholder="Enter API key"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID</label>
                        <input
                          type="text"
                          value={apiSettings.lucidlinkOrgId}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, lucidlinkOrgId: e.target.value }))}
                          placeholder="Enter organization ID"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Debugging Tips</h3>
                    <div className="text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Open browser Developer Tools (F12) to view console logs</li>
                        <li>Console will show detailed API requests when creating users</li>
                        <li>Check the Console tab for detailed logs when adding freelancers</li>
                        <li>Ensure your API keys have the correct permissions for user creation</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                      className="px-6 py-2 text-sm font-medium text-white rounded-md hover:opacity-90"
                      style={{ backgroundColor: branding.colors.primary }}
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Key className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
                  <p className="mt-1 text-sm text-gray-500">Only administrators can access API settings.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerOnboardingApp;