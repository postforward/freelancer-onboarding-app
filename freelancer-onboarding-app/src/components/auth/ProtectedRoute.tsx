import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { Loader2 } from 'lucide-react';
import { OrganizationSelector } from './OrganizationSelector';
import { User } from '../../types/database.types';

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
  const { authUser, dbUser, loading: authLoading, hasRole } = useAuth();
  const { organization, loading: tenantLoading } = useTenant();
  const location = useLocation();
  
  // Show loading spinner while checking auth
  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }
  
  // Not authenticated - redirect to login
  if (!authUser || !dbUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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