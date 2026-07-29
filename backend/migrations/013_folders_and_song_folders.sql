create table if not exists folders (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    slug varchar(255) not null unique,
    description text,
    origin varchar(32) not null default 'PLATFORM'
        check (origin in ('PLATFORM', 'CREATOR_PROPOSAL')),
    status varchar(32) not null default 'APPROVED'
        check (status in ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED')),
    created_by uuid not null references users(id) on delete restrict,
    proposed_by uuid references users(id) on delete set null,
    reviewed_by uuid references users(id) on delete set null,
    reviewed_at timestamptz,
    review_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists song_folders (
    song_id uuid not null references songs(id) on delete cascade,
    folder_id uuid not null references folders(id) on delete cascade,
    added_by uuid not null references users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (song_id, folder_id)
);

create index if not exists folders_status_name_idx on folders (status, name);
create index if not exists folders_proposed_by_created_at_idx on folders (proposed_by, created_at desc);
create index if not exists song_folders_folder_song_idx on song_folders (folder_id, song_id);

