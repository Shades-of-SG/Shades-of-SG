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

---

## Phase 2 — Studio as the Authoritative Draft Workflow

### Date

11 July 2026

### User Request

After approving the backend lifecycle work, the next phase was limited to making Studio the authoritative creator workflow for draft creation and editing. Studio needed to persist a draft, keep one Song ID throughout editing and generation, reload saved data after refresh, support cover uploads and replacement, preserve lyric extraction, save manual lyrics as `rawLyrics`, use real backend data in Preview & Publish, and call the explicit publish endpoint only when backend readiness validation succeeded.

The work was deliberately restricted from updating Dashboard, My Songs, Songs Library, Rhythm Game, Reflection Wall, or other unrelated interfaces.

### Audit and Decisions

Codex inspected the existing Studio page, its information, lyrics, preview, header, and footer components, the creator route configuration, authentication context, API base configuration, Cloudinary helpers, and frontend test structure.

The existing Studio already had a useful three-step interface and a working transcription flow, but its workflow was entirely temporary:

- Save Draft only displayed an alert.
- Generate Video only navigated to Generation Tasks.
- Publish Song only displayed an alert and navigated away.
- no Song ID was retained;
- no existing draft could be loaded;
- refresh discarded all metadata and lyrics;
- cover images were unsupported;
- Preview & Publish included a hardcoded YouTube fallback rather than only real Song media.

The implementation retained the existing Studio layout instead of redesigning it. The chosen URL structure was:

- `/creator/studio/new` for a new draft;
- `/creator/studio/:songId` for an existing draft;
- `/creator/studio` as a compatibility redirect to the new-draft route.

This structure prepares My Songs to link its future Edit action directly to an authoritative Song record without requiring further Studio routing changes.

### AI Output

Codex created a dedicated frontend `songService` that uses the configured API base URL and sends the existing authentication token. Studio no longer embeds song API calls throughout the component or relies on mock page data.

On the first Save Draft, Studio calls the backend to create a real `DRAFT` Song. The backend returns the new UUID, Studio stores it, and the route is replaced with `/creator/studio/:songId`. Every later save updates that same record. Generation receives that same ID and therefore cannot create a duplicate Song row through the Studio workflow.

Opening an existing Studio URL now loads the creator-owned Song and publish-readiness response in parallel. The page restores:

- title;
- artist;
- description;
- theme;
- languages;
- other languages;
- mood tags;
- raw lyrics;
- source YouTube URL;
- cover image;
- persisted audio or video preview;
- lifecycle status and last-saved time.

Refreshing the browser therefore reloads saved database values instead of resetting the form.

Save Draft persists the required metadata fields. Lyrics produced through AI extraction remain editable, and the final textarea value is saved as `rawLyrics`, so manual corrections are not lost. The existing transcription-status check, YouTube transcription path, uploaded-media Base64 path, file-size behaviour, and error presentation were preserved.

Studio supports audio during initial creation and after a draft already exists. A new draft can send its selected audio with the create request. An existing draft uses a creator-owned audio endpoint that updates the same Song with its Cloudinary URL, public ID, and duration.

Cover-image support was added without introducing another media model. Studio accepts JPG, PNG, or WebP files and immediately shows a local preview. Saving uploads the image to a creator-owned Song endpoint, which stores `coverImageUrl` and `coverImagePublicId`. Selecting another image previews the replacement; after the new upload and database update succeed, the backend attempts to delete the old Cloudinary cover.

Generate Video now runs the same draft-save function first. Only after a successful save does it call the generation endpoint with the stable Song ID. This means newly entered metadata and manually edited lyrics are persisted before the Song enters `GENERATING`.

Preview & Publish now uses the current persisted Song media and database-backed form values. The previous hardcoded YouTube preview fallback was removed. Studio fetches a backend readiness result containing the missing requirements, current Song status, and latest GenerationJob status. Publish controls remain disabled until that authoritative response reports `ready: true`.

Publishing calls the existing explicit `PUT /api/songs/:id/publish` endpoint. The frontend does not set publication state itself. It saves first, refreshes readiness, reports missing requirements when necessary, and only then asks the backend to publish. Loading, error, successful save, queued generation, and successful publication states are displayed within Studio instead of relying on success alerts.

### Backend Changes

Cloudinary support gained a buffer-based image upload helper using the existing configuration. Uploaded covers are stored under `shades-of-sg/covers` and return their secure URL and public ID.

The Song controller gained:

- creator-owned cover upload and replacement;
- creator-owned audio upload for existing drafts;
- non-mutating publish-readiness inspection;
- multipart JSON parsing for languages, other languages, and mood tags.

The readiness endpoint reuses the same required-data logic as publication. It checks Song metadata and media plus the latest completed GenerationJob, but does not mutate the Song.

### Frontend Changes

Studio now includes:

- new and edit route modes;
- persisted Song ID handling;
- backend draft creation and updates;
- database-backed refresh recovery;
- cover preview, upload, and replacement;
- existing-draft audio upload;
- save-before-generate behaviour;
- generation using the existing Song ID;
- real media and metadata preview;
- explicit backend publication;
- backend-controlled readiness and disabled publish actions;
- loading, error, and success messages;
- busy-state button disabling.

The Studio header and footer received only the disabled/busy properties necessary for the workflow. The Song Information card received only the cover field and preview. No unrelated visual redesign was performed.

### Routes Added or Changed

Frontend:

- `/creator/studio` redirects to `/creator/studio/new`.
- `/creator/studio/new` opens a new draft workflow.
- `/creator/studio/:songId` loads an existing owned draft.

Backend:

- `POST /api/songs/:id/audio` uploads audio to an existing owned Song.
- `POST /api/songs/:id/cover` uploads or replaces an owned Song's cover.
- `GET /api/songs/:id/readiness` reports whether an owned Song can be published.

Existing routes reused by Studio:

- `POST /api/songs`
- `GET /api/songs/creator/:id`
- `PUT /api/songs/:id/metadata`
- `POST /api/generation/start`
- `PUT /api/songs/:id/publish`
- transcription status and lyrics routes.

### Files Created

- `frontend/src/services/songService.js`

### Files Modified

- `backend/controllers/songController.js`
- `backend/routes/songs.js`
- `backend/services/cloudinaryService.js`
- `backend/tests/songLifecycle.test.js`
- `frontend/src/App.css`
- `frontend/src/App.jsx`
- `frontend/src/App.test.jsx`
- `frontend/src/components/studio/PreviewPublishPanel.jsx`
- `frontend/src/components/studio/SongInformationCard.jsx`
- `frontend/src/components/studio/StudioFooter.jsx`
- `frontend/src/components/studio/StudioHeader.jsx`
- `frontend/src/pages/Studio.jsx`

No database migration was required because Phase 2 uses the cover, audio, lyrics, ownership, and lifecycle fields introduced in Phase 1.

No Dashboard, My Songs, Songs Library, Rhythm Game, or Reflection Wall implementation was modified.

### Tests Added

Backend lifecycle coverage now also proves that:

- another creator cannot upload a cover for a Song they do not own;
- the owning creator can upload a cover;
- replacement persists the new URL and public ID;
- replacement requests deletion of the previous Cloudinary cover.

Frontend route coverage now proves that an authenticated creator can open `/creator/studio/:songId` and receive saved draft title and artist values from the backend.

### Verification Performed

