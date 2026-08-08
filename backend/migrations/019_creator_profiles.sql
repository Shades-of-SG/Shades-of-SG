-- Owner: Ferlyn Ng
-- Feature area: Public creator profiles
-- Purpose: Adds creator biography, visibility, and social profile data

-- Public creator biography data is intentionally separated from account/security data.
-- The API remains the only browser-facing data-access layer; this project does not use
-- Supabase client queries, so ownership and public-field filtering are enforced in Express.
create table if not exists creator_public_profiles (
    user_id uuid primary key references users(id) on delete cascade,
    tagline varchar(160),
    bio text,
    languages jsonb not null default '[]'::jsonb,
    content_focus jsonb not null default '[]'::jsonb,
    location varchar(100),
    creator_title varchar(100),
    featured_quote varchar(300),
    social_links jsonb not null default '{}'::jsonb,
    visibility varchar(16) not null default 'PUBLIC'
        check (visibility in ('PUBLIC', 'PRIVATE')),
    show_community_reflections boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists creator_public_profiles_visibility_idx
    on creator_public_profiles (visibility, updated_at desc);

-- No existing rows are touched here. The API returns safe defaults for creators
-- without a record and creates their row the first time they save the profile.
