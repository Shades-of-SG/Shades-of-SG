# Multi-creator data-isolation audit

Date: 2026-07-29  
Baseline: repository state before the multi-creator implementation  
Database safety rule: no existing database was reset, dropped, truncated, reseeded, or recreated during this work. Production changes are forward-only numbered PostgreSQL migrations.

## Scope and ownership invariant

The audit covered all existing SQL migrations (`001`–`010`), Sequelize models and associations, Express middleware, mounted routes, controllers, database-using services, backend tests, React routing, role gates, and frontend API calls.

The canonical invariant is:

```text
creator -> songs.creator_id -> every song-owned resource
```

For a creator request, song-owned resources must be resolved with an ownership predicate in the database query. Nested ownership paths are:

```text
generation_jobs.song_id -> songs.creator_id
scene_segments.song_id -> songs.creator_id
generated_frames.scene_segment_id -> scene_segments.song_id -> songs.creator_id
lessons.song_id -> songs.creator_id
trivia_questions.song_id -> songs.creator_id
trivia_attempts.question_id -> trivia_questions.song_id -> songs.creator_id
game_scores.song_id -> songs.creator_id
reflections.song_id -> songs.creator_id
rhythm_beatmaps.song_id -> songs.creator_id
song_instruments.song_id -> songs.creator_id
song_folders.song_id -> songs.creator_id (new)
```

Public access is limited to resources attached to a `PUBLISHED` song. Registered users may manage only their own user-owned rows. Admins receive explicit admin-only platform access; creator access is never inferred from a client-supplied identifier.

## 1. Table-by-table ownership audit

