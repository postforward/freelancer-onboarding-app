/**
 * Debug Logger Utility for Platform Management
 * 
 * Provides consistent, colored, and detailed logging for troubleshooting
 * Enable/disable with localStorage.setItem('DEBUG_PLATFORMS', 'true')
 */

const DEBUG_KEY = 'DEBUG_PLATFORMS';

export class DebugLogger {
  private static isEnabled(): boolean {
    try {
      // Check localStorage if available
      if (typeof localStorage !== 'undefined') {
        const debugSetting = localStorage.getItem(DEBUG_KEY);
        if (debugSetting === 'true') return true;
      }
      
      // Check process.env if available
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
        return true;
      }
      
      return false;
    } catch (error) {
      // Fallback to false if any errors occur
      return false;
    }
  }

  private static getTimestamp(): string {
    try {
      return new Date().toISOString().split('T')[1].split('.')[0];
    } catch (error) {
      return 'unknown';
    }
  }

  private static formatMessage(level: string, component: string, message: string): string {
    const timestamp = this.getTimestamp();
    const safeLevel = level || 'LOG';
    const safeComponent = component || 'Unknown';
    const safeMessage = message || '';
    return `[${timestamp}] [${safeLevel}] [${safeComponent}] ${safeMessage}`;
  }

  static log(component: string, message: string, data?: any) {
    try {
      if (!this.isEnabled()) return;
      
      console.log(
        `%c${this.formatMessage('LOG', component, message)}`,
        'color: #3B82F6; font-weight: bold'
      );
      if (data !== undefined && data !== null) {
        console.log('📊 Data:', data);
      }
    } catch (error) {
      // Fallback logging if debug logger fails
      console.log(`[DEBUG ERROR] ${component}: ${message}`, data);
    }
  }

  static success(component: string, message: string, data?: any) {
    try {
      if (!this.isEnabled()) return;
      
      console.log(
        `%c${this.formatMessage('SUCCESS', component, message)}`,
        'color: #10B981; font-weight: bold'
      );
      if (data !== undefined && data !== null) {
        console.log('✅ Data:', data);
      }
    } catch (error) {
      console.log(`[DEBUG ERROR] ${component}: ${message}`, data);
    }
  }

  static error(component: string, message: string, error?: any) {
    try {
      if (!this.isEnabled()) return;
      
      console.error(
        `%c${this.formatMessage('ERROR', component, message)}`,
        'color: #EF4444; font-weight: bold'
      );
      if (error !== undefined && error !== null) {
        console.error('❌ Error details:', error);
      }
    } catch (debugError) {
      console.error(`[DEBUG ERROR] ${component}: ${message}`, error);
    }
  }

  static warn(component: string, message: string, data?: any) {
    try {
      if (!this.isEnabled()) return;
      
      console.warn(
        `%c${this.formatMessage('WARN', component, message)}`,
        'color: #F59E0B; font-weight: bold'
      );
      if (data !== undefined && data !== null) {
        console.warn('⚠️ Data:', data);
      }
    } catch (error) {
      console.warn(`[DEBUG ERROR] ${component}: ${message}`, data);
    }
  }

  static api(component: string, method: string, endpoint: string, data?: any) {
    try {
      if (!this.isEnabled()) return;
      
      const safeMethod = method || 'UNKNOWN';
      const safeEndpoint = endpoint || '';
      
      console.log(
        `%c${this.formatMessage('API', component, `${safeMethod} ${safeEndpoint}`)}`,
        'color: #8B5CF6; font-weight: bold'
      );
      if (data !== undefined && data !== null) {
        console.log('🔌 Request data:', data);
      }
    } catch (error) {
      console.log(`[DEBUG ERROR] ${component}: API ${method} ${endpoint}`, data);
    }
  }

  static state(component: string, stateName: string, oldValue: any, newValue: any) {
    try {
      if (!this.isEnabled()) return;
      
      const safeStateName = stateName || 'unknown';
      
      console.log(
        `%c${this.formatMessage('STATE', component, `${safeStateName} changed`)}`,
        'color: #EC4899; font-weight: bold'
      );
      console.log('📍 Old value:', oldValue);
      console.log('📍 New value:', newValue);
    } catch (error) {
      console.log(`[DEBUG ERROR] ${component}: State ${stateName} changed`, { oldValue, newValue });
    }
  }

  static validation(component: string, field: string, isValid: boolean, errors?: any) {
    try {
      if (!this.isEnabled()) return;
      
      const safeField = field || 'unknown';
      const safeIsValid = typeof isValid === 'boolean' ? isValid : false;
      const status = safeIsValid ? 'VALID' : 'INVALID';
      const color = safeIsValid ? '#10B981' : '#EF4444';
      
      console.log(
        `%c${this.formatMessage('VALIDATION', component, `${safeField} is ${status}`)}`,
        `color: ${color}; font-weight: bold`
      );
      if (errors !== undefined && errors !== null) {
        console.log('🚫 Validation errors:', errors);
      }
    } catch (error) {
      console.log(`[DEBUG ERROR] ${component}: Validation ${field}`, { isValid, errors });
    }
  }

  static group(title: string, fn: () => void) {
    try {
      if (!this.isEnabled()) {
        if (typeof fn === 'function') fn();
        return;
      }
      
      const safeTitle = title || 'Debug Group';
      
      console.group(`%c${safeTitle}`, 'color: #6366F1; font-weight: bold; font-size: 14px');
      if (typeof fn === 'function') {
        fn();
      }
      console.groupEnd();
    } catch (error) {
      console.log(`[DEBUG ERROR] Group: ${title}`);
      if (typeof fn === 'function') {
        try {
          fn();
        } catch (fnError) {
          console.error('Error in debug group function:', fnError);
        }
      }
    }
  }

  static table(component: string, title: string, data: any) {
    try {
      if (!this.isEnabled()) return;
      
      const safeTitle = title || 'Data Table';
      
      console.log(
        `%c${this.formatMessage('TABLE', component, safeTitle)}`,
        'color: #14B8A6; font-weight: bold'
      );
      if (data !== undefined && data !== null) {
        console.table(data);
      } else {
        console.log('No data to display in table');
      }
    } catch (error) {
      console.log(`[DEBUG ERROR] ${component}: Table ${title}`, data);
    }
  }
}

