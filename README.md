# AccessPath – Community-Driven Accessibility Discovery & Rewards Platform

> **Supported Indian Metro Cities**: Bengaluru (Karnataka), Mumbai (Maharashtra), Delhi NCR, Chennai (Tamil Nadu).  
> **Standard**: WCAG 2.2 AA compliant • India DPDP Act 2023 compliant data governance.

AccessPath replaces vague star ratings with structured, verifiable accessibility data tailored to specific mobility, sensory, cognitive, and ambulatory personas.

---

## 1. Complete Architecture Across All 3 Phases

### Phase 1: MVP Core
- **Physical Scoring Engine**: Pure TypeScript/SQL function evaluating 5 pillars:
  - Step-Free Access (25%), Lifts & Vertical Transit (20%), Accessible Washrooms (25%), Rest & Seating (15%), Wayfinding & Sensory (15%).
  - Physical thresholds: ramp slope $\le 1:12$ (ratio $\ge 12$), door clearance $\ge 81\text{ cm}$ (32 in).
  - Missing data is marked "Unknown", excluded from weight renormalization, and **never treated as zero**.
  - Hard constraints (e.g. entrance stairs without ramp for Power Wheelchairs) cap the persona match at 25% with explicit reasons.
- **PWA Offline Queue**: IndexedDB storage (`src/db/offlineQueue.ts`) capturing community reviews without connectivity and synchronizing automatically upon reconnection.
- **Equal Views**: Interactive Leaflet OpenStreetMap view paired with an **Equal Keyboard-Operable List View**.
- **Privacy & Safety**: Client-side EXIF scrubbing complying with India's DPDP Act 2023 principles; explicit opt-in consent for sensitive persona data.

### Phase 2: Community & Trust
- **Reputation-Weighted Scoring**: Reviewer trust scores ($0\text{ to }100$) growing with photo-verified and geofenced audits, decaying over time ($1.0\times \rightarrow 0.4\times$).
- **Anti-Abuse Protections**: Geofence radius check ($\le 150\text{ m}$), rate limits (5/hour), 24h duplicate prevention, and moderation queue.
- **Temporary Status Alerts**: Live notifications for broken elevators or ramp repairs, activated by $\ge 2$ reports or $1$ trusted reporter ($\ge 50$ trust), auto-expiring in 48 hours.
- **Curated Guides**: Sequential accessible routes (e.g. *"Step-Free Coffee Crawl (Indiranagar)"*).
- **Grounded AI Synthesis (Gemini Edge Function)**: Persona-tailored verdicts grounded strictly in cited reviews with *"as of <date>"* and reporting mechanisms.
- **Trending Section**: 24h verified activity with a WCAG 2.2.2 pause-able carousel and static grid alternative.

### Phase 3: Rewards & Growth
- **Append-Only Points Ledger**: Base review (50 pts), photo bonus (+50 pts), first-time mapper bonus (+200 pts). Points are granted only after fraud checks pass (geofence, rate limit, duplicate checks).
- **Venue Partner Portal**: Local merchants claim listings, create coupons (budget caps, per-user limits, expiry dates), and verify redemptions live using customer codes (`AP-XXXX-BLR`) or QR codes.
- **Rewards Wallet**: Redeem points for partner vouchers, view active passes, and inspect the points audit ledger.
- **Table-Side QR**: Deep link table placards that simulate on-site scans and automatically verify geofence physical presence.
- **Social Sharing**: Shareable visual cards and Web Share API integration with proof submission for quality awareness contributions (no scraping, no gaming on views/likes).

---

## 2. Directory Structure

