import React, { useState, useMemo } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider, useLocationContext } from './context/LocationContext';
import { SkipLink } from './components/a11y/SkipLink';
import { LiveAnnouncer } from './components/a11y/LiveAnnouncer';
import { AccessibilityToolbar } from './components/layout/AccessibilityToolbar';
import { Navbar } from './components/layout/Navbar';
import { OfflineSyncBanner } from './components/review/OfflineSyncBanner';
import { PersonaSelectorModal } from './components/onboarding/PersonaSelectorModal';
import { VenueMap } from './components/map/VenueMap';
import { AccessibleVenueList } from './components/map/AccessibleVenueList';
import { VenueDetail } from './components/venue/VenueDetail';
import { QuickReviewModal } from './components/review/QuickReviewModal';

// Phase 2 Community & Trust Components
import { TemporaryAlertBanner } from './components/community/TemporaryAlertBanner';
import { ReportOutageModal } from './components/community/ReportOutageModal';
import { CuratedGuidesSection } from './components/community/CuratedGuidesSection';
import { GuideDetailModal } from './components/community/GuideDetailModal';
import { TrendingSection } from './components/community/TrendingSection';
import { ModerationDashboardModal } from './components/community/ModerationDashboardModal';

// Phase 3 Rewards & Growth Components
import { RewardsWalletModal } from './components/rewards/RewardsWalletModal';
import { VenuePartnerPortalModal } from './components/rewards/VenuePartnerPortalModal';
import { TableSideQrModal } from './components/rewards/TableSideQrModal';
import { SocialShareModal } from './components/rewards/SocialShareModal';

import { INITIAL_ALERTS, INITIAL_GUIDES, INITIAL_TRENDING_VENUES } from './db/communityData';
import {
  INITIAL_COUPONS,
  INITIAL_PARTNERS,
  INITIAL_USER_LEDGER,
  INITIAL_USER_REDEMPTIONS,
} from './db/rewardsData';
import {
  calculateUserPointsBalance,
  evaluateReviewPoints,
} from './scoring/rewards';