- Ran the complete backend Jest suite: four suites and nineteen tests passed.
- Ran the complete frontend Vitest suite: two files and ten tests passed.
- Ran targeted backend ESLint on the changed controller, route, and Cloudinary service; it passed.
- Ran targeted frontend ESLint on Studio, its service, changed components, routing, and tests; it passed.
- Ran the frontend production build; 1,880 modules transformed successfully.
- Ran `git diff --check`; no whitespace errors were reported.

### My Review and Decisions

I made the route ID the durable workflow identity. Local component state is useful while typing, but it is not a reliable identifier for media, generation jobs, publication, or later editing. Replacing `/new` with the returned UUID immediately after the first save makes refresh and navigation predictable.

I reused one save operation before generation instead of maintaining a separate generation form. This ensures that generation always sees the latest metadata and lyrics and prevents the most serious previous conflict: creating another Song row when the creator only intended to generate the current draft.

I placed publish readiness on the backend because the backend owns the actual Song status, media URLs, and latest GenerationJob state. A frontend-only checklist can help explain missing work, but it cannot safely authorize publication. The UI therefore uses the readiness response to disable Publish and still relies on the publish endpoint to validate again.

I chose immediate local cover preview followed by server persistence. This gives creators useful replacement feedback without pretending an upload succeeded. The saved Cloudinary URL replaces the temporary blob URL after the operation completes.

I removed the hardcoded YouTube preview because Preview & Publish should not imply that a creator's draft contains media that is not actually associated with its database record.

### Final Outcome

Studio is now the single creator entry point for creating and editing a Song draft. The first save creates one database row, the route adopts its UUID, refresh restores the saved work, media remains attached to the same Song, and generation uses that same ID. Extracted and manually corrected lyrics persist in the authoritative `rawLyrics` field.

Cover images can be previewed, uploaded, and replaced through authenticated ownership-checked endpoints. Preview & Publish reflects real Song data, publication remains disabled until the backend confirms readiness, and the only publication transition occurs through the explicit backend endpoint.

### Remaining Work

- Remove the old secondary song-creation form from Generation Tasks in a later approved phase.
- Connect My Songs Edit actions to `/creator/studio/:songId`.
- Add cleanup for replaced Cloudinary audio assets.
- Decide whether cover cleanup failures require a retry queue rather than logging only.
- Complete the real generated MP4 pipeline; temporary placeholder MP4 URLs remain accepted.
- Remove or implement the currently visual-only publication scheduling controls.
- Integrate Dashboard and public experiences only in their later approved phases.

### Lesson

A persisted draft needs both durable data and durable identity. Saving fields without retaining the returned Song ID still produces fragmented workflows because media uploads and generation cannot know which record they belong to. Route-based identity solves refresh recovery, future edit links, and generation handoff with one consistent mechanism.

Readiness should be explained in the frontend but decided in the backend. This keeps the interface responsive and understandable while ensuring that stale UI state cannot bypass ownership, lifecycle, media, or generation requirements.

---

## Phase 3 — Generation Around an Existing Studio Song

### Date

11 July 2026

### User Request

Phase 3 was limited to unifying generation around the Song already created and edited in Studio. Generation Tasks could monitor jobs or start generation for an eligible owned Song, but it could no longer contain a second song-creation workflow or collect duplicate title, artist, lyrics, theme, description, media, or dummy metadata.

The required success path was:

`Studio draft → start generation with the same Song ID → monitor job → complete job → same Song becomes READY`

No generation action could create another Song or publish automatically. The phase also required creator-scoped job access, exact job status names, active polling, duplicate-job protection, retry-safe failures, and clearly isolated temporary placeholder-video handling.

### Audit and Decisions

Codex reviewed the generation controller, routes, scene-planning, frame-generation and video-assembly services, Generation Tasks, Generation Progress, KindMaster Editor, the shared frontend service layer, environment examples, and lifecycle tests.

The backend already accepted a Song ID and performed a basic active-job check, but several integration gaps remained:

- Generation Tasks still contained a complete secondary song form.
- That form collected duplicate metadata and called `POST /api/songs` before starting generation.
- It submitted dummy theme and description values.
- Generation pages called generation endpoints independently instead of consistently using the authenticated shared service.
- frontend labels still mixed older states such as `NOT_STARTED` and `IN_PROGRESS` with the new backend lifecycle.
- the active-job check was not protected against simultaneous requests at the database level.
- placeholder media was still represented elsewhere as a frontend hardcoded path rather than an explicitly configured backend generation limitation.

The implementation kept Studio as the primary place to create, upload, transcribe, edit, save, and initiate generation. Generation Tasks retains only a secondary convenience action for selecting an already eligible Song and starting a job with its existing UUID.

### AI Output

The secondary creation form was removed from Generation Tasks. The page no longer asks for or submits title, artist, lyrics, theme, description, YouTube URL, uploaded audio, extracted audio, or dummy values. It never calls the Song creation endpoint.

Generation Tasks now loads the authenticated creator's existing Songs and filters them to records that:

- are `DRAFT` or `READY`;
- have persisted audio;
- have persisted `rawLyrics`.

The creator chooses one eligible Song and the page sends only its ID to `POST /api/generation/start`. A prominent Create in Studio action reinforces that Studio owns creation and editing.

The backend independently validates the same generation prerequisites. It verifies creator ownership, accepts only `DRAFT` or `READY`, requires audio and raw lyrics, and rejects a Song that already has a `QUEUED` or `PROCESSING` job. Starting generation creates one GenerationJob referencing the existing Song and changes that Song to `GENERATING`. It never calls `Song.create`.

The asynchronous worker preserves the Phase 1 lifecycle:

- new job: `QUEUED`;
- worker begins: `PROCESSING`;
- successful worker: `COMPLETED` and Song `READY`;
- failed worker: `FAILED` and Song restored to `DRAFT` or `READY` as appropriate;
- no worker path changes a Song to `PUBLISHED`.

Completion now verifies that the Song has a video URL before marking the job completed. The existing real assembly path persists the Cloudinary video URL and public ID. Completion then marks the existing Song `READY` and leaves `publishedDate` null.

Failure handling was centralised into a retry-safe helper. It records the job error, keeps the Song row, and restores a valid non-active Song status. A creator can start a later retry against the same Song after the failed job becomes terminal. A second request remains forbidden while any active job exists.

Database-level duplicate protection was added with a partial unique index on `generation_jobs(song_id)` for `QUEUED` and `PROCESSING` jobs. This closes the race condition that could occur if two requests passed the controller lookup simultaneously. The controller check remains in place to return a clear HTTP 409 during ordinary duplicate attempts.

Generation job list and detail queries remain creator-scoped by joining the job to an owned Song. Another creator cannot start generation for the Song, retrieve the job detail, or see the job in their list.

The frontend shared `songService` gained authenticated methods for creator Songs, generation job lists, and generation job details. Generation Tasks, Generation Progress, and KindMaster Editor now use this configured API layer rather than constructing their own generation fetch calls.

Generation Tasks polls every three seconds while a `QUEUED` or `PROCESSING` job exists. It shows exact backend states and displays failure messages. Generation Progress also polls while active, stops at `COMPLETED` or `FAILED`, distinguishes queued from processing, and shows the backend error when a job fails. The status badge was updated to the exact four-state GenerationJob lifecycle.

### Placeholder-Video Handling

Temporary video support was moved behind the backend environment value:

```env
PLACEHOLDER_VIDEO_URL=
```

When configured, the worker stores that URL on the existing Song instead of claiming to have produced the final AI MP4. It stores no `videoPublicId`, marks the Song `READY` only after completing the job, and returns `videoIsTemporary: true` in the creator job detail.

