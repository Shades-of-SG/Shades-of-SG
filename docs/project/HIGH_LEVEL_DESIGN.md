# HIGH LEVEL DESIGN — Shades of SG

**Last updated:** 8 August 2026
**Document purpose:** Describe the current architecture, data design, API surface, repository structure, and deployment configuration of Shades of SG.

> **Current implementation note:** The React routes, Express routes and services, Sequelize models, and SQL migrations through `028` are the source of truth.
>
> - Song: `DRAFT -> GENERATING -> READY -> PUBLISHED -> ARCHIVED`.
> - GenerationJob: `QUEUED -> PROCESSING -> COMPLETED | FAILED`.
> - Studio keeps one creator-owned Song UUID through editing and generation.
> - Completion sets a Song to `READY`; publishing is explicit and owner/admin controlled.
> - Public song endpoints expose only `PUBLISHED` songs.
> - Guest rhythm results remain in browser storage until an authenticated claim.
> - Every reflection starts `PENDING`; creators moderate only their own songs and administrators have platform authority.
> - Final AI MP4 output can still use an explicitly labelled configured placeholder.

> SCCCI AI Challenge | Team: Unpaid Interns

---

## 1. System Architecture

Shades of SG follows a **Modular Monolith** architecture with a separate React/Vite single-page application and Express REST API. PostgreSQL on Supabase is the production database. SQLite is used for local development and tests where configured.

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Vercel)                           │
│                                                                    │
│  Public Experience     Registered User       Creator / Admin       │
│  Songs · Learning      Profile · Scores      Studio · Governance   │
│  Rhythm · Reflections  Settings · Badges     Analytics · Safety    │
│                                                                    │
│                    React 19 + Vite SPA                             │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ HTTPS / REST / multipart
                               │ VITE_API_URL
┌──────────────────────────────▼─────────────────────────────────────┐
│                         SERVER (Render)                            │
│                                                                    │
│  Express Routes → Middleware → Controllers → Domain Services       │
│                                                                    │
│  JWT / OTP / OAuth       Song & Generation       Admin & Safety    │
└───────────┬──────────────────────┬──────────────────────┬──────────┘
            │                      │                      │
     ┌──────▼──────┐       ┌───────▼───────┐      ┌──────▼──────┐
     │ PostgreSQL  │       │  Cloudinary   │      │ AI / Media  │
     │ Supabase    │       │ uploads/media │      │ providers   │
     │ Sequelize   │       │               │      │ FFmpeg      │
     └─────────────┘       └───────────────┘      └─────────────┘
```

### Architecture Principles

- **Decoupled SPA + API** — the frontend and backend are independently deployable.
- **Modular Monolith** — one Express application owns API routing, authorization, services, and persistence integration.
- **Server-Enforced Authorization** — frontend guards guide navigation, while the API reloads current User state and enforces role, account status, creator access, and `songs.creator_id` ownership.
- **Explicit Schema Management** — production startup calls `sequelize.authenticate()` only. Ordered SQL migrations are applied separately; startup does not run `sequelize.sync()`.
- **Role and Mode Separation** — guests, registered users, creators, and administrators have distinct access. Creator-tool suspension is separate from whole-account suspension.
- **Published-Only Public Content** — public song routes and dependent experiences require a `PUBLISHED` Song.
- **Persistent Creator Draft** — Studio creates one Song record and retains its UUID across metadata, generation, beatmap, preview, and publishing steps.
- **Traceable Administration** — warnings, moderation actions, and audit logs retain governance history.
- **Graceful Partial Content** — missing trivia, lesson, instrument, or generated-video content is reported honestly rather than fabricated.
- **Accessible and Responsive UI** — key components use semantic roles, labels, live regions, keyboard controls, responsive layouts, and reduced-motion behavior. This is not a formal WCAG certification.

Access is enforced as follows:

| Actor | Access Summary |
|--------|----------------|
| Guest | Browse published songs, public profiles, learning content, Rhythm Game, leaderboard, and approved reflections; submit a pending guest reflection; retain a temporary rhythm result |
| Registered User | Guest access plus profile/settings, persisted scores, bookmarks, reports, likes/comments, badges, and creator application |
| Creator | Separate creator mode for Dashboard, Studio, songs, generation jobs, video editing, beatmaps, creator profile, and owner-scoped reflection moderation |
| Administrator | Platform overview, analytics, users, creators, applications, content, folders, safety reports, warnings, suspensions, and audit activity |

### AI Video Generation Pipeline

```
Creator creates or opens Song DRAFT
                │
                ▼
