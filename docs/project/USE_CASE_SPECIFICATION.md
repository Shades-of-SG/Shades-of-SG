# AI Music Video Generation Platform - Use Cases

**Last updated:** 8 August 2026

**Document Purpose:** Consolidate the creator/admin and public-facing use cases in the format established by the original two use-case documents, updated against the current implementation.

**Platform Purpose:** Transform Singapore-themed songs into cultural music, learning, rhythm, and community experiences while providing controlled creator and administrator workflows.

**Architecture:** Single React/Vite web application, Express/Sequelize API, PostgreSQL production database, JWT authentication, configuration-gated OTP/OAuth services, and no real-time synchronization requirement.

**Status Terms:** Implemented, Partially Implemented, Deprecated, and Planned. A reachable fallback or placeholder is not described as fully complete.

---

# USE-CASE ALLOCATION AND CONTRIBUTION EVIDENCE

## Allocation Matrix

The **Legacy Document Allocation** column preserves the member block recorded in the [creator](../archive/legacy-use-cases/CREATOR_PLATFORM_USE_CASES.md) and [public-facing](../archive/legacy-use-cases/PUBLIC_PLATFORM_USE_CASES.md) use-case documents. It is not treated as verified ownership unless the ownership specification independently supports it. Implementation contribution is based on Git history, journals, and current implementation evidence; merge and revert commits are supporting evidence rather than sole proof.

Journal evidence was cross-checked against the [team journal](../journals/TEAM_AI_DEVELOPMENT_JOURNAL.md), the [creator-workflow journal](../archive/ORIGINAL_CREATOR_WORKFLOW_JOURNAL.md), and the individual journals for [Ferlyn](../journals/ferlyn/AI_ASSISTED_DEVELOPMENT_JOURNAL.md), [Lia](../journals/lia/AI_JOURNAL.md), and [Shermaine](../journals/shermaine/AI_DEVELOPMENT_JOURNAL.md). Htet's implementation evidence is primarily recorded through Git history, generation code, Song Experience code, and tests.

Commits authored as **Solitice-debug** are listed separately because mapping that identity to Ferlyn Ng **Needs team confirmation**. Ferlyn is named directly only where her journal, formal feature allocation, or commits authored as Ferlyn Ng provide independent evidence. Migration 028 ownership also **Needs team confirmation**.

The matrix is split into shorter domain tables to reduce horizontal clipping. New IDs have no legacy allocation.

### Legacy Creator Use Cases

| Use Case | Legacy Document Allocation | Primary Implementation Contributor | Additional Contributors | Contribution Scope |
|---|---|---|---|---|
| UC-01 | Htet — Member 1 | Htet | Ferlyn; unverified identity | Upload and lifecycle integration |
| UC-02 | Htet — Member 1 | Htet | Ferlyn; migration owner unconfirmed | Lyrics and scene planning |
| UC-03 | Htet — Member 1 | Htet | Ferlyn; unverified identity | Frames and regeneration |
| UC-04 | Htet — Member 1 | Htet | Ferlyn; unverified identity | Assembly, media, subtitles |
| UC-05 | Shermaine — Member 2 | Lia; unverified identity | Ferlyn; Htet | Registration and role-safe onboarding |
| UC-06 | Shermaine — Member 2 | Shermaine; unverified identity | Htet | Dashboard and owned-song data |
| UC-07 | Shermaine — Member 2 | Htet | Shermaine; unverified identity | Song detail and job history |
| UC-08 | Shermaine — Member 2 | **Needs team confirmation** | Shermaine; Htet; unverified identity | Delete and archive lifecycle |
| UC-09 | Ferlyn — Member 3 | Ferlyn | Htet; unverified identity | Studio metadata and lyrics |
| UC-10 | Ferlyn — Member 3 | Lia; Ferlyn | Htet; unverified identity | Published-song management |
| UC-11 | Ferlyn — Member 3 | Htet | Lia; unverified identity | Public detail and playback |
| UC-12 | Ferlyn — Member 3 | Ferlyn | Htet; unverified identity | Explicit publish/unpublish |
| UC-13 | Lia — Member 4 | Lia | Unverified identity | Guest public browsing |
| UC-14 | Lia — Member 4 | **Needs team confirmation** | Lia; Htet; unverified identity | Cross-feature retry handling |
| UC-15 | Lia — Member 4 | Lia | Unverified identity | Limited guest browser state |
| UC-16 | Lia — Member 4 | Lia; unverified identity | Htet | Recovery and session integrity |

### Current Creator and Administration Extensions

| Use Case | Legacy Document Allocation | Primary Implementation Contributor | Additional Contributors | Contribution Scope |
|---|---|---|---|---|
| UC-C01 | Not in legacy document | Shermaine; unverified identity | Htet | Creator mode and workspace access |
| UC-L01 | Not in legacy document | Shermaine | Htet; unverified identity | Learning progress and badges |
| UC-R01 | Not in legacy document | Ferlyn | Htet; unverified identity | Creator rhythm beatmaps |
| UC-M01 | Not in legacy document | Ferlyn | Lia; Htet; unverified identity | Reflection moderation |
| UC-A01 | Not in legacy document | Unverified identity — **Needs team confirmation** | — | Creator applications |
| UC-A02 | Not in legacy document | Lia; unverified identity | Htet; Ferlyn | OTP, recovery, account security |
| UC-A03 | Not in legacy document | Lia; unverified identity | — | Administration, safety, analytics |

### Public Use Cases

| Use Case | Legacy Document Allocation | Primary Implementation Contributor | Additional Contributors | Contribution Scope |
|---|---|---|---|---|
| UC-P01 | Lia — Member 1 | Lia | Unverified identity | Landing and session entry |
| UC-P02 | Lia — Member 1 | Lia | Unverified identity | Library search and filtering |
| UC-P03 | Lia — Member 1 | Lia | Unverified identity | Bookmarks and reports |
| UC-P04 | Lia — Member 1 | Unverified identity — **Needs team confirmation** | Shermaine | Public profiles and privacy |
| UC-P05 | Htet — Member 2 | Htet | Unverified identity | Playback, lyrics, sections |
| UC-P06 | Htet — Member 2 | Htet | Unverified identity | Summary and context |
| UC-P07 | Htet — Member 2 | Htet; Shermaine | Unverified identity | Instruments and samples |
| UC-P08 | Htet — Member 2 | Htet | Unverified identity | Trivia and feedback |
| UC-P09 | Shermaine — Member 3 | Shermaine | Unverified identity | Instrument playgrounds |
| UC-P10 | Shermaine — Member 3 | Shermaine | Unverified identity | Guided lessons |
| UC-P11 | Shermaine — Member 3 | Shermaine | Unverified identity | Heritage and cultural context |
| UC-P12 | Shermaine — Member 3 | Shermaine | Unverified identity | Badges and keepsakes |
| UC-P13 | Ferlyn — Member 4 | Ferlyn | Lia; unverified identity | Rhythm gameplay |
| UC-P14 | Ferlyn — Member 4 | Ferlyn | Lia; unverified identity | Scores and guest claim |
| UC-P15 | Ferlyn — Member 4 | Ferlyn | Shermaine; Htet; unverified identity | Reflections and discussion |
| UC-P16 | Ferlyn — Member 4 | Lia; unverified identity | Ferlyn; Htet | Registration and authentication |

---

# CREATOR AND ADMIN USE CASES

# CREATOR VIDEO GENERATION AND MEDIA PROCESSING