Generation Progress explicitly says that the completed job used the configured temporary placeholder and should be reviewed before publishing. React contains no hardcoded generation placeholder URL and does not describe this path as a completed AI-generated video.

When `PLACEHOLDER_VIDEO_URL` is empty, the existing scene planning, frame generation, FFmpeg assembly, Cloudinary upload, `videoUrl`, and `videoPublicId` flow remains active.

For local development, the placeholder file may be stored at:

```text
frontend/public/videos/placeholder-generation.mp4
```

with:

```env
PLACEHOLDER_VIDEO_URL=http://localhost:5173/videos/placeholder-generation.mp4
```

In deployment, the backend environment should use the full deployed frontend URL. The setting belongs to the backend host because the generation worker reads it.

### Routes Changed

No new generation HTTP route was required. Existing routes were hardened and reused:

- `POST /api/generation/start` — starts a job for an existing owned Song only.
- `GET /api/generation` — returns creator-scoped jobs.
- `GET /api/generation/:id/status` — returns creator-scoped detail, failure information, Song media, and temporary-video labeling.
- `GET /api/songs/creator` — supplies existing eligible Songs to Generation Tasks.

### Files Created

- `backend/migrations/005_unique_active_generation_job.sql`

### Files Modified

- `backend/.env.example`
- `backend/controllers/generationController.js`
- `backend/routes/aiGeneration.js`
- `backend/tests/songLifecycle.test.js`
- `frontend/src/components/GenerationStatusBadge.jsx`
- `frontend/src/pages/CreatorGenerationJobs.jsx`
- `frontend/src/pages/GenerationProgress.jsx`
- `frontend/src/pages/KindMasterEditor.jsx`
- `frontend/src/services/songService.js`

Dashboard, My Songs, public Songs Library, Rhythm Game, and Reflection Wall were not modified.

### Tests Added

Backend lifecycle coverage now proves that:

- generation uses an existing Song ID;
- starting generation does not increase the Song count;
- duplicate active jobs are rejected;
- only one active job is stored for a Song;
- retry becomes available only after failure;
- retry uses the same Song and creates no duplicate Song;
- another creator cannot start generation;
- another creator cannot retrieve the job detail;
- another creator cannot see the job in their list;
- failure records its error message;
- failure preserves the Song row;
- failure restores a retryable lifecycle state;
- configured placeholder completion stores the video URL;
- temporary placeholder completion stores no Cloudinary video public ID;
- successful completion changes the Song to `READY`;
- completion leaves `publishedDate` null and never publishes.

### Verification Performed

- Ran the complete backend Jest suite: four suites and twenty-four tests passed.
- Ran the complete frontend Vitest suite: two files and ten tests passed.
- Ran full backend ESLint; it passed.
- Ran full frontend ESLint; it passed.
- Ran the frontend production build; 1,880 modules transformed successfully.
- Ran `git diff --check`; no whitespace errors were reported.
- Searched Generation Tasks and the shared service for Song creation, dummy metadata, extraction-form remnants, and direct relative generation API calls; none remained.

### My Review and Decisions

I removed the duplicate form rather than trying to keep two creation paths synchronized. Two interfaces that can independently create a Song will eventually disagree about validation, ownership, media, lyrics, and ID handoff. Restricting Generation Tasks to existing records makes its purpose clear: orchestration and monitoring.

I retained a start control in Generation Tasks because it is useful for retrying or processing an existing eligible draft, but Studio remains the preferred entry point. Both paths now perform the same safe operation with one Song ID.

I added database-level duplicate protection because a controller query alone cannot prevent two simultaneous requests from both observing no active job. The partial unique index expresses the actual business rule without preventing historical completed and failed jobs.

I treated placeholder completion as a configured operational fallback, not generated output. Returning a temporary-media flag allows the UI to be honest while preserving the required `READY` review stage and explicit publication gate.

### Final Outcome

The creator generation workflow now satisfies the target integration:

`Studio draft → same Song ID starts generation → creator job appears and polls → job completes → same Song becomes READY`

Generation Tasks creates no Song, collects no duplicate metadata, and submits no dummy data. The backend rejects duplicate active jobs, protects creator ownership, preserves Songs after failure, supports retry against the same record, and never publishes automatically.

Configured placeholder videos remain isolated, backend-controlled, and visibly temporary. The real extraction, transcription, scene-planning, frame-generation, assembly, and Cloudinary paths remain available rather than being replaced by frontend simulation.

### Remaining Work

- Apply `005_unique_active_generation_job.sql` to PostgreSQL through the project migration process.
- Replace the process-local fire-and-forget worker with a durable queue if production reliability requires restart recovery.
- Decide whether retry scene segments should be versioned by GenerationJob instead of remaining Song-scoped.
- Complete and validate the real final MP4 pipeline across the deployed environment.
- Replace the global placeholder configuration with per-Song uploaded temporary MP4 management if creators need different placeholders.
- Complete the KindMaster Editor only if it remains part of the approved product scope.
- Integrate Dashboard, My Songs, and public consumers only in later approved phases.

### Lesson

Creation and generation are separate responsibilities joined by one durable ID. Studio owns the content record; generation owns processing attempts. Once that boundary is explicit, retries become additional jobs rather than additional Songs, monitoring becomes creator-scoped history, and publication remains a deliberate human decision after technical completion.

Concurrency rules belong in the database as well as the controller. A friendly pre-check improves errors, but only a unique active-job constraint can guarantee that simultaneous requests do not violate the lifecycle.

---

## Phase 4 — Real Creator Songs and Dashboard Data

### Date

11 July 2026

### User Request

Phase 4 replaced production-facing mock data in My Songs and Dashboard with authenticated creator-scoped backend data. My Songs needed exact lifecycle counts, filters, real Song media and job status, and working edit, generation, publication, archive, and delete actions. Dashboard needed real counts, recent Songs, and recent generation jobs without fake play totals or weekly charts.

The work was restricted from changing public Songs Library, Song Experience, Rhythm Game, or Reflection Wall. The completed work also needed to be recorded in this journal.

### Audit and Decisions

The audit confirmed that both creator pages were still sourced from `pageData.js`. My Songs displayed `Song #1` sample records, sample lyrics, initials, and hardcoded Draft/Published totals while archive and delete only changed local React state. Dashboard displayed fixed totals, fake weekly play minutes, and hardcoded generation jobs.

The existing creator Song endpoint already enforced authentication and ownership, so it was enriched instead of duplicated. A single dashboard summary endpoint was added because it prevents the Dashboard from performing separate count, recent-Song, and recent-job requests.

No trustworthy play-event or aggregate analytics source currently exists. The fake total and weekly chart were removed. Dashboard now states honestly that play analytics are unavailable.

### AI Output

The creator Song list now includes each owned Song's latest GenerationJob, publication readiness, and missing publication requirements. Counts and filters use the exact lifecycle values `DRAFT`, `GENERATING`, `READY`, `PUBLISHED`, and `ARCHIVED`.

My Songs now loads real creator-owned Songs through the authenticated service. Each row shows the persisted cover image or a neutral No cover fallback, title, artist, lifecycle status, latest generation status, and last-edited timestamp. Mock initials and sample records are no longer used.

The selected Song detail exposes only valid actions for its current state:

- Edit opens `/creator/studio/:songId` unless generation is active.
- Generate starts an eligible `DRAFT` or `READY` Song with audio and lyrics.
- Retry is shown after a failed latest job when the Song is eligible.
- View Generation opens the real job detail.
- Publish is limited to `READY` and disabled until backend readiness succeeds.
- Unpublish returns `PUBLISHED` to `READY`.
- View opens the public Song route only for a published Song.
- Archive is blocked for generating and already archived Songs.
- Delete requires confirmation and is blocked while generating.

