import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Onboard } from './pages/Onboard';
import { FreelancerManagement } from './pages/FreelancerManagement';
import { PlatformManagement } from './pages/PlatformManagement';
import { Settings } from './pages/Settings';
import { Branding } from './pages/Branding';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />
          },
          {
            path: 'dashboard',
            element: <Dashboard />
          },
          {
            path: 'onboard',
            element: <Onboard />
          },
          {
            path: 'manage',
            element: <FreelancerManagement />
          },
          {
            path: 'platforms',
            element: <PlatformManagement />
          },
          {
            path: 'settings',
            element: <Settings />
          },
          {
            path: 'branding',
            element: <Branding />
          }
        ]
      }
    ]
  }
]);