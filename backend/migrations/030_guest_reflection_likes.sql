-- Owner: Ferlyn Ng
-- Feature area: Reflection Wall guest interactions
-- Purpose: Adds anonymous cookie sessions and persisted guest reflection likes

-- Additive only: existing account likes and reflection data are preserved.
create table if not exists guest_like_sessions (
    id uuid primary key default gen_random_uuid(),
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists guest_like_sessions_expires_idx
    on guest_like_sessions (expires_at);

create table if not exists guest_reflection_likes (
    reflection_id uuid not null references reflections(id) on delete cascade,
    guest_session_id uuid not null references guest_like_sessions(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (reflection_id, guest_session_id)
);

create index if not exists guest_reflection_likes_reflection_created_idx
    on guest_reflection_likes (reflection_id, created_at desc);
create index if not exists guest_reflection_likes_session_created_idx
    on guest_reflection_likes (guest_session_id, created_at desc);
