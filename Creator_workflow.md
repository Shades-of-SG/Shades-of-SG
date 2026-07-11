# Creator Song Workflow Development Journal

## Authoritative Song Lifecycle and Creator Seed Utility

### Date

11 July 2026

### User Request

The creator-to-public song workflow needed one authoritative database lifecycle instead of separate mock, draft, generation, and public systems. The required Song lifecycle was:

`DRAFT → GENERATING → READY → PUBLISHED → ARCHIVED`

Generation jobs needed an independent lifecycle:

`QUEUED → PROCESSING → COMPLETED / FAILED`

The work also needed to guarantee that generation never publishes a song automatically, public endpoints expose only published songs, creator operations enforce authenticated ownership, and publishing validates all required metadata and media. After the development database was intentionally reset, a separate request added a safe environment-driven creator seed command that creates no demo content.

### Audit and Decisions

Before implementation, Codex audited the design documents, Sequelize models and associations, migrations, authentication middleware, song and generation controllers, Cloudinary services, tests, and frontend workflow entry points.

The audit found that:

- Song already belonged to User through `creatorId`, but the column was nullable and creator ownership was not enforced by song routes.
- Song only supported `DRAFT` and `PUBLISHED`.
- GenerationJob used `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, and `FAILED`.
- song and generation routes used authentication bypasses instead of the existing creator middleware.
- public song endpoints returned every database row, including drafts.
- generation completion did not explicitly publish, but public filtering was weak enough to make drafts visible anyway.
- the video assembler expected a Cloudinary result object while the storage service returned a string, preventing reliable video URL persistence.
- the backend contained a hardcoded `demo-song` public response and score exception.
- Studio and Generation Tasks represented conflicting creation entry points, although frontend integration was deliberately deferred to a later phase.

The implementation reused the existing Song and GenerationJob tables rather than introducing a second draft table. JSON was retained for list-style metadata because `moodTags` already used the project's JSON convention. CamelCase Sequelize attributes continue to map to snake_case database columns.

### AI Output

Codex expanded the existing Song model into the authoritative creator-owned record for every lifecycle stage. The model now supports:

- creator ownership;
- title, artist, description, and theme;
- languages and other languages;
- mood tags;
- raw lyrics;
- cover-image URL and Cloudinary public ID;
- audio URL and Cloudinary public ID;
- source YouTube URL;
- video URL and Cloudinary public ID;
- duration in seconds;
- lifecycle status;
- publication date.

The Song lifecycle is now `DRAFT`, `GENERATING`, `READY`, `PUBLISHED`, and `ARCHIVED`. The GenerationJob lifecycle is now `QUEUED`, `PROCESSING`, `COMPLETED`, and `FAILED`, with start and completion timestamps.

A safe additive SQL migration was created. It adds the new song and generation columns, backfills `languages` from the legacy `language` field, backfills `raw_lyrics` from the legacy `lyrics` field, translates old generation states to the new names, replaces status constraints, and creates indexes for creator/status and public publication queries. It does not use destructive sync behaviour or delete legacy columns. Because older production rows may have no creator, the migration intentionally leaves physical `creator_id NOT NULL` enforcement for a later reviewed backfill while the Sequelize model and all new application writes require a creator immediately.

Public and creator song reads are now separate. `GET /api/songs` and `GET /api/songs/:id` query only `PUBLISHED` rows. Creator endpoints use the existing database-verified `requireCreator` middleware and always include the authenticated creator ID in their queries. A different creator receives a not-found response and cannot use the endpoint to determine whether another creator's private song exists.

Draft creation now supports metadata-only persistence as well as existing audio upload, YouTube extraction, and previously uploaded audio URLs. This allows a draft to survive refreshes without requiring generation or publication. Existing request aliases for `lyrics`, `youtubeUrl`, and a single `language` are temporarily accepted while the backend stores the authoritative fields as `rawLyrics`, `sourceYoutubeUrl`, and `languages`.

Publishing is now an explicit creator action. It requires:

- an owned Song in `READY` status;
- a completed latest GenerationJob;
- title;
- artist;
- description;
- theme;
- at least one language;
- raw lyrics;
- cover image;
- audio;
- video, including an accepted temporary placeholder MP4 URL.

Successful publishing changes the Song to `PUBLISHED` and records `publishedDate`. It is the only normal application operation that performs this transition. Unpublishing changes the Song back to `READY`, clears `publishedDate`, and immediately removes it from public API responses.

Generation start now requires creator authentication and ownership. Only `DRAFT` or `READY` songs may start, and duplicate active jobs are rejected. Starting creates a `QUEUED` job and changes the Song to `GENERATING`; pipeline work changes the job to `PROCESSING`. Successful completion changes the job to `COMPLETED` and the Song to `READY`, never `PUBLISHED`. Failure changes the job to `FAILED` and returns the Song to `DRAFT`, or `READY` when an existing video makes that state appropriate.

The existing audio extraction, lyric extraction, scene-planning, frame-generation, and video-assembly logic was preserved. Their lifecycle checks were updated from `IN_PROGRESS` to `PROCESSING`, and scene planning now reads the authoritative `rawLyrics` field. Cloudinary audio uploads now return the audio public ID. Compiled video uploads now return both the secure URL and public ID, fixing the previous storage return-shape mismatch.

Production-facing `demo-song` handling was removed from the backend song and score routes. The development mock-generation seed utility was retained because it is opt-in and is not run as part of normal application startup.

After the database reset, Codex added a separate `seedCreator.js` utility. It reads `SEED_CREATOR_EMAIL` and `SEED_CREATOR_PASSWORD`, normalises the email, validates that both values exist, and checks the existing User model. If the email already exists, it reports that no changes were made and exits successfully. Otherwise it creates exactly one `CREATOR` account and hashes the password with the application's existing `hashPassword` function. It creates no songs, jobs, reflections, scores, segments, frames, or demo records.

### Routes Added or Changed

Public song routes:

- `GET /api/songs` — published songs only.
- `GET /api/songs/:id` — returns a song only when it is published.

Creator song routes:

- `GET /api/songs/creator` — returns owned songs across all lifecycle states and supports a status filter.
- `GET /api/songs/creator/:id` — returns one owned song.
- `POST /api/songs` — creates an owned persisted draft.
- `PUT /api/songs/:id/metadata` — updates an owned non-generating song.
- `PUT /api/songs/:id/publish` — explicitly validates and publishes an owned ready song.
- `PUT /api/songs/:id/unpublish` — returns an owned published song to ready.
- `POST /api/songs/extract-audio` — now requires creator authentication.

Generation routes now require creator authentication and enforce ownership:

- `GET /api/generation`
- `GET /api/generation/:id/status`
- `POST /api/generation/start`

### Files Created

- `backend/migrations/004_song_lifecycle.sql`
- `backend/tests/songLifecycle.test.js`
- `backend/scripts/seedCreator.js`

### Files Modified

- `backend/package.json`
- `backend/controllers/generationController.js`
- `backend/controllers/songController.js`
- `backend/models/GenerationJob.js`
- `backend/models/Song.js`
- `backend/routes/aiGeneration.js`
- `backend/routes/scores.js`
- `backend/routes/songs.js`
- `backend/services/aiScenePlanner.js`
- `backend/services/aiStorageService.js`
- `backend/services/frameGenerator.js`
- `backend/services/videoAssembler.js`
- `backend/tests/reflections.test.js`
- `backend/tests/scores.test.js`

No frontend files were changed during this phase.

### Tests Added

The lifecycle test suite proves that:

- draft songs are not publicly listed or retrievable;
- ready songs are not publicly listed or retrievable;
- generation completion marks the job completed and the song ready without publishing;
- publishing fails and reports missing required fields and media;
- publishing succeeds when an owned ready song and completed generation satisfy every requirement;
- another creator cannot edit someone else's song;
- another creator cannot publish someone else's song;
- unpublishing returns a song to ready and removes it from public responses;
- creator endpoints return all five lifecycle states only for the authenticated creator.

### Verification Performed

- Ran the focused lifecycle Jest suite: one suite and eight tests passed.
- Ran the complete backend Jest suite: four suites and eighteen tests passed.
- Ran ESLint against all changed backend lifecycle, route, service, model, and test files; it passed without errors.
- Checked the creator seed script with `node --check`; syntax validation passed.
- Parsed `backend/package.json` after adding the seed command; JSON validation passed.
- The creator seed script was not executed during implementation, avoiding an unintended database write.

### Creator Seed Command

Set `SEED_CREATOR_EMAIL` and `SEED_CREATOR_PASSWORD` in `backend/.env`, then run:

```powershell
cd C:\Shades-of-SG\backend
npm run seed:creator
```

The package command runs `node scripts/seedCreator.js`.

### My Review and Decisions

I chose one Song row as the source of truth throughout drafting, generation, review, publication, and archival. This avoids synchronisation problems that would arise from a separate draft table and preserves associations with generation jobs, scenes, frames, reflections, and scores.

I kept publication independent from technical generation completion. A completed video means the song is ready for creator review; it does not mean the creator has approved its metadata, media, cultural context, or public release. The `READY` state makes that distinction explicit.

I treated temporary placeholder MP4 media honestly as an accepted publication prerequisite rather than claiming that full AI video generation is complete. The backend only checks that a video URL exists; later UI and metadata work can distinguish placeholder and generated media more visibly if needed.

I preserved legacy database columns during migration because dropping them in the same phase would be unnecessarily destructive. Their data is copied into the authoritative fields, and removal can happen only after production verification and a dedicated migration.

I kept creator seeding separate from normal startup. An explicit one-purpose command is safer after a database reset because it cannot silently create songs or demo workflow records, and rerunning it is idempotent for the configured email.

### Final Outcome

The backend now has a coherent creator-to-public lifecycle with database-backed drafts, separate generation status, creator ownership, explicit publication, reversible unpublishing, and strict public filtering. Generation completion produces a reviewable `READY` song and cannot make content public by itself.

The reset database can be given one initial creator account through a dedicated environment-driven command. The password uses the same secure hashing logic as regular authentication, existing accounts are never modified, and no content or demo data is seeded.

### Remaining Work

- Apply `004_song_lifecycle.sql` through the project's production migration process.
- Review and backfill any legacy songs with `creator_id IS NULL` before adding a physical PostgreSQL `NOT NULL` constraint.
- Integrate Studio with persisted draft creation and editing.
- Convert My Songs and Dashboard from mock data to creator APIs.
- Make Generation Tasks monitor and start jobs for existing Studio songs rather than creating a second song workflow.
- Add the cover-image upload endpoint and Cloudinary cleanup flow.
- Integrate public Songs Library, Song Experience, Rhythm Hub, and Reflection Wall with published-only song data.

### Lesson

Generation readiness and publication approval are different business decisions. Treating them as one status makes incomplete or unreviewed content public and leaves creators without a deliberate release step. A separate `READY` state provides a safe boundary between automated processing and human publication.

Seed utilities should be narrow, explicit, and idempotent. Reading credentials from the environment, using the application's own password hashing, and exiting without modifying an existing account makes database recovery predictable without reintroducing demo content into the normal application flow.
