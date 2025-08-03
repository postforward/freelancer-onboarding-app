import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your freelancer onboarding system</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">Total Freelancers</h3>
          <p className="text-3xl font-bold text-blue-600">-</p>
          <p className="text-sm text-gray-500">Placeholder data</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">Active Platforms</h3>
          <p className="text-3xl font-bold text-green-600">-</p>
          <p className="text-sm text-gray-500">Placeholder data</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">Pending Onboarding</h3>
          <p className="text-3xl font-bold text-yellow-600">-</p>
          <p className="text-sm text-gray-500">Placeholder data</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">Failed Connections</h3>
          <p className="text-3xl font-bold text-red-600">-</p>
          <p className="text-sm text-gray-500">Placeholder data</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-600">Dashboard page - placeholder component</p>
        <p className="text-sm text-gray-500 mt-2">
          This will show recent freelancer onboarding activities, platform connections, and system status.
        </p>
      </div>
    </div>
  );
};