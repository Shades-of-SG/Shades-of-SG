-- Owner: Ferlyn Ng
-- Feature area: Creator Studio media uploads
-- Purpose: Preserves the original uploaded audio filename

alter table songs add column if not exists audio_file_name varchar(255);
