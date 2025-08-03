import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { TenantProvider } from './contexts/TenantContext';
import { DevPanel } from './components/dev/DevPanel';
import { router } from './router';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <TenantProvider>
          <RouterProvider router={router} />
          <DevPanel />
        </TenantProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;