```
WayZen/
├── index.html                           # Accessible HTML5 root with meta tags & fonts
├── package.json
├── tailwind.config.js                   # WCAG compliant contrast tokens & min 44px touch targets
├── tsconfig.json & tsconfig.app.json
├── vitest.config.ts                     # Test runner configuration (JSDOM environment)
├── supabase/
│   ├── migrations/
│   │   ├── 20261011000000_accesspath_core_schema.sql  # PostGIS schema, GiST index, RLS policies, RPC
│   │   ├── 20261011010000_phase2_community_trust.sql  # Alerts, guides, ai_summaries, reports
│   │   └── 20261011020000_phase3_rewards_growth.sql   # points_ledger, partners, coupons, redemptions
│   └── functions/
│       └── synthesize-venue-summary/    # Supabase Edge Function calling Gemini API
├── scripts/
│   └── seed-osm-overpass.ts             # OpenStreetMap Overpass tag-to-pillar transformer
├── src/
│   ├── main.tsx
│   ├── App.tsx                          # Root container with all modals, views, and workflows
│   ├── index.css                        # High contrast, text scaling (100%-200%), reduced-motion styles
│   ├── types/
│   │   ├── accessibility.ts             # Domain models (Pillars, Personas, Features, Reviews)
│   │   ├── community.ts                 # Phase 2 models (Alerts, Guides, AI summaries, Moderation)
│   │   └── rewards.ts                   # Phase 3 models (Ledger, Coupons, Redemptions, Partners)
│   ├── i18n/
│   │   ├── types.ts                     # Localization dictionary types & language definitions
│   │   ├── LanguageContext.tsx          # Language provider, hook, and persistence
│   │   ├── LanguageContext.test.tsx     # Multilingual tests (5 test cases)
│   │   └── locales/                     # Dictionaries: en, kn (ಕನ್ನಡ), hi (हिंदी), ta (தமிழ்)
│   ├── scoring/
│   │   ├── engine.ts                    # Pure WCAG scoring engine, weight reweighting & hard constraints
│   │   ├── engine.test.ts               # 10 unit test cases for physical thresholds & constraints
│   │   ├── reputation.ts                # Reviewer trust scores, recency decay, geofencing, rate limits
│   │   ├── reputation.test.ts           # 12 unit test cases for anti-abuse & alert activation
│   │   ├── rewards.ts                   # Points evaluation, fraud checks, coupon validation, code generation
│   │   └── rewards.test.ts              # 12 unit test cases for rewards & coupon rules
│   ├── db/
│   │   ├── mockData.ts                  # Bengaluru seed dataset (Metro, Koshys, Blossoms, Hospitals)
│   │   ├── communityData.ts             # Phase 2 seed data (Alerts, Guides, AI summaries, Trending)
│   │   ├── rewardsData.ts               # Phase 3 seed data (Coupons, Partners, Ledger, Redemptions)
│   │   └── offlineQueue.ts              # IndexedDB queue for offline review caching & auto-sync
│   ├── services/
│   │   └── aiSynthesisService.ts        # Grounded AI synthesis service with Gemini & fallback
│   ├── utils/
│   │   ├── geo.ts                       # Haversine distance & formatting
│   │   └── exif.ts                      # Client-side EXIF stripper (DPDP compliance)
│   ├── context/
│   │   ├── AccessibilityContext.tsx     # High contrast, text scale, reduced motion, aria-live
│   │   ├── AuthContext.tsx              # Personas, consent management, data export/erasure
│   │   └── LocationContext.tsx          # GPS detection & Bengaluru neighborhood fallback
│   └── components/
│       ├── a11y/
│       │   ├── SkipLink.tsx             # Skip to main content / search / controls
│       │   ├── LiveAnnouncer.tsx        # Screen reader aria-live announcements
│       │   └── TrafficLightBadge.tsx    # Non-color-only status badges (Shape + Icon + Label)
│       ├── layout/
│       │   ├── Navbar.tsx               # Top header, search, GPS, view switcher, persona chip, wallet
│       │   └── AccessibilityToolbar.tsx # Persistent a11y controls, moderation link & DPDP data export
│       ├── onboarding/
│       │   └── PersonaSelectorModal.tsx # Multi-select personas + DPDP explicit consent
│       ├── map/
│       │   ├── VenueMap.tsx             # Interactive Leaflet map with custom status markers
│       │   └── AccessibleVenueList.tsx  # Equal keyboard-operable sortable list
│       ├── venue/
│       │   ├── VenueCard.tsx            # Venue card with scores, traffic lights, QR & review actions
│       │   ├── VenueDetail.tsx          # 5-pillar breakdown, confidence meter, verified photos & AI verdict
│       │   ├── PillarBreakdown.tsx      # Detailed physical measurements & hard constraint alerts
│       │   └── ConfidenceMeter.tsx      # Verification levels (Photo, Partner, Community, Imported)
│       ├── community/
│       │   ├── TemporaryAlertBanner.tsx # Live alert banner for broken lifts and repairs
│       │   ├── ReportOutageModal.tsx    # Outage reporting modal with trust score check
│       │   ├── CuratedGuidesSection.tsx # Thematic accessible routes & save actions
│       │   ├── GuideDetailModal.tsx     # Itinerary view with curator advice and stops
│       │   ├── AiSummaryCard.tsx        # Grounded Gemini synthesis with citation dates & report action
│       │   ├── TrendingSection.tsx      # Pause-able accessible carousel & static grid
│       │   └── ModerationDashboardModal.tsx # Flag queue and geofence moderation
│       ├── rewards/
│       │   ├── RewardsWalletModal.tsx   # Points balance, coupon redemption, active passes & ledger
│       │   ├── VenuePartnerPortalModal.tsx # Listing claims, coupon creation & code verification
│       │   ├── TableSideQrModal.tsx     # Table-side QR code generator & scan simulation
│       │   └── SocialShareModal.tsx     # Shareable visual card & Web Share API
│       └── review/
│           ├── TrafficLightInput.tsx    # Fast 3-state touch/keyboard selector (Green/Yellow/Red)
│           ├── QuickReviewModal.tsx     # Review flow with mandatory photo alt-text & offline save
│           └── OfflineSyncBanner.tsx    # Online/offline network monitor & sync trigger
└── tests/
    └── a11y.spec.tsx                    # Axe-core automated WCAG 2.2 AA tests (12 test cases)
```