Every mutation is performed through the backend and followed by a creator-list refetch. The UI does not pretend that local state is authoritative. The page polls while a Song or latest job is active so lifecycle and job status update without a full refresh.

Dashboard now uses one authenticated summary response containing creator-scoped lifecycle counts, five recently edited Songs, and five recent generation jobs. Recent Song cards use real covers, titles, artists, statuses, timestamps, and Studio links. Job cards show real status, errors, and status-detail links. Dashboard polls while an active job is present.

The backend summary performs all count and activity queries with the authenticated creator ID. Another creator's Songs and jobs are excluded from counts, recent content, and generation activity.

Archive now changes an owned non-generating Song to `ARCHIVED` and clears `publishedDate`. Since public endpoints still query only `PUBLISHED`, archiving immediately removes a formerly public Song from public visibility.

Delete now verifies ownership and rejects generating Songs. Before deletion it gathers Cloudinary identifiers for the cover, audio, final video, and generated frames. The Song is deleted through the existing database relationships, then Cloudinary cleanup is attempted for every gathered asset with the correct image or video resource type. Cleanup failures are counted and returned without restoring a Song that was already successfully deleted.

### Routes Added or Changed

- `GET /api/songs/creator` now includes latest generation state and publication readiness.
- `GET /api/songs/creator/dashboard/summary` returns scoped counts, recent Songs, recent jobs, and an honest play-analytics availability flag.
- `PUT /api/songs/:id/archive` archives an owned non-generating Song.
- `DELETE /api/songs/:id` deletes an owned non-generating Song and attempts associated Cloudinary cleanup.

Existing publish, unpublish, generation-start, Studio edit, and generation-detail routes were reused.

### Files Modified

- `backend/controllers/songController.js`
- `backend/routes/songs.js`
- `backend/services/cloudinaryService.js`
- `backend/tests/songLifecycle.test.js`
- `frontend/src/App.css`
- `frontend/src/App.test.jsx`
- `frontend/src/pages/CreatorSongs.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/services/songService.js`
- `Creator_workflow.md`

No migration was needed in Phase 4. Existing lifecycle fields, associations, and Cloudinary public-ID fields were reused.

Public Songs Library, Song Experience, Rhythm Game, and Reflection Wall were not modified.

### Tests Added

Backend tests now verify:

- dashboard lifecycle counts are correct;
- total count equals the creator's actual Song total;
- another creator's Songs are excluded;
- another creator's jobs are excluded;
- recent Songs and jobs are creator-scoped;
- play analytics are reported unavailable;
- archive enforces ownership;
- archive clears publication state and public visibility;
- refreshed creator lists show `ARCHIVED`;
- delete enforces ownership;
- denied deletion preserves the Song;
- successful deletion removes the Song;
- deletion attempts cover, audio, video, and frame Cloudinary cleanup;
- creator list refresh reflects publish and unpublish mutations.

Frontend tests now verify:

- My Songs renders a real backend Song and artist;
- old `Song #1` mock data is absent;
- Dashboard renders the backend summary;
- fake `1,240` play totals and weekly chart are absent;
- play analytics display an honest unavailable state.

### Verification Performed

- Complete backend Jest suite: four suites and twenty-eight tests passed.
- Complete frontend Vitest suite: two files and twelve tests passed.
- Full backend ESLint passed.
- Full frontend ESLint passed.
- Frontend production build passed with 1,880 modules transformed.
- `git diff --check` was used during final verification.

### My Review and Decisions

I enriched the existing creator Song response rather than adding separate My Songs endpoints. Latest job state and readiness are properties of how the creator manages each Song, and returning them together avoids a request per row.

I added a dedicated summary endpoint for Dashboard because counts and recent activity should represent one authenticated snapshot. Repeating those queries independently in the browser would add latency and increase the chance of inconsistent metrics.

I removed fake analytics instead of replacing them with zero. Zero means a measured absence of plays, while unavailable means the application does not yet have a reliable measurement system. The latter is the honest state.

I kept destructive asset cleanup best-effort after database deletion. A Cloudinary outage should be reported for operational cleanup, but it should not leave a database Song partially deleted or encourage an unsafe attempt to reconstruct cascaded records.

### Final Outcome

My Songs and Dashboard now reflect the authenticated creator's real database state. Lifecycle counts, filters, covers, metadata, generation activity, recent edits, publication readiness, and mutations no longer come from mock arrays or hardcoded numbers.

Creator actions persist through backend endpoints and refetch authoritative state. Archive removes content from public visibility, delete enforces ownership and attempts full media cleanup, and active generation changes appear through polling. Dashboard contains no invented play totals or weekly activity.

### Remaining Work

- Public View still leads to the current placeholder Song Experience until its later integration phase.
- Cloudinary cleanup failures are returned as a count but are not yet stored in a retry queue.
- Replaced audio cleanup remains separate from full Song deletion cleanup.
- An archived Song currently has no restore action because restoration was not requested.
- Dashboard recent limits are fixed at five and do not yet support pagination.
- Play analytics require a real persisted play-event or aggregate model before the metric can return.
- Public Songs Library, Song Experience, Rhythm Game, and Reflection Wall remain for later approved phases.

### Lesson

Creator management pages must treat the database response as the source of truth after every mutation. Local-only deletion, archive, and publication changes create a convincing interface that immediately becomes incorrect after refresh or in another session.

Metrics also need semantic honesty. A polished chart is harmful when its numbers are invented. Removing it and stating that analytics are unavailable preserves trust until real event tracking exists.

---

## Phase 5 — Published Songs Power Every Public Song Experience

### Date

11 July 2026

### User Request

Phase 5 established the creator workflow as the single source of truth for public content. Every public-facing Song experience needed to consume only published Songs through `GET /api/songs` and `GET /api/songs/:id`. Public pages could no longer use `pageData.js`, `sampleSongs`, `songData.js`, `demo-song`, mock Song arrays, or placeholder creator data.

The required integration covered Songs Library, Song Experience, Learning Hub, Trivia, Instrument Playground, Explore Song, and rhythm entry. Rhythm score persistence and Reflection submission behavior were explicitly deferred.

### Audit and Decisions

The public audit found that Landing and Songs Library still imported `sampleSongs`; Song Experience rendered the route ID alongside placeholder metadata; Rhythm Hub linked directly to `demo-song`; Rhythm Game and Results defaulted missing IDs to `demo-song`; and the only bundled beatmap was a demo Song. Trivia and Instrument Playground showed fake placeholder activity content without loading the selected Song.

Learning Hub contained general Singapore educational content rather than mock Song records. That curated non-Song material was preserved, while a new published-Song section was added so song-led learning activities receive a real backend ID.

The public API already enforced `status = PUBLISHED`. It was reused and extended with search, theme, language, and mood filtering instead of creating another public content endpoint.

### AI Output

A shared `publicSongService` now owns unauthenticated published Song requests through the configured API base URL. Public list pages call `GET /api/songs`; Song-specific pages call `GET /api/songs/:id`. No public component constructs a private creator request or receives draft lifecycle data.

Songs Library now loads backend Songs with loading, empty, and error states. Search is debounced and matches title, artist, description, theme, and languages. Theme, language, and mood filters use values derived from the returned published data and send supported query parameters to the backend.

Song cards now display the real cover image, title, artist, description, languages, and theme. When no cover exists they show a neutral No cover state rather than invented initials. Explore Song links preserve the database UUID in `/songs/:id`.

