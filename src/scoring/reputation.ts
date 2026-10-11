import { calculateDistanceMeters } from '../utils/geo';
import { TemporaryAlert } from '../types/community';

export interface ReputationParams {
  baseScore?: number;
  photoVerifiedCount: number;
  geofenceVerifiedCount: number;
  helpfulVotesCount: number;
  rejectedReportsCount: number;
}

/**
 * Pure function: Calculates reviewer reputation score (0 - 100)
 */
export function calculateReviewerTrust(params: ReputationParams): number {
  const base = params.baseScore ?? 10;
  const photoBonus = params.photoVerifiedCount * 15;
  const geoBonus = params.geofenceVerifiedCount * 10;
  const helpfulBonus = params.helpfulVotesCount * 2;
  const penalty = params.rejectedReportsCount * 25;

  const raw = base + photoBonus + geoBonus + helpfulBonus - penalty;
  return Math.max(0, Math.min(100, raw));
}

/**
 * Pure function: Calculates recency decay factor (1.0 down to 0.4)
 */
export function calculateRecencyDecay(reviewDate: Date, referenceDate: Date = new Date()): number {
  const diffMs = referenceDate.getTime() - reviewDate.getTime();
  const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) return 1.0;
  if (diffDays <= 90) return 0.8;
  if (diffDays <= 180) return 0.6;
  return 0.4;
}

/**
 * Anti-Abuse: Geofence check (~150 meters)
 */
export function verifyReviewerGeofence(
  userLat?: number,
  userLng?: number,
  venueLat?: number,
  venueLng?: number,
  thresholdMeters: number = 150
): {
  isVerified: boolean;
  distanceMeters: number | null;
  weightMultiplier: number;
  flagReason?: string;
} {
  if (
    userLat === undefined ||
    userLng === undefined ||
    venueLat === undefined ||
    venueLng === undefined
  ) {
    return {
      isVerified: false,
      distanceMeters: null,
      weightMultiplier: 0.2,
      flagReason: 'Location unavailable; flagged as remote submission',
    };
  }

  const distance = calculateDistanceMeters(userLat, userLng, venueLat, venueLng);

  if (distance <= thresholdMeters) {
    return {
      isVerified: true,
      distanceMeters: distance,
      weightMultiplier: 1.0,
    };
  }

  return {
    isVerified: false,
    distanceMeters: distance,
    weightMultiplier: 0.2,
    flagReason: `Reviewer was ${distance}m away (threshold: ${thresholdMeters}m); flagged as remote submission`,
  };
}

/**
 * Anti-Abuse: Rate limit check (max 5 per hour)
 */
export function checkSubmissionRateLimit(
  recentSubmissionTimestamps: number[],
  now: number = Date.now(),
  limitPerHour: number = 5
): { isAllowed: boolean; retryAfterSeconds?: number } {
  const oneHourAgo = now - 60 * 60 * 1000;
  const submissionsInLastHour = recentSubmissionTimestamps.filter((ts) => ts > oneHourAgo);

  if (submissionsInLastHour.length >= limitPerHour) {
    const oldestInWindow = Math.min(...submissionsInLastHour);
    const retryAfter = Math.ceil((oldestInWindow + 60 * 60 * 1000 - now) / 1000);
    return { isAllowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  return { isAllowed: true };
}

/**
 * Anti-Abuse: Duplicate check (1 review per venue per user per 24 hours)
 */
export function checkDuplicateVenueSubmission(
  lastSubmissionTimestampForVenue?: number,
  now: number = Date.now(),
  cooldownHours: number = 24
): { isDuplicate: boolean; hoursRemaining?: number } {
  if (!lastSubmissionTimestampForVenue) {
    return { isDuplicate: false };
  }

  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const elapsed = now - lastSubmissionTimestampForVenue;

  if (elapsed < cooldownMs) {
    const remainingHours = Math.ceil((cooldownMs - elapsed) / (1000 * 60 * 60));
    return { isDuplicate: true, hoursRemaining: remainingHours };
  }

  return { isDuplicate: false };
}

/**
 * Temporary Status Alert Activation logic:
 * Alert needs >= 2 reports OR 1 trusted reporter (trust score >= 50)
 */
export function evaluateAlertActivation(
  reportCount: number,
  highestReporterTrustScore: number
): boolean {
  if (highestReporterTrustScore >= 50) {
    return true; // Trusted reporter activates immediately
  }
  return reportCount >= 2; // Otherwise requires at least 2 community reports
}

/**
 * Checks if an active temporary alert has expired (default: 48 hours)
 */
export function isAlertExpired(alert: TemporaryAlert, now: Date = new Date()): boolean {
  const expiry = new Date(alert.expiresAt);
  return now.getTime() >= expiry.getTime();
}
