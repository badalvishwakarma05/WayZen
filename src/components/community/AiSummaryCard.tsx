import React, { useState } from 'react';
import { AiSummaryResult } from '../../types/community';
import { reportInaccurateAiSummary } from '../../services/aiSynthesisService';
import { Sparkles, ThumbsDown, CheckCircle2, AlertOctagon, Flag, Check } from 'lucide-react';

interface AiSummaryCardProps {
  summary: AiSummaryResult | null;
  venueName: string;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({ summary, venueName }) => {
  const [hasReported, setHasReported] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');

  if (!summary) return null;

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    await reportInaccurateAiSummary(summary.id, reportReason);
    setHasReported(true);
    setShowReportDialog(false);
  };

  return (
    <div
      aria-label="AI Accessibility Synthesis"
      className="p-5 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/80 dark:from-slate-900 dark:via-slate-850 dark:to-indigo-950/40 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-sm"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-indigo-950 dark:text-indigo-200 tracking-tight">
              AI Grounded Accessibility Verdict
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Synthesized by Gemini API strictly from verified community reports
            </span>
          </div>
        </div>

        {/* Thumbs down / Report Action */}
        <div className="flex items-center gap-2">
          {hasReported ? (
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              Report Submitted
            </span>
          ) : (
            <button
              onClick={() => setShowReportDialog(true)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800 min-h-[36px]"
              title="Report inaccurate or hallucinated summary statement"
              aria-label="Report inaccurate AI summary"
            >
              <ThumbsDown className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Report Summary</span>
            </button>
          )}
        </div>
      </div>

      {/* Verdict (1-2 sentences with as of <date>) */}
      <div className="p-3.5 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-indigo-100 dark:border-indigo-900/60 mb-4">
        <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
          "{summary.verdict}"
        </p>
      </div>

      {/* Sparse Data Warning */}
      {summary.isSparse && (
        <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 mb-3">
          Notice: AccessPath does not invent facts. When reviews are sparse, statements reflect limited baseline data until additional community members verify on-site.
        </div>
      )}

      {/* Grounded Highlights & Watch-Outs */}
      {!summary.isSparse && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Highlights */}
          {summary.highlights.length > 0 && (
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <span className="font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1 mb-1.5 uppercase tracking-wider text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                Verified Highlights
              </span>
              <ul className="space-y-1 text-emerald-950 dark:text-emerald-100">
                {summary.highlights.map((h, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-bold">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Watch-Outs */}
          {summary.watchOuts.length > 0 && (
            <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/60">
              <span className="font-extrabold text-rose-900 dark:text-rose-200 flex items-center gap-1 mb-1.5 uppercase tracking-wider text-[11px]">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                Verified Watch-Outs
              </span>
              <ul className="space-y-1 text-rose-950 dark:text-rose-100">
                {summary.watchOuts.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Report dialog modal */}
      {showReportDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="mt-4 p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700"
        >
          <form onSubmit={handleReport} className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Why is this summary inaccurate or misleading?
            </label>
            <input
              type="text"
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. Ramp is no longer steep; venue installed a permanent 1:14 concrete ramp."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReportDialog(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 min-h-[36px]"
              >
                Send Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
