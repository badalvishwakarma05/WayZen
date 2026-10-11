import React, { useEffect } from 'react';
import { Venue } from '../../types/accessibility';
import { useAccessibility } from '../../context/AccessibilityContext';
import { X, QrCode, ScanLine, ExternalLink, CheckCircle2, Sparkles } from 'lucide-react';

interface TableSideQrModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  onSimulateScan: (venue: Venue) => void;
}

export const TableSideQrModal: React.FC<TableSideQrModalProps> = ({
  venue,
  isOpen,
  onClose,
  onSimulateScan,
}) => {
  const { announce } = useAccessibility();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !venue) return null;

  const deepLink = `https://accesspath.in/venue/${venue.id}?source=tableside_qr&code=TBL-${venue.id.slice(-4).toUpperCase()}`;

  const handleScanClick = () => {
    announce(`Simulated table-side scan for ${venue.name}. Launching verified review flow.`);
    onClose();
    onSimulateScan(venue);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 max-h-[92vh] overflow-y-auto text-center">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 block">
              Table-Side On-Site Discovery
            </span>
            <h2 id="qr-modal-title" className="text-xl font-black text-slate-900 dark:text-white">
              Scan to Verify Accessibility
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-left mb-6">
          Venue Table Placard for <strong>{venue.name}</strong>. Guests scan this table-side QR to audit ramps, lifts, and washrooms with automatic physical verification.
        </p>

        {/* QR Code Presentation Box */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-sky-400 inline-block mb-4 shadow-inner">
          <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-md mx-auto flex flex-col items-center justify-center">
            {/* High Contrast Stylized QR SVG */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-slate-900"
              fill="currentColor"
              aria-label={`QR Code for ${venue.name}`}
            >
              {/* Corner position squares */}
              <rect x="5" y="5" width="28" height="28" rx="4" />
              <rect x="9" y="9" width="20" height="20" fill="white" />
              <rect x="13" y="13" width="12" height="12" />

              <rect x="67" y="5" width="28" height="28" rx="4" />
              <rect x="71" y="9" width="20" height="20" fill="white" />
              <rect x="75" y="13" width="12" height="12" />

              <rect x="5" y="67" width="28" height="28" rx="4" />
              <rect x="9" y="71" width="20" height="20" fill="white" />
              <rect x="13" y="75" width="12" height="12" />

              {/* Data module pattern */}
              <rect x="40" y="8" width="8" height="8" />
              <rect x="52" y="14" width="8" height="8" />
              <rect x="40" y="24" width="14" height="6" />

              <rect x="10" y="42" width="12" height="8" />
              <rect x="28" y="44" width="8" height="12" />
              <rect x="42" y="38" width="16" height="16" rx="2" />
              <rect x="64" y="42" width="12" height="8" />
              <rect x="82" y="40" width="10" height="14" />

              <rect x="40" y="62" width="8" height="14" />
              <rect x="54" y="68" width="12" height="8" />
              <rect x="70" y="64" width="14" height="12" />
              <rect x="48" y="82" width="14" height="10" />
              <rect x="72" y="82" width="18" height="10" />
            </svg>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500 mt-2 block">
            TBL-{venue.id.slice(-4).toUpperCase()}
          </span>
        </div>

        {/* Benefits badge */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 text-left mb-6 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Automatic Geofence Guarantee:</strong> Scanning table-side QR verifies physical presence immediately, qualifying you for the +50 base review points.
          </span>
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleScanClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-700 hover:bg-sky-600 text-white font-bold text-sm rounded-xl shadow-md min-h-[44px]"
          >
            <ScanLine className="w-5 h-5" />
            <span>Simulate Scanning This QR Code</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
