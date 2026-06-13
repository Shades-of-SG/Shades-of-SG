# PROJECT IMPLEMENTATION PHASES — Shades of SG

> SCCCI AI Challenge | Team: Unpaid Interns | Timeline: 13 June – 13 July 2025

---

## Timeline Overview

```
Jun 13 ──────────────────────────────────────────────── Jul 13
  │                                                         │
  ├─ Phase 0 ─┤
  │ Foundation  │
  │ Jun 13–15   │
  │             ├────────── Phase 1 ──────────┤
  │             │  Core Feature Build          │
  │             │  Jun 16 – Jul 6             │
  │             │                             ├─ Phase 2 ─┤
  │             │                             │ Integration │
  │             │                             │ Jul 7–11   │
  │             │                             │             ├ Phase 3 ┤
  │             │                             │             │ Polish  │
  │             │                             │             │ Jul12–13│
```

| Phase | Name | Dates | Duration |
|-------|------|-------|----------|
| **Phase 0** | Foundation, Setup & Wireframes | Jun 13 – Jun 15 | 3 days |
| **Phase 1** | Core Feature Build | Jun 16 – Jul 6 | 21 days |
| **Phase 2** | Integration & Testing | Jul 7 – Jul 11 | 5 days |
| **Phase 3** | Polish, Deployment & Submission | Jul 12 – Jul 13 | 2 days |

---

## Phase 0 — Foundation, Setup & Wireframes

**Dates:** 13 June – 15 June (3 days)

**Objective:** Establish shared infrastructure, tooling, and conventions before any feature work begins. Produce Figma wireframes for all key screens so every developer has a visual reference before writing a single component. Every team member leaves Phase 0 with a working local dev environment and zero blockers.

### Tasks

**Repository & Project Structure**
- [ ] Create GitHub organisation and `Shades-of-SG` monorepo
- [ ] Scaffold `/backend` (Express + Sequelize boilerplate) and `/frontend` (Vite + React)
- [ ] Configure ESLint + Prettier rules matching naming conventions (PascalCase components, camelCase utilities, UPPER_SNAKE_CASE constants)
- [ ] Add `.env.example` files for both frontend and backend
- [ ] Set up branch protection on `main`; agree on branch naming (`feat/`, `fix/`, `chore/`)

**Database & Cloud Provisioning**
- [ ] Create Supabase project; provision PostgreSQL instance
- [ ] Run initial migration to create all tables (Users, Sessions, Songs, Instruments, Lessons, GameScores, Reflections, Badges, TriviaQuestions, TriviaAttempts, GenerationJobs, SceneSegments, GeneratedFrames, SongInstruments)
- [ ] Create Cloudinary account; note API credentials
- [ ] Configure Render service (backend) and Vercel project (frontend) — even if initially empty

**Shared Boilerplate**
- [ ] Wire Sequelize to Supabase; verify connection via `sequelize.authenticate()`
- [ ] Create all 14 Sequelize model files with associations (`hasMany`, `belongsTo`, `belongsToMany`)
- [ ] Set up Express server with global error handler middleware and health-check route (`GET /api/health`)
- [ ] Configure Vite proxy (`/api → backend`) in `vite.config.js`
- [ ] Initialise Vitest + Jest; confirm test runner executes a dummy test
- [ ] Add `AuthContext` and `SessionContext` shells in frontend

**Figma Wireframes**
- [ ] Set up shared Figma project with a design system (colours, typography, spacing tokens)
- [ ] **Creator Portal screens:** Login, Dashboard (song grid), Studio (metadata form), AI Generation progress view
- [ ] **Public Experience screens:** Landing page, Songs Library (with filter bar), Song Experience (video player + summary + instrument grid), Trivia Quiz, Instrument Playground, Rhythm Game, Reflection Wall
- [ ] Annotate each wireframe with component names matching the folder structure (`VideoPlayer.jsx`, `InstrumentCard.jsx`, etc.)
- [ ] Share Figma link in the repo `README.md` before Phase 1 starts

**Documentation Baseline**
- [ ] Finalise `HIGH_LEVEL_DESIGN.md` (architecture, schema, API endpoints, folder structure)
- [ ] Log initial Claude AI prompts used for design decisions

---

## Phase 1 — Core Feature Build

**Dates:** 16 June – 6 July (21 days)

**Objective:** Build all eight task features in parallel isolation. Each developer owns their routes, controllers, services, models, and page components end-to-end. By the end of Phase 1 every feature must be individually functional, even if cross-feature integration is incomplete.

