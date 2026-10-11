export type PointsEventType =
  | 'base_review'
  | 'photo_bonus'
  | 'first_time_mapper'
  | 'coupon_redemption'
  | 'social_share';

export interface PointsLedgerEntry {
  id: string;
  userId: string;
  pointsDelta: number;
  eventType: PointsEventType;
  reviewId?: string;
  fraudCheckPassed: boolean;
  escrowStatus: 'granted' | 'held_escrow' | 'rejected';
  description: string;
  createdAt: string;
}

export interface PartnerVenue {
  id: string;
  userId: string;
  venueId: string;
  venueName: string;
  businessName: string;
  contactEmail: string;
  isVerified: boolean;
  createdAt: string;
}

export interface PartnerCoupon {
  id: string;
  partnerId: string;
  venueId: string;
  venueName: string;
  title: string;
  description: string;
  pointsCost: number;
  discountValue: string;
  budgetTotal: number;
  budgetRemaining: number;
  limitPerUser: number;
  expiresAt: string;
  isActive: boolean;
}

export interface UserRedemption {
  id: string;
  userId: string;
  couponId: string;
  couponTitle: string;
  venueName: string;
  discountValue: string;
  redemptionCode: string;
  status: 'active' | 'redeemed' | 'expired';
  expiresAt: string;
  redeemedAt?: string;
  createdAt: string;
}

export interface SocialShareSubmission {
  id: string;
  userId: string;
  venueId: string;
  venueName: string;
  platform: 'whatsapp' | 'x_twitter' | 'instagram' | 'linkedin';
  shareUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  pointsReward: number;
  createdAt: string;
}
