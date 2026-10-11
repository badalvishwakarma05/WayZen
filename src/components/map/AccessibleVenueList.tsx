import React, { useState } from 'react';
import { Venue } from '../../types/accessibility';
import { VenueCard } from '../venue/VenueCard';
import { calculateVenueScore } from '../../scoring/engine';
import { useAuth } from '../../context/AuthContext';
import { ArrowUpDown, SlidersHorizontal, Search } from 'lucide-react';

interface AccessibleVenueListProps {
  venues: Venue[];
  onSelectVenue: (venue: Venue) => void;
  onOpenReview: (venue: Venue) => void;
  onOpenTableSideQr?: (venue: Venue) => void;
}

export type SortMode = 'distance' | 'score' | 'persona_match';

export const AccessibleVenueList: React.FC<AccessibleVenueListProps> = ({
  venues,
  onSelectVenue,
  onOpenReview,
  onOpenTableSideQr,
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('distance');
  const { selectedPersonas } = useAuth();
  const primaryPersona = selectedPersonas[0] || null;

  const sortedVenues = [...venues].sort((a, b) => {
    if (sortMode === 'distance') {
      return (a.distanceMeters || 0) - (b.distanceMeters || 0);
    }
    if (sortMode === 'score') {
      const scoreA = calculateVenueScore(a.features).compositeScore || 0;
      const scoreB = calculateVenueScore(b.features).compositeScore || 0;
      return scoreB - scoreA;
    }
    if (sortMode === 'persona_match') {
      const matchA = calculateVenueScore(a.features, primaryPersona).personaMatchPercentage || 0;
      const matchB = calculateVenueScore(b.features, primaryPersona).personaMatchPercentage || 0;
      return matchB - matchA;
    }
    return 0;
  });

  return (
    <section
      aria-label="Accessible list of venues"
      className="space-y-4"
      id="accessible-venue-list"
    >
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-semibold">
          <SlidersHorizontal className="w-4 h-4 text-sky-600" aria-hidden="true" />
          <span>{sortedVenues.length} Venues Found</span>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <label htmlFor="venue-sort-select" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Sort by:
          </label>
          <select
            id="venue-sort-select"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none min-h-[44px]"
          >
            <option value="distance">Nearest Distance</option>
            <option value="score">Highest Composite Score</option>
            {primaryPersona && <option value="persona_match">Best Persona Match %</option>}
          </select>
        </div>
      </div>

      {/* Grid of Venue Cards */}
      {sortedVenues.length === 0 ? (
        <div
          role="status"
          className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
        >
          <Search className="w-8 h-8 mx-auto mb-2 text-slate-400" aria-hidden="true" />
          <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">No matching venues found</h4>
          <p className="text-sm mt-1">Try expanding your search radius or selecting a different neighborhood.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedVenues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              onSelect={onSelectVenue}
              onOpenReview={onOpenReview}
              onOpenTableSideQr={onOpenTableSideQr}
            />
          ))}
        </div>
      )}
    </section>
  );
};
