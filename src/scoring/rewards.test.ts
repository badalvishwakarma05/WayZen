import { describe, it, expect } from 'vitest';
import {
  evaluateReviewPoints,
  calculateUserPointsBalance,
  validateCouponRedemption,
  generateRedemptionCode,
} from './rewards';
import { PartnerCoupon, PointsLedgerEntry, UserRedemption } from '../types/rewards';

describe('Phase 3: Rewards Ledger & Fraud Gatekeeper', () => {
  describe('Review Points Evaluation & Fraud Checks', () => {
    it('awards 50 points for base verified review within 150m', () => {
      const res = evaluateReviewPoints({
        userId: 'u1',
        isFirstReviewEver: false,
        hasPhoto: false,
        userLat: 12.9756,
        userLng: 77.6066,
        venueLat: 12.9756,
        venueLng: 77.6066,
        recentTimestamps: [],
      });

      expect(res.basePoints).toBe(50);
      expect(res.photoBonus).toBe(0);
      expect(res.firstTimeBonus).toBe(0);
      expect(res.totalPoints).toBe(50);
      expect(res.fraudCheckPassed).toBe(true);
      expect(res.escrowStatus).toBe('granted');
    });

    it('awards 100 points for review with verified photo', () => {
      const res = evaluateReviewPoints({
        userId: 'u1',
        isFirstReviewEver: false,
        hasPhoto: true,
        userLat: 12.9756,
        userLng: 77.6066,
        venueLat: 12.9756,
        venueLng: 77.6066,
        recentTimestamps: [],
      });

      expect(res.basePoints).toBe(50);
      expect(res.photoBonus).toBe(50);
      expect(res.totalPoints).toBe(100);
      expect(res.fraudCheckPassed).toBe(true);
    });

    it('awards 300 points for first-time mapper with photo (+200 bonus)', () => {
      const res = evaluateReviewPoints({
        userId: 'u1',
        isFirstReviewEver: true,
        hasPhoto: true,
        userLat: 12.9756,
        userLng: 77.6066,
        venueLat: 12.9756,
        venueLng: 77.6066,
        recentTimestamps: [],
      });

      expect(res.basePoints).toBe(50);
      expect(res.photoBonus).toBe(50);
      expect(res.firstTimeBonus).toBe(200);
      expect(res.totalPoints).toBe(300);
      expect(res.fraudCheckPassed).toBe(true);
      expect(res.escrowStatus).toBe('granted');
    });

    it('holds points in escrow if review was submitted remotely (>150m)', () => {
      // Reviewer 3.7 km away from venue
      const res = evaluateReviewPoints({
        userId: 'u1',
        isFirstReviewEver: false,
        hasPhoto: true,
        userLat: 12.9719,
        userLng: 77.6412,
        venueLat: 12.9756,
        venueLng: 77.6066,
        recentTimestamps: [],
      });

      expect(res.totalPoints).toBe(100);
      expect(res.fraudCheckPassed).toBe(false);
      expect(res.escrowStatus).toBe('held_escrow');
      expect(res.reasons[0]).toContain('flagged as remote submission');
    });

    it('denies points completely if submission rate limit (5/hr) is exceeded', () => {
      const now = Date.now();
      const recentTimestamps = [now - 1000, now - 2000, now - 3000, now - 4000, now - 5000];

      const res = evaluateReviewPoints({
        userId: 'u1',
        isFirstReviewEver: false,
        hasPhoto: true,
        recentTimestamps,
      });

      expect(res.totalPoints).toBe(0);
      expect(res.fraudCheckPassed).toBe(false);
      expect(res.escrowStatus).toBe('rejected');
    });

    it('denies points if duplicate review submitted for same venue within 24 hours', () => {
      const now = Date.now();
      const lastVenueTimestamp = now - 6 * 60 * 60 * 1000; // 6 hours ago

      const res = evaluateReviewPoints({
        userId: 'u1',
        isFirstReviewEver: false,
        hasPhoto: false,
        recentTimestamps: [],
        lastVenueTimestamp,
      });

      expect(res.totalPoints).toBe(0);
      expect(res.fraudCheckPassed).toBe(false);
      expect(res.escrowStatus).toBe('rejected');
    });
  });

  describe('User Points Balance Calculation', () => {
    it('accurately calculates balance by summing credits, debits, and ignoring escrow', () => {
      const ledger: PointsLedgerEntry[] = [
        {
          id: 'l1',
          userId: 'u1',
          pointsDelta: 300,
          eventType: 'first_time_mapper',
          fraudCheckPassed: true,
          escrowStatus: 'granted',
          description: 'First time mapper bonus',
          createdAt: '2026-10-01',
        },
        {
          id: 'l2',
          userId: 'u1',
          pointsDelta: 100,
          eventType: 'photo_bonus',
          fraudCheckPassed: true,
          escrowStatus: 'granted',
          description: 'Photo review',
          createdAt: '2026-10-02',
        },
        {
          id: 'l3',
          userId: 'u1',
          pointsDelta: 100,
          eventType: 'photo_bonus',
          fraudCheckPassed: false,
          escrowStatus: 'held_escrow', // Held in escrow: MUST NOT COUNT
          description: 'Remote photo review',
          createdAt: '2026-10-03',
        },
        {
          id: 'l4',
          userId: 'u1',
          pointsDelta: -150,
          eventType: 'coupon_redemption',
          fraudCheckPassed: true,
          escrowStatus: 'granted',
          description: 'Redeemed Third Wave Coffee 15% off',
          createdAt: '2026-10-04',
        },
      ];

      // 300 + 100 - 150 = 250 (held_escrow 100 ignored)
      const balance = calculateUserPointsBalance(ledger);
      expect(balance).toBe(250);
    });
  });

  describe('Coupon Redemption Validation & Code Generation', () => {
    const mockCoupon: PartnerCoupon = {
      id: 'c1',
      partnerId: 'p1',
      venueId: 'v1',
      venueName: 'Third Wave Coffee',
      title: '15% Off Total Bill',
      description: 'Exclusive accessibility partner reward',
      pointsCost: 150,
      discountValue: '15% off',
      budgetTotal: 100,
      budgetRemaining: 45,
      limitPerUser: 1,
      expiresAt: '2026-12-31T23:59:59Z',
      isActive: true,
    };

    it('approves redemption when user has sufficient points and limits are respected', () => {
      const res = validateCouponRedemption(mockCoupon, 200, []);
      expect(res.isValid).toBe(true);
    });

    it('rejects redemption if user balance is below points cost', () => {
      const res = validateCouponRedemption(mockCoupon, 100, []);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Insufficient points balance');
    });

    it('rejects redemption if user already claimed maximum limit per user', () => {
      const existing: UserRedemption[] = [
        {
          id: 'r1',
          userId: 'u1',
          couponId: 'c1',
          couponTitle: mockCoupon.title,
          venueName: mockCoupon.venueName,
          discountValue: mockCoupon.discountValue,
          redemptionCode: 'AP-ABCD-BLR',
          status: 'active',
          expiresAt: '2026-12-31',
          createdAt: '2026-10-01',
        },
      ];

      const res = validateCouponRedemption(mockCoupon, 300, existing);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('maximum redemption limit');
    });

    it('rejects redemption if coupon budget is exhausted', () => {
      const exhaustedCoupon = { ...mockCoupon, budgetRemaining: 0 };
      const res = validateCouponRedemption(exhaustedCoupon, 500, []);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('claimed');
    });

    it('generates properly formatted 8-character redemption codes (AP-XXXX-BLR)', () => {
      const code = generateRedemptionCode();
      expect(code).toMatch(/^AP-[2-9A-HJ-NP-Z]{4}-BLR$/);
    });
  });
});
