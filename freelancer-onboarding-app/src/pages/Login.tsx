import React from 'react';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-center text-gray-600">
            Login page - placeholder component
          </p>
          <div className="mt-4">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};