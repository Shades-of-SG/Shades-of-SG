-- Owner: Ferlyn Ng
-- Feature area: Reflection Wall discussion safety
-- Purpose: Adds authenticated comment reports and auditable resolution state

-- Additive only: no reflection, comment, like, warning, or moderation data is replaced.
create table if not exists reflection_comment_reports (
    id uuid primary key default gen_random_uuid(),
    comment_id uuid not null references reflection_comments(id) on delete cascade,
    reporter_id uuid not null references users(id) on delete cascade,
    reason text not null check (char_length(reason) between 5 and 500),
    status varchar(16) not null default 'PENDING'
        check (status in ('PENDING', 'DISMISSED', 'ACTIONED')),
    resolved_by uuid references users(id) on delete set null,
    resolved_at timestamptz,
    resolution_reason text
        check (resolution_reason is null or char_length(resolution_reason) between 5 and 2000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint reflection_comment_reports_comment_reporter_unique unique (comment_id, reporter_id),
    constraint reflection_comment_reports_resolution_state_check check (
        (status = 'PENDING' and resolved_at is null and resolution_reason is null)
        or (status in ('DISMISSED', 'ACTIONED') and resolved_at is not null and resolution_reason is not null)
    )
);

create index if not exists reflection_comment_reports_status_created_idx
    on reflection_comment_reports (status, created_at desc);
create index if not exists reflection_comment_reports_comment_status_idx
    on reflection_comment_reports (comment_id, status);
