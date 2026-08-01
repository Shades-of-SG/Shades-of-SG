-- Forward-only authentication and onboarding hardening. Preserves existing users.

begin;

alter table users add column if not exists email_verified_at timestamptz;
alter table users add column if not exists email_verification_required boolean not null default false;
alter table users add column if not exists auth_version integer not null default 0;

alter table creator_applications add column if not exists introduction text;
alter table creator_applications add column if not exists content_ideas text;
alter table creator_applications add column if not exists guidelines_accepted boolean not null default false;
alter table creator_applications add column if not exists resume_file_size integer;
alter table creator_applications drop constraint if exists creator_applications_status_check;
alter table creator_applications add constraint creator_applications_status_check
    check (status in (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED',
        'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'
    ));

drop index if exists creator_applications_one_active_per_user_idx;
create unique index creator_applications_one_active_per_user_idx
    on creator_applications (user_id)
    where status in (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED',
        'SHORTLISTED', 'INTERVIEW'
    );

create table if not exists auth_otps (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    email varchar(320) not null,
    purpose varchar(32) not null
        check (purpose in ('REGISTRATION', 'PASSWORD_RESET', 'EMAIL_CHANGE')),
    otp_hash varchar(255) not null,
    request_ip_hash varchar(128),
    expires_at timestamptz not null,
    attempt_count integer not null default 0 check (attempt_count >= 0),
    used_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists auth_otps_email_purpose_created_idx
    on auth_otps (email, purpose, created_at desc);
create index if not exists auth_otps_user_purpose_created_idx
    on auth_otps (user_id, purpose, created_at desc);
create index if not exists auth_otps_ip_created_idx
    on auth_otps (request_ip_hash, created_at desc);
create index if not exists auth_otps_active_expiry_idx
    on auth_otps (expires_at)
    where used_at is null;

commit;
