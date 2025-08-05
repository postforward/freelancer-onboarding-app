import React, { useState, useEffect } from 'react';
import { useBranding } from '../contexts/BrandingContext';

export const Branding: React.FC = () => {
  const { branding: globalBranding, updateBranding, resetBranding } = useBranding();
  const [branding, setBranding] = useState({
    companyName: '',
    tagline: '',
    logoFile: null as File | null,
    logoPreview: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    primaryFont: 'Inter',
    headingFont: 'Inter',
    fontSizeScale: 'Medium',
    themeMode: 'auto',
    enableRoundedCorners: true,
    enableShadows: true
  });

  const handleInputChange = (field: string, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleBooleanChange = (field: string, value: boolean) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleColorChange = (field: string, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      setBranding(prev => ({
        ...prev,
        logoFile: file,
        logoPreview: previewUrl
      }));
      
      console.log('Image uploaded:', file.name, file.size, file.type);
    }
  };

  // Sync local state with global branding context
  useEffect(() => {
    setBranding(prev => ({
      ...prev,
      companyName: globalBranding.companyName,
      tagline: globalBranding.tagline,
      logoPreview: globalBranding.logoUrl,
      primaryColor: globalBranding.primaryColor,
      secondaryColor: globalBranding.secondaryColor,
      accentColor: globalBranding.accentColor,
      primaryFont: globalBranding.primaryFont,
      headingFont: globalBranding.headingFont,
      fontSizeScale: globalBranding.fontSizeScale,
      themeMode: globalBranding.themeMode,
      enableRoundedCorners: globalBranding.enableRoundedCorners,
      enableShadows: globalBranding.enableShadows
    }));
  }, [globalBranding]);

  const saveBrandingSettings = () => {
    // Save to localStorage (excluding file object)
    const settingsToSave = {
      ...branding,
      logoFile: null, // Don't save file object
      // Keep logoPreview for display but note it won't persist across sessions
    };
    
    localStorage.setItem('branding-settings', JSON.stringify(settingsToSave));
    console.log('Branding settings saved to localStorage');
  };

  const handleApplyChanges = () => {
    console.log('Branding applied:', branding);
    
    // Update global branding context
    updateBranding({
      companyName: branding.companyName,
      tagline: branding.tagline,
      logoUrl: branding.logoPreview, // Use preview URL as the logo URL
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      primaryFont: branding.primaryFont,
      headingFont: branding.headingFont,
      fontSizeScale: branding.fontSizeScale,
      themeMode: branding.themeMode,
      enableRoundedCorners: branding.enableRoundedCorners,
      enableShadows: branding.enableShadows
    });
    
    alert('Branding changes applied and saved successfully!\n\nSettings are now active across the entire application and will persist across page reloads.');
  };

  const handleReset = () => {
    // Cleanup any existing preview URL
    if (branding.logoPreview) {
      URL.revokeObjectURL(branding.logoPreview);
    }
    
    // Reset global branding context
    resetBranding();
    
    // Reset local state
    setBranding({
      companyName: '',
      tagline: '',
      logoFile: null,
      logoPreview: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B',
      primaryFont: 'Inter',
      headingFont: 'Inter',
      fontSizeScale: 'Medium',
      themeMode: 'auto',
      enableRoundedCorners: true,
      enableShadows: true
    });
    
    console.log('Branding settings reset to defaults');
    alert('Branding reset to defaults!');
  };

  const handlePreview = () => {
    console.log('Preview branding:', branding);
    
    // Temporarily apply styles for preview
    const root = document.documentElement;
    const originalPrimary = root.style.getPropertyValue('--primary-color');
    const originalSecondary = root.style.getPropertyValue('--secondary-color');
    const originalAccent = root.style.getPropertyValue('--accent-color');
    const originalTitle = document.title;
    const originalBodyFont = document.body.style.fontFamily;
    const originalBodyFontSize = document.body.style.fontSize;
    
    // Store original heading fonts
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const originalHeadingFonts = Array.from(headings).map(h => (h as HTMLElement).style.fontFamily);
    
    // Store original border radius and shadows
    const elements = document.querySelectorAll('button, input, select, textarea, .rounded, .rounded-md, .rounded-lg');
    const shadowElements = document.querySelectorAll('.shadow, .shadow-md, .shadow-lg, .shadow-sm');
    const originalBorderRadius = Array.from(elements).map(el => (el as HTMLElement).style.borderRadius);
    const originalShadows = Array.from(shadowElements).map(el => (el as HTMLElement).style.boxShadow);
    
    // Apply preview styles (colors)
    root.style.setProperty('--primary-color', branding.primaryColor);
    root.style.setProperty('--secondary-color', branding.secondaryColor);
    root.style.setProperty('--accent-color', branding.accentColor);
    
    // Apply fonts
    if (branding.primaryFont) {
      document.body.style.fontFamily = `"${branding.primaryFont}", system-ui, -apple-system, sans-serif`;
    }
    if (branding.headingFont) {
      headings.forEach((heading) => {
        (heading as HTMLElement).style.fontFamily = `"${branding.headingFont}", system-ui, -apple-system, sans-serif`;
      });
    }
    
    // Apply font size scale
    if (branding.fontSizeScale) {
      const scales = { Small: '0.9', Medium: '1.0', Large: '1.1' };
      const scale = scales[branding.fontSizeScale as keyof typeof scales] || '1.0';
      document.body.style.fontSize = `calc(1rem * ${scale})`;
    }
    
    // Apply rounded corners
    const borderRadius = branding.enableRoundedCorners ? '0.375rem' : '0px';
    elements.forEach((element) => {
      (element as HTMLElement).style.borderRadius = borderRadius;
    });
    
    // Apply shadows
    const boxShadow = branding.enableShadows 
      ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' 
      : 'none';
    shadowElements.forEach((element) => {
      (element as HTMLElement).style.boxShadow = boxShadow;
    });
    
    if (branding.companyName) {
      document.title = `${branding.companyName} - Freelancer Onboarding`;
    }
    
    alert('Preview applied! Check the page colors, fonts, shadows, and rounded corners. Click OK to revert.');
    
    // Revert after alert
    if (originalPrimary) root.style.setProperty('--primary-color', originalPrimary);
    else root.style.removeProperty('--primary-color');
    
    if (originalSecondary) root.style.setProperty('--secondary-color', originalSecondary);
    else root.style.removeProperty('--secondary-color');
    
    if (originalAccent) root.style.setProperty('--accent-color', originalAccent);
    else root.style.removeProperty('--accent-color');
    
    // Revert fonts
    document.body.style.fontFamily = originalBodyFont;
    document.body.style.fontSize = originalBodyFontSize;
    headings.forEach((heading, index) => {
      (heading as HTMLElement).style.fontFamily = originalHeadingFonts[index];
    });
    
    // Revert border radius and shadows
    elements.forEach((element, index) => {
      (element as HTMLElement).style.borderRadius = originalBorderRadius[index];
    });
    shadowElements.forEach((element, index) => {
      (element as HTMLElement).style.boxShadow = originalShadows[index];
    });
    
    document.title = originalTitle;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Branding</h1>
        <p className="text-gray-600">Customize your application's branding and appearance</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo & Identity</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  {branding.logoPreview ? (
                    <div className="space-y-2">
                      <img 
                        src={branding.logoPreview} 
                        alt="Logo preview" 
                        className="mx-auto h-20 w-20 object-contain rounded-md border border-gray-200"
                      />
                      <p className="text-sm text-gray-600">Click to change logo</p>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">Click to upload logo</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input 
                type="text" 
                value={branding.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Enter company name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tagline
              </label>
              <input 
                type="text" 
                value={branding.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="Enter company tagline"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Color Scheme</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center space-x-3">
                <input 
                  type="color" 
                  value={branding.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={branding.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center space-x-3">
                <input 
                  type="color" 
                  value={branding.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={branding.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent Color
              </label>
              <div className="flex items-center space-x-3">
                <input 
                  type="color" 
                  value={branding.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input 
                  type="text" 
                  value={branding.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Typography</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Font
              </label>
              <select 
                value={branding.primaryFont}
                onChange={(e) => handleInputChange('primaryFont', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heading Font
              </label>
              <select 
                value={branding.headingFont}
                onChange={(e) => handleInputChange('headingFont', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inter">Inter</option>
                <option value="Poppins">Poppins</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Source Sans Pro">Source Sans Pro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size Scale
              </label>
              <select 
                value={branding.fontSizeScale}
                onChange={(e) => handleInputChange('fontSizeScale', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Theme Options</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme Mode
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="theme" 
                    className="mr-2" 
                    value="light"
                    checked={branding.themeMode === 'light'}
                    onChange={(e) => handleInputChange('themeMode', e.target.value)}
                  />
                  <span className="text-gray-700">Light Mode</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="theme" 
                    className="mr-2" 
                    value="dark"
                    checked={branding.themeMode === 'dark'}
                    onChange={(e) => handleInputChange('themeMode', e.target.value)}
                  />
                  <span className="text-gray-700">Dark Mode</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="theme" 
                    className="mr-2" 
                    value="auto"
                    checked={branding.themeMode === 'auto'}
                    onChange={(e) => handleInputChange('themeMode', e.target.value)}
                  />
                  <span className="text-gray-700">Auto (System)</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="mr-3" 
                  checked={branding.enableRoundedCorners}
                  onChange={(e) => handleBooleanChange('enableRoundedCorners', e.target.checked)}
                />
                <span className="text-gray-700">Enable rounded corners</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="mr-3" 
                  checked={branding.enableShadows}
                  onChange={(e) => handleBooleanChange('enableShadows', e.target.checked)}
                />
                <span className="text-gray-700">Enable shadows</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
        <p className="text-gray-600 mb-4">Live preview of your branding changes</p>
        
        {/* Live Preview Section */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium mb-4">Preview Components</h3>
          
          <div className="space-y-4">
            {/* Color Preview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div 
                  className="w-full h-20 rounded-md mb-2 flex items-center justify-center"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  <span className="text-white font-medium">Primary</span>
                </div>
                <p className="text-xs text-gray-500">{branding.primaryColor}</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-full h-20 rounded-md mb-2 flex items-center justify-center"
                  style={{ backgroundColor: branding.secondaryColor }}
                >
                  <span className="text-white font-medium">Secondary</span>
                </div>
                <p className="text-xs text-gray-500">{branding.secondaryColor}</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-full h-20 rounded-md mb-2 flex items-center justify-center"
                  style={{ backgroundColor: branding.accentColor }}
                >
                  <span className="text-white font-medium">Accent</span>
                </div>
                <p className="text-xs text-gray-500">{branding.accentColor}</p>
              </div>
            </div>
            
            {/* Button Preview */}
            <div className="flex space-x-4">
              <button 
                className="px-4 py-2 text-white font-medium shadow-md"
                style={{ 
                  backgroundColor: branding.primaryColor,
                  borderRadius: branding.enableRoundedCorners ? '0.375rem' : '0px',
                  boxShadow: branding.enableShadows ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' : 'none',
                  fontFamily: `"${branding.primaryFont}", system-ui, -apple-system, sans-serif`
                }}
              >
                Primary Button
              </button>
              <button 
                className="px-4 py-2 text-white font-medium shadow-md"
                style={{ 
                  backgroundColor: branding.secondaryColor,
                  borderRadius: branding.enableRoundedCorners ? '0.375rem' : '0px',
                  boxShadow: branding.enableShadows ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' : 'none',
                  fontFamily: `"${branding.primaryFont}", system-ui, -apple-system, sans-serif`
                }}
              >
                Secondary Button
              </button>
              <button 
                className="px-4 py-2 text-white font-medium shadow-md"
                style={{ 
                  backgroundColor: branding.accentColor,
                  borderRadius: branding.enableRoundedCorners ? '0.375rem' : '0px',
                  boxShadow: branding.enableShadows ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' : 'none',
                  fontFamily: `"${branding.primaryFont}", system-ui, -apple-system, sans-serif`
                }}
              >
                Accent Button
              </button>
            </div>
            
            {/* Typography Preview */}
            <div className="border-t pt-4">
              <h4 
                className="text-lg font-semibold mb-2" 
                style={{ 
                  color: branding.primaryColor,
                  fontFamily: `"${branding.headingFont}", system-ui, -apple-system, sans-serif`,
                  fontSize: branding.fontSizeScale === 'Small' ? '1.08rem' : branding.fontSizeScale === 'Large' ? '1.32rem' : '1.2rem'
                }}
              >
                Typography Preview
              </h4>
              <p 
                className="text-gray-600"
                style={{ 
                  fontFamily: `"${branding.primaryFont}", system-ui, -apple-system, sans-serif`,
                  fontSize: branding.fontSizeScale === 'Small' ? '0.9rem' : branding.fontSizeScale === 'Large' ? '1.1rem' : '1rem'
                }}
              >
                This is how your body text will appear with the selected primary font "{branding.primaryFont}" and "{branding.fontSizeScale}" size scale.
              </p>
            </div>
            
            {/* Form Elements Preview */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Form Elements:</p>
              <div className="flex space-x-4">
                <input 
                  type="text" 
                  placeholder="Input field"
                  className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2"
                  style={{ 
                    borderRadius: branding.enableRoundedCorners ? '0.375rem' : '0px',
                    boxShadow: branding.enableShadows ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
                    fontFamily: `"${branding.primaryFont}", system-ui, -apple-system, sans-serif`,
                    fontSize: branding.fontSizeScale === 'Small' ? '0.875rem' : branding.fontSizeScale === 'Large' ? '1.05rem' : '1rem'
                  }}
                />
                <select 
                  className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2"
                  style={{ 
                    borderRadius: branding.enableRoundedCorners ? '0.375rem' : '0px',
                    boxShadow: branding.enableShadows ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
                    fontFamily: `"${branding.primaryFont}", system-ui, -apple-system, sans-serif`,
                    fontSize: branding.fontSizeScale === 'Small' ? '0.875rem' : branding.fontSizeScale === 'Large' ? '1.05rem' : '1rem'
                  }}
                >
                  <option>Select option</option>
                </select>
              </div>
            </div>
            
            {/* Company Name Preview */}
            {branding.companyName && (
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold" style={{ color: branding.primaryColor }}>
                  {branding.companyName}
                </h4>
                {branding.tagline && (
                  <p className="text-gray-600">{branding.tagline}</p>
                )}
              </div>
            )}
            
            {/* Logo Preview */}
            {branding.logoPreview && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Logo Preview:</p>
                <img 
                  src={branding.logoPreview} 
                  alt="Logo preview" 
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={handleApplyChanges}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Apply Changes
          </button>
          <button 
            onClick={handleReset}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
          >
            Reset to Default
          </button>
          <button 
            onClick={handlePreview}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
          >
            Preview Changes
          </button>
        </div>
      </div>
    </div>
  );
};