---

### 🟪 Violet Task 1 — AI Music Video Generation *(Htet)*

**Dates:** Jun 16 – Jul 6

**Objective:** Deliver a working end-to-end AI pipeline from audio upload to playable MP4 stored in Cloudinary.

- [ ] **Audio Ingestion**
  - `POST /api/songs` — accept MP3/WAV uploads (max 50 MB), validate file type and size
  - Extract audio from YouTube URLs via `youtubeService.js`
  - Calculate audio duration; store media in Cloudinary; persist `audio_url` in `songs` table
- [ ] **Scene Planning**
  - `aiScenePlanner.js` — send lyrics + duration + theme to LLM; receive timestamped JSON scene plan
  - Persist each segment to `scene_segments` table (start_time, end_time, lyrics, emotion, visual_prompt)
- [ ] **Frame Generation**
  - `frameGenerator.js` — iterate segments; call text-to-image API per visual_prompt
  - Implement chorus-caching: hash repeated lyric blocks; reuse existing `generated_frames` rows
  - Upload frames to Cloudinary; persist `cloudinary_id` and `image_url` in `generated_frames`
- [ ] **Video Assembly**
  - `videoAssembler.js` — stitch audio + ordered image frames into MP4
  - `subtitleGenerator.js` — parse lyric timestamps; burn karaoke-style subtitles onto video
  - Store final video URL in `songs.video_url`
- [ ] **Generation Status**
  - `GenerationJob` lifecycle: `NOT_STARTED → IN_PROGRESS → COMPLETED / FAILED`
  - `GET /api/songs/:id/generate/status` — pollable endpoint; store `error_message` on failure
- [ ] Write unit tests for `aiScenePlanner`, `frameGenerator`, `videoAssembler`

---

### 🟪 Violet Task 2 — Creator Dashboard & Song Management *(Shermaine)*

**Dates:** Jun 16 – Jul 6

**Objective:** Deliver a fully functional creator portal with authentication, song grid, and delete flows.

- [ ] **Auth Setup**
  - `POST /api/auth/register` — hash password with bcrypt; return JWT (24 h expiry)
  - `POST /api/auth/login` — validate credentials; return JWT
  - `authMiddleware.js` — verify JWT on all creator routes
- [ ] **Dashboard UI** (`Dashboard.jsx`)
  - Song grid displaying title, theme, status badge, generation status
  - Filter/sort controls for theme and publish status
  - Link to Studio page per song
- [ ] **Generation Status Display**
  - Poll `GET /api/songs/:id/generate/status` on interval; display `NOT_STARTED / IN_PROGRESS / COMPLETED / FAILED` badge
  - No full-page refresh required
- [ ] **Song Deletion**
  - `DELETE /api/songs/:id` — cascade: delete `scene_segments`, `generated_frames`, `song_instruments`, `lessons`, `trivia_questions`; call `cloudinaryService.delete()` for all associated media
- [ ] Write unit tests for auth flows and delete cascade

---

### 🟪 Violet Task 3 — Song Metadata & Publishing *(Ferlyn)*

**Dates:** Jun 16 – Jul 6

**Objective:** Give creators full control over song metadata and a reliable publish/unpublish toggle.

- [ ] **Metadata Forms** (`Studio.jsx`)
  - Fields: title, artist, theme, language, raw lyrics (Tiptap rich text), mood tags, description
  - `PUT /api/songs/:id/metadata` — validate all fields; persist to `songs` table
- [ ] **Publishing Engine**
  - `PUT /api/songs/:id/publish` — transactional toggle: `DRAFT ↔ PUBLISHED`
  - Set `published_date` when transitioning to `PUBLISHED`; nullify on revert
  - Only `PUBLISHED` songs appear in public `GET /api/songs` responses
- [ ] **Input Validation**
  - Validate `req.body` for all metadata and publish routes; return HTTP 400 with descriptive messages on failure
- [ ] Write unit tests for metadata update and publish toggle (happy path + edge cases)

---

### 🟪 Violet Task 4 — Global Error Handling & Guest Architecture *(Lia)*

**Dates:** Jun 16 – Jul 6

**Objective:** Make the application resilient to failures and support stateless guest sessions.

- [ ] **Global Error Boundary (Backend)**
  - Centralized Express error handler in `server.js`; all controllers pass errors via `next(error)`
  - Exponential backoff + retry logic in `rateLimiter.js` for AI API HTTP 429 responses
