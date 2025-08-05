import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { ToastContainer } from '../feedback/ToastContainer';
import { useTenant } from '../../contexts/TenantContext';
import { useBranding } from '../../contexts/BrandingContext';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { organization } = useTenant();
  const { branding } = useBranding();

  // Update page title based on organization/branding
  useEffect(() => {
    const title = branding.companyName || organization?.name || 'Freelancer Hub';
    document.title = title;
  }, [organization, branding]);
  
  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation 
        onMenuToggle={handleMenuToggle} 
        isMobileMenuOpen={isMobileMenuOpen} 
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Organization Context */}
        {organization && (
          <div className="mb-6">
            <div className="bg-white shadow-sm rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {organization.name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {organization.subdomain}.your-domain.com
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    organization.subscription_tier === 'enterprise' 
                      ? 'bg-purple-100 text-purple-800'
                      : organization.subscription_tier === 'pro'
                      ? 'bg-blue-100 text-blue-800'
                      : organization.subscription_tier === 'starter'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {organization.subscription_tier}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Page Content */}
        <Outlet />
      </main>
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};