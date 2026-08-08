-- Owner: Ferlyn Ng
-- Feature area: Administration and community safety
-- Purpose: Creates warnings, moderation actions, and audit logs

create table if not exists user_warnings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete restrict,
    issued_by uuid not null references users(id) on delete restrict,
    reason text not null,
    status varchar(32) not null default 'ACTIVE'
        check (status in ('ACTIVE', 'RESOLVED')),
    resolved_by uuid references users(id) on delete set null,
    resolved_at timestamptz,
    resolution_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists moderation_actions (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid not null references users(id) on delete restrict,
    target_user_id uuid references users(id) on delete set null,
    action_type varchar(64) not null,
    target_type varchar(64) not null,
    target_id uuid,
    song_id uuid references songs(id) on delete set null,
    reason text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references users(id) on delete set null,
    action varchar(96) not null,
    entity_type varchar(64) not null,
    entity_id uuid,
    song_id uuid references songs(id) on delete set null,
    creator_id uuid references users(id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    ip_address varchar(64),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists user_warnings_user_created_at_idx on user_warnings (user_id, created_at desc);
create index if not exists moderation_actions_target_created_at_idx on moderation_actions (target_type, target_id, created_at desc);
create index if not exists moderation_actions_song_created_at_idx on moderation_actions (song_id, created_at desc);
create index if not exists audit_logs_actor_created_at_idx on audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_creator_created_at_idx on audit_logs (creator_id, created_at desc);
create index if not exists audit_logs_entity_created_at_idx on audit_logs (entity_type, entity_id, created_at desc);

