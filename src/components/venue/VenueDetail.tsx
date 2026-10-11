import React, { useEffect } from 'react';
import { Venue } from '../../types/accessibility';
import { calculateVenueScore } from '../../scoring/engine';
import { useAuth } from '../../context/AuthContext';
import { ConfidenceMeter } from './ConfidenceMeter';
import { PillarBreakdown } from './PillarBreakdown';
import { formatDistance } from '../../utils/geo';
import { X, MapPin, MessageSquarePlus, Share2, AlertTriangle, ShieldCheck, Camera, ShieldAlert, QrCode } from 'lucide-react';
import { AiSummaryCard } from '../community/AiSummaryCard';
import { fetchAiSummaryForVenue } from '../../services/aiSynthesisService';
import { AiSummaryResult, TemporaryAlert } from '../../types/community';

interface VenueDetailProps {
  venue: Venue | null;
  onClose: () => void;
  onOpenReview: (venue: Venue) => void;
  onOpenReportOutage?: (venue: Venue) => void;
  onOpenTableSideQr?: (venue: Venue) => void;
  onOpenSocialShare?: (venue: Venue) => void;
}

export const VenueDetail: React.FC<VenueDetailProps> = ({
  venue,
  onClose,
  onOpenReview,
  onOpenReportOutage,
  onOpenTableSideQr,
  onOpenSocialShare,
}) => {
  const { selectedPersonas } = useAuth();
  const primaryPersona = selectedPersonas[0] || null;
  const [aiSummary, setAiSummary] = React.useState<AiSummaryResult | null>(null);

  useEffect(() => {
    if (venue) {
      fetchAiSummaryForVenue(venue, primaryPersona || 'power_wheelchair').then((res) => {
        setAiSummary(res);
      });
    }
  }, [venue, primaryPersona]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && venue) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [venue, onClose]);

  if (!venue) return null;

  const scoreResult = calculateVenueScore(
    venue.features,
    primaryPersona,
    venue.reviewsCount,
    venue.verificationStatus
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${venue.name} Accessibility on AccessPath`,
        text: `Check out accessibility verification for ${venue.name} in Bengaluru on AccessPath.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="uppercase text-xs font-bold px-2.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                {venue.category}
              </span>
              {venue.distanceMeters !== undefined && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatDistance(venue.distanceMeters)} away
                </span>
              )}
            </div>
            <h2 id="venue-detail-title" className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              {venue.name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {venue.address} • {venue.neighborhood}, {venue.city}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {onOpenTableSideQr && (
              <button
                onClick={() => onOpenTableSideQr(venue)}
                className="p-2 text-slate-500 hover:text-sky-700 dark:hover:text-sky-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="View on-site table-side QR code"
                aria-label="View on-site table-side QR code"
              >
                <QrCode className="w-5 h-5 text-sky-600" />
              </button>
            )}

            <button
              onClick={() => {
                if (onOpenSocialShare) {
                  onOpenSocialShare(venue);
                } else {
                  handleShare();
                }
              }}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Share accessibility card"
              aria-label="Share this venue"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close venue details dialog"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scores Overview Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider block">
                Composite Score
              </span>
              <span className="text-3xl font-black text-sky-950 dark:text-sky-100">
                {scoreResult.compositeScore !== null ? `${scoreResult.compositeScore}/100` : 'Unknown'}
              </span>
              <span className="text-xs text-sky-800 dark:text-sky-300 block mt-0.5">
                Standard baseline weight
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                {primaryPersona ? 'Your Persona Match' : 'Selected Persona'}
              </span>
              <span
                className={`text-3xl font-black ${
                  scoreResult.hardConstraintFailed
                    ? 'text-rose-600'
                    : (scoreResult.personaMatchPercentage || 0) >= 70
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {primaryPersona ? `${scoreResult.personaMatchPercentage}%` : 'Standard'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                {primaryPersona ? 'Adjusted for your needs' : 'Configure persona for custom weights'}
              </span>
            </div>
          </div>
        </div>

        {/* Confidence & Verification */}
        <div className="mb-6">
          <ConfidenceMeter
            confidenceLevel={scoreResult.confidenceLevel}
            confidenceLabel={scoreResult.confidenceLabel}
            knownPillarsCount={scoreResult.knownPillarsCount}
            totalPillarsCount={5}
            verificationStatus={venue.verificationStatus}
            lastVerifiedAt={venue.lastVerifiedAt}
          />
        </div>

        {/* Verified Photos Gallery with Accessible Alt-Text View */}
        {venue.photos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-sky-600" aria-hidden="true" />
              Verified Access Photos ({venue.photos.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {venue.photos.map((photo) => (
                <figure
                  key={photo.id}
                  className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-200">
                    <img
                      src={photo.url}
                      alt={photo.altText}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="p-3 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                      Alt text description:
                    </p>
                    <p className="italic">"{photo.altText}"</p>
                    <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400">
                      <span>Contributor: {photo.authorName || 'Community'}</span>
                      {photo.verifiedAt && <span>Date: {photo.verifiedAt}</span>}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        {/* Quick Tags */}
        {venue.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Verified Quick Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {venue.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-sky-50 dark:bg-sky-950 text-sky-900 dark:text-sky-200 text-xs font-semibold rounded-full border border-sky-200 dark:border-sky-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Grounded Synthesis */}
        <div className="mb-6">
          <AiSummaryCard summary={aiSummary} venueName={venue.name} />
        </div>

        {/* Per-Pillar Breakdown */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            Structured 5-Pillar Accessibility Breakdown
          </h3>
          <PillarBreakdown scoreResult={scoreResult} />
        </div>

        {/* Community Verification Disclaimer (Mandatory Requirement) */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-bold block">Community Verification Disclaimer:</span>
            AccessPath accessibility scores and physical observations are reported by community mappers and OpenStreetMap. Conditions such as temporary ramp maintenance, elevator service, or furniture placement can change unexpectedly. Always verify mission-critical access with venue staff prior to travel.
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {venue.reviewsCount} verified community report{venue.reviewsCount === 1 ? '' : 's'} on record.
          </span>

          <div className="flex items-center gap-2">
            {onOpenReportOutage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReportOutage(venue);
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl font-bold text-xs min-h-[44px]"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Report Barrier / Outage</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenReview(venue);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-700 hover:bg-sky-600 text-white rounded-xl font-bold text-xs shadow-md min-h-[44px] focus:outline-none"
            >
              <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
              <span>Submit Verification</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