| Table | Ownership class and path | Baseline enforcement | Finding / required control |
|---|---|---|---|
| `users` | Account-owned (`users.id`); platform-managed role/status | Login/profile use authenticated token id; role check exists only for creator | Add `ADMIN`; load the current DB user in auth middleware; never accept role/user id from clients; admin-only account/creator management. |
| `sessions` | User-owned through `sessions.user_id`; guest session otherwise | Model/association only; no routes | No exposed IDOR. Any future route must use authenticated user id, never a supplied user id. |
| `songs` | Creator-owned directly by `songs.creator_id` | Creator song CRUD correctly uses `creatorId = req.authUserRecord.id`; public reads require `PUBLISHED` | Keep as ownership root. Model incorrectly allows null although migration 001 is not-null. Align model with schema. Ignore client `creatorId`. |
| `instruments` | Platform/global catalogue | Model/association only; no CRUD routes | Future mutations must be admin-only. Creator reads may be global. |
| `song_instruments` | Song-owned through `song_id -> songs.creator_id` | No routes | Future attach/detach must first resolve an owned song; instrument id must reference a platform record. |
| `lessons` | Song-owned through `lessons.song_id -> songs.creator_id` | No routes | Future creator CRUD must join/resolve owned song. Public reads require published parent song. |
| `game_scores` | Player-owned for personal history; song-scoped for creator analytics | `/scores/mine` uses authenticated user; score submission validates published song and ignores client user id | Creator analytics must aggregate only scores whose song belongs to the creator. Admin analytics may aggregate globally. |
| `reflections` | Submission-owned by `user_id`; creator moderation-owned through `song_id -> songs.creator_id` | Public/mine paths are constrained; creator moderation list/stats/action and creator delete are global | Critical vulnerability. Add owned-song join to moderation list and stats, ownership-aware lookup for action/delete, and admin-specific global access. |
| `badges` | User-owned through `badges.user_id` | Authenticated route requires path id equal current registered user id | Secure but path user id is unnecessary. Retain equality check or add `/mine`. Admin management must be explicit. |
| `trivia_questions` | Song-owned through `song_id -> songs.creator_id` | No routes | Future creator CRUD must resolve owned song. Public questions require published parent; correct answers must not leak before scoring. |
| `trivia_attempts` | Player-owned by `user_id`; creator analytics scoped through question -> song | No routes | Never accept user id as authority. Personal history by auth id; creator aggregation through owned songs; admin global only. |
| `generation_jobs` | Song-owned through `song_id -> songs.creator_id` | List/status/start/export/delete join or resolve an owned song | Mostly secure. Keep nested DB joins. Background services must validate job/song pairing. Delete currently also deletes the song, which is surprising and should be removed. |
| `scene_segments` | Song-owned through `scene_segments.song_id -> songs.creator_id` | Returned nested under ownership-checked job status; internal generation uses song id | No direct routes. Service calls should assert the job belongs to the same song to prevent confused-deputy mistakes. |
| `generated_frames` | Song-owned through frame -> scene segment -> song | Nested job status is safe; frame regeneration fetches globally by frame id | Critical IDOR. Regeneration must include `sceneSegment.song` with creator ownership (or explicit admin permission) before calling external services or updating. |
| `rhythm_beatmaps` | Song-owned through `song_id -> songs.creator_id` | Creator preview/mutations resolve owned song; public reads require published song | Secure. List endpoint hides drafts from non-owner but currently fetches all rows before serializing; query only published rows for non-owner as defense in depth. |
| `creator_applications` (new) | Applicant-owned by `user_id`; platform-reviewed | Not present | Registered applicant can submit/read own application. Admin can list and transition valid stages. Approval promotes exactly the linked user in one transaction. |
| `folders` (new) | Platform-managed; proposal provenance via `proposed_by` | Not present | Approved folders publicly/creator readable. Admin creates platform folders and approves/rejects proposals. Creators can only manage their own pending proposals. |
| `song_folders` (new) | Song-owned through `song_id -> songs.creator_id` | Implemented | Only admins create/remove published placements. Creators submit placement proposals after resolving their owned song. Composite uniqueness prevents duplicates; `song_order` controls collection order. |
| `user_warnings` (new) | Target-user history; admin-issued | Not present | Admin-only create/list/resolve. Target user id must resolve server-side. |
| `moderation_actions` (new) | Immutable platform history; actor and target recorded | Not present | Creator actions only against reflections on owned songs; admin actions global. Do not allow client-supplied actor id. |
| `audit_logs` (new) | Immutable security/audit history | Not present | Actor comes from auth context; creator id/song id are derived from the resolved object; admin-only global reads and creator-only own reads if exposed. |

Schema drift found during the table audit:

- `Song.creatorId` is nullable in Sequelize but `songs.creator_id` is not nullable in migration 001.
- `songs.transcription_segments` is used by the model but has no numbered migration; startup currently adds it dynamically.
- The server runs `sequelize.sync()` and several schema-mutating `ensure*Schema` helpers on startup. Production schema mutation must move to numbered migrations.
- `regenerateFrame` assigns `segment.imageUrl`, but `scene_segments` has no `image_url` column/model attribute. The source of truth is the generated frame; the stray assignment should be removed.

## 2. Route-by-route access-control audit

Legend: **Public** means deliberately accessible without login; **Self** means authenticated account id; **Owned song** means the query enforces `songs.creator_id = authenticated user`; **Admin** means new admin-only middleware.

