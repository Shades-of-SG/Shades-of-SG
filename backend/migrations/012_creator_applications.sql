-- Owner: Ferlyn Ng
-- Feature area: Creator applications
-- Purpose: Creates the initial creator application workflow

create table if not exists creator_applications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete restrict,
    resume_url text,
    portfolio_url text,
    statement text not null,
    status varchar(32) not null default 'SUBMITTED'
        check (status in ('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED')),
    reviewed_by uuid references users(id) on delete set null,
    reviewed_at timestamptz,
    admin_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists creator_applications_one_active_per_user_idx
    on creator_applications (user_id)
    where status in ('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW');
create index if not exists creator_applications_status_created_at_idx
    on creator_applications (status, created_at desc);
create index if not exists creator_applications_user_created_at_idx
    on creator_applications (user_id, created_at desc);