Landing's Featured Songs section now loads up to three published backend Songs. It shows an honest empty state when none have been published and no longer imports sample data.

Song Experience now loads the selected published Song. It displays real metadata and uses the stored video with the cover as poster when available. If video or cover media is missing, it states that honestly. Description is used as the cultural summary; missing descriptions show an unavailable message rather than fabricated context.

Song Experience passes the same real Song ID to:

- `/songs/:id/trivia`;
- `/songs/:id/playground`;
- `/game/:id`.

Trivia and Instrument Playground now validate and load the selected published Song before rendering. They show its title, artist, theme, languages, and description context. Since real trivia questions and Song-instrument content are not yet integrated, they display explicit unavailable states instead of fake questions, fake progress, fake results, or fake instrument controls.

Learning Hub now loads published Songs and offers Explore, Trivia, and Playground links carrying each real Song ID. Existing historical and cultural learning content remains separate from the authoritative Song records.

Rhythm Hub now lists published Songs and links each one to `/game/:songId`. The direct Play Demo Song action was removed. Rhythm Game and Rhythm Results no longer default to `demo-song`. The rhythm Song detail request uses the configured API URL and therefore validates that the selected Song is published. Score persistence was not changed.

The hardcoded frontend rhythm placeholder fallback was removed from Song loading. If a published Song has no playable video or beatmap, the existing game reports an unavailable chart/media condition rather than silently substituting a demo Song.

The bundled `demo-song` beatmap was deleted. All sample and creator Song exports were removed, then `pageData.js` itself was deleted after Profile was changed to an honest unavailable achievement state. This ensures no public page imports the prohibited file.

### Backend Behavior

`GET /api/songs` continues to require `PUBLISHED` status before applying optional filters:

- `search` across title, artist, description, theme, and languages;
- exact theme;
- exact language, case-insensitive;
- exact mood tag, case-insensitive.

`GET /api/songs/:id` continues to return 404 for draft, generating, ready, archived, missing, or malformed Song IDs. Public responses include the persisted cover, title, artist, description, languages, theme, mood tags, audio, and video fields required by the public experiences.

### Files Created

- `frontend/src/services/publicSongService.js`

### Files Deleted

- `frontend/src/pages/pageData.js`
- `frontend/public/beatmaps/demo-song.json`

### Files Modified

- `backend/controllers/songController.js`
- `backend/tests/songLifecycle.test.js`
- `frontend/src/App.css`
- `frontend/src/App.test.jsx`
- `frontend/src/components/FilterBar.jsx`
- `frontend/src/components/RhythmGame.jsx`
- `frontend/src/components/SongCard.jsx`
- `frontend/src/game/songDetailsApi.js`
- `frontend/src/pages/InstrumentPlayground.jsx`
- `frontend/src/pages/Landing.jsx`
- `frontend/src/pages/LearningHub.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/RhythmHub.jsx`
- `frontend/src/pages/RhythmResults.jsx`
- `frontend/src/pages/SongExperience.jsx`
- `frontend/src/pages/SongsLibrary.jsx`
- `frontend/src/pages/TriviaHub.jsx`
- `Creator_workflow.md`

No database migration or route shape change was required. The existing published Song endpoints remain the only public Song source.

### Removed Mock Data

- `sampleSongs` and all of its fake Song records;
- `creatorSongs` and sample lyrics retained in the old shared page file;
- `Song #1` through `Song #4` exports;
- `demo-song` defaults and public links;
- the bundled demo beatmap;
- placeholder Song metadata in Song Experience;
- fake trivia question progress and results;
- fake instrument selection and controls;
- the hardcoded rhythm video fallback;
- public imports of `pageData.js`.

### Tests Added

Backend tests now prove that combined public search, theme, language, and mood filters return only the matching published Song. The result is checked for real title, artist, description, languages, theme, and cover fields, while a matching READY Song remains excluded.

Frontend tests now prove that:

- Songs Library renders a published backend Song;
- real artist and cover data are used;
- Explore Song contains the real backend ID;
- Demo Song is absent;
- Song Experience loads backend metadata;
- Trivia, Playground, and Rhythm links preserve the selected real Song ID.

### Verification Performed

- Complete backend Jest suite: four suites and twenty-nine tests passed.
- Complete frontend Vitest suite: two files and fourteen tests passed.
- Full backend ESLint passed.
- Full frontend ESLint passed.
- Frontend production build passed with 1,880 modules transformed.
- Repository searches confirmed no production `sampleSongs`, `creatorSongs`, `demo-song`, Song mock, or public `pageData.js` reference remains.

### My Review and Decisions

I used the published Song endpoints as both the data source and access boundary. Public pages should not fetch a creator record and then decide in React whether it is safe to show. The backend's published-only query is the authoritative protection.

I preserved honest partial experiences. Trivia and instrument associations do not yet have complete public integrations, so displaying the selected published Song plus an unavailable message is safer than keeping convincing fake questions or instruments.

I removed the rhythm demo fallback even though it made the game easier to demonstrate. Silently replacing a selected published Song with unrelated demo media breaks the source-of-truth guarantee and misrepresents what the creator published.

I retained Learning Hub's non-Song cultural content because it is educational editorial material, not an alternative Song database. Song-led entry points in that page now come exclusively from the backend.

### Final Outcome

Published Songs now power public discovery and all named Song entry flows. A creator publishes one Song record, and that record's ID, cover, title, artist, description, language, theme, and media move consistently through Library, Explore, Experience, Learning, Trivia, Playground, and Rhythm routes.

Unpublished Songs remain inaccessible. Missing optional content is described as unavailable, and no public page relies on sample Song records, demo IDs, mock Song arrays, or creator placeholder data.

### Remaining Work

- Real trivia-question retrieval and scoring remain unimplemented.
- Song-linked instrument retrieval and interactive playground controls remain unimplemented.
- Real beatmaps must be generated or uploaded for published Song IDs before rhythm gameplay is available.
- Rhythm score persistence and authentication integration are deferred to Phase 6.
- Reflection Song validation and submission integration are deferred to Phase 6.
- Song Experience can later add instruments, subtitles, and richer video controls when real data sources exist.
- Public filter option facets currently derive from the returned result set rather than a separate facet endpoint.

### Lesson

A public route parameter is not proof that content is public. Every page must resolve that ID through a backend query that enforces publication status. Once this rule is consistent, draft isolation, navigation, metadata, and downstream activity context all become simpler.

Unavailable states are part of a trustworthy integration. They clearly distinguish real published metadata from features whose supporting content has not yet been created.

---

## Phase 6 — Published Rhythm Songs and Secure Score Persistence

### Date

11 July 2026

### User Request

Phase 6 connected Rhythm Hub and Rhythm Game to playable published Songs and established score-persistence rules for guests, registered players, and creators. Guests could play and view their current result but could not create GameScore rows. Registered users could persist scores linked to the JWT user and selected published Song. The backend could not trust `userId` or rank supplied by the client.

The phase also required validation and reasonable MVP anti-spoofing protection without extending Reflection integration.

### Audit and Decisions

Rhythm Hub already consumed the published Song list after Phase 5, but it did not distinguish Songs with usable audio and duration. Rhythm Game still depended on static beatmap JSON files even though the demo beatmap had been removed, and playback preferred video rather than the uploaded Song audio.

The score endpoint accepted unauthenticated writes, accepted an optional body `userId`, trusted the submitted rank, did not verify Song publication, and created guest database rows with a null user. The frontend attempted score persistence for every player and queued failures locally.

