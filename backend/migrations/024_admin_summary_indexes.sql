-- Owner: Ferlyn Ng
-- Feature area: Admin dashboard and safety summaries
-- Purpose: Adds indexes for user, reflection, warning, and moderation summaries

begin;

create index if not exists users_role_account_status_idx
    on users (role, account_status);

create index if not exists reflections_status_user_idx
    on reflections (status, user_id)
    where user_id is not null;

create index if not exists user_warnings_status_user_idx
    on user_warnings (status, user_id);

create index if not exists moderation_actions_target_user_idx
    on moderation_actions (target_user_id)
    where target_user_id is not null;

commit;
