export type UserPersonaId =
  | 'power_wheelchair'
  | 'manual_chair_stroller'
  | 'low_vision'
  | 'sensory_neurodivergent'
  | 'limited_ambulatory';

export interface UserPersonaInfo {
  id: UserPersonaId;
  label: string;
  description: string;
  iconName: string;
  criticalPillars: PillarId[];
}

export type PillarId =
  | 'step_free'
  | 'lifts'
  | 'washrooms'
  | 'rest_seating'
  | 'wayfinding_sensory';

export type TrafficLightValue = 'green' | 'yellow' | 'red' | 'unknown';

export interface TrafficLightDisplay {
  value: TrafficLightValue;
  label: string;
  accessibleDescription: string;
  badgeClass: string;
  icon: string;
}

export interface PillarScoreResult {
  pillarId: PillarId;
  title: string;
  score: number | null; // 0 - 100, or null if Unknown
  status: TrafficLightValue;
  weight: number;
  normalizedWeight: number;
  details: string[];
  isHardConstraintViolated?: boolean;
  hardConstraintReason?: string;
}

export interface VenueFeatures {
  // Step-Free Access
  entrance_has_steps?: boolean;
  entrance_step_count?: number;
  ramp_available?: boolean;
  ramp_gradient_ratio?: number; // e.g. 12 means 1:12
  entrance_door_width_cm?: number; // >= 81 cm
  automatic_door?: boolean;
  threshold_height_cm?: number; // <= 1.5 cm

  // Lifts & Vertical Transit
  multiple_levels?: boolean;
  lift_available?: boolean;
  lift_door_width_cm?: number;
  lift_braille_buttons?: boolean;
  lift_audio_announcements?: boolean;

  // Accessible Washrooms
  accessible_washroom_available?: boolean;
  washroom_door_width_cm?: number;
  grab_rails_present?: boolean;
  wheelchair_turning_radius_cm?: number; // >= 150 cm
  emergency_cord_present?: boolean;

  // Rest & Seating
  priority_seating_available?: boolean;
  armrests_available?: boolean;
  quiet_resting_area?: boolean;

  // Wayfinding & Sensory
  tactile_paving?: boolean;
  braille_signage?: boolean;
  high_contrast_signage?: boolean;
  quiet_hours_schedule?: string;
  ambient_noise_level?: 'quiet' | 'moderate' | 'loud';
  glare_free_lighting?: boolean;
}

export interface CompositeScoreResult {
  compositeScore: number | null; // 0-100 or null if zero data
  confidenceLevel: number; // 0.00 - 1.00
  confidenceLabel: 'High' | 'Medium' | 'Low' | 'Unverified';
  pillars: Record<PillarId, PillarScoreResult>;
  personaMatchPercentage: number | null;
  hardConstraintFailed: boolean;
  failedConstraintReasons: string[];
  knownPillarsCount: number;
  unknownPillarsCount: number;
  lastVerifiedDate?: string;
}

export interface Venue {
  id: string;
  name: string;
  category: 'cafe' | 'restaurant' | 'transit' | 'healthcare' | 'shopping' | 'park' | 'culture';
  address: string;
  neighborhood: string;
  city: string;
  latitude: number;
  longitude: number;
  verificationStatus: 'unverified_imported' | 'community_reported' | 'photo_verified' | 'partner_verified';
  lastVerifiedAt?: string;
  features: VenueFeatures;
  reviewsCount: number;
  photos: VenuePhoto[];
  tags: string[];
  distanceMeters?: number;
}

export interface VenuePhoto {
  id: string;
  url: string;
  altText: string;
  authorName?: string;
  verifiedAt?: string;
}

export interface ReviewSubmission {
  id: string;
  venueId: string;
  userId?: string;
  stepRating: TrafficLightValue;
  liftRating: TrafficLightValue;
  washroomRating: TrafficLightValue;
  restRating?: TrafficLightValue;
  sensoryRating?: TrafficLightValue;
  quickTags: string[];
  notes?: string;
  photoDataUrl?: string;
  photoAltText?: string;
  userCoordinates?: { latitude: number; longitude: number };
  createdAt: string;
  syncedAt?: string;
}
