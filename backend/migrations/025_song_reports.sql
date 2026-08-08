-- Owner: Lia Insyirah
-- Feature area: Song reporting and admin content review
-- Purpose: Creates authenticated song reports and their review state

create table if not exists song_reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    song_id uuid not null references songs(id) on delete cascade,
    reason varchar(32) not null
        check (reason in ('INAPPROPRIATE', 'COPYRIGHT', 'SPAM', 'METADATA', 'OTHER')),
    details text,
    status varchar(32) not null default 'PENDING'
        check (status in ('PENDING', 'REVIEWED', 'DISMISSED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists song_reports_song_idx on song_reports (song_id, created_at desc);
create index if not exists song_reports_user_idx on song_reports (user_id, created_at desc);
create index if not exists song_reports_status_idx on song_reports (status, created_at desc);
