# DATABASE SCHEMA OVERVIEW — Shades of SG

**Last updated:** 8 August 2026
**Document purpose:** Describe the current PostgreSQL schema produced by `backend/migrations/*.sql`, cross-checked against every Sequelize model and association. This is documentation only; no schema behavior was changed.

> SCCCI AI Challenge | Team: Unpaid Interns

---

## 1. Reading the Tables

- `PK`, `FK` and `UQ` mean primary key, foreign key and unique constraint/index.
- `required` means `NOT NULL`; `optional` means nullable.
- Unless stated otherwise, entity tables include required `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ DEFAULT now()` supplied by Sequelize's `underscored` timestamps.
- PostgreSQL migrations are authoritative for production. Sequelize models are also important because tests/local SQLite commonly use `sequelize.sync({ force: true })`.

---

## 2. Relationship Overview

```
users
├── sessions, auth_otps, auth_identities
├── user_profiles, creator_public_profiles
├── creator_applications ── creator_application_history
├── songs
│   ├── generation_jobs
│   ├── scene_segments ── generated_frames
│   ├── rhythm_beatmaps
│   ├── game_scores
│   ├── reflections ── reflection_comments / reflection_likes
│   ├── song_reports, song_bookmarks, song_explorations
│   ├── lessons, trivia_questions ── trivia_attempts
│   ├── song_instruments ── instruments
│   └── song_folders / folder_song_proposals ── folders
├── badges, instrument_challenge_progress
└── user_warnings, moderation_actions, audit_logs, analytics_events
```

The principal ownership path is:

```text
creator → songs.creator_id → every song-owned resource
```

---

## 3. Users and Authentication

### `users`

Purpose: credential identity, role, account/creator access state and login streak.

| Column | Type and nullability | Constraints/default |
| --- | --- | --- |
| `id` | UUID, required | PK, `gen_random_uuid()` |
| `name` | VARCHAR(255), required | |
| `email` | VARCHAR(255), required | UQ |
| `password_hash` | VARCHAR(255), required | Hashed credential |
| `role` | VARCHAR(32), required | default `REGISTERED`; `ADMIN`, `CREATOR`, `REGISTERED` |
| `account_status` | VARCHAR(32), required | default `ACTIVE`; `ACTIVE`, `SUSPENDED`, legacy `DELETED` |
| `account_suspension_reason` | TEXT, optional | migration 018 |
| `deleted_at` | TIMESTAMPTZ, optional | legacy soft-delete marker; current deletion is hard delete |
| `creator_access_status` | VARCHAR(32), required | default `ACTIVE`; `ACTIVE`, `SUSPENDED` |
| `creator_suspension_reason` | TEXT, optional | |
| `email_verified_at` | TIMESTAMPTZ, optional | |
| `email_verification_required` | BOOLEAN, required | default `false` |
| `auth_version` | INTEGER, required | default `0` |
| `last_active_date` | DATE, optional | |
| `current_login_streak`, `longest_login_streak` | INTEGER, required | default `0` |

Indexes: unique email; `users_creator_access_status_idx` (CREATOR rows); `users_role_account_status_idx`. Introduced by 001; changed by 011, 016, 018, 024 badges, 025 account deletion.

### `sessions`

Purpose: server-side user or guest session records (model exists; JWT is the active browser auth mechanism).

| Column | Type and nullability | Constraints/default |
| --- | --- | --- |
| `id` | UUID, required | PK |
| `user_id` | UUID, optional | FK `users.id`, delete cascade |
| `guest_id` | VARCHAR(255), optional | |
| `expires_at` | TIMESTAMPTZ, optional | |

Introduced by 001. No dedicated indexes beyond PK/FK implementation defaults.

### `auth_otps`

Purpose: hashed, expiring OTPs for registration, reset and email change.

| Column | Type and nullability | Constraints/default |
| --- | --- | --- |
| `id` | UUID, required | PK |
| `user_id` | UUID, optional | FK `users.id`, delete cascade |
| `email` | VARCHAR(320), required | |
| `purpose` | VARCHAR(32), required | `REGISTRATION`, `PASSWORD_RESET`, `EMAIL_CHANGE` |
| `otp_hash` | VARCHAR(255), required | |
| `request_ip_hash` | VARCHAR(128), optional | |
| `expires_at` | TIMESTAMPTZ, required | |
| `attempt_count` | INTEGER, required | default `0`, check >= 0 |
| `used_at` | TIMESTAMPTZ, optional | |

