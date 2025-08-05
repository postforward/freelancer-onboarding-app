
import { FreelancerProvider } from '../contexts/FreelancerContext';
import { PlatformProvider } from '../contexts/PlatformContext';
import { FreelancerManagementDashboard } from '../components/freelancers';

export function FreelancerManagement() {
  return (
    <PlatformProvider>
      <FreelancerProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FreelancerManagementDashboard />
            </div>
          </div>
        </div>
      </FreelancerProvider>
    </PlatformProvider>
  );
}