import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Convenience hooks for specific toast types
export const useSuccessToast = () => {
  const { showToast } = useToast();
  return useCallback((title: string, message?: string, duration?: number) => {
    showToast({ type: 'success', title, message, duration });
  }, [showToast]);
};

export const useErrorToast = () => {
  const { showToast } = useToast();
  return useCallback((title: string, message?: string, duration?: number) => {
    showToast({ type: 'error', title, message, duration });
  }, [showToast]);
};

export const useWarningToast = () => {
  const { showToast } = useToast();
  return useCallback((title: string, message?: string, duration?: number) => {
    showToast({ type: 'warning', title, message, duration });
  }, [showToast]);
};

export const useInfoToast = () => {
  const { showToast } = useToast();
  return useCallback((title: string, message?: string, duration?: number) => {
    showToast({ type: 'info', title, message, duration });
  }, [showToast]);
};