| Method and route | Intended access | Baseline result | Required change |
|---|---|---|---|
| `GET /api` | Public | Safe health/banner response | None. |
| `GET /api/health` | Public | Safe | None. |
| `POST /api/auth/register` | Guest | Creates `REGISTERED`; ignores role input | Keep; log registration if desired. |
| `POST /api/auth/login` | Guest | Safe password verification; also invokes creator seeding | Remove login-time role mutation/seeding; bootstrap should be separate operational setup. |
| `PUT /api/auth/profile` | Self | Uses token id and checks email uniqueness | Keep; audit profile changes. |
| `GET /api/songs` | Public | Published songs only | Safe. |
| `GET /api/songs/demo-song` | Public | Static demo | Safe, though route ordering should remain before `/:id`. |
| `GET /api/songs/:id` | Public | Published song only | Safe. |
| `GET /api/songs/creator` | Creator | Owned song predicate | Safe. |
| `GET /api/songs/creator/dashboard/summary` | Creator | Owned song/job predicates | Safe; extend with owned analytics only. |
| `GET /api/songs/creator/:id` | Creator | Owned song predicate | Safe. |
| `POST /api/songs/extract-audio` | Creator | Creator role only; URL supplied by client | No cross-creator row access. Retain URL validation/SSRF controls as a separate concern. |
| `POST /api/songs` | Creator | Server sets creator id | Safe; add audit log. |
| `PUT /api/songs/:id/metadata` | Owned song | Owned song predicate | Safe; add audit log. |
| `POST /api/songs/:id/audio` | Owned song | Owned song predicate | Safe; add audit log. |
| `POST /api/songs/:id/video` | Owned song | Owned song predicate | Safe; add audit log. |
| `POST /api/songs/:id/cover` | Owned song | Owned song predicate | Safe; add audit log. |
| `GET /api/songs/:id/readiness` | Owned song | Owned song predicate | Safe. |
| `PUT /api/songs/:id/publish` | Owned song | Owned song predicate | Safe; add audit log. |
| `PUT /api/songs/:id/unpublish` | Owned song | Owned song predicate | Safe; add audit log. |
| `PUT /api/songs/:id/archive` | Owned song | Owned song predicate | Safe; add audit log. |
| `PUT /api/songs/:id/unarchive` | Owned song | Owned song predicate | Safe; add audit log. |
| `DELETE /api/songs/:id` | Owned song | Owned song predicate | Safe isolation; add audit log before delete. |
| `GET /api/songs/:songId/beatmaps` | Public published / creator owner | Access helper distinguishes owner/public | Query only published rows for non-owner. |
| `GET /api/songs/:songId/beatmaps/:difficulty` | Public | Published parent and beatmap | Safe. |
| `GET /api/songs/:songId/beatmaps/:difficulty/preview` | Owned song | Owner-required helper | Safe. |
| `POST /api/songs/:songId/beatmaps/generate` | Owned song | Owned parent resolution | Safe. |
| `POST /api/songs/:songId/beatmaps/generate-all` | Owned song | Owned parent resolution | Safe. |
| `PUT /api/songs/:songId/beatmaps/:difficulty/settings` | Owned song | Owned parent resolution | Safe. |
| `PUT /api/songs/:songId/beatmaps/:difficulty/publish` | Owned song | Owned parent resolution | Safe. |
| `PUT /api/songs/:songId/beatmaps/:difficulty/unpublish` | Owned song | Owned parent resolution | Safe. |
| `DELETE /api/songs/:songId/beatmaps/:difficulty/draft` | Owned song | Owned parent resolution | Safe. |
| `GET /api/generation` | Creator | Join to owned song | Safe. |
| `GET /api/generation/:id/status` | Creator | Join to owned song; nested scenes/frames | Safe. |
| `POST /api/generation/start` | Owned song | Resolves body song id with creator predicate | Safe. |
| `POST /api/generation/:jobId/export` | Owned song/job | Join to owned song | Safe. |
| `DELETE /api/generation/:id` | Owned song/job | Join to owned song | Isolation is safe; stop cascading deletion of the parent song. |
| `POST /api/generation/frame/:frameId/regenerate` | Owned frame | Global frame lookup only | **Vulnerable:** add frame -> segment -> owned song join before any generation/update. |
| `GET /api/transcriptions/status` | Public | Configuration capability response | No ownership issue; avoid exposing secrets (currently none). |
| `POST /api/transcriptions/lyrics` | Creator / owned song when song id used | Saved-media branch checks ownership; direct media branch has no row access | Safe for data isolation. Never use a supplied song id without owned lookup. |
| `GET /api/reflections` | Public | Approved reflections on published songs | Safe. |
| `POST /api/reflections` | Guest/account | Validates published song; server derives user id | Safe. |
| `GET /api/reflections/mine` | Self | Uses token id | Safe. |
| `PUT /api/reflections/:id` | Self | Requires reflection user id match; validates destination published song | Safe. |
| `DELETE /api/reflections/:id` | Self or owning creator/admin | Any creator may delete any reflection | **Vulnerable:** creator must own the reflection's song; admin may be global. |
| `GET /api/reflections/moderation` | Creator-owned / admin global | Global list and global stats | **Critical:** join owned songs for creator; scope every stats count through same ownership. |
| `PUT /api/reflections/:id/moderation` | Owning creator / admin | Global reflection lookup | **Critical:** ownership-aware lookup; append immutable moderation-action/audit history. |
| `GET /api/scores/mine` | Self registered user | Uses token id | Safe. |
| `POST /api/scores` | Guest play / registered self save | Published song/beatmap checks; user id derived from auth | Safe. |
| `GET /api/badges/:userId` | Self registered user | Explicit path-id equality | Safe. |
| `GET /api/stats` | Admin | Public platform-wide aggregates | **Vulnerable to policy:** protect with admin middleware and replace landing-page use. |
| `GET /api/creator-applications/mine` (new) | Self | Not present | Derive applicant from auth. |
| `POST /api/creator-applications` (new) | Registered self | Not present | Validate URLs/text; derive user id; prevent duplicate active application. |
| `GET /api/admin/creator-applications` (new) | Admin | Not present | Admin-only list/filter. |
| `PATCH /api/admin/creator-applications/:id/status` (new) | Admin | Not present | Validate stage transition; on approval promote linked user transactionally. |
| `GET /api/admin/creators` (new) | Admin | Not present | Admin-only creator summary. |
| `GET /api/folders` (new) | Public/creator | Not present | Return approved folders only. |
| `GET /api/folders/proposals/mine` (new) | Creator | Not present | Filter by authenticated proposer. |
| `POST /api/folders/proposals` (new) | Creator | Not present | Derive proposer; force pending proposal state. |
| `POST /api/folders/placements` | Creator-owned song | Implemented | Resolves `song_id` with the authenticated creator and creates a review proposal; it never publishes the placement directly. |
| `DELETE /api/songs/:songId/folders/:folderId` (new) | Owned song | Not present | Delete by both ids only after owned-song resolution. |
| `GET /api/admin/folders` (new) | Admin | Not present | Admin-only all statuses. |
| `POST /api/admin/folders` (new) | Admin | Not present | Server records admin actor and approved platform origin. |
| `PATCH /api/admin/folders/:id` (new) | Admin | Not present | Validate approval/rejection/update. |
| `GET /api/analytics/creator` (new) | Creator | Not present | All aggregates join/filter owned songs. |
| `GET /api/admin/analytics` (new) | Admin | Not present | Admin-only platform aggregates. |
| `GET/POST/PATCH /api/admin/warnings...` (new) | Admin | Not present | Admin actor derived from auth; immutable history plus resolution metadata. |
| `GET /api/admin/moderation-actions` (new) | Admin | Not present | Admin-only history. |
| `GET /api/admin/audit-logs` (new) | Admin | Not present | Admin-only paginated history. |

