-- ==============================================================================
-- AccessPath Phase 2 Schema: Community, Trust, Alerts, AI Synthesis, and Guides
-- PostgreSQL 15+ with PostGIS and Strict Row Level Security (RLS)
-- ==============================================================================

-- 1. Temporary Status Alerts (e.g., "Lift out of service", "Ramp under repair")
CREATE TYPE alert_type_enum AS ENUM (
    'lift_out_of_service',
    'ramp_under_maintenance',
    'washroom_closed',
    'construction_obstacle',
    'entrance_blocked'
);

CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    alert_type alert_type_enum NOT NULL,
    description TEXT NOT NULL,
    reporter_reputation_score INT DEFAULT 10,
    confirmation_count INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_venue ON public.alerts(venue_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active_expires ON public.alerts(is_active, expires_at);

-- 2. Curated Accessibility Guides (e.g. "Step-Free Coffee Crawl in Indiranagar")
CREATE TABLE IF NOT EXISTS public.guides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    tags TEXT[] DEFAULT '{}',
    is_curated BOOLEAN DEFAULT FALSE,
    followers_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guide_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guide_id UUID NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,
    curator_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_guide_venue UNIQUE (guide_id, venue_id)
);

CREATE TABLE IF NOT EXISTS public.guide_saved (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_saved_guide UNIQUE (user_id, guide_id)
);

-- 3. AI Summaries Table (Grounded Gemini synthesis cached with provenance)
CREATE TABLE IF NOT EXISTS public.ai_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    persona user_persona_type NOT NULL,
    verdict TEXT NOT NULL, -- 1-2 sentences per persona
    highlights TEXT[] NOT NULL DEFAULT '{}',
    watch_outs TEXT[] NOT NULL DEFAULT '{}',
    source_review_ids UUID[] NOT NULL DEFAULT '{}',
    as_of_date DATE NOT NULL DEFAULT CURRENT_DATE,
    thumbs_down_count INT DEFAULT 0,
    is_reported BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_venue_persona_summary UNIQUE (venue_id, persona)
);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_venue_persona ON public.ai_summaries(venue_id, persona);

-- 4. Anti-Abuse Reports and Flag Queue (Community Moderation)
CREATE TYPE report_target_enum AS ENUM (
    'review',
    'venue',
    'alert',
    'ai_summary',
    'photo'
);

CREATE TYPE report_status_enum AS ENUM (
    'pending',
    'under_review',
    'resolved',
    'dismissed'
);

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type report_target_enum NOT NULL,
    target_id UUID NOT NULL,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status report_status_enum NOT NULL DEFAULT 'pending',
    moderator_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ==============================================================================
-- 5. RLS POLICIES FOR PHASE 2 TABLES
-- ==============================================================================

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_saved ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Alerts: viewable by all; insertable by authenticated users
CREATE POLICY "Alerts are viewable by everyone"
    ON public.alerts FOR SELECT
    USING (is_active = true AND expires_at > NOW());

CREATE POLICY "Authenticated users can submit alerts"
    ON public.alerts FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Alert reporter or moderator can resolve alert"
    ON public.alerts FOR UPDATE
    USING (auth.uid() = reporter_id);

-- Guides: viewable by all; creators manage their own
CREATE POLICY "Guides are viewable by everyone"
    ON public.guides FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create guides"
    ON public.guides FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their guides"
    ON public.guides FOR UPDATE
    USING (auth.uid() = creator_id);

CREATE POLICY "Guide items viewable by all"
    ON public.guide_items FOR SELECT
    USING (true);

-- Saved Guides: only saved owner can view/manage
CREATE POLICY "Users can manage their saved guides"
    ON public.guide_saved FOR ALL
    USING (auth.uid() = user_id);

-- AI Summaries: publicly viewable
CREATE POLICY "AI summaries are viewable by everyone"
    ON public.ai_summaries FOR SELECT
    USING (true);

-- Reports: users can insert reports; users can view their own reports
CREATE POLICY "Users can report content"
    ON public.reports FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own reports"
    ON public.reports FOR SELECT
    USING (auth.uid() = reporter_id);