Metadata + media + lyrics stored against one Song UUID
                │
                ├── Whisper transcription (optional/configured)
                ├── DeepSeek section recommendations (optional/configured)
                └── Creator validates formatted lyrics and sections
                │
                ▼
GenerationJob QUEUED → PROCESSING
                │
                ├── Scene plan created from song/lyrics/timestamps
                ├── Frames generated or reused for repeated sections
                ├── Creator may regenerate individual frames
                └── Subtitles and media assembled for export
                │
        ┌───────┴────────┐
        ▼                ▼
   COMPLETED           FAILED
   Song READY          Error retained
        │
        ▼
Creator reviews publish readiness
        │
        ▼
Explicit publish → Song PUBLISHED → public experiences
```

Final dependable AI MP4 generation remains **partially implemented** because deployed environments may use the labelled `PLACEHOLDER_VIDEO_URL`. Generation never publishes automatically.

---

## 2. Database Schema (SQL)

> Production tables use UUID identifiers and foreign keys. Most entity tables include `created_at` and `updated_at`. Exact columns, defaults, indexes, deletion behavior, migration chronology, and model differences are documented in [DATABASE_SCHEMA_OVERVIEW.md](DATABASE_SCHEMA_OVERVIEW.md).

### Core Tables

```sql
-- Users: credentials, role, account state, creator-tool state, verification, streaks
users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) CHECK (role IN ('ADMIN', 'CREATOR', 'REGISTERED')),
    account_status VARCHAR(32) CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
    creator_access_status VARCHAR(32) CHECK (creator_access_status IN ('ACTIVE', 'SUSPENDED')),
    email_verified_at TIMESTAMPTZ,
    email_verification_required BOOLEAN NOT NULL,
    auth_version INTEGER NOT NULL
);

-- Songs: creator-owned source and published content
songs (
    id UUID PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    languages JSONB NOT NULL,
    mood_tags JSONB NOT NULL,
    raw_lyrics TEXT,
    transcription_segments JSONB,
    section_recommendations JSONB,
    audio_url TEXT,
    video_url TEXT,
    cover_image_url TEXT,
    duration_secs INTEGER,
    status VARCHAR(32) CHECK (status IN ('DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED')),
    published_date TIMESTAMPTZ
);

-- Shared and creator-specific profile data
user_profiles (user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, ...);
creator_public_profiles (user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, ...);

-- Creator onboarding and status history
creator_applications (id UUID PRIMARY KEY, user_id UUID REFERENCES users(id), status VARCHAR(32), ...);
creator_application_history (id UUID PRIMARY KEY, application_id UUID REFERENCES creator_applications(id), ...);
```

### Gamification & Community Tables

```sql
game_scores (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    accuracy DOUBLE PRECISION,
    max_combo INTEGER NOT NULL,
    rank VARCHAR(8),
    difficulty VARCHAR(32),
    claim_id UUID
);

rhythm_beatmaps (
    beatmap_id UUID PRIMARY KEY,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    difficulty VARCHAR(16) NOT NULL,
    version INTEGER NOT NULL,
    notes JSONB NOT NULL,
    generation_source VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL,
    published_at TIMESTAMPTZ
);

reflections (id UUID PRIMARY KEY, user_id UUID, song_id UUID NOT NULL, display_mode VARCHAR(32), content TEXT, status VARCHAR(32), ...);
reflection_comments (id UUID PRIMARY KEY, reflection_id UUID, user_id UUID, content TEXT, status VARCHAR(16), ...);
reflection_likes (reflection_id UUID, user_id UUID, PRIMARY KEY (reflection_id, user_id));
song_reports (id UUID PRIMARY KEY, user_id UUID, song_id UUID, reason VARCHAR(32), status VARCHAR(32), ...);

