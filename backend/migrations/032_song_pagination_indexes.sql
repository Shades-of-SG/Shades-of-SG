-- Owner: Ferlyn Ng
-- Feature area: scalable song collection pagination
-- Additive indexes for the public and creator song-list access paths.

begin;

create index if not exists songs_public_pagination_idx
    on songs (status, published_date desc, id desc);

create index if not exists songs_creator_status_pagination_idx
    on songs (creator_id, status, updated_at desc, id desc);

commit;
