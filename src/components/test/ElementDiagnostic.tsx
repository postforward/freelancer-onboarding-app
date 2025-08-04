import React, { useEffect, useState } from 'react';

export const ElementDiagnostic: React.FC = () => {
  const [diagnosticInfo, setDiagnosticInfo] = useState<string[]>([]);

  useEffect(() => {
    const info: string[] = [];
    
    // Check for elements with high z-index
    const allElements = document.querySelectorAll('*');
    const highZIndexElements: { element: Element; zIndex: string }[] = [];
    
    allElements.forEach(el => {
      const computed = window.getComputedStyle(el);
      const zIndex = computed.zIndex;
      if (zIndex !== 'auto' && parseInt(zIndex) > 10) {
        highZIndexElements.push({ element: el, zIndex });
      }
    });
    
    info.push(`Found ${highZIndexElements.length} elements with high z-index`);
    
    // Check for fixed positioned elements
    const fixedElements = Array.from(allElements).filter(el => {
      const computed = window.getComputedStyle(el);
      return computed.position === 'fixed';
    });
    
    info.push(`Found ${fixedElements.length} fixed positioned elements`);
    
    // Check for elements with pointer-events: none
    const pointerEventsNone = Array.from(allElements).filter(el => {
      const computed = window.getComputedStyle(el);
      return computed.pointerEvents === 'none';
    });
    
    info.push(`Found ${pointerEventsNone.length} elements with pointer-events: none`);
    
    // Check for modal overlays
    const modalOverlays = document.querySelectorAll('[class*="fixed"][class*="inset-0"]');
    info.push(`Found ${modalOverlays.length} potential modal overlays`);
    
    // List some specific problematic elements
    highZIndexElements.slice(0, 5).forEach(({ element, zIndex }) => {
      info.push(`High z-index element (${zIndex}): ${element.tagName} ${element.className || ''}`);
    });
    
    setDiagnosticInfo(info);
  }, []);

  const handleElementInspect = (e: React.MouseEvent) => {
    const element = e.target as HTMLElement;
    const computed = window.getComputedStyle(element);
    
    console.log('Clicked element:', {
      tagName: element.tagName,
      className: element.className,
      zIndex: computed.zIndex,
      position: computed.position,
      pointerEvents: computed.pointerEvents,
      overflow: computed.overflow,
      element: element
    });
  };

  return (
    <div className="p-4 border border-red-300 rounded-lg bg-red-50">
      <h3 className="text-lg font-semibold mb-4 text-red-900">Element Diagnostic</h3>
      
      <div className="space-y-2 mb-4">
        {diagnosticInfo.map((info, index) => (
          <div key={index} className="text-sm text-red-800">
            {info}
          </div>
        ))}
      </div>
      
      <div className="space-y-4">
        <button
          onClick={() => {
            const modals = document.querySelectorAll('[class*="fixed"][class*="inset-0"]');
            console.log('Modal overlays found:', modals);
            modals.forEach((modal, index) => {
              console.log(`Modal ${index}:`, modal);
            });
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Inspect Modal Overlays
        </button>
        
        <div 
          onClick={handleElementInspect}
          className="p-2 border border-gray-300 bg-white cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        >
          Click anywhere in this box to inspect element properties
        </div>
      </div>
    </div>
  );
};