import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as axe from 'axe-core';
import { TrafficLightBadge } from '../src/components/a11y/TrafficLightBadge';
import { SkipLink } from '../src/components/a11y/SkipLink';
import { AccessibilityToolbar } from '../src/components/layout/AccessibilityToolbar';
import { AccessibilityProvider } from '../src/context/AccessibilityContext';
import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import { VenueCard } from '../src/components/venue/VenueCard';
import { BENGALURU_VENUES } from '../src/db/mockData';

// Phase 2 Components
import { TemporaryAlertBanner } from '../src/components/community/TemporaryAlertBanner';
import { TrendingSection } from '../src/components/community/TrendingSection';
import { CuratedGuidesSection } from '../src/components/community/CuratedGuidesSection';
import { AiSummaryCard } from '../src/components/community/AiSummaryCard';
import {
  INITIAL_ALERTS,
  INITIAL_GUIDES,
  INITIAL_TRENDING_VENUES,
  INITIAL_AI_SUMMARIES,
} from '../src/db/communityData';

// Phase 3 Components
import { RewardsWalletModal } from '../src/components/rewards/RewardsWalletModal';
import { VenuePartnerPortalModal } from '../src/components/rewards/VenuePartnerPortalModal';
import { TableSideQrModal } from '../src/components/rewards/TableSideQrModal';
import { SocialShareModal } from '../src/components/rewards/SocialShareModal';
import {
  INITIAL_COUPONS,
  INITIAL_PARTNERS,
  INITIAL_USER_LEDGER,
  INITIAL_USER_REDEMPTIONS,
} from '../src/db/rewardsData';

describe('WCAG 2.2 AA Accessibility Audits (axe-core)', () => {
  it('TrafficLightBadge does not rely on color alone and has zero axe violations', async () => {
    const { container } = render(
      <div>
        <TrafficLightBadge status="green" label="Accessible Entrance" />
        <TrafficLightBadge status="yellow" label="Partial Assistance" />
        <TrafficLightBadge status="red" label="Inaccessible Entrance" />
        <TrafficLightBadge status="unknown" label="Unverified" />
      </div>
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('SkipLink has zero axe violations and valid target references', async () => {
    const { container } = render(<SkipLink />);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('AccessibilityToolbar meets all button naming and contrast requirements', async () => {
    const { container } = render(
      <LanguageProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <AccessibilityToolbar />
          </AuthProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    );

    const results = await axe.run(container, {
      rules: {
        'button-name': { enabled: true },
        'aria-valid-attr': { enabled: true },
      },
    });
    expect(results.violations).toEqual([]);
  });

  it('VenueCard component conforms to accessibility standards with accessible roles', async () => {
    const mockVenue = BENGALURU_VENUES[0];

    const { container } = render(
      <AccessibilityProvider>
        <AuthProvider>
          <VenueCard
            venue={mockVenue}
            onSelect={() => {}}
            onOpenReview={() => {}}
          />
        </AuthProvider>
      </AccessibilityProvider>
    );

    const results = await axe.run(container, {
      rules: {
        'image-alt': { enabled: true },
        'button-name': { enabled: true },
        'heading-order': { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  describe('Phase 2 Community & Trust Component A11y', () => {
    it('TemporaryAlertBanner announces alerts with role="alert" and passes axe audit', async () => {
      const { container } = render(
        <TemporaryAlertBanner alerts={INITIAL_ALERTS} />
      );

      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('TrendingSection carousel has accessible pause/play and navigation buttons', async () => {
      const { container } = render(
        <AccessibilityProvider>
          <TrendingSection items={INITIAL_TRENDING_VENUES} onSelectVenue={() => {}} />
        </AccessibilityProvider>
      );

      const results = await axe.run(container, {
        rules: {
          'button-name': { enabled: true },
          'aria-roledescription': { enabled: true },
        },
      });
      expect(results.violations).toEqual([]);
    });

    it('CuratedGuidesSection passes axe audit with accessible landmarks and buttons', async () => {
      const { container } = render(
        <CuratedGuidesSection
          guides={INITIAL_GUIDES}
          onSelectGuide={() => {}}
          onToggleSave={() => {}}
        />
      );

      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('AiSummaryCard presents grounded verdicts with proper accessibility semantics', async () => {
      const summary = INITIAL_AI_SUMMARIES['venue-blr-church-st-metro'];
      const { container } = render(
        <AiSummaryCard summary={summary} venueName="MG Road Metro" />
      );

      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('Phase 3 Rewards & Growth Component A11y', () => {
    it('RewardsWalletModal satisfies all dialog and button name requirements', async () => {
      const { container } = render(
        <AccessibilityProvider>
          <RewardsWalletModal
            isOpen={true}
            onClose={() => {}}
            coupons={INITIAL_COUPONS}
            ledger={INITIAL_USER_LEDGER}
            redemptions={INITIAL_USER_REDEMPTIONS}
            onRedeemCoupon={() => {}}
          />
        </AccessibilityProvider>
      );

      const results = await axe.run(container, {
        rules: {
          'button-name': { enabled: true },
          'aria-dialog-name': { enabled: true },
        },
      });
      expect(results.violations).toEqual([]);
    });

    it('VenuePartnerPortalModal meets accessibility requirements for merchant actions', async () => {
      const { container } = render(
        <AccessibilityProvider>
          <VenuePartnerPortalModal
            isOpen={true}
            onClose={() => {}}
            venues={BENGALURU_VENUES}
            partners={INITIAL_PARTNERS}
            coupons={INITIAL_COUPONS}
            redemptions={INITIAL_USER_REDEMPTIONS}
            onCreateCoupon={() => {}}
            onVerifyRedemption={() => true}
          />
        </AccessibilityProvider>
      );

      const results = await axe.run(container, {
        rules: {
          'button-name': { enabled: true },
          'select-name': { enabled: true },
        },
      });
      expect(results.violations).toEqual([]);
    });

    it('TableSideQrModal passes axe audit with accessible scan simulation', async () => {
      const mockVenue = BENGALURU_VENUES[0];
      const { container } = render(
        <AccessibilityProvider>
          <TableSideQrModal
            venue={mockVenue}
            isOpen={true}
            onClose={() => {}}
            onSimulateScan={() => {}}
          />
        </AccessibilityProvider>
      );

      const results = await axe.run(container, {
        rules: {
          'button-name': { enabled: true },
        },
      });
      expect(results.violations).toEqual([]);
    });

    it('SocialShareModal passes axe audit with accessible share actions', async () => {
      const mockVenue = BENGALURU_VENUES[0];
      const { container } = render(
        <AccessibilityProvider>
          <AuthProvider>
            <SocialShareModal
              venue={mockVenue}
              isOpen={true}
              onClose={() => {}}
              onSubmitShareProof={() => {}}
            />
          </AuthProvider>
        </AccessibilityProvider>
      );

      const results = await axe.run(container, {
        rules: {
          'button-name': { enabled: true },
        },
      });
      expect(results.violations).toEqual([]);
    });
  });
});
