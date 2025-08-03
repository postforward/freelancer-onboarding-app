import React from 'react';
import { useToast, Toast as ToastType } from '../../contexts/ToastContext';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast: React.FC<{ toast: ToastType; onRemove: () => void }> = ({ toast, onRemove }) => {
  const iconMap = {
    success: <CheckCircle className="h-5 w-5 text-green-400" />,
    error: <XCircle className="h-5 w-5 text-red-400" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-400" />,
    info: <Info className="h-5 w-5 text-blue-400" />,
  };
  
  const bgColorMap = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50',
  };
  
  const textColorMap = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };
  
  return (
    <div
      className={`max-w-sm w-full ${bgColorMap[toast.type]} shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{iconMap[toast.type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${textColorMap[toast.type]}`}>
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`bg-transparent rounded-md inline-flex ${textColorMap[toast.type]} hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              onClick={onRemove}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  
  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};