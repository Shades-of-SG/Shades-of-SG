-- Owner: Lia Insyirah
-- Feature area: Account settings and deletion
-- Purpose: Adds the legacy soft-delete state later superseded by hard deletion

-- Adds a soft-delete account status. Deleting an account never removes rows;
-- it marks the user row as deleted, which blocks login/API access the same
-- way a suspension does, and stops the profile resolving publicly.
--
-- Superseded: account deletion (self-service and admin-initiated) now hard-
-- deletes the row instead of setting this status (see 026_account_hard_delete.sql
-- and backend/services/accountDeletionService.js). The 'DELETED' status and
-- deleted_at column are kept only for any legacy rows written before this change.

begin;

alter table users add column if not exists deleted_at timestamptz;

alter table users drop constraint if exists users_account_status_check;
alter table users add constraint users_account_status_check
    check (account_status in ('ACTIVE', 'SUSPENDED', 'DELETED'));

commit;
