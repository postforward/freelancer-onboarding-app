import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { TenantProvider } from './contexts/TenantContext';
import { PlatformProvider } from './contexts/PlatformContext';
import { FreelancerProvider } from './contexts/FreelancerContext';
import { BrandingProvider } from './contexts/BrandingContext';
import { DevPanel } from './components/dev/DevPanel';
import { router } from './router';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrandingProvider>
          <TenantProvider>
            <PlatformProvider>
              <FreelancerProvider>
                <RouterProvider router={router} />
                <DevPanel />
              </FreelancerProvider>
            </PlatformProvider>
          </TenantProvider>
        </BrandingProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;