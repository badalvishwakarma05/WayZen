-- ==============================================================================
-- AccessPath Phase 3 Schema: Rewards Ledger, Venue Partners, and Coupons
-- PostgreSQL 15+ with PostGIS and Strict Row Level Security (RLS)
-- ==============================================================================

-- 1. Append-Only Points Ledger (Strict Audit Trail)
CREATE TABLE IF NOT EXISTS public.points_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_delta INT NOT NULL, -- positive for credits, negative for debits/redemptions
    event_type TEXT NOT NULL,  -- 'base_review', 'photo_bonus', 'first_time_mapper', 'coupon_redemption', 'social_share'
    review_id UUID REFERENCES public.reviews(id) ON DELETE SET NULL,
    fraud_check_passed BOOLEAN NOT NULL DEFAULT FALSE,
    escrow_status TEXT NOT NULL DEFAULT 'granted', -- 'granted', 'held_escrow', 'rejected'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON public.points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_fraud ON public.points_ledger(fraud_check_passed);

-- 2. Venue Partners (Merchants claiming listings)
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    tax_or_gst_id TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_partner_venue UNIQUE (venue_id)
);

CREATE INDEX IF NOT EXISTS idx_partners_user ON public.partners(user_id);

-- 3. Partner Coupons Catalog
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points_cost INT NOT NULL CHECK (points_cost > 0),
    discount_value TEXT NOT NULL, -- e.g. "15% off total bill" or "Rs 100 voucher"
    budget_total INT NOT NULL CHECK (budget_total > 0),
    budget_remaining INT NOT NULL CHECK (budget_remaining >= 0),
    limit_per_user INT NOT NULL DEFAULT 1,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_venue ON public.coupons(venue_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active_expiry ON public.coupons(is_active, expires_at);

-- 4. User Coupon Redemptions
CREATE TYPE redemption_status_enum AS ENUM ('active', 'redeemed', 'expired');

CREATE TABLE IF NOT EXISTS public.redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    redemption_code TEXT NOT NULL UNIQUE, -- e.g. "AP-8492-BLR"
    status redemption_status_enum NOT NULL DEFAULT 'active',
    redeemed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON public.redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON public.redemptions(redemption_code);

-- 5. Verified Social Sharing Submissions
CREATE TABLE IF NOT EXISTS public.social_share_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'whatsapp', 'x_twitter', 'instagram', 'linkedin'
    share_url TEXT,
    screenshot_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    points_rewarded INT DEFAULT 0,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. RLS POLICIES FOR PHASE 3
-- ==============================================================================

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_share_submissions ENABLE ROW LEVEL SECURITY;

-- Points Ledger: users can read only their own transactions. STRICT: NO direct UPDATE or DELETE!
CREATE POLICY "Users can view only their own points ledger"
    ON public.points_ledger FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert points ledger entries"
    ON public.points_ledger FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Partners: Public can view verified partners; partners manage their own profile
CREATE POLICY "Public can view partners"
    ON public.partners FOR SELECT
    USING (true);

CREATE POLICY "Users can create partner listing claim"
    ON public.partners FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can update their listing"
    ON public.partners FOR UPDATE
    USING (auth.uid() = user_id);

-- Coupons: Public can view active coupons; partners manage their coupons
CREATE POLICY "Coupons are viewable by everyone"
    ON public.coupons FOR SELECT
    USING (is_active = true AND expires_at > NOW());

CREATE POLICY "Partners can create and manage their coupons"
    ON public.coupons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.partners
            WHERE public.partners.id = public.coupons.partner_id
            AND public.partners.user_id = auth.uid()
        )
    );

-- Redemptions: Users can view their redemptions; partners can verify codes
CREATE POLICY "Users can view their own redemptions"
    ON public.redemptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert redemption"
    ON public.redemptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can verify and update redemption status"
    ON public.redemptions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.coupons c
            JOIN public.partners p ON p.id = c.partner_id
            WHERE c.id = public.redemptions.coupon_id
            AND p.user_id = auth.uid()
        )
    );

-- Social Sharing: Users view and submit their own share proofs
CREATE POLICY "Users view their own social shares"
    ON public.social_share_submissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert social share submissions"
    ON public.social_share_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
