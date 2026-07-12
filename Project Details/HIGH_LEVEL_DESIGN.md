# HIGH LEVEL DESIGN — Shades of SG

> **Phase 8 authoritative integration note:** This section supersedes conflicting historical diagrams and examples later in this document.
>
> - Song: `DRAFT -> GENERATING -> READY -> PUBLISHED -> ARCHIVED`.
> - GenerationJob: `QUEUED -> PROCESSING -> COMPLETED | FAILED`.
> - Studio owns one creator-owned Song UUID through editing and generation.
> - Completion sets the Song to `READY` and never publishes it; publishing is explicit and owner-only.
> - Public Song endpoints and public Song experiences expose only `PUBLISHED` Songs.
> - Guest rhythm play creates no GameScore; registered scores use JWT identity.
> - Every reflection starts `PENDING`; creator moderation is required before public display.
> - Temporary MP4 media and duration-derived rhythm charts are MVP limitations. Missing learning content is reported as unavailable.
> - PostgreSQL applies migrations `001`–`006` in order. Startup uses non-destructive `sequelize.sync()` and seeds no content.

> SCCCI AI Challenge | Team: Unpaid Interns

---

## 1. System Architecture

Shades of SG follows a **Modular Monolith** architecture with a strict client-server separation. The frontend is a React + Vite SPA deployed on Vercel; the backend is a Node.js + Express REST API deployed on Render. Both communicate over HTTP/JSON with CORS enforced.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Vercel)                          │
│                                                                 │
│   ┌─────────────────────┐    ┌──────────────────────────────┐  │
│   │  Creator Dashboard  │    │     Public Experience        │  │
│   │  (Violet Portal)    │    │     (Trojan Horse App)       │  │
│   └─────────┬───────────┘    └────────────┬─────────────────┘  │
│             │  React + Vite (SPA)          │                    │
└─────────────┼──────────────────────────────┼────────────────────┘
              │ HTTPS / REST (VITE_API_URL)   │
┌─────────────▼──────────────────────────────▼────────────────────┐
│                       SERVER (Render)                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              Node.js + Express API                      │  │
│   │                                                         │  │
│   │   Routes → Middleware → Controllers → Services          │  │
│   └────────────────────────┬────────────────────────────────┘  │
│                            │                                    │
│   ┌──────────────────┐  ┌──┴──────────────┐  ┌─────────────┐  │
│   │   Supabase       │  │   Cloudinary    │  │  AI APIs    │  │
│   │  (PostgreSQL)    │  │  (File Storage) │  │ (LLM/Image) │  │
│   │  via Sequelize   │  └─────────────────┘  └─────────────┘  │
│   └──────────────────┘                                         │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │   YouTube (Video Hosting) │ Google Drive (Documents)     │ │
│   └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

- **Decoupled SPA + API** — Frontend and backend are independently deployable units.
- **Modular Monolith** — All backend logic lives inside one Express application. No microservices, event buses, or message brokers.
- **Async-First** — All I/O operations (database, AI calls, file uploads) use `async/await`.
- **AI Generation is Non-Blocking** — Long-running generation jobs run asynchronously. Clients poll generation status via dedicated endpoints.
- **Role-Based Access Control** — JWT guards creator routes; public routes are open; guest sessions are tracked via `localStorage`.

### AI Video Generation Pipeline

```
Song Uploaded
     │
     ▼
Metadata Stored (POST /api/songs)
     │
     ▼
Scene Plan Generated (LLM → timestamped JSON)
     │
     ▼
Frame Generation Queued (text-to-image API per segment)
     │   └── Caching: Repeated chorus lyrics reuse existing frames
     ▼
Generated Frames Stored in Cloudinary
     │
     ▼
Video Assembly Triggered (audio + frames + karaoke subtitles → MP4)
     │
     ▼
Final Video Artifact Stored
     │
     ▼
Status Updated → PUBLISHED (exposed to public endpoints)
```

Generation job statuses: `NOT_STARTED` → `IN_PROGRESS` → `COMPLETED` / `FAILED`

