import React from 'react';
import { CompositeScoreResult, PillarId } from '../../types/accessibility';
import { TrafficLightBadge } from '../a11y/TrafficLightBadge';
import { Footprints, ArrowUpDown, Bath, Armchair, Compass, AlertOctagon } from 'lucide-react';

interface PillarBreakdownProps {
  scoreResult: CompositeScoreResult;
}

export const PillarBreakdown: React.FC<PillarBreakdownProps> = ({ scoreResult }) => {
  const getPillarIcon = (pid: PillarId) => {
    switch (pid) {
      case 'step_free':
        return <Footprints className="w-5 h-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />;
      case 'lifts':
        return <ArrowUpDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />;
      case 'washrooms':
        return <Bath className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />;
      case 'rest_seating':
        return <Armchair className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />;
      case 'wayfinding_sensory':
        return <Compass className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />;
    }
  };

  const pillarOrder: PillarId[] = ['step_free', 'lifts', 'washrooms', 'rest_seating', 'wayfinding_sensory'];

  return (
    <div className="space-y-3" aria-label="Accessibility pillar breakdown">
      {/* Hard Constraint Failure Notice */}
      {scoreResult.hardConstraintFailed && (
        <div
          role="alert"
          className="p-4 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-600 rounded-xl text-rose-900 dark:text-rose-100 flex items-start gap-3"
        >
          <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h4 className="font-bold text-base">Critical Barrier Detected for Your Selected Persona</h4>
            <p className="text-sm mt-1">
              This venue does not meet vital physical access thresholds:
            </p>
            <ul className="list-disc list-inside text-sm mt-1.5 space-y-0.5 font-semibold">
              {scoreResult.failedConstraintReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
            <p className="text-xs text-rose-800 dark:text-rose-200 mt-2">
              The overall persona match has been capped at {scoreResult.personaMatchPercentage}%.
            </p>
          </div>
        </div>
      )}

      {pillarOrder.map((pid) => {
        const pillar = scoreResult.pillars[pid];
        if (!pillar) return null;

        return (
          <div
            key={pid}
            className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                {getPillarIcon(pid)}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {pillar.title}
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Weighted impact: {pillar.normalizedWeight}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrafficLightBadge status={pillar.status} />
                {pillar.score !== null ? (
                  <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {pillar.score}/100
                  </span>
                ) : (
                  <span className="text-xs italic text-slate-500 dark:text-slate-400">
                    Unknown
                  </span>
                )}
              </div>
            </div>

            {/* Detailed physical observations */}
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              <ul className="space-y-1">
                {pillar.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
};
