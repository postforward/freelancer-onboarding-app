import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  
  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
    />
  );
};

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center">
        <LoadingSpinner size="lg" className="text-indigo-600" />
        <p className="mt-3 text-sm text-gray-700">{message}</p>
      </div>
    </div>
  );
};

interface LoadingPageProps {
  message?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-indigo-600 mx-auto" />
        <p className="mt-3 text-sm text-gray-700">{message}</p>
      </div>
    </div>
  );
};

interface LoadingCardProps {
  lines?: number;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ lines = 3 }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 rounded w-full mb-2"></div>
      ))}
    </div>
  );
};

interface LoadingListProps {
  items?: number;
}

export const LoadingList: React.FC<LoadingListProps> = ({ items = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <LoadingCard key={i} lines={2} />
      ))}
    </div>
  );
};