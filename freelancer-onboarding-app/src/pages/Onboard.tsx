import React from 'react';

export const Onboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Onboard Freelancer</h1>
        <p className="text-gray-600">Create a new freelancer and configure their platform access</p>
      </div>
      
      <div className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Freelancer Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input 
                type="text" 
                placeholder="Enter freelancer's full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input 
                type="email" 
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input 
                type="tel" 
                placeholder="Enter phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Platforms
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" disabled />
                  <span className="text-gray-600">Amove</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" disabled />
                  <span className="text-gray-600">Upwork</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" disabled />
                  <span className="text-gray-600">Fiverr</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Onboard page - placeholder component</p>
            <p className="text-sm text-gray-500 mb-4">
              This form will collect freelancer information and automatically create accounts across selected platforms.
            </p>
            <button 
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              disabled
            >
              Start Onboarding Process
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};