---

## 3. Setup & Verification

```bash
# Install dependencies
npm install

# Run complete Vitest suite (55 tests: 10 scoring, 12 reputation, 12 rewards, 4 multi-city, 5 multilingual, 12 axe-core)
npm test

# Run TypeScript type check
npx tsc -b

# Build production bundle
npm run build

# Start local development server
npm run dev
```

---

## 4. Manual QA Checklist

### 1. Screen Reader (NVDA / VoiceOver / TalkBack)
- [ ] Tab to the top of the page; ensure the **SkipLink** appears and activates with `Enter`.
- [ ] Verify that every **TrafficLightBadge** announces its state via text, not color alone.
- [ ] Verify that `TemporaryAlertBanner` has `role="alert"` and announces new outages.
- [ ] Check that `TrendingSection` carousel states (Pause/Resume, Slide X of Y) are announced.
- [ ] Verify that all venue photos include mandatory descriptive `alt` attributes.
- [ ] Check that `RewardsWalletModal`, `VenuePartnerPortalModal`, `TableSideQrModal`, and `SocialShareModal` have proper ARIA dialog labels.

### 2. Keyboard-Only Navigation
- [ ] Navigate the entire interface using only `Tab`, `Shift+Tab`, `Space`, `Enter`, and `Escape`.
- [ ] Verify visible focus rings (minimum 3px solid sky/yellow outline) on all controls.
- [ ] Verify all modals dismiss cleanly on `Escape` without focus traps.
- [ ] Use `TrendingSection` carousel controls (Previous, Next, Pause, Grid Toggle) with keyboard.

### 3. 200% Zoom / Text Scaling
- [ ] Click **Text Scale** in the Accessibility Toolbar to cycle 100%, 125%, 150%, 200%.
- [ ] Verify no text clipping or broken flex wraps occur.
- [ ] Confirm all touch targets remain $\ge 44\text{px} \times 44\text{px}$.

### 4. Rewards, Partner & Community Flows
- [ ] Click the Points chip in the header (e.g. `350 pts`) to open the **Rewards Wallet**.
- [ ] In the wallet, redeem a partner coupon (e.g. Third Wave Coffee 15% off) and note the generated code (`AP-XXXX-BLR`).
- [ ] Open the **Merchant Partner Portal**, enter the generated code, and verify it marks as redeemed.
- [ ] Click the **QR Code** button on any venue card to simulate scanning a table-side placard.
- [ ] Click the **Share** button on any venue to generate a high-contrast accessibility card preview with `#AccessPath`.
- [ ] In `TemporaryAlertBanner`, click "Still Broken" to confirm live outage increments.
