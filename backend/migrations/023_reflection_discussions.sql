-- Padlet-style discussion support for approved reflections.
-- Additive only: existing reflection and user data is preserved.
create table if not exists reflection_comments (
    id uuid primary key default gen_random_uuid(),
    reflection_id uuid not null references reflections(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    content text not null check (char_length(content) between 1 and 500),
    status varchar(16) not null default 'VISIBLE' check (status in ('VISIBLE', 'REMOVED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists reflection_comments_reflection_status_created_idx
    on reflection_comments (reflection_id, status, created_at asc);
create index if not exists reflection_comments_user_created_idx
    on reflection_comments (user_id, created_at desc);

create table if not exists reflection_likes (
    reflection_id uuid not null references reflections(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (reflection_id, user_id)
);

create index if not exists reflection_likes_reflection_created_idx
    on reflection_likes (reflection_id, created_at desc);
create index if not exists reflection_likes_user_created_idx
    on reflection_likes (user_id, created_at desc);