## UC-01: Upload and Process Song for Video Generation

**Use Case Name:** Upload Song and Initialize Creator Draft

**Primary Actor:** Creator

**Secondary Actors:** Cloudinary, yt-dlp/audio extraction service, database

**Preconditions:**
- Creator is authenticated with active account and creator access.
- File or YouTube source meets current validation rules.

**Triggers:**
- Creator opens `/creator/studio/new` and selects media or enters a YouTube URL.

**Goal:**
Create one persistent creator-owned Song UUID and attach validated source media without publishing it.

**Main Flow:**
1. Creator enters initial metadata and selects the media source.
2. System validates the request and creates a `DRAFT` Song owned by the JWT user.
3. System uploads audio or extracts it from the supplied YouTube source.
4. System stores media URL/public ID, original filename, source URL, and duration when available.
5. Studio continues editing the same Song UUID.

**Alternate Flows:**

**AF-01: Invalid or Oversized Media**
- System rejects the upload with an actionable validation message.
- Creator remains in Studio and may choose another file.

**AF-02: Extraction or Storage Failure**
- No song is published.
- System exposes a recoverable error and retains safe draft data where possible.

**Success Outcome:**
- Creator-owned `DRAFT` Song exists with valid source media.
- Creator proceeds to metadata, lyrics, sections, beatmaps, or generation.

**Error Conditions:**
- Unsupported MIME type, invalid UUID/source URL, unavailable extractor, storage failure, or creator-access suspension.

**Key Acceptance Criteria:**
- ✓ Ownership comes from the authenticated creator.
- ✓ The Song UUID remains stable throughout the workflow.
- ✓ Upload never publishes automatically.

**Implementation Status:** **Implemented**.

---

## UC-02: Generate Scene Plan from Song and Lyrics

**Use Case Name:** Transcribe Lyrics, Recommend Sections, and Prepare Scene Context

**Primary Actor:** Creator

**Secondary Actors:** Whisper transcription, DeepSeek JSON service, scene-planning service

**Preconditions:**
- Creator owns the Song.
- Song media and duration are available for timestamped processing.

**Triggers:**
- Creator requests transcription, section recommendations, or starts generation.

**Goal:**
Prepare validated lyrics and timing context for scene generation.

**Main Flow:**
1. Creator enters lyrics or requests timestamped transcription.
2. System stores `raw_lyrics` and transcription segments.
3. Creator requests section recommendations.
4. System returns structured section labels and timing boundaries.
5. Creator edits and confirms sections before generation/publishing.
6. Scene planner creates timestamped scene segments from confirmed content.

**Alternate Flows:**

**AF-01: AI Provider Unavailable**
- Creator may keep manually entered lyrics and retry recommendations later.

**AF-02: Invalid Section Boundaries**
- System rejects overlaps, missing labels, or out-of-range timestamps.

**Success Outcome:**
- Lyrics, sections, and scene context are stored against the owned Song.

**Error Conditions:**
- Missing provider configuration, timeout, invalid JSON, absent audio, or invalid timing.

**Key Acceptance Criteria:**
- ✓ Recommendations remain editable suggestions.
- ✓ Creator confirmation is stored separately.
- ✓ Invalid sections are not silently accepted.

**Implementation Status:** **Implemented**, dependent on configured providers for AI operations.

---

## UC-03: Generate Frames with Scene Visuals and Duration Mapping

**Use Case Name:** Generate and Regenerate Ordered Scene Frames

**Primary Actor:** Creator

**Secondary Actors:** Image-generation provider, Cloudinary, Scene Plan

**Preconditions:**
- Creator owns the Song and active GenerationJob.
- Scene segments exist.

**Triggers:**
- GenerationJob reaches frame-generation stage or creator requests regeneration.

**Goal:**
Create ordered visual frames mapped to song segments while reusing eligible repeated content.

**Main Flow:**
1. System reads owned scene segments in timestamp order.
2. System generates or reuses a frame for each segment.
3. System stores prompt hash, image URL, Cloudinary ID, and frame order.
4. Creator reviews frames in the editor.
5. Creator may regenerate an individual owned frame.

**Alternate Flows:**

**AF-01: One Frame Fails**
- Job records failure/recovery information without publishing the Song.

**AF-02: Repeated Chorus**
- Cached content may be reused to reduce unnecessary provider calls.

**Success Outcome:**
- Ordered frames are available for preview and assembly.

**Error Conditions:**
- Provider timeout, invalid response, storage failure, missing segment, or cross-creator access.

**Key Acceptance Criteria:**
- ✓ Frames remain linked through the Song ownership path.
- ✓ Regeneration is owner-scoped.
- ✓ Frame order is deterministic.

**Implementation Status:** **Implemented**.

---

## UC-04: Stitch Frames into Video and Sync Lyrics

**Use Case Name:** Assemble and Export AI-Assisted Music Video

**Primary Actor:** Creator

**Secondary Actors:** FFmpeg, subtitle generator, Cloudinary, GenerationJob

**Preconditions:**
- Creator owns a completed set of frames and source audio.

**Triggers:**
- Creator requests export from an owned GenerationJob.

**Goal:**
Assemble ordered frames, audio, and subtitles into a final media artifact without auto-publishing.

**Main Flow:**
1. System loads source audio, segments, frames, and lyric timing.
2. Subtitle generator creates synchronized subtitle data.
3. Video assembler produces an export artifact.
4. System uploads/stores the resulting video URL.
5. Job becomes `COMPLETED` and Song becomes `READY`.
6. Creator separately reviews readiness and publishes if appropriate.

**Alternate Flows:**

**AF-01: Assembly Failure**
- Job becomes `FAILED`; error is retained and Song is not published.

**AF-02: Placeholder Configuration**
- Deployment may use an explicitly labelled temporary MP4 while final generation is incomplete.

**Success Outcome:**
- Song is `READY` with reviewable video media.

**Error Conditions:**
- FFmpeg failure, missing media, subtitle error, timeout, or upload failure.

**Key Acceptance Criteria:**
- ✓ Completion never changes Song directly to `PUBLISHED`.
- ✓ Failure remains recoverable and visible.
- ✓ Placeholder media is not represented as final generation.

**Implementation Status:** **Partially Implemented** because dependable final MP4 output remains deployment-dependent.

---

# CREATOR WORKSPACE, SONG MANAGEMENT, LEARNING, AND BADGES

## UC-05: Creator Registration and Account Setup

**Use Case Name:** Register an Account and Obtain Creator Access

**Primary Actor:** Prospective Creator

**Secondary Actors:** Authentication service, email/OTP service, administrator

**Preconditions:**
- Actor has no account using the submitted email.

**Triggers:**
- Actor selects Register or requests creator access.

**Goal:**
Create a verified account and obtain creator access through the supported approval process.

**Main Flow:**
1. Actor registers as a standard user and verifies the email address.
2. Actor signs in with the verified account.
3. Actor submits a creator application through UC-A01.
4. Administrator reviews the application.
5. Approved account receives active creator access.

**Alternate Flows:**

**AF-01: Direct Creator Registration Requested**
- System does not allow a public registrant to self-assign the Creator role.

**Success Outcome:**
- Actor has a verified account and, after approval, may enter creator mode.

**Error Conditions:**
- Duplicate email, invalid verification, rejected application, or suspended account.

**Key Acceptance Criteria:**
- ✓ Public registration creates a registered-user account only.
- ✓ Creator access requires an approved application or administrator action.

