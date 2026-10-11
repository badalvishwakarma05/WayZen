import React from 'react';
import { CuratedGuide } from '../../types/community';
import { Compass, Bookmark, ChevronRight, Users, Sparkles } from 'lucide-react';

interface CuratedGuidesSectionProps {
  guides: CuratedGuide[];
  onSelectGuide: (guide: CuratedGuide) => void;
  onToggleSave: (guideId: string) => void;
}

export const CuratedGuidesSection: React.FC<CuratedGuidesSectionProps> = ({
  guides,
  onSelectGuide,
  onToggleSave,
}) => {
  return (
    <section aria-labelledby="curated-guides-title" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="curated-guides-title" className="text-xl font-extrabold text-slate-900 dark:text-white">
              Curated Community Guides
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified accessible trails, step-free cafe crawls, and sensory routes
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {guides.map((guide) => (
          <article
            key={guide.id}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  {guide.neighborhood}
                </span>

                <button
                  type="button"
                  onClick={() => onToggleSave(guide.id)}
                  className={`p-1.5 rounded-lg border text-xs min-h-[36px] min-w-[36px] flex items-center justify-center ${
                    guide.isSaved
                      ? 'bg-sky-700 text-white border-sky-800'
                      : 'text-slate-400 hover:text-slate-700 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-label={guide.isSaved ? `Unsave ${guide.title}` : `Save ${guide.title}`}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-1">
                {guide.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                {guide.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {guide.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {guide.followersCount} saved
              </span>

              <button
                type="button"
                onClick={() => onSelectGuide(guide)}
                className="flex items-center gap-1 text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline min-h-[36px]"
              >
                <span>Explore Route</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
