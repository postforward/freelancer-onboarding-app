import React, { useState } from 'react';

export const InputTest: React.FC = () => {
  const [testValue, setTestValue] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('Input changed:', newValue);
    setTestValue(newValue);
    setDebugInfo(`Changed to: "${newValue}" at ${new Date().toLocaleTimeString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key);
  };

  const handleFocus = () => {
    console.log('Input focused');
  };

  const handleClick = (e: React.MouseEvent) => {
    console.log('Input clicked');
    e.stopPropagation();
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
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onClick={handleClick}
            placeholder="Type something here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ pointerEvents: 'auto' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Select:
          </label>
          <select
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select an option</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
          </select>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={checkboxValue}
              onChange={(e) => setCheckboxValue(e.target.checked)}
              className="mr-2"
            />
            Test Checkbox
          </label>
        </div>
        
        <div className="text-sm text-gray-600">
          <strong>Current Value:</strong> "{testValue}"<br/>
          <strong>Select Value:</strong> "{selectValue}"<br/>
          <strong>Checkbox:</strong> {checkboxValue ? 'Checked' : 'Unchecked'}
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