---

## 2. Database Schema (SQL)

> All tables use UUID primary keys, include `created_at` and `updated_at`, and enforce referential integrity via foreign keys. Soft deletes use `deleted_at`.

### Core Tables

```sql
-- Users (Registered users and Content Creators)
CREATE TABLE users (
    user_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),             -- bcrypt; NULL for guest-only sessions
    role        VARCHAR(50) DEFAULT 'registered', -- 'creator' | 'registered' | 'guest'
    interests   TEXT[],
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- Sessions (server-side session tracking)
CREATE TABLE sessions (
    session_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(user_id) ON DELETE CASCADE,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL
);

-- Songs (core content entity)
CREATE TABLE songs (
    song_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    artist          VARCHAR(255),
    theme           VARCHAR(100),
    language        VARCHAR(50),
    description     TEXT,
    raw_lyrics      TEXT,
    mood_tags       TEXT[],
    status          VARCHAR(50) DEFAULT 'DRAFT',   -- 'DRAFT' | 'PUBLISHED'
    video_url       VARCHAR(500),
    audio_url       VARCHAR(500),
    youtube_url     VARCHAR(500),
    duration_secs   INTEGER,
    published_date  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- Instruments
CREATE TABLE instruments (
    instrument_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    audio_url       VARCHAR(500),
    origin          VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Song ↔ Instrument (many-to-many)
CREATE TABLE song_instruments (
    song_id         UUID REFERENCES songs(song_id) ON DELETE CASCADE,
    instrument_id   UUID REFERENCES instruments(instrument_id) ON DELETE CASCADE,
    PRIMARY KEY (song_id, instrument_id)
);

-- Lessons
CREATE TABLE lessons (
    lesson_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id         UUID REFERENCES songs(song_id) ON DELETE SET NULL,
    instrument_id   UUID REFERENCES instruments(instrument_id) ON DELETE SET NULL,
    steps           JSONB,
    content         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Gamification & Community Tables

```sql
-- Game Scores
CREATE TABLE game_scores (
    score_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(user_id) ON DELETE CASCADE,
    song_id     UUID REFERENCES songs(song_id) ON DELETE CASCADE,
    difficulty  VARCHAR(50),
    score       INTEGER,
    accuracy    DECIMAL(5,2),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Reflections (Memory Wall)
CREATE TABLE reflections (
    reflection_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
    song_id         UUID REFERENCES songs(song_id) ON DELETE CASCADE,
    text            TEXT NOT NULL,
    author_name     VARCHAR(255),
    is_anonymous    BOOLEAN DEFAULT FALSE,
    tags            TEXT[],
    is_flagged      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- Badges
CREATE TABLE badges (
    badge_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(user_id) ON DELETE CASCADE,
    badge_name  VARCHAR(100) NOT NULL,
    earned_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Trivia Tables

```sql
-- Trivia Questions
CREATE TABLE trivia_questions (
    question_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id         UUID REFERENCES songs(song_id) ON DELETE CASCADE,
    question        TEXT NOT NULL,
    question_type   VARCHAR(50),    -- 'multiple_choice' | 'true_false'
    correct_answer  VARCHAR(255),
    options         JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Trivia Attempts
CREATE TABLE trivia_attempts (
    attempt_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
    song_id         UUID REFERENCES songs(song_id) ON DELETE CASCADE,
    score           INTEGER,
    completed_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### AI Generation Tables

```sql
-- Generation Jobs (async status tracking)
CREATE TABLE generation_jobs (
    generation_job_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id             UUID REFERENCES songs(song_id) ON DELETE CASCADE,
    status              VARCHAR(50) DEFAULT 'NOT_STARTED',
                        -- 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    error_message       TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Scene Segments (LLM-generated scene plan)
CREATE TABLE scene_segments (
    segment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id         UUID REFERENCES songs(song_id) ON DELETE CASCADE,
    start_time      DECIMAL(8,2) NOT NULL,
    end_time        DECIMAL(8,2) NOT NULL,
    lyrics          TEXT,
    emotion         VARCHAR(100),
    visual_prompt   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Frames (image outputs per segment)
CREATE TABLE generated_frames (
    frame_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id      UUID REFERENCES scene_segments(segment_id) ON DELETE CASCADE,
    image_url       VARCHAR(500),
    cloudinary_id   VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. API Endpoints

> Base URL: `VITE_API_URL` (Render backend). All protected routes require `Authorization: Bearer <JWT>`.

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new creator or user |
| `POST` | `/api/auth/login` | Public | Login; returns JWT |
| `POST` | `/api/auth/logout` | JWT | Invalidate session |
| `POST` | `/api/auth/forgot-password` | Public | Send password reset token |
| `POST` | `/api/auth/reset-password` | Public | Consume token; update password |

### Songs (`/api/songs`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/songs` | Public | List all published songs (filter by theme, mood, language) |
| `GET` | `/api/songs/:id` | Public | Get a single published song |
| `POST` | `/api/songs` | Creator JWT | Upload a new song (audio/YouTube) |
| `PUT` | `/api/songs/:id/metadata` | Creator JWT | Update lyrics, tags, and metadata |
| `PUT` | `/api/songs/:id/publish` | Creator JWT | Toggle DRAFT → PUBLISHED |
| `DELETE` | `/api/songs/:id` | Creator JWT | Delete song + cascade Cloudinary cleanup |

### AI Generation (`/api/songs/:id/generate`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/songs/:id/generate` | Creator JWT | Trigger full AI generation pipeline |
| `GET` | `/api/songs/:id/generate/status` | Creator JWT | Poll current generation job status |
| `GET` | `/api/songs/:id/segments` | Creator JWT | List scene segments (LLM scene plan) |
| `GET` | `/api/songs/:id/frames` | Creator JWT | List generated frames |

### Reflections (`/api/reflections`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/reflections?song_id=` | Public | List approved reflections for a song |
| `POST` | `/api/reflections` | Public/JWT | Submit a reflection (anonymous or named) |
| `PUT` | `/api/reflections/:id` | Owner JWT | Edit own reflection |
| `DELETE` | `/api/reflections/:id` | Owner/Creator JWT | Delete reflection |
| `PUT` | `/api/reflections/:id/flag` | Creator JWT | Flag reflection for review |

### Trivia (`/api/trivia`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/trivia?song_id=` | Public | Fetch trivia questions for a song |
| `POST` | `/api/trivia/attempts` | Public/JWT | Submit a trivia attempt + score |
| `GET` | `/api/trivia/attempts/:userId` | JWT | Get a user's trivia history |

### Game Scores (`/api/scores`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/scores` | JWT | Save rhythm game score |
| `GET` | `/api/scores?user_id=&song_id=` | JWT | Retrieve scores for user/song |

### Instruments (`/api/instruments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/instruments` | Public | List all instruments |
| `GET` | `/api/instruments/:id` | Public | Get single instrument (with audio sample) |
| `GET` | `/api/songs/:id/instruments` | Public | Get instruments linked to a song |

### Lessons (`/api/lessons`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/lessons?song_id=` | Public | List lessons for a song |
| `GET` | `/api/lessons/:id` | Public | Get lesson detail and steps |

### Badges (`/api/badges`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/badges/:userId` | JWT | Get all badges earned by user |
| `POST` | `/api/badges` | JWT | Award a badge to user |

---

## 4. Folder Structure

```
Shades-of-SG/
│
├── backend/
│   ├── package.json
│   ├── server.js                    # Express app entry point + global error handler
│   │
│   ├── config/
│   │   ├── database.js              # Sequelize + Supabase connection
│   │   └── environment.js           # Validated env variable exports
│   │
│   ├── middleware/
│   │   ├── authenticate.js          # JWT verification
│   │   ├── authorize.js             # Role-based access guard (creator / registered)
│   │   ├── validate.js              # Request body/params/query validation
│   │   └── rateLimiter.js           # Rate limiting for AI endpoints (handles HTTP 429)
│   │
│   ├── models/                      # Sequelize model definitions (PascalCase)
│   │   ├── User.js
│   │   ├── Session.js
│   │   ├── Song.js
│   │   ├── Instrument.js
│   │   ├── SongInstrument.js
│   │   ├── Lesson.js
│   │   ├── GameScore.js
│   │   ├── Reflection.js
│   │   ├── Badge.js
│   │   ├── TriviaQuestion.js
│   │   ├── TriviaAttempt.js
│   │   ├── GenerationJob.js
│   │   ├── SceneSegment.js
│   │   └── GeneratedFrame.js
│   │
│   ├── controllers/                 # Business logic (camelCase)
│   │   ├── authController.js
│   │   ├── songController.js
│   │   ├── generationController.js
│   │   ├── reflectionController.js
│   │   ├── triviaController.js
│   │   ├── scoreController.js
│   │   ├── instrumentController.js
│   │   ├── lessonController.js
│   │   └── badgeController.js
│   │
│   ├── services/                    # External integrations & AI pipeline
│   │   ├── aiScenePlanner.js        # LLM scene plan generation
│   │   ├── frameGenerator.js        # Text-to-image API calls + chorus caching
│   │   ├── videoAssembler.js        # Audio + frames → MP4 + subtitles
│   │   ├── subtitleGenerator.js     # Lyric timestamp parsing → karaoke subs
│   │   ├── cloudinaryService.js     # Upload / delete Cloudinary media
│   │   └── youtubeService.js        # Extract audio from YouTube URLs
│   │
│   ├── routes/                      # Express routers (thin, no business logic)
│   │   ├── auth.js
│   │   ├── songs.js
│   │   ├── generation.js
│   │   ├── reflections.js
│   │   ├── trivia.js
│   │   ├── scores.js
│   │   ├── instruments.js
│   │   ├── lessons.js
│   │   └── badges.js
│   │
│   └── tests/                       # Vitest / Jest unit tests
│       ├── auth.test.js
│       ├── songs.test.js
│       ├── generation.test.js
│       ├── reflections.test.js
│       └── trivia.test.js
│
└── frontend/
    ├── package.json
    ├── vite.config.js               # Proxy: /api → backend URL
    │
    └── src/
        ├── main.jsx                 # React DOM entry
        ├── App.jsx                  # Router setup + global layout
        │
        ├── context/                 # Global state (React Context)
        │   ├── AuthContext.jsx      # User auth state + JWT
        │   └── SessionContext.jsx   # Guest session (localStorage)
        │
        ├── services/                # API call functions (camelCase)
        │   ├── authService.js
        │   ├── songService.js
        │   ├── generationService.js
        │   ├── reflectionService.js
        │   ├── triviaService.js
        │   ├── scoreService.js
        │   ├── instrumentService.js
        │   └── lessonService.js
        │
        ├── components/              # Reusable UI (PascalCase, shadcn/ui based)
        │   ├── VideoPlayer.jsx
        │   ├── SubtitleOverlay.jsx
        │   ├── InstrumentCard.jsx
        │   ├── ReflectionCard.jsx
        │   ├── TriviaQuestion.jsx
        │   ├── GenerationStatusBadge.jsx
        │   ├── SongFilterBar.jsx
        │   └── ProtectedRoute.jsx
        │
        └── pages/                   # Route-level page views (PascalCase)
            ├── Login.jsx            # Creator login
            ├── Dashboard.jsx        # Creator dashboard (Violet)
            ├── Studio.jsx           # AI video generation studio
            ├── EducatorView.jsx     # Educator/admin analytics view
            ├── MemoryWall.jsx       # Public Reflection Wall
            └── TriviaHub.jsx        # Public trivia experience
```

---

## 5. Environment Variables

### Backend (Render)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `FRONTEND_URL` | Vercel app URL (strict CORS allowlist) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### Frontend (Vercel)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Render backend base URL |
