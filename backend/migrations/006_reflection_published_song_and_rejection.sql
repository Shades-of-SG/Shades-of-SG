-- Owner: Shared - Ferlyn Ng and Htet Aung
-- Feature area: Published-song reflections
-- Purpose: Adds rejection state and song-scoped moderation lookup

alter table reflections drop constraint if exists reflections_status_check;
alter table reflections add constraint reflections_status_check
    check (status in ('PENDING', 'APPROVED', 'FLAGGED', 'REJECTED'));

create index if not exists reflections_song_status_created_at_idx
    on reflections (song_id, status, created_at desc);
