# PROJECT IMPLEMENTATION PHASES — Shades of SG

**Last updated:** 8 August 2026
**Document purpose:** Record the original implementation phases and task ownership while showing the current evidence-based completion state.

> SCCCI AI Challenge | Team: Unpaid Interns | Main development period: 13 June – 8 August 2026

> Status convention: `[x]` implemented, `[ ]` pending or not implemented. A task labelled **Partially implemented** has a reachable implementation but retains the stated limitation.

---

## Timeline Overview

```
13 Jun ───────────────────────────────────────────────────────── 8 Aug
  │                                                               │
  ├─ Phase 0 ─┤
  │ Foundation  │
  │             ├──────── Phase 1 ─────────┤
  │             │ Core feature build        │
  │             │                           ├─ Phase 2 ─────────┤
  │             │                           │ Integration        │
  │             │                           │                    ├─ Phase 3 ─┤
  │             │                           │                    │ QA & docs │
```

| Phase | Name | Dates | Duration |
|-------|------|-------|----------|
| **Phase 0** | Foundation, Setup & Wireframes | Jun 13 – Jun 15 | 3 days |
| **Phase 1** | Core Feature Build | Jun 16 – Jul 6 | 21 days |
| **Phase 2** | Integration & Testing | Jul 7 – Jul 11 | 5 days |
| **Phase 3** | Polish, Deployment & Submission | Jul 12 onward | Extended through Aug 8 |

Implementation continued beyond the original July schedule. Phase 0 is implemented; Phase 1 is implemented except for final AI MP4 reliability and complete learning/trivia authoring; Phase 2 integration is implemented with known baseline test failures; Phase 3 still requires live service verification.

---

## Phase 0 — Foundation, Setup & Wireframes

**Dates:** From 13 June 2026

**Objective:** Establish shared infrastructure, tooling, conventions, database connectivity, deployment configuration, and a reusable frontend shell before feature integration.

### Tasks

**Repository & Project Structure**
- [x] Create the `Shades-of-SG` monorepo
- [x] Scaffold `/backend` with Express/Sequelize and `/frontend` with Vite/React
- [x] Configure ESLint and Prettier
- [x] Add root, backend, and frontend `.env.example` files
- [x] Add root scripts for development, tests, linting, formatting, and mock seeding

**Database & Cloud Provisioning**
- [x] Configure PostgreSQL/Supabase through `DATABASE_URL`
- [x] Provide SQLite fallback for local development and tests
- [x] Create the initial migration and forward-only migration sequence through `028`
- [x] Configure Cloudinary integration
- [x] Add Render and Vercel deployment configuration
- [ ] Introspect and compare the final live production schema against every repository migration

**Shared Boilerplate**
- [x] Verify database connectivity through `sequelize.authenticate()`
- [x] Create Sequelize models and associations for current tables
- [x] Add the Express health route and global error middleware
- [x] Configure frontend API proxy/base behavior
- [x] Establish Jest, Vitest, and Playwright suites
- [x] Add authentication/session contexts and public/auth/creator/admin layouts

**Design & Route Foundation**
- [x] Create shared navigation, typography, spacing, cards, buttons, dialogs, loading, empty, and error states
- [x] Establish public, user, creator, and administrator route groups
- [x] Implement responsive navigation and mobile layout rules
- [x] Preserve route and navigation behavior in `docs/reference/ROUTE_INVENTORY.md`

**Documentation Baseline**
- [x] Create High-Level Design, implementation, ownership, and use-case documents
- [x] Preserve team and individual AI development journals
- [x] Add current database schema and migration chronology documentation

---

## Phase 1 — Core Feature Build

**Dates:** June–July 2026

**Objective:** Build the eight original feature areas in parallel, then retain the original ownership while recording shared integration and later scope.

---

### 🟪 Rose Task 1 — AI Music Video Generation *(Htet)*

**Original Objective:** Deliver an AI-assisted pipeline from song media and lyrics to scene plans, generated frames, subtitles, and exported video.

**Current Status:** **Partially implemented**. The job, scene, frame, regeneration, subtitle, and export paths exist; dependable final MP4 generation can still use a labelled placeholder.

