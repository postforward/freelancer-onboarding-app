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
    
    if (brandingData.primaryColor) {
      root.style.setProperty('--primary-color', brandingData.primaryColor);
    }
    if (brandingData.secondaryColor) {
      root.style.setProperty('--secondary-color', brandingData.secondaryColor);
    }
    if (brandingData.accentColor) {
      root.style.setProperty('--accent-color', brandingData.accentColor);
    }
    
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