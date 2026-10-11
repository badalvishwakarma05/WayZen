import { describe, it, expect } from 'vitest';
import {
  calculateReviewerTrust,
  calculateRecencyDecay,
  verifyReviewerGeofence,
  checkSubmissionRateLimit,
  checkDuplicateVenueSubmission,
  evaluateAlertActivation,
  isAlertExpired,
} from './reputation';
import { TemporaryAlert } from '../types/community';

describe('Phase 2: Reputation & Anti-Abuse Engine', () => {
  describe('Reviewer Trust Score Growth & Penalties', () => {
    it('calculates base trust and increases with photo & geofence verifications', () => {
      const trust = calculateReviewerTrust({
        photoVerifiedCount: 2, // +30
        geofenceVerifiedCount: 3, // +30
        helpfulVotesCount: 5, // +10
        rejectedReportsCount: 0,
      });
      // 10 base + 30 + 30 + 10 = 80
      expect(trust).toBe(80);
    });

    it('penalizes fraudulent/rejected submissions down to 0 minimum', () => {
      const trust = calculateReviewerTrust({
        photoVerifiedCount: 0,
        geofenceVerifiedCount: 0,
        helpfulVotesCount: 0,
        rejectedReportsCount: 2, // -50
      });
      expect(trust).toBe(0);
    });

    it('caps maximum trust score at 100', () => {
      const trust = calculateReviewerTrust({
        photoVerifiedCount: 10,
        geofenceVerifiedCount: 10,
        helpfulVotesCount: 50,
        rejectedReportsCount: 0,
      });
      expect(trust).toBe(100);
    });
  });

  describe('Recency Weight Decay', () => {
    const now = new Date('2026-10-11T12:00:00Z');

    it('gives 1.0 weight to recent reviews under 30 days old', () => {
      const recent = new Date('2026-10-01T12:00:00Z'); // 10 days old
      expect(calculateRecencyDecay(recent, now)).toBe(1.0);
    });

    it('decays weight for older reviews (0.8x, 0.6x, 0.4x)', () => {
      const mediumOld = new Date('2026-08-15T12:00:00Z'); // ~57 days old -> 0.8
      expect(calculateRecencyDecay(mediumOld, now)).toBe(0.8);

      const older = new Date('2026-06-01T12:00:00Z'); // ~132 days old -> 0.6
      expect(calculateRecencyDecay(older, now)).toBe(0.6);

      const veryOld = new Date('2025-10-01T12:00:00Z'); // > 1 year -> 0.4
      expect(calculateRecencyDecay(veryOld, now)).toBe(0.4);
    });
  });

  describe('Anti-Abuse: Geofence Verification (~150m)', () => {
    it('verifies reviews within 150m and awards full weight multiplier 1.0', () => {
      // MG Road Metro Station (12.9756, 77.6066)
      // Point ~50 meters away
      const res = verifyReviewerGeofence(12.9758, 77.6068, 12.9756, 77.6066, 150);
      expect(res.isVerified).toBe(true);
      expect(res.weightMultiplier).toBe(1.0);
      expect(res.distanceMeters).toBeLessThan(100);
    });

    it('flags reviews beyond 150m as remote and applies 0.2x weight penalty', () => {
      // Reviewer in Indiranagar (12.9719, 77.6412) rating venue in MG Road (12.9756, 77.6066) ~3.7 km away
      const res = verifyReviewerGeofence(12.9719, 77.6412, 12.9756, 77.6066, 150);
      expect(res.isVerified).toBe(false);
      expect(res.weightMultiplier).toBe(0.2);
      expect(res.flagReason).toContain('flagged as remote submission');
    });
  });

  describe('Anti-Abuse: Rate Limiting & Duplicate Prevention', () => {
    it('enforces rate limit of max 5 reviews per hour', () => {
      const now = Date.now();
      const recent4 = [now - 1000, now - 2000, now - 3000, now - 4000];
      expect(checkSubmissionRateLimit(recent4, now, 5).isAllowed).toBe(true);

      const recent5 = [...recent4, now - 5000];
      const blocked = checkSubmissionRateLimit(recent5, now, 5);
      expect(blocked.isAllowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('detects duplicate reviews for the same venue within 24 hours', () => {
      const now = Date.now();
      const last12HoursAgo = now - 12 * 60 * 60 * 1000;
      const dup = checkDuplicateVenueSubmission(last12HoursAgo, now, 24);
      expect(dup.isDuplicate).toBe(true);
      expect(dup.hoursRemaining).toBe(12);

      const last30HoursAgo = now - 30 * 60 * 60 * 1000;
      const allowed = checkDuplicateVenueSubmission(last30HoursAgo, now, 24);
      expect(allowed.isDuplicate).toBe(false);
    });
  });

  describe('Temporary Status Alert Activation Thresholds', () => {
    it('requires at least 2 community reports if reporter trust is below 50', () => {
      expect(evaluateAlertActivation(1, 20)).toBe(false);
      expect(evaluateAlertActivation(2, 20)).toBe(true);
    });

    it('activates immediately with 1 report if reporter trust is >= 50', () => {
      expect(evaluateAlertActivation(1, 55)).toBe(true);
    });

    it('accurately identifies expired alerts after 48 hours', () => {
      const activeAlert: TemporaryAlert = {
        id: 'a1',
        venueId: 'v1',
        venueName: 'Test',
        alertType: 'lift_out_of_service',
        description: 'Under repair',
        reporterTrustScore: 60,
        confirmationCount: 1,
        isActive: true,
        reportedAt: '2026-10-09T10:00:00Z',
        expiresAt: '2026-10-11T10:00:00Z',
      };

      const beforeExpiry = new Date('2026-10-11T08:00:00Z');
      expect(isAlertExpired(activeAlert, beforeExpiry)).toBe(false);

      const afterExpiry = new Date('2026-10-11T12:00:00Z');
      expect(isAlertExpired(activeAlert, afterExpiry)).toBe(true);
    });
  });
});