**Implementation Status:** **Deprecated as a direct creator-registration flow**. Registration remains implemented through UC-P16; creator approval is documented in UC-A01.

---

## UC-C01: Access Creator Dashboard and Creator Mode

**Use Case Name:** Enter Creator Workspace

**Primary Actor:** Creator

**Secondary Actors:** Authentication middleware, CreatorRoute

**Preconditions:**
- User role is `CREATOR`.
- Account and creator access are active.

**Triggers:**
- Creator switches to creator mode or opens `/creator/dashboard`.

**Goal:**
Access creator-only navigation and workflow summaries without losing user-mode access.

**Main Flow:**
1. Client restores authenticated user state.
2. CreatorRoute verifies role and creator access.
3. Dashboard loads owned song and workflow summaries.
4. Creator navigates to Studio, Songs, Generation, Reflections, or Profile.

**Alternate Flows:**

**AF-01: Creator Access Suspended**
- Creator tools are blocked while an otherwise active account may continue in user mode.

**Success Outcome:**
- Creator workspace is available with owner-scoped data.

**Error Conditions:**
- Expired token, suspended account, suspended creator access, or wrong role.

**Key Acceptance Criteria:**
- ✓ Creator and normal-user modes remain separate.
- ✓ Frontend navigation is not the only authorization control.

**Implementation Status:** **Implemented**.

---

## UC-06: View Creator Dashboard and Manage Song Library

**Use Case Name:** Review and Manage Creator-Owned Songs

**Primary Actor:** Creator

**Secondary Actors:** Song API, GenerationJob API

**Preconditions:**
- Creator is in active creator mode.

**Triggers:**
- Creator opens Dashboard or My Songs.

**Goal:**
Find owned songs, understand lifecycle/generation state, and continue the correct workflow.

**Main Flow:**
1. System lists songs where `creator_id` matches the authenticated creator.
2. Creator searches or filters by lifecycle state.
3. Creator opens Studio, active generation, completed editor, or public profile preview.
4. Dashboard summaries use recorded data only.

**Alternate Flows:**

**AF-01: No Songs**
- Empty state links to `/creator/studio/new`.

**Success Outcome:**
- Creator reaches the correct owned workflow from one dashboard/library.

**Error Conditions:**
- API failure, expired token, invalid Song ID, or attempted cross-creator access.

**Key Acceptance Criteria:**
- ✓ Only owned songs are returned.
- ✓ Status labels use current Song and GenerationJob lifecycles.

**Implementation Status:** **Implemented**.

---

## UC-07: View Song Detail and Generation History

**Use Case Name:** Inspect Song Workflow and Generation Jobs

**Primary Actor:** Creator

**Secondary Actors:** Song API, GenerationJob API, Video Editor

**Preconditions:**
- Creator owns the requested Song/job.

**Triggers:**
- Creator selects a song or job from Dashboard/My Songs/Generation.

**Goal:**
Review current metadata, generation state, prior job result, and next action.

**Main Flow:**
1. System resolves the requested resource through its owned Song.
2. Creator views progress or failure information.
3. Completed jobs link to the editor/export flow.
4. Song returns to Studio for metadata/readiness changes.

**Alternate Flows:**

**AF-01: Invalid or Foreign ID**
- System returns not found/forbidden and provides a route back to My Songs.

**Success Outcome:**
- Creator can continue or recover the owned workflow.

**Error Conditions:**
- Missing job, deleted Song, auth expiry, or generation failure.

**Key Acceptance Criteria:**
- ✓ Nested resource ownership is enforced server-side.
- ✓ Error states do not expose another creator's data.

**Implementation Status:** **Implemented**.

---

## UC-08: Delete or Archive Song

**Use Case Name:** Delete or Archive an Owned Song and Associated Artifacts

**Primary Actor:** Creator

**Secondary Actors:** Song service, generation/media storage, public catalogue

**Preconditions:**
- Creator is authenticated, owns the Song, and can access its dashboard/detail controls.

**Triggers:**
- Creator selects Archive, Restore, or Delete and confirms the action.

**Goal:**
Remove a Song from the active workspace or permanently delete eligible owned content without leaving public or generated artifacts inconsistent.

**Main Flow:**
1. System verifies creator ownership and current Song state.
2. Creator chooses Archive for a reversible lifecycle change or Delete for permanent removal.
3. System warns when the action affects published content or associated generation/media records.
4. Creator confirms the selected action.
5. System archives/restores the Song or deletes it through the owner-scoped endpoint.
6. Dashboard and public catalogue refresh to reflect the resulting state.

**Alternate Flows:**

**AF-01: Published Content Requires a Safer Transition**
- System requires unpublishing or an explicit protected-content confirmation before destructive removal.

**AF-02: Creator Cancels**
- No lifecycle or persistence change occurs.

**Success Outcome:**
- Song is archived, restored, or deleted with associated visibility updated consistently.

**Error Conditions:**
- Song not found, ownership failure, protected published content, storage cleanup failure, or invalid state transition.

**Key Acceptance Criteria:**
- ✓ Another creator cannot archive or delete the Song.
- ✓ Archive is reversible; permanent deletion requires explicit confirmation.
- ✓ Public responses do not expose archived or deleted content.

**Implementation Status:** **Implemented**, subject to current published-content safeguards and storage cleanup behavior.

---

## UC-L01: Manage Learning Content, Instrument Progress, and Badges

**Use Case Name:** Use Creator-Integrated Learning and Achievement Features

**Primary Actor:** Creator or Registered User

**Secondary Actors:** Instrument sample service, badge service, profile service

**Preconditions:**
- Public learning routes are available; persistence requires authentication.

**Triggers:**
- User opens Learning Hub, Instrument Lab, Guided Lessons, or Profile.

**Goal:**
Explore learning experiences and retain supported progress/achievements.

**Main Flow:**
1. System displays available Heritage, instrument, and lesson content.
2. User plays instrument samples or follows a guided lesson.
3. Authenticated user completes instrument challenges or explores songs.
4. Badge service evaluates supported award conditions.
5. Earned badges appear in profile/keepsake displays.

**Alternate Flows:**

**AF-01: Missing Database Content**
- System uses clearly defined static/fallback content or shows unavailable state.

**Success Outcome:**
- Supported progress and badges persist for the authenticated user.

**Error Conditions:**
- Sample unavailable, unsupported browser audio, missing lesson, or unauthenticated persistence attempt.

**Key Acceptance Criteria:**
- ✓ Badge awards are unique per user/name.
- ✓ Static/fallback learning data is not described as a complete authoring system.

**Implementation Status:** **Partially Implemented** for end-to-end database content management.

---

# STUDIO, PUBLISHING, RHYTHM AUTHORING, AND MODERATION

## UC-09: Enter and Edit Song Metadata

**Use Case Name:** Edit Creator Studio Metadata and Lyrics

**Primary Actor:** Creator

**Secondary Actors:** Song API, media services, transcription/section services

**Preconditions:**
- Creator owns the Song or is creating a new draft.

**Triggers:**
- Creator edits Studio fields or uploads media.

**Goal:**
Maintain complete, validated metadata on one draft Song.

**Main Flow:**
1. Creator enters title, artist, theme, languages, mood tags, and description.
2. Creator uploads cover/audio/video or uses extracted audio.
3. Creator enters/transcribes and formats lyrics.
4. Creator saves valid section recommendations and boundaries.
5. System persists changes to the same Song UUID.

