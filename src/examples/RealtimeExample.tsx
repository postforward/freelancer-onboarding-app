import React, { useEffect, useState } from 'react';
import { useFreelancerUpdates, useFreelancerPlatformUpdates } from '../hooks/useRealtimeSubscription';
import { useTenant } from '../contexts/TenantContext';
import { debugLog } from '../config/environment';
import type { Freelancer, FreelancerPlatform } from '../types/database.types';

/**
 * Example component demonstrating real-time subscription usage
 * This shows how to integrate real-time updates in your components
 */
export function RealtimeFreelancerDashboard() {
  const { currentTenant } = useTenant();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string | null>(null);
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, FreelancerPlatform[]>>({});

  // Subscribe to freelancer updates for the current organization
  useFreelancerUpdates(currentTenant?.id || '', {
    onInsert: (newFreelancer) => {
      debugLog('New freelancer added:', newFreelancer);
      setFreelancers((prev) => [...prev, newFreelancer]);
      
      // Show notification
      showNotification(`New freelancer ${newFreelancer.first_name} ${newFreelancer.last_name} added`);
    },
    onUpdate: (updatedFreelancer) => {
      debugLog('Freelancer updated:', updatedFreelancer);
      setFreelancers((prev) =>
        prev.map((f) => (f.id === updatedFreelancer.id ? updatedFreelancer : f))
      );
      
      // Show notification
      showNotification(`Freelancer ${updatedFreelancer.first_name} ${updatedFreelancer.last_name} updated`);
    },
    onDelete: (deletedFreelancer) => {
      debugLog('Freelancer deleted:', deletedFreelancer);
      setFreelancers((prev) => prev.filter((f) => f.id !== deletedFreelancer.id));
      
      // Show notification
      showNotification(`Freelancer removed`);
    },
  });

  // Subscribe to platform status updates for selected freelancer
  useFreelancerPlatformUpdates(selectedFreelancerId, (updatedPlatform) => {
    debugLog('Platform status updated:', updatedPlatform);
    setPlatformStatuses((prev) => ({
      ...prev,
      [updatedPlatform.freelancer_id]: prev[updatedPlatform.freelancer_id]?.map((p) =>
        p.id === updatedPlatform.id ? updatedPlatform : p
      ) || [updatedPlatform],
    }));

    // Show notification
    showNotification(`Platform ${updatedPlatform.platform_id} status: ${updatedPlatform.status}`);
  });

  // Load initial data
  useEffect(() => {
    loadFreelancers();
  }, [currentTenant?.id]);

  const loadFreelancers = async () => {
    // Implementation would load freelancers from database
    // This is just an example
  };

  const showNotification = (message: string) => {
    // Implementation would show a toast notification
    console.log('🔔 Real-time update:', message);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Real-time Freelancer Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Freelancer List */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Freelancers (Live Updates)</h3>
          <div className="space-y-2">
            {freelancers.map((freelancer) => (
              <div
                key={freelancer.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedFreelancerId === freelancer.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedFreelancerId(freelancer.id)}
              >
                <div className="font-medium">
                  {freelancer.first_name} {freelancer.last_name}
                </div>
                <div className="text-sm text-gray-500">{freelancer.email}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Status: {freelancer.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Statuses */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Platform Statuses (Live Updates)</h3>
          {selectedFreelancerId && platformStatuses[selectedFreelancerId] ? (
            <div className="space-y-2">
              {platformStatuses[selectedFreelancerId].map((platform) => (
                <div key={platform.id} className="p-3 border border-gray-200 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{platform.platform_id}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        platform.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : platform.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {platform.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    User ID: {platform.platform_user_id}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Select a freelancer to view platform statuses</p>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h4 className="font-semibold mb-2">Real-time Connection Status</h4>
        <p className="text-sm text-gray-600">
          Real-time updates are active. Changes to freelancers and platform statuses
          will appear automatically without refreshing the page.
        </p>
      </div>
    </div>
  );
}

/**
 * Example of how to integrate real-time in existing components
 * 
 * 1. Import the hooks:
 *    import { useFreelancerUpdates, useFreelancerPlatformUpdates } from '../hooks/useRealtimeSubscription';
 * 
 * 2. Use in your component:
 *    useFreelancerUpdates(organizationId, {
 *      onInsert: (freelancer) => { // handle new freelancer },
 *      onUpdate: (freelancer) => { // handle updated freelancer },
 *      onDelete: (freelancer) => { // handle deleted freelancer }
 *    });
 * 
 * 3. The subscription will automatically:
 *    - Connect when component mounts
 *    - Reconnect on connection loss
 *    - Clean up when component unmounts
 *    - Only work when using real Supabase (not mock mode)
 */