// Export convenience functions with error handling
export const debugLog = (component: string, message: string, data?: any) => {
  try {
    DebugLogger.log(component, message, data);
  } catch (error) {
    console.log(`[FALLBACK] ${component}: ${message}`, data);
  }
};

export const debugSuccess = (component: string, message: string, data?: any) => {
  try {
    DebugLogger.success(component, message, data);
  } catch (error) {
    console.log(`[FALLBACK] ${component}: ${message}`, data);
  }
};

export const debugError = (component: string, message: string, error?: any) => {
  try {
    DebugLogger.error(component, message, error);
  } catch (debugError) {
    console.error(`[FALLBACK] ${component}: ${message}`, error);
  }
};

export const debugWarn = (component: string, message: string, data?: any) => {
  try {
    DebugLogger.warn(component, message, data);
  } catch (error) {
    console.warn(`[FALLBACK] ${component}: ${message}`, data);
  }
};

export const debugApi = (component: string, method: string, endpoint: string, data?: any) => {
  try {
    DebugLogger.api(component, method, endpoint, data);
  } catch (error) {
    console.log(`[FALLBACK] ${component}: API ${method} ${endpoint}`, data);
  }
};

export const debugState = (component: string, stateName: string, oldValue: any, newValue: any) => {
  try {
    DebugLogger.state(component, stateName, oldValue, newValue);
  } catch (error) {
    console.log(`[FALLBACK] ${component}: State ${stateName}`, { oldValue, newValue });
  }
};

export const debugValidation = (component: string, field: string, isValid: boolean, errors?: any) => {
  try {
    DebugLogger.validation(component, field, isValid, errors);
  } catch (error) {
    console.log(`[FALLBACK] ${component}: Validation ${field}`, { isValid, errors });
  }
};

export const debugGroup = (title: string, fn: () => void) => {
  try {
    DebugLogger.group(title, fn);
  } catch (error) {
    console.log(`[FALLBACK] Group: ${title}`);
    if (typeof fn === 'function') fn();
  }
};

export const debugTable = (component: string, title: string, data: any) => {
  try {
    DebugLogger.table(component, title, data);
  } catch (error) {
    console.log(`[FALLBACK] ${component}: Table ${title}`, data);
  }
};

// Enable debug logging helper
export function enablePlatformDebugLogging() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEBUG_KEY, 'true');
      console.log('🐛 Platform debug logging enabled');
    } else {
      console.warn('🐛 localStorage not available, cannot enable debug logging');
    }
  } catch (error) {
    console.warn('🐛 Failed to enable debug logging:', error);
  }
}

// Disable debug logging helper
export function disablePlatformDebugLogging() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(DEBUG_KEY);
      console.log('🐛 Platform debug logging disabled');
    } else {
      console.warn('🐛 localStorage not available, cannot disable debug logging');
    }
  } catch (error) {
    console.warn('🐛 Failed to disable debug logging:', error);
  }
}

// Check if debug logging is enabled
export function isPlatformDebugLoggingEnabled(): boolean {
  try {
    return DebugLogger['isEnabled']();
  } catch (error) {
    console.warn('🐛 Failed to check debug logging status:', error);
    return false;
  }
}

// Make debug functions available globally in development
try {
  if (typeof window !== 'undefined' && typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    (window as any).enablePlatformDebugLogging = enablePlatformDebugLogging;
    (window as any).disablePlatformDebugLogging = disablePlatformDebugLogging;
    (window as any).isPlatformDebugLoggingEnabled = isPlatformDebugLoggingEnabled;
    
    console.log('💡 Platform debug logging utilities available:');
    console.log('   enablePlatformDebugLogging() - Enable debug logs');
    console.log('   disablePlatformDebugLogging() - Disable debug logs');
    console.log('   isPlatformDebugLoggingEnabled() - Check status');
  }
} catch (error) {
  // Silently fail if we can't attach global functions
}