Indexes cover `(email,purpose,created_at)`, `(user_id,purpose,created_at)`, request IP and active expiry. Introduced by 016.

### `auth_identities`

Purpose: stable external OAuth subjects; provider tokens are not stored.

| Column | Type and nullability | Constraints/default |
| --- | --- | --- |
| `id` | UUID, required | PK |
| `user_id` | UUID, required | FK `users.id`, delete cascade |
| `provider` | VARCHAR(16), required | `GOOGLE`, `APPLE` |
| `provider_subject` | VARCHAR(255), required | UQ with provider |

Unique `(provider,provider_subject)` and `(user_id,provider)`; user index. Introduced by 017.

### `user_profiles`

Purpose: shared public identity, preferences, accessibility and privacy settings.

| Column | Type and nullability | Constraints/default |
| --- | --- | --- |
| `user_id` | UUID, required | PK/FK `users.id`, delete cascade |
| `display_name` | VARCHAR(80), required | |
| `avatar_url`, `avatar_public_id` | TEXT / VARCHAR(255), optional | |
| `bio` | VARCHAR(500), optional | |
| `interest_tags` | JSONB, required | default `[]`; check value is an array |
| `profile_visibility` | VARCHAR(16), required | default `PUBLIC`; `PUBLIC`, `PRIVATE` |
| `preferred_language` | VARCHAR(40), optional | |
| `location` | VARCHAR(100), optional | |
| `theme` | VARCHAR(16), required | default `SYSTEM`; `SYSTEM`, `LIGHT`, `DARK` |
| `font_size` | VARCHAR(16), required | default `MEDIUM`; `SMALL`, `MEDIUM`, `LARGE` |
| `reduced_motion` | BOOLEAN, required | default `false` |
| `show_badges`, `show_rhythm_ranking`, `show_reflections` | BOOLEAN, required | default `true` |

Visibility/update index. Introduced by 020; interests added by the second migration numbered 021.

### `creator_public_profiles`

Purpose: creator-specific biography separated from security/shared profile data.

| Column | Type and nullability | Constraints/default |
| --- | --- | --- |
| `user_id` | UUID, required | PK/FK `users.id`, delete cascade |
| `tagline` | VARCHAR(160), optional | |
| `bio` | TEXT, optional | |
| `languages`, `content_focus` | JSONB, required | default `[]` |
| `location`, `creator_title` | VARCHAR(100), optional | |
| `featured_quote` | VARCHAR(300), optional | |
| `social_links` | JSONB, required | default `{}` |
| `visibility` | VARCHAR(16), required | default `PUBLIC`; `PUBLIC`, `PRIVATE` |
| `show_community_reflections` | BOOLEAN, required | default `true` |

Visibility/update index. Introduced by 019; legacy identity columns are explicitly removed by 020.

---

## 4. Creator Applications and Creator Access

### `creator_applications`

Purpose: saved and submitted creator applications.

