import { UserPersonaId, Venue } from './accessibility';

export type AlertType =
  | 'lift_out_of_service'
  | 'ramp_under_maintenance'
  | 'washroom_closed'
  | 'construction_obstacle'
  | 'entrance_blocked';

export interface TemporaryAlert {
  id: string;
  venueId: string;
  venueName: string;
  alertType: AlertType;
  description: string;
  reporterTrustScore: number;
  confirmationCount: number;
  isActive: boolean;
  reportedAt: string;
  expiresAt: string;
}

export interface GuideVenueItem {
  venueId: string;
  sequenceOrder: number;
  curatorNotes: string;
  venue?: Venue;
}

export interface CuratedGuide {
  id: string;
  title: string;
  description: string;
  neighborhood: string;
  city: string;
  tags: string[];
  isCurated: boolean;
  followersCount: number;
  items: GuideVenueItem[];
  isSaved?: boolean;
}

export interface AiSummaryResult {
  id: string;
  venueId: string;
  persona: UserPersonaId;
  verdict: string;
  highlights: string[];
  watchOuts: string[];
  sourceReviewIds: string[];
  asOfDate: string;
  thumbsDownCount: number;
  isReported?: boolean;
  isSparse?: boolean;
}

export interface ModerationReport {
  id: string;
  targetType: 'review' | 'venue' | 'alert' | 'ai_summary';
  targetId: string;
  reporterId?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface TrendingVenueItem {
  venue: Venue;
  activityCount24h: number;
  lastActivityAt: string;
  highlightTag: string;
}