The implementation chose `REGISTERED` as the only role allowed to persist rhythm scores. Creator accounts may still open and play the public game, but they are treated as session-only players and are not silently recorded as regular users. This keeps creator administration separate from registered-player progress.

### AI Output

Rhythm Hub now filters the published API response to playable Songs with persisted audio and at least five seconds of duration data. Each card uses the uploaded cover image, real title, artist, theme, languages, and database ID. Songs without usable audio configuration do not appear as playable and the page shows an honest empty state when none qualify.

Rhythm Game resolves the route ID through the published Song endpoint before creating a chart. Manually entering a draft, ready, archived, missing, or another unpublished ID therefore fails at the public API boundary and produces no playable configuration.

The selected Song's persisted audio is now a real playback source. When a published Song has video, the existing video background remains usable; otherwise an audio element drives the same playback clock. Cover images remain visible in the selection and result flows rather than being replaced by demo initials where real media exists.

Because the project has no beatmap model or uploaded chart format yet, Phase 6 introduced a deterministic procedural chart derived from the published Song's stored duration and selected difficulty. Easy, Medium, and Hard use different note spacing while keeping the same four gameplay lanes. If duration is missing or too short, the game reports that the Song lacks usable rhythm configuration instead of loading mock notes.

The guest result remains stored for the current browser session through the existing result mechanism and is passed to the Results route. Rhythm Game no longer calls the score API for guests, so guest play cannot create a GameScore row. Local storage remains convenience state only.

For authenticated accounts, the frontend calls score persistence only when `user.role === REGISTERED` and supplies the existing authentication token. Creator sessions play locally and skip persistence. If an authenticated registered save fails, the existing pending local queue remains available as a convenience, but it is not treated as a database score.

The backend score endpoint now uses optional authentication while distinguishing a genuine guest request from a supplied invalid token. A missing token is a guest and receives HTTP 204 after validation with no row created. An invalid supplied token receives HTTP 401. A creator token receives HTTP 403 for score storage.

For registered persistence, the backend loads the current User from the verified token and always sets `userId` from that record. Any body `userId` is ignored. The backend also derives rank from accuracy, so a client cannot submit an inflated `S` rank for an `A`-level result.

The backend validates:

- Song ID format;
- Song existence;
- `status = PUBLISHED`;
- Easy, Medium, or Hard difficulty;
- non-negative integer score;
- accuracy from 0 through 100;
- total notes from 1 through 10,000;
- max combo from zero through total notes;
- score below the theoretical maximum possible for the submitted chart size.

The theoretical limit follows the current scoring algorithm: maximum base points for every note plus the maximum possible incremental combo bonus. This does not provide server-authoritative replay verification, but it blocks malformed values and obvious score inflation within the MVP architecture.

### Backend Behavior

`POST /api/scores` now behaves as follows:

- Valid guest result: HTTP 204, no GameScore.
- Invalid supplied token: HTTP 401, no GameScore.
- Creator token: HTTP 403, no GameScore.
- Registered token and valid published Song result: HTTP 201 with a persisted GameScore.
- Draft or unpublished Song: HTTP 404, no GameScore.
- Invalid score fields or impossible score: HTTP 400, no GameScore.

Persisted rows always use the JWT-derived `user_id`, validated published `song_id`, normalized difficulty, and server-derived rank.

### Files Modified

- `backend/routes/scores.js`
- `backend/tests/scores.test.js`
- `frontend/src/App.test.jsx`
- `frontend/src/components/RhythmGame.jsx`
- `frontend/src/game/beatmapLoader.js`
- `frontend/src/game/scoresApi.js`
- `frontend/src/game/songDetailsApi.js`
- `frontend/src/pages/RhythmHub.jsx`
- `frontend/src/pages/RhythmResults.jsx`
- `Creator_workflow.md`

No model or database migration was required. Existing User, Song, and GameScore models were reused.

Reflection submission logic was not changed.

### Tests Added

Backend score tests prove that:

- valid guest gameplay returns no persisted score;
- the GameScore table remains empty after guest submission;
- an authenticated registered result is saved;
- the stored `userId` matches the JWT account;
- a body `userId` for another user is ignored;
- submitted rank is ignored and derived from accuracy;
- creator authentication is not treated as registered-player authentication;
- draft Song score submission is rejected;
- negative scores are rejected;
- accuracy above 100 is rejected;
- invalid difficulty is rejected;
- zero or excessive chart sizes are rejected;
- combo larger than total notes is rejected;
- score above the theoretical chart maximum is rejected.

Frontend coverage proves that Rhythm Hub:

- lists a playable published Song;
- uses its uploaded cover image;
- routes Play Song with the real database ID;
- excludes a published Song that lacks audio and duration configuration.

### Verification Performed

- Complete backend Jest suite: four suites and thirty-eight tests passed.
- Complete frontend Vitest suite: two files and fifteen tests passed.
- Full backend ESLint passed.
- Full frontend ESLint passed.
- Frontend production build passed with 1,880 modules transformed.

### My Review and Decisions

I did not persist guest rows with a null user. Such rows cannot represent registered progress, cannot be safely attributed later, and would inflate analytics. Guest results belong to the current session unless the user authenticates before a future play.

I intentionally rejected creator score persistence. Creator accounts can experience the public game, but storing their runs as ordinary player progress would blur the project's role boundary and could distort future leaderboards.

I derived rank and user identity on the server because both values are consequences of trusted state: rank follows validated accuracy, and identity follows the signed token. Client-provided values are only claims.

I used a duration-derived procedural chart as a temporary real-Song configuration. It is reproducible and tied to the published Song's media rather than a demo file, while leaving room for a future beatmap model with authored timing data.

### Final Outcome

Rhythm Hub now presents only playable published Songs with real covers and IDs. Rhythm Game validates the selected Song through the published API, plays its uploaded audio or video, and builds difficulty-specific gameplay from its real duration.

Guests and creators can play and view session results without database writes. Registered users persist scores linked to the JWT user and published Song. Obvious malformed and impossible submissions are rejected, client identity and rank are not trusted, and manually entered unpublished IDs cannot be played or scored.

### Remaining Work

- Procedural notes are not musically beat-aligned; a real beatmap model or analysis pipeline is still needed.
- The server cannot verify every individual hit without receiving and validating a signed replay or server-issued game session.
- Pending local registered-score retries are not automatically synchronized after reconnect.
- Leaderboards and score-history retrieval are not implemented.
- Audio replacement cleanup remains separate from rhythm behavior.
- Reflection Song validation and submission integration remain outside this phase.

### Lesson

Authentication answers who may persist, not who may play. Keeping public gameplay open while restricting database writes produces a welcoming guest experience without contaminating registered progress data.

MVP anti-cheat should protect the server's authoritative facts first: user identity, Song publication, allowed difficulty, derived rank, and feasible numeric bounds. Stronger competitive integrity requires a different architecture with issued sessions and replay verification.

---

## Phase 7 — Published-Song Reflection Wall and Moderated Identity

### Objective

Phase 7 connected the Reflection Wall to the published Song API and enforced the identity, ownership, and moderation boundaries for guests, registered users, and creators.

Every reflection must now reference a real `PUBLISHED` Song. Reflections linked to missing or unpublished Songs cannot be submitted or exposed through the public Reflection Wall.

### Reflection Submission Flow

Reflection Wall loads its Song choices from the public published-Songs endpoint. It no longer relies on hardcoded Song names, `pageData.js`, `demo-song`, or mock Song arrays.

When Reflection Wall is opened from Song Experience, the real Song ID is carried in the route:

`/reflections?song_id=<song-id>`

