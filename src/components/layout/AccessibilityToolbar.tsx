import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { SupportedLanguage } from '../../i18n/types';
import { Type, Eye, Wind, Users, Download, Trash2, ShieldAlert, Globe } from 'lucide-react';

interface AccessibilityToolbarProps {
  onOpenModeration?: () => void;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  onOpenModeration,
}) => {
  const {
    highContrast,
    toggleHighContrast,
    textScale,
    cycleTextScale,
    reducedMotion,
    toggleReducedMotion,
    announce,
  } = useAccessibility();

  const { openPersonaModal, exportUserData, deleteUserData } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();

  const handleCycleText = () => {
    cycleTextScale();
    const nextScale = textScale === 100 ? '125%' : textScale === 125 ? '150%' : textScale === 150 ? '200%' : '100%';
    announce(`Text size scaled to ${nextScale}`);
  };

  const handleToggleContrast = () => {
    toggleHighContrast();
    announce(highContrast ? 'High contrast mode disabled' : 'High contrast mode enabled');
  };

  const handleToggleMotion = () => {
    toggleReducedMotion();
    announce(reducedMotion ? 'Reduced motion disabled' : 'Reduced motion enabled');
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as SupportedLanguage;
    setLanguage(newLang);
    const selected = languages.find((l) => l.code === newLang);
    announce(`Language switched to ${selected?.nativeLabel || newLang}`);
  };

  return (
    <nav
      id="accessibility-toolbar"
      aria-label="Accessibility options and display preferences"
      className="bg-slate-900 text-white px-3 py-2 text-sm border-b border-slate-700 flex flex-wrap items-center justify-between gap-2"
    >
      <div className="flex items-center gap-1">
        <span className="font-semibold text-xs tracking-wider text-slate-300 uppercase mr-1 flex items-center gap-1">
          <Eye className="w-4 h-4 text-sky-400" aria-hidden="true" />
          {t('a11yToolbar.quickControls')}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Language Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 border border-slate-600 min-h-[44px]">
          <Globe className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <label htmlFor="a11y-language-select" className="sr-only">
            {t('a11yToolbar.language')}
          </label>
          <select
            id="a11y-language-select"
            value={language}
            onChange={handleLanguageChange}
            className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer pr-1"
            aria-label="Select website language"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                {l.nativeLabel} ({l.label})
              </option>
            ))}
          </select>
        </div>

        {/* Text Scaling */}
        <button
          onClick={handleCycleText}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 focus:outline-none min-h-[44px] min-w-[44px]"
          aria-label={`Text size current: ${textScale}%. Press to cycle to next scale.`}
        >
          <Type className="w-4 h-4 text-sky-400" aria-hidden="true" />
          <span className="font-medium">{t('a11yToolbar.textSize')} {textScale}%</span>
        </button>

        {/* High Contrast */}
        <button
          onClick={handleToggleContrast}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border min-h-[44px] min-w-[44px] focus:outline-none transition-colors ${
            highContrast
              ? 'bg-yellow-400 text-black border-yellow-300 font-bold'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100'
          }`}
          aria-pressed={highContrast}
          aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          <span>{t('a11yToolbar.highContrast')}</span>
        </button>

        {/* Reduced Motion */}
        <button
          onClick={handleToggleMotion}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border min-h-[44px] min-w-[44px] focus:outline-none transition-colors ${
            reducedMotion
              ? 'bg-sky-500 text-white border-sky-400 font-bold'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100'
          }`}
          aria-pressed={reducedMotion}
          aria-label={reducedMotion ? 'Disable reduced motion' : 'Enable reduced motion'}
        >
          <Wind className="w-4 h-4" aria-hidden="true" />
          <span>{t('a11yToolbar.reduceMotion')}</span>
        </button>

        {/* Persona Preferences */}
        <button
          onClick={openPersonaModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-700 hover:bg-sky-600 text-white font-medium border border-sky-500 min-h-[44px] min-w-[44px] focus:outline-none"
          aria-label="Open personal accessibility persona preferences modal"
        >
          <Users className="w-4 h-4" aria-hidden="true" />
          <span>{t('a11yToolbar.myNeeds')}</span>
        </button>

        {/* Moderation Queue */}
        {onOpenModeration && (
          <button
            onClick={onOpenModeration}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-indigo-900 text-indigo-300 font-medium border border-indigo-700/50 min-h-[44px] focus:outline-none"
            aria-label="Open community moderation and anti-abuse dashboard"
            title="Community Moderation & Anti-Abuse Queue"
          >
            <ShieldAlert className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            <span className="hidden md:inline">{t('a11yToolbar.moderation')}</span>
          </button>
        )}

        {/* Privacy Export / Delete */}
        <button
          onClick={exportUserData}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-600 min-h-[44px] focus:outline-none"
          title="Export My Persona & Saved Data (DPDP Act)"
          aria-label="Export my personal data as JSON"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t('a11yToolbar.exportData')}</span>
        </button>

        <button
          onClick={() => {
            if (window.confirm(t('a11yToolbar.confirmDelete'))) {
              deleteUserData();
              announce(t('a11yToolbar.dataErased'));
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-rose-950 text-rose-300 text-xs border border-rose-900/40 min-h-[44px] focus:outline-none"
          title="Delete all stored personal data from this browser (DPDP Act Right to Erasure)"
          aria-label="Erase all stored personal data"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
          <span className="hidden sm:inline">{t('a11yToolbar.deleteData')}</span>
        </button>
      </div>
    </nav>
  );
};
