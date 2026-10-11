import React, { useState, useEffect } from 'react';
import { ModerationReport } from '../../types/community';
import { INITIAL_REPORTS_QUEUE } from '../../db/communityData';
import { useAccessibility } from '../../context/AccessibilityContext';
import { X, ShieldAlert, Check, Ban, Eye, Flag } from 'lucide-react';

interface ModerationDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModerationDashboardModal: React.FC<ModerationDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { announce } = useAccessibility();
  const [reports, setReports] = useState<ModerationReport[]>(INITIAL_REPORTS_QUEUE);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleResolve = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'resolved' as const } : r))
    );
    announce('Report marked as resolved.');
  };

  const handleDismiss = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'dismissed' as const } : r))
    );
    announce('Report dismissed.');
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mod-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-2xl">
              <ShieldAlert className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="mod-modal-title" className="text-2xl font-black text-slate-900 dark:text-white">
                Community Moderation & Anti-Abuse
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review flagged submissions, geofence violations, and reported summaries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Pending Queue</span>
            <span className="text-2xl font-extrabold text-amber-600">{pendingReports.length}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Resolved</span>
            <span className="text-2xl font-extrabold text-emerald-600">
              {reports.filter((r) => r.status === 'resolved').length}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Geofence Violations</span>
            <span className="text-2xl font-extrabold text-sky-600">1</span>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Pending Community Flags
          </h3>

          {pendingReports.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-850 rounded-2xl border">
              Zero pending reports! The community database is clean and verified.
            </div>
          ) : (
            pendingReports.map((report) => (
              <div
                key={report.id}
                className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      Flag: {report.targetType}
                    </span>
                    <span className="text-xs text-slate-400">
                      Target ID: {report.targetId}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {report.reason}
                  </h4>
                  {report.details && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {report.details}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                  <button
                    onClick={() => handleDismiss(report.id)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 min-h-[40px]"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleResolve(report.id)}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl min-h-[40px] flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Take Action & Resolve</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl min-h-[44px]"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
