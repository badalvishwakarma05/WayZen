# WayZen – Complete Platform Master Guide & Technical Handbook

> **Project Name**: WayZen  
> **Repository**: [https://github.com/badalvishwakarma05/WayZen](https://github.com/badalvishwakarma05/WayZen)  
> **Standard**: WCAG 2.2 AA Compliant • India DPDP Act 2023 Compliant  
> **Supported Cities**: Bengaluru (Karnataka), Mumbai (Maharashtra), Delhi NCR, Chennai (Tamil Nadu)  
> **Languages**: English, Kannada (ಕನ್ನಡ), Hindi (हिंदी), Tamil (தமிழ்)  
> **Platforms**: Web (Vite + React) & Android Mobile App (Capacitor Native APK)

---

## 1. Project Overview & Core Mission

WayZen is a community-driven accessibility discovery and rewards platform for public places in India.

### Why WayZen Exists:
Generic platforms use vague 4-star ratings like *"Great place, very accessible!"* which do not tell a power wheelchair user if there are 3 entrance steps without a ramp, or whether a washroom has grab bars and a $150\text{ cm}$ turning circle.

WayZen replaces subjective star ratings with **verifiable physical measurements**:
- **Entrance**: Step-free access, ramp slope gradient ($\le 1:12$), doorway clearance ($\ge 81\text{ cm}$ / 32 in).
- **Vertical Transit**: Working elevators, minimum $85\text{ cm}$ door width, braille buttons, voice announcements.
- **Washrooms**: Ground-floor/lift access, grab bars, turning circle ($\ge 150\text{ cm}$), emergency pull cords.
- **Rest & Seating**: Priority seating, armrests for standing assistance, quiet decompression zones.
- **Wayfinding & Sensory**: Tactile paving grids, high-contrast signage, low sensory noise zones.

---

## 2. All Features & User Actions (Kaam Kaise Karta Hai)

### Action 1: Onboarding & Persona Selection ("My Needs")
- **Where**: Top header button (`Select Persona` / `My Needs & Persona`).
- **How it works**:
  - Users choose from 6 personas:
    1. **Power Wheelchair**: Hard blocker on steps; requires ramp $\le 1:12$, wide doorways ($\ge 81\text{ cm}$), and working lifts.
    2. **Manual Wheelchair**: Gentle ramps, level thresholds, accessible washrooms.
    3. **Cane / Walker / Ambulatory**: Minimal stairs, non-slip flooring, frequent rest seating.
    4. **Sensory & Neurodivergent**: Low noise, dimmable/natural lighting, quiet spaces.
    5. **Deaf & Hard of Hearing**: Visual signage, clear wayfinding, flashing alarms.
    6. **Stroller & Parents**: Smooth ramps, family washrooms, elevator access.
  - **DPDP Act 2023 Consent**: Explicit checkbox consent is required. All persona preferences remain stored locally on device (`localStorage`) and are never uploaded without consent.

### Action 2: Multi-City Navigation & Filters
- **Where**: Header City Pill (`Bengaluru`, `Mumbai`, `Delhi NCR`, `Chennai`).
- **How it works**:
  - Selecting a city dynamically pans map coordinates to that metropolis.
  - Loads local neighborhoods (e.g. Church Street in Bengaluru, Fort/Colaba in Mumbai, Connaught Place in Delhi, Besant Nagar in Chennai).
  - **GPS Button**: Real-time geolocation detection.
  - **Radius Filter**: 1 km, 3 km, 5 km, 15 km, 30 km radius filtering.
  - **Category Tabs**: Filter between All Places, Metro & Transit, Cafes & Dining, Retail & Books, Parks & Walkways, Healthcare.

### Action 3: Discovery Modes (Interactive Map vs. Equal Accessible List)
- **Interactive Leaflet Map**: Custom high-contrast SVG markers representing Green (Accessible), Yellow (Partially Accessible), Red (Inaccessible), and Gray (Unverified).
- **Equal Keyboard-Operable List View**: Full tab navigation (`Tab`, `Shift+Tab`, `Enter`) with sorting by Match Score, Distance, and Review Count.

### Action 4: Traffic-Light Review Submission Flow
- **Where**: *"Submit Audit"* button on any venue card or modal.
- **How it works**:
  - 4 quick structured questions (Entrance, Lifts, Washroom, Sensory).
  - **Non-Color-Only Badges**: Every option uses Shape + Icon + Text Label + Color (WCAG 1.4.1 compliance).
  - **EXIF Privacy Stripping**: When uploading a photo, client-side HTML5 Canvas strips GPS metadata, phone serial numbers, and camera timestamps before submission.
  - **Offline PWA Queue**: If connectivity drops, reviews are safely queued in IndexedDB (`idb`) and automatically sync in the background once reconnected.

### Action 5: Live Temporary Outage Alerts (Broken Lifts / Ramp Repairs)
- **Where**: Top Alert Banner & *"Report Outage"* button.
- **How it works**:
  - Community members report temporary issues (e.g. *"Platform 2 Elevator Under Maintenance"*).
  - **Activation Rules**: Activated when reported by $\ge 2$ standard users or $1$ trusted reviewer (Trust Score $\ge 50$).
  - **Auto-Expiry**: Automatically expires in 48 hours unless verified as still active.

### Action 6: Curated Guides & Grounded Gemini AI Summaries
- **Curated Guides**: Hand-crafted step-free routes (e.g. *"Indiranagar Step-Free Coffee Crawl"*).
- **Gemini AI Edge Function**: Summarizes physical reviews into persona-tailored verdicts with strict date citations (*"as of DD/MM/YYYY"*). If reviews are sparse (< 3), it warns the user rather than hallucinating. Includes a *"Report Inaccurate AI Summary"* button.

### Action 7: Rewards Wallet & Points Ledger
- **Where**: Header Points chip (e.g. `350 pts`).
- **Points Awarded**:
  - Base audit: **+50 pts**
  - Photo audit: **+50 pts** (Total 100 pts)
  - First-time venue mapper: **+200 pts**
- **Voucher Redemption**: Users exchange points for merchant discount passes (`AP-XXXX-BLR`) with QR codes.

### Action 8: Venue Partner Portal (For Business Owners)
- **Where**: *"Partners"* button in the top navigation.
- **How it works**:
  - Local merchants claim their venue listing.
  - Create promotional accessibility campaigns with budget limits, per-user limits, and expiry dates.
  - Verify customer discount passes live by entering the code or scanning QR codes.

### Action 9: Table-Side QR Placards & Social Sharing
- **Table-Side QR**: Deep-link table placards (`https://wayzen.in/venue/:id?source=tableside_qr`). Scanning at the table automatically verifies physical on-site presence ($\le 150\text{ m}$).
- **Social Sharing**: Generates high-contrast accessibility summary preview cards and triggers native Web Share API with `#WayZen`.

### Action 10: Accessibility Toolbar & DPDP Privacy Rights
- **Text Scaling**: 100%, 125%, 150%, 200% without layout clipping.
- **High Contrast**: Yellow-on-black WCAG AAA high-contrast mode.
- **Reduced Motion**: Disables smooth scroll animations and carousel transitions.
- **Multilingual Switcher**: 0ms instant switching between English, Kannada, Hindi, and Tamil.
- **Data Export & Erasure**: Instant 1-click JSON data export and complete right-to-erasure.

---

## 3. Mathematical & Rules Engines (Kaise Calculate Hota Hai)

### 1. Pure 5-Pillar Scoring Engine (`src/scoring/engine.ts`)
- **Pillars & Weights**:
  - Step-Free Entrance: **25%**
  - Lifts & Elevators: **20%**
  - Accessible Washrooms: **25%**
  - Rest & Seating: **15%**
  - Wayfinding & Sensory: **15%**
- **Zero-Penalty Rule**: If a washroom has not been reported, it is marked *"Unknown"*. Missing pillars are **excluded from weight calculation** and the remaining known weights dynamically renormalize to 100%. Missing data is **never penalized as zero**.
- **Hard Constraints**: For power wheelchair users, entrance steps without ramps cap the persona match score at **25%** with explicit blocker warnings.

### 2. Reputation & Anti-Abuse Engine (`src/scoring/reputation.ts`)
- **Trust Score**: Evaluated from $0\text{ to }100$ based on verified audit history and photos.
- **Recency Decay**: Exponential weight decay over 180 days ($1.0\times \rightarrow 0.4\times$) so older data gradually yields to fresh audits.
- **Anti-Abuse Protections**:
  - Geofence verification check: $\le 150\text{ m}$ radius from venue.
  - Rate limiting: Maximum 5 reviews/hour.
  - Duplicate cooldown: 24-hour block for the same user at the same venue.

### 3. Rewards & Fraud Gatekeeper (`src/scoring/rewards.ts`)
- Evaluates points legitimacy:
  - If a review passes geofence ($\le 150\text{ m}$) and velocity checks $\rightarrow$ Points credited immediately.
  - If submitted remotely $\rightarrow$ Points placed in escrow pending community verification.
- Enforces coupon budget limits, per-user limits, and generates redemption codes formatted as `AP-XXXX-BLR`.

---

## 4. Complete Directory & File Map (Kaunsi File Kahan Hai)

```text
WayZen/
├── android/                             # Capacitor Native Android Project (Gradle, Manifest, Java)
│   ├── app/src/main/AndroidManifest.xml
│   └── app/src/main/java/com/example/wayzen/MainActivity.java
├── capacitor.config.ts                  # Capacitor native app configuration
├── index.html                           # Accessible HTML5 root with SEO & font imports
├── package.json                         # Scripts (dev, build, test, lint) and dependencies
├── tailwind.config.js                   # WCAG contrast tokens & 44px min touch targets
├── vercel.json                          # Single-page application rewrites for Vercel
│
├── supabase/
│   ├── migrations/
│   │   ├── 20261011000000_accesspath_core_schema.sql  # PostGIS schema, GiST index, RLS, get_venues_within RPC
│   │   ├── 20261011010000_phase2_community_trust.sql  # Alerts, guides, ai_summaries, reports
│   │   └── 20261011020000_phase3_rewards_growth.sql   # points_ledger, partners, coupons, redemptions
│   └── functions/
│       └── synthesize-venue-summary/                  # Supabase Edge Function calling Gemini API
│
├── scripts/
│   └── seed-osm-overpass.ts             # OpenStreetMap Overpass seeder for BLR, MUM, DEL, CHE
│
├── src/
│   ├── App.tsx                          # Master app layout, routing, modals, and workflow
│   ├── index.css                        # Design system: High contrast, text scale, reduced motion
│   ├── main.tsx                         # React 18 DOM mount point
│   │
│   ├── i18n/                            # Multilingual Localization Engine
│   │   ├── LanguageContext.tsx          # Language provider & persistence
│   │   ├── useLanguage.ts               # Type-safe hook for translations
│   │   ├── context.ts                   # React context definition (circular-dependency free)
│   │   ├── types.ts                     # Schema of translation keys
│   │   └── locales/
│   │       ├── en.ts                    # English dictionary
│   │       ├── kn.ts                    # Kannada (ಕನ್ನಡ) dictionary
│   │       ├── hi.ts                    # Hindi (हिंदी) dictionary
│   │       └── ta.ts                    # Tamil (தமிழ்) dictionary
│   │
│   ├── scoring/                         # Core Mathematical Logic & Unit Tests
│   │   ├── engine.ts                    # 5-Pillar physical scoring & hard constraints
│   │   ├── engine.test.ts               # 10 unit tests for scoring engine
│   │   ├── reputation.ts                # Trust scores, recency decay, geofencing
│   │   ├── reputation.test.ts           # 12 unit tests for anti-abuse & alerts
│   │   ├── rewards.ts                   # Points calculation, fraud gatekeeper, coupons
│   │   ├── rewards.test.ts              # 12 unit tests for rewards & ledger
│   │   └── cities.test.ts               # 4 unit tests for multi-city seed datasets
│   │
│   ├── db/                              # Data Stores & Offline Queue
│   │   ├── mockData.ts                  # Seed venues for BLR, MUM, DEL, CHE
│   │   ├── communityData.ts             # Seed alerts, curated guides, trending places
│   │   ├── rewardsData.ts               # Partner merchants, discount coupons, ledger
│   │   └── offlineQueue.ts              # IndexedDB queue for offline reviews & auto-sync
│   │
│   ├── context/                         # Application State Management
│   │   ├── AccessibilityContext.tsx     # High contrast, text zoom (100-200%), reduced motion
│   │   ├── AuthContext.tsx              # Personas, consent management, DPDP data export/erase
│   │   └── LocationContext.tsx          # Multi-city selection, GPS, neighborhood filters
│   │
│   ├── components/
│   │   ├── a11y/                        # WCAG 2.2 Core Accessibility Elements
│   │   │   ├── SkipLink.tsx             # Skip to content keyboard shortcut
│   │   │   ├── LiveAnnouncer.tsx        # Screen reader ARIA live announcer
│   │   │   └── TrafficLightBadge.tsx    # Non-color-only tri-state status badge
│   │   ├── layout/
│   │   │   ├── Navbar.tsx               # Responsive header (slim sticky bar on mobile, full on desktop)
│   │   │   └── AccessibilityToolbar.tsx # Persistent toolbar with zoom, contrast, language
│   │   ├── map/
│   │   │   ├── VenueMap.tsx             # Interactive Leaflet map with custom markers
│   │   │   └── AccessibleVenueList.tsx  # Equal keyboard-operable list view
│   │   ├── venue/
│   │   │   ├── VenueCard.tsx            # Venue card with badges, scores, quick actions
│   │   │   ├── VenueDetail.tsx          # Full 5-pillar breakdown, verified photos, AI summary
│   │   │   ├── PillarBreakdown.tsx      # Physical measurements display
│   │   │   └── ConfidenceMeter.tsx      # Data confidence calculation display
│   │   ├── community/
│   │   │   ├── TemporaryAlertBanner.tsx # Live outage banner (auto-expires in 48h)
│   │   │   ├── ReportOutageModal.tsx    # Outage reporting modal
│   │   │   ├── CuratedGuidesSection.tsx # Thematic step-free routes
│   │   │   ├── GuideDetailModal.tsx     # Guide route view
│   │   │   ├── TrendingSection.tsx      # 24h activity carousel with pause control
│   │   │   └── ModerationDashboardModal.tsx # Community moderation queue
│   │   ├── rewards/
│   │   │   ├── RewardsWalletModal.tsx   # User wallet, voucher catalog, active passes
│   │   │   ├── VenuePartnerPortalModal.tsx # Merchant listing claim & coupon verification
│   │   │   ├── TableSideQrModal.tsx     # Table-side QR generator & presence simulator
│   │   │   └── SocialShareModal.tsx     # Social sharing card & Web Share API
│   │   └── review/
│   │       ├── QuickReviewModal.tsx     # 4-question review submission modal
│   │       ├── TrafficLightInput.tsx    # Accessible Yes/Partial/No inputs
│   │       └── OfflineSyncBanner.tsx    # IndexedDB offline sync indicator
│   │
│   └── utils/
│       ├── geo.ts                       # Haversine distance calculations
│       └── exif.ts                      # Client-side EXIF privacy stripper
│
└── tests/
    └── a11y.spec.tsx                    # 12 Axe-Core automated WCAG 2.2 AA audit tests
```

---

## 5. Commands Cheat Sheet (Saare Commands Ek Jagah)

### 1. Web Local Development
```powershell
# Start local Vite development server
npm run dev
# Server runs on: http://localhost:5173/ (or 5174 if busy)
```

### 2. Testing & Quality Assurance
```powershell
# Run all 55 automated Vitest & Axe-Core tests
npm test

# Run TypeScript type check
npx tsc -b
```

### 3. Production Build
```powershell
# Compile production bundle to dist/
npm run build
```

### 4. Android Mobile App (Capacitor)
```powershell
# 1. Sync updated web build to Android native project
npx cap copy android

# 2. Build and launch directly on connected Android device (OnePlus)
npx cap run android

# 3. Open Android project in Android Studio (optional)
npx cap open android
```

### 5. Git & GitHub Operations
```powershell
# Check git status
git status

# Commit and push updates to GitHub
git add .
git commit -m "your commit message"
git push origin main
```

### 6. Cloud Deployments
- **Vercel Web Hosting**:
  1-Click Import link: `https://vercel.com/new/clone?repository-url=https://github.com/badalvishwakarma05/WayZen`
- **Supabase Backend**:
  ```powershell
  # Link your Supabase project
  npx supabase link --project-ref <your-project-id>

  # Push migrations
  npx supabase db push

  # Deploy Gemini summary Edge Function
  npx supabase functions deploy synthesize-venue-summary
  ```

---

## 6. Verification Summary (Current Status)

| Check | Result | Details |
|---|:---:|---|
| **Vitest Tests** | **55 / 55 Passed** | 10 scoring + 12 reputation + 12 rewards + 4 cities + 5 i18n + 12 axe-core |
| **Vite Production Build** | **0 Errors** | Compiles cleanly in ~1.5s |
| **Android Native App** | **Installed & Running** | Deployed directly to OnePlus device |
| **GitHub Remote** | **Up to Date** | `https://github.com/badalvishwakarma05/WayZen` |
| **Mobile Header Layout** | **Fixed** | Slim ~44px sticky top bar, sub-controls scroll with page |
