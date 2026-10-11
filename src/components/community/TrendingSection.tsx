import React, { useState, useEffect } from 'react';
import { TrendingVenueItem } from '../../types/community';
import { Venue } from '../../types/accessibility';
import { useAccessibility } from '../../context/AccessibilityContext';
import { TrendingUp, Play, Pause, ChevronLeft, ChevronRight, Activity, MapPin } from 'lucide-react';

interface TrendingSectionProps {
  items: TrendingVenueItem[];
  onSelectVenue: (venue: Venue) => void;
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({ items, onSelectVenue }) => {
  const { reducedMotion, announce } = useAccessibility();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(!reducedMotion);
  const [isCarouselMode, setIsCarouselMode] = useState(true);

  // Auto-cycle carousel only if playing and reducedMotion is disabled
  useEffect(() => {
    if (!isPlaying || reducedMotion || !isCarouselMode || items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, reducedMotion, isCarouselMode, items.length]);

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % items.length;
    setCurrentIndex(nextIdx);
    announce(`Trending venue slide ${nextIdx + 1} of ${items.length}: ${items[nextIdx].venue.name}`);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + items.length) % items.length;
    setCurrentIndex(prevIdx);
    announce(`Trending venue slide ${prevIdx + 1} of ${items.length}: ${items[prevIdx].venue.name}`);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      announce(next ? 'Trending auto-scroll resumed' : 'Trending auto-scroll paused');
      return next;
    });
  };

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <section
      aria-labelledby="trending-title"
      className="p-5 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm"
    >
      {/* Title & Carousel Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="trending-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
              Trending Accessible Venues (Last 24h)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked by verified community visits, photos, and live slope checks
            </p>
          </div>
        </div>

        {/* WCAG 2.2.2 Compliant Controls: Pause/Play, Prev, Next, View Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCarouselMode((prev) => !prev)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 min-h-[36px]"
          >
            {isCarouselMode ? 'Switch to Static Grid' : 'Switch to Slide View'}
          </button>

          {isCarouselMode && (
            <>
              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title={isPlaying ? 'Pause automated cycling' : 'Resume automated cycling'}
                aria-label={isPlaying ? 'Pause automated cycling' : 'Resume automated cycling'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handlePrev}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Previous trending venue"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Next trending venue"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Carousel Slide Mode */}
      {isCarouselMode ? (
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Trending venues carousel"
          className="relative bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                {currentItem.activityCount24h} verified audits today
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Active {currentItem.lastActivityAt}
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {currentItem.venue.name}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {currentItem.venue.neighborhood}, {currentItem.venue.city}
            </p>

            <span className="inline-block text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2.5 py-1 rounded-lg">
              Highlight: {currentItem.highlightTag}
            </span>
          </div>

          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <div className="text-xs font-semibold text-slate-500">
              Slide {currentIndex + 1} of {items.length}
            </div>
            <button
              type="button"
              onClick={() => onSelectVenue(currentItem.venue)}
              className="px-5 py-2.5 bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-sm min-h-[44px] flex items-center gap-1"
            >
              <span>Explore Venue Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Static Grid Mode (Full Accessibility Alternative) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                  {item.activityCount24h} updates today
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                  {item.venue.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {item.venue.neighborhood}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectVenue(item.venue)}
                className="mt-3 text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline flex items-center justify-between"
              >
                <span>View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
