import React from 'react';
import { TemporaryAlert } from '../../types/community';
import { AlertTriangle, Clock, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';

interface TemporaryAlertBannerProps {
  alerts: TemporaryAlert[];
  onSelectVenue?: (venueId: string) => void;
  onConfirmAlert?: (alertId: string) => void;
}

export const TemporaryAlertBanner: React.FC<TemporaryAlertBannerProps> = ({
  alerts,
  onSelectVenue,
  onConfirmAlert,
}) => {
  const activeAlerts = alerts.filter((a) => a.isActive);

  if (activeAlerts.length === 0) return null;

  const calculateHoursRemaining = (expiresAt: string): number => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60)));
  };

  return (
    <aside
      aria-label="Real-time accessibility status alerts"
      className="space-y-2 mb-4"
    >
      {activeAlerts.map((alert) => {
        const hoursLeft = calculateHoursRemaining(alert.expiresAt);
        const isTrusted = alert.reporterTrustScore >= 50;

        return (
          <div
            key={alert.id}
            role="alert"
            className="p-3.5 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-600 rounded-2xl text-rose-950 dark:text-rose-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-extrabold text-sm uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    Live Status Alert: {alert.venueName}
                  </span>
                  {isTrusted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                      Trusted Reporter ({alert.reporterTrustScore}% trust)
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                      Confirmed by {alert.confirmationCount} community mappers
                    </span>
                  )}
                </div>

                <p className="text-xs md:text-sm font-semibold text-rose-900 dark:text-rose-100">
                  {alert.description}
                </p>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-rose-700 dark:text-rose-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    Auto-expires in ~{hoursLeft} hours unless re-confirmed
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              {onConfirmAlert && (
                <button
                  type="button"
                  onClick={() => onConfirmAlert(alert.id)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100 text-xs font-bold rounded-xl hover:bg-rose-100 min-h-[40px] flex items-center gap-1"
                  aria-label={`Confirm outage is still active for ${alert.venueName}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                  <span>Still Broken</span>
                </button>
              )}

              {onSelectVenue && (
                <button
                  type="button"
                  onClick={() => onSelectVenue(alert.venueId)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl min-h-[40px] flex items-center gap-1"
                >
                  <span>View Venue</span>
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </aside>
  );
};
