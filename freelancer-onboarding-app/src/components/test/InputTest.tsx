import React, { useState } from 'react';

export const InputTest: React.FC = () => {
  const [testValue, setTestValue] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('Input changed:', newValue);
    setTestValue(newValue);
    setDebugInfo(`Changed to: "${newValue}" at ${new Date().toLocaleTimeString()}`);
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">Input Test Component</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Input Field:
          </label>
          <input
            type="text"
            value={testValue}
            onChange={handleChange}
            placeholder="Type something here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="text-sm text-gray-600">
          <strong>Current Value:</strong> "{testValue}"
        </div>
        
        <div className="text-sm text-blue-600">
          <strong>Debug:</strong> {debugInfo || 'No changes yet'}
        </div>
        
        <button
          onClick={() => {
            setTestValue('Test Value');
            setDebugInfo('Set programmatically');
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Set Test Value
        </button>
      </div>
    </div>
  );
};