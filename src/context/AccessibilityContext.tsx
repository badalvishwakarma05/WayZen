import React, { createContext, useContext, useState, useEffect } from 'react';

export type TextScale = 100 | 125 | 150 | 200;

interface AccessibilityContextType {
  highContrast: boolean;
  toggleHighContrast: () => void;
  textScale: TextScale;
  setTextScale: (scale: TextScale) => void;
  cycleTextScale: () => void;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  announcement: string;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announcementPriority: 'polite' | 'assertive';
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('accesspath_high_contrast') === 'true';
  });

  const [textScale, setTextScale] = useState<TextScale>(() => {
    const saved = localStorage.getItem('accesspath_text_scale');
    return saved ? (parseInt(saved, 10) as TextScale) : 100;
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return true;
    }
    return localStorage.getItem('accesspath_reduced_motion') === 'true';
  });

  const [announcement, setAnnouncement] = useState<string>('');
  const [announcementPriority, setAnnouncementPriority] = useState<'polite' | 'assertive'>('polite');

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('accesspath_high_contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-scale-100', 'text-scale-125', 'text-scale-150', 'text-scale-200');
    root.classList.add(`text-scale-${textScale}`);
    localStorage.setItem('accesspath_text_scale', String(textScale));
  }, [textScale]);

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    localStorage.setItem('accesspath_reduced_motion', String(reducedMotion));
  }, [reducedMotion]);

  const toggleHighContrast = () => setHighContrast((prev) => !prev);

  const cycleTextScale = () => {
    setTextScale((prev) => {
      if (prev === 100) return 125;
      if (prev === 125) return 150;
      if (prev === 150) return 200;
      return 100;
    });
  };

  const toggleReducedMotion = () => setReducedMotion((prev) => !prev);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncementPriority(priority);
    setAnnouncement('');
    // Slight timeout allows screen readers to reliably detect the new text node
    setTimeout(() => {
      setAnnouncement(message);
    }, 50);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        textScale,
        setTextScale,
        cycleTextScale,
        reducedMotion,
        toggleReducedMotion,
        announcement,
        announce,
        announcementPriority,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
