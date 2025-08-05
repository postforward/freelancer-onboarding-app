import React, { createContext, useContext, useState, useEffect } from 'react';

interface BrandingState {
  companyName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primaryFont: string;
  headingFont: string;
  fontSizeScale: string;
  themeMode: string;
  enableRoundedCorners: boolean;
  enableShadows: boolean;
}

interface BrandingContextType {
  branding: BrandingState;
  updateBranding: (newBranding: Partial<BrandingState>) => void;
  resetBranding: () => void;
}

const DEFAULT_BRANDING: BrandingState = {
  companyName: '',
  tagline: '',
  logoUrl: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  accentColor: '#F59E0B',
  primaryFont: 'Inter',
  headingFont: 'Inter',
  fontSizeScale: 'Medium',
  themeMode: 'auto',
  enableRoundedCorners: true,
  enableShadows: true
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingState>(DEFAULT_BRANDING);

  // Load branding from localStorage on mount
  useEffect(() => {
    const savedBranding = localStorage.getItem('branding-settings');
    if (savedBranding) {
      try {
        const parsed = JSON.parse(savedBranding);
        setBranding(prev => ({
          ...prev,
          ...parsed,
          logoUrl: parsed.logoPreview || '' // Use logoPreview as logoUrl
        }));
        
        // Apply styles immediately
        applyBrandingStyles(parsed);
        
        console.log('BrandingContext: Loaded branding from localStorage');
      } catch (error) {
        console.error('BrandingContext: Error loading branding:', error);
      }
    }
  }, []);

  // Apply branding styles to DOM
  const applyBrandingStyles = (brandingData: any) => {
    const root = document.documentElement;
    
    // Apply colors
    if (brandingData.primaryColor) {
      root.style.setProperty('--primary-color', brandingData.primaryColor);
    }
    if (brandingData.secondaryColor) {
      root.style.setProperty('--secondary-color', brandingData.secondaryColor);
    }
    if (brandingData.accentColor) {
      root.style.setProperty('--accent-color', brandingData.accentColor);
    }
    
    // Apply fonts
    if (brandingData.primaryFont) {
      root.style.setProperty('--primary-font', brandingData.primaryFont);
      // Apply to body for immediate effect
      document.body.style.fontFamily = `"${brandingData.primaryFont}", system-ui, -apple-system, sans-serif`;
    }
    if (brandingData.headingFont) {
      root.style.setProperty('--heading-font', brandingData.headingFont);
      // Apply to all headings
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((heading) => {
        (heading as HTMLElement).style.fontFamily = `"${brandingData.headingFont}", system-ui, -apple-system, sans-serif`;
      });
    }
    
    // Apply font size scale
    if (brandingData.fontSizeScale) {
      const scales = {
        Small: '0.9',
        Medium: '1.0',
        Large: '1.1'
      };
      const scale = scales[brandingData.fontSizeScale as keyof typeof scales] || '1.0';
      root.style.setProperty('--font-scale', scale);
      document.body.style.fontSize = `calc(1rem * ${scale})`;
    }
    
    // Apply rounded corners
    if (brandingData.enableRoundedCorners !== undefined) {
      const borderRadius = brandingData.enableRoundedCorners ? '0.375rem' : '0px';
      root.style.setProperty('--border-radius', borderRadius);
      // Apply to common UI elements
      const elements = document.querySelectorAll('button, input, select, textarea, .rounded, .rounded-md, .rounded-lg');
      elements.forEach((element) => {
        (element as HTMLElement).style.borderRadius = borderRadius;
      });
    }
    
    // Apply shadows
    if (brandingData.enableShadows !== undefined) {
      const boxShadow = brandingData.enableShadows 
        ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' 
        : 'none';
      root.style.setProperty('--box-shadow', boxShadow);
      // Apply to common shadow elements
      const shadowElements = document.querySelectorAll('.shadow, .shadow-md, .shadow-lg, .shadow-sm');
      shadowElements.forEach((element) => {
        (element as HTMLElement).style.boxShadow = boxShadow;
      });
    }
    
    // Apply company name to title
    if (brandingData.companyName) {
      document.title = `${brandingData.companyName} - Freelancer Onboarding`;
    }
  };

  const updateBranding = (newBranding: Partial<BrandingState>) => {
    const updatedBranding = { ...branding, ...newBranding };
    setBranding(updatedBranding);
    
    // Save to localStorage
    localStorage.setItem('branding-settings', JSON.stringify(updatedBranding));
    
    // Apply styles
    applyBrandingStyles(updatedBranding);
    
    console.log('BrandingContext: Updated branding:', updatedBranding);
  };

  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
    localStorage.removeItem('branding-settings');
    
    // Reset styles
    const root = document.documentElement;
    root.style.removeProperty('--primary-color');
    root.style.removeProperty('--secondary-color');
    root.style.removeProperty('--accent-color');
    root.style.removeProperty('--primary-font');
    root.style.removeProperty('--heading-font');
    root.style.removeProperty('--font-scale');
    root.style.removeProperty('--border-radius');
    root.style.removeProperty('--box-shadow');
    
    // Reset body styles
    document.body.style.fontFamily = '';
    document.body.style.fontSize = '';
    
    // Reset heading fonts
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading) => {
      (heading as HTMLElement).style.fontFamily = '';
    });
    
    // Reset border radius for elements
    const elements = document.querySelectorAll('button, input, select, textarea, .rounded, .rounded-md, .rounded-lg');
    elements.forEach((element) => {
      (element as HTMLElement).style.borderRadius = '';
    });
    
    // Reset shadows for elements
    const shadowElements = document.querySelectorAll('.shadow, .shadow-md, .shadow-lg, .shadow-sm');
    shadowElements.forEach((element) => {
      (element as HTMLElement).style.boxShadow = '';
    });
    
    document.title = 'Freelancer Onboarding';
    
    console.log('BrandingContext: Reset branding to defaults');
  };

  const value: BrandingContextType = {
    branding,
    updateBranding,
    resetBranding
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

export default BrandingContext;