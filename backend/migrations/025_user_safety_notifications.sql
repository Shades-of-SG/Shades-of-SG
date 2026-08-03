-- Add user-visible warning state and in-product delivery without replacing or
-- deleting legacy warning, moderation, or audit records.
begin;

-- Migration 014 defines this column as varchar, but databases initially
-- created through Sequelize sync may use Sequelize's named PostgreSQL enum.
-- Extend that enum when present so both schema histories accept the new
-- acknowledgement and withdrawal states.
do $$
begin
    if exists (
        select 1
        from pg_type
        where typname = 'enum_user_warnings_status'
    ) then
        alter type enum_user_warnings_status add value if not exists 'ACKNOWLEDGED';
        alter type enum_user_warnings_status add value if not exists 'WITHDRAWN';
    end if;
end
$$;

alter table user_warnings drop constraint if exists user_warnings_status_check;
alter table user_warnings add constraint user_warnings_status_check
    check (status::text in ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'WITHDRAWN'));

alter table user_warnings add column if not exists category varchar(64) not null default 'OTHER';
alter table user_warnings add column if not exists user_facing_reason text;
alter table user_warnings add column if not exists internal_note text;
alter table user_warnings add column if not exists target_type varchar(64);
alter table user_warnings add column if not exists target_id uuid;
alter table user_warnings add column if not exists action_taken varchar(64);
alter table user_warnings add column if not exists required_next_step text;
alter table user_warnings add column if not exists acknowledged_at timestamptz;
alter table user_warnings add column if not exists withdrawn_at timestamptz;

update user_warnings
set user_facing_reason = reason
where user_facing_reason is null;

create index if not exists user_warnings_user_status_created_at_idx
    on user_warnings (user_id, status, created_at desc);
create index if not exists user_warnings_target_idx
    on user_warnings (target_type, target_id)
    where target_id is not null;

create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    warning_id uuid references user_warnings(id) on delete set null,
    type varchar(64) not null,
    title varchar(160) not null,
    message text not null,
    link varchar(500) not null default '/settings/safety',
    read_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists notifications_user_created_at_idx
    on notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
    on notifications (user_id, created_at desc)
    where read_at is null;

create table if not exists moderation_flags (
    id uuid primary key default gen_random_uuid(),
    source varchar(32) not null check (source in ('USER_REPORT', 'AUTOMATED_RULE', 'ADMIN_REVIEW', 'BEHAVIOURAL_PATTERN')),
    target_type varchar(64) not null,
    target_id uuid not null,
    target_user_id uuid references users(id) on delete set null,
    reason text not null,
    triggering_rule varchar(96),
    review_state varchar(32) not null default 'OPEN' check (review_state in ('OPEN', 'DISMISSED', 'UPHELD')),
    created_by uuid references users(id) on delete set null,
    reviewed_by uuid references users(id) on delete set null,
    reviewed_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists moderation_flags_review_queue_idx
    on moderation_flags (review_state, created_at desc);
create index if not exists moderation_flags_target_idx
    on moderation_flags (target_type, target_id, created_at desc);
create unique index if not exists moderation_flags_open_automated_rule_idx
    on moderation_flags (source, target_type, target_id, triggering_rule)
    where source = 'AUTOMATED_RULE' and review_state = 'OPEN';

commit;
