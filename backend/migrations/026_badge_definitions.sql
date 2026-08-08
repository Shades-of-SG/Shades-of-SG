-- Owner: Shermaine
-- Feature area: Badge catalog
-- Purpose: Creates and seeds canonical badge display metadata

-- Single source of truth for badge catalog metadata (name, description, category, sticker art),
-- so display metadata no longer lives duplicated in frontend/backend JS.
-- Earning conditions (login streak thresholds etc.) remain in backend/services/badgeCatalog.js
-- since they are code, not data; this table only stores what a badge looks like/means.

create table if not exists badge_definitions (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null unique,
    description text not null,
    category varchar(64) not null,
    image_key varchar(64) not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

insert into badge_definitions (name, description, category, image_key, sort_order) values
    ('Day One', 'Logged in for the first time.', 'Consistency', 'merlion', 1),
    ('7-Day Streak', 'Logged in for 7 days in a row.', 'Consistency', 'chicken-rice', 2),
    ('30-Day Streak', 'Logged in for 30 days in a row.', 'Consistency', 'laksa', 3),
    ('Consistency Champion', 'Logged in for 50 days in a row.', 'Consistency', 'kaya-toast', 4),
    ('Dedicated Learner', 'Logged in for 100 days in a row.', 'Consistency', 'supertree', 5),
    ('Thought Starter', 'Submitted your first reflection.', 'Reflection', 'national-gallery', 6),
    ('Reflective Mind', 'Submitted 5 reflections.', 'Reflection', 'peranakan-tile', 7),
    ('Deep Thinker', 'Submitted 20 reflections.', 'Reflection', 'raffles-hotel', 8),
    ('Playground Virtuoso', 'Completed every fun challenge in the Instrument Playground.', 'Instrument Playground', 'esplanade', 9)
on conflict (name) do nothing;
