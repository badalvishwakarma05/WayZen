import React from 'react';
import { TrafficLightValue } from '../../types/accessibility';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface TrafficLightBadgeProps {
  status: TrafficLightValue;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const TrafficLightBadge: React.FC<TrafficLightBadgeProps> = ({
  status,
  label,
  size = 'md',
  showLabel = true,
}) => {
  let config = {
    text: 'Unknown',
    accessibleText: 'Status: Unknown (Data not yet verified)',
    icon: HelpCircle,
    bgClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600',
    iconColor: 'text-slate-600 dark:text-slate-300',
  };

  if (status === 'green') {
    config = {
      text: 'Accessible',
      accessibleText: 'Status: Fully accessible (Meets wheelchair & universal standards)',
      icon: CheckCircle2,
      bgClass: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 border-emerald-500 dark:border-emerald-400',
      iconColor: 'text-emerald-700 dark:text-emerald-400',
    };
  } else if (status === 'yellow') {
    config = {
      text: 'Partial Access',
      accessibleText: 'Status: Partial access (Assistance recommended or steep ramp)',
      icon: AlertTriangle,
      bgClass: 'bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100 border-amber-500 dark:border-amber-400',
      iconColor: 'text-amber-700 dark:text-amber-400',
    };
  } else if (status === 'red') {
    config = {
      text: 'Inaccessible',
      accessibleText: 'Status: Inaccessible (Steps with no ramp or facility missing)',
      icon: XCircle,
      bgClass: 'bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-100 border-rose-500 dark:border-rose-400',
      iconColor: 'text-rose-700 dark:text-rose-400',
    };
  }

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${config.bgClass} ${sizeClasses}`}
      title={config.accessibleText}
      role="status"
    >
      <IconComponent className={`${iconSizes} ${config.iconColor} shrink-0`} aria-hidden="true" />
      {showLabel && <span>{label || config.text}</span>}
      <span className="sr-only">({config.accessibleText})</span>
    </span>
  );
};