The requested Song is preselected only when it exists in the published Song response. An invalid, unknown, or unpublished query Song produces a safe unavailable state instead of silently selecting mock content.

The backend validates the Song ID format, confirms that the Song exists, and requires `status = PUBLISHED`. Missing IDs, unknown Songs, and Songs in `DRAFT`, `GENERATING`, `READY`, or `ARCHIVED` are rejected.

Reflection text remains required and subject to the existing length and content-safety rules. Anonymous mode, optional display names, and supported tags are validated rather than trusted directly from the client.

### Corrected Moderation Rule

All new reflections now start with `PENDING`, regardless of whether the author is:

- a guest;
- a logged-in registered user posting with their account identity; or
- a logged-in registered user posting anonymously.

No public client can submit an approved status or self-approve a reflection. Body-supplied moderation status is ignored. A submitted reflection becomes publicly visible only after an authorized creator approves it.

The frontend confirms successful submission with a moderation message and does not insert a pending reflection into the public approved-only list.

### Guest Behavior

Guests may submit reflections anonymously. A guest cannot establish ownership or spoof a registered identity by sending `userId`, `user_id`, trusted author fields, or moderation status in the request body.

Guest display names, when supported by the existing interface, are treated as untrusted input and validated and sanitized. No insecure guest edit or delete ownership mechanism was introduced.

### Registered-User Behavior

Registered users may post using their account identity or choose anonymous display.

The backend derives the account from the verified JWT and loads the approved display identity from the existing User record. It ignores body-supplied user IDs and trusted author names.

Named submissions retain the authenticated account association and use the account display identity. Anonymous registered submissions retain their private ownership association for authorization while hiding that identity from public output.

Registered owners may edit or delete their own reflections where the existing workflow permits it. Another registered user cannot edit or delete a reflection they do not own.

### Public Display and Moderation

Public reflection queries now return only reflections that are:

- `APPROVED`;
- not deleted; and
- joined to a Song whose current status is `PUBLISHED`.

This means that archiving or unpublishing a Song also removes its reflections from public results without destroying the reflection records.

The moderation lifecycle supports `PENDING`, `APPROVED`, `FLAGGED`, and `REJECTED`. Creator moderation routes remain protected by the existing creator authentication and authorization middleware. Non-creators cannot approve, reject, flag, or perform creator-only deletion.

### Backend Routes Changed

The existing reflection routes were repaired rather than replaced:

- reflection creation now requires a valid published Song and always stores `PENDING`;
- public reflection listing joins against published Songs and excludes pending, rejected, flagged, deleted, and unpublished-Song records;
- Song-filtered public queries safely validate the requested Song;
- registered identity is derived from JWT authentication;
- creator moderation supports explicit rejection while preserving approve, flag, and delete behavior;
- invalid supplied authentication tokens are rejected instead of being treated as guest requests.

### Frontend Changes

- Reflection Wall fetches published Song choices from the backend.
- A valid `song_id` query parameter preselects its published Song.
- Invalid or unavailable Song context is shown safely.
- Guest and registered submission flows preserve their intended identity choices.
- Successful submissions clearly state that moderation is required.
- Pending submissions are not optimistically displayed as public approved reflections.
- Song Experience links to Reflection Wall with the real Song ID.
- Creator moderation views include the rejected state and reject action.
- Loading, empty, error, and submission-success states remain integrated with the existing design.

### Database Changes

A safe migration was added to extend the reflection status constraint with `REJECTED` and add an index supporting Song/status/date reflection queries:

- `backend/migrations/006_reflection_published_song_and_rejection.sql`

The initial schema was also updated so a newly reset development database receives the same valid status set. No destructive synchronization or `force: true` behavior was introduced.

### Files Modified

- `backend/migrations/001_initial_schema.sql`
- `backend/migrations/006_reflection_published_song_and_rejection.sql`
- `backend/models/Reflection.js`
- `backend/routes/reflections.js`
- `backend/tests/reflections.test.js`
- `frontend/src/App.test.jsx`
- `frontend/src/pages/ReflectionWall.jsx`
- `frontend/src/pages/SongExperience.jsx`
- `frontend/src/services/reflectionService.js`
- existing creator reflection-moderation components and pages for rejected-state support
- `Creator_workflow.md`

### Tests Added and Updated

Backend tests prove that:

- guest anonymous submission succeeds and starts `PENDING`;
- a guest cannot spoof `userId`;
- a registered named submission uses JWT identity and starts `PENDING`;
- a registered anonymous submission hides public identity and starts `PENDING`;
- unpublished and unknown Song submissions are rejected;
- public listing excludes reflections belonging to unpublished Songs;
- public listing excludes pending, rejected, deleted, and otherwise unapproved reflections;
- another user cannot edit or delete an owner's reflection;
- an owner can edit or delete where allowed;
- creator moderation is authorized;
- non-creator moderation is rejected.

Frontend coverage verifies that Song Experience preserves the real Song ID in the Reflection Wall deep link.

### Verification Performed

- Complete backend Jest suite: four suites and forty-four tests passed.
- Complete frontend Vitest suite: two files and sixteen tests passed.
- Targeted backend ESLint passed.
- Targeted frontend ESLint passed.

### Manual Testing

1. Apply migration `006_reflection_published_song_and_rejection.sql` to an existing database. A freshly reset database using the initial schema already includes the updated status constraint.
2. Publish one Song and leave another Song in `DRAFT` or `READY`.
3. Open the published Song Experience and choose the Reflection action. Confirm that Reflection Wall opens with the real Song selected.
4. Submit as a guest. Confirm the success message says the reflection is awaiting moderation and that it does not appear publicly yet.
5. Submit both a named and anonymous reflection as a registered user. Confirm both remain pending and neither appears publicly.
6. Sign in as a creator and approve one pending reflection. Confirm it now appears on the public wall.
7. Reject or flag another reflection and confirm it remains absent publicly.
8. Unpublish or archive the Song and confirm its previously approved reflections disappear from public queries.
9. Try another user's edit/delete route and confirm it is rejected.
10. Manually open Reflection Wall with an invalid or unpublished `song_id` and confirm the safe unavailable state.

### Final Outcome

Reflection Wall is now part of the same published-Song source of truth as the other public experiences. Song selection and deep-linking use real database IDs, public queries cannot leak unpublished-Song content, and identity comes from authentication rather than client claims.

Most importantly, every reflection now enters the same moderation queue in `PENDING`. Guests and registered users receive consistent treatment, and only an authorized creator moderation action can make a reflection publicly visible.

### Remaining Work

- Apply migration 006 in any existing environment that predates this phase.
- Guest reflections intentionally have no invented edit/delete ownership mechanism.
- Anonymous registered reflections still retain a private user association for secure ownership checks; public responses must continue hiding that identity.
- Broader final cleanup and end-to-end deployment verification remain outside Phase 7.

### Lesson

Authentication and moderation answer different questions. Authentication establishes private ownership, while moderation determines whether content is suitable for public display. Requiring every submission to begin as `PENDING` keeps that boundary consistent for guests and registered users alike.

---

## Phase 8 — Final Integration QA, Cleanup, and Deployment Readiness

### Scope and outcome

Phase 8 audited the integrated creator, public, guest, registered-user, and creator-moderation workflows without adding unrelated features. The existing automated integration coverage remained green, production mock data was removed from the remaining analytics page, deployment configuration was hardened, and the project documentation was aligned with the implemented system.

The final reflection policy is explicit: guest, registered named, and registered anonymous submissions all start `PENDING` and require creator moderation.

