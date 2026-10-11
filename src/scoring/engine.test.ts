import { describe, it, expect } from 'vitest';
import {
  calculateVenueScore,
  evaluateStepFree,
  evaluateLifts,
  evaluateWashrooms,
  DEFAULT_PILLAR_WEIGHTS,
  PERSONA_WEIGHTS,
} from './engine';
import { VenueFeatures } from '../types/accessibility';

describe('AccessPath Pure Scoring Engine', () => {
  describe('Step-Free Pillar & Physical Thresholds', () => {
    it('awards 100% for zero-step ground level entrance and wide door (>= 81 cm)', () => {
      const features: VenueFeatures = {
        entrance_has_steps: false,
        entrance_door_width_cm: 90,
        threshold_height_cm: 0.5,
      };
      const res = evaluateStepFree(features);
      expect(res.status).toBe('green');
      expect(res.score).toBeGreaterThanOrEqual(95);
      expect(res.hardFailReason).toBeUndefined();
    });

    it('evaluates ramp slope compliance according to <= 1:12 standard', () => {
      // 1:12 slope is fully compliant
      const compliantRamp: VenueFeatures = {
        entrance_has_steps: true,
        ramp_available: true,
        ramp_gradient_ratio: 12,
        entrance_door_width_cm: 85,
      };
      const res1 = evaluateStepFree(compliantRamp);
      expect(res1.status).toBe('green');

      // Steep ramp 1:6 slope (< 8) triggers low score
      const steepRamp: VenueFeatures = {
        entrance_has_steps: true,
        ramp_available: true,
        ramp_gradient_ratio: 6,
        entrance_door_width_cm: 85,
      };
      const res2 = evaluateStepFree(steepRamp);
      expect(res2.score).toBeLessThan(res1.score!);
    });

    it('fails with hard constraint when entrance has steps and NO ramp', () => {
      const inaccessible: VenueFeatures = {
        entrance_has_steps: true,
        entrance_step_count: 4,
        ramp_available: false,
        entrance_door_width_cm: 85,
      };
      const res = evaluateStepFree(inaccessible);
      expect(res.status).toBe('red');
      expect(res.hardFailReason).toContain('Entrance has steps with no ramp');
    });

    it('penalizes doors narrower than 81 cm', () => {
      const narrowDoor: VenueFeatures = {
        entrance_has_steps: false,
        entrance_door_width_cm: 70, // narrower than 75 cm
      };
      const res = evaluateStepFree(narrowDoor);
      expect(res.score).toBeLessThan(70);
    });
  });

  describe('Lifts & Vertical Transit', () => {
    it('awards 100% for single-level venues without requiring a lift', () => {
      const singleLevel: VenueFeatures = {
        multiple_levels: false,
      };
      const res = evaluateLifts(singleLevel);
      expect(res.status).toBe('green');
      expect(res.score).toBe(100);
      expect(res.hardFailReason).toBeUndefined();
    });

    it('triggers hard constraint when multi-level venue has no lift', () => {
      const multiNoLift: VenueFeatures = {
        multiple_levels: true,
        lift_available: false,
      };
      const res = evaluateLifts(multiNoLift);
      expect(res.status).toBe('red');
      expect(res.score).toBe(0);
      expect(res.hardFailReason).toContain('Upper floors are inaccessible');
    });
  });

  describe('Missing Data & Never Treating Missing Data as Zero', () => {
    it('treats venue with only Step-Free known by excluding unknown pillars and lowering confidence', () => {
      const partialFeatures: VenueFeatures = {
        entrance_has_steps: false,
        entrance_door_width_cm: 90,
        // Lifts, Washrooms, Rest, Sensory are completely missing
      };

      const result = calculateVenueScore(partialFeatures, null, 0, 'unverified_imported');
      expect(result.pillars.step_free.score).toBeGreaterThan(90);
      expect(result.pillars.washrooms.score).toBeNull();
      expect(result.pillars.washrooms.status).toBe('unknown');

      // Crucial: Composite score MUST NOT be penalized to zero!
      // Step-free is 100, so composite should be ~100 with renormalized weight
      expect(result.compositeScore).toBeGreaterThanOrEqual(90);

      // But confidence MUST be low because only 25% of weights are known & unverified
      expect(result.confidenceLevel).toBeLessThan(0.4);
      expect(result.confidenceLabel).toMatch(/Low|Unverified/);
      expect(result.knownPillarsCount).toBe(1);
      expect(result.unknownPillarsCount).toBe(4);
    });
  });

  describe('Persona Match & Hard Constraint Capping', () => {
    it('caps persona match at 25% max when Power Wheelchair encounters steps without ramp', () => {
      const features: VenueFeatures = {
        entrance_has_steps: true,
        entrance_step_count: 3,
        ramp_available: false,
        multiple_levels: false,
        accessible_washroom_available: true,
        washroom_door_width_cm: 90,
        wheelchair_turning_radius_cm: 160,
        grab_rails_present: true,
      };

      const powerChairResult = calculateVenueScore(features, 'power_wheelchair', 2, 'community_reported');

      expect(powerChairResult.hardConstraintFailed).toBe(true);
      expect(powerChairResult.failedConstraintReasons.length).toBeGreaterThan(0);
      expect(powerChairResult.failedConstraintReasons[0]).toContain('Entrance has steps with no ramp');
      // Persona match capped at 25%
      expect(powerChairResult.personaMatchPercentage).toBeLessThanOrEqual(25);
    });

    it('gives high match for Power Wheelchair when all physical constraints are met', () => {
      const accessibleFeatures: VenueFeatures = {
        entrance_has_steps: false,
        entrance_door_width_cm: 92,
        ramp_available: true,
        multiple_levels: true,
        lift_available: true,
        lift_door_width_cm: 90,
        accessible_washroom_available: true,
        grab_rails_present: true,
        wheelchair_turning_radius_cm: 160,
      };

      const result = calculateVenueScore(accessibleFeatures, 'power_wheelchair', 5, 'photo_verified');
      expect(result.hardConstraintFailed).toBe(false);
      expect(result.personaMatchPercentage).toBeGreaterThanOrEqual(85);
      expect(result.confidenceLabel).toBe('High');
    });

    it('prioritizes sensory and wayfinding weights for Low Vision persona', () => {
      expect(PERSONA_WEIGHTS.low_vision.wayfinding_sensory).toBe(40);
      expect(PERSONA_WEIGHTS.power_wheelchair.step_free).toBe(35);
      expect(PERSONA_WEIGHTS.limited_ambulatory.rest_seating).toBe(35);
    });
  });
});