| Column | Type and nullability | Constraints/default |
| --- | --- | --- |
| `id` | UUID, required | PK |
| `user_id` | UUID, required | FK `users.id`, delete restrict |
| `resume_url`, `portfolio_url`, `statement`, `introduction`, `experience`, `motivation`, `content_ideas`, `applicant_feedback` | TEXT, optional | |
| `guidelines_accepted` | BOOLEAN, required | default `false` |
| `resume_file_name` | VARCHAR(255), optional | |
| `resume_mime_type` | VARCHAR(128), optional | |
| `resume_data` | BYTEA, optional | |
| `resume_file_size` | INTEGER, optional | |
| `status` | VARCHAR(32), required | default `SUBMITTED`; `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `CHANGES_REQUESTED`, `SHORTLISTED`, `INTERVIEW`, `APPROVED`, `REJECTED`, `WITHDRAWN` |
| `reviewed_by` | UUID, optional | FK `users.id`, set null |
| `reviewed_at`, `submitted_at`, `withdrawn_at` | TIMESTAMPTZ, optional | |
| `admin_notes` | TEXT, optional | |

One active application per user (partial unique index); status/date and user/date indexes. Introduced by 012; expanded by 015 and 016.

### `creator_application_history`

Purpose: immutable-style status transition history.

| Column | Type and nullability | Constraints/default |
| --- | --- | --- |
| `id` | UUID, required | PK |
| `application_id` | UUID, required | FK `creator_applications.id`, cascade |
| `actor_id` | UUID, optional | FK `users.id`, set null |
| `from_status` | VARCHAR(32), optional | |
| `to_status` | VARCHAR(32), required | |
| `note` | TEXT, optional | |
| `visible_to_applicant` | BOOLEAN, required | default `false` |

Index `(application_id,created_at)`. Introduced by 015.

---

## 5. Songs and Generation

### `songs`

Purpose: creator-owned source, generated media and public content lifecycle.

| Column | Type and nullability | Constraints/default |
| --- | --- | --- |
| `id` | UUID, required | PK |
| `creator_id` | UUID, required | FK `users.id`, delete restrict |
| `title` | VARCHAR(255), required | |
| `artist`, `theme`, legacy `language` | VARCHAR(255), optional | |
| `languages`, `other_languages`, `mood_tags` | JSONB, required | default `[]` |
| legacy `lyrics`, `raw_lyrics`, `description` | TEXT, optional | current code uses `raw_lyrics` |
| `transcription_segments`, `section_recommendations` | JSONB, optional | |
| `section_recommendations_confirmed_at` | TIMESTAMPTZ, optional | |
| `audio_url`, `video_url`, `cover_image_url`, `source_youtube_url` | TEXT, optional | |
| `audio_file_name`, `audio_public_id`, `video_public_id`, `cover_image_public_id` | VARCHAR(255), optional | |
| `duration_secs` | INTEGER, optional | model validates >= 0; SQL has no check |
| `status` | VARCHAR(32), required | default `DRAFT`; `DRAFT`, `GENERATING`, `READY`, `PUBLISHED`, `ARCHIVED` |
| `published_date` | TIMESTAMPTZ, optional | |

Indexes `(creator_id,status,updated_at)` and partial public published date. Introduced by 001; lifecycle/media in 004/010/011; section recommendations in 028.

### `generation_jobs`

Purpose: asynchronous song-generation attempts.

| Column | Type and nullability | Constraints/default |
| --- | --- | --- |
| `id` | UUID, required | PK |
| `song_id` | UUID, required | FK `songs.id`, cascade |
| `status` | VARCHAR(32), required | current allowed `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`; original default was `NOT_STARTED` and migration 004 does not reset the default (risk noted below) |
| `error_message` | TEXT, optional | |
| `started_at`, `completed_at` | TIMESTAMPTZ, optional | |

Partial unique active job per song; song/date index. Introduced by 001; changed by 004, 005 and 011.

### `scene_segments`

Purpose: timestamped scene/lyric plan for a song.

`id UUID` PK; `song_id UUID` required FK songs cascade; `start_time`, `end_time DOUBLE PRECISION` required; `lyrics TEXT` optional; `emotion VARCHAR(255)` optional; `visual_prompt TEXT` required; `blocks JSON` required default `[]`; timestamps. Index `(song_id,start_time)`. Introduced by 001; indexed by 011.

### `generated_frames`

Purpose: generated image frames belonging to a scene segment.

`id UUID` PK; `scene_segment_id UUID` required FK scene_segments cascade; `prompt_hash`, `cloudinary_id VARCHAR(255)` optional; `image_url TEXT` required; `frame_order INTEGER` required default `0`; timestamps. Index `(scene_segment_id,frame_order)`. Introduced by 001; indexed by 011.

### `rhythm_beatmaps`

Purpose: versioned draft/published charts per song and difficulty.

`beatmap_id UUID` PK; `song_id UUID` required FK songs cascade; `difficulty VARCHAR(16)` required (`EASY`,`MEDIUM`,`HARD`); `version INTEGER` required default `1`; `bpm DECIMAL(7,2)` optional; `offset_ms INTEGER` required default `0`; `duration_ms INTEGER` required; `notes JSONB` required; `generation_source VARCHAR(16)` required (`AI`,`FALLBACK`,`MANUAL`); `status VARCHAR(16)` required default `DRAFT` (`DRAFT`,`PUBLISHED`,`FAILED`); `error_message TEXT`, `generated_at`, `published_at TIMESTAMPTZ` optional; timestamps.

Unique `(song_id,difficulty,version)`; lookup index; partial unique one draft and one published per song/difficulty. Introduced by 008; repair column in 009.

---

## 6. Music Content, Learning and Badges

### `instruments`

Purpose: song-linked instruments and Instrument Lab samples.

`id UUID` PK; `name VARCHAR(255)` required; `origin VARCHAR(255)`, `description TEXT`, `image_url TEXT`, legacy `audio_url TEXT` optional; `slug VARCHAR(64)` optional with partial UQ; `samples JSONB` required default `{}`; `sample_format VARCHAR(16)` required default `mp3`; `sample_license VARCHAR(255)`, `sample_attribution TEXT` optional; timestamps. Introduced by 001; sample fields/index added by 025 instrument lab.

### `song_instruments`

Purpose: many-to-many Song/Instrument membership.

`song_id UUID` FK songs cascade + `instrument_id UUID` FK instruments cascade form composite PK; `role VARCHAR(255)` optional; timestamps. Introduced by 001.

### `lessons`

Purpose: ordered learning content attached to a song.

`id UUID` PK; `song_id UUID` required FK songs cascade; `title VARCHAR(255)` and `content TEXT` required; `step_order INTEGER` required default `0`; timestamps. Index `(song_id,step_order)`. Introduced by 001; index in 011.

### `trivia_questions`

Purpose: per-song questions.

`id UUID` PK; `song_id UUID` required FK songs cascade; `prompt TEXT` required; `type VARCHAR(32)` required default `MULTIPLE_CHOICE` (`MULTIPLE_CHOICE`,`TRUE_FALSE`); `options JSONB` required default `[]`; `correct_answer VARCHAR(255)` required; timestamps. Index `(song_id,created_at)`. Introduced by 001; index in 011.

### `trivia_attempts`

Purpose: individual answers to questions.

`id UUID` PK; `user_id UUID` optional FK users set null; `question_id UUID` required FK trivia_questions cascade; `selected_answer VARCHAR(255)` required; `is_correct BOOLEAN` required; timestamps. Introduced by 001.

### `badges`

Purpose: awards earned by a user.

`id UUID` PK; `user_id UUID` required FK users cascade; `name VARCHAR(255)` required; `description TEXT` optional; `earned_at TIMESTAMPTZ` required default now; timestamps. Unique `(user_id,name)` from 024 badges. Introduced by 001.

### `badge_definitions`

Purpose: canonical display metadata for available badges.

`id UUID` PK; `name VARCHAR(255)` required UQ; `description TEXT`, `category VARCHAR(64)`, `image_key VARCHAR(64)` required; `sort_order INTEGER` required default `0`; timestamps. Introduced and seeded by 026 badge definitions; exploration definitions added by 027.

### `instrument_challenge_progress`

Purpose: completed Instrument Playground challenges.

`id UUID` PK; `user_id UUID` required FK users cascade; `challenge_id VARCHAR(64)` required; `completed_at TIMESTAMPTZ` required default now; timestamps. Unique `(user_id,challenge_id)`. Introduced by 024 badges.

### `song_explorations`

Purpose: distinct song visits used for badge conditions.

`id UUID` PK; `user_id UUID` required FK users cascade; `song_id UUID` required FK songs cascade; `explored_at TIMESTAMPTZ` required default now; timestamps. Unique `(user_id,song_id)`. Introduced by 027.

---

## 7. Rhythm Scores

### `game_scores`

Purpose: persisted registered-user rhythm attempts and claimed guest results.

`id UUID` PK; `user_id UUID` optional FK users set null; `song_id UUID` required FK songs cascade; `score INTEGER` required default `0`; `accuracy DOUBLE PRECISION` optional; `max_combo INTEGER` required default `0`; `rank VARCHAR(8)` required default `C` (`S`,`A`,`B`,`C`); `difficulty VARCHAR(32)` required default `EASY` (`EASY`,`MEDIUM`,`HARD`); `claim_id UUID` optional with partial UQ; timestamps.

Indexes by user/date and song/date plus unique non-null claim. Introduced by 001; aligned by 007; claim added by 022.

---

## 8. Reflections, Discussions and Reports

### `reflections`

Purpose: guest/registered community posts subject to moderation.

`id UUID` PK; `user_id UUID` optional FK users set null; `song_id UUID` required FK songs cascade; `display_name VARCHAR(255)` optional; `display_mode VARCHAR(32)` required default `ANONYMOUS` (`PROFILE`,`ANONYMOUS`); `guest_submission BOOLEAN` required default false; `content TEXT` required; `tags JSONB` required default `[]`; `status VARCHAR(32)` required default `PENDING` (`PENDING`,`APPROVED`,`FLAGGED`,`REJECTED`); `moderated_by UUID` optional FK users set null; `moderated_at TIMESTAMPTZ`, `moderator_note TEXT` optional; timestamps.

Indexes status/date, song/status/date and status/user. Introduced by 001; compatibility/additions in 002, 003, 006 and index 024 admin.

### `reflection_comments`

Purpose: authenticated discussion under a reflection.

`id UUID` PK; `reflection_id UUID` required FK reflections cascade; `user_id UUID` required FK users cascade; `content TEXT` required with length 1..500; `status VARCHAR(16)` required default `VISIBLE` (`VISIBLE`,`REMOVED`); timestamps. Indexes reflection/status/date and user/date. Introduced by 023.

### `reflection_likes`

Purpose: one like per user/reflection.

`reflection_id UUID` FK reflections cascade + `user_id UUID` FK users cascade form composite PK; `created_at TIMESTAMPTZ` required default now; no `updated_at`. Indexes by reflection/date and user/date. Introduced by 023.

### `song_reports`

Purpose: authenticated safety/content reports for songs.

`id UUID` PK; `user_id UUID` required FK users cascade; `song_id UUID` required FK songs cascade; `reason VARCHAR(32)` required (`INAPPROPRIATE`,`COPYRIGHT`,`SPAM`,`METADATA`,`OTHER`); `details TEXT` optional; `status VARCHAR(32)` required default `PENDING` (`PENDING`,`REVIEWED`,`DISMISSED`); timestamps. Indexes song/date, user/date and status/date. Introduced by 025 song reports.

---

## 9. Folders and Placement Workflow

### `folders`

Purpose: platform collections and creator-proposed collections.

`id UUID` PK; `name VARCHAR(255)` required; `slug VARCHAR(255)` required UQ; `description TEXT` optional; `origin VARCHAR(32)` required default `PLATFORM` (`PLATFORM`,`CREATOR_PROPOSAL`); `status VARCHAR(32)` required with current migration default `PENDING` (`PENDING`,`CHANGES_REQUESTED`,`APPROVED`,`REJECTED`,`ARCHIVED`); `display_order INTEGER` required default `0`; `created_by UUID` optional FK users set null; `proposed_by`, `reviewed_by UUID` optional FK users set null; `reviewed_at TIMESTAMPTZ`, `review_note TEXT` optional; timestamps.

Indexes status/name, proposer/date and public order. Introduced by 013; expanded by 015; deletion behavior changed by 026 account hard delete.

### `song_folders`

Purpose: approved many-to-many Song/Folder placements.

`song_id UUID` FK songs cascade + `folder_id UUID` FK folders cascade form composite PK; `added_by UUID` required FK users restrict; `song_order INTEGER` required default `0`; timestamps. Folder/song and folder/order/date indexes. Introduced by 013; ordering added by 015.

### `folder_song_proposals`

Purpose: creator requests to place a song in a folder.

`id UUID` PK; `song_id UUID` required FK songs cascade; `folder_id UUID` required FK folders cascade; `proposed_by UUID` required FK users restrict; `status VARCHAR(32)` required default `PENDING` (`PENDING`,`CHANGES_REQUESTED`,`APPROVED`,`REJECTED`,`WITHDRAWN`); `creator_note`, `review_note TEXT` optional; `reviewed_by UUID` optional FK users set null; `reviewed_at TIMESTAMPTZ` optional; timestamps.

Partial UQ one active proposal per song/folder; proposer/date and status/date indexes. Introduced by 015.

---

## 10. Administration, Analytics and Safety

### `user_warnings`

Purpose: active/resolved warnings issued to a user.

`id UUID` PK; `user_id UUID` required FK users restrict; `issued_by UUID` optional FK users set null; `reason TEXT` required; `status VARCHAR(32)` required default `ACTIVE` (`ACTIVE`,`RESOLVED`); `resolved_by UUID` optional FK users set null; `resolved_at TIMESTAMPTZ`, `resolution_note TEXT` optional; timestamps. User/date and status/user indexes. Introduced by 014; actor deletion behavior changed by 026 hard delete.

### `moderation_actions`

Purpose: structured moderation event history.

`id UUID` PK; `actor_id UUID` optional FK users set null; `target_user_id UUID` optional FK users set null; `action_type`, `target_type VARCHAR(64)` required; `target_id UUID` optional; `song_id UUID` optional FK songs set null; `reason TEXT` optional; `metadata JSONB` required default `{}`; timestamps. Target/date, song/date and target-user indexes. Introduced by 014; actor nullability changed by 026 hard delete.

### `audit_logs`

Purpose: administrative/security audit trail with actor/entity/song/creator context.

`id UUID` PK; `actor_id UUID` optional FK users set null; `action VARCHAR(96)`, `entity_type VARCHAR(64)` required; `entity_id UUID` optional; `song_id UUID` optional FK songs set null; `creator_id UUID` optional FK users set null; `metadata JSONB` required default `{}`; `ip_address VARCHAR(64)` optional; `created_at` required. Migration also creates `updated_at`, but the Sequelize model disables `updatedAt` (mismatch). Indexes actor/date, creator/date and entity/date. Introduced by 014.

### `analytics_events`

Purpose: recorded engagement events for admin/creator analytics.

`id UUID` PK; `event_type VARCHAR(64)` required (`SONG_PAGE_VIEWED`, playback start/complete, rhythm start/complete, trivia start/complete, reflection submitted, folder viewed); `song_id UUID` optional FK songs cascade; `folder_id UUID` optional FK folders cascade; `user_id UUID` optional FK users set null; `metadata JSONB` required default `{}`; timestamps. Check requires folder for `FOLDER_VIEWED`, otherwise song. Indexes song/type/date, folder/type/date and date. Introduced by 015.

### `song_bookmarks`

Purpose: saved song membership for a user.

`user_id UUID` FK users cascade + `song_id UUID` FK songs cascade form composite PK; `created_at TIMESTAMPTZ` required default now; no `updated_at`. Song index. Introduced by 021 song bookmarks.

---

## 11. Migration Chronology

| Migration | Change |
| --- | --- |
| `001_initial_schema.sql` | Core users, sessions, songs, instruments, learning, scores, reflections, badges, trivia and generation tables |
| `002_guest_reflections.sql` | Guest/display-mode compatibility columns and backfill |
| `003_reflection_moderation.sql` | Moderation fields/FK/index compatibility |
| `004_song_lifecycle.sql` | Five-state Song lifecycle, current job states, media/lyrics/language columns and indexes |
| `005_unique_active_generation_job.sql` | One active job per song |
| `006_reflection_published_song_and_rejection.sql` | Reflection rejection state and song/status index |
| `007_game_score_model_alignment.sql` | Combo/rank compatibility and user score index |
| `008_rhythm_beatmaps.sql` | Versioned beatmap table and uniqueness |
| `009_rhythm_beatmap_published_at.sql` | Published timestamp repair |
| `010_song_audio_file_name.sql` | Original upload filename |
| `011_multi_creator_roles_and_schema_alignment.sql` | Admin role, account status, transcription segments and ownership indexes |
| `012_creator_applications.sql` | Application table and active/status indexes |
| `013_folders_and_song_folders.sql` | Folders and approved placements |
| `014_moderation_audit_and_warnings.sql` | Warnings, moderation actions and audit logs |
| `015_workflow_completion_and_analytics_events.sql` | Complete application/folder workflows, history/proposals and analytics events |
| `016_email_verification_and_auth_otp.sql` | Email/auth version, application fields and OTP table |
| `017_oauth_identities.sql` | Google/Apple identity links |
| `018_separate_creator_access_status.sql` | Separate creator suspension, reasons and legacy backfill |
| `019_creator_profiles.sql` | Creator public biographies |
| `020_user_profiles.sql` | Shared profile/privacy/preferences and creator-profile cleanup |
| `021_song_bookmarks.sql` | User/song bookmarks |
| `021_user_profile_interest_tags.sql` | Canonical profile interests |
| `022_guest_score_claim_id.sql` | Idempotent score claim key |
| `023_reflection_discussions.sql` | Comments and likes |
| `024_admin_summary_indexes.sql` | Admin summary/safety indexes |
| `024_badges_streaks_and_challenges.sql` | Login streaks, badge uniqueness and challenge progress |
| `025_account_deletion.sql` | Legacy soft-delete status/column (superseded) |
| `025_instrument_lab_samples.sql` | Instrument sample map and attribution fields |
| `025_song_reports.sql` | Song-report queue |
| `026_account_hard_delete.sql` | Nullable/set-null historical actor references |
| `026_badge_definitions.sql` | Badge metadata catalog and seed rows |
| `027_song_exploration_badges.sql` | Distinct exploration records and badge seeds |
| `028_song_section_recommendations.sql` | AI section recommendations and confirmation timestamp |

---

## 12. Model/Migration Differences and Schema Risks

1. **Generation job default conflict:** 001 creates `status DEFAULT 'NOT_STARTED'`; 004 changes allowed values and existing rows but does not change the database default. A raw insert omitting status can violate the new check. Sequelize supplies `QUEUED`, so normal model writes are protected. This needs a new forward migration, not an edit to historical files.
2. **Folder default conflict:** migration 015 changes the database default to `PENDING`, while `Folder.js` defaults to `APPROVED`. Normal model inserts may therefore bypass the intended proposal default unless routes set status explicitly.
3. **Song `bookmark` mismatch:** `Song.js` defines a non-null Boolean `bookmark` default false, but no SQL migration adds the column. Production queries that select all mapped attributes may fail unless the deployed database was altered outside these migrations. Per-user bookmarks correctly live in `song_bookmarks`.
4. **JSON vs JSONB:** many models use `DataTypes.JSON` while PostgreSQL migrations create `JSONB`. Values are compatible for ordinary reads/writes, but test-time SQLite/PostgreSQL sync does not exactly represent production types/index behavior.
5. **Audit timestamp mismatch:** migration 014 creates `audit_logs.updated_at`, while `AuditLog.js` disables `updatedAt`. The column remains but is not maintained by the model.
6. **Duplicate migration numbers:** 021, 024, 025 and 026 each have multiple files. Numeric-only runners or human instructions saying merely “ascending order” are ambiguous; use full lexicographic filenames and record applied filenames.
7. **Historical migrations were retrofitted:** 001 already contains columns later added idempotently by 002, 003 and 007. This is harmless on a fresh database due to `IF NOT EXISTS`, but means a fresh schema is not an exact replay of the schema as originally introduced.
8. **Unused schema repair service:** `backend/services/schemaService.js` contains additive repairs but production startup does not call them; only selected functions are tested. Production correctness depends on migrations.
9. **SQLite drift risk:** most tests create tables from models with `sequelize.sync({ force: true })`; they do not validate ordered PostgreSQL DDL, checks, partial indexes or migration defaults.
10. **Legacy fields remain:** `songs.language`, `songs.lyrics`, `users.deleted_at` and account status `DELETED` are retained for compatibility but are not the preferred current paths.
11. **Model-only validation:** `songs.duration_secs >= 0` is validated by Sequelize but has no SQL check. Direct SQL can store negative values.
12. **Unverified live schema:** this overview is derived from repository migrations/models, not a production database introspection. Out-of-band changes, missing applied migrations or enum artifacts require a deployment-specific comparison.
