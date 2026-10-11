import {
  CompositeScoreResult,
  PillarId,
  PillarScoreResult,
  TrafficLightValue,
  UserPersonaId,
  VenueFeatures,
} from '../types/accessibility';

// Base pillar weights (sum to 100)
export const DEFAULT_PILLAR_WEIGHTS: Record<PillarId, number> = {
  step_free: 25,
  lifts: 20,
  washrooms: 25,
  rest_seating: 15,
  wayfinding_sensory: 15,
};

// Persona-specific pillar weights (sum to 100)
export const PERSONA_WEIGHTS: Record<UserPersonaId, Record<PillarId, number>> = {
  power_wheelchair: {
    step_free: 35,
    lifts: 30,
    washrooms: 25,
    rest_seating: 5,
    wayfinding_sensory: 5,
  },
  manual_chair_stroller: {
    step_free: 35,
    lifts: 25,
    washrooms: 25,
    rest_seating: 10,
    wayfinding_sensory: 5,
  },
  low_vision: {
    step_free: 20,
    lifts: 20,
    washrooms: 10,
    rest_seating: 10,
    wayfinding_sensory: 40,
  },
  sensory_neurodivergent: {
    step_free: 10,
    lifts: 5,
    washrooms: 15,
    rest_seating: 25,
    wayfinding_sensory: 45,
  },
  limited_ambulatory: {
    step_free: 30,
    lifts: 20,
    washrooms: 15,
    rest_seating: 35,
    wayfinding_sensory: 0,
  },
};

/**
 * Pure function: Evaluates Step-Free Access pillar
 * Thresholds: Ramp gradient <= 1:12 (ratio >= 12), Door width >= 81cm, Threshold <= 1.5cm
 */
export function evaluateStepFree(features: VenueFeatures): {
  score: number | null;
  status: TrafficLightValue;
  details: string[];
  hardFailReason?: string;
} {
  const details: string[] = [];
  const checks: { val: number; weight: number }[] = [];

  // Check 1: Entrance steps & ramps
  if (features.entrance_has_steps !== undefined) {
    if (!features.entrance_has_steps) {
      checks.push({ val: 100, weight: 40 });
      details.push('Zero-step ground level entrance.');
    } else {
      // Steps present: ramp required
      if (features.ramp_available === true) {
        if (features.ramp_gradient_ratio !== undefined) {
          // Standard: 1:12 ratio or gentler (ratio >= 12)
          if (features.ramp_gradient_ratio >= 12) {
            checks.push({ val: 100, weight: 40 });
            details.push(`Compliant gentle ramp present (1:${features.ramp_gradient_ratio} slope).`);
          } else if (features.ramp_gradient_ratio >= 8) {
            checks.push({ val: 60, weight: 40 });
            details.push(`Steep ramp (1:${features.ramp_gradient_ratio} slope) - may need assistance.`);
          } else {
            checks.push({ val: 20, weight: 40 });
            details.push(`Very steep ramp (1:${features.ramp_gradient_ratio}) exceeding safe standards.`);
          }
        } else {
          checks.push({ val: 80, weight: 40 });
          details.push('Ramp available at entrance.');
        }
      } else if (features.ramp_available === false) {
        checks.push({ val: 0, weight: 40 });
        const stepTxt = features.entrance_step_count ? `${features.entrance_step_count} steps` : 'steps';
        details.push(`Inaccessible entrance: ${stepTxt} with NO ramp.`);
        return {
          score: 10,
          status: 'red',
          details,
          hardFailReason: 'Entrance has steps with no ramp or lift bypass.',
        };
      }
    }
  }

  // Check 2: Entrance door width (threshold >= 81 cm / 32 in)
  if (features.entrance_door_width_cm !== undefined) {
    if (features.entrance_door_width_cm >= 81) {
      checks.push({ val: 100, weight: 35 });
      details.push(`Wide clear doorway: ${features.entrance_door_width_cm} cm (standard >= 81 cm).`);
    } else if (features.entrance_door_width_cm >= 75) {
      checks.push({ val: 50, weight: 35 });
      details.push(`Narrow doorway: ${features.entrance_door_width_cm} cm (tight for standard wheelchairs).`);
    } else {
      checks.push({ val: 10, weight: 35 });
      details.push(`Very narrow doorway: ${features.entrance_door_width_cm} cm (< 75 cm).`);
    }
  }

  // Check 3: Threshold height & automatic doors
  if (features.threshold_height_cm !== undefined) {
    if (features.threshold_height_cm <= 1.5) {
      checks.push({ val: 100, weight: 15 });
      details.push(`Flush threshold (${features.threshold_height_cm} cm).`);
    } else {
      checks.push({ val: 40, weight: 15 });
      details.push(`Raised threshold lip (${features.threshold_height_cm} cm).`);
    }
  }

  if (features.automatic_door !== undefined) {
    if (features.automatic_door) {
      checks.push({ val: 100, weight: 10 });
      details.push('Power automatic entrance doors.');
    } else {
      checks.push({ val: 60, weight: 10 });
    }
  }

  if (checks.length === 0) {
    return { score: null, status: 'unknown', details: ['No verified step-free measurements available yet.'] };
  }

  const totalWeight = checks.reduce((acc, c) => acc + c.weight, 0);
  const weightedSum = checks.reduce((acc, c) => acc + c.val * c.weight, 0);
  const score = Math.round(weightedSum / totalWeight);

  let status: TrafficLightValue = 'yellow';
  if (score >= 75) status = 'green';
  else if (score < 40) status = 'red';

  return { score, status, details };
}