**Alternate Flows:**

**AF-01: Validation Failure**
- Invalid fields/media/sections are shown without losing the safe draft.

**Success Outcome:**
- Draft contains current metadata and media required for readiness evaluation.

**Error Conditions:**
- Missing required value, invalid MIME/size, timing overlap, provider failure, or ownership mismatch.

**Key Acceptance Criteria:**
- ✓ Legacy `language`/`lyrics` are not used as the preferred current fields.
- ✓ Draft remains unpublished until explicit action.

**Implementation Status:** **Implemented**.

---

## UC-10: View and Manage Published Song in Public Library

**Use Case Name:** Review and Manage a Creator's Published Song

**Primary Actor:** Creator

**Secondary Actors:** Public Song API, creator Song service, public catalogue

**Preconditions:**
- Creator owns a Song in Published state.

**Triggers:**
- Creator opens My Songs, Dashboard, or the public page for the published Song.

**Goal:**
Confirm how an owned published Song appears publicly and apply supported lifecycle actions.

**Main Flow:**
1. Creator locates the published Song in the creator workspace.
2. System displays publication state, media, metadata, and public link.
3. Creator opens the published Song Experience.
4. Creator may return to Studio, unpublish to Ready, or archive through authorized controls.
5. Public catalogue visibility updates after a lifecycle change.

**Alternate Flows:**

**AF-01: Public Media Is Unavailable**
- System shows the current media limitation without changing publication state automatically.

**Success Outcome:**
- Creator can verify and manage the public presentation of the owned Song.

**Error Conditions:**
- Ownership failure, missing Song, invalid state, or public media failure.

**Key Acceptance Criteria:**
- ✓ Creator controls are owner-scoped.
- ✓ Unpublishing removes the Song from published-only public responses.

**Implementation Status:** **Implemented** through Creator Songs, Studio, and public Song Experience routes.

---

## UC-11: View Public Song Detail and Watch Generated Video

**Use Case Name:** Open a Published Song and Watch Its Media

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Public Song API, media provider, lyrics/section presentation

**Preconditions:**
- Song exists and is Published.

**Triggers:**
- Actor opens a Song from the public catalogue or follows its public URL.

**Goal:**
View published metadata, media, lyrics, sections, and related learning actions without creator access.

**Main Flow:**
1. Client requests the published Song by ID.
2. System renders creator attribution, metadata, media, lyrics, and available sections.
3. Actor plays or seeks the available media.
4. Actor may continue to instruments, trivia, rhythm, reflections, or creator profile.

**Alternate Flows:**

**AF-01: Media Uses a Documented Fallback**
- UI identifies the available placeholder or audio-only behavior rather than claiming final generated MP4 completion.

**Success Outcome:**
- Actor consumes the published Song experience and can reach related public features.

**Error Conditions:**
- Unpublished/missing Song, invalid ID, API failure, or unavailable media.

**Key Acceptance Criteria:**
- ✓ Unpublished Songs return no public detail.
- ✓ Media limitations remain explicit.

**Implementation Status:** **Implemented**, with dependable final generated MP4 output still **Partially Implemented**.

---

## UC-R01: Create and Publish Rhythm Beatmaps

**Use Case Name:** Generate, Preview, Adjust, and Publish Beatmaps

**Primary Actor:** Creator

**Secondary Actors:** Beatmap generator, validator, Rhythm Game

**Preconditions:**
- Creator owns a Song with usable duration/media.

**Triggers:**
- Creator opens the Studio Rhythm Game panel.

**Goal:**
Publish at most one current beatmap per Song/difficulty while retaining draft editing.

**Main Flow:**
1. Creator generates one or all difficulties using AI or fallback.
2. System validates notes, duration, difficulty, and version.
3. Creator previews the draft in the Rhythm Game.
4. Creator adjusts and saves timing offset.
5. Creator publishes/unpublishes or deletes an eligible draft.

**Alternate Flows:**

**AF-01: AI Generation Fails**
- System may create a validated fallback chart or retain `FAILED` status.

**AF-02: Published Version Exists**
- Published chart remains live while a replacement draft is prepared.

**Success Outcome:**
- Valid published chart is available to public players.

**Error Conditions:**
- Invalid notes, missing duration, duplicate active version, cross-owner access, or provider failure.

**Key Acceptance Criteria:**
- ✓ One draft and one published chart per Song/difficulty are enforced.
- ✓ Creator preview requires ownership.

**Implementation Status:** **Implemented**.

---

## UC-12: Publish Song and Video to Public Library

**Use Case Name:** Validate and Apply Song Lifecycle Actions

**Primary Actor:** Creator

**Secondary Actors:** Publish-readiness service, public Song API, administrator

**Preconditions:**
- Creator owns a non-generating Song.
- Required metadata/media satisfy current readiness rules.

**Triggers:**
- Creator selects Publish, Unpublish, Archive, Restore, or Delete.

**Goal:**
Expose only complete explicitly published Songs and preserve safe lifecycle transitions.

**Main Flow:**
1. System derives current publish readiness.
2. Creator reviews missing/complete requirements.
3. Creator explicitly publishes a `READY` Song.
4. Public endpoints begin returning it.
5. Unpublish returns it to `READY`; archive removes public visibility.

**Alternate Flows:**

**AF-01: Readiness Incomplete**
- Publish is rejected with the missing requirements.

**AF-02: Active Generation**
- Destructive/lifecycle actions that conflict with generation are rejected.

**Success Outcome:**
- Song lifecycle and public visibility remain consistent.

**Error Conditions:**
- Invalid transition, missing media, active job, unauthorized actor, or cleanup failure.

**Key Acceptance Criteria:**
- ✓ Generation completion stops at `READY`.
- ✓ Public queries return only `PUBLISHED` Songs.

**Implementation Status:** **Implemented**.

---

## UC-M01: Moderate Reflection Wall Content

**Use Case Name:** Review Reflections and Community Interactions

**Primary Actor:** Creator or Administrator

**Secondary Actors:** Reflection service, warning service, audit service

**Preconditions:**
- Creator owns the reflected Song, or actor is an administrator.

**Triggers:**
- Moderator opens moderation queue or safety report.

**Goal:**
Approve safe content and act on inappropriate reflections/comments with traceable scope.

**Main Flow:**
1. System returns the actor's authorized moderation queue.
2. Moderator filters and opens reflection details.
3. Moderator approves, flags, rejects, deletes, or adds a note.
4. Authorized moderator may remove a comment or issue a warning.
5. System records moderation/audit information.

**Alternate Flows:**

**AF-01: Creator Attempts Foreign Song**
- System rejects the action without revealing protected content.

**Success Outcome:**
- Public feed includes only approved content for published Songs.

**Error Conditions:**
- Invalid state, missing reason, foreign ownership, or suspended actor.

**Key Acceptance Criteria:**
- ✓ Creator scope follows `reflections.song_id → songs.creator_id`.
- ✓ Administrator actions are platform-wide and auditable.

**Implementation Status:** **Implemented**.

---

# LEGACY GUEST ACCESS, RESILIENCE, AND SESSION USE CASES

## UC-13: Guest User Browse Public Library Without Registration

**Use Case Name:** Browse Published Songs as a Guest

**Primary Actor:** Guest User

**Secondary Actors:** Public Song API, public navigation

**Preconditions:**
- Platform and public catalogue are available.

**Triggers:**
- Guest opens the landing page, Songs Library, or a public Song URL.

