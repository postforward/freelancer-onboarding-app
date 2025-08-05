import { useState, useEffect } from 'react';
import { config } from '../config/environment';

export function useDevPanel() {
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (!config.FEATURES.ENABLE_DEBUG_LOGGING) return;

    // Listen for toggle event
    const handleToggle = () => setShowPanel(prev => !prev);
    window.addEventListener('toggleSupabasePanel', handleToggle);

    // Keyboard shortcut: Ctrl/Cmd + Shift + D
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowPanel(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('toggleSupabasePanel', handleToggle);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return { showPanel, setShowPanel };
}