badges (id UUID PRIMARY KEY, user_id UUID, name VARCHAR(255), earned_at TIMESTAMPTZ, ...);
badge_definitions (id UUID PRIMARY KEY, name VARCHAR(255) UNIQUE, category VARCHAR(64), image_key VARCHAR(64), ...);
instrument_challenge_progress (id UUID PRIMARY KEY, user_id UUID, challenge_id VARCHAR(64), ...);
song_explorations (id UUID PRIMARY KEY, user_id UUID, song_id UUID, ...);
```

### Trivia Tables

```sql
trivia_questions (
    id UUID PRIMARY KEY,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    type VARCHAR(32) NOT NULL,
    options JSONB NOT NULL,
    correct_answer VARCHAR(255) NOT NULL
);

trivia_attempts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    question_id UUID NOT NULL REFERENCES trivia_questions(id) ON DELETE CASCADE,
    selected_answer VARCHAR(255) NOT NULL,
    is_correct BOOLEAN NOT NULL
);
```

The Trivia UI and schema exist, but per-song data can be unavailable or supplied by explicit frontend fallback content. A complete database-backed authoring workflow is not implemented.

### AI Generation Tables

```sql
generation_jobs (
    id UUID PRIMARY KEY,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    status VARCHAR(32) CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

scene_segments (
    id UUID PRIMARY KEY,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    start_time DOUBLE PRECISION NOT NULL,
    end_time DOUBLE PRECISION NOT NULL,
    lyrics TEXT,
    emotion VARCHAR(255),
    visual_prompt TEXT NOT NULL
);

generated_frames (
    id UUID PRIMARY KEY,
    scene_segment_id UUID NOT NULL REFERENCES scene_segments(id) ON DELETE CASCADE,
    prompt_hash VARCHAR(255),
    cloudinary_id VARCHAR(255),
    image_url TEXT NOT NULL,
    frame_order INTEGER NOT NULL
);
```

Additional supporting tables cover sessions, OTPs, OAuth identities, instruments, song-instrument links, lessons, bookmarks, folders, placements/proposals, analytics events, warnings, moderation actions, and audit logs.

---

## 3. API Endpoints

> Base URL: `VITE_API_URL`. Protected routes require `Authorization: Bearer <JWT>`. Endpoint tables list the current mounted route groups rather than obsolete planning routes.

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/auth/config` | Public | Return enabled OAuth-provider configuration |
| `POST` | `/api/auth/register` | Public | Register a `REGISTERED` user and initiate verification when required |
| `POST` | `/api/auth/verify-email` | Public/rate-limited | Verify registration OTP |
| `POST` | `/api/auth/resend-verification` | Public/rate-limited | Resend registration OTP |
| `POST` | `/api/auth/login` | Public/rate-limited | Authenticate and return JWT |
| `POST` | `/api/auth/oauth/google` | Public | Verify configured Google identity |
| `POST` | `/api/auth/oauth/apple` | Public | Verify configured Apple identity |
| `GET` | `/api/auth/me` | JWT | Restore current user and account state |
| `POST` | `/api/auth/password-reset/request` | Public | Send password-reset OTP |
| `POST` | `/api/auth/password-reset/verify` | Public | Verify reset OTP and issue reset session |
| `POST` | `/api/auth/password-reset/complete` | Public | Set a strong replacement password |
| `POST` | `/api/auth/email-change/*` | JWT | Request, verify, and complete email change |
| `DELETE` | `/api/auth/account` | JWT | Hard-delete own account after password verification |

### Songs (`/api/songs`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/songs` | Optional JWT | List published songs with search/filter/sort |
| `GET` | `/api/songs/:id` | Public | Get one published song experience |
| `GET` | `/api/songs/creator` | Creator JWT | List the authenticated creator's songs |
| `GET` | `/api/songs/creator/:id` | Creator JWT/owner | Get owned draft or published song |
| `POST` | `/api/songs` | Creator JWT | Create draft and optionally upload audio |
| `PUT` | `/api/songs/:id/metadata` | Creator JWT/owner | Update metadata and lyrics |
| `POST` | `/api/songs/:id/sections/recommend` | Creator JWT/owner | Generate song-section recommendations |
| `PUT` | `/api/songs/:id/sections` | Creator JWT/owner | Validate and save formatted sections |
| `POST` | `/api/songs/:id/audio|video|cover` | Creator JWT/owner | Upload managed media |
| `GET` | `/api/songs/:id/readiness` | Creator JWT/owner | Derive publish readiness |
| `PUT` | `/api/songs/:id/publish|unpublish|archive|unarchive` | Creator JWT/owner | Apply lifecycle action |
| `PUT` | `/api/songs/:id/bookmark` | JWT | Toggle bookmark |
| `POST` | `/api/songs/:id/report` | JWT | Report published song |
| `DELETE` | `/api/songs/:id` | Creator JWT/owner | Delete song when lifecycle permits |

### AI Generation (`/api/generation`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/generation` | Creator JWT | List owned jobs |
| `POST` | `/api/generation/start` | Creator JWT/owner | Start one generation job |
| `GET` | `/api/generation/:id/status` | Creator JWT/owner | Poll job state |
| `POST` | `/api/generation/frame/:frameId/regenerate` | Creator JWT/owner | Regenerate an owned frame |
| `POST` | `/api/generation/:jobId/export` | Creator JWT/owner | Export assembled video |
| `DELETE` | `/api/generation/:id` | Creator JWT/owner | Delete an eligible job |

### Reflections (`/api/reflections`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/reflections` | Optional JWT | List approved public reflections |
| `POST` | `/api/reflections` | Optional JWT | Submit pending guest or user reflection |
| `GET` | `/api/reflections/mine` | JWT | List own reflections |
| `PUT` | `/api/reflections/:id` | JWT/owner | Edit own reflection |
| `DELETE` | `/api/reflections/:id` | JWT/owner or moderator | Delete permitted reflection |
| `GET/POST` | `/api/reflections/:id/comments` | Optional/JWT | List or add discussion comments |
| `POST/DELETE` | `/api/reflections/:id/like` | JWT | Add or remove like |
| `GET` | `/api/reflections/moderation` | Creator/Admin JWT | Get scoped moderation queue |
| `PUT` | `/api/reflections/:id/moderation` | Creator owner/Admin | Approve, flag, or reject |
| `POST` | `/api/reflections/:id/warn` | Creator owner/Admin | Issue warning with authorization |

### Trivia (`Song Experience`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| Client route | `/songs/:id/trivia` | Public | Render current per-song trivia/fallback experience |
| Analytics | `/api/analytics/events` | Optional JWT | Record supported trivia start/completion events |

There is no mounted standalone `/api/trivia` router in the current server. Database tables remain for question/attempt data.

### Game Scores (`/api/scores`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/scores` | Optional JWT | Save registered score or claim validated guest result |
| `GET` | `/api/scores/mine` | JWT | List own results |
| `GET` | `/api/scores/best` | JWT | Return personal bests |
| `GET` | `/api/scores/leaderboard` | Optional JWT | Return ranked results |
| `GET` | `/api/scores/user/:userId/summary` | Optional JWT | Return privacy-aware profile summary |

### Instruments (`/api/instruments` and `/api/instrument-playground`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/instruments/lab-samples` | Public | Return current Instrument Lab sample maps |
| `GET` | `/api/instrument-playground/challenges/progress` | JWT | Get challenge progress |
| `POST` | `/api/instrument-playground/challenges/:challengeId/complete` | JWT | Persist challenge completion |

### Lessons (`Frontend Learning Routes`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| Client route | `/learning` | Public | Learning Hub |
| Client route | `/learning/heritage-vault` | Public | Heritage content |
| Client route | `/learning/instrument-lab` | Public | Instrument Discovery Lab |
| Client route | `/learning/guided-lessons` | Public | Guided lesson experience |

The `lessons` table and model exist, but there is no mounted standalone lessons API or complete authoring workflow.

### Badges (`/api/badges`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/badges/catalog` | JWT | Return canonical badge definitions |
| `GET` | `/api/badges/:userId` | JWT | Return earned badges subject to profile rules |

Administrator, creator-application, creator-profile, user-profile, folder, beatmap, analytics, transcription, and stats endpoints are documented by their current Express route files and [ROUTE_INVENTORY.md](../reference/ROUTE_INVENTORY.md).

---

## 4. Folder Structure

```
Shades-of-SG/
│
├── backend/
│   ├── config/                  # Database, Cloudinary, rhythm configuration
│   ├── controllers/             # Song, generation, beatmap and instrument handlers
│   ├── middleware/              # JWT/role guards, rate limits, errors, UUID checks
│   ├── migrations/              # Ordered forward-only PostgreSQL migrations
│   ├── models/                  # Sequelize models and associations
│   ├── routes/                  # Mounted REST endpoint groups
│   ├── services/                # Auth, AI, media, profiles, scores, badges and auditing
│   ├── scripts/                 # Development seed/export utilities
│   ├── tests/                   # Jest/Supertest integration and service tests
│   └── server.js                # Express app and production startup
│
├── frontend/
│   ├── e2e/                     # Playwright navigation/resilience tests
│   ├── public/                  # Images, icons and placeholder videos
│   └── src/
│       ├── components/          # Shared, admin, profile, Studio and game UI
│       ├── context/             # Authentication and session state
│       ├── data/                # Static/fallback learning content
│       ├── game/                # Rhythm loading, rendering, scoring and results
│       ├── hooks/               # Playback, progress and reusable behavior
│       ├── layouts/             # Public, auth, creator and admin shells
│       ├── pages/               # Route-level experiences
│       ├── services/            # API clients and safe post-login flows
│       ├── utils/               # Validation, timing and display helpers
│       └── App.jsx              # Authoritative frontend route map
│
├── docs/
│   ├── project/                 # Current design, phases, use cases, ownership and schema
│   ├── guides/                  # Authentication and testing guides
│   ├── reference/               # Route inventory
│   ├── audits/                  # Historical audit/integration evidence
│   ├── planning/                # Earlier planning records
│   ├── journals/                # Team and individual AI-development records
│   └── archive/                 # Superseded but preserved documents
│
├── package.json                 # Root development, test, lint and format commands
└── README.md                    # Setup, deployment and current limitations
```

---

## 5. Environment Variables

### Backend (Render)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase/PostgreSQL connection; omit for local SQLite |
| `DB_SSL` | Disable only for PostgreSQL environments without SSL |
| `DB_STORAGE` | Local SQLite file path |
| `AUTH_TOKEN_SECRET` / `JWT_SECRET` | JWT signing secret; mandatory in production |
| `OTP_IP_HASH_SECRET` | Hashing secret for OTP request-IP tracking |
| `FRONTEND_URL` | Exact production frontend origin allowed by CORS |
| `FRONTEND_URLS` | Optional comma-separated additional exact origins |
| `FRONTEND_URL_PATTERNS` | Optional narrow HTTPS preview-origin patterns |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | SMTP transport settings |
| `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Email-delivery credentials and sender |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `OPENAI_API_KEY` | Whisper transcription and configured OpenAI features |
| `OPENAI_TRANSCRIPTION_MODEL` | Timestamp-capable transcription model, normally `whisper-1` |
| `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL` | Song-section and beatmap JSON generation |
| `YT_DLP_PATH` | Optional yt-dlp executable path |
| `PLACEHOLDER_VIDEO_URL` | Explicit temporary video used while final generation is incomplete |
| `GOOGLE_CLIENT_ID` | Enables verified Google sign-in when configured |
| `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` | Apple web identity configuration |
| `APPLE_PRIVATE_KEY`, `APPLE_REDIRECT_URI` | Apple client-secret and return configuration |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` | Optional first-administrator bootstrap; remove password after use |

### Frontend (Vercel)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API base URL including `/api` |

Copy the provided `.env.example` files and keep real credentials outside Git. See [AUTHENTICATION_SETUP.md](../guides/AUTHENTICATION_SETUP.md) and the root README for operational steps.
