import React from 'react';
import { SupabaseConnectionPanel } from '../components/dev/SupabaseConnectionPanel';
import { useDevPanel } from '../hooks/useDevPanel';
import { config } from '../config/environment';

/**
 * Example showing how to integrate the Supabase Connection Panel into your App
 * 
 * Add this to your main App.tsx file:
 */
export function AppWithDevPanel({ children }: { children: React.ReactNode }) {
  const { showPanel } = useDevPanel();

  return (
    <>
      {children}
      
      {/* Dev Panel - Only shows in development */}
      {config.FEATURES.ENABLE_DEBUG_LOGGING && showPanel && (
        <SupabaseConnectionPanel />
      )}
    </>
  );
}

/**
 * Alternative: Simple integration example
 * 
 * If you want to always show the panel in development:
 */
export function AppWithAlwaysVisibleDevPanel({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      
      {/* Always visible in development */}
      {config.FEATURES.ENABLE_DEBUG_LOGGING && (
        <SupabaseConnectionPanel />
      )}
    </>
  );
}

/**
 * Usage Instructions:
 * 
 * 1. Import and wrap your App component:
 * 
 *    import { AppWithDevPanel } from './examples/DevPanelIntegration';
 * 
 *    function App() {
 *      return (
 *        <AppWithDevPanel>
 *          {/* Your existing app content */}
 *        </AppWithDevPanel>
 *      );
 *    }
 * 
 * 2. Use the keyboard shortcut Ctrl/Cmd + Shift + D to toggle the panel
 * 
 * 3. Or use the console commands:
 *    - toggleConnectionPanel() - Show/hide the panel
 *    - testSupabaseConnection() - Run tests in console
 * 
 * 4. The panel will automatically:
 *    - Test your Supabase connection on load
 *    - Show connection status and errors
 *    - Allow manual refresh and auto-refresh mode
 *    - Display detailed test results
 *    - Only appear in development mode
 */