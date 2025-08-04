import { useEffect } from 'react';

export const useBranding = () => {
  useEffect(() => {
    // Apply saved branding on app load
    const applyBranding = () => {
      const savedBranding = localStorage.getItem('branding-settings');
      if (savedBranding) {
        try {
          const parsed = JSON.parse(savedBranding);
          const root = document.documentElement;
          
          // Apply CSS variables
          if (parsed.primaryColor) {
            root.style.setProperty('--primary-color', parsed.primaryColor);
          }
          if (parsed.secondaryColor) {
            root.style.setProperty('--secondary-color', parsed.secondaryColor);
          }
          if (parsed.accentColor) {
            root.style.setProperty('--accent-color', parsed.accentColor);
          }
          
          // Apply document title
          if (parsed.companyName) {
            document.title = `${parsed.companyName} - Freelancer Onboarding`;
          }
          
          console.log('Global branding applied from localStorage');
        } catch (error) {
          console.error('Error applying global branding:', error);
        }
      }
    };

    // Apply immediately
    applyBranding();
    
    // Also listen for storage changes (if user has multiple tabs open)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branding-settings') {
        applyBranding();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
};

export default useBranding;