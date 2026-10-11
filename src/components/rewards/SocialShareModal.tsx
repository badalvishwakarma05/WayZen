import React, { useState, useEffect } from 'react';
import { Venue } from '../../types/accessibility';
import { calculateVenueScore } from '../../scoring/engine';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { X, Share2, Copy, Check, Upload, Sparkles, ShieldCheck } from 'lucide-react';

interface SocialShareModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitShareProof: (venueId: string, shareUrl: string) => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  venue,
  isOpen,
  onClose,
  onSubmitShareProof,
}) => {
  const { announce } = useAccessibility();
  const { selectedPersonas } = useAuth();
  const primaryPersona = selectedPersonas[0] || null;

  const [copiedCaption, setCopiedCaption] = useState(false);
  const [shareLinkInput, setShareLinkInput] = useState('');
  const [proofSubmitted, setProofSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !venue) return null;

  const scoreResult = calculateVenueScore(
    venue.features,
    primaryPersona,
    venue.reviewsCount,
    venue.verificationStatus
  );

  const captionText = `♿ Verified Accessibility on AccessPath for ${venue.name} in ${venue.city}!
Overall Score: ${scoreResult.compositeScore}% (${scoreResult.confidenceLabel} confidence).
Step-Free: ${scoreResult.pillars.step_free.score ?? 'N/A'}% | Lifts: ${scoreResult.pillars.lifts.score ?? 'N/A'}% | Restrooms: ${scoreResult.pillars.washrooms.score ?? 'N/A'}%.
Check verified physical data: https://accesspath.in/venue/${venue.id} #AccessPath #AccessibleIndia #Bengaluru`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${venue.name} Accessibility Card on AccessPath`,
          text: captionText,
          url: `https://accesspath.in/venue/${venue.id}`,
        });
        announce('Share dialogue opened.');
      } catch {
        // cancelled by user
      }
    } else {
      handleCopyCaption();
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(captionText);
    setCopiedCaption(true);
    announce('Share caption and card text copied to clipboard.');
    setTimeout(() => setCopiedCaption(false), 3000);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareLinkInput.trim()) return;

    onSubmitShareProof(venue.id, shareLinkInput.trim());
    setProofSubmitted(true);
    announce('Share proof link submitted for verification.');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 block mb-0.5">
              Community Growth & Awareness
            </span>
            <h2 id="share-modal-title" className="text-xl font-black text-slate-900 dark:text-white">
              Share Accessibility Card
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close share dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Shareable Card Visual Preview */}
        <div className="p-5 bg-gradient-to-br from-sky-900 via-indigo-950 to-slate-950 text-white rounded-2xl shadow-lg border border-sky-500/30 mb-5 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
              AccessPath India Verified
            </span>
            <span className="text-[11px] font-bold text-sky-200">
              {venue.neighborhood}
            </span>
          </div>

          <h3 className="text-lg font-black tracking-tight mb-1">
            {venue.name}
          </h3>

          <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
            <div>
              <span className="text-[10px] text-sky-200 uppercase font-semibold block">Composite Score</span>
              <span className="text-2xl font-black">{scoreResult.compositeScore}%</span>
            </div>
            <div>
              <span className="text-[10px] text-sky-200 uppercase font-semibold block">Data Confidence</span>
              <span className="text-sm font-bold text-emerald-300 mt-1 block">
                {scoreResult.confidenceLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-200">
            {venue.tags.slice(0, 3).map((t, i) => (
              <span key={i} className="px-2 py-0.5 bg-white/10 rounded-md">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-sky-300">
            <span>#AccessPath #Bengaluru</span>
            <span>accesspath.in</span>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md min-h-[44px]"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via App / Web Share</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCaption}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-100 min-h-[44px]"
          >
            {copiedCaption ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCaption ? 'Copied!' : 'Copy Caption'}</span>
          </button>
        </div>

        {/* Quality Contribution Proof Reward Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Earn Community Contributor Points
              </span>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                We reward quality awareness contributions verified by moderators—never fake likes or views.
              </p>
            </div>
          </div>

          {proofSubmitted ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Link submitted for moderator verification. Thank you for raising accessibility awareness!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitProof} className="space-y-2 mt-2">
              <label htmlFor="share-link-input" className="sr-only">
                Social share link or post URL
              </label>
              <div className="flex gap-2">
                <input
                  id="share-link-input"
                  type="url"
                  required
                  value={shareLinkInput}
                  onChange={(e) => setShareLinkInput(e.target.value)}
                  placeholder="Paste your post link (e.g. X, LinkedIn, Instagram)"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none min-h-[40px]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl min-h-[40px]"
                >
                  Submit Proof
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