## 3. Vulnerable endpoints and high-priority findings

1. **Critical — cross-creator reflection read:** `GET /api/reflections/moderation` returns every creator's moderation queue and computes global moderation statistics.
2. **Critical — cross-creator reflection moderation:** `PUT /api/reflections/:id/moderation` retrieves by global reflection id and lets any creator alter status/note.
3. **Critical — cross-creator reflection deletion:** `DELETE /api/reflections/:id` treats the `CREATOR` role as global delete authority.
4. **Critical — cross-creator generated-frame mutation:** `POST /api/generation/frame/:frameId/regenerate` retrieves a frame globally and mutates it after invoking paid external services.
5. **High — platform analytics exposed publicly:** `GET /api/stats` returns global platform counts without admin authentication.
6. **High — uncontrolled schema mutation:** application startup uses `sequelize.sync()` and ad-hoc schema repair helpers. This bypasses the required reviewed migration sequence.
7. **Medium — background job/song pairing is implicit:** generation services independently fetch job and caller-supplied song ids. They should assert `job.song_id === song.id` before writes.
8. **Medium — generation-job delete has an unexpected parent cascade:** deleting a completed/failed job also deletes its song. Ownership is checked, but the action is broader than its route semantics.
9. **Medium — creator bootstrap mutates roles during login:** `seedCreatorAccount()` may promote an account to creator on a login request. Creator conversion should occur through explicit admin approval/operational bootstrap, not ordinary authentication.
10. **Low — non-owner beatmap summary over-fetch:** it loads drafts/errors then suppresses them during serialization. Query-level filtering is preferable.

