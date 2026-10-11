import { CuratedGuide, TemporaryAlert, AiSummaryResult, ModerationReport, TrendingVenueItem } from '../types/community';
import { BENGALURU_VENUES } from './mockData';

export const INITIAL_ALERTS: TemporaryAlert[] = [
  {
    id: 'alert-blr-01',
    venueId: 'venue-blr-blossom-book-house',
    venueName: 'Blossom Book House (Church Street)',
    alertType: 'lift_out_of_service',
    description: 'Internal customer elevator is undergoing motor inspection. 1st floor accessible only by stairs today.',
    reporterTrustScore: 65,
    confirmationCount: 3,
    isActive: true,
    reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-blr-02',
    venueId: 'venue-blr-koshy-cafe',
    venueName: "Koshy's Restaurant & Cafe",
    alertType: 'construction_obstacle',
    description: 'Civic paver relaying work immediately outside the main gate; temporary timber plank placed over curb.',
    reporterTrustScore: 72,
    confirmationCount: 2,
    isActive: true,
    reportedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 38 * 60 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_GUIDES: CuratedGuide[] = [
  {
    id: 'guide-indiranagar-step-free',
    title: 'Step-Free Coffee Crawl (Indiranagar)',
    description: 'A curated route through 12th Main Road with verified concrete ramps, wide doors (>81 cm), and accessible washrooms.',
    neighborhood: 'Indiranagar',
    city: 'Bengaluru',
    tags: ['Wheelchair Friendly', 'Step-Free', 'Cafes', 'Verified Loo'],
    isCurated: true,
    followersCount: 148,
    isSaved: true,
    items: [
      {
        venueId: 'venue-blr-third-wave-indiranagar',
        sequenceOrder: 1,
        curatorNotes: 'Start here! Level ramp entry on side gate and spacious ground floor accessible washroom.',
      },
      {
        venueId: 'venue-blr-manipal-hospital-hal',
        sequenceOrder: 2,
        curatorNotes: 'Medical emergency fallback point nearby with stretcher-width elevators and 24/7 accessible pharmacy.',
      },
    ],
  },
  {
    id: 'guide-church-st-metro-park',
    title: 'Accessible Metro & Heritage Green Trail',
    description: 'Smooth, tactile-guided transit from MG Road Metro directly to Cubbon Park bandstand walkways with zero steep curbs.',
    neighborhood: 'Church Street / Cubbon Park',
    city: 'Bengaluru',
    tags: ['Metro Connected', 'Tactile Paving', 'Low Gradient', 'Parks'],
    isCurated: true,
    followersCount: 320,
    isSaved: false,
    items: [
      {
        venueId: 'venue-blr-church-st-metro',
        sequenceOrder: 1,
        curatorNotes: 'Take the Church Street elevator directly to ground concourse with high-contrast tactile pavers.',
      },
      {
        venueId: 'venue-blr-cubbon-park-bandstand',
        sequenceOrder: 2,
        curatorNotes: 'Smooth asphalt walkways shaded by rain trees, equipped with resting benches and armrests every 100 meters.',
      },
      {
        venueId: 'venue-blr-forum-rex-walk',
        sequenceOrder: 3,
        curatorNotes: 'Wrap up at Rex Walk for step-free dining with elevator access to all levels.',
      },
    ],
  },
  {
    id: 'guide-quiet-central-sensory',
    title: 'Low-Sensory Quiet Spaces (Central Bengaluru)',
    description: 'Tested quiet corners with low ambient noise (<60 dB), glare-free lighting, and uncrowded seating options.',
    neighborhood: 'MG Road / Ashok Nagar',
    city: 'Bengaluru',
    tags: ['Sensory Friendly', 'Low Noise', 'Resting Benches', 'Neurodivergent'],
    isCurated: true,
    followersCount: 92,
    isSaved: false,
    items: [
      {
        venueId: 'venue-blr-blossom-book-house',
        sequenceOrder: 1,
        curatorNotes: 'Quiet book stacks on upper level; soft ambient light and minimal background chatter.',
      },
      {
        venueId: 'venue-blr-cubbon-park-bandstand',
        sequenceOrder: 2,
        curatorNotes: 'Peaceful natural canopy with dedicated shaded seating areas.',
      },
    ],
  },
];

export const INITIAL_AI_SUMMARIES: Record<string, AiSummaryResult> = {
  'venue-blr-church-st-metro': {
    id: 'ai-sum-metro-01',
    venueId: 'venue-blr-church-st-metro',
    persona: 'power_wheelchair',
    verdict: 'MG Road Metro is highly accessible for power wheelchair users with zero-curb street entry and a wide 92 cm elevator car as of 2026-10-11.',
    highlights: [
      'Gentle 1:14.5 entrance ramp directly from Church Street sidewalk.',
      'Wide automatic fare gates and elevator with tactile braille buttons and audio floor cues.',
      'Dedicated accessible washroom with sturdy grab rails and 165 cm turning radius.',
    ],
    watchOuts: [
      'Sidewalk crowd density on Church Street can be heavy on weekend evenings between 6 PM and 9 PM.',
    ],
    sourceReviewIds: ['rev-01', 'rev-02', 'rev-03'],
    asOfDate: '2026-10-11',
    thumbsDownCount: 0,
    isReported: false,
  },
  'venue-blr-cubbon-park-bandstand': {
    id: 'ai-sum-cubbon-01',
    venueId: 'venue-blr-cubbon-park-bandstand',
    persona: 'limited_ambulatory',
    verdict: 'Cubbon Park Bandstand Walkway offers gentle terrain with supportive armrest benches every 80-100 meters as of 2026-10-11.',
    highlights: [
      'Completely flat paved asphalt without steep curb drops.',
      'Frequent shaded seating benches with sturdy metal armrests for easy standing assistance.',
      'Accessible public washrooms near the central pavilion.',
    ],
    watchOuts: [
      'Vehicular traffic allowed on peripheral roads on weekdays; enter via pedestrian gate.',
    ],
    sourceReviewIds: ['rev-04', 'rev-05'],
    asOfDate: '2026-10-11',
    thumbsDownCount: 0,
    isReported: false,
  },
  'venue-blr-koshy-cafe': {
    id: 'ai-sum-koshy-01',
    venueId: 'venue-blr-koshy-cafe',
    persona: 'power_wheelchair',
    verdict: 'Koshy Restaurant presents severe physical barriers for power wheelchair users due to 3 exterior stone steps with no ramp alternative as of 2026-10-11.',
    highlights: [
      'Ground floor seating has solid heritage wooden chairs.',
    ],
    watchOuts: [
      'CRITICAL: 3 steep entrance steps without ramp or mechanical lift.',
      'Narrow entry doorway (76 cm) below the 81 cm universal standard.',
      'No accessible washroom on premises.',
    ],
    sourceReviewIds: ['rev-06', 'rev-07'],
    asOfDate: '2026-10-11',
    thumbsDownCount: 0,
    isReported: false,
  },
};

export const INITIAL_TRENDING_VENUES: TrendingVenueItem[] = [
  {
    venue: BENGALURU_VENUES[0], // MG Road Metro
    activityCount24h: 14,
    lastActivityAt: '25 mins ago',
    highlightTag: '9 New Photo Verifications',
  },
  {
    venue: BENGALURU_VENUES[4], // Third Wave Coffee Indiranagar
    activityCount24h: 9,
    lastActivityAt: '1 hour ago',
    highlightTag: 'Ramp slope re-verified (1:13)',
  },
  {
    venue: BENGALURU_VENUES[3], // Cubbon Park
    activityCount24h: 8,
    lastActivityAt: '2 hours ago',
    highlightTag: 'New Rest Bench Added',
  },
  {
    venue: BENGALURU_VENUES[5], // Manipal Hospital
    activityCount24h: 6,
    lastActivityAt: '4 hours ago',
    highlightTag: 'Stretcher Lift Verified',
  },
];

export const INITIAL_REPORTS_QUEUE: ModerationReport[] = [
  {
    id: 'rep-01',
    targetType: 'review',
    targetId: 'rev-fake-01',
    reason: 'Remote spam review claiming steep stairs are step-free without photo proof.',
    details: 'Reviewer coordinates were 45 km outside Bengaluru.',
    status: 'pending',
    createdAt: '2026-10-10T14:30:00Z',
  },
  {
    id: 'rep-02',
    targetType: 'ai_summary',
    targetId: 'ai-sum-metro-01',
    reason: 'Temporary crowd warning timing needs slight adjustment for Sunday afternoon pedestrianization.',
    details: 'Church Street closes to cars on Sundays.',
    status: 'pending',
    createdAt: '2026-10-11T09:15:00Z',
  },
];