**Goal:**
Browse and watch published content without registration.

**Main Flow:**
1. Client detects that no authenticated account is active.
2. Guest opens the public catalogue and receives Published Songs only.
3. Guest searches, filters, opens a Song, and uses supported public learning/media features.
4. Protected persistence actions prompt authentication without blocking public browsing.

**Alternate Flows:**

**AF-01: Guest Chooses a Protected Action**
- Client preserves only a validated supported intent and opens authentication.

**Success Outcome:**
- Guest reaches published content without an account or database-backed guest identity.

**Error Conditions:**
- Public API failure, invalid Song ID, unavailable media, or unsafe return path.

**Key Acceptance Criteria:**
- ✓ Registration is not required for public browsing.
- ✓ Guest access never grants creator or administrator permissions.

**Implementation Status:** **Implemented with a revised guest model**. The original generated guest-session ID is **Deprecated**; public browsing does not create a database session.

---

## UC-14: Error Handling — Network Failure and Retry Logic

**Use Case Name:** Handle Network and Service Failures with Safe Recovery

**Primary Actor:** Any User

**Secondary Actors:** API, database, media providers, client error states

**Preconditions:**
- Actor is using any platform workflow.

**Triggers:**
- Request fails, times out, returns a server/rate-limit error, or loses provider connectivity.

**Goal:**
Explain failures, preserve consistent state, and provide a safe retry or alternate action.

**Main Flow:**
1. Client or server detects the failure and records available context safely.
2. UI stops the affected loading/progress state.
3. UI shows an operation-specific error without exposing secrets or internals.
4. Actor retries, returns to a safe route, or preserves a recoverable draft where supported.
5. Server rejects duplicate or invalid lifecycle operations after retry.

**Alternate Flows:**

**AF-01: Authentication Expired**
- Client clears stale authentication and preserves only a validated internal return intent.

**AF-02: Provider Remains Unavailable**
- Feature reports the dependency limitation and leaves persisted state unchanged.

**Success Outcome:**
- Actor understands the failure and the database remains in a valid state.

**Error Conditions:**
- Unhandled client exception, repeated timeout, unavailable provider, or non-retryable validation error.

**Key Acceptance Criteria:**
- ✓ Major routes provide loading, empty, error, or retry states where implemented.
- ✓ Retry does not bypass authorization or lifecycle checks.

**Implementation Status:** **Partially Implemented**. Recovery is implemented in major workflows, but there is no single platform-wide retry/error framework or external monitoring integration.

---

## UC-15: Browser Storage Management for Guest Sessions

**Use Case Name:** Preserve Limited Guest Intent in Browser Storage

**Primary Actor:** Guest User

**Secondary Actors:** Browser local/session storage, authentication flow

**Preconditions:**
- Browser storage is available and the guest starts a supported resumable action.

**Triggers:**
- Guest completes a rhythm result or selects an action that requires authentication.

**Goal:**
Preserve the minimum safe state required to resume a supported action after authentication.

**Main Flow:**
1. Client validates the pending score or internal return path.
2. Client stores a bounded pending claim/intent locally.
3. Guest authenticates.
4. Client restores the validated intent once and clears it after success or expiry.

**Alternate Flows:**

**AF-01: Storage Is Missing or Invalid**
- Client discards the value and continues without restoring the action.

**Success Outcome:**
- Supported guest intent survives authentication without creating a general guest account.

**Error Conditions:**
- Storage disabled, malformed/expired value, unsafe path, or duplicate claim.

**Key Acceptance Criteria:**
- ✓ Stored return paths are internal and validated.
- ✓ Sensitive credentials and provider tokens are never stored as guest state.

**Implementation Status:** **Partially Implemented**. Pending score/return intent exists; the original broad guest-session, local bookmarks, filter history, and generated guest-session ID design is **Deprecated**.

---

## UC-16: Account Recovery and Session Management

**Use Case Name:** Recover Account Access and Maintain Session Integrity

**Primary Actor:** Registered User or Creator

**Secondary Actors:** Authentication service, email/OTP service, account store

**Preconditions:**
- Actor has an existing account or an expiring authenticated session.

**Triggers:**
- Login, forgot-password request, token expiry, explicit logout, or protected-route access.

**Goal:**
Restore account access securely and prevent expired or revoked credentials from continuing a session.

**Main Flow:**
1. Actor signs in or requests password recovery.
2. System verifies credentials or an expiring recovery code/token.
3. System issues/restores the supported JWT session.
4. Client loads the authenticated profile and validated return intent.
5. Logout, password/security changes, or authentication-version changes invalidate stale access as designed.

**Alternate Flows:**

**AF-01: Expired or Invalid Recovery**
- System rejects the request without revealing whether another account exists and permits a safe restart.

**Success Outcome:**
- Actor regains authorized access or is safely returned to login.

**Error Conditions:**
- Invalid credentials, expired OTP/token, suspended account, stale JWT, or unavailable email service.

**Key Acceptance Criteria:**
- ✓ Recovery tokens/codes expire and are not stored in plaintext.
- ✓ Protected routes reject stale or unauthorized sessions.

**Implementation Status:** **Implemented for login, recovery, logout, and session restoration**. The original advanced multiple-session management concept is **Deprecated**; broader security operations are documented in UC-A02.

---

# CURRENT CREATOR ACCESS, SECURITY, AND ADMINISTRATION

## UC-A01: Apply for Creator Access

**Use Case Name:** Save, Submit, and Track Creator Application

**Primary Actor:** Registered User

**Secondary Actors:** Administrator, resume storage/database, email/auth services

**Preconditions:**
- User is authenticated, active, and currently `REGISTERED`.

**Triggers:**
- User opens `/apply/creator`.

**Goal:**
Apply for creator access without directly self-assigning the Creator role.

**Main Flow:**
1. User saves application fields as a draft.
2. User uploads optional resume and accepts guidelines.
3. User submits the completed application.
4. User views status, visible feedback, and history.
5. Administrator reviews and may request changes, reject, or approve.
6. Approval promotes an eligible registered account to `CREATOR`.

**Alternate Flows:**

**AF-01: User Withdraws**
- Active application becomes `WITHDRAWN` and history is retained.

**Success Outcome:**
- Application state is traceable; role changes only after approval.

**Error Conditions:**
- Invalid file, incomplete required fields, duplicate active application, invalid transition, or ineligible user.

**Key Acceptance Criteria:**
- ✓ One active application per user.
- ✓ Resume access is authorization-controlled.

**Implementation Status:** **Implemented** under its dedicated current-scope identifier.

---

## UC-A02: Manage Account Security and Recovery

**Use Case Name:** Verify Email, Reset Password, Change Email, or Delete Account

**Primary Actor:** Registered User or Creator

**Secondary Actors:** OTP service, SMTP, authentication service, account-deletion service

**Preconditions:**
- Actor owns the account; protected actions require a valid JWT/password.

**Triggers:**
- Registration, recovery request, settings action, or deletion confirmation.

**Goal:**
Complete security-sensitive account changes using expiring verification and current credentials.

**Main Flow:**
1. System issues a hashed, expiring OTP or reset session.
2. Actor verifies the code/token within attempt and cooldown limits.
3. System validates strong replacement credentials.
4. System increments authentication version where required.
5. Hard deletion removes the User while preserving nullable historical audit references.

**Alternate Flows:**

**AF-01: Invalid or Expired Verification**
- System rejects the action and permits safe resend/restart rules.

