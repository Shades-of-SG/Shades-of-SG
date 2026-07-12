# Shades of SG

Shades of SG is a React/Vite public music experience with an authenticated creator Studio and an Express/Sequelize API. PostgreSQL (Supabase) is the production database and Cloudinary stores uploaded media.

## Authoritative workflows

Song lifecycle: `DRAFT -> GENERATING -> READY -> PUBLISHED -> ARCHIVED`.

GenerationJob lifecycle: `QUEUED -> PROCESSING -> COMPLETED | FAILED`.

Studio creates one persistent draft and keeps the same Song UUID through editing and generation. Successful generation sets that Song to `READY`; it never publishes automatically. Only its owning creator can explicitly publish it. Unpublish returns it to `READY`, archive removes it from public visibility, and delete is blocked while generating.

`GET /api/songs` and `GET /api/songs/:id` expose only `PUBLISHED` Songs. All public Song experiences preserve the real published Song UUID.

Guests may play Rhythm Game but do not create GameScore rows. Registered-player scores use the JWT-derived user and a published Song; creator sessions are not persisted as player scores. Rhythm charts are currently deterministic and duration-derived, not musically authored beatmaps.

Every guest or registered-user reflection starts `PENDING`. Registered identity and ownership come from JWT authentication; anonymous display does not expose that identity. Only creator moderation can make content public. Public queries show approved, non-deleted reflections whose Song remains published.

## Local setup

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`. Do not commit real environment files.

For local SQLite, leave `DATABASE_URL` unset. Apply PostgreSQL migrations in numeric order for Supabase:

```text
001_initial_schema.sql
002_guest_reflections.sql
003_reflection_moderation.sql
004_song_lifecycle.sql
005_unique_active_generation_job.sql
006_reflection_published_song_and_rejection.sql
```

Create the one creator account explicitly; server startup seeds no accounts or demo content:

```bash
cd backend
npm run seed:creator
```

`SEED_CREATOR_EMAIL` and `SEED_CREATOR_PASSWORD` must be present. If the email exists, the command exits successfully without changing it. `seed:mock` is an optional development utility and is never required by the application.

Run locally and verify from the repository root:

```bash
npm run dev
npm test
npm run lint
npm run build --prefix frontend
git diff --check
```

## Environment variables

Backend:

- `DATABASE_URL`: Supabase PostgreSQL connection; omit for local SQLite.
- `DB_SSL`: set `false` only for PostgreSQL without SSL.
- `DB_STORAGE`: local SQLite path.
- `AUTH_TOKEN_SECRET` or `JWT_SECRET`: strong signing secret; mandatory in production.
- `FRONTEND_URL`: exact deployed Vercel origin allowed by CORS.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: media credentials.
- `OPENAI_API_KEY`, `OPENAI_TRANSCRIPTION_MODEL`: lyric transcription.
- `YT_DLP_PATH`: optional yt-dlp executable path.
- `PLACEHOLDER_VIDEO_URL`: optional publicly reachable temporary MP4.
- `SEED_CREATOR_EMAIL`, `SEED_CREATOR_PASSWORD`, `SEED_CREATOR_NAME`: explicit seed command only.

Frontend:

- `VITE_API_URL`: API base including `/api`; use `/api` locally and `https://<render-service>/api` on Vercel.

## Render, Vercel, Supabase, and Cloudinary

1. Create Supabase PostgreSQL and apply migrations 001–006 in order.
2. Configure Render with the database URL, strong auth secret, exact `FRONTEND_URL`, Cloudinary credentials, and required AI/media variables.
3. Deploy `backend` with `npm install` and `npm start`.
4. Configure Vercel with `VITE_API_URL=https://<render-service>/api` and build `frontend` using `npm run build`.
5. Run `npm run seed:creator` once, then remove the deployed seed password where operationally possible.
6. Verify health, creator ownership, published-only access, guest score non-persistence, and pending reflection moderation.

A file in `frontend/public/videos` is served after Vercel deployment. Configure its production Vercel URL—not localhost—as Render's `PLACEHOLDER_VIDEO_URL`.

## Current limitations and legacy policy

- Final AI MP4 generation is incomplete; configured placeholder video is explicitly labeled temporary.
- Rhythm charts use duration and difficulty, not beat-aligned authored data.
- Real per-Song trivia, instrument, and lesson content may be absent; pages show honest unavailable states.
- Complete play analytics lack a play-event source, so no totals are fabricated.
- Legacy `songs.language` and `songs.lyrics` remain for migration compatibility; current code uses `languages` and `raw_lyrics`.
- `play_minutes` and `missing_fields` are not persisted schema columns; readiness is derived at request time.
- Legacy databases may contain nullable `creator_id` rows. New writes require ownership and clean installs enforce it; audit old rows before adding a NOT NULL constraint to an existing database.
