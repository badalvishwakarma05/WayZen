import React, { useEffect } from 'react';
import { CuratedGuide } from '../../types/community';
import { Venue } from '../../types/accessibility';
import { calculateVenueScore } from '../../scoring/engine';
import { useAuth } from '../../context/AuthContext';
import { X, MapPin, Share2, Bookmark, Check, Compass, ChevronRight } from 'lucide-react';

interface GuideDetailModalProps {
  guide: CuratedGuide | null;
  venues: Venue[];
  onClose: () => void;
  onSelectVenue: (venue: Venue) => void;
  onToggleSave: (guideId: string) => void;
}

export const GuideDetailModal: React.FC<GuideDetailModalProps> = ({
  guide,
  venues,
  onClose,
  onSelectVenue,
  onToggleSave,
}) => {
  const { selectedPersonas } = useAuth();
  const primaryPersona = selectedPersonas[0] || null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && guide) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guide, onClose]);

  if (!guide) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${guide.title} - Accessible Guide on AccessPath`,
        text: `Check out this step-free route in Bengaluru: ${guide.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Guide share link copied to clipboard!');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Curated Access Route
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {guide.neighborhood}, {guide.city}
              </span>
            </div>
            <h2 id="guide-modal-title" className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              {guide.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {guide.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(guide.id)}
              className={`p-2.5 rounded-full border min-h-[44px] min-w-[44px] flex items-center justify-center transition-all ${
                guide.isSaved
                  ? 'bg-sky-700 text-white border-sky-800'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
              title={guide.isSaved ? 'Guide saved in your profile' : 'Save guide'}
              aria-label={guide.isSaved ? 'Unsave guide' : 'Save guide'}
            >
              <Bookmark className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-full border border-slate-300 dark:border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Share guide link"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {guide.tags.map((t, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* Sequential Itinerary Stops */}
        <div className="space-y-4 mb-6" aria-label="Route itinerary stops">
          <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
            Step-by-Step Waypoint Stops ({guide.items.length})
          </h3>

          {guide.items.map((item, idx) => {
            const venue = venues.find((v) => v.id === item.venueId);
            const scoreRes = venue
              ? calculateVenueScore(venue.features, primaryPersona, venue.reviewsCount, venue.verificationStatus)
              : null;

            return (
              <div
                key={item.venueId}
                className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-700 text-white font-extrabold flex items-center justify-center text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      {venue ? venue.name : item.venueId}
                    </h4>
                    <p className="text-xs text-sky-800 dark:text-sky-300 font-medium mt-0.5">
                      Curator advice: "{item.curatorNotes}"
                    </p>
                    {scoreRes && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
                        <span>Score: <strong>{scoreRes.compositeScore}%</strong></span>
                        {primaryPersona && (
                          <span>Your Match: <strong>{scoreRes.personaMatchPercentage}%</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {venue && (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectVenue(venue);
                    }}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1 shrink-0 min-h-[40px]"
                  >
                    <span>View Venue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <span>{guide.followersCount} explorers saved this route</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl min-h-[44px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
