-- Owner: Shermaine
-- Feature area: Heritage Vault collection administration
-- Purpose: Makes the five existing Vault exhibits available through the shared collections API

-- Older deployments created this actor reference as NOT NULL. Platform-owned
-- seed content has no human creator, matching the current Sequelize model.
alter table folders alter column created_by drop not null;

insert into folders (id, name, slug, description, origin, status, display_order, created_by, created_at, updated_at)
values
    ('33000000-0000-4000-8000-000000000001', 'Before Independence', 'before-independence', 'What challenges did Singapore face before independence?', 'PLATFORM', 'APPROVED', 1, null, now(), now()),
    ('33000000-0000-4000-8000-000000000002', '1965: Independence', 'independence-1965', 'Why was 1965 such an important turning point?', 'PLATFORM', 'APPROVED', 2, null, now(), now()),
    ('33000000-0000-4000-8000-000000000003', 'Building a Multicultural Nation', 'multicultural-nation', 'How did people from different cultures build one nation together?', 'PLATFORM', 'APPROVED', 3, null, now(), now()),
    ('33000000-0000-4000-8000-000000000004', 'National Day Traditions', 'national-day-traditions', 'Why do we celebrate National Day every year?', 'PLATFORM', 'APPROVED', 4, null, now(), now()),
    ('33000000-0000-4000-8000-000000000005', 'Singapore Today', 'singapore-today', 'What does Singapore''s story mean for us today?', 'PLATFORM', 'APPROVED', 5, null, now(), now())
on conflict (slug) do nothing;
