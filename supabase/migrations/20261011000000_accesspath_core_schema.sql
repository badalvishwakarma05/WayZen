-- ==============================================================================
-- AccessPath Core Schema Migration (Phase 1 MVP)
-- PostgreSQL 15+ with PostGIS, Row Level Security (RLS), and Spatial Queries
-- Market: India (DPDP Act 2023 compliant data governance & explicit consent)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Enumerated Types
CREATE TYPE user_persona_type AS ENUM (
    'power_wheelchair',
    'manual_chair_stroller',
    'low_vision',
    'sensory_neurodivergent',
    'limited_ambulatory'
);

CREATE TYPE verification_status_type AS ENUM (
    'unverified_imported',
    'community_reported',
    'photo_verified',
    'partner_verified'
);

CREATE TYPE traffic_light_rating AS ENUM (
    'green_accessible',
    'yellow_partial',
    'red_inaccessible',
    'unknown'
);

-- 3. Profiles Table (DPDP Act explicit consent records)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    reputation_score INT DEFAULT 10,
    dpdp_consent_given_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dpdp_consent_version TEXT NOT NULL DEFAULT 'v1.0-2026',
    data_retention_opt_in BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User Personas (multi-select, sensitive personal data under strict RLS)
CREATE TABLE IF NOT EXISTS public.user_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    persona user_persona_type NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    explicit_consent_given_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_persona UNIQUE (user_id, persona)
);

-- 5. Venues Table (Spatial PostGIS geography with GiST Index)
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    osm_id TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g. 'cafe', 'restaurant', 'transit', 'healthcare', 'shopping', 'park'
    address TEXT NOT NULL,
    neighborhood TEXT,
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    state TEXT NOT NULL DEFAULT 'Karnataka',
    country TEXT NOT NULL DEFAULT 'India',
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    verification_status verification_status_type NOT NULL DEFAULT 'unverified_imported',
    last_verified_at TIMESTAMPTZ,
    composite_score NUMERIC(5,2), -- 0 - 100
    confidence_level NUMERIC(4,2), -- 0.00 - 1.00
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial GiST Index for ultra-fast ST_DWithin radius querying
CREATE INDEX IF NOT EXISTS idx_venues_location_gist ON public.venues USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_venues_category ON public.venues (category);
CREATE INDEX IF NOT EXISTS idx_venues_city ON public.venues (city);