**Success Outcome:**
- Account change is complete and stale credentials/tokens are invalidated as designed.

**Error Conditions:**
- Wrong password/code, expiry, cooldown, duplicate email, suspended account, or protected administrator target.

**Key Acceptance Criteria:**
- ✓ OTP values are hashed.
- ✓ Password-reset requests do not reveal account existence.

**Implementation Status:** **Implemented**.

---

## UC-A03: Administer Users, Creators, Applications, Content, and Safety

**Use Case Name:** Administrator Platform Governance

**Primary Actor:** Administrator

**Secondary Actors:** User, creator, application, song, folder, report, analytics, moderation, email, and audit services

**Preconditions:**
- Administrator is authenticated and active.

**Triggers:**
- Administrator opens Overview, Users, Creators, Content, Community, or Activity.

**Goal:**
Review recorded platform state and apply safe, traceable identity, content, and community decisions.

**Main Flow:**
1. Administrator searches and filters users/creators/applications.
2. Administrator inspects profile, score, badge, warning, reflection, and audit sections.
3. Administrator changes application state or approves creator access.
4. Administrator may correct email/send reset link after password confirmation.
5. Administrator may suspend/restore account or creator tools separately.
6. Eligible non-admin account may be hard-deleted with reason and password confirmation.
7. Administrator reviews songs, reports, folders, placement proposals, analytics, warnings, and moderation history.
8. Administrator applies authorized lifecycle, collection, or safety actions.

**Alternate Flows:**

**AF-01: Unsafe Target or Transition**
- Self-target, administrator target, duplicate email, missing reason, or invalid state is rejected.

**AF-02: Missing Analytics Source**
- UI reports only stored events and does not fabricate totals.

**Success Outcome:**
- Identity, access, content, collection, and safety decisions are applied and audited without implicit destructive changes.

**Error Conditions:**
- Wrong admin password, invalid UUID/state, protected target, missing report, incomplete event source, or mail failure.

**Key Acceptance Criteria:**
- ✓ Whole-account and creator-tool status remain separate.
- ✓ Destructive actions require explicit confirmation.
- ✓ Consolidated admin routes replace obsolete dedicated pages through redirects.
- ✓ Audit and moderation history survives eligible account deletion.

**Implementation Status:** **Implemented** at the current API and consolidated-admin UI level.

---

# PUBLIC-FACING USE CASES

# PUBLIC DISCOVERY, LIBRARY, AND PROFILES

## UC-P01: Access Landing Page and Choose Session Mode

**Use Case Name:** Platform Entry and Account-Aware Navigation

**Primary Actor:** Guest or Returning User

**Secondary Actors:** Authentication context, stats service, public Song/Reflection APIs

**Preconditions:**
- Platform URL is available.

**Triggers:**
- Visitor opens `/` or follows a public link.

**Goal:**
Enter public experiences immediately or authenticate for persisted actions.

**Main Flow:**
1. Client restores current JWT user when present.
2. Landing renders public navigation, hero, features, and recorded content previews.
3. Guest may browse without creating a database session/user.
4. User selects Songs, Learning, Rhythm, Reflections, Login, or Register.

**Alternate Flows:**

**AF-P01: Protected Intent Exists**
- After authentication, client restores a validated internal path or pending score claim.

**Success Outcome:**
- Actor reaches the selected public/auth experience.

**Error Conditions:**
- Public API unavailable, auth restoration failure, or unsafe return path.

**Key Acceptance Criteria:**
- ✓ Public browsing does not require registration.
- ✓ Unsafe return paths are rejected.

**Implementation Status:** **Implemented**. The original separate `/home` route is **Deprecated**.

---

## UC-P02: Browse Songs Library with Filters and Search

**Use Case Name:** Browse Published Song Catalogue

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Public Song API

**Preconditions:**
- At least zero published Songs may exist; empty state is supported.

**Triggers:**
- Actor opens `/songs`.

**Goal:**
Find relevant published songs by browsing, search, filter, and sort.

**Main Flow:**
1. Client requests published Songs.
2. Actor searches by supported text fields.
3. Actor filters by theme, language, or mood and chooses sort order.
4. Catalogue and preview panel update.
5. Actor opens `/songs/:id`.

**Alternate Flows:**

**AF-P01: No Matches**
- Empty state offers filter clearing or another route.

**Success Outcome:**
- Actor selects a valid published Song.

**Error Conditions:**
- API failure, invalid response, or unavailable media preview.

**Key Acceptance Criteria:**
- ✓ Unpublished Songs never appear.
- ✓ Loading, empty, retry, and responsive states are available.

**Implementation Status:** **Implemented**.

---

## UC-P03: Filter, Sort, Bookmark, and Report Songs

**Use Case Name:** Refine Discovery and Use Registered Song Actions

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Bookmark service, song-report service, authentication modal

**Preconditions:**
- Song is published; persistence/reporting requires authentication.

**Triggers:**
- Actor changes catalogue controls or selects bookmark/report.

**Goal:**
Refine results and retain/report content through authenticated actions.

**Main Flow:**
1. Actor combines current search/filter/sort controls.
2. Registered user toggles bookmark.
3. Registered user submits a report reason and optional details.
4. UI updates saved/reported state.

**Alternate Flows:**

**AF-P01: Guest Selects Protected Action**
- Authentication prompt appears and preserves safe intent where supported.

**Success Outcome:**
- Results are refined and authorized action is stored.

**Error Conditions:**
- Duplicate/invalid report, expired token, missing Song, or API failure.

**Key Acceptance Criteria:**
- ✓ Bookmarks are per user/Song.
- ✓ Reports enter administrator review without publicly changing content.

**Implementation Status:** **Implemented**.

---

## UC-P04: View Public User and Creator Profiles

**Use Case Name:** Open Privacy-Aware Public Profile

**Primary Actor:** Guest or Registered User

**Secondary Actors:** User profile service, creator profile service

**Preconditions:**
- Requested UUID belongs to an eligible user/creator.

**Triggers:**
- Actor selects a creator name, user profile link, or public preview.

**Goal:**
View only profile data allowed by role, visibility, and section settings.

**Main Flow:**
1. Client requests public profile.
2. Server filters private/security fields.
3. UI displays allowed identity, biography, published songs, badges, rhythm, or reflections.
4. Owner may use preview/edit links.

**Alternate Flows:**

**AF-P01: Private Profile**
- Restricted representation is returned instead of private details.

**Success Outcome:**
- Actor sees an allowed public profile.

**Error Conditions:**
- Invalid UUID, missing/deleted/suspended user, or private creator profile.

**Key Acceptance Criteria:**
- ✓ Credentials, access reasons, and private settings are never public.

**Implementation Status:** **Implemented**.

---

# SONG EXPERIENCE AND EDUCATIONAL CONTENT

## UC-P05: Watch AI-Generated Music Video with Synced Lyrics

**Use Case Name:** Play Published Song Media and Read Formatted Lyrics

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Public Song API, media player

**Preconditions:**
- Song is `PUBLISHED` and has accessible media.

**Triggers:**
- Actor opens `/songs/:id`.

**Goal:**
Experience published media with current lyrics/section presentation.

**Main Flow:**
1. Server resolves a published Song.
2. Player loads video or supported audio media.
3. Actor uses playback controls.
4. Page renders formatted lyrics and available timestamped sections.

**Alternate Flows:**

**AF-P01: Media Error**
- Player shows a retry/error state and other Song information remains available.

