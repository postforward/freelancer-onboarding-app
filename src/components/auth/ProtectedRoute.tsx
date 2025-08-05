import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { Loader2 } from 'lucide-react';
import { OrganizationSelector } from './OrganizationSelector';
import type { User } from '../../types/database.types';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRoles?: User['role'][];
  requireOrganization?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles,
  requireOrganization = true 
}) => {
  const { authUser, dbUser, loading: authLoading, hasRole, error: authError } = useAuth();
  const { organization, loading: tenantLoading, error: tenantError } = useTenant();
  const location = useLocation();
  
  console.log('🔄 ProtectedRoute: Auth loading:', authLoading, 'Tenant loading:', tenantLoading);
  console.log('🔄 ProtectedRoute: Auth user:', !!authUser, 'DB user:', !!dbUser, 'Organization:', !!organization);
  console.log('🔄 ProtectedRoute: Auth error:', authError, 'Tenant error:', tenantError);
  
  // Show loading spinner while checking auth (but not indefinitely)
  if (authLoading) {
    console.log('🔄 ProtectedRoute: Showing auth loading spinner');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }
  
  // Not authenticated - redirect to login
  if (!authUser) {
    console.log('🔄 ProtectedRoute: No auth user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Auth user exists but no database user - show error page instead of redirect loop
  if (!dbUser) {
    console.log('🔄 ProtectedRoute: Auth user exists but no DB user, showing error page');
    if (authError) {
      console.error('❌ ProtectedRoute: Auth error detected:', authError);
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Account Setup Required</h2>
              <p className="mt-2 text-gray-600">
                {authError || 'Your user profile needs to be set up in the database.'}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Please contact support to complete your account setup.
              </p>
              <div className="mt-4 space-x-2">
                <button
                  onClick={() => {
                    // Sign out and redirect to login
                    window.location.href = '/login';
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign Out
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If tenant is loading but we have auth, show different loading state
  if (tenantLoading && requireOrganization) {
    console.log('🔄 ProtectedRoute: Showing tenant loading spinner');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading organization data...</p>
        </div>
      </div>
    );
  }
  
  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasRole(requiredRoles)) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                <p className="mt-2 text-gray-600">
                  You don't have permission to access this page.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
  
  // Check if organization is required and not set
  if (requireOrganization && !organization) {
    // If there's a tenant error, show error message instead of selector
    if (tenantError) {
      console.error('❌ ProtectedRoute: Tenant error, showing error page');
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Setup Required</h2>
                <p className="mt-2 text-gray-600">
                  {tenantError}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  It looks like your user profile needs to be set up. Please contact support or try signing up again.
                </p>
                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return <OrganizationSelector />;
  }
  
  // All checks passed - render children or outlet
  return children ? <>{children}</> : <Outlet />;
};

// Convenience wrapper for admin-only routes
export const AdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requiredRoles={['admin', 'owner']}>
      {children}
    </ProtectedRoute>
  );
};

// Convenience wrapper for owner-only routes
export const OwnerRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requiredRoles={['owner']}>
      {children}
    </ProtectedRoute>
  );
};