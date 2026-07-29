# Shades of SG

Shades of SG is a multi-creator React/Vite platform for Singapore National Day songs, with an authenticated creator Studio, an admin console, and an Express/Sequelize API. PostgreSQL (Supabase) is the production database and Cloudinary stores uploaded media.

## Authoritative workflows

Song lifecycle: `DRAFT -> GENERATING -> READY -> PUBLISHED -> ARCHIVED`.

GenerationJob lifecycle: `QUEUED -> PROCESSING -> COMPLETED | FAILED`.

Studio creates one persistent draft and keeps the same Song UUID through editing and generation. Successful generation sets that Song to `READY`; it never publishes automatically. Only its owning creator can explicitly publish it. Unpublish returns it to `READY`, archive removes it from public visibility, and delete is blocked while generating.

`GET /api/songs` and `GET /api/songs/:id` expose only `PUBLISHED` Songs. All public Song experiences preserve the real published Song UUID.

Guests may play Rhythm Game but do not create GameScore rows. Registered-player scores use the JWT-derived user and a published Song; creator sessions are not persisted as player scores. Rhythm charts are currently deterministic and duration-derived, not musically authored beatmaps.

Every guest or registered-user reflection starts `PENDING`. Registered identity and ownership come from token authentication; anonymous display does not expose that identity. A creator may moderate only reflections attached to their own songs; administrators have explicit platform-wide authority. Public queries show approved reflections whose Song remains published.

Creator ownership always derives from `songs.creator_id`. Generation jobs, scene segments, generated frames, lessons, trivia, scores/analytics, reflections, beatmaps, and collection links are authorised through that parent song. Frontend filtering is never an access-control boundary.

## Local setup

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`. Do not commit real environment files.

For local SQLite, leave `DATABASE_URL` unset. For Supabase, apply every numbered SQL file in `backend/migrations` in ascending order.

Apply every numbered migration explicitly before starting the corresponding application version. Server startup does not run `sequelize.sync`, alter tables, reset data, or seed demo content. The optional `SEED_ADMIN_*` settings bootstrap the first administrator; remove the bootstrap password after use. All normal creator accounts are produced by admin approval of a registered user's creator application. `seed:mock` is development-only.

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
- `OPENAI_API_KEY`, `OPENAI_TRANSCRIPTION_MODEL`: lyric transcription. Use `whisper-1` for the segment timestamps required by precise scene timing; GPT-4o transcription models return untimed lyrics and use the planner's fallback timing path.
- `YT_DLP_PATH`: optional yt-dlp executable path.
- `PLACEHOLDER_VIDEO_URL`: optional publicly reachable temporary MP4.
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`: optional first-admin operational bootstrap.
- `GOOGLE_CLIENT_ID`: Google Identity Services web client ID; enables Google sign-in when set.
- `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_REDIRECT_URI`: complete Sign in with Apple web configuration. The redirect URI must be the registered HTTPS return URL.

Frontend:

- `VITE_API_URL`: API base including `/api`; use `/api` locally and `https://<render-service>/api` on Vercel.

## Render, Vercel, Supabase, and Cloudinary

1. Create Supabase PostgreSQL and apply every numbered migration in `backend/migrations` in order, including the OAuth identity migration.
2. Configure Render with the database URL, strong auth secret, exact `FRONTEND_URL`, Cloudinary credentials, and required AI/media variables.
3. Deploy `backend` with `npm install` and `npm start`.
4. Configure Vercel with `VITE_API_URL=https://<render-service>/api` and build `frontend` using `npm run build`.
5. Bootstrap the first admin if needed, remove the deployed bootstrap password, and approve creators through the application workflow.
6. Verify health, two-creator isolation, admin-only platform analytics, published-only access, guest score non-persistence, and song-scoped reflection moderation.

Google and Apple buttons are hidden until their backend settings are complete. Provider tokens are verified server-side and are never stored. The first successful provider sign-in stores only the provider and its stable subject identifier. A safely verified matching email links to the existing account and preserves its role; otherwise a new `REGISTERED` account is created.

A file in `frontend/public/videos` is served after Vercel deployment. Configure its production Vercel URL—not localhost—as Render's `PLACEHOLDER_VIDEO_URL`.

## Current limitations and legacy policy

- Final AI MP4 generation is incomplete; configured placeholder video is explicitly labeled temporary.
- Rhythm charts use duration and difficulty, not beat-aligned authored data.
- Real per-Song trivia, instrument, and lesson content may be absent; pages show honest unavailable states.
- Complete play analytics lack a play-event source, so no totals are fabricated.
- Legacy `songs.language` and `songs.lyrics` remain for migration compatibility; current code uses `languages` and `raw_lyrics`.
- `play_minutes` and `missing_fields` are not persisted schema columns; readiness is derived at request time.
- Existing song rows are preserved. Migration and model changes do not reset, reseed, or recreate the database.
