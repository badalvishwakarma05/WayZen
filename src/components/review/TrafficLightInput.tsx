import React from 'react';
import { TrafficLightValue } from '../../types/accessibility';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface TrafficLightInputProps {
  id: string;
  label: string;
  description: string;
  value: TrafficLightValue;
  onChange: (val: TrafficLightValue) => void;
}

export const TrafficLightInput: React.FC<TrafficLightInputProps> = ({
  id,
  label,
  description,
  value,
  onChange,
}) => {
  const options: { val: TrafficLightValue; label: string; icon: any; activeClass: string }[] = [
    {
      val: 'green',
      label: 'Accessible',
      icon: CheckCircle2,
      activeClass: 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300',
    },
    {
      val: 'yellow',
      label: 'Partial / Assist',
      icon: AlertTriangle,
      activeClass: 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-200',
    },
    {
      val: 'red',
      label: 'Inaccessible',
      icon: XCircle,
      activeClass: 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-200',
    },
  ];

  return (
    <fieldset className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
      <legend className="text-sm font-bold text-slate-900 dark:text-white px-1">
        {label}
      </legend>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5 px-1">
        {description}
      </p>

      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = value === opt.val;

          return (
            <button
              key={opt.val}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(opt.val)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold min-h-[52px] transition-all focus:outline-none ${
                isSelected
                  ? opt.activeClass
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              <Icon className="w-4 h-4 mb-1 shrink-0" aria-hidden="true" />
              <span className="text-center leading-tight">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};
