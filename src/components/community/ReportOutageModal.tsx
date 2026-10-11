import React, { useState, useEffect } from 'react';
import { Venue } from '../../types/accessibility';
import { AlertType, TemporaryAlert } from '../../types/community';
import { evaluateAlertActivation } from '../../scoring/reputation';
import { useAccessibility } from '../../context/AccessibilityContext';
import { X, AlertTriangle, Check, ShieldAlert } from 'lucide-react';

interface ReportOutageModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitAlert: (alert: TemporaryAlert) => void;
}

export const ReportOutageModal: React.FC<ReportOutageModalProps> = ({
  venue,
  isOpen,
  onClose,
  onSubmitAlert,
}) => {
  const { announce } = useAccessibility();
  const [alertType, setAlertType] = useState<AlertType>('lift_out_of_service');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !venue) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);

    // Mock user trust score (e.g. 60 for trusted mapper)
    const userTrustScore = 65;
    const isDirectlyActive = evaluateAlertActivation(1, userTrustScore);

    const newAlert: TemporaryAlert = {
      id: 'alert-' + Date.now(),
      venueId: venue.id,
      venueName: venue.name,
      alertType,
      description: description.trim(),
      reporterTrustScore: userTrustScore,
      confirmationCount: 1,
      isActive: isDirectlyActive,
      reportedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    };

    onSubmitAlert(newAlert);
    announce(`Temporary status alert reported for ${venue.name}.`);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="outage-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-2xl">
              <ShieldAlert className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="outage-modal-title" className="text-xl font-extrabold text-slate-900 dark:text-white">
                Report Temporary Barrier
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {venue.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="alert-type-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Barrier Type *
            </label>
            <select
              id="alert-type-select"
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as AlertType)}
              className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none min-h-[44px]"
            >
              <option value="lift_out_of_service">Elevator / Lift Out of Service</option>
              <option value="ramp_under_maintenance">Ramp Under Maintenance / Obstructed</option>
              <option value="washroom_closed">Accessible Washroom Closed / Locked</option>
              <option value="construction_obstacle">Street Construction / Broken Pavement</option>
              <option value="entrance_blocked">Accessible Entrance Temporarily Blocked</option>
            </select>
          </div>

          <div>
            <label htmlFor="alert-desc-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Specific Situation & Advice *
            </label>
            <textarea
              id="alert-desc-input"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Main elevator is showing out of order sign. Security says maintenance will finish by tomorrow evening."
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold block text-slate-800 dark:text-slate-200 mb-0.5">
              Community Verification Rules:
            </span>
            Alerts activate immediately when submitted by trusted reviewers ($\ge 50$ trust) or upon 2 community confirmations, and automatically expire after 48 hours.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md min-h-[44px] disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Broadcast Live Alert</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