- [x] **Audio Ingestion**
  - Accept creator audio uploads and YouTube extraction through current Song routes
  - Persist audio URL, original filename, public ID, source URL, and duration when available
  - Enforce creator ownership and media validation
- [x] **Scene Planning**
  - Create timestamped `scene_segments` for an owned Song
  - Use lyrics, duration, language, mood, and theme as generation context
- [x] **Frame Generation**
  - Persist generated frames in order and retain Cloudinary identifiers
  - Reuse repeated-content frames and permit individual frame regeneration
- [x] **Video Assembly**
  - Provide video assembly, subtitle generation, upload, and export services
- [x] **Generation Status**
  - Use `QUEUED → PROCESSING → COMPLETED | FAILED`
  - Enforce one active generation job per Song
  - Poll owner-scoped status and retain error details
- [ ] **Final Production MP4 Reliability**
  - Remove dependency on the explicitly labelled placeholder after provider/FFmpeg deployment verification

---

### 🟪 Rose Task 2 — Creator Dashboard & Song Management *(Shermaine)*

**Original Objective:** Deliver the creator portal, song overview, status presentation, creator navigation, and management actions.

**Current Status:** **Implemented**, with later lifecycle and profile integration shared with Ferlyn.

- [x] **Creator Dashboard UI** (`Dashboard.jsx`)
  - Summary cards, recent songs, generation status, moderation links, and quick actions
- [x] **Creator Navigation**
  - Separate creator mode, creator sidebar, account widget, and user-mode return path
- [x] **Song Management** (`CreatorSongs.jsx`)
  - Owner-scoped songs, lifecycle status, search/filter, edit and workflow actions
- [x] **Generation Jobs** (`CreatorGenerationJobs.jsx`)
  - Queue/history view and links to progress/editor screens
- [x] **Learning and Badge Extensions**
  - Creator-facing/profile integration for Learning Hub, Instrument Lab, Guided Lessons, and badge/keepsake displays
- [x] **Song Deletion**
  - Owner-only deletion when lifecycle permits, with nested and managed-media cleanup

---

### 🟪 Rose Task 3 — Song Metadata & Publishing *(Ferlyn)*

**Original Objective:** Give creators control over song metadata and an explicit, validated publishing workflow.

**Current Status:** **Implemented**.

- [x] **Metadata Forms** (`Studio.jsx`)
  - Persistent draft, title, artist, theme, languages, mood tags, description, cover, audio, and video
  - Rich formatted lyrics, timestamped transcription segments, and section recommendations
- [x] **Song Sections**
  - Request AI recommendations, validate section boundaries, edit labels/timestamps, and confirm saved sections
- [x] **Publishing Engine**
  - Use `DRAFT → GENERATING → READY → PUBLISHED → ARCHIVED`
  - Keep generation and publishing separate
  - Provide readiness checks, publish, unpublish, archive, restore, and administrator lifecycle controls
- [x] **Public Isolation**
  - Expose only `PUBLISHED` songs through public Song endpoints
- [x] **Input Validation**
  - Validate metadata, UUIDs, media, lifecycle transitions, ownership, lyrics, and section timing

---

### 🟪 Rose Task 4 — Global Error Handling & Guest Architecture *(Lia)*

**Original Objective:** Make the application resilient and support guest access without granting protected persistence or creator permissions.

**Current Status:** **Implemented**, with authentication/security integration shared with Ferlyn.

- [x] **Global Error Handling**
  - Central Express error middleware and controlled client loading/error/retry/empty states
- [x] **Authentication Recovery**
  - Password-reset OTP flow, strong-password validation, expiring reset sessions, and generic request responses
- [x] **Guest Architecture**
  - Public browsing, learning, rhythm play, and pending guest reflections without a persisted guest User
  - Temporary guest score held in browser storage and claimed only after authentication
- [x] **Protected Route Restoration**
  - Validate same-origin return paths and restore safe destinations after login/registration
- [x] **Account Settings**
  - Email change, password reset, profile/privacy settings, and hard deletion
- [x] **OAuth**
  - Configuration-gated Google and Apple identity verification with stable subjects only

---

