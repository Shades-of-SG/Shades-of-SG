-- Account deletion is now a hard delete (see backend/services/accountDeletionService.js).
-- Every row that references the deleted user is either destroyed explicitly by
-- that service, or -- for audit/history rows that should survive the person
-- who's gone -- has its user reference nulled out. The three columns below are
-- currently NOT NULL with a RESTRICT-style foreign key, which would otherwise
-- make it impossible to delete a user who has ever:
--   * issued a warning (moderation_actions.actor_id, user_warnings.issued_by --
--     creators can warn people who comment on their own songs, not just admins)
--   * created or proposed a folder (folders.created_by -- creators propose
--     folders via backend/routes/folders.js)
-- This migration makes those columns nullable with ON DELETE SET NULL so the
-- row survives deletion with its actor reference cleared; the human-readable
-- snapshot (name/email/role) is preserved in the corresponding audit_logs row.

begin;

alter table moderation_actions alter column actor_id drop not null;
alter table moderation_actions drop constraint if exists moderation_actions_actor_id_fkey;
alter table moderation_actions add constraint moderation_actions_actor_id_fkey
    foreign key (actor_id) references users(id) on delete set null;

alter table folders alter column created_by drop not null;
alter table folders drop constraint if exists folders_created_by_fkey;
alter table folders add constraint folders_created_by_fkey
    foreign key (created_by) references users(id) on delete set null;

alter table user_warnings alter column issued_by drop not null;
alter table user_warnings drop constraint if exists user_warnings_issued_by_fkey;
alter table user_warnings add constraint user_warnings_issued_by_fkey
    foreign key (issued_by) references users(id) on delete set null;

commit;