/**
 * Pure function: Evaluates Lifts & Vertical Transit pillar
 */
export function evaluateLifts(features: VenueFeatures): {
  score: number | null;
  status: TrafficLightValue;
  details: string[];
  hardFailReason?: string;
} {
  const details: string[] = [];

  // Single-level venues do not require a lift
  if (features.multiple_levels === false) {
    return {
      score: 100,
      status: 'green',
      details: ['Single-level venue: No vertical transit required.'],
    };
  }

  // Multi-level checks
  if (features.multiple_levels === true) {
    if (features.lift_available === false) {
      return {
        score: 0,
        status: 'red',
        details: ['Multi-level venue with NO lift available.'],
        hardFailReason: 'Upper floors are inaccessible (no elevator/lift).',
      };
    }

    if (features.lift_available === true) {
      const checks: { val: number; weight: number }[] = [];
      checks.push({ val: 80, weight: 50 });
      details.push('Elevator / lift available to all public levels.');

      if (features.lift_door_width_cm !== undefined) {
        if (features.lift_door_width_cm >= 81) {
          checks.push({ val: 100, weight: 20 });
          details.push(`Lift door width ${features.lift_door_width_cm} cm (>= 81 cm).`);
        } else {
          checks.push({ val: 40, weight: 20 });
          details.push(`Lift door width ${features.lift_door_width_cm} cm is tight.`);
        }
      }

      if (features.lift_braille_buttons !== undefined) {
        checks.push({ val: features.lift_braille_buttons ? 100 : 30, weight: 15 });
        if (features.lift_braille_buttons) details.push('Braille & tactile control buttons.');
      }

      if (features.lift_audio_announcements !== undefined) {
        checks.push({ val: features.lift_audio_announcements ? 100 : 30, weight: 15 });
        if (features.lift_audio_announcements) details.push('Voice / audio floor announcements.');
      }

      const totalWeight = checks.reduce((acc, c) => acc + c.weight, 0);
      const score = Math.round(checks.reduce((acc, c) => acc + c.val * c.weight, 0) / totalWeight);
      const status: TrafficLightValue = score >= 75 ? 'green' : score >= 40 ? 'yellow' : 'red';
      return { score, status, details };
    }
  }

  return { score: null, status: 'unknown', details: ['No verified lift data recorded.'] };
}

/**
 * Pure function: Evaluates Accessible Washrooms pillar
 * Threshold: Turning radius >= 150 cm, Door >= 81 cm, Grab rails
 */
export function evaluateWashrooms(features: VenueFeatures): {
  score: number | null;
  status: TrafficLightValue;
  details: string[];
  hardFailReason?: string;
} {
  const details: string[] = [];

  if (features.accessible_washroom_available === false) {
    return {
      score: 0,
      status: 'red',
      details: ['No dedicated accessible washroom.'],
      hardFailReason: 'No accessible washroom available on premises.',
    };
  }

  if (features.accessible_washroom_available === true) {
    const checks: { val: number; weight: number }[] = [];
    checks.push({ val: 70, weight: 40 });
    details.push('Dedicated accessible washroom present.');

    if (features.grab_rails_present !== undefined) {
      checks.push({ val: features.grab_rails_present ? 100 : 20, weight: 25 });
      details.push(features.grab_rails_present ? 'Sturdy grab rails installed.' : 'No grab rails beside toilet.');
    }

    if (features.wheelchair_turning_radius_cm !== undefined) {
      if (features.wheelchair_turning_radius_cm >= 150) {
        checks.push({ val: 100, weight: 20 });
        details.push(`Spacious 360° turning space (${features.wheelchair_turning_radius_cm} cm).`);
      } else {
        checks.push({ val: 40, weight: 20 });
        details.push(`Limited turning space (${features.wheelchair_turning_radius_cm} cm < 150 cm).`);
      }
    }

    if (features.washroom_door_width_cm !== undefined) {
      if (features.washroom_door_width_cm >= 81) {
        checks.push({ val: 100, weight: 15 });
      } else {
        checks.push({ val: 30, weight: 15 });
        details.push(`Washroom doorway narrow (${features.washroom_door_width_cm} cm).`);
      }
    }

    const totalWeight = checks.reduce((acc, c) => acc + c.weight, 0);
    const score = Math.round(checks.reduce((acc, c) => acc + c.val * c.weight, 0) / totalWeight);
    const status: TrafficLightValue = score >= 75 ? 'green' : score >= 40 ? 'yellow' : 'red';
    return { score, status, details };
  }

  return { score: null, status: 'unknown', details: ['No washroom accessibility data reported.'] };
}

