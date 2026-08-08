-- Owner: Ferlyn Ng
-- Feature area: User profiles and privacy
-- Purpose: Adds shared identity, preferences, accessibility, and visibility data

-- Shared identity, privacy, and display preferences for registered users and creators.
-- Account credentials and role/access state remain in users; creator biography fields
-- remain in creator_public_profiles.
create table if not exists user_profiles (
    user_id uuid primary key references users(id) on delete cascade,
    display_name varchar(80) not null,
    avatar_url text,
    avatar_public_id varchar(255),
    bio varchar(500),
    profile_visibility varchar(16) not null default 'PUBLIC'
        check (profile_visibility in ('PUBLIC', 'PRIVATE')),
    preferred_language varchar(40),
    location varchar(100),
    theme varchar(16) not null default 'SYSTEM'
        check (theme in ('SYSTEM', 'LIGHT', 'DARK')),
    font_size varchar(16) not null default 'MEDIUM'
        check (font_size in ('SMALL', 'MEDIUM', 'LARGE')),
    reduced_motion boolean not null default false,
    show_badges boolean not null default true,
    show_rhythm_ranking boolean not null default true,
    show_reflections boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists user_profiles_visibility_idx
    on user_profiles (profile_visibility, updated_at desc);

-- Remove identity columns from installations where migration 019 was already
-- applied before shared user profiles were introduced.
alter table creator_public_profiles drop column if exists display_name;
alter table creator_public_profiles drop column if exists avatar_url;
alter table creator_public_profiles drop column if exists avatar_public_id;

-- Existing accounts are represented safely by API defaults until their first save.
-- The browser never queries this table directly; ownership and public-field filtering
-- are enforced by the authenticated Express API used throughout this project.