**Success Outcome:**
- Actor consumes published media and lyrics.

**Error Conditions:**
- Invalid/unpublished Song, network/media failure, or missing optional sections.

**Key Acceptance Criteria:**
- ✓ Public endpoint never exposes draft media.
- ✓ Placeholder video is explicitly labelled where used.

**Implementation Status:** **Implemented**, with final generated MP4 quality **Partially Implemented**.

---

## UC-P06: Read Song Summary and Learn Context

**Use Case Name:** Explore Song Metadata and Cultural Context

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Public Song API, analytics service

**Preconditions:**
- Song is published.

**Triggers:**
- Actor views Song Experience details.

**Goal:**
Understand the Song through stored description, theme, languages, mood, creator, and learning links.

**Main Flow:**
1. Page displays current Song metadata and creator attribution.
2. Actor reads cultural/summary content when available.
3. Actor follows related learning, trivia, instrument, rhythm, or reflection action.
4. Supported analytics event is recorded without fabricating missing data.

**Alternate Flows:**

**AF-P01: Optional Context Missing**
- Page shows an honest unavailable/omitted state.

**Success Outcome:**
- Actor reaches relevant contextual content.

**Error Conditions:**
- Missing optional description or dependent content.

**Key Acceptance Criteria:**
- ✓ Stored content is distinguished from frontend fallback data.

**Implementation Status:** **Implemented**.

---

## UC-P07: View Instruments Used in Song

**Use Case Name:** Explore Song Instruments and Audio Samples

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Instrument model/API, Instrument Lab sample service

**Preconditions:**
- Published Song or Instrument Lab content is available.

**Triggers:**
- Actor opens instrument content from Song Experience or Learning Hub.

**Goal:**
Learn about available instruments and hear configured samples.

**Main Flow:**
1. UI displays instrument name, origin, description, and available artwork/sample.
2. Actor selects a playable sample/note.
3. Audio service plays the mapped URL and playback rate.
4. Actor may continue to Instrument Discovery Lab.

**Alternate Flows:**

**AF-P01: Sample Missing**
- UI shows explicit unavailable/fallback state without fake playback.

**Success Outcome:**
- Actor learns about and hears available instruments.

**Error Conditions:**
- Browser audio restriction, unavailable sample, or missing Song instrument data.

**Key Acceptance Criteria:**
- ✓ Sample attribution/license fields remain available for documented assets.

**Implementation Status:** **Implemented** for current sample set.

---

## UC-P08: Participate in Song Trivia Quiz

**Use Case Name:** Answer Song Trivia and Receive Feedback

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Trivia UI, optional analytics service

**Preconditions:**
- Published Song exists and question content is available.

**Triggers:**
- Actor opens `/songs/:id/trivia`.

**Goal:**
Complete available questions and receive immediate/final feedback.

**Main Flow:**
1. UI loads question data or a documented fallback set.
2. Actor selects answers.
3. UI shows correct/incorrect feedback and progress.
4. Final result and retry/return actions are shown.

**Alternate Flows:**

**AF-P01: No Questions**
- UI reports that trivia is unavailable for the Song.

**Success Outcome:**
- Actor completes or safely exits available trivia.

**Error Conditions:**
- Missing questions, invalid Song, or analytics failure.

**Key Acceptance Criteria:**
- ✓ Missing database content is not claimed as complete.

**Implementation Status:** **Partially Implemented** for database-backed content/attempt persistence.

---

# INTERACTIVE LEARNING, INSTRUMENTS, AND BADGES

## UC-P09: Access and Play Instrument Playground

**Use Case Name:** Play Virtual Instruments

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Browser audio, instrument sample service

**Preconditions:**
- Supported browser and available sample data.

**Triggers:**
- Actor opens Song Playground or Instrument Discovery Lab.

**Goal:**
Play instrument notes through keyboard/touch controls.

**Main Flow:**
1. Actor selects an instrument.
2. UI loads mapped samples.
3. Actor plays notes and sees visual feedback.
4. Registered user may complete supported challenges.

**Alternate Flows:**

**AF-P01: Sample Load Failure**
- UI exposes fallback/unavailable state and remains navigable.

**Success Outcome:**
- Actor completes an interactive instrument session.

**Error Conditions:**
- Missing sample, browser restriction, or unsupported note.

**Key Acceptance Criteria:**
- ✓ Touch and keyboard interactions remain available where designed.

**Implementation Status:** **Implemented**.

---

## UC-P10: Participate in Guided Music Lesson

**Use Case Name:** Select Instrument, Song, and Lesson Difficulty

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Guided lesson data, sequence player

**Preconditions:**
- At least one configured lesson path is available.

**Triggers:**
- Actor opens `/learning/guided-lessons`.

**Goal:**
Follow a guided note sequence or use free-play practice.

**Main Flow:**
1. Actor selects instrument.
2. Actor selects Song and difficulty.
3. Lesson player presents ordered notes/progress.
4. Actor completes or retries the sequence.
5. Actor may enter free-play keyboard mode.

**Alternate Flows:**

**AF-P01: Lesson Unavailable**
- UI shows an empty/unavailable state and return route.

**Success Outcome:**
- Actor completes available guided practice.

**Error Conditions:**
- Missing lesson data, sample failure, or invalid sequence.

**Key Acceptance Criteria:**
- ✓ Static lesson data is not represented as a complete database authoring system.

**Implementation Status:** **Partially Implemented** for database-backed content management.

---

## UC-P11: Explore Cultural and Historical Context

**Use Case Name:** Navigate Learning Hub and Heritage Vault

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Learning content and published Song links

**Preconditions:**
- Learning routes are available.

**Triggers:**
- Actor opens `/learning` or `/learning/heritage-vault`.

**Goal:**
Explore Singapore music/cultural context and continue to related experiences.

**Main Flow:**
1. Learning Hub presents Heritage, Instrument, and Guided Lesson choices.
2. Actor opens Heritage Vault content.
3. Actor follows related Song or learning links.
4. Responsive navigation keeps return paths available.

**Alternate Flows:**

**AF-P01: No Related Song**
- Content remains readable and offers another learning destination.

**Success Outcome:**
- Actor explores a cultural learning path.

**Error Conditions:**
- Missing optional media or related Song.

**Key Acceptance Criteria:**
- ✓ Learning pages remain publicly reachable and responsive.

**Implementation Status:** **Implemented** with primarily application/static content.

---

## UC-P12: Earn and View Badges

**Use Case Name:** Persist and Display Supported Achievements

**Primary Actor:** Registered User or Creator in User Mode

**Secondary Actors:** Badge catalog, streak service, profile service

**Preconditions:**
- Actor is authenticated.

**Triggers:**
- Login, reflection submission, challenge completion, song exploration, or Profile view.

**Goal:**
Award unique badges for supported conditions and display them according to profile privacy.

**Main Flow:**
1. Service records relevant supported activity.
2. Badge conditions are evaluated.
3. New unique award is stored.
4. Profile/keepsake UI joins earned badge with canonical catalog metadata.

**Alternate Flows:**

**AF-P01: Badge Already Earned**
- Duplicate award is not created.

**Success Outcome:**
- Earned badge appears with name, description, category, art, and date.

**Error Conditions:**
- Unauthenticated request, missing catalog row, or concurrent duplicate attempt.

**Key Acceptance Criteria:**
- ✓ `(user_id, name)` is unique.
- ✓ Only currently catalogued conditions are claimed as implemented.