### Fixes made

- Removed fabricated totals, weekly values, top-Song data, and completion rate from Total Plays. The page now honestly reports that a persisted play-event analytics source is unavailable.
- Removed automatic creator seeding from backend startup. `npm run seed:creator` is now the only creator seed flow and never creates demo content.
- Removed the insecure production token-secret fallback. Production requires `AUTH_TOKEN_SECRET` or `JWT_SECRET`; the fallback remains development/test-only.
- Added a test proving production token creation fails closed without a configured secret.
- Changed clean PostgreSQL schema creation so `songs.creator_id` is non-null and uses a restrictive user foreign key.
- Preserved the safe current-database policy: migration 004 does not force NOT NULL while unknown legacy orphan rows may exist.
- Quarantined legacy ownerless Songs from public Song listing/detail, Rhythm score submission, Reflection submission, and public Reflection joins.
- Updated root/backend/frontend environment examples and deployment documentation.
- Kept `sequelize.sync()` non-destructive; no `force: true` production behavior was introduced.

### Database and migration review

Static review confirms migrations 001–006 are ordered so the initial legacy-compatible schema is progressively upgraded to the final Song, generation, and reflection lifecycles. Migrations 004–006 use additive columns, controlled constraint replacement, data-preserving status conversion, and `IF NOT EXISTS` indexes.

Required indexes are present in migration SQL:

- `songs_creator_status_updated_at_idx`;
- `songs_public_published_date_idx`;
- `generation_jobs_one_active_per_song_idx`;
- `reflections_song_status_created_at_idx`.

Legacy `songs.language` and `songs.lyrics` remain intentionally. Migration 004 copies them into `languages` and `raw_lyrics`; current application writes use the new fields. `play_minutes` and `missing_fields` are not persisted columns; publish readiness is derived at request time.

No PostgreSQL `DATABASE_URL` was available in this workspace, so a real clean Supabase/PostgreSQL execution of migrations 001–006 could not be performed. This remains a deployment checklist item and is not claimed as executed.

The local SQLite integrity audit found no orphan generation jobs, scene segments, generated frames, reflections, or GameScores. It did find two legacy published Songs with null creator ownership: `bye` and `hi`. They were not deleted because Phase 8 did not authorize destructive data cleanup. Backend public filters now quarantine them; they should be manually reviewed and assigned or deleted before enforcing NOT NULL on that existing database.

### Mock and placeholder audit

No normal production code references `pageData`, `sampleSongs`, `songData`, `mockSongs`, `demo-song`, `Song #1`, `Song #2`, dummy metadata, fake weekly charts, or direct localhost API URLs.

The only production-code search result is the opt-in `seed:mock` package command and its development script. It is not called by startup or required by any application route. `seed:creator` creates only one creator and no Song, job, reflection, score, segment, frame, or demo record.

Intentional placeholders:

- `PLACEHOLDER_VIDEO_URL` remains an environment-controlled temporary MP4 path and API responses label its use temporary.
- `frontend/public/videos/placeholder-generation.mp4` may host that temporary asset on Vercel.
- The older `exploding-kittens-placeholder.mp4` is not referenced by production React code.
- Rhythm charts remain procedural and duration-derived.
- Missing trivia, instrument, lesson, or beatmap content displays an honest unavailable state.

### Security and configuration audit

- Frontend API requests use the shared `API_URL` based on `VITE_API_URL`.
- Backend CORS uses `FRONTEND_URL`, with localhost retained for local development.
- Production authentication has no default signing secret.
- Creator routes use existing creator authentication and ownership lookup.
- Score and reflection identity comes from JWT, not body-supplied user IDs.
- Public Song endpoints require both published status and valid creator ownership.
- Production 500 responses return `Internal server error` without stack traces.
- Audio uploads allow MP3/WAV up to 50 MB; cover uploads allow JPG/PNG/WebP up to 10 MB.
- Environment examples contain replacement values only; repository search found no committed real Cloudinary secret or creator seed password.

### Exact automated verification

- `npm run test --prefix backend`: 4 suites passed, 45 tests passed.
- `npm run test --prefix frontend`: 2 files passed, 16 tests passed.
- `npm test`: exit 0; backend 4/4 suites and 45/45 tests, frontend 2/2 files and 16/16 tests.
- `npm run lint`: exit 0; root backend ESLint and frontend ESLint passed with no reported errors.
- `npm run build --prefix frontend`: exit 0; Vite 8.0.14 transformed 1,880 modules and completed the production build.
- `git diff --check`: exit 0; only Git line-ending conversion warnings were reported.

### Documentation updated

- `README.md` now documents lifecycle rules, creator/public/score/reflection behavior, migration order, local setup, environment variables, Render/Vercel/Supabase/Cloudinary deployment, and known limitations.
- `Project Details/HIGH_LEVEL_DESIGN.md` now begins with an authoritative integration note correcting its historical lifecycle and publication descriptions.
- `.env.example`, `backend/.env.example`, and `frontend/.env.example` now clarify local and deployed API, CORS, secret, and temporary video settings.
- `Creator_workflow.md` contains this Phase 8 QA record.

### Manual production QA checklist

1. Apply migrations 001–006 to a clean temporary PostgreSQL database and inspect the four required indexes.
2. Seed one creator with `npm run seed:creator`, rerun it, and confirm the existing account is unchanged.
3. Complete Studio draft persistence, cover replacement, audio/YouTube ingestion, lyric extraction/editing, same-ID generation, READY completion, explicit publish, unpublish, republish, archive, and non-generating delete.
4. Compare Song row count before and after generation to confirm no duplicate.
5. Verify a second creator cannot read, edit, generate, publish, archive, or delete the first creator's Song.
6. Verify landing/library/search/filter/Song Experience show only published Songs and preserve the UUID into learning, trivia, playground, rhythm, and reflection routes.
7. Play as guest and confirm no GameScore row; play as registered and confirm JWT ownership and validation.
8. Submit guest, registered named, and registered anonymous reflections and confirm all remain pending.
9. Approve, flag, reject, and delete as creator; verify moderator notes persist and non-creators are denied.
10. Unpublish/archive an approved reflection's Song and confirm the reflection disappears publicly.
11. Verify deployed Vercel media, Render CORS, Cloudinary upload/replacement/cleanup, and production error responses.

### Files changed in Phase 8

- `.env.example`
- `README.md`
- `Project Details/HIGH_LEVEL_DESIGN.md`
- `Creator_workflow.md`
- `backend/.env.example`
- `backend/controllers/songController.js`
- `backend/migrations/001_initial_schema.sql`
- `backend/routes/reflections.js`
- `backend/routes/scores.js`
- `backend/server.js`
- `backend/services/authService.js`
- `backend/tests/health.test.js`
- `frontend/.env.example`
- `frontend/src/pages/TotalPlays.jsx`

### Known limitations and unresolved items

- Clean PostgreSQL migration execution and live Render/Vercel/Supabase/Cloudinary end-to-end testing require deployed credentials and services and were not available locally.
- The two legacy null-owner SQLite Songs require an explicit data decision; they are quarantined but not deleted.
- The final AI MP4 pipeline, authored beatmaps, complete play analytics, and real Song-specific trivia/instrument/lesson content remain incomplete.
- `seed:mock` and the older unused placeholder MP4 remain development/history assets only and are not part of normal flow.

### Lesson

Deployment readiness is not just a green build. It requires fail-closed production secrets, explicit seed behavior, honest unavailable states, ownership at both write and read boundaries, and documentation that distinguishes verified local behavior from checks that still require real infrastructure.
