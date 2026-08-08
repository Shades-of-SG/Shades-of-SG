-- Owner: Lia Insyirah
-- Feature area: Song discovery and bookmarks
-- Purpose: Adds per-user saved songs

create table if not exists song_bookmarks (
    user_id uuid not null references users(id) on delete cascade,
    song_id uuid not null references songs(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, song_id)
);

create index if not exists song_bookmarks_song_idx on song_bookmarks (song_id);