- [ ] **Password Reset**
  - `POST /api/auth/forgot-password` — generate time-limited reset token; send via email
  - `POST /api/auth/reset-password` — validate token; update `password_hash`
- [ ] **Guest Session Architecture**
  - `SessionContext.jsx` — initialize guest session in `localStorage` on first visit
  - Guest state: anonymous trivia scores, ephemeral rhythm game scores (not persisted to DB)
  - Guest users cannot access creator routes
- [ ] **Frontend Error Boundaries**
  - Wrap all page routes in React error boundary components
  - Network error UI: retry button, fallback state
- [ ] Write unit tests for error handler and guest session initialization

---

### 🌍 Public Task 1 — Song Discovery & Exploration *(Lia)*

**Dates:** Jun 16 – Jul 6

**Objective:** Build the public-facing entry point and a responsive, multi-parameter search experience.

- [ ] **Landing Page** (`/` route)
  - Hero section introducing Shades of SG
  - Session initialization (detect guest vs registered)
  - CTA links to Songs Library
- [ ] **Songs Library** (`/songs` route)
  - `GET /api/songs?theme=&mood=&language=` — multi-parameter filter with debounced search bar
  - Sequelize `WHERE` clause built dynamically from query params
  - Song cards: cover image (from first generated frame), title, artist, theme badge
- [ ] Write unit tests for filter query builder (single param, multi-param, empty)

---

### 🌍 Public Task 2 — Song Experience & Content Consumption *(Htet)*

**Dates:** Jun 16 – Jul 6

**Objective:** Build the full immersive song viewing experience with video playback, AI summaries, instrument grid, and trivia.

- [ ] **Video Player** (`VideoPlayer.jsx`)
  - HTML5 custom player: play/pause, progress scrub, volume, playback speed, fullscreen
  - Subtitle toggle (CC); synchronized subtitle rendering from lyric timestamps
- [ ] **Cultural Summary** — render AI-generated description from `songs.description`; formatted educational layout
- [ ] **Instrument Grid** (`InstrumentCard.jsx`)
  - Image, name, origin, description per instrument
  - "Play Sample" button triggering 3–5 s audio from `instruments.audio_url`
  - Data from `GET /api/songs/:id/instruments`
- [ ] **Trivia Quiz** (`TriviaHub.jsx`)
  - 5–10 questions (multiple choice + true/false)
  - Immediate correct/incorrect feedback per question
  - Final percentage score + retry button
  - Save score via `POST /api/trivia/attempts` for registered users
- [ ] Write unit tests for trivia scoring logic and subtitle sync utility

---

### 🌍 Public Task 3 — Interactive Learning *(Shermaine)*

**Dates:** Jun 16 – Jul 6

**Objective:** Build keyboard-driven instrument playground, guided lessons, and historical timelines.

- [ ] **Instrument Playground**
  - Map keyboard keys (Q, W, E, R, T…) to instrument audio notes (Guzheng, Erhu, etc.)
  - `keydown` event listeners trigger audio playback via Web Audio API
  - Visual key-highlight feedback on press
- [ ] **Guided Lessons**
  - Step-by-step lesson viewer from `GET /api/lessons?song_id=`
  - Progress tracker (steps completed / total); persist for registered users
- [ ] **Historical Timeline**
  - Responsive vertical/horizontal timeline component per song or theme
  - Data sourced from song metadata and curated lesson content
- [ ] Write unit tests for keyboard mapping and lesson progress state

---

### 🌍 Public Task 4 — Rhythm Game & Reflection Wall *(Ferlyn)*

**Dates:** Jun 16 – Jul 6

**Objective:** Deliver an engaging rhythm game and a full CRUD community reflection wall.

- [ ] **Rhythm Game**
  - Canvas/DOM-based falling notes synced to song audio timestamps
  - Hit detection: accuracy %, combo streaks, final score
  - Three difficulty levels (Easy, Medium, Hard)
  - Save score via `POST /api/scores` for registered users; localStorage for guests
- [ ] **Reflection Wall** (`MemoryWall.jsx`)
  - `GET /api/reflections?song_id=` — display approved community posts
  - `POST /api/reflections` — submit reflection (anonymous guest or named registered)
  - Registered users: `PUT /api/reflections/:id` (edit), `DELETE /api/reflections/:id` (own posts)
  - Creator moderation: flag (`PUT /api/reflections/:id/flag`), delete any post
- [ ] Write unit tests for reflection CRUD (happy path + anonymous vs named + moderation)

---

## Phase 2 — Integration & Testing

**Dates:** 7 July – 11 July (5 days)