No current endpoints exist for lessons, trivia questions/attempts, instruments, or song-instrument management. Their absence prevents a present IDOR, but any future endpoints must use the ownership paths documented above.

## 4. Proposed forward-only migration sequence

Migrations are additive or constraint/index changes only. They contain no `DROP TABLE`, `TRUNCATE`, reseed, or destructive data rewrite.

1. `011_multi_creator_roles_and_schema_alignment.sql`
   - extend `users.role` check with `ADMIN`;
   - add non-destructive `users.account_status` (`ACTIVE`, `SUSPENDED`);
   - add missing `songs.transcription_segments`;
   - add ownership-path indexes used by authorization queries.
2. `012_creator_applications.sql`
   - create creator applications with applicant/reviewer foreign keys, required stages, timestamps, and indexes;
   - preserve application history while allowing only one active application per applicant.
3. `013_folders_and_song_folders.sql`
   - create folders/proposals with origin and approval state;
   - create song-to-folder many-to-many join with composite primary key and provenance.
4. `014_moderation_audit_and_warnings.sql`
   - create user warnings, immutable moderation-action history, and audit logs;
   - add actor/target/song/creator/time indexes.
5. `015_workflow_completion_and_analytics_events.sql`
   - extend creator applications with drafts, private resumes, applicant feedback, timestamps, and stage history;
   - add folder/song ordering and creator song-placement proposals;
   - add privacy-minimised analytics events and ownership indexes.

Migration execution remains an explicit deployment step in numeric order. The server will authenticate and validate schema availability but will no longer mutate production schema at startup.

## 5. Affected backend and frontend files

### Backend: existing files

- `backend/server.js`
- `backend/middleware/auth.js`
- `backend/services/authService.js`
- `backend/services/schemaService.js` (retired from production startup; tests may retain isolated helper coverage)
- `backend/services/statsService.js`
- `backend/controllers/songController.js`
- `backend/controllers/generationController.js`
- `backend/controllers/beatmapController.js`
- `backend/routes/auth.js`
- `backend/routes/reflections.js`
- `backend/routes/stats.js`
- `backend/models/User.js`
- `backend/models/Song.js`
- `backend/models/index.js`
- ownership tests in `backend/tests/reflections.test.js`, `songLifecycle.test.js`, `beatmaps.test.js`, plus new focused suites.

### Backend: new files

- migrations `011`–`014`
- models: `CreatorApplication`, `Folder`, `SongFolder`, `UserWarning`, `ModerationAction`, `AuditLog`
- middleware/authorization helpers for owned-song and admin access
- audit logging service
- routes/controllers for creator applications, folders, analytics, and admin management
- a multi-principal isolation test suite using two creators, one admin, one registered user, and guest access.

### Frontend: existing files

- `frontend/src/App.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Landing.jsx`
- `frontend/src/components/ProtectedRoute.jsx`
- creator navigation/layout files where creator folders/analytics are linked
- shared API configuration/request handling as needed.

### Frontend: new files

