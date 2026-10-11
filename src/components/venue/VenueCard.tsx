import React from 'react';
import { Venue } from '../../types/accessibility';
import { calculateVenueScore } from '../../scoring/engine';
import { useAuth } from '../../context/AuthContext';
import { TrafficLightBadge } from '../a11y/TrafficLightBadge';
import { formatDistance } from '../../utils/geo';
import { MapPin, Camera, Star, AlertCircle, ChevronRight, MessageSquarePlus, QrCode } from 'lucide-react';

interface VenueCardProps {
  venue: Venue;
  onSelect: (venue: Venue) => void;
  onOpenReview: (venue: Venue) => void;
  onOpenTableSideQr?: (venue: Venue) => void;
  isSelected?: boolean;
}

export const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  onSelect,
  onOpenReview,
  onOpenTableSideQr,
  isSelected,
}) => {
  const { selectedPersonas } = useAuth();
  const primaryPersona = selectedPersonas[0] || null;

  const scoreResult = calculateVenueScore(
    venue.features,
    primaryPersona,
    venue.reviewsCount,
    venue.verificationStatus
  );

  const primaryPhoto = venue.photos[0];

  return (
    <article
      className={`rounded-2xl border-2 transition-all duration-200 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md ${
        isSelected
          ? 'border-sky-600 ring-4 ring-sky-200 dark:ring-sky-900'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
      aria-labelledby={`venue-title-${venue.id}`}
    >
      <div className="p-5">
        {/* Top Header: Category & Distance */}
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          <span className="uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {venue.category}
          </span>
          {venue.distanceMeters !== undefined && (
            <span className="flex items-center gap-1 font-bold text-sky-700 dark:text-sky-400">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              {formatDistance(venue.distanceMeters)} away
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          id={`venue-title-${venue.id}`}
          className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1"
        >
          {venue.name}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-1">
          {venue.neighborhood}, {venue.city}
        </p>

        {/* Scoring Badges */}
        <div className="grid grid-cols-2 gap-2.5 mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              Overall Score
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {scoreResult.compositeScore !== null ? `${scoreResult.compositeScore}%` : 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              {primaryPersona ? 'Your Match' : 'Confidence'}
            </span>
            {primaryPersona ? (
              <span
                className={`text-xl font-extrabold ${
                  scoreResult.hardConstraintFailed
                    ? 'text-rose-600'
                    : (scoreResult.personaMatchPercentage || 0) >= 70
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {scoreResult.personaMatchPercentage}%
              </span>
            ) : (
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                {scoreResult.confidenceLabel} ({Math.round(scoreResult.confidenceLevel * 100)}%)
              </span>
            )}
          </div>
        </div>

        {/* Hard Constraint Alert Notice */}
        {scoreResult.hardConstraintFailed && (
          <div
            className="mb-4 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
            <span className="font-semibold line-clamp-1">
              Barrier: {scoreResult.failedConstraintReasons[0]}
            </span>
          </div>
        )}

        {/* Mini Traffic Light Indicators */}
        <div className="space-y-1.5 mb-4" aria-label="Key Pillar Quick Overview">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Step-Free Entry:</span>
            <TrafficLightBadge status={scoreResult.pillars.step_free.status} size="sm" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Lifts & Levels:</span>
            <TrafficLightBadge status={scoreResult.pillars.lifts.status} size="sm" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Accessible Washroom:</span>
            <TrafficLightBadge status={scoreResult.pillars.washrooms.status} size="sm" />
          </div>
        </div>

        {/* Photo Preview with Alt Text indicator */}
        {primaryPhoto && (
          <div className="relative mb-4 rounded-xl overflow-hidden aspect-video bg-slate-100">
            <img
              src={primaryPhoto.url}
              alt={primaryPhoto.altText}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white text-xs flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                Verified Photo
              </span>
              <span className="text-[11px] opacity-80 truncate max-w-[200px]" title={primaryPhoto.altText}>
                "{primaryPhoto.altText}"
              </span>
            </div>
          </div>
        )}

        {/* Quick Tags Chips */}
        <div className="flex flex-wrap gap-1.5 mb-5" aria-label="Venue features tags">
          {venue.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              {tag}
            </span>
          ))}
          {venue.tags.length > 3 && (
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              +{venue.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onSelect(venue)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-700 hover:bg-sky-600 text-white rounded-xl font-semibold text-sm shadow-sm min-h-[44px] focus:outline-none"
            aria-label={`View full accessibility details for ${venue.name}`}
          >
            <span>View Full Details</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>

          {onOpenTableSideQr && (
            <button
              onClick={() => onOpenTableSideQr(venue)}
              className="flex items-center justify-center p-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl min-h-[44px] min-w-[44px] focus:outline-none"
              title={`View Table-Side on-site QR for ${venue.name}`}
              aria-label={`View Table-Side on-site QR for ${venue.name}`}
            >
              <QrCode className="w-5 h-5 text-sky-600" aria-hidden="true" />
            </button>
          )}

          <button
            onClick={() => onOpenReview(venue)}
            className="flex items-center justify-center p-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl min-h-[44px] min-w-[44px] focus:outline-none"
            title={`Submit fast accessibility review for ${venue.name}`}
            aria-label={`Submit accessibility review for ${venue.name}`}
          >
            <MessageSquarePlus className="w-5 h-5 text-sky-700 dark:text-sky-400" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};
