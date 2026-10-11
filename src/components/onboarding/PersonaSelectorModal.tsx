import React, { useState, useEffect } from 'react';
import { useAuth, AVAILABLE_PERSONAS } from '../../context/AuthContext';
import { UserPersonaId } from '../../types/accessibility';
import { X, Check, ShieldCheck, Zap, Accessibility, Eye, Sparkles, Activity } from 'lucide-react';

export const PersonaSelectorModal: React.FC = () => {
  const { isPersonaModalOpen, closePersonaModal, selectedPersonas, updatePersonas } = useAuth();
  const [selected, setSelected] = useState<UserPersonaId[]>(selectedPersonas);
  const [hasExplicitConsent, setHasExplicitConsent] = useState(true);
  const [consentError, setConsentError] = useState('');

  useEffect(() => {
    setSelected(selectedPersonas);
  }, [selectedPersonas, isPersonaModalOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPersonaModalOpen) {
        closePersonaModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPersonaModalOpen, closePersonaModal]);

  if (!isPersonaModalOpen) return null;

  const togglePersona = (id: UserPersonaId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (selected.length > 0 && !hasExplicitConsent) {
      setConsentError('Explicit consent is required to process your sensitive mobility and sensory preferences.');
      return;
    }
    setConsentError('');
    updatePersonas(selected, hasExplicitConsent);
  };

  const getPersonaIcon = (name: string) => {
    switch (name) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500" aria-hidden="true" />;
      case 'Accessibility':
        return <Accessibility className="w-5 h-5 text-sky-500" aria-hidden="true" />;
      case 'Eye':
        return <Eye className="w-5 h-5 text-indigo-500" aria-hidden="true" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-purple-500" aria-hidden="true" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-emerald-500" aria-hidden="true" />;
      default:
        return <Accessibility className="w-5 h-5 text-sky-500" aria-hidden="true" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="persona-modal-title"
      aria-describedby="persona-modal-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2
              id="persona-modal-title"
              className="text-2xl font-bold text-slate-900 dark:text-white"
            >
              Tailor AccessPath to Your Needs
            </h2>
            <p
              id="persona-modal-description"
              className="text-slate-600 dark:text-slate-300 text-sm mt-1"
            >
              Select any accessibility profiles that match you or someone you are navigating with. We recalculate scores and highlight hard barriers specifically for your requirements.
            </p>
          </div>
          <button
            onClick={closePersonaModal}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Persona Options (Multi-select) */}
        <div className="space-y-3 mb-6" role="group" aria-label="Accessibility personas selection">
          {AVAILABLE_PERSONAS.map((persona) => {
            const isChecked = selected.includes(persona.id);
            return (
              <label
                key={persona.id}
                className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isChecked
                    ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 dark:border-sky-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePersona(persona.id)}
                  className="mt-1 w-5 h-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 shrink-0"
                  aria-describedby={`desc-${persona.id}`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getPersonaIcon(persona.iconName)}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {persona.label}
                    </span>
                  </div>
                  <p id={`desc-${persona.id}`} className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {persona.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Privacy & DPDP Act 2023 Consent */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Privacy Notice under Digital Personal Data Protection (DPDP) Act 2023 (India):
              </p>
              <p>
                Your accessibility preferences are sensitive personal data. They are stored under PostgreSQL Row Level Security (RLS) and never sold, shared with advertising brokers, or used for automated profiling outside this application.
              </p>
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer font-medium text-slate-900 dark:text-slate-100">
                <input
                  type="checkbox"
                  checked={hasExplicitConsent}
                  onChange={(e) => {
                    setHasExplicitConsent(e.target.checked);
                    if (e.target.checked) setConsentError('');
                  }}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                <span>I provide explicit consent to store these accessibility preferences to filter public places.</span>
              </label>
              {consentError && (
                <p className="text-rose-600 font-semibold text-xs pt-1">{consentError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium px-3 py-2 min-h-[44px]"
          >
            Clear All (General View)
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closePersonaModal}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-sky-700 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md min-h-[44px] focus:outline-none"
            >
              <Check className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
