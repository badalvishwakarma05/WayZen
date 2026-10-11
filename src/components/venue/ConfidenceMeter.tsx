import React from 'react';
import { ShieldCheck, AlertCircle, Info, Sparkles } from 'lucide-react';

interface ConfidenceMeterProps {
  confidenceLevel: number; // 0.0 - 1.0
  confidenceLabel: 'High' | 'Medium' | 'Low' | 'Unverified';
  knownPillarsCount: number;
  totalPillarsCount?: number;
  verificationStatus: string;
  lastVerifiedAt?: string;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  confidenceLevel,
  confidenceLabel,
  knownPillarsCount,
  totalPillarsCount = 5,
  verificationStatus,
  lastVerifiedAt,
}) => {
  const percent = Math.round(confidenceLevel * 100);

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'photo_verified':
        return {
          label: 'Photo Verified',
          color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-400',
          icon: ShieldCheck,
        };
      case 'partner_verified':
        return {
          label: 'Partner Verified',
          color: 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border-sky-400',
          icon: Sparkles,
        };
      case 'community_reported':
        return {
          label: 'Community Reported',
          color: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-400',
          icon: Info,
        };
      default:
        return {
          label: 'OSM Imported (Unverified)',
          color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300',
          icon: AlertCircle,
        };
    }
  };

  const badge = getStatusBadge();
  const BadgeIcon = badge.icon;

  return (
    <div
      className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700"
      aria-label={`Data Confidence: ${confidenceLabel} (${percent}%), Verified: ${badge.label}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Data Confidence
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
          >
            <BadgeIcon className="w-3.5 h-3.5" aria-hidden="true" />
            {badge.label}
          </span>
        </div>

        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {confidenceLabel} ({percent}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence score ${percent} percent`}
      >
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            confidenceLabel === 'High'
              ? 'bg-emerald-600'
              : confidenceLabel === 'Medium'
              ? 'bg-amber-500'
              : 'bg-slate-400'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-2">
        <span>
          {knownPillarsCount} of {totalPillarsCount} pillars verified
        </span>
        {lastVerifiedAt && (
          <span>Verified: {new Date(lastVerifiedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};