**Implementation Status:** **Implemented**.

---

# RHYTHM, REFLECTIONS, AND ACCOUNT ACCESS

## UC-P13: Play Rhythm Game with Multiple Difficulty Levels

**Use Case Name:** Play Published Song Rhythm Chart

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Beatmap API, rhythm renderer/scoring engine

**Preconditions:**
- Song is published and a published/fallback chart is available.

**Triggers:**
- Actor selects `EASY`, `MEDIUM`, or `HARD` from Rhythm Hub/Song Experience.

**Goal:**
Complete rhythm play and receive score, accuracy, combo, and rank.

**Main Flow:**
1. Client loads Song and appropriate beatmap.
2. Game renders notes against audio timing.
3. Actor plays through keyboard/touch controls.
4. Scoring engine calculates final result.
5. Results route displays outcome and next actions.

**Alternate Flows:**

**AF-P01: Published Beatmap Missing**
- Valid deterministic fallback may be used where allowed; otherwise unavailable state appears.

**Success Outcome:**
- Completed result is available for persistence or temporary guest claim.

**Error Conditions:**
- Invalid Song/difficulty, unavailable media, malformed notes, or timing failure.

**Key Acceptance Criteria:**
- ✓ Creator preview charts are permission-gated.
- ✓ Guest play does not directly create a GameScore.

**Implementation Status:** **Implemented**.

---

## UC-P14: Save Score, View Results, and Claim Guest Score

**Use Case Name:** Persist Registered Rhythm Result and View Ranking

**Primary Actor:** Registered User; Guest becoming Registered

**Secondary Actors:** Score API, leaderboard/ranking service, safe return-path service

**Preconditions:**
- Completed result references a published Song.

**Triggers:**
- Registered game completes, or guest chooses to save a temporary result.

**Goal:**
Store valid user scores, show results/personal best/leaderboard, and safely claim one guest result.

**Main Flow:**
1. Registered client submits score payload; server derives User from JWT.
2. Server validates result and stores GameScore.
3. User views results, personal best, profile summary, and leaderboard.
4. Guest result remains local through registration/login/verification.
5. `/rhythm-game/claim` submits it with unique `claim_id` and clears local state.

**Alternate Flows:**

**AF-P01: Repeated Claim**
- Unique `claim_id` prevents a second stored score.

**AF-P02: Creator Session**
- Creator-mode/user role rules prevent persistence as a normal player score.

**Success Outcome:**
- One valid result is stored and reflected in rankings.

**Error Conditions:**
- Invalid score, unpublished Song, expired token, unsafe return path, or duplicate claim.

**Key Acceptance Criteria:**
- ✓ Identity is JWT-derived, never accepted from client `user_id`.
- ✓ Claim flow is idempotent.

**Implementation Status:** **Implemented**.

---

## UC-P15: View, Submit, Discuss, and Manage Reflections

**Use Case Name:** Participate in Reflection Wall

**Primary Actor:** Guest or Registered User

**Secondary Actors:** Reflection API, comment/like services, moderation workflow

**Preconditions:**
- Reflected Song is published; comments/likes require authentication.

**Triggers:**
- Actor opens `/reflections` or a Song reflection action.

**Goal:**
Share a moderated memory and participate in approved discussion.

**Main Flow:**
1. Actor filters/reads approved reflections.
2. Actor submits validated content with anonymous/profile display where allowed.
3. New reflection is stored as `PENDING`.
4. Registered owner may edit/delete own reflection.
5. Registered user may like and comment on approved content.

**Alternate Flows:**

**AF-P01: Guest Submission**
- Reflection records guest status and has no authenticated edit ownership.

**AF-P02: Removed Comment**
- Comment becomes hidden; administrator may restore it.

**Success Outcome:**
- Submission enters moderation or authorized interaction is stored.

**Error Conditions:**
- Invalid length/content, unpublished Song, unauthenticated interaction, or non-owner edit.

**Key Acceptance Criteria:**
- ✓ Anonymous display does not discard authenticated ownership.
- ✓ Only approved reflections on published Songs are public.

**Implementation Status:** **Implemented**.

---

## UC-P16: Register, Login, Verify, and Restore Account Intent

**Use Case Name:** Create or Authenticate Registered Account

**Primary Actor:** Guest

**Secondary Actors:** Authentication API, OTP/SMTP, Google/Apple providers

**Preconditions:**
- Actor has valid credentials or configured provider identity.

**Triggers:**
- Actor opens Login/Register or is prompted by a protected action.

**Goal:**
Authenticate safely and return to the correct supported experience.

**Main Flow:**
1. Actor registers with name/email/strong password or signs in.
2. New account verifies email OTP when required.
3. Configured provider sign-in verifies token server-side and links stable subject.
4. Server returns JWT for active eligible account.
5. Client restores pending score claim, validated protected path, creator dashboard, admin console, or public/user route.

**Alternate Flows:**

**AF-P01: Unverified Email**
- Login returns the verification path and resend controls.

**AF-P02: Suspended Account**
- Access is rejected with the controlled suspension state/reason.

**Success Outcome:**
- Active authenticated session is restored at a safe destination.

**Error Conditions:**
- Weak password, duplicate email, invalid credentials/code/provider token, expiry, rate limit, or suspension.

**Key Acceptance Criteria:**
- ✓ Provider tokens are verified but not stored.
- ✓ New users become `REGISTERED`, not direct creators.

**Implementation Status:** **Implemented**; provider flows require complete deployment configuration.

---

# Summary Table: Use Cases by Functional Domain

| Functional Domain | Primary Actors | Use Cases | Total |
|---|---|---|---|
| Creator video generation and media processing | Creator, generation services | UC-01–UC-04 | 4 |
| Creator workspace and song management | Creator | UC-05–UC-08, UC-C01 | 5 |
| Creator learning and achievements | Creator, registered user | UC-L01 | 1 |
| Studio and publication | Creator, public visitor | UC-09–UC-12 | 4 |
| Creator rhythm authoring and moderation | Creator, moderator | UC-R01, UC-M01 | 2 |
| Legacy guest resilience and sessions | Guest, account holder | UC-13–UC-16 | 4 |
| Current creator access and administration | Applicant, account holder, administrator | UC-A01–UC-A03 | 3 |
| Public discovery, library, and profiles | Guest, registered user, creator | UC-P01–UC-P04 | 4 |
| Song experience and educational content | Listener, learner | UC-P05–UC-P08 | 4 |
| Interactive learning, instruments, and badges | Learner, registered user | UC-P09–UC-P12 | 4 |
| Rhythm, reflections, and account access | Guest, player, community member | UC-P13–UC-P16 | 4 |
| | | **TOTAL** | **39** |

---

# Technical References

This specification records actor goals and interaction outcomes only. Detailed technical material is maintained in:

- [High-Level Design](HIGH_LEVEL_DESIGN.md) — system architecture, routes, diagrams, and environment boundaries
- [Database Schema Overview](DATABASE_SCHEMA_OVERVIEW.md) — tables, relationships, migrations, and known schema risks
- [Route Inventory](../reference/ROUTE_INVENTORY.md) — current frontend and backend route coverage
- [Ownership Specification](OWNERSHIP_SPECIFICATION.md) — verified ownership, shared contributions, and unresolved attribution

The use cases continue to assume explicit publication, published-only public access, server-enforced creator ownership, limited guest persistence, moderated community content, separate account/creator-access states, and honest labeling of partial or fallback functionality.
