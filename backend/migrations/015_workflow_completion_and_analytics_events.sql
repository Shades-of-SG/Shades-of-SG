-- Owner: Ferlyn Ng
-- Feature area: Creator/admin workflow completion and analytics
-- Purpose: Completes applications and folders and adds analytics events

-- Forward-only workflow completion. Preserves every existing row.

begin;

alter table creator_applications alter column statement drop not null;
alter table creator_applications add column if not exists experience text;
alter table creator_applications add column if not exists motivation text;
alter table creator_applications add column if not exists applicant_feedback text;
alter table creator_applications add column if not exists resume_file_name varchar(255);
alter table creator_applications add column if not exists resume_mime_type varchar(128);
alter table creator_applications add column if not exists resume_data bytea;
alter table creator_applications add column if not exists submitted_at timestamptz;
alter table creator_applications add column if not exists withdrawn_at timestamptz;

-- Earlier deployments created status as a PostgreSQL enum. Convert it to
-- constrained text so the new forward-only workflow states can be introduced
-- safely in this same migration without dropping or rewriting any rows.
alter table creator_applications alter column status drop default;
alter table creator_applications alter column status type varchar(32) using status::text;
alter table creator_applications alter column status set default 'SUBMITTED';
alter table creator_applications drop constraint if exists creator_applications_status_check;
alter table creator_applications add constraint creator_applications_status_check
    check (status in (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW',
        'APPROVED', 'REJECTED', 'WITHDRAWN'
    ));

drop index if exists creator_applications_one_active_per_user_idx;
create unique index creator_applications_one_active_per_user_idx
    on creator_applications (user_id)
    where status in ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW');

create table if not exists creator_application_history (
    id uuid primary key default gen_random_uuid(),
    application_id uuid not null references creator_applications(id) on delete cascade,
    actor_id uuid references users(id) on delete set null,
    from_status varchar(32),
    to_status varchar(32) not null,
    note text,
    visible_to_applicant boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists creator_application_history_application_created_idx
    on creator_application_history (application_id, created_at asc);

alter table folders add column if not exists display_order integer not null default 0;
-- Folder status was also created as a PostgreSQL enum in earlier deployments.
alter table folders alter column status drop default;
alter table folders alter column status type varchar(32) using status::text;
alter table folders alter column status set default 'PENDING';
alter table folders drop constraint if exists folders_status_check;
alter table folders add constraint folders_status_check
    check (status in ('PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'ARCHIVED'));
create index if not exists folders_public_order_idx
    on folders (status, display_order, name);

alter table song_folders add column if not exists song_order integer not null default 0;
create index if not exists song_folders_folder_order_idx
    on song_folders (folder_id, song_order, created_at);

create table if not exists folder_song_proposals (
    id uuid primary key default gen_random_uuid(),
    song_id uuid not null references songs(id) on delete cascade,
    folder_id uuid not null references folders(id) on delete cascade,
    proposed_by uuid not null references users(id) on delete restrict,
    status varchar(32) not null default 'PENDING'
        check (status in ('PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
    creator_note text,
    review_note text,
    reviewed_by uuid references users(id) on delete set null,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists folder_song_proposals_one_active_idx
    on folder_song_proposals (song_id, folder_id)
    where status in ('PENDING', 'CHANGES_REQUESTED');
create index if not exists folder_song_proposals_creator_created_idx
    on folder_song_proposals (proposed_by, created_at desc);
create index if not exists folder_song_proposals_status_created_idx
    on folder_song_proposals (status, created_at desc);

create table if not exists analytics_events (
    id uuid primary key default gen_random_uuid(),
    event_type varchar(64) not null
        check (event_type in (
            'SONG_PAGE_VIEWED', 'SONG_PLAYBACK_STARTED', 'SONG_PLAYBACK_COMPLETED',
            'RHYTHM_GAME_STARTED', 'RHYTHM_GAME_COMPLETED',
            'TRIVIA_STARTED', 'TRIVIA_COMPLETED', 'REFLECTION_SUBMITTED', 'FOLDER_VIEWED'
        )),
    song_id uuid references songs(id) on delete cascade,
    folder_id uuid references folders(id) on delete cascade,
    user_id uuid references users(id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (
        (event_type = 'FOLDER_VIEWED' and folder_id is not null)
        or (event_type <> 'FOLDER_VIEWED' and song_id is not null)
    )
);

create index if not exists analytics_events_song_type_created_idx
    on analytics_events (song_id, event_type, created_at desc);
create index if not exists analytics_events_folder_type_created_idx
    on analytics_events (folder_id, event_type, created_at desc);
create index if not exists analytics_events_created_idx
    on analytics_events (created_at desc);

commit;
