import { PartnerCoupon, UserRedemption, PointsLedgerEntry } from '../types/rewards';
import { verifyReviewerGeofence, checkSubmissionRateLimit, checkDuplicateVenueSubmission } from './reputation';

export interface EvaluateReviewPointsParams {
  userId: string;
  isFirstReviewEver: boolean;
  hasPhoto: boolean;
  userLat?: number;
  userLng?: number;
  venueLat?: number;
  venueLng?: number;
  recentTimestamps: number[];
  lastVenueTimestamp?: number;
}

export interface ReviewPointsResult {
  basePoints: number;
  photoBonus: number;
  firstTimeBonus: number;
  totalPoints: number;
  fraudCheckPassed: boolean;
  escrowStatus: 'granted' | 'held_escrow' | 'rejected';
  reasons: string[];
}

/**
 * Pure function: Evaluates review points and validates against anti-abuse fraud checks
 */
export function evaluateReviewPoints(params: EvaluateReviewPointsParams): ReviewPointsResult {
  let basePoints = 50;
  let photoBonus = params.hasPhoto ? 50 : 0;
  let firstTimeBonus = params.isFirstReviewEver ? 200 : 0;
  const reasons: string[] = [];

  // Check 1: Duplicate check (24h cooldown)
  const dupCheck = checkDuplicateVenueSubmission(params.lastVenueTimestamp);
  if (dupCheck.isDuplicate) {
    return {
      basePoints: 0,
      photoBonus: 0,
      firstTimeBonus: 0,
      totalPoints: 0,
      fraudCheckPassed: false,
      escrowStatus: 'rejected',
      reasons: [`Duplicate submission within 24 hours (${dupCheck.hoursRemaining}h remaining). Points denied.`],
    };
  }

  // Check 2: Rate limit check (max 5/hr)
  const rateCheck = checkSubmissionRateLimit(params.recentTimestamps);
  if (!rateCheck.isAllowed) {
    return {
      basePoints: 0,
      photoBonus: 0,
      firstTimeBonus: 0,
      totalPoints: 0,
      fraudCheckPassed: false,
      escrowStatus: 'rejected',
      reasons: ['Submission rate limit exceeded (max 5 per hour). Points denied.'],
    };
  }

  // Check 3: Geofence physical presence (~150m)
  const geoCheck = verifyReviewerGeofence(params.userLat, params.userLng, params.venueLat, params.venueLng, 150);

  const totalPoints = basePoints + photoBonus + firstTimeBonus;

  if (geoCheck.isVerified) {
    reasons.push('Verified physical visit within 150m. Points granted immediately.');
    return {
      basePoints,
      photoBonus,
      firstTimeBonus,
      totalPoints,
      fraudCheckPassed: true,
      escrowStatus: 'granted',
      reasons,
    };
  }

  // Remote review (outside 150m): points held in escrow until moderator verification
  reasons.push(
    geoCheck.flagReason || 'Review submitted remotely. Points held in escrow until community verification.'
  );
  return {
    basePoints,
    photoBonus,
    firstTimeBonus,
    totalPoints,
    fraudCheckPassed: false,
    escrowStatus: 'held_escrow',
    reasons,
  };
}

/**
 * Pure function: Calculates total verified balance from an append-only ledger
 */
export function calculateUserPointsBalance(ledger: PointsLedgerEntry[]): number {
  return ledger.reduce((balance, entry) => {
    // Only entries that have cleared escrow count toward balance
    if (entry.escrowStatus === 'granted') {
      return balance + entry.pointsDelta;
    }
    return balance;
  }, 0);
}

/**
 * Pure function: Validates coupon redemption request
 */
export function validateCouponRedemption(
  coupon: PartnerCoupon,
  userBalance: number,
  existingUserRedemptions: UserRedemption[],
  now: Date = new Date()
): { isValid: boolean; error?: string } {
  if (!coupon.isActive) {
    return { isValid: false, error: 'This coupon is no longer active.' };
  }

  if (now.getTime() > new Date(coupon.expiresAt).getTime()) {
    return { isValid: false, error: 'This coupon has expired.' };
  }

  if (coupon.budgetRemaining <= 0) {
    return { isValid: false, error: 'All coupon redemptions for this cycle have been claimed.' };
  }

  if (userBalance < coupon.pointsCost) {
    return {
      isValid: false,
      error: `Insufficient points balance (${userBalance} pts). This reward requires ${coupon.pointsCost} pts.`,
    };
  }

  const userRedemptionsForCoupon = existingUserRedemptions.filter(
    (r) => r.couponId === coupon.id && (r.status === 'active' || r.status === 'redeemed')
  );

  if (userRedemptionsForCoupon.length >= coupon.limitPerUser) {
    return {
      isValid: false,
      error: `You have reached the maximum redemption limit (${coupon.limitPerUser}) for this coupon.`,
    };
  }

  return { isValid: true };
}

/**
 * Generates an 8-character human-friendly coupon redemption code
 * Format: AP-XXXX-BLR (e.g. AP-7K2P-BLR)
 */
export function generateRedemptionCode(salt?: string): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude 0, 1, I, O to prevent confusion
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    randomPart += chars[idx];
  }
  return `AP-${randomPart}-BLR`;
}