- API services for applications, folders, analytics, and admin operations
- registered-user creator application page
- creator folder-proposal/collection page and creator analytics page
- admin layout/navigation and pages for applications, creators, folders, analytics, warnings/moderation history, and audit logs.

## 6. Test plan

Principals:

- Creator A owns Song A, Job A, Segment A, Frame A, Beatmap A, Reflection A.
- Creator B owns Song B, Job B, Segment B, Frame B, Beatmap B, Reflection B.
- Admin has no creator-owned song but has platform authority.
- Registered User owns personal reflection/score/badges and submits a creator application.
- Guest has no token.

### Authentication and roles

- Guest gets `401` from creator/admin routes.
- Registered User gets `403` from creator/admin routes.
- Creator gets `403` from admin routes.
- Admin gets `403` from creator-only content creation routes unless an endpoint explicitly supports both roles.
- Suspended account is denied authenticated privileged actions even with a previously issued valid token.
- Client-supplied `role`, `creatorId`, `userId`, reviewer id, or actor id is ignored/rejected.

### Cross-creator song lifecycle

For every Creator A song endpoint, use Song B's id and prove Creator A cannot read creator detail, update metadata/media/cover, obtain private readiness, publish, unpublish, archive, restore, or delete it (`404` preferred to avoid enumeration). Verify Song B remains unchanged.

### Nested generation resources

- Creator A cannot list or poll Job B, export it, or delete it.
- Creator A cannot regenerate Frame B; verify the external image client/upload is not called and the DB row remains unchanged.
- A forged frame/segment/job combination cannot cross songs.
- Creator A cannot preview, generate, configure, publish, unpublish, or delete Song B beatmaps.
- Deleting Job A does not delete Song A.

### Reflections and moderation

- Creator A moderation list contains only reflections on Song A; Creator B rows do not affect pagination or any status/day statistic.
- Filtering Creator A's queue with Song B id returns `404`/empty without disclosure.
- Creator A cannot approve, reject, flag, annotate, or delete Reflection B.
- Creator A can moderate Reflection A and creates both moderation-action and audit records.
- Admin can see/moderate all reflections; Registered User can edit/delete only their own reflection; Guest can submit but cannot mutate.

### Applications and creator conversion

- Registered User submits one application and reads only their own.
- Guest cannot submit; creators/admin cannot forge an application for another user.
- Creator A cannot list/review applications.
- Admin can transition through permitted stages; invalid transitions fail.
- `APPROVED` atomically changes exactly the applicant's role to `CREATOR` and records reviewer/time/audit.
- Duplicate active application and double approval are idempotently rejected/handled.

### Folders and collections

- Creator A proposes a folder and sees only their proposal history.
- Proposal is not public/attachable until admin approval.
- Creator B cannot edit Creator A's proposal.
- Admin can create platform folders and approve/reject proposals.
- Creator A may propose placement only for Song A, never Song B; only admin approval creates the `song_folders` row and duplicate active proposals are prevented.
- Public listing includes approved folders only; deletion/rejection does not destructively alter songs.

### Analytics, warnings, and audit history

- Creator A analytics totals derive only from Song A scores/reflections/jobs; inserting Song B activity does not change Creator A results.
- `/api/stats` and admin analytics/history routes reject guest, registered, and creator tokens.
- Admin analytics includes both creators and registered-user totals.
- Admin may issue/resolve global warnings. A creator may warn only a registered account linked to a reflection on that creator's own song; guest reflections cannot receive warnings. Actor id always comes from the authenticated principal.
- Creator moderation actions and important song lifecycle actions create audit rows with derived song/creator ids.
- Only admin can read global audit/moderation history.

### Public behavior and regression

- Guest and registered users can read only published songs/beatmaps/approved reflections.
- Private/draft resources remain `404` publicly.
- Registered score submission derives `user_id` from token; guest play is not persisted.
- Existing frontend/backend unit tests, lint, and production frontend build pass.
- Tests use isolated temporary SQLite databases only. No production/development database destructive command is permitted.
