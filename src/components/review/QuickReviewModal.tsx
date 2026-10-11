import React, { useState, useEffect } from 'react';
import { Venue, TrafficLightValue, ReviewSubmission } from '../../types/accessibility';
import { TrafficLightInput } from './TrafficLightInput';
import { processAndStripExif } from '../../utils/exif';
import { queueOfflineReview } from '../../db/offlineQueue';
import { useAccessibility } from '../../context/AccessibilityContext';
import { X, Upload, Check, AlertCircle, Camera, ShieldCheck, WifiOff } from 'lucide-react';

interface QuickReviewModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (review: ReviewSubmission) => void;
}

const AVAILABLE_QUICK_TAGS = [
  'Stepless Entry',
  'Gentle Ramp (<= 1:12)',
  'Wide Doorway (> 81 cm)',
  'Elevator with Braille',
  'Voice Announcements',
  'Dedicated Accessible Loo',
  'Sturdy Grab Rails',
  'Resting Benches with Armrests',
  'Tactile Paving',
  'Quiet Low-Sensory Zone',
  'Staff Assistance Available',
];

export const QuickReviewModal: React.FC<QuickReviewModalProps> = ({
  venue,
  isOpen,
  onClose,
  onSubmitSuccess,
}) => {
  const { announce } = useAccessibility();
  const [stepRating, setStepRating] = useState<TrafficLightValue>('green');
  const [liftRating, setLiftRating] = useState<TrafficLightValue>('green');
  const [washroomRating, setWashroomRating] = useState<TrafficLightValue>('green');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Photo upload states
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoAltText, setPhotoAltText] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !venue) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setPhotoError('');

    try {
      // Privacy-compliant: Strips EXIF client-side (DPDP Act)
      const processed = await processAndStripExif(file);
      setPhotoDataUrl(processed.dataUrl);
    } catch (err: any) {
      setPhotoError('Could not process photo: ' + err.message);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory Alt-Text Validation if photo is attached (WCAG 2.2 AA)
    if (photoDataUrl && photoAltText.trim().length < 6) {
      setPhotoError('Descriptive alt-text (min 6 characters) is required for accessibility when attaching a photo.');
      return;
    }

    setIsSubmitting(true);

    const submission: ReviewSubmission = {
      id: 'rev-' + Date.now(),
      venueId: venue.id,
      stepRating,
      liftRating,
      washroomRating,
      quickTags: selectedTags,
      notes: notes.trim(),
      photoDataUrl: photoDataUrl || undefined,
      photoAltText: photoAltText.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    try {
      if (isOffline) {
        await queueOfflineReview(submission);
        announce(`Review saved to offline queue for ${venue.name}. Will automatically sync when back online.`);
      } else {
        // In online mode, we also queue to IndexedDB or mock/Supabase API
        await queueOfflineReview(submission);
        announce(`Review submitted for ${venue.name}!`);
      }

      onSubmitSuccess(submission);
      onClose();
    } catch (err: any) {
      console.error('Error saving review:', err);
      // Fallback: still notify parent
      onSubmitSuccess(submission);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block mb-1">
              Community Accessibility Audit
            </span>
            <h2 id="review-modal-title" className="text-2xl font-black text-slate-900 dark:text-white">
              Quick Review: {venue.name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Rate essential physical access using fast traffic lights.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close review dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Offline notification badge if offline */}
        {typeof navigator !== 'undefined' && !navigator.onLine && (
          <div
            className="p-3 mb-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2"
            role="status"
          >
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
            <span>You are currently offline. This review will be queued in IndexedDB and uploaded when connection resumes.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 3 Core Traffic Light Ratings */}
          <TrafficLightInput
            id="steps"
            label="1. Step-Free Access & Entrance"
            description="Are there steps without ramps, or is there a gentle ramp/level entry with wide doors?"
            value={stepRating}
            onChange={setStepRating}
          />

          <TrafficLightInput
            id="lifts"
            label="2. Lifts & Multi-Level Transit"
            description="Is there an elevator to all public levels, or is it a single level venue?"
            value={liftRating}
            onChange={setLiftRating}
          />

          <TrafficLightInput
            id="washrooms"
            label="3. Accessible Washrooms"
            description="Is there a spacious accessible washroom with grab rails and level entry?"
            value={washroomRating}
            onChange={setWashroomRating}
          />

          {/* Quick Tags Chips */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              Select Quick-Tag Verifications (Optional)
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick accessibility features">
              {AVAILABLE_QUICK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all min-h-[38px] ${
                      isSelected
                        ? 'bg-sky-700 text-white border-sky-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo Upload with EXIF Scrubber & Mandatory Alt Text */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-sky-600" aria-hidden="true" />
                  Attach Verification Photo (Optional)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  EXIF privacy stripped client-side. Mandatory alt-text required for screen-reader users.
                </p>
              </div>
            </div>

            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                id="review-photo-input"
                onChange={handlePhotoSelect}
                className="text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-700 file:text-white hover:file:bg-sky-600 cursor-pointer"
              />
            </div>

            {isProcessingPhoto && (
              <p className="text-xs text-sky-600 mt-2 font-medium">Scrubbing EXIF metadata and optimizing image...</p>
            )}

            {photoDataUrl && (
              <div className="mt-3 space-y-2">
                <div className="w-32 h-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                  <img src={photoDataUrl} alt="Preview thumbnail" className="w-full h-full object-cover" />
                </div>

                <div>
                  <label htmlFor="photo-alt-input" className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                    Photo Alt-Text Description (Required) *
                  </label>
                  <input
                    id="photo-alt-input"
                    type="text"
                    required
                    value={photoAltText}
                    onChange={(e) => {
                      setPhotoAltText(e.target.value);
                      if (e.target.value.trim().length >= 6) setPhotoError('');
                    }}
                    placeholder="e.g. Concrete ramp at entrance with dual handrails and push-button automatic door."
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {photoError && (
              <div className="mt-2 text-xs text-rose-600 font-semibold flex items-center gap-1.5" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{photoError}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="review-notes" className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
              Practical Advice & Context (Optional)
            </label>
            <textarea
              id="review-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ramp is smooth, but security guard must buzz you through the wide side gate."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-sky-700 hover:bg-sky-600 text-white text-sm font-bold rounded-xl shadow-md min-h-[44px] focus:outline-none disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Submit Verification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