import { Venue, ReviewSubmission } from './types/accessibility';
import { CuratedGuide, TemporaryAlert } from './types/community';
import { PartnerCoupon, PartnerVenue, PointsLedgerEntry, UserRedemption } from './types/rewards';
import { ShieldCheck, HeartHandshake, MapPin, Sparkles, Award } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [reviewingVenue, setReviewingVenue] = useState<Venue | null>(null);

  // Phase 2 State
  const [alerts, setAlerts] = useState<TemporaryAlert[]>(INITIAL_ALERTS);
  const [guides, setGuides] = useState<CuratedGuide[]>(INITIAL_GUIDES);
  const [selectedGuide, setSelectedGuide] = useState<CuratedGuide | null>(null);
  const [outageVenue, setOutageVenue] = useState<Venue | null>(null);
  const [isModerationOpen, setIsModerationOpen] = useState(false);

  // Phase 3 State
  const [coupons, setCoupons] = useState<PartnerCoupon[]>(INITIAL_COUPONS);
  const [partners, setPartners] = useState<PartnerVenue[]>(INITIAL_PARTNERS);
  const [ledger, setLedger] = useState<PointsLedgerEntry[]>(INITIAL_USER_LEDGER);
  const [redemptions, setRedemptions] = useState<UserRedemption[]>(INITIAL_USER_REDEMPTIONS);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isPartnerPortalOpen, setIsPartnerPortalOpen] = useState(false);
  const [qrVenue, setQrVenue] = useState<Venue | null>(null);
  const [shareVenue, setShareVenue] = useState<Venue | null>(null);

  const {
    venues,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    radiusKm,
    latitude,
    longitude,
    addVenueReview,
  } = useLocationContext();

  const userPointsBalance = useMemo(() => calculateUserPointsBalance(ledger), [ledger]);

  // Filter venues by category, search query, and radius
  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      // Category filter
      if (selectedCategory !== 'all' && v.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.name.toLowerCase().includes(q);
        const matchAddress = v.address.toLowerCase().includes(q);
        const matchTags = v.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchAddress && !matchTags) return false;
      }
      // Radius filter
      if (v.distanceMeters !== undefined && v.distanceMeters > radiusKm * 1000) {
        return false;
      }
      return true;
    });
  }, [venues, selectedCategory, searchQuery, radiusKm]);

  // Phase 3: Points reward granted upon verified review submission
  const handleReviewSuccess = (review: ReviewSubmission) => {
    if (reviewingVenue) {
      addVenueReview(reviewingVenue.id, review);

      // Evaluate points with fraud checks
      const pointsEval = evaluateReviewPoints({
        userId: 'demo-user-blr-01',
        isFirstReviewEver: ledger.length <= 3,
        hasPhoto: Boolean(review.photoDataUrl),
        userLat: latitude,
        userLng: longitude,
        venueLat: reviewingVenue.latitude,
        venueLng: reviewingVenue.longitude,
        recentTimestamps: [Date.now()],
      });

      if (pointsEval.totalPoints > 0) {
        const newLedgerEntry: PointsLedgerEntry = {
          id: 'ledger-' + Date.now(),
          userId: 'demo-user-blr-01',
          pointsDelta: pointsEval.totalPoints,
          eventType: review.photoDataUrl ? 'photo_bonus' : 'base_review',
          fraudCheckPassed: pointsEval.fraudCheckPassed,
          escrowStatus: pointsEval.escrowStatus,
          description: `Verified audit for ${reviewingVenue.name} (${pointsEval.reasons[0]})`,
          createdAt: new Date().toISOString(),
        };
        setLedger((prev) => [newLedgerEntry, ...prev]);
      }
    }
  };

  const handleConfirmAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, confirmationCount: a.confirmationCount + 1 } : a
      )
    );
  };

  const handleSelectVenueById = (venueId: string) => {
    const found = venues.find((v) => v.id === venueId);
    if (found) setSelectedVenue(found);
  };

  const handleToggleSaveGuide = (guideId: string) => {
    setGuides((prev) =>
      prev.map((g) =>
        g.id === guideId
          ? {
              ...g,
              isSaved: !g.isSaved,
              followersCount: g.isSaved ? g.followersCount - 1 : g.followersCount + 1,
            }
          : g
      )
    );
    if (selectedGuide && selectedGuide.id === guideId) {
      setSelectedGuide((prev) =>
        prev
          ? {
              ...prev,
              isSaved: !prev.isSaved,
              followersCount: prev.isSaved ? prev.followersCount - 1 : prev.followersCount + 1,
            }
          : null
      );
    }
  };

  // Phase 3 Coupon & Partner Handlers
  const handleRedeemCoupon = (
    coupon: PartnerCoupon,
    newRedemption: UserRedemption,
    pointsDelta: number
  ) => {
    setRedemptions((prev) => [newRedemption, ...prev]);

    // Debit ledger (append-only)
    const debitEntry: PointsLedgerEntry = {
      id: 'ledger-' + Date.now(),
      userId: 'demo-user-blr-01',
      pointsDelta,
      eventType: 'coupon_redemption',
      fraudCheckPassed: true,
      escrowStatus: 'granted',
      description: `Claimed voucher: ${coupon.title} at ${coupon.venueName}`,
      createdAt: new Date().toISOString(),
    };
    setLedger((prev) => [debitEntry, ...prev]);

    // Decrement coupon budget
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === coupon.id ? { ...c, budgetRemaining: Math.max(0, c.budgetRemaining - 1) } : c
      )
    );
  };

  const handleCreateCoupon = (newCoupon: PartnerCoupon) => {
    setCoupons((prev) => [newCoupon, ...prev]);
  };

  const handleVerifyRedemption = (code: string): boolean => {
    let found = false;
    setRedemptions((prev) =>
      prev.map((r) => {
        if (r.redemptionCode === code && r.status === 'active') {
          found = true;
          return { ...r, status: 'redeemed' as const, redeemedAt: new Date().toISOString() };
        }
        return r;
      })
    );
    return found;
  };

  const handleSubmitShareProof = (venueId: string, shareUrl: string) => {
    const venue = venues.find((v) => v.id === venueId);
    const newEntry: PointsLedgerEntry = {
      id: 'ledger-' + Date.now(),
      userId: 'demo-user-blr-01',
      pointsDelta: 30,
      eventType: 'social_share',
      fraudCheckPassed: true,
      escrowStatus: 'granted',
      description: `Quality social awareness credit: shared ${venue ? venue.name : 'venue'}`,
      createdAt: new Date().toISOString(),
    };
    setLedger((prev) => [newEntry, ...prev]);
  };

  const categories = [
    { id: 'all', label: 'All Public Places' },
    { id: 'transit', label: 'Metro & Transit' },
    { id: 'cafe', label: 'Cafes & Dining' },
    { id: 'shopping', label: 'Retail & Books' },
    { id: 'park', label: 'Parks & Walkways' },
    { id: 'healthcare', label: 'Hospitals & Healthcare' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SkipLink />
      <LiveAnnouncer />
      <AccessibilityToolbar onOpenModeration={() => setIsModerationOpen(true)} />
      <OfflineSyncBanner />
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        pointsBalance={userPointsBalance}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenPartnerPortal={() => setIsPartnerPortalOpen(true)}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Phase 2: Temporary Outages & Status Alerts Banner */}
        <TemporaryAlertBanner
          alerts={alerts}
          onSelectVenue={handleSelectVenueById}
          onConfirmAlert={handleConfirmAlert}
        />

        {/* Value Proposition Hero Banner */}
        <section
          aria-labelledby="hero-title"
          className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden"
        >
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
              <span>Verifiable Physical Data • Non-Gameable Community Rewards</span>
            </div>
            <h1 id="hero-title" className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2">
              Discover Places That Work For <span className="text-sky-300 underline decoration-sky-400">YOU</span>
            </h1>
            <p className="text-sm md:text-base text-slate-200 mb-4 leading-relaxed">
              Vague "4-star accessibility" doesn't tell you if a power wheelchair can enter or if a washroom has grab rails. AccessPath tracks structured ramp slopes, clear doorway dimensions, tactile indicators, and sensory environments across Bengaluru.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-sky-200">
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                WCAG 2.2 AA Compliant
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <HeartHandshake className="w-4 h-4 text-amber-400" aria-hidden="true" />
                Community Verified in Bengaluru
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Award className="w-4 h-4 text-yellow-300" aria-hidden="true" />
                {userPointsBalance} Accessible Points
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <MapPin className="w-4 h-4 text-rose-400" aria-hidden="true" />
                Within {radiusKm} km radius
              </span>
            </div>
          </div>
        </section>

        {/* Phase 2: Trending Section (Pause-able Accessible Carousel) */}
        <TrendingSection
          items={INITIAL_TRENDING_VENUES}
          onSelectVenue={(v) => setSelectedVenue(v)}
        />

        {/* Category Pills Bar */}
        <nav aria-label="Filter venues by category" className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all border min-h-[44px] ${
                selectedCategory === cat.id
                  ? 'bg-sky-700 text-white border-sky-800 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Discovery View Area */}
        <section id="venue-discovery" aria-label="Venue Discovery Results">
          {viewMode === 'map' ? (
            <div className="space-y-4">
              <VenueMap
                venues={filteredVenues}
                userLat={latitude}
                userLng={longitude}
                onSelectVenue={(v) => setSelectedVenue(v)}
                selectedVenue={selectedVenue}
              />
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>
                  Tip: Switch to <strong>Accessible List View</strong> anytime for full screen-reader and keyboard optimization.
                </span>
                <button
                  onClick={() => setViewMode('list')}
                  className="font-bold text-sky-700 dark:text-sky-400 hover:underline min-h-[36px]"
                >
                  Switch to List View →
                </button>
              </div>
            </div>
          ) : (
            <AccessibleVenueList
              venues={filteredVenues}
              onSelectVenue={(v) => setSelectedVenue(v)}
              onOpenReview={(v) => setReviewingVenue(v)}
              onOpenTableSideQr={(v) => setQrVenue(v)}
            />
          )}
        </section>

        {/* Phase 2: Curated Community Guides */}
        <CuratedGuidesSection
          guides={guides}
          onSelectGuide={(g) => setSelectedGuide(g)}
          onToggleSave={handleToggleSaveGuide}
        />
      </main>

      {/* Accessible Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              AccessPath India – Accessible Discovery & Rewards Platform
            </p>
            <p className="mt-1">
              Compliant with WCAG 2.2 AA standards & India's Digital Personal Data Protection (DPDP) Act 2023.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 dark:text-slate-300 font-medium">
            <span>Map Data © OpenStreetMap</span>
            <span>•</span>
            <span>Bengaluru Pilot</span>
            <span>•</span>
            <button
              onClick={() => setIsPartnerPortalOpen(true)}
              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline min-h-[44px] flex items-center"
            >
              Merchant Partner Portal
            </button>
            <span>•</span>
            <button
              onClick={() => setIsModerationOpen(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline min-h-[44px] flex items-center"
            >
              Moderator Queue
            </button>
            <span>•</span>
            <button
              onClick={() => alert('AccessPath adheres to DPDP Act 2023 principles: Purpose limitation, minimal collection, explicit opt-in consent for sensitive persona data, and instant right to erasure.')}
              className="text-sky-700 dark:text-sky-400 hover:underline min-h-[44px] flex items-center"
            >
              DPDP Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PersonaSelectorModal />
      <VenueDetail
        venue={selectedVenue}
        onClose={() => setSelectedVenue(null)}
        onOpenReview={(v) => setReviewingVenue(v)}
        onOpenReportOutage={(v) => setOutageVenue(v)}
        onOpenTableSideQr={(v) => setQrVenue(v)}
        onOpenSocialShare={(v) => setShareVenue(v)}
      />
      <QuickReviewModal
        venue={reviewingVenue}
        isOpen={Boolean(reviewingVenue)}
        onClose={() => setReviewingVenue(null)}
        onSubmitSuccess={handleReviewSuccess}
      />
      <GuideDetailModal
        guide={selectedGuide}
        venues={venues}
        onClose={() => setSelectedGuide(null)}
        onSelectVenue={(v) => setSelectedVenue(v)}
        onToggleSave={handleToggleSaveGuide}
      />
      <ReportOutageModal
        venue={outageVenue}
        isOpen={Boolean(outageVenue)}
        onClose={() => setOutageVenue(null)}
        onSubmitAlert={(newAlert) => setAlerts((prev) => [newAlert, ...prev])}
      />
      <ModerationDashboardModal
        isOpen={isModerationOpen}
        onClose={() => setIsModerationOpen(false)}
      />

      {/* Phase 3 Modals */}
      <RewardsWalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        coupons={coupons}
        ledger={ledger}
        redemptions={redemptions}
        onRedeemCoupon={handleRedeemCoupon}
      />
      <VenuePartnerPortalModal
        isOpen={isPartnerPortalOpen}
        onClose={() => setIsPartnerPortalOpen(false)}
        venues={venues}
        partners={partners}
        coupons={coupons}
        redemptions={redemptions}
        onCreateCoupon={handleCreateCoupon}
        onVerifyRedemption={handleVerifyRedemption}
      />
      <TableSideQrModal
        venue={qrVenue}
        isOpen={Boolean(qrVenue)}
        onClose={() => setQrVenue(null)}
        onSimulateScan={(v) => setReviewingVenue(v)}
      />
      <SocialShareModal
        venue={shareVenue}
        isOpen={Boolean(shareVenue)}
        onClose={() => setShareVenue(null)}
        onSubmitShareProof={handleSubmitShareProof}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <LocationProvider>
            <MainAppContent />
          </LocationProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </LanguageProvider>
  );
};

export default App;
