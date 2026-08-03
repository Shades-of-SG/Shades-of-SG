-- Optional, canonical cultural interests for shared user profiles.
-- Existing profiles remain valid and receive an empty selection.
alter table user_profiles
    add column if not exists interest_tags jsonb not null default '[]'::jsonb;

alter table user_profiles
    drop constraint if exists user_profiles_interest_tags_array_check;

alter table user_profiles
    add constraint user_profiles_interest_tags_array_check
    check (jsonb_typeof(interest_tags) = 'array');
