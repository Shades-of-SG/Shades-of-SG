-- Owner: Ferlyn Ng
-- Feature area: Reflection Wall discussions
-- Purpose: Adds persisted authenticated likes to individual comments

-- Additive only: existing reflections, comments, and likes are preserved.
create table if not exists reflection_comment_likes (
    comment_id uuid not null references reflection_comments(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (comment_id, user_id)
);

create index if not exists reflection_comment_likes_comment_created_idx
    on reflection_comment_likes (comment_id, created_at desc);
create index if not exists reflection_comment_likes_user_created_idx
    on reflection_comment_likes (user_id, created_at desc);