-- 6. Structured Venue Features (Direct Pillar Attributes & Physical Metrics)
CREATE TABLE IF NOT EXISTS public.venue_features (
    venue_id UUID PRIMARY KEY REFERENCES public.venues(id) ON DELETE CASCADE,
    -- Step-Free Access Pillar (Weight: 25)
    entrance_has_steps BOOLEAN,
    entrance_step_count INT,
    ramp_available BOOLEAN,
    ramp_gradient_ratio NUMERIC(5,2), -- e.g., 12.0 for 1:12 slope
    entrance_door_width_cm NUMERIC(5,1), -- threshold >= 81 cm (32 in)
    automatic_door BOOLEAN,
    threshold_height_cm NUMERIC(4,1), -- threshold <= 1.5 cm

    -- Lifts & Vertical Transit Pillar (Weight: 20)
    multiple_levels BOOLEAN DEFAULT FALSE,
    lift_available BOOLEAN,
    lift_door_width_cm NUMERIC(5,1),
    lift_braille_buttons BOOLEAN,
    lift_audio_announcements BOOLEAN,

    -- Accessible Washrooms Pillar (Weight: 25)
    accessible_washroom_available BOOLEAN,
    washroom_door_width_cm NUMERIC(5,1),
    grab_rails_present BOOLEAN,
    wheelchair_turning_radius_cm NUMERIC(5,1), -- threshold >= 150 cm
    emergency_cord_present BOOLEAN,

    -- Rest & Seating Pillar (Weight: 15)
    priority_seating_available BOOLEAN,
    armrests_available BOOLEAN,
    quiet_resting_area BOOLEAN,

    -- Wayfinding & Sensory Pillar (Weight: 15)
    tactile_paving BOOLEAN,
    braille_signage BOOLEAN,
    high_contrast_signage BOOLEAN,
    quiet_hours_schedule TEXT,
    ambient_noise_level TEXT, -- 'quiet', 'moderate', 'loud'
    glare_free_lighting BOOLEAN,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Reviews Table (Traffic Light Community Submissions)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    step_free_rating traffic_light_rating NOT NULL DEFAULT 'unknown',
    lifts_rating traffic_light_rating NOT NULL DEFAULT 'unknown',
    washrooms_rating traffic_light_rating NOT NULL DEFAULT 'unknown',
    rest_seating_rating traffic_light_rating NOT NULL DEFAULT 'unknown',
    sensory_rating traffic_light_rating NOT NULL DEFAULT 'unknown',
    quick_tags TEXT[] DEFAULT '{}',
    comment TEXT,
    is_offline_sync BOOLEAN DEFAULT FALSE,
    reviewer_location GEOGRAPHY(POINT, 4326),
    is_geofence_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_venue_id ON public.reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- 8. Review Photos Table (Strict Alt-Text Enforcement)
CREATE TABLE IF NOT EXISTS public.review_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    alt_text TEXT NOT NULL CHECK (char_length(trim(alt_text)) >= 5), -- Mandatory descriptive alt-text
    verified_coordinates GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_photos_review ON public.review_photos(review_id);

-- 9. Quick Tags Catalog
CREATE TABLE IF NOT EXISTS public.quick_tags (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    category TEXT NOT NULL,
    icon_name TEXT NOT NULL
);

-- Insert baseline quick tags
INSERT INTO public.quick_tags (id, label, category, icon_name) VALUES
    ('stepless_entry', 'Stepless Entry', 'mobility', 'door-open'),
    ('wide_door', 'Wide Doorway (>81cm)', 'mobility', 'expand'),
    ('braille_menu', 'Braille Menu / Signage', 'vision', 'book-open'),
    ('accessible_loo', 'Dedicated Accessible Loo', 'hygiene', 'bath'),
    ('grab_rails', 'Sturdy Grab Rails', 'hygiene', 'shield-check'),
    ('quiet_corner', 'Low Sensory / Quiet Zone', 'sensory', 'volume-x'),
    ('priority_seats', 'Resting Seats with Armrests', 'ambulatory', 'armchair'),
    ('level_flooring', 'Even & Non-Slip Flooring', 'mobility', 'layers'),
    ('tactile_path', 'Tactile Paving Guidelining', 'vision', 'footprints')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_tags ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can view basic info; only owner can update; strict deletion
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile (DPDP Right to Erasure)"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- User Personas: Highly sensitive health/disability preference data.
-- STICTEST RLS: ONLY the authenticated owner can select, insert, update, or delete.
CREATE POLICY "Users can view only their own personas"
    ON public.user_personas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personas"
    ON public.user_personas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personas"
    ON public.user_personas FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personas"
    ON public.user_personas FOR DELETE
    USING (auth.uid() = user_id);

-- Venues: Public discovery is read-only for all users
CREATE POLICY "Venues are viewable by anyone"
    ON public.venues FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create venues"
    ON public.venues FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Venue Features: Publicly readable
CREATE POLICY "Venue features are viewable by anyone"
    ON public.venue_features FOR SELECT
    USING (true);

-- Reviews: Viewable by anyone; insertable by authenticated users (or anonymous with verified token)
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Review Photos: Viewable by everyone; insertable with review
CREATE POLICY "Review photos are viewable by everyone"
    ON public.review_photos FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can upload review photos"
    ON public.review_photos FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Quick tags catalog: viewable by all
CREATE POLICY "Quick tags are viewable by everyone"
    ON public.quick_tags FOR SELECT
    USING (true);

-- ==============================================================================
-- 11. PostGIS SPATIAL RPC FUNCTION: ST_DWithin Radius Discovery
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_venues_within(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 5000,
    category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    address TEXT,
    neighborhood TEXT,
    city TEXT,
    distance_meters DOUBLE PRECISION,
    verification_status verification_status_type,
    last_verified_at TIMESTAMPTZ,
    composite_score NUMERIC,
    confidence_level NUMERIC,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        v.id,
        v.name,
        v.category,
        v.address,
        v.neighborhood,
        v.city,
        ST_Distance(v.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance_meters,
        v.verification_status,
        v.last_verified_at,
        v.composite_score,
        v.confidence_level,
        ST_Y(v.location::geometry) AS latitude,
        ST_X(v.location::geometry) AS longitude
    FROM public.venues v
    WHERE
        ST_DWithin(v.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
        AND (category_filter IS NULL OR category_filter = '' OR v.category = category_filter)
    ORDER BY distance_meters ASC
    LIMIT 100;
$$;