### 🌍 Public Task 1 — Song Discovery & Exploration *(Lia)*

**Original Objective:** Build the public entry point and responsive song discovery experience.

**Current Status:** **Implemented**, with later public lifecycle integration shared with Ferlyn.

- [x] **Landing Page** (`/`)
  - Hero, feature journey, published-song/reflection previews, CTA links, and public navigation
- [x] **Songs Library** (`/songs`)
  - Published catalogue, search, theme/language/mood filtering, sorting, preview, and responsive results
- [x] **Registered Discovery Actions**
  - Bookmarks and authenticated song reports
- [x] **Public Profiles**
  - Creator links, user/creator public profiles, privacy handling, and published-song displays

---

### 🌍 Public Task 2 — Song Experience & Content Consumption *(Htet)*

**Original Objective:** Build the immersive published-song experience with media, lyrics, cultural context, instruments, and trivia.

**Current Status:** **Implemented**, with per-song learning/trivia depth **partially implemented**.

- [x] **Video and Audio Experience** (`SongExperience.jsx`)
  - Custom media controls, progress, errors/retry, metadata, and creator attribution
- [x] **Lyrics and Sections**
  - Render current formatted lyrics and timestamped song sections
- [x] **Cultural Summary and Instruments**
  - Render stored description and available instrument content
- [x] **Trivia Route** (`/songs/:id/trivia`)
  - Question flow, answer feedback, result, and explicit unavailable/fallback state
- [ ] **Complete Database-Backed Content Management**
  - Add end-to-end question/instrument/lesson authoring and guaranteed per-song content

---

### 🌍 Public Task 3 — Interactive Learning *(Shermaine)*

**Original Objective:** Provide culturally relevant learning, instrument interaction, guided practice, and achievement feedback.

**Current Status:** **Partially implemented** because much learning content is application/static data rather than a complete database authoring workflow.

- [x] **Learning Hub** (`/learning`)
- [x] **Heritage Vault** (`/learning/heritage-vault`)
- [x] **Instrument Discovery Lab** (`/learning/instrument-lab`)
  - Real sample maps, attribution fields, playback controls, and graceful fallback
- [x] **Guided Music Lessons** (`/learning/guided-lessons`)
  - Instrument → song → difficulty flow and free-play keyboard
- [x] **Instrument Challenges**
  - Persist authenticated challenge completion
- [x] **Badges and Keepsakes**
  - Login streak, reflection, playground, and song-exploration awards
- [ ] **Complete Database Authoring Workflow**
  - Replace remaining static/fallback lesson content where required

---

### 🌍 Public Task 4 — Rhythm Game & Reflection Wall *(Ferlyn)*

**Original Objective:** Deliver interactive rhythm play, registered score persistence, community reflection, and creator moderation.

**Current Status:** **Implemented**.

- [x] **Rhythm Game** (`/game/:songId`)
  - `EASY`, `MEDIUM`, and `HARD`; keyboard/touch play; score, accuracy, combo, and rank
- [x] **Creator Beatmaps**
  - AI/fallback generation, preview, timing offset, publish/unpublish, and draft deletion
- [x] **Score Persistence and Results**
  - JWT-derived registered identity, personal results/bests, leaderboard, profile summary, and idempotent guest claim
- [x] **Reflection Wall** (`/reflections`)
  - Guest/registered submission, anonymous/profile display, tags, pending moderation, and owner edit/delete
- [x] **Discussion and Likes**
  - Authenticated comments, removal/restore behavior, and one like per user/reflection
- [x] **Reflection Moderation** (`/creator/reflections`)
  - Creator-owned-song scope; administrator platform scope; approval, flagging, rejection, notes, and warnings

---

## Phase 2 — Integration & Testing

**Objective:** Connect feature branches to one canonical lifecycle, authorization model, navigation system, and persistent schema.

### Tasks

**Lifecycle & Ownership Integration**
- [x] Preserve one Song UUID across Studio, generation, beatmaps, preview, and public display
- [x] Enforce multi-creator ownership through `songs.creator_id`
- [x] Keep nested generation, moderation, folder, analytics, and beatmap actions owner-scoped
- [x] Separate creator-tool suspension from whole-account suspension

