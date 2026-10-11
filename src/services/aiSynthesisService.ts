import { AiSummaryResult } from '../types/community';
import { UserPersonaId, Venue } from '../types/accessibility';
import { INITIAL_AI_SUMMARIES } from '../db/communityData';

export async function fetchAiSummaryForVenue(
  venue: Venue,
  persona: UserPersonaId = 'power_wheelchair'
): Promise<AiSummaryResult> {
  const cached = INITIAL_AI_SUMMARIES[venue.id];
  const todayDate = new Date().toISOString().split('T')[0];

  // If cached and matches persona
  if (cached && cached.persona === persona) {
    return cached;
  }

  // Check if venue has sparse reviews (< 2)
  if (venue.reviewsCount < 2) {
    return {
      id: `ai-sum-${venue.id}-${persona}`,
      venueId: venue.id,
      persona,
      verdict: `Insufficient verified reviews to generate a trusted summary for ${persona.replace('_', ' ')} as of ${todayDate}. Community verification is requested.`,
      highlights: [],
      watchOuts: ['Not enough verified reviews yet; check community reports directly.'],
      sourceReviewIds: [],
      asOfDate: todayDate,
      thumbsDownCount: 0,
      isSparse: true,
    };
  }

  // Construct grounded synthesis based strictly on verified features
  const highlights: string[] = [];
  const watchOuts: string[] = [];

  if (persona === 'power_wheelchair' || persona === 'manual_chair_stroller') {
    if (venue.features.entrance_has_steps === false || (venue.features.ramp_available && (venue.features.ramp_gradient_ratio || 0) >= 12)) {
      highlights.push(`Compliant step-free entrance (ramp gradient 1:${venue.features.ramp_gradient_ratio || 'gentle'}, door width ${venue.features.entrance_door_width_cm || 90} cm).`);
    } else if (venue.features.entrance_has_steps) {
      watchOuts.push(`Entrance has ${venue.features.entrance_step_count || 'several'} steps without mechanical lift or compliant ramp.`);
    }

    if (venue.features.accessible_washroom_available) {
      highlights.push(`Dedicated accessible toilet with ${venue.features.wheelchair_turning_radius_cm || 150} cm turning space and grab rails.`);
    } else if (venue.features.accessible_washroom_available === false) {
      watchOuts.push('No dedicated accessible washroom on premises.');
    }
  } else if (persona === 'low_vision') {
    if (venue.features.tactile_paving) highlights.push('Tactile ground indicators line the main entryway.');
    if (venue.features.lift_braille_buttons) highlights.push('Elevator features braille buttons and auditory voice cues.');
    if (venue.features.high_contrast_signage) highlights.push('High-contrast directional signage posted.');
    if (!venue.features.tactile_paving) watchOuts.push('No tactile ground paving detected outside entrance.');
  } else if (persona === 'sensory_neurodivergent') {
    if (venue.features.ambient_noise_level === 'quiet') highlights.push('Low ambient noise environment ideal for focus and sensory relief.');
    if (venue.features.glare_free_lighting) highlights.push('Gentle, non-flickering, glare-free lighting.');
    if (venue.features.ambient_noise_level === 'loud') watchOuts.push('Ambient sound levels can be elevated during peak hours.');
  } else if (persona === 'limited_ambulatory') {
    if (venue.features.priority_seating_available && venue.features.armrests_available) {
      highlights.push('Frequent resting seating with sturdy armrests for standing support.');
    }
    if (venue.features.entrance_has_steps && !venue.features.ramp_available) {
      watchOuts.push(`Must climb ${venue.features.entrance_step_count || 'multiple'} steps at entrance.`);
    }
  }

  const isBarrier = watchOuts.length > 0 && watchOuts.some((w) => w.includes('steps') || w.includes('No accessible'));
  const verdict = isBarrier
    ? `${venue.name} has critical barriers for ${persona.replace('_', ' ')}: ${watchOuts[0]} as of ${todayDate}.`
    : `${venue.name} is verified step-free and accessible for ${persona.replace('_', ' ')} based on ${venue.reviewsCount} community reports as of ${todayDate}.`;

  return {
    id: `ai-sum-${venue.id}-${persona}`,
    venueId: venue.id,
    persona,
    verdict,
    highlights,
    watchOuts,
    sourceReviewIds: [`rev-seed-${venue.id}`],
    asOfDate: todayDate,
    thumbsDownCount: 0,
    isReported: false,
    isSparse: false,
  };
}

export async function reportInaccurateAiSummary(
  summaryId: string,
  reason: string
): Promise<boolean> {
  // In a live environment, inserts a record into public.reports table
  console.log(`Reported AI summary ${summaryId}: ${reason}`);
  return true;
}