/**
 * Pure function: Evaluates Rest & Seating pillar
 */
export function evaluateRestSeating(features: VenueFeatures): {
  score: number | null;
  status: TrafficLightValue;
  details: string[];
} {
  const details: string[] = [];
  const checks: { val: number; weight: number }[] = [];

  if (features.priority_seating_available !== undefined) {
    checks.push({ val: features.priority_seating_available ? 100 : 20, weight: 50 });
    if (features.priority_seating_available) details.push('Priority designated seating available.');
  }

  if (features.armrests_available !== undefined) {
    checks.push({ val: features.armrests_available ? 100 : 30, weight: 30 });
    if (features.armrests_available) details.push('Seating equipped with supportive armrests.');
  }

  if (features.quiet_resting_area !== undefined) {
    checks.push({ val: features.quiet_resting_area ? 100 : 30, weight: 20 });
    if (features.quiet_resting_area) details.push('Quiet bench / resting space available.');
  }

  if (checks.length === 0) {
    return { score: null, status: 'unknown', details: ['No seating data verified.'] };
  }

  const totalWeight = checks.reduce((acc, c) => acc + c.weight, 0);
  const score = Math.round(checks.reduce((acc, c) => acc + c.val * c.weight, 0) / totalWeight);
  const status: TrafficLightValue = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';
  return { score, status, details };
}

/**
 * Pure function: Evaluates Wayfinding & Sensory pillar
 */
export function evaluateWayfindingSensory(features: VenueFeatures): {
  score: number | null;
  status: TrafficLightValue;
  details: string[];
} {
  const details: string[] = [];
  const checks: { val: number; weight: number }[] = [];

  if (features.tactile_paving !== undefined) {
    checks.push({ val: features.tactile_paving ? 100 : 20, weight: 25 });
    if (features.tactile_paving) details.push('Tactile ground surface indicators present.');
  }

  if (features.braille_signage !== undefined) {
    checks.push({ val: features.braille_signage ? 100 : 20, weight: 20 });
    if (features.braille_signage) details.push('Braille / raised lettering signage.');
  }

  if (features.high_contrast_signage !== undefined) {
    checks.push({ val: features.high_contrast_signage ? 100 : 30, weight: 20 });
    if (features.high_contrast_signage) details.push('High-contrast clear visual signage.');
  }

  if (features.ambient_noise_level !== undefined) {
    const val = features.ambient_noise_level === 'quiet' ? 100 : features.ambient_noise_level === 'moderate' ? 65 : 25;
    checks.push({ val, weight: 20 });
    details.push(`Ambient sound level: ${features.ambient_noise_level}.`);
  }

  if (features.glare_free_lighting !== undefined) {
    checks.push({ val: features.glare_free_lighting ? 100 : 40, weight: 15 });
    if (features.glare_free_lighting) details.push('Soft, glare-free, non-flickering lighting.');
  }

  if (checks.length === 0) {
    return { score: null, status: 'unknown', details: ['No sensory or wayfinding data recorded.'] };
  }

  const totalWeight = checks.reduce((acc, c) => acc + c.weight, 0);
  const score = Math.round(checks.reduce((acc, c) => acc + c.val * c.weight, 0) / totalWeight);
  const status: TrafficLightValue = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';
  return { score, status, details };
}

/**
 * Main Scoring Engine
 * Combines all pillars, renormalizes weights for missing data and persona,
 * and handles hard constraints that cap the match percentage.
 */