**Authentication & Onboarding Integration**
- [x] Registration OTP, resend, login, `/me`, reset, email change, OAuth, and token invalidation
- [x] Creator application draft/upload/submit/withdraw/history and administrator approval
- [x] Shared user/creator profiles, interests, privacy, and public representations

**Administration & Safety Integration**
- [x] Admin overview, users, creators/applications, content, community, and activity pages
- [x] Song reports, reflection safety, warnings, moderation actions, and audit logs
- [x] Folder and song-placement proposal APIs in the consolidated Admin Content experience

**Testing**
- [x] Backend Jest/Supertest coverage for major services and APIs
- [x] Frontend Vitest coverage for routes, pages, components, claims, and game utilities
- [x] Playwright coverage for navigation, link integrity, mobile refresh, discussions, and resilience
- [ ] Resolve current baseline failures in tests whose expectations lag present behavior

---

## Phase 3 — Final QA, Deployment & Submission

**Objective:** Verify production dependencies, complete submission documentation, and restrict remaining code work to release-critical fixes.

### Tasks

**Final QA**
- [x] Build the production frontend successfully
- [x] Verify internal Markdown links and route-link integrity
- [x] Confirm migration header edits do not change executable SQL
- [ ] Apply and verify all migrations against a clean PostgreSQL database
- [ ] Run complete deployed guest, registered-user, creator, and administrator smoke journeys
- [ ] Complete manual keyboard, screen-reader, contrast, and real-device checks

**External Services**
- [ ] Verify production SMTP delivery
- [ ] Verify configured Google and Apple OAuth origins/redirects
- [ ] Verify Cloudinary upload/deletion and OpenAI/DeepSeek provider behavior
- [ ] Verify final FFmpeg/yt-dlp generation without placeholder media

**Documentation & Submission**
- [x] Update High-Level Design against current routes, services, and migrations
- [x] Update implementation, use-case, ownership, authentication, schema, and route documents
- [x] Preserve individual journals and historical attribution
- [ ] Confirm items marked `Needs team confirmation`
- [ ] Decide whether ignored backup patch artifacts are required for submission

---

## Team Assignment Summary

| Feature | Owner | Phase 1 Branch |
|---------|-------|----------------|
| AI Video Generation Pipeline | Htet | `feat/Rose-task-1` |
| Song Experience & Consumption | Htet | `feat/public-task-2` |
| Creator Dashboard & Song Management | Shermaine | `feat/Rose-task-2` |
| Interactive Learning Playground | Shermaine | `feat/public-task-3` |
| Song Metadata & Publishing | Ferlyn | `feat/Rose-task-3` |
| Rhythm Game & Reflection Wall | Ferlyn | `feat/public-task-4` |
| Error Handling & Guest Architecture | Lia | `feat/Rose-task-4` |
| Song Discovery & Exploration | Lia | `feat/public-task-1` |

Current contribution notes:
- AI generation and Song Experience later received substantial Ferlyn lifecycle/Studio integration.
- Creator Dashboard and learning remain Shermaine-led with shared creator/profile integration.
- Rhythm and reflections remain Ferlyn-led, with early beatmap/score fixes shared with Htet.
- Lia's discovery, guest, settings, report, and account work received shared authentication/public integration from Ferlyn.
- Creator Applications, Admin, and Folders were later scope; original ownership needs team confirmation.

---

## Definition of Done

A feature is **Implemented** only when its current UI/API path, authorization rules, persistence behavior, validation, and reachable navigation exist in the repository.

- [x] Frontend UI is implemented and integrated with the required API or explicitly documented local/static source
- [x] Authentication and authorization are enforced where required
- [x] Loading, empty, error, and validation states exist for major flows
- [x] Current behavior is represented in automated tests, even where some baseline expectations now require correction
- [x] Feature is integrated into the current route and lifecycle model
- [ ] Production-dependent functionality is smoke-tested in the deployed environment

**Partially implemented** is used when a reachable feature depends on placeholder media, static/fallback content, incomplete external processing, or lacks an end-to-end authoring workflow. Planned or deprecated features are not marked complete.
