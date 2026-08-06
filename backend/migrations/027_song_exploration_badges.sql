-- Tracks the distinct songs a user has explored (visited the song detail page for), so we can
-- award "explore N songs" badges without double-counting repeat visits to the same song.

create table if not exists song_explorations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    song_id uuid not null references songs(id) on delete cascade,
    explored_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists song_explorations_user_song_idx on song_explorations (user_id, song_id);

insert into badge_definitions (name, description, category, image_key, sort_order) values
    ('First Song', 'Explored a song for the first time.', 'Song Exploration', 'orchid', 10),
    ('Curious Bug', 'Explored 3 different songs.', 'Song Exploration', 'peranakan-shophouse', 11),
    ('Song Explorer', 'Explored 5 different songs.', 'Song Exploration', 'marina-bay-sands', 12)
on conflict (name) do nothing;
