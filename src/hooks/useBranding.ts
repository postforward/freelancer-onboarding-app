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
          
          // Apply fonts
          if (parsed.primaryFont) {
            root.style.setProperty('--primary-font', parsed.primaryFont);
            document.body.style.fontFamily = `"${parsed.primaryFont}", system-ui, -apple-system, sans-serif`;
          }
          if (parsed.headingFont) {
            root.style.setProperty('--heading-font', parsed.headingFont);
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach((heading) => {
              (heading as HTMLElement).style.fontFamily = `"${parsed.headingFont}", system-ui, -apple-system, sans-serif`;
            });
          }
          
          // Apply font size scale
          if (parsed.fontSizeScale) {
            const scales = { Small: '0.9', Medium: '1.0', Large: '1.1' };
            const scale = scales[parsed.fontSizeScale as keyof typeof scales] || '1.0';
            root.style.setProperty('--font-scale', scale);
            document.body.style.fontSize = `calc(1rem * ${scale})`;
          }
          
          // Apply rounded corners
          if (parsed.enableRoundedCorners !== undefined) {
            const borderRadius = parsed.enableRoundedCorners ? '0.375rem' : '0px';
            root.style.setProperty('--border-radius', borderRadius);
            const elements = document.querySelectorAll('button, input, select, textarea, .rounded, .rounded-md, .rounded-lg');
            elements.forEach((element) => {
              (element as HTMLElement).style.borderRadius = borderRadius;
            });
          }
          
          // Apply shadows
          if (parsed.enableShadows !== undefined) {
            const boxShadow = parsed.enableShadows 
              ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' 
              : 'none';
            root.style.setProperty('--box-shadow', boxShadow);
            const shadowElements = document.querySelectorAll('.shadow, .shadow-md, .shadow-lg, .shadow-sm');
            shadowElements.forEach((element) => {
              (element as HTMLElement).style.boxShadow = boxShadow;
            });
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