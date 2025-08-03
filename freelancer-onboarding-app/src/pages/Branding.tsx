import React from 'react';

export const Branding: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Branding</h1>
        <p className="text-gray-600">Customize your application's branding and appearance</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo & Identity</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <div className="text-gray-400">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">Click to upload logo</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input 
                type="text" 
                placeholder="Enter company name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tagline
              </label>
              <input 
                type="text" 
                placeholder="Enter company tagline"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Color Scheme</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center space-x-3">
                <input 
                  type="color" 
                  value="#3B82F6"
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                  disabled
                />
                <input 
                  type="text" 
                  value="#3B82F6"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center space-x-3">
                <input 
                  type="color" 
                  value="#10B981"
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                  disabled
                />
                <input 
                  type="text" 
                  value="#10B981"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent Color
              </label>
              <div className="flex items-center space-x-3">
                <input 
                  type="color" 
                  value="#F59E0B"
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                  disabled
                />
                <input 
                  type="text" 
                  value="#F59E0B"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Typography</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Font
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled>
                <option>Inter</option>
                <option>Roboto</option>
                <option>Open Sans</option>
                <option>Lato</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heading Font
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled>
                <option>Inter</option>
                <option>Poppins</option>
                <option>Montserrat</option>
                <option>Source Sans Pro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size Scale
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled>
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Theme Options</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme Mode
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="radio" name="theme" className="mr-2" disabled />
                  <span className="text-gray-700">Light Mode</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="theme" className="mr-2" disabled />
                  <span className="text-gray-700">Dark Mode</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="theme" className="mr-2" checked disabled />
                  <span className="text-gray-700">Auto (System)</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" disabled />
                <span className="text-gray-700">Enable rounded corners</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" disabled />
                <span className="text-gray-700">Enable shadows</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
        <p className="text-gray-600 mb-4">Branding page - placeholder component</p>
        <p className="text-sm text-gray-500 mb-6">
          Customize your application's logo, colors, typography, and theme. Changes will be applied across the entire application.
        </p>
        
        <div className="flex space-x-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled>
            Apply Changes
          </button>
          <button className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400" disabled>
            Reset to Default
          </button>
          <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 disabled:bg-gray-100" disabled>
            Preview Changes
          </button>
        </div>
      </div>
    </div>
  );
};