**Objective:** Connect all eight tasks into a cohesive, end-to-end working application. Fix cross-feature bugs, complete the test suite, and confirm everything works in the deployed environment. This phase is time-boxed — prioritise blockers and integration bugs over new features.

### Tasks

**Cross-Feature Integration (Jul 7–8)**
- [ ] Wire Creator Dashboard → Studio → AI Generation pipeline end-to-end (Violet 1 + 2 + 3)
- [ ] Confirm publish toggle exposes songs to public library correctly (Violet 3 → Public Task 1)
- [ ] Integrate guest vs registered session state across all public pages (Violet 4 + all Public Tasks)
- [ ] Verify Reflection Wall moderation flow works from creator dashboard (Violet 2 + Public Task 4)
- [ ] Confirm trivia attempt and rhythm game score persistence for registered users (Public Task 2 + 4)

**Testing (Jul 8–9) — target: 80% coverage minimum**
- [ ] Complete unit tests for every controller (happy path + validation error + auth/authorization)
- [ ] Integration tests for full AI generation pipeline (mock external APIs)
- [ ] Ensure 100% passing tests across all personal feature assignments
- [ ] Run full test suite; fix all failures before Phase 3

**Deployment & Smoke Testing (Jul 9–10)**
- [ ] Deploy backend to Render with all environment variables set
- [ ] Deploy frontend to Vercel with `VITE_API_URL` pointing to Render
- [ ] Smoke-test all critical API endpoints in production
- [ ] Verify Cloudinary uploads and deletions work in production
- [ ] Confirm CORS is locked to Vercel URL only

**Bug Fixes & Code Quality (Jul 10–11)**
- [ ] Resolve any N+1 query issues (add Sequelize `include` eager loading where missing)
- [ ] Audit all `useEffect` hooks for missing dependency arrays
- [ ] Confirm all monolithic components > 150 lines are decomposed
- [ ] Validate all inputs: every route has validation middleware returning HTTP 400 on failure
- [ ] Review all async controllers for `try/catch` wrapping + `next(error)` propagation

**AI Prompt Log**
- [ ] All team members compile and clean AI prompt logs from Phase 1 + 2
- [ ] Draft analytical reflection document on AI usage and iteration strategy

---

## Phase 3 — Final QA, Deployment & Submission

**Dates:** 12 July – 13 July (2 days)

**Objective:** Freeze the codebase, do a final end-to-end walkthrough in production, complete all documentation, and submit. No new features — only critical bug fixes.

### Tasks

**Final QA (Jul 12)**
- [ ] Full regression walkthrough of all three user journeys in production:
  - Creator: upload → generate → publish
  - Guest: browse → watch → trivia → anonymous reflection
  - Registered: login → save scores → named reflection
- [ ] Verify AI generation status polling works without page refresh
- [ ] Confirm exponential backoff handles AI API rate limits in production
- [ ] Fix any critical bugs found — scope limited to breaking issues only

**Documentation & Submission (Jul 13)**
- [ ] Finalize `HIGH_LEVEL_DESIGN.md` to reflect any schema/API changes made during build
- [ ] Update `README.md` with setup instructions, environment variable guide, and deployed URLs
- [ ] Complete AI prompt analytical reflection document
- [ ] Confirm 100% passing test suite
- [ ] Tag final release commit on `main`
- [ ] Submit GitHub repo link, deployed URLs (Render + Vercel), and all documentation

---

## Team Assignment Summary

| Feature | Owner | Phase 1 Branch |
|---------|-------|---------------|
| AI Video Generation Pipeline | Htet | `feat/violet-task-1` |
| Song Experience & Consumption | Htet | `feat/public-task-2` |
| Creator Dashboard & Auth | Shermaine | `feat/violet-task-2` |
| Interactive Learning Playground | Shermaine | `feat/public-task-3` |
| Song Metadata & Publishing | Ferlyn | `feat/violet-task-3` |
| Rhythm Game & Reflection Wall | Ferlyn | `feat/public-task-4` |
| Error Handling & Guest Architecture | Lia | `feat/violet-task-4` |
| Song Discovery & Exploration | Lia | `feat/public-task-1` |

---

## Definition of Done

A feature is **complete** only when all of the following are true:

- Frontend UI is implemented and integrated with backend APIs
- All applicable CRUD operations function correctly
- Input validation and error handling are implemented
- Authentication and authorization checks are enforced where required
- Unit tests are written and passing
- Feature is integrated into `main` and functions in the deployed environment
- Git commits are meaningful and traceable to feature development
