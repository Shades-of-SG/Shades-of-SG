-- Owner: Ferlyn Ng
-- Feature area: Reflection Wall guest posting
-- Purpose: Adds anonymous/profile display mode and guest-submission tracking

alter table reflections
    add column if not exists display_mode varchar(32) not null default 'ANONYMOUS'
        check (display_mode in ('PROFILE', 'ANONYMOUS'));

alter table reflections
    add column if not exists guest_submission boolean not null default false;

update reflections
set display_mode = case when display_name is null then 'ANONYMOUS' else 'PROFILE' end;