export function calculateVenueScore(
  features: VenueFeatures,
  persona?: UserPersonaId | null,
  reviewCount: number = 0,
  verificationStatus: string = 'unverified_imported'
): CompositeScoreResult {
  const stepFree = evaluateStepFree(features);
  const lifts = evaluateLifts(features);
  const washrooms = evaluateWashrooms(features);
  const rest = evaluateRestSeating(features);
  const sensory = evaluateWayfindingSensory(features);

  const baseWeights = persona ? PERSONA_WEIGHTS[persona] : DEFAULT_PILLAR_WEIGHTS;

  const rawPillars: Record<PillarId, { res: any; title: string }> = {
    step_free: { res: stepFree, title: 'Step-Free Access' },
    lifts: { res: lifts, title: 'Lifts & Vertical Transit' },
    washrooms: { res: washrooms, title: 'Accessible Washrooms' },
    rest_seating: { res: rest, title: 'Rest & Seating' },
    wayfinding_sensory: { res: sensory, title: 'Wayfinding & Sensory' },
  };

  const pillarResults: Record<PillarId, PillarScoreResult> = {} as any;
  let knownWeightSum = 0;
  let knownPillarsCount = 0;
  let unknownPillarsCount = 0;

  (Object.keys(rawPillars) as PillarId[]).forEach((pid) => {
    const p = rawPillars[pid];
    const weight = baseWeights[pid];
    const isKnown = p.res.score !== null;

    if (isKnown) {
      knownWeightSum += weight;
      knownPillarsCount++;
    } else {
      unknownPillarsCount++;
    }

    pillarResults[pid] = {
      pillarId: pid,
      title: p.title,
      score: p.res.score,
      status: p.res.status,
      weight,
      normalizedWeight: 0, // calculated below
      details: p.res.details,
      isHardConstraintViolated: Boolean(p.res.hardFailReason),
      hardConstraintReason: p.res.hardFailReason,
    };
  });

  // Calculate composite score using ONLY known pillars (Never treat missing data as zero!)
  let compositeScore: number | null = null;
  if (knownWeightSum > 0) {
    let weightedScoreSum = 0;
    (Object.keys(pillarResults) as PillarId[]).forEach((pid) => {
      const p = pillarResults[pid];
      if (p.score !== null) {
        const renormalized = (p.weight / knownWeightSum) * 100;
        p.normalizedWeight = Math.round(renormalized * 10) / 10;
        weightedScoreSum += (p.score * p.normalizedWeight) / 100;
      }
    });
    compositeScore = Math.round(weightedScoreSum);
  }

  // Calculate confidence level (0.00 - 1.00)
  // Confidence depends on known pillars ratio + review count + verification status
  let completenessFactor = knownWeightSum / 100; // max 1.0
  let verificationBonus = 0.5; // baseline for imported
  if (verificationStatus === 'photo_verified' || verificationStatus === 'partner_verified') {
    verificationBonus = 1.0;
  } else if (verificationStatus === 'community_reported' || reviewCount > 0) {
    verificationBonus = Math.min(1.0, 0.65 + reviewCount * 0.07);
  }

  const confidenceLevel = Math.round(completenessFactor * verificationBonus * 100) / 100;

  let confidenceLabel: 'High' | 'Medium' | 'Low' | 'Unverified' = 'Unverified';
  if (confidenceLevel >= 0.75) confidenceLabel = 'High';
  else if (confidenceLevel >= 0.5) confidenceLabel = 'Medium';
  else if (confidenceLevel >= 0.25) confidenceLabel = 'Low';

  // Persona Match % & Hard Constraints
  const failedConstraintReasons: string[] = [];
  let hardConstraintFailed = false;

  if (persona === 'power_wheelchair') {
    if (stepFree.hardFailReason) {
      hardConstraintFailed = true;
      failedConstraintReasons.push(stepFree.hardFailReason);
    }
    if (lifts.hardFailReason) {
      hardConstraintFailed = true;
      failedConstraintReasons.push(lifts.hardFailReason);
    }
  } else if (persona === 'manual_chair_stroller') {
    if (stepFree.hardFailReason) {
      hardConstraintFailed = true;
      failedConstraintReasons.push(stepFree.hardFailReason);
    }
  } else if (persona === 'limited_ambulatory') {
    if (stepFree.hardFailReason) {
      hardConstraintFailed = true;
      failedConstraintReasons.push('Steps require climbing without elevator or ramp alternative.');
    }
  }

  let personaMatchPercentage = compositeScore;
  if (hardConstraintFailed) {
    // Hard constraints that fail cap the match at 25% max
    personaMatchPercentage = Math.min(compositeScore ?? 0, 25);
  }

  return {
    compositeScore,
    confidenceLevel,
    confidenceLabel,
    pillars: pillarResults,
    personaMatchPercentage,
    hardConstraintFailed,
    failedConstraintReasons,
    knownPillarsCount,
    unknownPillarsCount,
  };
}
