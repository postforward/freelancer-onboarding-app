import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

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
  showToast: (messageOrToast: string | Omit<Toast, 'id'>, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounterRef = useRef(0);
  
  const showToast = useCallback((messageOrToast: string | Omit<Toast, 'id'>, type?: ToastType) => {
    // Handle both calling patterns: showToast(message, type) and showToast({type, title, message})
    let toastData: Omit<Toast, 'id'>;
    
    if (typeof messageOrToast === 'string') {
      // Simple format: showToast(message, type)
      if (!type) {
        console.warn('Toast type is required when using string message format');
        return;
      }
      toastData = {
        type,
        title: messageOrToast,
        duration: 5000
      };
    } else {
      // Object format: showToast({type, title, message})
      toastData = messageOrToast;
    }
    
    // Generate unique ID using multiple strategies for maximum uniqueness
    let id: string;
    
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      // Use crypto.randomUUID() if available (most robust)
      id = `toast-${crypto.randomUUID()}`;
    } else {
      // Fallback: combine timestamp with incremented counter
      const timestamp = Date.now();
      const counter = ++idCounterRef.current;
      const random = Math.random().toString(36).substr(2, 9);
      id = `toast-${timestamp}-${counter}-${random}`;
    }
    
    const newToast: Toast = {
      ...toastData,
      id,
      duration: toastData.duration ?? 5000,
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