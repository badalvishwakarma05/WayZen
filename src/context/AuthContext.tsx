import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserPersonaId, UserPersonaInfo } from '../types/accessibility';

export const AVAILABLE_PERSONAS: UserPersonaInfo[] = [
  {
    id: 'power_wheelchair',
    label: 'Power Wheelchair',
    description: 'Requires strictly step-free paths, compliant ramp slopes (<= 1:12), elevators, and wide doors (>= 81 cm).',
    iconName: 'Zap',
    criticalPillars: ['step_free', 'lifts', 'washrooms'],
  },
  {
    id: 'manual_chair_stroller',
    label: 'Manual Chair / Stroller',
    description: 'Needs ramps, level thresholds, and accessible washrooms; can manage slight curbs with assistance.',
    iconName: 'Accessibility',
    criticalPillars: ['step_free', 'lifts', 'washrooms'],
  },
  {
    id: 'low_vision',
    label: 'Low Vision / Screen Reader',
    description: 'Relies on tactile paving, high-contrast signage, braille markers, and auditory lift announcements.',
    iconName: 'Eye',
    criticalPillars: ['wayfinding_sensory', 'lifts'],
  },
  {
    id: 'sensory_neurodivergent',
    label: 'Sensory / Neurodivergent',
    description: 'Prioritizes low noise environments, quiet resting areas, glare-free lighting, and sensory hours.',
    iconName: 'Sparkles',
    criticalPillars: ['wayfinding_sensory', 'rest_seating'],
  },
  {
    id: 'limited_ambulatory',
    label: 'Limited Ambulatory',
    description: 'Cannot climb multiple stairs; needs frequent resting benches with armrests and elevators.',
    iconName: 'Activity',
    criticalPillars: ['rest_seating', 'step_free', 'lifts'],
  },
];

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  selectedPersonas: UserPersonaId[];
  consentGivenAt: string;
  consentVersion: string;
}

interface AuthContextType {
  user: UserProfile | null;
  selectedPersonas: UserPersonaId[];
  isPersonaModalOpen: boolean;
  openPersonaModal: () => void;
  closePersonaModal: () => void;
  updatePersonas: (personas: UserPersonaId[], explicitConsent: boolean) => void;
  loginWithEmail: (email: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
  exportUserData: () => void;
  deleteUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'accesspath_user_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default demo user with consent for ease of discovery
    return {
      id: 'demo-user-blr-01',
      email: 'aarav.tester@accesspath.in',
      displayName: 'Aarav (Community Mapper)',
      selectedPersonas: ['power_wheelchair'],
      consentGivenAt: new Date().toISOString(),
      consentVersion: 'v1.0-2026',
    };
  });

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const updatePersonas = (personas: UserPersonaId[], explicitConsent: boolean) => {
    if (!explicitConsent) {
      throw new Error('Explicit consent is legally required under India DPDP Act 2023 to record sensitive accessibility preferences.');
    }

    setUser((prev) => {
      const updated: UserProfile = prev
        ? {
            ...prev,
            selectedPersonas: personas,
            consentGivenAt: new Date().toISOString(),
          }
        : {
            id: 'user-' + Math.random().toString(36).substring(2, 9),
            email: 'guest@accesspath.in',
            displayName: 'Community Contributor',
            selectedPersonas: personas,
            consentGivenAt: new Date().toISOString(),
            consentVersion: 'v1.0-2026',
          };
      return updated;
    });
    setIsPersonaModalOpen(false);
  };

  const loginWithEmail = (email: string) => {
    setUser({
      id: 'user-' + Math.random().toString(36).substring(2, 9),
      email,
      displayName: email.split('@')[0],
      selectedPersonas: user?.selectedPersonas || ['power_wheelchair'],
      consentGivenAt: new Date().toISOString(),
      consentVersion: 'v1.0-2026',
    });
  };

  const loginAsGuest = () => {
    setUser({
      id: 'guest-' + Math.random().toString(36).substring(2, 9),
      email: 'anonymous@accesspath.in',
      displayName: 'Guest Explorer',
      selectedPersonas: [],
      consentGivenAt: new Date().toISOString(),
      consentVersion: 'v1.0-2026',
    });
  };

  const logout = () => {
    setUser(null);
  };

  const exportUserData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(user, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `accesspath_data_export_${user?.id || 'guest'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const deleteUserData = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        selectedPersonas: user?.selectedPersonas || [],
        isPersonaModalOpen,
        openPersonaModal: () => setIsPersonaModalOpen(true),
        closePersonaModal: () => setIsPersonaModalOpen(false),
        updatePersonas,
        loginWithEmail,
        loginAsGuest,
        logout,
        exportUserData,
        deleteUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
