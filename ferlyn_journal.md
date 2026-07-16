# Ferlyn's AI-Assisted Development Journal

**Project:** Shades of SG  
**Team:** Unpaid Interns  
**Event:** SCCCI AI Challenge  
**Journal owner:** Ferlyn Ng  
**Primary development period recorded:** June–July 2026  
**Document status:** Living, append-only personal journal

---

## Instructions for Codex and Other AI Assistants

This file is Ferlyn's independent development journal. It must remain separate from the team's shared `AI_DEVELOPMENT_JOURNAL.md`.

Whenever AI assists Ferlyn with implementation, debugging, design refinement, architecture, testing, deployment, documentation, or project coordination:

1. **Append a new dated entry to this file.**
2. **Do not delete, rewrite, compress, or reorder older entries.**
3. Record only work that Ferlyn personally directed, reviewed, implemented, tested, coordinated, or made decisions about.
4. Do not claim that Ferlyn completed a teammate's assigned feature unless the entry clearly identifies it as support, integration, shared infrastructure, or coordination work.
5. Never include passwords, API keys, JWT secrets, database credentials, private tokens, or other secrets.
6. Distinguish clearly between:
   - AI-generated output,
   - Ferlyn's instructions and decisions,
   - Ferlyn's direct configuration or code changes,
   - verification actually performed,
   - work that remains incomplete.
7. When a task changes code, include the files created or modified whenever they can be verified.
8. When commands are run, record only commands that actually completed or were genuinely attempted.
9. If the same feature is refined through several prompts on one day, consolidate them into one detailed entry unless separate entries would improve traceability.
10. Keep the journal factual. Do not invent dates, tests, code changes, outcomes, or personal feelings.

### Standard instruction Ferlyn can add to future Codex prompts

> After completing this task, append a factual entry to `ferlyn_journal.md`. Include the date, feature, objective, prompt summary, AI contribution, my review and decisions, files changed, verification performed, final outcome, and remaining work. Do not modify or remove previous entries, and do not record secrets.

---

## Purpose and Scope

This journal records my individual contribution to Shades of SG and the way I used AI tools such as ChatGPT and Codex during development.

It is not intended to be a raw transcript of every AI conversation. It focuses on significant work where I:

- defined the feature direction or acceptance criteria;
- requested code, design, debugging, or documentation assistance;
- reviewed AI-generated output;
- identified weaknesses or incorrect assumptions;
- requested iterations;
- made product, UX, architecture, validation, or scope decisions;
- configured local development tools;
- tested the result;
- documented limitations and follow-up work.

The shared team journal contains project-wide records. This personal journal extracts my work so that my contribution can be assessed independently.

---

## My Formal Feature Ownership

The implementation plan assigned me two main feature areas.

### Violet Task 3 — Song Metadata and Publishing

My formal creator-side responsibilities included:

- the Creator Studio metadata form;
- title, artist, theme, language, lyrics, mood tags, and description inputs;
- song metadata validation;
- metadata update integration;
- draft and published states;
- publishing and unpublishing behaviour;
- published-date handling;
- tests for metadata and publishing behaviour.

### Public Task 4 — Rhythm Game and Reflection Wall

My formal public-side responsibilities included:

- the rhythm game;
- falling-note gameplay;
- hit detection, score, accuracy, and combo tracking;
- difficulty support;
- score persistence for registered users and guest fallback behaviour;
- Reflection Wall display and submission;
- editing and deleting a user's own reflections;
- creator moderation and flagging;
- tests for game and reflection behaviour.

---

## Additional Work I Directed or Supported

Beyond the two formally assigned features, I also contributed to shared and supporting work needed to make my features usable:

- initial high-level architecture discussions;
- implementation-phase planning and task allocation;
- frontend routing and page scaffolding;
- responsive layout and creator shell decisions;
- creator seed login and route protection;
- creator/public role separation;
- sidebar and navigation refinements;
- profile, settings, landing-page, dashboard, moderation, and generation-progress wireframes;
- AI documentation strategy;
- Supabase, Cloudinary, Render, Vercel, and local-environment setup discussions;
- debugging frontend/backend integration;
- Creator Studio lyrics extraction and YouTube audio workflow;
- live preview and Preview & Publish UX;
- ongoing Reflection Wall visual and interaction refinement.

These supporting activities are recorded as my contributions only where I directly initiated, reviewed, tested, or made decisions about them.

---

## Source and Date Note

This journal was consolidated from:

- the team's existing `AI_DEVELOPMENT_JOURNAL.md`;
- `PROJECT_IMPLEMENTATION_PHASE (2).md`;
- `HIGH_LEVEL_DESIGN (1).md`;
- my recorded project conversations and design-review history.

The implementation-plan document contains a 2025 timeline in its heading, while the detailed journal and recorded development conversations use 2026 dates. This personal journal uses the detailed 2026 activity dates and does not silently rewrite the older planning document.

---

# Consolidated Development Timeline

## 2026-06-11 — Project Documentation and System Alignment

### Objective

Review the overall Shades of SG proposal, ensure the project documents were aligned, and identify what still needed to be discussed with teammates.

### AI tools used

ChatGPT.

### Work and decisions

I provided the project vision, target audience, role hierarchy, features, and technical direction for review. I focused especially on whether later additions were consistent with the original system vision.

I used AI to:

- compare the project vision against the proposed architecture;
- identify gaps between planned features and implementation ownership;
- refine the wording used for AI-ingestion and project documentation;
- review naming ideas and document organisation;
- prepare for team discussions about task ownership and project scope.

### Human oversight

I did not treat the generated documents as final without review. I repeatedly checked whether the features matched the actual assignment, whether responsibilities were clearly divided, and whether the documents reflected what the team could realistically build.

### Outcome

The project had a clearer written foundation for architecture, implementation phases, roles, and AI documentation.

### Lessons

Project documentation is not only for submission. It becomes a practical source of truth for AI assistants and teammates, especially when many people are working on separate branches.

---

## 2026-06-12 to 2026-06-13 — Team Responsibilities, Base Setup, and AI Documentation Strategy

### Objective

Prepare a shared frontend and backend foundation, clarify individual ownership, and decide how AI-assisted work would be documented.

### AI tools used

ChatGPT and Codex.

### Work and decisions

I discussed:

- how to divide Figma pages among teammates;
- how to standardise navigation and responsive behaviour;
- default typography and layout expectations;
- the need for different navigation variants for guest, registered, and creator accounts;
- how Codex should use a shared Markdown specification while generating the website shell;
- how to document AI usage without saving entire raw chat histories;
- whether each branch or feature needed its own Markdown file;
- how the shared AI development journal should record prompts, review, modifications, and outcomes.

I also worked through repository and setup questions involving:

- merged branches;
- whether old development tabs and services could be closed;
- the purpose of Jest and Vitest;
- later deployment to Render/Vercel rather than relying on local hosting;
- collaborator access for Supabase, Cloudinary, Render, and Vercel;
- what access teammates required for coding versus deployment.

### Human oversight

I pushed for clearer ownership because vague task allocation would make both development and individual assessment difficult. I also recognised that an AI journal needed to show human review, not merely list that AI had generated code.

### Outcome

The project gained a clearer base-build strategy and an initial approach to AI traceability.

### Lessons

A good AI prompt is more reliable when it points to a stable project specification. AI documentation should capture decisions, rejected outputs, testing, and revisions—not only successful prompts.

---

## 2026-06-14 to 2026-06-18 — Wireframes and Product Experience Planning

### Objective

Define how the public and creator experiences should look before deeper implementation.

### AI tools used

ChatGPT and image-generation support during wireframe discussions.

### Pages and flows I planned or reviewed

- public landing page;
- guest landing and navigation;
- dashboard homepage;
- Creator Studio;
- AI generation progress;
- creator reflection moderation;
- profile;
- settings;
- Reflection Wall;
- song experience;
- creator and public sidebars;
- creator-only navigation;
- mobile and desktop responsive behaviour.

### Key decisions

I decided that:

- the site should use a coherent dark theme instead of mixing unrelated light sections;
- Violet should have a distinct creator segment rather than being placed awkwardly beside unrelated content;
- public, registered, and creator users needed different navigation behaviour;
- the Reflection Wall should feel personal and memory-led rather than like a statistics dashboard;
- profile reflections should resemble a scrapbook or digital journal;
- badges should feel like keepsakes rather than generic achievement icons;
- the song-experience flow should lead naturally into play, learning, and reflection;
- the creator portal should stay within creator routes rather than sending Violet into public pages.

### Human oversight

Many generated wireframes initially looked generic or overly AI-styled. I requested changes to hierarchy, dark-theme consistency, page grouping, and emotional tone. The intended experience was not merely functional; it needed to support storytelling about Singapore through music and memory.

### Outcome

The main page inventory and visual direction were established before implementation.

### Lessons

Wireframes are most useful when they expose navigation and user-flow problems early. Visual polish should support the product purpose rather than add unrelated decorative cards.

---

## 2026-06-24 to 2026-06-25 — Backend Integration Confusion and Development Support

### Objective

Understand why frontend features were using hardcoded or mock data instead of reaching the backend.

### AI tools used

ChatGPT.

### Problem encountered

During implementation, parts of the frontend were reading from files such as `songData.js` or mock Axios calls instead of using the real backend and database. This created confusion about whether the feature was genuinely integrated.

### Work and decisions

I investigated:

- the difference between local hardcoded data, mock APIs, Axios as an HTTP client, and real backend routes;
- why both frontend and backend development servers needed to run;
- how a frontend request should reach the Express backend;
- why a port 5000 error could occur;
- how to replace imported mock data with API service calls;
- the need to confirm the backend route, frontend base URL or proxy, and database connection separately.

### Human context and oversight

This period was difficult and overwhelming. I communicated honestly with teammates that I was struggling instead of silently pretending the integration was complete. I also asked for concrete clarification about whether the team was using a mock API or the actual database.

### Outcome

The integration problem was reframed correctly: Axios was not itself a mock backend; it was only the client used to call an API. The real issue was that the frontend had not yet been wired to working backend endpoints.

### Lessons

When debugging integration, I need to verify the whole path in order:

1. backend server is running;
2. route exists;
3. route returns data independently;
4. frontend points to the correct URL;
5. request is visible in the browser network panel;
6. the response is stored and rendered.

---


# Detailed Development Entries Extracted from the Shared Journal

## 2026-06-14

### Feature

Project Architecture

### AI Tool Used

ChatGPT

### Objective

Create initial system architecture.

### Prompt Summary

Generate architecture for AI-powered music storytelling platform using React, Express, PostgreSQL, and Cloudinary.

### AI Output Summary

Generated modular monolith architecture and deployment proposal.

### Human Review

Partially accepted.

### Human Modifications

Removed unnecessary complexity and standardized deployment stack.

### Final Outcome

Architecture incorporated into HIGH_LEVEL_DESIGN.md.

---

## 2026-06-14

### Feature

Project Timeline

### AI Tool Used

ChatGPT

### Objective

Create implementation roadmap.

### Prompt Summary

Generate phased implementation plan with ownership allocation.

### AI Output Summary

Generated Phase 0-3 roadmap.

### Human Review

Accepted with minor edits.

### Human Modifications

Adjusted task ownership and timelines.

### Final Outcome

PROJECT_IMPLEMENTATION_PHASE.md completed.

---

## 2026-06-14

### Feature

Rhythm Game MVP, Video Gameplay Background, and Results Page Integration

### AI Tool Used

Codex

### Objective

Build the first complete rhythm game flow for Shades of SG so that a user can move from a song into gameplay, play a four-lane rhythm chart, view performance results, and continue into reflection.

The goal was not only to create a standalone rhythm game, but to make it feel like part of the wider Shades of SG experience:

* Experience song
* Choose difficulty
* Play rhythm game
* View results
* Write reflection
* Return to the song page or replay

### Prompt Summary

I provided the feature direction in several stages:

* Asked whether rhythm game code could be built using an MP3 as an example song and Rhythm Plus as the gameplay reference.
* Shared Rhythm Plus screenshots and a recorded gameplay video as the target interaction style.
* Defined four implementation tickets:
  * Create `RhythmGame.jsx` with four lanes, `D F J K` keys, canvas rendering, falling notes, combo counter, and score counter.
  * Create a beatmap loading system that loads JSON beatmaps by song id, supports Easy/Medium/Hard, and uses timestamps in seconds.
  * Create a results page with accuracy, max combo, score, and rank `S A B C`.
  * Integrate with the existing song system by reading `songId` from the route parameter and saving scores to `POST /api/scores`.
* Asked for the gameplay page to use the song's generated video as a fullscreen background, with a dark overlay and readable rhythm lanes above it.
* Requested support for AI-generated music videos by fetching song details from the API and reading `video_url`.
* Requested temporary use of the Exploding Kittens MP4 from the project videos folder as the placeholder gameplay background.
* Reviewed the first layout and asked for it to look closer to Rhythm Plus:
  * Game board centered.
  * Controls separated from gameplay.
  * UI elements not stacked on top of each other.
  * Lane labels easier to read.
  * Rhythm game tile area stretched to the full screen height.
* Asked for a pre-game overlay showing song title, difficulty, and Start button.
* Asked for countdown states `3`, `2`, `1`, `GO` before notes begin.
* Asked for falling notes to stay hidden until gameplay starts.
* Asked for the spacebar to pause and resume the game with a pause menu overlay.
* Reviewed the results page and requested better Shades of SG platform integration:
  * Add song title.
  * Add song thumbnail.
  * Add Reflection CTA.
  * Add `Write Reflection`, `Back to Song`, and `Play Again` actions.
  * Add a performance breakdown for Perfect hits, Good hits, Misses, and accuracy.
  * Do not modify scoring logic while improving the page.

### AI Output Summary

Codex generated and iterated on the rhythm game implementation across frontend, backend, data, and styling files.

Frontend gameplay work:

* Created `frontend/src/components/RhythmGame.jsx`.
* Implemented a four-lane rhythm game using the `D`, `F`, `J`, and `K` keyboard inputs.
* Used HTML canvas rendering for lanes, notes, hit line, lane labels, and visual feedback.
* Added falling notes driven by beatmap timestamps in seconds.
* Added scoring, combo, max combo, accuracy, and hit judgement tracking.
* Added hit windows for Perfect, Great, Good, and Miss results.
* Added game state handling for ready, countdown, playing, paused, and finished states.
* Added a pre-game overlay with song title, difficulty, and Start button.
* Added countdown display before gameplay begins.
* Prevented notes from appearing before the Start action and countdown.
* Added spacebar pause/resume behavior and a pause overlay.
* Added keyboard event cleanup to avoid duplicate listeners.

Beatmap and song loading work:

* Created `frontend/src/game/beatmapLoader.js`.
* Created `frontend/public/beatmaps/demo-song.json`.
* Added support for loading beatmaps from `/beatmaps/{songId}.json`.
* Added Easy, Medium, and Hard chart support.
* Standardized note timing around timestamps in seconds.
* Created `frontend/src/game/songDetailsApi.js` to fetch song details by route parameter.
* Added support for reading both `video_url` and `videoUrl` style properties so the frontend can work with current and future API shapes.

Video background work:

* Added the placeholder video at `frontend/public/videos/exploding-kittens-placeholder.mp4`.
* Made the gameplay video fullscreen and placed it as the bottom layer.
* Added a dark overlay above the video at about 70 percent opacity.
* Kept the canvas rhythm board, controls, and overlays above the video layer.
* Used `object-fit: cover` so the video covers mobile, tablet, and desktop screens.
* Added fallback behavior so the existing gradient background remains available if the video cannot load.
* Synchronized gameplay start with video playback after countdown.
* Paused the video when the game is paused.
* Stopped the video when the chart is completed.
* Navigated to the Results page after the game completes.

Results page work:

* Created `frontend/src/pages/RhythmResults.jsx`.
* Created `frontend/src/game/results.js`.
* Added rank display for `S`, `A`, `B`, and `C`.
* Preserved scoring logic while improving the page hierarchy.
* Added song title, theme, and thumbnail context.
* Added score, accuracy, max combo, and rank cards.
* Added performance breakdown:
  * Perfect hits
  * Good hits
  * Misses
  * Accuracy percentage
* Added a highlighted Reflection CTA with the prompt: "What memories did this song bring back?"
* Added actions for `Write Reflection`, `Play Again`, and `Back To Song`.

Backend integration work:

* Added `backend/routes/scores.js` for score submission through `POST /api/scores`.
* Added `backend/routes/songs.js` for fetching song data by id.
* Mounted the routes in `backend/server.js`.
* Updated `backend/models/GameScore.js` so saved scores can include rhythm game result metadata.
* Updated `backend/migrations/001_initial_schema.sql` to support max combo and rank fields.

Routing and app integration work:

* Updated `frontend/src/App.jsx` with rhythm game and results routes.
* Wired gameplay to read `songId` from the URL route parameter.
* Passed gameplay result state to the Results page.
* Added score saving after gameplay through `POST /api/scores`.
* Added fallback behavior for direct Results page access when route state is missing.

Styling and layout work:

* Updated `frontend/src/App.css` and `frontend/src/index.css`.
* Refactored the rhythm page into clear layout layers:
  * Background video layer.
  * Dark overlay layer.
  * Gameplay board layer.
  * Control and HUD layer.
  * Pre-game, countdown, and pause overlay layers.
* Centered the game board horizontally and vertically.
* Stretched the rhythm lane area to the full viewport height.
* Improved lane label readability.
* Increased note contrast so notes remain visible over video.
* Moved controls outside the core gameplay area.
* Added responsive handling for tablet-sized screens.

### Human Review

Partially accepted through multiple rounds of review and refinement.

I approved the overall direction but repeatedly corrected the implementation details so that the feature matched the intended Rhythm Plus style and the Shades of SG project flow. The final result was shaped by both AI implementation and human design review.

### Human Modifications and Inputs

My inputs directly changed the feature direction in the following ways:

* Chose Rhythm Plus as the primary gameplay reference.
* Provided an MP3 example to explain the expected rhythm game concept.
* Provided a gameplay recording and screenshots to show the desired end goal.
* Split the feature into implementation tickets, which made the build more structured.
* Clarified that the game should integrate with the existing song system through `songId`.
* Clarified that scores should be saved to `POST /api/scores`.
* Requested a fullscreen generated video background instead of a plain game background.
* Requested a placeholder MP4 first, with the intention of replacing it later using `song.videoUrl` or `video_url` from the API.
* Identified that the original difficulty selector placement was not ideal and should belong before gameplay.
* Pointed out layout issues:
  * Play button overlapping Ready text.
  * Board not perfectly centered.
  * UI elements stacking on top of each other.
  * Lane labels being hard to read.
* Requested stronger background layering because the video was distracting and gameplay elements blended into it.
* Requested the lane area to stretch to the full screen height.
* Requested a pre-game overlay and countdown so gameplay starts intentionally.
* Requested spacebar pause and resume behavior for laptop users.
* Reviewed the Results page and redirected it from a generic "Game Finished" page into a Shades of SG reflection bridge.
* Requested that results include song context, reflection CTA, and performance breakdown without changing the scoring logic.

### Final Outcome

The rhythm game is now a functional MVP feature inside Shades of SG.

The current flow supports:

* Loading a song by route parameter.
* Fetching song details.
* Loading a beatmap by song id.
* Selecting difficulty support through Easy/Medium/Hard beatmap data.
* Starting gameplay from a pre-game overlay.
* Showing countdown before notes spawn.
* Playing a four-lane canvas rhythm game with `D F J K`.
* Pausing and resuming with the spacebar.
* Using a fullscreen video background with a dark overlay.
* Saving score data to the backend.
* Navigating to an integrated Results page.
* Encouraging the user to continue into reflection after gameplay.

### Verification

The implementation was checked with frontend and backend commands during development:

* `npm run lint --prefix frontend`
* `npm run test --prefix frontend`
* `npm run build --prefix frontend`
* `npm run lint --prefix backend`
* `npm run test --prefix backend`

Manual route checks were also performed for the gameplay and results pages:

* `/game/demo-song`
* `/game/demo-song/results`

### Known Limitations and Future Work

The feature is suitable for an MVP demo, but several items should be improved later:

* The current beatmap is manually generated demo data, not automatically detected from the MP3.
* The video background currently uses a placeholder MP4 and should later use the real AI-generated song video from the song record.
* Difficulty selection should ideally happen on the song page before entering gameplay.
* The Reflection Wall and Reflection Submission Modal should be connected next.
* Future result enhancements could include badge unlocks and a Next Song action.

---

## 2026-06-14

### Feature

Frontend Shell, Routing Scaffold, and Responsive Base Layout

### AI Tool Used

Codex

### Objective

Create the complete base frontend layout for Shades of SG so the project has a navigable structure for the public experience, creator portal, and authentication flow.

The goal was to scaffold the webapp foundation only, not implement feature logic.

### Prompt Summary

I provided the `Base.md` specification and requested the whole responsive webapp base layout for:

* `MainLayout`
  * Landing
  * Songs Library
  * Song Experience
  * Learning Hub
  * Instrument Playground
  * Trivia
  * Rhythm Game
  * Reflection Wall
* `CreatorLayout`
  * Dashboard
  * Studio
  * Generation Progress
  * Reflection Moderation
* `AuthLayout`
  * Login
  * Register
  * Forgot Password
  * Reset Password

The requested layout needed to work across desktop, tablet, and mobile sizes while preserving the existing rhythm game implementation.

### AI Output Summary

Codex added the page-level scaffold and responsive styling for the requested frontend base.

Page scaffold work:

* Created placeholder pages for:
  * `Landing.jsx`
  * `SongsLibrary.jsx`
  * `SongExperience.jsx`
  * `LearningHub.jsx`
  * `InstrumentPlayground.jsx`
  * `TriviaHub.jsx`
  * `RhythmHub.jsx`
  * `ReflectionWall.jsx`
  * `Dashboard.jsx`
  * `Studio.jsx`
  * `GenerationProgress.jsx`
  * `ReflectionModeration.jsx`
  * `Login.jsx`
  * `Register.jsx`
  * `ForgotPassword.jsx`
  * `ResetPassword.jsx`
  * `Profile.jsx`
  * `Settings.jsx`
  * `NotFound.jsx`
* Added `pageData.js` for temporary placeholder song and card data.
* Added TODO ownership comments to page files so teammates know which feature areas to continue.

Routing and layout work:

* Wired the app routes through the existing React Router setup.
* Added public shell pages under the main experience.
* Added creator portal pages under `/creator/...`.
* Added authentication pages under their own auth layout.
* Preserved the existing rhythm game route at `/game/:songId`.
* Added `/rhythm-game` as a public rhythm entry page that links into the existing gameplay route.

Responsive UI work:

* Updated `frontend/src/App.css` with the responsive design system for the new shell.
* Updated `frontend/src/index.css` color tokens to match the Twilight Singapore palette.
* Added desktop, tablet, and mobile layout handling for:
  * Sticky navigation.
  * Mobile hamburger menu.
  * Responsive grids.
  * Creator sidebar behavior.
  * Auth card layout.
  * Song cards.
  * Filter bars.
  * Placeholder content sections.
* Updated `frontend/src/App.test.jsx` so the smoke test matches the new landing page shell.

### Human Review

Accepted for scaffold implementation.

I corrected the workflow by reminding Codex that the edits also needed to be recorded in the AI development journal.

### Human Modifications

No direct code modifications were made by the user after generation in this step.

Human guidance clarified that the work must be traceable in `AI_DEVELOPMENT_JOURNAL.md`.

### Final Outcome

The frontend now has a complete responsive base shell ready for feature implementation.

The current scaffold supports:

* Public navigation and placeholder pages.
* Creator portal navigation and placeholder pages.
* Auth page shell and forms.
* Responsive desktop, tablet, and mobile layouts.
* Reusable page sections and placeholder content.
* Preserved rhythm game gameplay route and results route.

### Verification

The implementation was checked with frontend commands:

* `npm.cmd run build`
* `npm.cmd test`
* `npm.cmd run lint`

The Vite development server was also started and checked successfully at:

* `http://127.0.0.1:5173`

### Known Limitations and Future Work

This is intentionally a frontend scaffold. Future feature work should replace placeholders with real functionality:

* Connect song library and filters to backend data.
* Implement authentication flows.
* Implement creator studio forms and generation progress logic.
* Implement reflection submission and moderation.
* Connect profile, settings, achievements, and game scores to real user data.

---

## 2026-06-14

### Feature

Padlet-Style Reflection Wall UI

### AI Tool Used

Codex

### Objective

Replace the basic Reflection Wall placeholder with an actual Padlet-like community reflection board.

The goal was to make the page feel closer to the intended product experience while keeping it frontend-only and avoiding backend implementation.

### Prompt Summary

I requested a Padlet-like Reflection Wall based on a visual reference and hand-drawn layout sketch.

The key requirement was that the add-post UI should not always be visible. Instead, users should click a circular plus button with a `+` sign, and only then should the add post component appear as a card.

### AI Output Summary

Codex updated the Reflection Wall page and styles.

Frontend page work:

* Replaced the placeholder two-column Reflection Wall with a Padlet-style board.
* Added a visual hero section for the Reflection Wall.
* Added song filter chips for sample song categories.
* Added sample reflection cards with author, song, location, title, and story content.
* Added a masonry-style board layout using responsive CSS columns.
* Added a circular plus button for opening and closing the add-post card.
* Added an add-post composer card that only appears when the plus button is clicked.
* Kept the form as frontend-only placeholder UI with title, song selection, reflection textarea, save draft, and submit-for-review controls.

Styling work:

* Added Reflection Wall-specific CSS in `frontend/src/App.css`.
* Added responsive behavior for desktop, tablet, and mobile sizes.
* Added card color variants and pin-dot styling to make posts feel more like a shared board.
* Made the board collapse from three columns to two columns to one column across smaller screens.

### Human Review

Accepted for implementation direction.

I provided the visual reference and clarified the interaction requirement for the add-post component.

### Human Modifications

No direct user code modifications were made in this step.

### Final Outcome

The Reflection Wall now behaves like a real frontend board rather than a placeholder page.

Users can:

* View reflection cards in a Padlet-like layout.
* Filter sample posts by song.
* Click a circular `+` button to reveal the add-post card.
* Hide the add-post card by clicking the same button again.

### Verification

The implementation was checked with frontend commands:

* `npm.cmd run build`
* `npm.cmd run lint`
* `npm.cmd test`

### Known Limitations and Future Work

This is still frontend-only.

Future work should:

* Load approved reflections from the backend.
* Persist submitted reflections through an API.
* Add moderation status handling.
* Connect song filters to real song data.
* Add image, video, or audio attachments if required.

---

## 2026-06-14

### Feature

Creator Seed Login and Creator Route Protection

### AI Tool Used

Codex

### Objective

Connect the local seeded creator credential flow to the creator-side pages without exposing Violet's password in frontend code or tracked documentation.

### Prompt Summary

I added `SEED_CREATOR_EMAIL` and `SEED_CREATOR_PASSWORD` to `backend/.env` and asked how to route that account into the creator side pages.

### AI Output Summary

Codex added a minimal backend and frontend auth path.

Backend work:

* Added `backend/services/authService.js`.
* Added password hashing and verification using Node's built-in `crypto.pbkdf2Sync`.
* Added seeded creator account creation from:
  * `SEED_CREATOR_EMAIL`
  * `SEED_CREATOR_PASSWORD`
  * `SEED_CREATOR_NAME`
* Added signed local auth token creation.
* Added `backend/routes/auth.js`.
* Added `POST /api/auth/login`.
* Mounted the auth router in `backend/server.js`.
* Added `sequelize.sync()` and seed creation during backend startup.
* Updated env examples with non-secret placeholder keys only.

Frontend work:

* Added `frontend/src/services/authApi.js`.
* Updated `AuthContext` to persist both token and user role.
* Updated `Login.jsx` to submit email and password to the backend.
* Redirected creator users to `/creator/dashboard` after login.
* Updated `ProtectedRoute.jsx` to support nested routes.
* Protected creator pages so only users with role `CREATOR` can access them.
* Updated the app smoke test to wrap `App` in `AuthProvider`.

### Human Review

Accepted for local development routing.

I provided the seed environment variables and requested the connection to the creator side.

### Human Modifications

No direct user code modifications were made in this step.

### Final Outcome

Violet can now log in through the normal `/login` page using the creator seed account stored in `backend/.env`.

After successful login:

* If the user role is `CREATOR`, the frontend redirects to `/creator/dashboard`.
* Creator routes are protected from non-creator users.
* The seed password remains backend-only and is not placed in frontend code.

### Verification

The implementation was checked with:

* `npm.cmd run build` in `frontend`
* `npm.cmd run lint` in `frontend`
* `npm.cmd test` in `frontend`
* `npm.cmd run lint` in `backend`
* `npm.cmd test` in `backend`

### Known Limitations and Future Work

This is a local development auth path, not a production-grade authentication system.

Future work should:

* Replace local signed tokens with the final session/JWT strategy.
* Add `GET /api/auth/me` for token rehydration.
* Add logout handling against real sessions if server-side sessions are used.
* Add role checks to backend creator APIs when those APIs are implemented.
* Add password reset or admin invitation flow for real creator accounts.

---

## 2026-06-14

### Feature

Role-Separated Creator and User Navigation

### AI Tool Used

Codex

### Objective

Prevent creator users from being sent into public pages when using creator navigation.

The goal was to keep each account type in a clear experience:

* Creator users stay inside `/creator/*`.
* Registered users use the user-facing public shell.
* Guests use the guest public shell.

### Prompt Summary

I noticed that clicking `Songs` from the creator account redirected to the public `/songs` page and requested that the creator view should stay fully creator-only instead of jumping between public and creator layouts.

### AI Output Summary

Codex updated frontend role routing and navigation.

Routing and navigation work:

* Changed creator `Songs` navigation from `/songs` to `/creator/songs`.
* Added a creator-only `CreatorSongs.jsx` page.
* Added `/creator/songs` under `CreatorLayout`.
* Changed creator `Profile` and `Settings` links to `/creator/profile` and `/creator/settings`.
* Added creator profile and settings routes inside the creator layout.
* Updated the creator sidebar to include Songs.
* Added role-aware route handling:
  * Creator users are redirected away from public MainLayout routes into `/creator/dashboard`.
  * Logged-in non-creator users see the registered-user navbar.
  * Guests see the guest navbar.
  * Logged-in users are redirected away from auth pages.
* Wired navbar logout to clear auth state and return to `/login`.

Styling work:

* Added creator song action styles for the creator song management page.

### Human Review

Accepted for behavior correction.

I identified the issue by testing the creator account flow in the browser.

### Human Modifications

No direct user code modifications were made in this step.

### Final Outcome

The creator experience no longer jumps into the public song library when clicking Songs.

Creator users now stay inside creator routes and see creator-specific pages.

### Verification

The implementation was checked with frontend commands:

* `npm.cmd run build`
* `npm.cmd run lint`
* `npm.cmd test`

### Known Limitations and Future Work

The creator song management page is still placeholder UI.

Future work should connect `/creator/songs` to real creator-owned song data and editing actions.

---


## 2026-07-01

### Feature

Studio Page Rebuild

### AI Tool Used

Codex

### Objective

Rebuild only the creator Studio page from scratch so it matches the provided Figma reference, stays responsive across desktop and tablet/mobile widths, and avoids the instability of the previous implementation.

### Prompt Summary

I requested a full rebuild of the Studio page only, with reusable components, a collapsible creator sidebar, a responsive metadata form, a live preview panel, footer actions, local React state only, no API calls, and no changes to unrelated pages, routing, authentication, or backend logic.

### AI Output Summary

Codex rebuilt the Studio route into a dedicated component set and route-owned shell.

Components created:

* `frontend/src/components/studio/CreatorSidebar.jsx`
* `frontend/src/components/studio/StudioHeader.jsx`
* `frontend/src/components/studio/MetadataStepper.jsx`
* `frontend/src/components/studio/SongInformationCard.jsx`
* `frontend/src/components/studio/LanguageSelector.jsx`
* `frontend/src/components/studio/MoodTagSelector.jsx`
* `frontend/src/components/studio/SongMediaUpload.jsx`
* `frontend/src/components/studio/LivePreviewCard.jsx`
* `frontend/src/components/studio/StudioFooter.jsx`

Files created or updated:

* `frontend/src/pages/Studio.jsx`
* `frontend/src/layouts/CreatorLayout.jsx`
* `frontend/src/App.css`
* `AI_DEVELOPMENT_JOURNAL.md`

Design decisions:

* Kept the implementation within the existing dark creator palette and card language already used by the app.
* Made the Studio route own its shell so the page can use the requested sidebar, header, form, preview, and footer layout without affecting other creator pages.
* Used local component state only for form fields, selected languages, mood tags, and sidebar collapse state.
* Persisted the sidebar collapse state in `localStorage`.
* Used a desktop-first responsive grid with a two-column main layout on larger widths and a single-column stack below tablet widths.
* Built the live preview with mock data only and no backend integration.

### Human Review

Fully accepted.

### Human Modifications

No user edits were required after implementation.

### Final Outcome

The Studio page now renders as a dedicated responsive creator workspace with reusable components, a collapsible sidebar, a metadata form, a mock live preview, and footer actions that match the provided visual reference much more closely.

### Verification

The Studio rebuild was checked with frontend commands:

* `npm run lint`
* `npm run build`

### Remaining Work

* Replace mock content with real song data when backend integration is ready.
* Add actual shadcn/ui or Tailwind wiring only if the project stack is later expanded to support it.
* Connect the save, preview, and generate actions to real Studio workflows when those APIs exist.

### Follow-up Adjustment

The Studio page was later adjusted to remove the separate top bar entirely and move the creator branding, logout control, and navigation into the sidebar so the requested layout matched the current creator top navigation more closely.

### Sidebar Restyle Update

The shared creator sidebar was then rebuilt to match the provided reference more closely across all creator routes, including the compact icon rail, stacked branding, creator portal label, highlighted active item, notification badge, decorative lower artwork, and footer support/logout actions.

---

## 2026-07-02

### Feature

Creator Studio Song Information Form Refinement

### AI Tool Used

Codex

### Objective

Refine the Creator Studio page so the Song Information card and surrounding Studio layout more closely match My provided Figma screenshots.

### Prompt Summary

I requested several visual corrections to the Creator Studio page, especially the Song Information container. The requested layout was:

* A top section with left-side song metadata fields and right-side selectors.
* A Figma-matched Song Information card where the left column contains Title, Artist, Theme, and Description.
* A right column containing Languages Used, Mood Tags, and Song Media.
* Language options styled as selectable checkbox pills.
* Mood tags styled as selected pills with a visible count and an Add mood tag row.
* Description character counting and vulgarity validation.
* Song Media kept at the bottom with upload audio and YouTube link options.

### AI Output Summary

Codex iteratively adjusted the existing Studio implementation rather than rebuilding the page from scratch.

Files updated:

* `frontend/src/pages/Studio.jsx`
* `frontend/src/components/studio/SongInformationCard.jsx`
* `frontend/src/components/studio/LanguageSelector.jsx`
* `frontend/src/components/studio/MoodTagSelector.jsx`
* `frontend/src/components/studio/SongMediaUpload.jsx`
* `frontend/src/App.css`
* `AI_DEVELOPMENT_JOURNAL.md`

Implemented refinements:

* Reworked the Studio header area to include breadcrumb, title, subtitle, creator controls, and action buttons.
* Moved the stepper into the left form column above the Song Information card.
* Reworked the Song Information card into a two-column layout matching the screenshot:
  * Left column: Title, Artist, Theme, Description.
  * Right column: Languages Used, Mood Tags, Song Media.
* Added title and artist character counters inside the input rows.
* Set description max length to 300 characters to match the latest screenshot.
* Added local vulgarity validation feedback for the description field.
* Changed Language Selector to use two-column checkbox pills and an Others row with a Specify language input.
* Changed Mood Tag Selector to show selected mood pills with remove indicators, a count, and a dashed Add mood tag row.
* Changed Song Media Upload to use a dashed upload box, divider, and YouTube link input.
* Tuned card spacing, borders, radii, input sizing, pill styling, media upload styling, and footer/sidebar offsets in `App.css`.

### Human Review

In progress. I is comparing the updated Studio card against the Figma screenshot and giving visual correction prompts.

### Human Modifications

No direct human code modifications were made during this update.

### Final Outcome

The Creator Studio Song Information card is now much closer to the supplied Figma reference, with the correct two-column field grouping, compact dark input styling, selected language and mood pills, description validation, and Figma-like Song Media controls.

### Verification

The frontend was checked after the layout and component changes with:

* `npm.cmd run lint`
* `npm.cmd run build`
* `npm.cmd test`

### Remaining Work

* Continue pixel-level visual tuning against the Figma screenshot if I identifies remaining spacing, sizing, or color differences.
* Replace placeholder symbols with Lucide icons where appropriate.
* Connect Add mood tag to an actual editable input or selector.
* Expand vulgarity validation into a shared validation utility if other forms need the same behavior.
* Reconnect save/preview/generate actions to real workflows when backend integration resumes.

---

## 2026-07-02

### Feature

Creator Studio Live Preview, Media Controls, and Header Refactor Follow-up

### AI Tool Used

Codex

### Objective

Continue refining the Creator Studio page so the metadata form, media upload controls, live preview panel, and reusable header account controls behave more like the intended creator workflow.

The focus was to improve local UI behavior without adding backend logic.

### Prompt Summary

I requested multiple follow-up improvements to the Studio page:

* Add a remove or cross button beside the uploaded audio file.
* Allow uploaded audio to be played from the live preview.
* Allow a detected YouTube link to be playable in the preview area.
* Leave YouTube duration as `--` because backend metadata extraction is not implemented yet.
* Turn the Mood Tags add row into a usable text field.
* Add icons to the mood and language pills in the preview.
* Replace the preview pill icons with the supplied SVGs.
* Ensure all selected mood tags appear in the preview, not only the first mood.
* Extract the I profile, dark mode, and notification cluster into a reusable component because it repeats across creator pages.
* Make the custom "Others" language input participate in the live preview when the creator types a value such as `korean`.

### AI Output Summary

Codex implemented the requested Studio refinements across the existing React component structure.

Files created:

* `frontend/src/components/CreatorAccountWidget.jsx`

Files modified:

* `frontend/src/pages/Studio.jsx`
* `frontend/src/components/studio/StudioHeader.jsx`
* `frontend/src/components/studio/LivePreviewCard.jsx`
* `frontend/src/components/studio/MoodTagSelector.jsx`
* `frontend/src/components/studio/SongInformationCard.jsx`
* `frontend/src/components/studio/SongMediaUpload.jsx`
* `frontend/src/App.css`
* `AI_DEVELOPMENT_JOURNAL.md`

Implemented refinements:

* Added an uploaded audio remove button beside the selected filename.
* Cleared the stored filename, audio duration, preview URL, and file input when removing uploaded audio.
* Added browser audio playback support from the live preview play button when an uploaded audio file exists.
* Added YouTube embed preview support when a valid YouTube link is pasted and no uploaded audio is selected.
* Kept YouTube duration as `--` because direct frontend duration detection is not reliable without backend metadata support.
* Converted the Mood Tags add control from a static button into a local text input with Add and Enter submit behavior.
* Prevented duplicate mood tags and preserved the maximum of five mood tags.
* Added SVG icons inside preview pills.
* Replaced the mood and language pill icons with I-provided SVG paths.
* Updated the preview to display every selected mood tag as its own pill.
* Updated the preview language pill and language count to include custom "Others" input values.
* Made typing in the custom language field automatically select the `Others` checkbox.
* Extracted the creator profile/actions cluster into `CreatorAccountWidget`.
* Updated `StudioHeader` to consume the reusable account widget.
* Updated `Studio.jsx` to render `StudioHeader` instead of owning header markup directly.
* Moved the account cluster CSS from Studio-specific selectors to reusable `creator-account-widget` selectors.

### Human Review

Partially accepted through iterative review.

I reviewed the UI in the browser after each small change and identified missing behavior or visual mismatches, including missing mood display, custom language handling, and repeated header account markup.

### Human Modifications

No direct human code modifications were made during this follow-up.

I provided the visual references, SVG icon paths, and product decisions for how the preview should behave.

### Final Outcome

The Studio page now has richer local creator interactions:

* Uploaded audio can be removed and previewed.
* YouTube links can display a playable embedded preview.
* Live preview fields update as the creator types.
* Mood tags can be added through an actual text field.
* All selected mood tags display in the preview.
* Custom "Others" languages display in the preview and count.
* The repeated creator account control is now separated into a reusable component.

### Verification

The frontend was checked repeatedly after changes with:

* `npm.cmd run build`

Each build completed successfully after the latest changes.

### Remaining Work

* Connect YouTube duration to backend metadata later, likely through a YouTube Data API or server-side extraction endpoint.
* Connect uploaded media and YouTube link persistence to real Studio save APIs.
* Replace remaining placeholder or corrupted glyph icons in older components with consistent icon components.
* Reuse `CreatorAccountWidget` across other creator pages that need the same account cluster.

---

## 2026-07-03

### Feature

Creator Studio Refinement Journal Consolidation

### AI Tool Used

Codex

### Objective

Record the completed Creator Studio refinements in the AI development journal so the work remains traceable for project documentation and review.

### Prompt Summary

I asked Codex to add everything completed during the recent Creator Studio work into `AI_DEVELOPMENT_JOURNAL.md` again.

### AI Output Summary

Codex reviewed the existing journal and confirmed that the previous Studio follow-up work had been documented. A new consolidation entry was added to make the latest documentation action explicit.

The documented Studio work includes:

* Creator Studio layout and Song Information refinements.
* Audio upload filename display and remove button.
* Local audio duration detection for uploaded files.
* Live preview audio playback for uploaded songs.
* YouTube link embed preview.
* Decision to leave YouTube duration as `--` until backend metadata support exists.
* Usable Mood Tags text input with duplicate prevention and a maximum of five tags.
* Live preview support for all selected mood tags.
* Preview pill icons for moods and languages using provided SVG paths.
* Custom `Others` language handling so typed values appear in the preview.
* Extraction of the repeated creator account action cluster into `CreatorAccountWidget`.
* Refactoring `Studio.jsx` to use `StudioHeader`.
* Reusable styling for the account widget in `App.css`.

### Human Review

Accepted as a documentation update request.

I specifically requested that the AI journal be updated again after the Studio refinements.

### Human Modifications

No direct code changes were made by the user during this documentation update.

### Final Outcome

The AI development journal now includes an additional dated entry summarising the recent Creator Studio changes and the documentation action itself.

### Verification

The journal was inspected before editing to avoid overwriting earlier entries.

### Remaining Work

* Continue updating the journal after future AI-assisted implementation, debugging, testing, or design refinement work.
* Connect the current Studio UI interactions to backend persistence when the API implementation resumes.

---

## 2026-07-03

### Feature

Creator Studio AI Lyrics Extraction, YouTube Audio Extraction, and Lyrics Workflow Refinement

### AI Tool Used

Codex

### Objective

Implement and debug the Creator Studio lyrics extraction workflow so creators can generate an editable lyrics draft from uploaded media or a YouTube link, while making extraction status, errors, and draft formatting clearer in the Studio UI.

### Prompt Summary

I asked Codex to continue improving the Creator Studio lyrics workflow through several prompts:

* Investigate why lyric extraction kept showing that it was unable to extract lyrics.
* Explain whether the backend needed to be running and how to configure an OpenAI API key.
* Try the locally saved song file and determine why extraction failed.
* Show AI generation or extraction status in the Lyrics step.
* Implement server-side audio extraction for YouTube links.
* Explain where `yt-dlp` should be installed and how to configure it on Windows.
* Debug why `yt-dlp` still could not run after installation.
* Reset the Lyrics step contents when a new uploaded audio file or YouTube link is selected on the Metadata step.
* Improve the generated lyrics formatting so the output is easier to read.
* Explain why AI sometimes does not generate the full song lyrics.
* Add all of the day's edits and prompts into the AI development journal.

### AI Output Summary

Codex implemented the AI lyrics extraction flow and related debugging improvements across the frontend and backend.

Files created:

* `backend/routes/transcriptions.js`
* `backend/services/transcriptionService.js`
* `backend/services/audioExtractionService.js`
* `frontend/src/components/studio/LyricsCard.jsx`

Files modified:

* `backend/server.js`
* `backend/.env.example`
* `backend/package.json`
* `backend/package-lock.json`
* `frontend/src/pages/Studio.jsx`
* `frontend/src/components/studio/LyricsCard.jsx`
* `frontend/src/components/studio/SongMediaUpload.jsx`
* `frontend/src/components/studio/StudioFooter.jsx`
* `frontend/src/App.css`
* `AI_DEVELOPMENT_JOURNAL.md`

Implemented backend features:

* Added `POST /api/transcriptions/lyrics` for AI lyrics transcription.
* Added `GET /api/transcriptions/status` so the frontend can detect whether transcription is configured.
* Added OpenAI audio transcription support using `OPENAI_API_KEY` and `OPENAI_TRANSCRIPTION_MODEL`.
* Added validation for supported uploaded media formats including MP3, WAV, M4A, WEBM, MPEG, MPGA, and MP4.
* Added 25MB validation for transcription-bound files.
* Added server-side YouTube audio extraction using `yt-dlp`.
* Added `YT_DLP_PATH` support so Windows can point directly to `yt-dlp.exe` when it is not on PATH.
* Added temporary YouTube audio extraction under `backend/storage/temp`.
* Added cleanup of extracted temporary audio files after transcription.
* Added clearer backend errors for missing OpenAI API key, missing `yt-dlp`, unsupported files, oversized files, and incomplete YouTube video IDs.
* Added a lyric-focused transcription prompt asking the model to preserve repeated choruses, ad-libs, and line breaks where possible.
* Added a backend formatter that converts paragraph-style transcripts into lyric-style lines and stanzas.

Implemented frontend features:

* Added a Lyrics step card with an editable lyrics draft textarea.
* Added AI extraction status states such as checking, waiting for media, ready, extracting, ready for review, and needs attention.
* Added a themed progress/status panel for AI lyrics extraction.
* Allowed uploaded audio/video files to be sent to the transcription backend.
* Allowed YouTube-only extraction requests to use the backend YouTube extraction route.
* Fixed the old frontend behavior that always threw an upload-file error after posting a YouTube link.
* Reset lyrics draft, extraction errors, and extraction status whenever the creator uploads a new media file, clears a media file, or changes the YouTube link.
* Updated Studio footer navigation for the Lyrics step.
* Updated upload UI copy and file picker support for additional transcription media types.
* Added UI copy reminding creators that AI lyrics are editable drafts and may need manual review.

Debugging and configuration work:

* Confirmed that the original extraction failure was caused by a missing `OPENAI_API_KEY` in `backend/.env`.
* Confirmed the backend health endpoint was reachable when the backend was running.
* Confirmed the local test song could be packaged and posted to the backend.
* Confirmed that `yt-dlp` was installed but not available on PATH because Python installed it under `%LOCALAPPDATA%\Programs\Python\Python313\Scripts`.
* Verified that setting `YT_DLP_PATH` to the full `yt-dlp.exe` path and restarting the backend allowed the backend to locate the tool.
* Diagnosed a pasted YouTube URL with an incomplete video ID and added a clearer validation error for that case.

### Human Review

Accepted through iterative browser review.

I tested the Studio page in the local browser, shared screenshots of confusing states, and confirmed which behavior should change next. The feedback drove fixes for stale Lyrics content, misleading AI status, YouTube extraction handling, and lyrics formatting.

### Human Modifications

I installed `yt-dlp` locally using:

* `py -m pip install yt-dlp`

I also updated local environment configuration in `backend/.env`, including the OpenAI key and `YT_DLP_PATH`. Secret values were not recorded in the journal.

### Final Outcome

The Creator Studio now supports an end-to-end AI lyrics draft workflow for uploaded files and a backend-ready YouTube extraction path.

Creators can:

* Upload supported audio/video media and request an AI lyrics draft.
* Paste a YouTube link and request backend audio extraction followed by transcription.
* See clear AI extraction status instead of a silent or vague failure.
* Receive clearer errors for missing configuration, missing tools, incomplete YouTube links, and unsupported media.
* Edit the resulting lyrics draft directly in the Lyrics step.
* Change the source media and have stale lyrics/error state reset automatically.
* Receive a more readable lyrics draft with line and stanza formatting.

### Verification

Codex verified the implementation with:

* `node --check services/transcriptionService.js`
* `node --check services/audioExtractionService.js`
* `node --check routes/transcriptions.js`
* `npm.cmd run lint` in `backend`
* `npm.cmd run lint` in `frontend`
* `npm.cmd run build` in `frontend`
* Backend health and transcription status endpoint checks.
* Direct backend test posts for uploaded local media and YouTube URL handling.
* A formatter sanity check confirming paragraph transcripts are converted into lyric-style lines and stanzas.

### Remaining Work

* Continue testing with full valid YouTube URLs because YouTube extraction may still fail depending on video availability, regional restrictions, age restrictions, or YouTube anti-bot behavior.
* Consider adding `ffmpeg` support if future extraction needs conversion to MP3/WAV instead of using the downloaded best audio stream directly.
* Store generated lyrics in the song metadata backend once the save workflow is expanded.
* Add a stronger review workflow for incomplete or low-confidence AI transcriptions.
* Consider integrating an official lyrics provider later if exact licensed lyrics are required, because speech transcription is not guaranteed to reproduce full official lyrics.

---

## Date
2026-07-03

## Task
Refine the Creator Studio flow across Metadata, Lyrics, and Preview & Publish, including navigation, preview behavior, publish UI, and draft/publish interactions.

## Prompts
* Make the Studio stepper clickable so creators can jump back to Metadata and Lyrics.
* Create a real Preview & Publish page using the existing Studio visual style.
* Update the Lyrics-page live preview to better match the provided reference layout.
* Expand the Lyrics editor container to better match the height of the live preview panel.
* Remove the extra `Add tag` chip from the live preview tags row.
* Set a default placeholder YouTube video for preview fallback.
* Improve the Preview & Publish layout so the left side handles publishing controls and the right side focuses on the public preview.
* Shrink the oversized publish preview media block.
* Show `0 Views` instead of a fake value and use actual media in the publish preview.
* Remove duplicate fake playback timing and use only the real video timing.
* Add a UI-only publish date scheduling control.
* After publish success, redirect the creator to `My Songs`.
* Add all of the day's work into the AI development journal.

## Files Created
* `frontend/src/components/studio/PreviewPublishPanel.jsx`

## Files Modified
* `frontend/src/App.css`
* `frontend/src/components/studio/LivePreviewCard.jsx`
* `frontend/src/components/studio/LyricsCard.jsx`
* `frontend/src/components/studio/MetadataStepper.jsx`
* `frontend/src/components/studio/SongMediaUpload.jsx`
* `frontend/src/components/studio/StudioFooter.jsx`
* `frontend/src/components/studio/StudioHeader.jsx`
* `frontend/src/pages/Studio.jsx`
* `AI_DEVELOPMENT_JOURNAL.md`

## Features Implemented
* Made the Studio stepper clickable so creators can move between Metadata, Lyrics, and Preview & Publish.
* Added a dedicated `PreviewPublishPanel` for Studio step 3 instead of reusing the Lyrics/Metadata two-column layout.
* Updated the Studio header so its title, breadcrumb, and top-right actions change by step.
* Simplified Studio footer actions so the bottom bar keeps a single primary progression action instead of repeating secondary buttons.
* Added a UI-only draft save interaction using a browser popup and tracked the actual last-saved time in the footer.
* Wired `Generate Video` to redirect to the Generation Jobs page for now.
* Wired publish success to redirect the creator to `My Songs`.
* Reworked the Lyrics-step live preview to a more video-first presentation with compact metadata and cleaner tag rows.
* Removed the extra `Add tag` preview chip.
* Added a default fallback YouTube preview source when no uploaded media or pasted link exists.
* Reworked Preview & Publish into a clearer master-detail layout:
  * left column for publish controls and readiness checklist
  * right column for public preview and explore content
* Changed the checklist to use scan-friendly ready/pending icons instead of only text states.
* Merged the old standalone Reflection Prompt treatment into the `Explore & Learn` area.
* Added a UI-only publish timing control with `Publish now` and `Schedule`, including a `datetime-local` picker.
* Updated the publish preview to use real media inputs:
  * uploaded MP4 shows as video
  * pasted YouTube links show as embeds
  * placeholder art is only shown when no real media source exists
* Replaced the fake `128 Views` display with `0 Views`.
* Removed the duplicate fake playback timing strip under the publish preview media area.
* Added a compact stepper variant for Preview & Publish so the navigation strip does not dominate the page.

## AI Assistance
AI was used to:
* translate visual feedback and screenshots into incremental frontend refinements
* refactor the Studio page into a clearer multi-step flow without rewriting unrelated parts
* implement reusable UI states for header, footer, stepper, preview cards, and publish controls
* keep behavior consistent across top and bottom actions by centralizing handlers in `Studio.jsx`
* verify each pass with frontend linting and production builds

## Decisions Made
* Kept the current implementation frontend-first and UI-driven instead of introducing backend persistence for publish scheduling or publishing state.
* Reused the existing Studio page state in `Studio.jsx` as the single source of truth for metadata, media, preview values, save timestamps, and step navigation.
* Used a dedicated `PreviewPublishPanel` component rather than overloading `LivePreviewCard`, because Preview & Publish serves a different purpose from the Metadata/Lyrics side preview.
* Preserved one global default placeholder YouTube video as the lowest-priority fallback for previews.
* Chose simple browser alerts for save/publish feedback to satisfy immediate interaction requirements without adding a toast system yet.
* Used `0 Views` as the draft-safe placeholder until real publish analytics exist.

## Remaining Work
* Persist save draft, schedule, and publish actions to the backend instead of keeping them local-only.
* Replace browser alerts with a proper in-app toast or modal system.
* Connect publish scheduling to real song data and backend publication workflows.
* Add real published/draft status handling so the checklist and preview metadata reflect persisted song state.
* Replace placeholder explore cards with real navigation or feature entry points.
* Decide whether the default placeholder YouTube video should remain global or be stored per song as generated preview media.

## Verification
* `npm.cmd run lint` in `frontend`
* `npm.cmd run build` in `frontend`

---

## Date
2026-07-08

## Task
Refine the Creator Studio metadata, media preview, and Preview & Publish experience for a cleaner creator workflow.

## Prompts
* Prevent the uploaded song filename/media area from overflowing in the Metadata form.
* Adjust upload media text sizing and spacing.
* Replace the inline maximum mood tag message with a more user-friendly behavior.
* Update the live song metadata preview to show a clearer Song Summary layout.
* Change empty preview values to user-friendly defaults such as `Not set`, `Not selected`, and `Calculated after upload`.
* Remove profanity blocked-word validation from trusted Creator Studio metadata fields.
* Replace the fake YouTube-style MP3 preview with a custom audio preview card.
* Make the audio preview fully reactive to title, artist, uploaded audio, YouTube link, and video state changes.
* Create a CSS vinyl record preview inspired by the provided vinyl reference image.
* Resize the vinyl preview and place the play/pause control correctly.
* Restore YouTube embed support and default placeholder YouTube preview behavior.
* Reuse the same placeholder video behavior on the Preview & Publish page.
* Add real MP3 playback and a duration/progress strip to the Preview & Publish page.
* Make the Preview & Publish stepper match the full-width stepper used on the other Studio pages.
* Remove the Desktop, Tablet, and Mobile preview buttons.
* Simplify the Preview & Publish page from a creator UX perspective by removing unrelated public-learning content.
* Ensure Preview & Publish values stay reactive across Metadata, Lyrics, media upload, and publishing state.
* Fix the large gap above the public preview media.
* Only mark AI Video as complete when an uploaded MP4/video exists.
* Fix Save Draft on Preview & Publish so it saves instead of redirecting to Generation Jobs.
* Add the day's AI-assisted development work to the AI development journal.

## Files Created
* `frontend/src/components/studio/AudioPreviewCard.jsx`

## Files Modified
* `frontend/src/App.css`
* `frontend/src/components/studio/LivePreviewCard.jsx`
* `frontend/src/components/studio/PreviewPublishPanel.jsx`
* `frontend/src/components/studio/SongInformationCard.jsx`
* `frontend/src/components/studio/SongMediaUpload.jsx`
* `frontend/src/components/studio/StudioHeader.jsx`
* `frontend/src/pages/Studio.jsx`
* `AI_DEVELOPMENT_JOURNAL.md`

## Features Implemented
* Added a reusable `AudioPreviewCard` component for Studio live preview media.
* Replaced the previous fake YouTube-style audio placeholder with a custom MP3/audio preview.
* Built the audio preview around a CSS-rendered vinyl record:
  * black vinyl body
  * circular groove rings
  * glossy highlights
  * colored center label
  * centered play/pause control
  * CSS rotation while audio is playing
* Added real audio playback for uploaded MP3/audio files in the live preview.
* Added a duration/progress slider for uploaded audio previews.
* Kept YouTube embeds available for pasted YouTube links and restored the default placeholder YouTube preview when no media is provided.
* Ensured media preview priority is consistent:
  * generated/uploaded video first
  * YouTube embed next
  * uploaded audio/vinyl preview next
  * empty placeholder last
* Updated the live preview Song Summary to reflect real metadata values immediately.
* Updated empty metadata preview labels so incomplete fields read clearly to creators.
* Prevented uploaded media filenames and upload controls from overflowing their container.
* Removed Creator Studio profanity blacklist validation so trusted creators are not blocked from legitimate song titles, artist names, descriptions, or lyrics.
* Kept validation focused on required fields, field length, trimming, HTML avoidance, and whitelist-based values where appropriate.
* Improved mood tag UX so the maximum-tag state is handled more cleanly instead of replacing the input area with a large inline warning.
* Added real MP3 playback support to the Preview & Publish page.
* Added a Preview & Publish audio progress strip with current time, total duration, and seek behavior.
* Updated Preview & Publish to consume live Studio state for:
  * title
  * artist
  * description
  * theme
  * languages
  * mood tags
  * lyrics
  * uploaded audio/video
  * YouTube link
  * duration
  * draft save timestamp
* Fixed the Preview & Publish checklist so Lyrics readiness is based on the actual lyrics draft instead of being hardcoded as ready.
* Simplified Preview & Publish into a creator-focused workflow:
  * status
  * last edited
  * visibility
  * AI generation state
  * estimated duration
  * publish controls
  * compact checklist
  * public preview
* Removed the `Explore & Learn` section from the creator publishing workflow.
* Removed the tip card from Preview & Publish.
* Removed Desktop, Tablet, and Mobile preview buttons.
* Changed the Preview & Publish stepper to use the same full-width layout as the Metadata and Lyrics pages.
* Fixed the large vertical gap in the public preview card by preventing the preview card grid rows from stretching.
* Changed AI Video readiness so it is only complete when an uploaded MP4/video exists.
* Fixed the Preview & Publish `Save Draft` action so it calls the save handler instead of the generate-video handler.

## AI Assistance
AI was used to:
* translate screenshot feedback into focused React and CSS changes
* identify component wiring issues across `Studio.jsx`, `LivePreviewCard`, `AudioPreviewCard`, `PreviewPublishPanel`, and `StudioHeader`
* design the reusable vinyl-based audio preview without external animation libraries
* preserve live reactivity by keeping `Studio.jsx` as the source of truth for creator inputs
* simplify the publishing workflow by separating creator tasks from public-learning features
* debug UI behavior caused by CSS grid stretching and mismatched button handlers
* verify changes with repeated frontend lint and production build checks

## Decisions Made
* Treated Creator Studio as a trusted authenticated creator workflow, so profanity blocking was removed from metadata validation.
* Kept public moderation concerns separate from creator metadata entry.
* Used whitelists and field validation for structured values such as theme, mood, and language.
* Kept YouTube embeds for pasted links and placeholder preview behavior, but stopped counting YouTube placeholders as generated AI video.
* Chose uploaded MP4/video as the current frontend-only signal that AI Video is complete.
* Removed public learning modules from Preview & Publish because they belong in the public song experience, not the creator publishing workflow.
* Kept draft, publish, schedule, and AI-generation state frontend-only until backend persistence is expanded.
* Kept simple browser alerts for save/publish feedback until a dedicated toast or modal system is introduced.

## Remaining Work
* Persist draft saves, publish state, scheduled publish date, and AI video generation status to the backend.
* Replace browser alerts with polished in-app toast or modal feedback.
* Add a real generated video URL/status once AI video generation is connected.
* Store uploaded media metadata and generated previews in persistent song records.
* Add backend validation that mirrors the frontend trusted-creator field rules.
* Add automated component tests for preview reactivity and publish checklist readiness.
* Revisit mobile layout screenshots for the vinyl/audio preview and Preview & Publish sidebar.

## Verification
* `npm.cmd run lint --prefix frontend`
* `npm.cmd run build --prefix frontend`

---

# Additional Recent Entry Not Yet Present in the Shared Journal

## 2026-07-10 — Reflection Wall Visual Hierarchy and Interaction Refinement

### Feature

Reflection Wall layout, typography, filtering controls, and reflection submission entry point.

### AI tools used

ChatGPT and Codex.

### Objective

Refine the Reflection Wall so it feels balanced, readable, and closer to the intended Padlet-style experience.

### Prompt and review summary

I reviewed the latest Reflection Wall implementation in the browser and identified several visual problems:

- the Reflection Wall heading colour was too dark against the background;
- the first suggested lighter purple did not necessarily suit the dark page, so I wanted a slightly darker pastel purple that still had enough contrast;
- duplicate or competing `Add Reflection` controls made the primary action unclear;
- login and register controls did not stand out enough from the background;
- spacing between the heading, filters, controls, and reflection cards felt inconsistent;
- pill-style filter buttons added too much visual weight;
- the filters felt disconnected from the centre of the page;
- the intended end state was closer to a clean Padlet board with one obvious add action.

I also examined an inline React heading style:

```jsx
<h1 style={{ color: 'rgb(112, 64, 219)' }}>Reflection Wall</h1>
```

The underlying problem was not simply JSX syntax. The selected colour was too dark and saturated for the page background, so the design needed a token or class that could be tuned consistently rather than another isolated inline value.

### Decisions made

I directed Codex to:

- use one clear primary `Add Reflection` action;
- avoid keeping two visually equal add buttons unless they serve different contexts;
- centre or better separate the filtering controls from account actions;
- replace heavy filter pills with a quieter active-state treatment such as purple text and an underline;
- improve spacing rhythm between the page heading, description, filters, account controls, and board;
- give login and register controls enough background contrast without making them compete with the primary reflection action;
- choose a purple that is lighter than the original heading but still suitable for the dark background;
- preserve the Padlet-style final goal rather than drifting back into a generic dashboard.

### Human review

The changes were not accepted merely because the page rendered. I compared screenshots at multiple stages and continued to question whether hierarchy, alignment, and spacing felt intentional.

### Current outcome

The Reflection Wall direction is clearer:

- one dominant submission action;
- quieter filter navigation;
- improved contrast;
- more deliberate grouping of controls;
- stronger resemblance to the target community board.

### Remaining work

- finish the spacing pass at the target 1280-pixel laptop width;
- verify tablet and mobile wrapping;
- ensure the reflection composer opens predictably from the chosen primary action;
- connect filters and reflection data to the backend;
- test account-state variations for guest, registered, and creator users.

### Lesson

When a layout feels “weird,” the problem is often not one margin value. It can come from several controls competing for attention, weak grouping, inconsistent vertical rhythm, and too many button styles on the same level.

---

# Consolidated Review of My Contribution

## Main Product Decisions I Made

Across my work, I repeatedly made decisions that changed AI-generated output rather than accepting the first result:

- turned the rhythm game into part of the listen–play–reflect journey;
- used generated music video as the rhythm-game background while protecting note readability;
- required an intentional start state, countdown, pause behaviour, and results bridge;
- redesigned the Reflection Wall around memory-sharing rather than generic CRUD cards;
- separated creator, registered, and guest navigation;
- rebuilt the Creator Studio when incremental patching became unstable;
- organised Studio around Metadata, Lyrics, and Preview & Publish;
- kept `Studio.jsx` as the shared source of truth for live preview values;
- made AI-generated lyrics explicitly editable drafts;
- added clearer status and error states for transcription;
- introduced a dedicated publishing panel instead of overloading the live-preview component;
- removed fake analytics and fake playback values;
- removed unrelated public-learning content from the creator publishing workflow;
- replaced the fake MP3 preview with a functional audio card and vinyl visual;
- removed profanity blacklist validation from the trusted creator metadata workflow while retaining structured validation;
- distinguished a placeholder YouTube preview from a genuinely generated AI video;
- repeatedly simplified pages when too many cards, pills, or duplicated controls weakened the hierarchy.

## How I Used AI

AI was strongest at:

- scaffolding React components;
- translating visual references into CSS and component changes;
- generating backend route and service starting points;
- identifying likely wiring errors;
- refactoring repeated UI into reusable components;
- producing validation and status-state logic;
- suggesting architecture and documentation structures;
- running or recommending lint, test, build, and syntax checks.

AI was weaker at:

- matching a visual target on the first attempt;
- knowing which controls were truly necessary;
- understanding the emotional purpose of the Reflection Wall;
- deciding when a layout was too dense;
- distinguishing creator workflow needs from public-user needs;
- avoiding fake placeholder data that looked realistic but was misleading;
- preserving consistency across several rounds of UI changes without explicit constraints;
- recognising local environment issues such as PATH configuration without targeted debugging.

My role was to provide the references, reject mismatched outputs, narrow the scope, make product decisions, test the result in the browser, and ask for specific corrections.

## Testing and Verification Practices

Commands recorded across my feature work included:

```text
npm run lint
npm run build
npm run test
npm.cmd run lint
npm.cmd run build
npm.cmd test
npm run lint --prefix frontend
npm run test --prefix frontend
npm run build --prefix frontend
npm run lint --prefix backend
npm run test --prefix backend
node --check services/transcriptionService.js
node --check services/audioExtractionService.js
node --check routes/transcriptions.js
```

Other verification included:

- opening gameplay and results routes manually;
- checking creator routing in the browser;
- checking local frontend and backend servers;
- testing backend health and transcription-status endpoints;
- posting uploaded media and YouTube inputs to the backend;
- comparing page screenshots against Figma and other visual references;
- testing responsive behaviour at laptop, tablet, and mobile widths;
- testing state resets when media sources changed;
- checking real audio playback, progress, pause, and seek behaviour.

The commands above are a consolidated record from the existing journal. Future entries should state exactly which checks passed for that specific task.

## Known Gaps

At the time of this consolidation, several areas remained incomplete or partially frontend-only:

- metadata saving and publishing still needed complete backend persistence;
- scheduled publishing was UI-only;
- real generated-video status and URL integration were incomplete;
- Reflection Wall CRUD and moderation still required full backend wiring;
- the rhythm-game beatmap remained manually prepared demo data;
- exact lyrics could not be guaranteed through speech transcription;
- YouTube extraction could be affected by availability, regional restrictions, or anti-bot behaviour;
- automated component and integration test coverage needed expansion;
- final deployment and production smoke testing still needed completion;
- some responsive layouts needed final checks at the team's different laptop widths.

## Personal Lessons

1. A functional page can still be wrong if it does not support the intended user journey.
2. Rebuilding a component can be more efficient than continuing to patch an unstable structure.
3. Screenshot-based prompting works best when I explain the hierarchy and behaviour, not only say “make it look like this.”
4. Fake values should be obviously placeholders or removed; realistic-looking fake analytics can mislead reviewers.
5. Frontend state should have a clear source of truth when several preview components need to update together.
6. Creator workflows and public-user workflows should not be mixed merely because they share song data.
7. Error states need to explain what the user can do next.
8. Environment variables and local executables require deliberate configuration and should never be copied into documentation with real secret values.
9. Responsive design needs testing at the actual widths used by teammates, not only generic browser presets.
10. AI accelerates implementation, but human judgement is still required for scope, relevance, accessibility, hierarchy, and honesty.

---

# Template for Future Entries

Copy and append this section for every substantial future AI-assisted task.

## YYYY-MM-DD — Feature or Task Name

### AI Tool Used

Codex / ChatGPT / other.

### Objective

State the concrete problem being solved and why it matters.

### Context

Describe the relevant page, route, component, backend service, user flow, bug, or design reference.

### Prompt Summary

Summarise the important instructions given to AI. Do not paste the entire conversation unless exact wording is essential.

### AI Output

Record what AI generated, changed, diagnosed, or recommended.

### My Review and Decisions

Record:

- what I accepted;
- what I rejected;
- what I changed;
- what assumptions I corrected;
- why I chose the final direction.

### Files Created

- `path/to/file`

### Files Modified

- `path/to/file`

### Verification Performed

Record only checks that actually ran, for example:

- lint;
- tests;
- production build;
- route check;
- browser interaction;
- responsive check;
- API request;
- database check.

### Final Outcome

State the implemented result without overstating incomplete work.

### Remaining Work

Record limitations, integration gaps, and next steps.

### Lesson

Write one practical lesson from the task.

---

# End-of-Project Reflection Placeholder

Complete this section near submission.

## What I Built

Summarise my completed creator-side and public-side features.

## What I Personally Decided

Summarise the key product, design, validation, and architecture decisions that were not simply copied from AI.

## What AI Accelerated

Identify where AI saved time or expanded what I could implement.

## Where AI Required Correction

Provide concrete examples of poor first attempts, incorrect assumptions, or overcomplicated output.

## Technical Growth

Reflect on React, Express, PostgreSQL/Supabase, API integration, authentication, responsive design, testing, deployment, and AI-assisted development.

## What I Would Change

Identify what I would plan, build, test, or document differently in a future project.

---

## 2026-07-10 — Public Landing Navbar Hierarchy and Visual Refinement

### AI Tool Used

Codex.

### Objective

Refine the public guest navbar so the wide Shades of SG logo, five navigation destinations, and authentication actions remain readable and visually balanced without making every item compete as a button.

### Context

The landing-page navbar originally placed the logo, all navigation links, Login, and Register in one shared flex row. The logo width and longer labels such as `Learning Hub`, `Rhythm Game`, and `Reflection Wall` squeezed the available space and made equal CSS gaps appear inconsistent. Filled active and authentication pills also gave too many elements the same visual weight.

### Prompt Summary

I reviewed several navbar iterations and directed Codex to:

- preserve all existing navigation destinations;
- treat Register as the primary guest call-to-action and Login as a secondary text action;
- reduce the size and visual weight of the Register control;
- increase spacing around the authentication actions;
- make the active-page treatment quieter than the Register CTA;
- add a lavender hover interaction to Login;
- add vertical container padding after observing that the logo and controls felt cut off;
- reorganise the final desktop navbar into three independent groups: logo, centred primary navigation, and authentication actions;
- centre the primary navigation relative to the viewport rather than the leftover flex space;
- replace filled navigation pills with a brighter-text and purple-underline active state;
- animate the underline on hover;
- increase navigation spacing to approximately `2.5rem`;
- reduce the logo and navbar height slightly;
- retain a responsive mobile menu before the desktop groups begin to collide.

### AI Output

Codex updated the React navbar and its CSS across several reviewed iterations. The final implementation:

- renders a dedicated three-group guest navbar while preserving the existing registered-user and creator navbar path;
- positions the desktop primary navigation independently at the horizontal centre;
- separates Login and Register into their own right-aligned authentication group;
- uses typography and an animated purple underline for primary link hover and active states;
- keeps Register as the only filled purple-gradient control;
- keeps Login as a plain text action with interactive underline feedback;
- uses `2.5rem` spacing between desktop primary navigation links;
- reduces the guest logo width and navbar height;
- includes vertical padding so the contents do not appear clipped;
- changes to a dropdown-style mobile menu below `1100px` to prevent overlap.

### My Review and Decisions

I did not accept the first visual treatment as final. I first asked for clearer Login/Register hierarchy, then refined button size, spacing, active-state contrast, hover behaviour, and vertical padding after reviewing the navbar in the browser.

I later identified that button styling was not the root problem. The shared horizontal flex layout was allowing the wide logo and long navigation labels to squeeze the centre links. I therefore chose a three-group layout with independently centred primary navigation. I also rejected filled pills as the final navigation language because they made the header feel chunky and dashboard-like. The chosen direction uses one active underline and one filled CTA so the cultural storytelling site feels cleaner and more content-led.

### Files Created

None.

### Files Modified

- `frontend/src/components/Navbar.jsx`
- `frontend/src/App.css`
- `ferlyn_journal.md`

### Verification Performed

- Ran `npx.cmd eslint src/components/Navbar.jsx` successfully after the navbar component changes.
- Ran `npm.cmd run test -- --run` in `frontend` successfully; one Vitest test file and one test passed.
- Initially attempted the frontend npm commands through PowerShell's `npm.ps1`, but Windows execution policy blocked that launcher; the checks were rerun through `npm.cmd`.
- Attempted the full frontend lint command. It reported three existing `react-hooks/set-state-in-effect` errors in `ReflectionModal.jsx` and `ReflectionWall.jsx`, unrelated to the navbar changes.
- Reviewed the navbar through a localhost browser screenshot and used that review to request the spacing, clipping, and layout refinements.

The final standalone 10-pixel vertical-padding adjustment was not followed by another automated test run because it was a CSS-only spacing change. The component lint and frontend test had passed immediately before the subsequent final layout and spacing refinements.

### Final Outcome

The guest navbar now has a clearer hierarchy: a smaller logo on the left, independently centred navigation with a single active underline, and Login plus one prominent Register CTA on the right. The responsive breakpoint prevents the three desktop groups from colliding on narrower screens. Registered-user and creator navigation behaviour remains separate.

### Remaining Work

- Perform a final browser check at the target laptop, tablet, and mobile widths after all CSS refinements.
- Confirm keyboard focus styling and menu behaviour across the guest links.
- Consider replacing Login/Register with a notification and named profile menu for authenticated users as a separate future enhancement.
- Run the full frontend lint suite after the unrelated Reflection Wall hook errors are resolved.

### Lesson

When navbar spacing appears inconsistent, increasing `gap` alone may not solve it. Wide branding, long labels, and authentication controls can compete within one flex row; separating them into logical groups and centring navigation independently creates a clearer hierarchy with fewer decorative controls.

### Verification Clarification

The 10-pixel vertical-padding iteration itself was not immediately retested. It was subsequently replaced by the final three-group redesign, which uses 8-pixel vertical padding to meet the later request for a slightly shorter navbar. The successful component lint and Vitest run recorded above were performed after that final redesign, so they cover the current React structure and final CSS layout rather than only the earlier iteration.

---

## 2026-07-10 — Public Page Rhythm, Landing Route, and Footer Refinement

### AI Tool Used

Codex.

### Objective

Improve the cohesion of the public experience by standardising spacing below the navbar, ensuring the website opens on the landing page, and redesigning the footer into a polished cultural-site footer with working contact and social actions.

### Context

The public pages began too close to the navbar, making hero borders and the navbar divider visually merge. A stored creator session also redirected the root route to `/creator/dashboard`, even when the visitor opened the public website. The original footer contained generic quick links, lacked Reflection Wall and Home, and did not communicate the project's identity strongly enough.

### Prompt Summary

I directed Codex to:

- introduce consistent breathing room below the public navbar;
- use approximately 24 pixels for heading-led pages and 32 pixels for hero-led pages;
- preserve hero dimensions while aligning page content consistently;
- make `/` load the landing page instead of automatically redirecting a stored creator user to the dashboard;
- restructure the footer around branding, Explore, About, and Socials;
- include the core public experiences and remove Profile and Settings;
- add real email actions for Contact Us, Feedback, and vulnerability reports using `shadesofsg@gmail.com`;
- connect social icons to Facebook, Instagram, YouTube, and LinkedIn, and remove TikTok;
- use recognisable brand icons rather than hand-drawn approximations;
- make links white and change them to `rgb(242, 183, 68)` on hover;
- remove circles around social icons;
- make all internal navigation open at the top of the destination page;
- refine the footer spacing so its columns feel cohesive rather than spread across the full viewport;
- align the copyright and legal information in a GenConnect-inspired bottom row without copying incompatible Bootstrap or Flask markup.

### AI Output

Codex implemented the following:

- shared page-stack padding for standard public pages;
- larger top spacing for the landing and Learning Hub heroes;
- dedicated Reflection Wall top spacing;
- removal of the creator-only redirect from the public root experience;
- a reusable `ScrollToTop` component driven by React Router location changes;
- a full-width deep-navy footer with a compact centred content composition;
- a smaller footer logo and narrower description block;
- Explore, About, and Socials columns with stronger spacing and purple heading accents;
- working `mailto:` actions with prefilled subjects;
- Bootstrap Icons for official-looking social brand marks;
- external social links that open safely in new tabs;
- white link styling with golden hover colour, underline, arrow, and subtle movement;
- a horizontal copyright/legal row that stacks cleanly on small screens;
- reduced-motion handling for footer animations.

Codex also diagnosed why pasted GenConnect markup failed: React requires `className`, the project did not use Bootstrap layout utilities, and Flask/Jinja expressions such as `url_for(...)` cannot run inside a React component.

### My Review and Decisions

I reviewed the footer through several visual iterations. I rejected Profile and Settings because the public footer should explain what visitors can explore, not expose account features. I replaced the generic `Quick Links` heading with `Explore` and kept Reflection Wall because it is a flagship public feature.

I initially considered text-based social links, then chose compact icons. I asked for Facebook and LinkedIn, removed TikTok, and chose recognisable Bootstrap brand icons. I also removed the circular icon containers and selected gold as the shared hover colour.

After comparing the result with GenConnect, I retained the Shades of SG hierarchy and whitespace but pulled the columns closer together, reduced the branding block, strengthened the heading underline, and tightened the copyright/legal row. I kept the full-width navy background while grouping the actual content into a more cohesive composition.

### Files Created

- `frontend/src/components/ScrollToTop.jsx`

### Files Modified

- `frontend/index.html`
- `frontend/src/App.jsx`
- `frontend/src/App.css`
- `frontend/src/components/Footer.jsx`
- `ferlyn_journal.md`

### Verification Performed

- Ran targeted ESLint checks for `App.jsx`, `Footer.jsx`, and `ScrollToTop.jsx` successfully during their respective changes.
- Ran the frontend production build repeatedly after the routing, footer, icon, scroll, and spacing changes; each recorded build passed.
- Ran `git diff --check` on the changed frontend files after the main iterations.
- Attempted the full frontend lint command. It continued to report three existing `react-hooks/set-state-in-effect` errors in Reflection Wall files, unrelated to this work.

### Final Outcome

The public website now opens on the landing page at `/`, and internal route navigation returns users to the top. Public pages have a more consistent visual rhythm below the navbar. The footer now presents the Shades of SG identity, core public journeys, contact actions, official-style social icons, and a balanced legal row in a responsive full-width composition.

### Remaining Work

- Replace platform homepage URLs with official Shades of SG social profile URLs when those accounts are available.
- Create real Privacy Statement and Terms of Use pages before turning their current footer labels into navigation links.
- Perform a final browser review across the target presentation laptop and mobile widths.
- Resolve the unrelated Reflection Wall hook lint errors before requiring a completely clean full-project lint run.

### Lesson

A polished footer depends on composition as much as content. A full-width background can provide visual closure while a narrower, deliberately clustered grid keeps columns connected. Framework-specific markup should also be translated into the project's actual stack instead of pasted directly into React.

---

## 2026-07-10 — Reflection Wall CRUD Integration, Memory-Board UX, and Brand Consistency

### AI Tool Used

Codex.

### Objective

Turn Public Task 4's Reflection Wall from a duplicated, mock-data page into a database-backed community memory board with working create, read, update, and delete behaviour, ownership protection, authentication continuity, responsive masonry, and a distinctive Shades of SG visual identity.

The same work session also addressed local dependency and merge-related build failures and replaced temporary `SG` brand marks with the real project logo.

### Context

The Reflection Wall initially rendered its own navigation and background inside the shared public layout. This produced a double-layer appearance, excessive height, competing page backgrounds, and constrained board width. Its posts were hardcoded and saved to browser storage rather than the backend.

The branch also contained a bad merge result that concatenated old placeholder page implementations with newer implementations. This caused duplicate default exports, unclosed React functions, and one unclosed CSS block. Frontend and backend dependencies were also temporarily out of sync, causing missing-module errors for `yup` and `nodemailer` on the branches where those packages were declared but not installed.

### Prompt Summary

I directed Codex through several reviewed iterations to:

- diagnose the double-layer issue from the component tree rather than hide it with margins;
- remove the Reflection Wall's duplicate navigation, background, full-viewport wrapper, and obsolete `reflection-shell` behaviour;
- keep one shared `MainLayout` while allowing the board to use a wider content area;
- replace hardcoded and local-storage reflection data with real Express and Sequelize CRUD endpoints;
- make reading public while requiring authentication for creation, editing, and deletion;
- restrict editing and deletion to the reflection owner;
- preserve optimistic updates, loading feedback, rollback, errors, confirmations, and toast notifications;
- add search, song filtering, latest/oldest sorting, and a responsive masonry layout;
- show the Add Reflection action in the compact empty state when no posts exist, then move it to the toolbar after the first post exists;
- redesign posts as pinned memory notes rather than generic social-media cards;
- use stable muted stationery colours, small rotations, push pins, tape, paperclips, and restrained doodles;
- keep the Shades of SG dark-purple atmosphere instead of using a corkboard texture;
- improve heading, toolbar, input, empty-state, and modal contrast;
- show a friendly authentication-required dialog with Login, Register, and Cancel actions;
- return users to `/reflections` after login or registration, reopen the composer, and restore a session-backed reflection draft;
- make the post-login intent mechanism reusable for future protected actions;
- replace temporary text and `SG` block marks with the real `public/images/Brand Logo.png` asset across shared frontend surfaces;
- remove the old CSS that placed a purple gradient tile behind the transparent logo image;
- update the browser title and favicon from the Vite defaults to Shades of SG branding.

### AI Output

Codex implemented and refined:

- signed-token parsing and reusable optional/required authentication middleware;
- `/api/reflections` GET and POST routes plus owner-restricted PUT and DELETE routes;
- public song-list loading for the Reflection form and filter;
- reflection API integration tests covering authenticated CRUD and unauthenticated rejection;
- modular frontend components for filters, cards, masonry, empty state, reflection modal, and authentication-required modal;
- a dedicated reflection service for backend requests;
- a session-storage post-login intent service used by Login, Register, and Reflection Wall;
- optimistic create, edit, and delete handling with rollback when an API request fails;
- a compact responsive board using four to five desktop columns, fewer tablet columns, and one mobile column;
- deterministic note colour, rotation, pin/tape/clip style, and occasional decorative doodles based on reflection id;
- a shared `BrandLogo` component used by the navbar, authentication layout, creator sidebar, footer, and placeholder pages;
- removal of stale placeholder logo styles so only the transparent image is displayed;
- restoration of functional account registration on this branch;
- cleanup of concatenated placeholder page prefixes and the malformed CSS block introduced by the branch merge.

### My Review and Decisions

I did not accept the first Reflection Wall layout as final. I reviewed the page through screenshots and repeatedly narrowed the direction:

- I identified that the page still looked layered and required Codex to inspect `MainLayout`, duplicate wrappers, page backgrounds, and viewport-height rules before changing spacing.
- I rejected a tall landing-page hero because Reflection Wall should open directly into a working board.
- I chose a maximum width near 1400 pixels so the masonry board could use more of the screen.
- I chose an empty-board-first action pattern: the first Add Reflection button belongs in the empty state, while an established board keeps the action in its toolbar.
- I chose memory notes over equal rectangular cards because the feature should communicate personal stories rather than resemble Facebook, Reddit, or a dashboard.
- I first explored light pastel notes and a warm board, then corrected the direction to richer vintage stationery colours on a dark-purple Shades of SG board because pale notes and cork styling did not harmonise with the application.
- I limited handwritten styling to the page title and kept reflection bodies in the standard readable font.
- I required authentication to preserve user intent instead of sending guests to Login with no explanation or return context.
- I chose `sessionStorage` for post-login intent and draft restoration so the flow survives reloads without becoming permanent local data.
- I requested the real brand image throughout the frontend and then identified that an obsolete descendant `span` rule was creating an unwanted purple square behind it. That placeholder rule was removed.

### Files Created

- `backend/middleware/auth.js`
- `backend/routes/reflections.js`
- `backend/tests/reflections.test.js`
- `frontend/src/components/AuthRequiredModal.jsx`
- `frontend/src/components/BrandLogo.jsx`
- `frontend/src/components/ReflectionCard.jsx`
- `frontend/src/components/ReflectionEmptyState.jsx`
- `frontend/src/components/ReflectionFilters.jsx`
- `frontend/src/components/ReflectionGrid.jsx`
- `frontend/src/components/ReflectionModal.jsx`
- `frontend/src/services/postLoginIntent.js`
- `frontend/src/services/reflectionService.js`

### Files Modified

- `backend/routes/auth.js`
- `backend/routes/songs.js`
- `backend/server.js`
- `backend/services/authService.js`
- `frontend/index.html`
- `frontend/src/App.css`
- `frontend/src/components/Footer.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/studio/CreatorSidebar.jsx`
- `frontend/src/layouts/AuthLayout.jsx`
- `frontend/src/layouts/MainLayout.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/PlaceholderPage.jsx`
- `frontend/src/pages/ReflectionWall.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/services/authApi.js`

The merge repair also removed duplicated placeholder prefixes from affected page files including Dashboard, Forgot Password, Generation Progress, Instrument Playground, Landing, Learning Hub, Login, Not Found, Profile, Reflection Moderation, Register, Reset Password, Rhythm Hub, Settings, Song Experience, Songs Library, Studio, and Trivia Hub. These changes were integration cleanup rather than claims of feature ownership for those teammate pages.

### Verification Performed

- Ran `npm.cmd install` in the frontend after confirming `yup` was declared in both `package.json` and `package-lock.json`; installation completed and `npm.cmd ls yup --depth=0` reported `yup@1.7.1`.
- Ran `npm.cmd install nodemailer@9.0.3` in the backend after the first dependency sync attempt failed with an operating-system/network permission error; the installation completed and a direct Node require check loaded `nodemailer` and the authentication route successfully.
- Ran the frontend production build repeatedly during merge repair, Reflection Wall refactoring, authentication UX, sticky-note styling, toolbar behaviour, and logo replacement. The final recorded `npm.cmd run build` completed successfully with 104 modules transformed.
- Ran the frontend Vitest suite repeatedly during the implementation. The latest recorded test run before the final logo-only CSS correction passed one test file and one test.
- Ran the backend Jest suite after the reflection CRUD and registration work. Three test suites and five tests passed.
- Verified that the generated reflection test SQLite database was removed after the test and added automatic cleanup to the test file.
- Searched the frontend source for remaining `SG` placeholder brand marks after introducing `BrandLogo`; no remaining JSX stand-ins were found.
- Ran a direct duplicate-export scan after repairing the branch merge; no page with multiple `export default function` declarations remained.

No full-project lint pass was recorded for this consolidated task. Browser appearance was reviewed through the screenshots I supplied and the resulting requested iterations; a final automated cross-browser or device-matrix test was not performed.

### Final Outcome

The Reflection Wall now uses one clean shared layout and loads real reflection and song data from the backend. Registered users can create reflections, edit or delete their own posts, and receive optimistic feedback. Guests can browse publicly and receive a contextual authentication dialog when they try to contribute. Login and registration return them to the wall, reopen the composer, and preserve the draft intent across reloads.

Visually, the wall is now a responsive dark-purple community memory board with varied muted stationery notes, clear song identity, compact filters, and restrained decorative details. The empty-state and toolbar Add Reflection behaviour changes naturally once the first post exists. Shared public, authentication, creator, footer, placeholder, favicon, and document-title branding now use the real Shades of SG identity instead of temporary Vite or `SG` block marks.

### Remaining Work

- Perform final browser checks at the team's target laptop, tablet, and mobile widths.
- Add broader automated component tests for the authentication dialog, draft restoration, filtering, optimistic rollback, and ownership menus.
- Review whether new reflections should remain immediately approved or enter the creator moderation workflow before production.
- Replace temporary song and media data with the final published catalogue where those upstream features are still incomplete.
- Add token expiry and server-side session validation before treating the current local authentication mechanism as production-ready.
- Run the complete frontend and backend lint suites after resolving any unrelated pre-existing lint issues.

### Lesson

A strong feature refinement requires separating structural bugs from visual symptoms. The Reflection Wall's layering could not be solved reliably by reducing margins because the real causes were legacy layout branching, duplicate viewport-height behaviour, and multiple backgrounds. Once the component tree and data path were simplified, visual iteration, authentication continuity, and reusable branding became much easier to implement without breaking CRUD behaviour.

---

## 2026-07-10 — Terms & Conditions and Privacy Policy Legal Experience

### AI Tool Used

Codex.

### Objective

Create a complete public legal experience for Shades of SG by replacing the footer's inactive legal labels with dedicated Terms & Conditions and Privacy Policy pages. Both pages needed to feel like polished parts of the consumer website rather than plain legal documents or developer documentation.

The work also aimed to establish a consistent legal-page design language: a compact branded hero, lightweight sticky quick navigation, rounded content cards, readable typography, accurate platform-specific content, responsive behaviour, smooth anchor navigation, active-section tracking, and restrained scroll-reveal motion.

### Context

Before this task, the public footer displayed a Privacy Statement link that returned users to the homepage and a Terms label that did not lead to a completed legal page. The project already had a dark navy visual foundation, lavender and violet accents, rounded components, shared public navigation, and a full footer, but it did not have a legal-page pattern.

The first Terms implementation established the correct information architecture but initially felt too much like a documentation page. Its hero and typography were also too large for the amount of legal content, and the original quick-navigation pills competed visually with the section cards. The page therefore went through several screenshot-led refinements before becoming the reference design for the Privacy Policy.

### Prompt Summary

I asked Codex to:

- create a dedicated Terms & Conditions page within the existing public `MainLayout`;
- add a clean hero containing the title, introduction, and last-updated date;
- add sticky quick navigation for Acceptance of Terms, Community Guidelines, User Accounts, Reflections & User Content, Intellectual Property, Privacy, Limitation of Liability, and Contact;
- write content specifically for an educational, community-driven Singapore music platform rather than generic placeholder legal copy;
- present every major section in its own rounded card with purple headings, subtle borders, and generous spacing;
- preserve the Shades of SG dark navy, lavender, violet, rounded-component, and typography system;
- enable smooth anchor scrolling and end with a continued-use acceptance note;
- connect the page to the footer;
- polish the page so it felt warmer, brighter, more editorial, and less like technical documentation;
- replace heavy navigation pills with lightweight links and an active lavender underline;
- alternate card tones, strengthen section hierarchy, and add restrained musical decoration;
- compact the oversized hero and progressively tune the legal typography based on screenshots;
- set quick-navigation text and legal body copy to 14 pixels and section numbers to 15 pixels;
- remove the document icon from the Terms hero;
- create a companion Privacy Policy page using the same design and layout;
- cover information collection, data use, cookies, third-party services, security, user rights, children's privacy, and contact information;
- use subtle blue-indigo privacy accents without departing from the purple theme;
- connect the footer Privacy Policy link to the new route;
- add scroll-triggered fade and slide motion to both pages;
- refine quick-navigation interaction so a programmatic jump did not trigger every intermediate card animation while moving through the page.

### AI Output

Codex created a new public `/terms` route and a complete `TermsAndConditions` React page. The page contains eight platform-relevant legal sections covering use of the service, community safety, accounts, user reflections, intellectual property, privacy, liability, and contact. The content explicitly addresses learner and educator use, community moderation, user-generated reflections, anonymous display behaviour, classroom use, cultural sensitivity, third-party rights, and the platform's educational purpose.

The Terms page was connected to the shared footer through a real React Router link. The previous Terms label and an intermediate invalid route containing spaces were replaced with the canonical `/terms` route and the visible footer label was standardised as “Terms & Conditions.”

Codex then refined the Terms design through several visual iterations:

- introduced a branded navy-to-purple hero with subtle texture, a fine circular outline, a title divider, and a faint musical-note watermark;
- changed the quick navigation from filled pills to lightweight underlined anchor links;
- made the navigation sticky beneath the main navbar and horizontally scrollable at narrower widths;
- added `aria-current="location"` to the active section link;
- tracked the visible section with `IntersectionObserver` so the underline follows reading position;
- alternated slate and indigo card backgrounds to avoid a wall of identical navy panels;
- increased section-heading hierarchy and added narrow violet dividers beneath headings;
- used two-digit lavender section numbers to create a clear reading sequence;
- limited paragraph width, increased line height, and separated paragraphs for a calmer legal-reading experience;
- retained responsive one-column cards and horizontal navigation on mobile;
- respected `prefers-reduced-motion` for smooth scrolling and entrance animations.

The hero was subsequently compacted in response to visual feedback. Its minimum height, padding, icon scale, title scale, divider spacing, paragraph spacing, and decorative-note size were reduced. The document icon was later removed entirely and the grid was collapsed so the copy remained correctly aligned without an unused icon column.

Typography was tuned independently from component dimensions. The final compact type rules use 14-pixel quick-navigation links, 14-pixel legal body copy and list items, and 15-pixel section numbers, while headings retain a larger responsive scale. This preserved the card spacing and visual hierarchy without making the long-form content feel oversized.

Codex then created the companion `/privacy` route and `PrivacyPolicy` page. It deliberately reused the established Terms classes so both pages share hero proportions, navigation behaviour, card spacing, type scale, section numbering, footer-note styling, and responsive behaviour. The Privacy page introduces only controlled visual differences: a blue-indigo variation of the hero gradient, a faint shield-lock watermark, cooler dividers, slightly bluer card tones, and a lock icon in the closing transparency note.

The Privacy Policy contains eight skimmable sections:

- Information We Collect;
- How We Use Your Data;
- Cookies;
- Third-Party Services;
- Data Security;
- Your Rights;
- Children's Privacy;
- Contact.

Its copy covers account and profile information, reflections, learning activity, rhythm-game progress, preferences, analytics, browser/device data, moderation, authentication, session storage, cookie controls, account deletion, reflection deletion, younger-user supervision, and support contact details. The page ends with a transparency-and-trust message.

Codex checked the actual repository before naming third-party services. It confirmed Cloudinary usage and the project's Sequelize/PostgreSQL/SQLite data layer, and avoided incorrectly claiming that Supabase was in use. The final copy names Cloudinary, database and infrastructure providers in general terms, and YouTube where linked or embedded media is involved.

The footer's former homepage-bound Privacy Statement link was replaced with a `Privacy Policy` link to `/privacy`. Both legal pages therefore now have working entry points in the global footer and remain available to guests and signed-in users through the shared public layout.

For motion, Codex reused the project's existing `Reveal` component and `useReveal` hook instead of adding a second animation system. It extended `Reveal` so semantic HTML attributes such as `id` and `aria-label` can pass through to the rendered tag. Heroes, navigation bars, section cards, and closing notes now fade and translate into place as they enter the viewport. Card delays alternate slightly to avoid mechanical simultaneous motion.

The first quick-navigation animation behaviour revealed intermediate cards as smooth scrolling passed them. Codex corrected this by adding navigation-aware reveal suspension. When a user selects a quick-navigation link, the page:

1. updates the active link immediately;
2. updates the URL fragment without reloading the route;
3. smoothly scrolls to the selected section;
4. temporarily suspends observers on unrevealed legal cards during the programmatic scroll;
5. restores observation after the scroll interval so the destination card reveals softly;
6. preserves the normal per-card reveal experience during manual scrolling.

Timeout references are cleared during component unmounting, and already revealed cards remain visible. Visitors with reduced-motion preferences continue to receive static content without transforms or transitions.

### My Review and Decisions

I accepted the initial Terms information structure but did not accept its first visual treatment as final. I judged that the page felt like developer documentation and asked for a warmer, more consumer-facing atmosphere. I retained the hero-plus-navigation-plus-card structure while changing the visual weight and rhythm.

I rejected heavy pill navigation because it competed with the content panels. I chose a simpler navbar-like treatment with lavender text and a purple underline for the active section. I also kept sticky behaviour because the document is long enough that users benefit from persistent orientation.

I asked for brighter layering rather than replacing the dark theme. The final direction retains deep navy as the page foundation, adds a purple-gradient hero, uses lighter slate and indigo cards, and alternates panel tone. This keeps the legal pages recognisably part of Shades of SG without making every surface identical.

I reviewed the hero through a screenshot and found it disproportionately tall and typographically dominant. I requested that the component itself be compacted, then clarified that typography throughout the page also needed to be smaller. I selected 14 pixels for navigation and legal copy and 15 pixels for section numbers. I later removed the document icon because the title and decorative background already communicated the page purpose without it.

For the Privacy Policy, I chose visual continuity over a separate redesign. The page copies the Terms structure and uses only subtle privacy-specific accents. I accepted shield and lock decoration at low opacity, but kept the palette within lavender, indigo, muted blue, and violet rather than introducing unrelated greens.

I also reviewed the first scroll animation interaction and identified that quick-navigation clicks caused too many cards to reveal while the browser moved past them. I requested a less abrupt behaviour. The final solution distinguishes manual exploration from programmatic anchor navigation, allowing ordinary scroll reveals while preventing intermediate animation cascades during a quick jump.

### Files Created

- `frontend/src/pages/TermsAndConditions.jsx`
- `frontend/src/pages/PrivacyPolicy.jsx`

### Files Modified

- `frontend/src/App.jsx`
- `frontend/src/App.css`
- `frontend/src/components/Footer.jsx`
- `frontend/src/components/Reveal.jsx`
- `frontend/src/hooks/useReveal.js`
- `ferlyn_journal.md`

### Routing and Integration Details

- Added `/terms` as a public route inside `MainExperience` and `MainLayout`.
- Added `/privacy` as a public route inside the same layout.
- Connected the footer's Terms & Conditions link to `/terms`.
- Connected the footer's Privacy Policy link to `/privacy`.
- Preserved the shared public navbar, footer, maximum content width, dark application shell, and route-level scroll-to-top behaviour.
- Used fragment identifiers for all legal sections so links remain shareable and browser-addressable.

### Accessibility and Responsive Behaviour

- Quick-navigation containers use semantic `nav` elements with accessible labels.
- The active anchor exposes `aria-current="location"`.
- Decorative dots, musical notes, shield, lock, and section numbers are hidden from assistive technology where appropriate.
- Email addresses use functional `mailto:` links with prefilled subjects.
- Section cards use semantic `section` elements and proper heading order.
- Anchor destinations use `scroll-margin-top` so sticky site and legal navigation do not cover section headings.
- Quick navigation can scroll horizontally on small screens rather than compressing or wrapping into an excessively tall toolbar.
- Cards collapse from numbered two-column layouts into single-column mobile layouts.
- Motion is disabled through the existing reduced-motion media query.
- The reveal hook includes a fallback that exposes content when `IntersectionObserver` is unavailable.

### Verification Performed

- Ran the frontend production build after the initial Terms route and page implementation; it passed.
- Ran the frontend Vitest suite after the Terms implementation; one test file and one test passed. JSDOM printed its existing informational warning that `window.scrollTo()` is not implemented.
- Ran targeted ESLint on `TermsAndConditions.jsx`; it passed.
- Attempted a full frontend lint run. It reported three pre-existing `react-hooks/set-state-in-effect` errors in `ReflectionModal.jsx` and `ReflectionWall.jsx`, unrelated to the legal pages.
- Ran the production build after the Terms visual-polish pass; it passed.
- Ran targeted ESLint on the polished Terms page; it passed.
- Ran the frontend tests again after the polish pass; they passed.
- Ran another production build after compacting the Terms hero; it passed.
- Ran the production build after reducing the Terms typography; it passed.
- Ran the production build after introducing the Privacy Policy route and page; it passed with 107 modules transformed.
- Ran targeted ESLint on both `PrivacyPolicy.jsx` and `TermsAndConditions.jsx`; it passed.
- Ran the frontend test suite after Privacy Policy integration; it passed.
- Ran the production build after applying shared reveal motion; it passed.
- Ran targeted ESLint on both legal pages and `Reveal.jsx`; it passed.
- Ran the frontend tests after the reveal work; they passed.
- Ran the production build after adding navigation-aware reveal suspension; it passed.
- Ran targeted ESLint on both legal pages, `Reveal.jsx`, and `useReveal.js`; it passed.

### Final Outcome

Shades of SG now has a complete, coherent public legal experience. Terms & Conditions and Privacy Policy are real footer destinations rather than placeholders. Both pages share a compact branded hero, lightweight sticky navigation, active-section feedback, premium rounded cards, consistent numbering, readable 14-pixel body copy, responsive layouts, accurate platform-specific wording, and accessible contact actions.

The two pages feel like companions: Terms uses a warmer violet music-and-community treatment, while Privacy uses cooler indigo and trust-oriented shield/lock details. Their interaction design supports both deliberate manual reading and fast section navigation. Manual scrolling produces calm per-card entrance motion, while quick-navigation clicks avoid revealing every intermediate section and instead focus attention on the selected destination.

### Remaining Work

- Have the final legal wording reviewed by an appropriate legal or data-protection professional before production use.
- Replace the general third-party infrastructure description with a definitive production service list once hosting and analytics providers are finalised.
- Confirm the lawful basis, retention period, account-deletion workflow, and child-user consent requirements for the production deployment.
- Add component tests for active-section tracking, hash updates, reveal suspension, and reduced-motion behaviour.
- Perform manual browser checks at the team's target desktop, tablet, and mobile widths.
- Consider extracting the duplicated legal page structure and navigation logic into a dedicated reusable `LegalPage` or `LegalLayout` component if more legal or policy pages are added.
- Resolve the unrelated Reflection Wall lint errors before making a full-project lint pass a release requirement.

### Lesson

Legal content does not need to look detached from the product. A strong legal page can preserve clarity and seriousness while still using the platform's colour, typography, rhythm, and storytelling identity. The most effective result came from separating content hierarchy from visual weight: lightweight navigation, compact typography, layered surfaces, clear numbering, and restrained decoration made the pages easier to read without making them feel generic.

Motion also needs to understand user intent. An animation that feels natural during manual scrolling can become noisy when a programmatic jump passes many observed elements. Temporarily suspending intermediate reveal observers created a better distinction between exploratory reading and direct navigation while preserving accessibility and smooth orientation.

---

## 2026-07-11 — Guest Reflections and Creator Moderation Workspace

### AI Tool Used

Codex.

### Objective

Expand the Reflection Wall so visitors can contribute without being forced to create an account, improve the reflection-writing experience, and complete the missing creator moderation workflow that controls when guest submissions become public.

The work needed to preserve the existing public wall and creator portal while adding a coherent end-to-end journey:

1. a guest chooses to continue anonymously;
2. the guest writes and submits a reflection;
3. the submission enters the real database as `PENDING`;
4. an authorised creator reviews it in `/creator/reflections`;
5. approval changes its status to `APPROVED`;
6. the public Reflection Wall then displays it as Anonymous.

The task also included redesigning the Add Reflection modal, persisting memory tags, fixing several modal alignment details, and adding automated coverage for both public and creator behaviour.

### Context

The existing guest experience treated authentication as a requirement. Selecting Add Reflection opened a modal with Login, Register, and Cancel actions, which meant visitors could read community memories but could not contribute unless they created an account.

The backend already had a nullable reflection owner and a `status` field with `PENDING`, `APPROVED`, and `FLAGGED`, but reflection creation required authentication. The creator Reflection Moderation page existed only as three placeholder cards and had no API connection, real counts, filters, details, or actions. Consequently, once guest submissions were changed to enter `PENDING`, they remained hidden because the public endpoint correctly returned only approved reflections and there was no functional creator interface through which to approve them.

The first Add Reflection identity selector also had a layout defect: generic form-label rules stretched its radio controls and text into disconnected positions with excessive whitespace. The modal was unnecessarily tall, important actions could fall below the fold, and its field order interrupted the natural writing flow.

### Prompt Summary

I asked Codex to:

- underline the Cancel action on hover;
- replace the login barrier with a choice between Continue as Guest and Login / Register;
- make every guest contribution appear publicly as Anonymous;
- prevent guests from editing or deleting a contribution later;
- require guests to acknowledge this limitation before submission;
- keep registered anonymous reflections tied to their accounts so their owners can still edit or delete them;
- show a post-submission thank-you modal with Maybe Later and Create Account actions;
- centre the Create Account button in that modal;
- redesign the Add Reflection modal as a compact, welcoming journal-style card;
- order its flow as Song, Reflection, optional Memory Type tags, identity, and submission actions;
- turn My Profile and Anonymous into fully clickable selectable cards;
- keep Cancel and Save Reflection visible in a fixed internal footer;
- focus the textarea after a song is chosen;
- support responsive mobile identity cards and actions;
- explain why pending guest reflections were not appearing publicly;
- implement the complete creator-only Reflection Moderation page from the supplied specification;
- use real backend data rather than hardcoded Figma values or mock moderation state;
- add creator-only approve, flag, moderator-note, and delete operations;
- keep public queries limited to approved content;
- add statistics, tabs, combined filters, loading states, empty states, retries, toasts, pagination, responsive detail panels, and confirmation dialogs;
- add automated tests for moderation loading, filtering, tab switching, approval, flagging, deletion, access control, public visibility, and failed-request preservation.

### AI Output

Codex first redesigned the authentication-required prompt into a contribution-choice modal. Guests can now select Continue as Guest, while Login / Register is presented as an optional account upgrade with clear benefits rather than a prerequisite. Cancelling remains possible, and the Cancel text receives an underline on hover.

Selecting Continue as Guest opens the same reflection composer in guest mode. Guest mode:

- forces anonymous display;
- does not request a nickname;
- explains that the reflection will be reviewed before publication;
- requires confirmation that it cannot be edited or deleted later;
- disables submission until a song, non-empty reflection, and acknowledgement are present;
- submits without an authentication token;
- displays a thank-you modal after a successful response.

The thank-you modal explains that the memory is pending moderation and offers Maybe Later or Create Account. Its action layout was subsequently corrected so the Create Account button is centred with a balanced maximum width rather than occupying only the left half of a two-column grid.

The backend reflection route now uses optional authentication for creation. It distinguishes guests from account holders and stores guest submissions with:

- `user_id = null`;
- `guest_submission = true`;
- `display_mode = ANONYMOUS`;
- `display_name = null`;
- `status = PENDING`.

Registered users continue to own their reflections. They may choose `PROFILE` or `ANONYMOUS` display mode; anonymous account posts remain internally associated with the owner and retain edit/delete permissions. The public serializer does not expose `guestSubmission`, which prevents public viewers from distinguishing a guest anonymous post from a registered anonymous post.

Codex added safe schema support for `display_mode` and `guest_submission` through the model, fresh-install schema, SQL migration, and an idempotent startup schema updater. This was necessary because the project uses `sequelize.sync()` without automatic alteration, so model changes alone would not update the existing SQLite database.

The Add Reflection composer was then rebuilt into a compact journal-style modal. Its final flow is:

1. Song;
2. Reflection;
3. optional Memory Type tags;
4. identity choice;
5. Cancel and Save Reflection.

The redesigned modal uses a warm cream background, 20-pixel rounded corners, purple accents, softer shadows, tighter vertical rhythm, a scrollable form body, and an always-visible footer. The textarea includes a helper message and live character counter. Choosing a song moves focus to the textarea. Memory Type is implemented as a multi-select chip group containing Nostalgia, Family, National Day, Friendship, School, and Home.

For signed-in users, My Profile and Anonymous are now compact selectable cards rather than stretched labels. Clicking anywhere on a card selects it. The active card receives a purple border, pale purple fill, and subtle glow. The profile card shows the user's display name and ownership benefits; the anonymous card explains that public identity is hidden while account editing remains available. On mobile the two cards stack, the footer actions become full width, and the textarea remains constrained to the viewport.

The optional tags were initially visual-only to avoid changing the backend during the modal-only redesign. They were later persisted when the moderation specification required real tag display and search. The Reflection model now stores a normalised JSON tag array. Creation and owner updates accept known tags, remove duplicates, ignore unknown values, and preserve existing tags if an edit omits the tag property. The composer also restores tags when editing or resuming a draft after login.

When it became clear that guest memories remained pending indefinitely, Codex confirmed the exact cause: the guest creation route intentionally assigned `PENDING`, the public wall intentionally queried only `APPROVED`, and the creator page was still a placeholder. The solution was to complete moderation rather than weaken the public query.

Codex audited the creator route, layout, role checks, sidebar, service layer, model, migrations, API routes, styles, and test setup before implementation. It reused the existing `/creator/reflections` route, `CreatorLayout`, active `NavLink`, dark navy creator shell, purple design system, and existing `status` field. It removed the sidebar's hardcoded reflection count instead of presenting a fake value.

The creator workspace now contains:

- a Reflection Moderation heading with a subtle heart icon;
- the description “Curate and manage memories shared by the community.”;
- real Pending, Approved, Flagged, and New today summary cards;
- a New today comparison with yesterday using Singapore UTC+8 day boundaries;
- Pending, Approved, and Flagged tabs with live counts;
- combined search, song, submitted-since, and anonymous-only filters;
- a clear-filters action;
- a controlled eight-item page size with Load more pagination;
- muted sticky-note cards with varied mustard, rose, teal, blue, sage, and lavender tones;
- song, author, relative time, preview, tags, status, pins, and status-aware card actions;
- a persistent desktop detail panel and responsive drawer/full-screen presentation at narrower widths;
- full text, submission type, anonymous state, timestamps, tags, moderation metadata, and moderator notes;
- loading skeletons, empty states, API error handling, retry controls, disabled busy actions, and success/error toasts;
- a custom destructive confirmation dialog instead of `window.confirm()`;
- a mobile filter drawer and mobile action targets sized for touch.

The moderation API uses a separate creator-only query so non-approved records never leak through the public endpoint. The creator list supports combined status, search, song, date, and anonymous filters. Search covers reflection content, display name, song title, and persisted tags. It returns real global status statistics plus pagination metadata.

Creator mutations use the existing status model rather than adding a duplicate moderation field. A creator can:

- approve a pending or flagged reflection, making it public;
- flag an approved reflection, immediately hiding it from the public wall;
- keep a reflection flagged for further attention;
- save a moderator note of up to 1,000 characters;
- permanently delete any reflection after confirmation.

Moderation stores `moderated_by`, `moderated_at`, and `moderator_note`. The creator serializer includes the moderator's name where available. No fake moderation-history timeline or decorative Report Abuse action was added because the project does not currently support a real history or abuse-report workflow.

Backend creator authorisation does not rely only on the role stored in the browser or signed token. The new asynchronous `requireCreator` middleware loads the current user from the database, returns `401` for a missing account, and returns `403` for a non-creator. The frontend creator route now also requires both a stored token and a creator role. If the moderation API rejects a stale or revoked creator with `401` or `403`, the workspace signs out and redirects to Login.

Moderation mutations use pessimistic updates: the current card, counts, and details remain unchanged until the server succeeds. Successful approve, flag, and delete operations update the affected tab, counts, pagination, and selection without a full-page reload. Failed requests display an error toast and preserve the previous UI state.

### My Review and Decisions

I preferred optional guest contribution over forcing authentication because the Reflection Wall is intended to collect community memories, including from visitors who may not want an account. I accepted the account option as a value proposition rather than a gate: registered users gain identity, editing, badges, milestones, and future reflection tracking.

I chose not to offer guest nicknames. Every guest appears as Anonymous, which keeps the public presentation and moderation rules simpler. I retained the acknowledgement that guests cannot edit or delete later so the consequence is explicit before submission.

I decided that guest reflections should not appear immediately. They enter Pending moderation and become public only after creator approval. This protects the public wall while preserving a low-friction contribution experience. When pending posts did not appear, I confirmed that this was expected status behaviour and chose to complete the real moderation workspace rather than automatically approving them.

I rejected the first identity layout because its radio buttons floated separately from their text, wasted vertical space, and placed a publishing decision before the user had written anything. I moved identity to the bottom and accepted the more natural Song → Reflection → Tags → Identity → Submit sequence.

For the creator interface, I kept the existing dark navy portal and sidebar rather than duplicating the layout. I chose darker, muted note colours so cards still resemble the public wall without becoming unreadably pale or neon against the creator background. I also preferred a real mobile drawer/detail treatment over squeezing the desktop panel into narrow widths.

I reused the existing `PENDING`, `APPROVED`, and `FLAGGED` statuses and did not add `REJECTED`, because the requested actions did not require a separate rejected-content archive. Permanent removal is handled by the confirmed Delete action. I also avoided creating a full moderation-history table because current requirements could be met safely with latest-moderator metadata.

### Files Created

- `backend/migrations/002_guest_reflections.sql`
- `backend/migrations/003_reflection_moderation.sql`
- `backend/services/schemaService.js`
- `frontend/src/components/GuestThankYouModal.jsx`
- `frontend/src/components/creator/reflections/ModerationCard.jsx`
- `frontend/src/components/creator/reflections/ModerationConfirmDialog.jsx`
- `frontend/src/components/creator/reflections/ModerationEmptyState.jsx`
- `frontend/src/components/creator/reflections/ModerationFilters.jsx`
- `frontend/src/components/creator/reflections/ModerationGrid.jsx`
- `frontend/src/components/creator/reflections/ModerationStats.jsx`
- `frontend/src/components/creator/reflections/ModerationTabs.jsx`
- `frontend/src/components/creator/reflections/ModeratorNoteField.jsx`
- `frontend/src/components/creator/reflections/ReflectionDetailsPanel.jsx`
- `frontend/src/components/creator/reflections/index.js`
- `frontend/src/components/creator/reflections/moderationPresentation.js`
- `frontend/src/pages/ReflectionModeration.css`
- `frontend/src/pages/ReflectionModeration.test.jsx`

### Files Modified

- `backend/middleware/auth.js`
- `backend/migrations/001_initial_schema.sql`
- `backend/models/Reflection.js`
- `backend/models/index.js`
- `backend/routes/reflections.js`
- `backend/server.js`
- `backend/tests/reflections.test.js`
- `frontend/src/App.css`
- `frontend/src/App.jsx`
- `frontend/src/App.test.jsx`
- `frontend/src/components/AuthRequiredModal.jsx`
- `frontend/src/components/ReflectionModal.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/pages/ReflectionModeration.jsx`
- `frontend/src/pages/ReflectionWall.jsx`
- `frontend/src/pages/pageData.js`
- `frontend/src/services/reflectionService.js`
- `frontend/src/test/setup.js`

### Database and API Details

- Reused the existing reflection `status` field with `PENDING`, `APPROVED`, and `FLAGGED`.
- Added `display_mode` and `guest_submission` for explicit guest/account display behaviour.
- Added `tags`, `moderated_by`, `moderated_at`, and `moderator_note` through fresh-schema definitions, SQL migrations, and idempotent runtime schema checks.
- Added a `status + created_at` index for moderation queries.
- Added `GET /api/reflections/moderation` for creator-only filtered, paginated moderation data and statistics.
- Added `PUT /api/reflections/:id/moderation` for status and moderator-note changes.
- Preserved `DELETE /api/reflections/:id` for owners while allowing a database-verified creator to delete any reflection.
- Preserved `GET /api/reflections` as an approved-only public endpoint.
- Limited moderation pages to eight records by default and capped the API limit at 24.
- Used Singapore day boundaries for New today and yesterday statistics.
- Applied the new schema successfully to the existing local database; repeated schema checks are safe.

### Accessibility and Responsive Behaviour

- Moderation status controls use `tablist`, `tab`, and `aria-selected` semantics.
- Reflection cards expose labelled detail controls without nesting action buttons inside the detail button.
- The destructive dialog uses `role="dialog"`, `aria-modal`, Escape-to-close behaviour, initial focus, and focus restoration.
- Loading, success, and error messages use appropriate live-region roles.
- Decorative hearts, pins, and icons are hidden from assistive technology.
- Filters retain visible labels or screen-reader labels.
- The detail panel becomes an overlay drawer and then a full-screen mobile panel.
- Mobile filters open in a dedicated bottom drawer with a dismissible backdrop.
- Mobile identity cards stack vertically and modal/footer actions expand to full width.
- Mobile moderation actions use touch-friendly minimum heights.
- Reduced-motion rules disable moderation card, drawer, and skeleton animation.

### Verification Performed

- Ran the backend Jest suite after guest and moderation integration; three suites and eleven tests passed.
- Backend tests cover guest pending creation, owner CRUD, tag normalisation, creator authentication, non-creator denial, combined filters, pagination, search across supported fields, Singapore date statistics, approval and public visibility, flagging and public removal, moderator notes, invalid-note rollback, creator deletion, owner restrictions, and public exclusion of pending/flagged content.
- Ran the frontend Vitest suite; two test files and nine tests passed.
- Frontend moderation tests cover loading pending reflections, status-tab switching, combined filters, approval, flagging, confirmed deletion, and preserving prior state after a failed mutation.
- Extended App route tests to confirm that guests are redirected away from the creator route and authenticated creators can open the moderation workspace.
- Ran full frontend ESLint; it passed without errors after correcting the existing synchronous effect updates in `ReflectionWall.jsx`.
- Ran full backend ESLint; it passed.
- Ran the frontend production build after final responsive and access-control changes; it passed with 118 modules transformed.
- Added a JSDOM `window.scrollTo` test stub so the route tests no longer print irrelevant implementation warnings.
- Ran `git diff --check`; no whitespace errors were reported.
- Ran the idempotent runtime schema updater against the current SQLite database and confirmed that the moderation schema is ready.

### Final Outcome

The Reflection Wall now supports a complete low-friction guest contribution journey without sacrificing moderation. Guests can share a memory anonymously, understand the ownership limitation, select meaningful tags, and receive a clear confirmation. Registered users can still choose profile or anonymous display while retaining ownership controls.

Creators now have a real moderation workspace rather than a placeholder. Pending guest memories can be searched, filtered, inspected, annotated, approved, flagged, or deleted. Approved memories become visible publicly; flagged and pending content remain hidden. Counts and cards update without a full-page refresh, failed requests preserve the previous state, and the interface remains usable across desktop, tablet, and mobile layouts.

The result connects the public contribution experience, database status model, creator portal, and public visibility rule into one functional workflow.

### Remaining Work

- Perform a final manual browser review at the team's exact 1280-pixel laptop, tablet, and mobile target widths.
- Decide whether registered-user reflections should continue to publish immediately or also enter moderation before production.
- Add a moderation-history table only if the project later needs a full audit trail rather than the latest moderator metadata.
- Consider displaying a real pending count in the shared creator sidebar through a central data source; the previous hardcoded badge was removed.
- Add optional notifications for creators when new guest reflections arrive and for registered contributors when a submission changes status.
- Replace the current token mechanism with expiring server-managed sessions before production deployment.
- Confirm production retention and deletion policies for anonymous guest content.

### Lesson

Guest contribution and moderation are one workflow, not two independent features. Allowing anonymous submission without building the approval path creates content that is saved correctly but appears lost to both visitors and creators. The public visibility rule was not the bug; the missing creator transition from `PENDING` to `APPROVED` was.

The strongest implementation reused the existing status model and creator shell, added only the metadata required for real operations, and kept public and moderation serializers separate. This reduced schema risk and protected anonymous-account privacy while still giving creators the context they need.

Form hierarchy also changes how welcoming a feature feels. Asking users to pick a song and write their memory before deciding how to publish follows their natural mental sequence. Clickable identity cards, a visible action footer, compact spacing, and post-contribution account prompts made authentication feel like an optional benefit rather than a barrier.

## 2026-07-12 — Registered Navbar, Account Menu, and Website Translation

### Scope

Standardise the registered-user navigation with the public guest experience, move account actions into one profile-picture menu, remove duplicate in-page user widgets, and add a website-wide language selector.

### Navbar and Account Menu

The registered-user navbar now uses the same public navigation structure as the guest navbar: Home, Songs, Learning Hub, Rhythm Game, and Reflection Wall remain centred between the brand and account utilities. Profile and Settings no longer compete with the primary experiences as full navigation links.

The right side now contains the language control and a profile-picture button. The supplied `Default_pfp.jpg` asset is used when an authenticated user does not have an uploaded avatar; a real `avatarUrl` or `avatar_url` still takes precedence. The final profile trigger intentionally contains no Account label and no dropdown chevron, leaving a clean circular image as requested.

Clicking the image opens a `USER MENU` dropdown containing:

- View Profile;
- Edit Profile;
- Settings;
- Logout.

The menu closes after navigation, after logout, when clicking outside it, or when pressing Escape. Logout continues to clear the authenticated session and return the user to Login. Responsive rules place the same account utilities inside the mobile navigation panel without creating a second mobile-specific menu.

The old creator-style identity widget could also appear inside registered pages such as Settings, producing a duplicate Bellen/User block below the navbar. `CreatorPageShell` now renders that widget only for an authenticated `CREATOR`. Registered-user pages therefore use the top-navbar profile menu as their single standard account control, while genuine creator screens retain their creator account interface.

### Website Translation

A shared translation provider now wraps the application. Its selector offers Singapore's four official languages:

- English;
- Simplified Chinese;
- Bahasa Melayu;
- Tamil.

The selector is available in the public navbar, authentication layout, and creator sidebar. The chosen language is saved in local storage, reflected in the document language, and restored across routes and later visits. Non-English page translation is loaded lazily through the Google Translate website runtime so English-only visits do not pay the external-script cost. Returning to English clears the translation cookie and reloads the original page text. A visible attribution is retained in the language menu, and a failure message is shown if the external translation service cannot load.

### Accessibility and Interaction

- The avatar trigger exposes an explicit accessible name containing the signed-in user's name.
- Account and language triggers expose `aria-expanded` and `aria-haspopup` state.
- Account actions use menu-item semantics.
- Language choices use single-selection menu-item-radio semantics and identify the current language.
- Both menus support outside-click and Escape dismissal.
- Decorative icons and the avatar image inside the already-labelled button are hidden from assistive technology.
- Focus and hover states remain visible on the dark navbar and dropdown surfaces.

### Files Created

- `frontend/public/images/Default_pfp.jpg`
- `frontend/src/Navbar.css`
- `frontend/src/components/LanguageSwitcher.jsx`
- `frontend/src/components/LanguageSwitcher.test.jsx`
- `frontend/src/components/Navbar.test.jsx`
- `frontend/src/context/TranslationContext.jsx`

### Files Modified

- `frontend/src/App.test.jsx`
- `frontend/src/components/CreatorPageShell.jsx`
- `frontend/src/components/LanguageSwitcher.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/layouts/AuthLayout.jsx`
- `frontend/src/main.jsx`

### Verification Performed

- Ran the full frontend Vitest suite after the integrated changes; eight test files and forty-one tests passed.
- Added navbar tests covering the five shared public links, default profile image, dropdown destinations, and logout session clearing.
- Added translation tests covering all four language choices, persisted selection, document-language updates, and handoff to the translation selector.
- Added an App regression test confirming registered Settings uses the top-navbar account menu without rendering the duplicate creator account widget.
- Ran focused ESLint checks for all changed JavaScript and JSX files; they passed.
- Ran the Vite production build successfully with 1,902 modules transformed.
- Ran `git diff --check` before publication and kept unrelated rhythm-game work outside this navigation commit.

### Final Outcome

Registered pages now have one consistent public-facing navbar and one account entry point. The profile image is visually minimal, the dropdown contains all account actions, and duplicate user identity controls no longer appear in page headers. The same application also has a persistent language entry point across public, authentication, and creator surfaces, allowing the interface to be translated without maintaining separate page implementations.

## 2026-07-12 — Four-Lane Rhythm Game and Stored AI Beatmaps

### Scope and Existing Flow Discovered

Complete the partially implemented rhythm-game upgrade and turn the earlier procedural tap-only experience into a polished four-lane game with tap notes, hold notes, stored AI-assisted charts, deterministic fallback charts, accurate score persistence, and focused regression coverage.

The original public flow already listed published songs with playable audio, opened `/game/:songId`, used D/F/J/K controls, stored the latest visible result in local storage, and exposed a JWT-aware score endpoint. The game generated a fresh evenly spaced tap chart in the browser from song duration. It did not have a beatmap model, stored difficulty charts, hold-note scoring, AI chart validation, or a complete result-page score submission lifecycle.

The existing score API already derived the player from the JWT and ignored client-supplied user identity and rank. That security model was retained. The existing OpenAI usage was consolidated behind one lazy shared client so a missing API key no longer prevents the backend from loading and both scene planning and image generation continue using the same configuration.

### Architecture Chosen

Beatmaps are now generated once per song and difficulty and stored in `rhythm_beatmaps`. Public gameplay only requests the stored `READY` chart. If none exists, the API returns a clear unavailable response and does not create data. Deterministic fallback generation is only entered from a creator-controlled generation request when AI is unavailable or invalid; starting a public game never invokes AI or fallback generation.

Creator-only generation uses `POST /api/songs/:songId/beatmaps/generate`. The service builds a structured prompt from title, artist, duration, lyrics, optional scene-segment timestamps, difficulty, lane count, density, chord, and hold constraints. The AI must return JSON containing difficulty, BPM, offset, and integer-millisecond notes. The backend validates the response, attempts one corrected response after malformed or unsafe output, and then falls back deterministically if AI remains unavailable or invalid.

Validation covers difficulty mismatch, lane range, timestamps, song bounds, note type, duplicate IDs, BPM, offset, note count, minimum spacing, simultaneous-note limits, same-lane overlap, and difficulty-specific hold duration. Raw AI text is never stored as a playable map. Provider error details are retained internally on the beatmap row and are not included in the public response.

Fallback charts use seeded randomness based on song ID and difficulty. Easy, Medium, and Hard use central configuration for density, BPM defaults, minimum gaps, hold chance, hold duration, and simultaneous-note limits. Repeated requests produce the same notes, and concurrent first requests recover from a unique-version race by loading the chart created by the other request.

### Gameplay and Scoring

The game now renders four central lanes on a canvas with distinct D, F, J, and K receptors, tap-note heads, hold bodies and tails, lane accents, pressed-lane feedback, a clear hit line, progress, countdown, and transient judgements. Audio `currentTime` is the authoritative clock; animation frames only redraw positions calculated from that time.

Timing windows are centralised at Perfect 45 ms, Great 90 ms, Good 140 ms, Bad 190 ms, and Miss beyond that. Difficulty-specific approach times are 2,200 ms, 1,800 ms, and 1,400 ms. A local calibration offset is persisted, browser seeking during an active run is corrected, background video drift is reconciled to audio, and tab visibility or window blur pauses an active run.

Hold notes require a valid starting press, sustained input, and a release near the tail. Early release and missed release do not receive full credit. Scoring tracks Perfect, Great, Good, Bad, Miss, score, combo, maximum combo, weighted accuracy, completed holds, and early releases. The combo multiplier increases in controlled steps and caps at 1.5x, matching backend maximum-score validation.

Start now unlocks the audio element from the direct user gesture before the 3, 2, 1, Go countdown, avoiding delayed autoplay failures. Pause freezes audio-based timing, resume re-synchronises video, restart clears notes, holds, score, clock, and media position while retaining difficulty, and active restart or exit asks for confirmation. Touch lanes remain available and now safely handle pointer cancellation. The unclear square control was replaced with explicit Lucide exit and fullscreen controls, visible labels, native tooltips, accessible names, focus styling, and touch-sized targets.

### Results and Score Persistence

Completed results include score, weighted accuracy, grade, difficulty, song ID, maximum combo, every judgement count, hold completions, early releases, processed notes, and total notes. The result page displays the expanded breakdown without losing the local result when song metadata or saving fails.

Registered players submit through the existing score API and see saving, saved, queued, and retry states. A run-level guard prevents duplicate submissions across rerenders and component remounts. Only complete, internally consistent runs with valid difficulty, score, accuracy, combo, and note counts can enter the save flow. Failed submissions are queued locally without duplicate retry entries. Guests keep the result locally, receive a non-blocking sign-in message, and never call the protected score endpoint.

Backend score validation still derives the user ID from the JWT, verifies the published song and registered-player role, validates finite values and supported difficulty, and rejects scores above the 1.5x theoretical maximum.

### Database and API Changes

- Added migration `008_rhythm_beatmaps.sql` with UUID primary key, song foreign key, difficulty/version uniqueness, JSONB notes, generation source, lifecycle status, error metadata, timestamps, and a latest-ready lookup index.
- Added the `RhythmBeatmap` Sequelize model and Song associations.
- Added read-only public stored-chart retrieval and a public-safe availability summary endpoint.
- Added creator-only generation with versioning, AI validation, deterministic fallback, internal failure details, and safe retry behaviour.
- Added `OPENAI_BEATMAP_MODEL`, defaulting to `gpt-4o-mini`.
- Kept public chart responses free of internal provider errors.
- Ran Sequelize schema synchronisation against the local database and confirmed `rhythm_beatmaps` is ready.

### Files Created

- `backend/config/rhythm.js`
- `backend/controllers/beatmapController.js`
- `backend/migrations/008_rhythm_beatmaps.sql`
- `backend/models/RhythmBeatmap.js`
- `backend/routes/beatmaps.js`
- `backend/services/beatmapGenerator.js`
- `backend/services/beatmapValidator.js`
- `backend/services/fallbackBeatmapGenerator.js`
- `backend/services/openaiClient.js`
- `backend/tests/beatmapServices.test.js`
- `backend/tests/beatmaps.test.js`
- `frontend/src/components/RhythmGame.test.jsx`
- `frontend/src/components/studio/RhythmBeatmapPanel.jsx`
- `frontend/src/components/studio/RhythmBeatmapPanel.test.jsx`
- `frontend/src/game/scoreSubmission.js`
- `frontend/src/game/scoreSubmission.test.js`
- `frontend/src/game/scoresApi.test.js`
- `frontend/src/pages/RhythmResults.test.jsx`
- `frontend/src/services/beatmapService.js`
- `frontend/src/services/beatmapService.test.js`
- `frontend/src/utils/beatmapNormalizer.js`
- `frontend/src/utils/beatmapNormalizer.test.js`
- `frontend/src/utils/rhythmScoring.js`
- `frontend/src/utils/rhythmScoring.test.js`
- `frontend/src/utils/rhythmTiming.js`
- `frontend/src/utils/rhythmTiming.test.js`

### Files Modified

- `backend/.env.example`
- `backend/models/index.js`
- `backend/routes/scores.js`
- `backend/server.js`
- `backend/services/aiScenePlanner.js`
- `backend/services/frameGenerator.js`
- `frontend/src/App.css`
- `frontend/src/components/RhythmGame.jsx`
- `frontend/src/game/beatmapLoader.js`
- `frontend/src/game/results.js`
- `frontend/src/game/scoresApi.js`
- `frontend/src/game/songDetailsApi.js`
- `frontend/src/pages/RhythmResults.jsx`
- `frontend/src/pages/Studio.jsx`

### Verification Performed

- Ran the complete backend Jest suite: six suites and seventy tests passed.
- Ran the complete frontend Vitest suite: fourteen files and sixty-two tests passed.
- Backend coverage includes unsafe AI JSON, lane and timestamp bounds, difficulty/BPM/offset metadata, hold duration, same-lane overlap, deterministic fallback, malformed-AI retry and fallback, public retrieval, creator-only generation, latest-version listing, JWT-derived score ownership, guest behaviour, published-song checks, and manipulated-score rejection.
- Frontend coverage includes timing judgements, missed-note detection, audio-derived clock offsets, tap and hold scoring, successful and early hold completion, score and accuracy bounds, unsafe beatmap rejection, accessible gameplay controls, difficulty reset, countdown, automatic blur pause, duplicate score guards, local queue deduplication, guest non-submission, and registered save confirmation.
- Ran full frontend ESLint and full backend ESLint; both passed without errors.
- Ran the Vite production build successfully with 1,903 modules transformed.
- Ran `git diff --check`; no whitespace errors were reported.
- Applied Sequelize schema synchronisation to the current local database and confirmed the new beatmap table exists.

### Creator Studio Beatmap Controls

The existing creator Studio song page now includes a separate `Rhythm Beatmap` panel below the active metadata or lyrics card. It does not live inside the lyrics editor and does not alter draft saving, publishing, transcription, or AI-video generation.

The panel provides:

- Easy, Medium, and Hard selectors with Not generated, Generating, Ready, and Failed states;
- selected-difficulty generation and regeneration;
- one-click Generate All;
- note count, hold-note count, version, source, and last-generated time;
- disabled controls and local Generating state while a request is active;
- useful failure feedback and retry behaviour;
- automatic summary refresh after every attempt;
- a Preview / Test link to `/game/:songId?difficulty=DIFFICULTY&preview=1` for each READY map.

Creator preview is authenticated and can load an owned unpublished draft through the existing game route. Normal public gameplay can only load published songs and stored READY maps. A missing difficulty displays a clear message directing the creator to Studio.

The storage rule was tightened to one current row per `song_id + difficulty`. Generation and validation complete before a row is replaced. Successful regeneration updates the existing row atomically and increments its version. Failed regeneration leaves the prior READY notes, source, status, and version untouched. A first-ever hard failure may create a FAILED status row for Studio retry. AI failure normally resolves to a valid deterministic FALLBACK map and records `generation_source` accordingly.

The backend now also exposes creator-only `POST /api/songs/:songId/beatmaps/generate-all`. Summary responses always contain all three difficulties and include counts without exposing raw notes or provider errors. Public chart GET requests are read-only and were tested to leave the beatmap table unchanged.

Additional tests cover current-row uniqueness, safe regeneration, preserving an old READY chart after failure, first-generation FAILED state, Generate All, authenticated unpublished preview, Studio loading/ready/failed/generating/retry states, duplicate-click prevention, preview links, and the separation between public GET and creator POST operations.

### Final Outcome and Remaining Limitations

The rhythm feature is now a complete creator-managed stored-chart system rather than a browser-only note loop. Gameplay remains available without OpenAI once a creator has generated fallback or AI charts, generation is Studio controlled, public starts are strictly read-only, hold notes require real sustained input, timing stays tied to audio, and completed registered scores use the real protected persistence flow.

Automated interaction, API, lint, build, and local schema checks are complete. A live OpenAI request was intentionally not made because successful operation does not require spending an API call and the failure path is covered with deterministic mocks. Production PostgreSQL migration execution and final physical-device playtesting at the target 1280-pixel desktop, tablet, and mobile sizes still need the team's deployed database credentials, real media, browser audio latency, and devices. Those checks should include long holds, early release, pause during a hold, touch lanes, fullscreen, and background video readability.

## 2026-07-13 — Optional Rhythm Games, Draft Publishing, and Creator-Only Timing

### Product Flow Revision

The rhythm-game lifecycle was revised after reviewing the first creator-managed MVP. This entry supersedes the earlier READY-only and one-row-per-difficulty description.

Rhythm games are now optional. A creator can save, generate video for, and publish a song without creating any rhythm beatmap. Public song pages and all other song activities remain available when no rhythm game exists. The song experience displays the Play Rhythm Game action only when at least one difficulty has a PUBLISHED beatmap; otherwise it presents a disabled availability message. The Rhythm Hub likewise lists only songs with a published rhythm difficulty and links directly to an available difficulty.

### Draft and Published Versions

Beatmaps now use version rows with `DRAFT`, `PUBLISHED`, and `FAILED` database states. `NOT_CREATED` and `GENERATING` are presentation states used by Studio. The migration and Sequelize model include `published_at`, unique song/difficulty/version values, and partial unique indexes allowing at most one DRAFT and one PUBLISHED version per song and difficulty.

Generation completes and validates before touching existing creator data. A successful generation replaces only the prior DRAFT or FAILED attempt and creates a new DRAFT version. If a PUBLISHED version exists, it remains public while the new DRAFT is previewed and calibrated. Failed regeneration records a FAILED attempt for Studio while leaving the PUBLISHED row unchanged and playable.

Publishing explicitly promotes the selected DRAFT and replaces the old live version in one transaction. Unpublishing removes public availability and retains creator access as a DRAFT. When a newer DRAFT already exists, unpublishing preserves that newer work while removing the older public row. Safe draft deletion never deletes the PUBLISHED version.

AI generation still performs one repair attempt and falls back deterministically when the provider is unavailable or invalid. Studio now also offers Generate Basic Beatmap, which deliberately uses the deterministic generator without calling AI. Both paths save DRAFT maps and identify the final generation source.

### Creator Studio and Preview

The separate Rhythm Game Studio panel now explains that the feature is optional and provides:

- Easy, Medium, and Hard lifecycle states;
- Generate with AI and Generate Basic Beatmap;
- Generate All and regeneration;
- note, hold-note, BPM, source, and generated-date details;
- Preview, Publish, Unpublish, and safe Delete draft actions;
- DRAFT timing offset from -500ms to +500ms;
- Reset offset and explicit Save draft settings controls;
- persisted failure feedback and retry behavior;
- a visible indication when a PUBLISHED version remains live behind a DRAFT or FAILED attempt.

Timing offset is no longer a player preference. It is editable only for a creator-owned DRAFT in Studio or authenticated preview. Resetting changes the unsaved form value; persistence occurs only through Save draft settings. Preview applies temporary changes immediately, labels the session Draft Preview, links back to Studio, and offers Save Offset and Publish.

The preview API is creator-only and may return a DRAFT. Ordinary registered users receive `403` from preview and settings routes. Public beatmap GET requests return only PUBLISHED rows and use the message “This rhythm game is not available yet.” when none exists.

### Player Settings and Scores

Normal players can adjust visual note speed and audio volume. Both preferences are stored locally. Note speed changes approach rendering only; the audio clock, timestamps, judgement windows, scoring, accuracy, and persisted map remain unchanged. Player controls do not expose timing offset, BPM, note timestamps, or map content.

Creator preview results carry an explicit preview flag, are not written to local public-result history, never call the protected score endpoint, and do not affect player statistics. Backend score submission now additionally requires a PUBLISHED beatmap matching the submitted difficulty and note count.

### API Changes

- `POST /api/songs/:songId/beatmaps/generate` creates a DRAFT using AI or explicit BASIC mode.
- `POST /api/songs/:songId/beatmaps/generate-all` creates DRAFT versions for all difficulties.
- `GET /api/songs/:songId/beatmaps` returns public-safe PUBLISHED availability or the creator's detailed draft/published/failed summary.
- `GET /api/songs/:songId/beatmaps/:difficulty` returns PUBLISHED only.
- `GET /api/songs/:songId/beatmaps/:difficulty/preview` is creator-only and permits DRAFT preview.
- `PUT /api/songs/:songId/beatmaps/:difficulty/settings` updates only a DRAFT offset within the safe range.
- `PUT /api/songs/:songId/beatmaps/:difficulty/publish` promotes a DRAFT.
- `PUT /api/songs/:songId/beatmaps/:difficulty/unpublish` removes public availability while retaining creator access.
- `DELETE /api/songs/:songId/beatmaps/:difficulty/draft` safely removes DRAFT or FAILED work.

### Verification

- The full backend Jest suite passed: six suites and seventy tests.
- The full frontend Vitest suite passed: fourteen files and sixty-eight tests.
- Backend and frontend ESLint passed without errors.
- The production Vite build passed with 1,903 modules transformed.
- Both staged and unstaged `git diff --check` passed.
- Backend tests cover DRAFT generation, public draft denial, creator preview, offset authorization and bounds, publishing, public retrieval, unpublishing, live-version preservation during regeneration, failed regeneration, partial uniqueness, BASIC fallback, optional song behavior, and PUBLISHED-map score validation.
- Frontend tests cover optional Studio states, DRAFT offset editing, publish/unpublish/retry controls, public CTA gating, Rhythm Hub availability, creator preview controls, preview score suppression, player-only note speed and volume, and the absence of player timing offset.

### Remaining External Checks

The revised PostgreSQL/Supabase migration is ready but has not been applied to a remote project because production credentials were not provided. A live OpenAI request was intentionally not spent during verification. Final device testing should confirm temporary offset feel with real audio latency, draft-to-published switching, note-speed readability, mobile preview controls, and cross-instance generation locking in the deployed environment.

## 2026-07-13 — Consolidated Rhythm-Game Implementation Log

### Purpose of This Entry

This is the consolidated record of the complete rhythm-game development process. It covers the initial audit of twenty-nine unfinished files, completion of the four-lane game, storage and AI architecture, creator Studio integration, score security, and the later product-flow revision that made rhythm games optional and introduced explicit DRAFT and PUBLISHED versions.

The earlier journal entries remain useful because they show how the implementation evolved. Where they describe a READY-only lifecycle or a single current beatmap row, this consolidated entry records the final design that replaced those intermediate decisions.

### Starting Point and Initial Audit

The work began with twenty-nine uncommitted files split into two groups:

- nineteen newly created files were already staged;
- ten edits to existing files were unstaged.

Those files were not unrelated changes. Together they formed a partially completed rhythm-game upgrade. The staged additions contained a first beatmap model, migration, generator, validator, fallback generator, OpenAI helper, timing and scoring utilities, client beatmap service, score-submission guard, and focused tests. The unstaged edits connected those additions to the server, model registry, score route, game component, results page, styles, and existing AI services.

The audit established the original runtime flow:

- Rhythm Hub listed published songs with audio and duration;
- `/game/:songId` loaded song metadata;
- the browser generated evenly spaced tap notes procedurally from song duration;
- D, F, J, and K controlled four lanes;
- the audio element existed, but gameplay and result behavior did not yet meet the full synchronization and hold-note requirements;
- the latest visible result was stored in local storage;
- the backend score endpoint already derived user identity from the JWT and ignored a client-supplied user ID and rank;
- registered score saving was available at the API level but was not fully connected to the revised results lifecycle;
- no persistent rhythm beatmap table existed in the established application schema;
- AI video generation already used OpenAI, scene segments, and song metadata, but OpenAI client initialization was duplicated.

The first focused verification of the partial work passed, confirming that the unfinished implementation had a viable base. The remaining effort therefore continued the existing direction rather than discarding it.

### Four-Lane Gameplay Engine

The browser-only procedural chart was replaced by a stored-beatmap loader. The game now renders four central lanes mapped to:

- lane 0: D;
- lane 1: F;
- lane 2: J;
- lane 3: K.

The playfield uses canvas rendering for incoming notes, hold bodies, hold tails, receptors, lane separators, key labels, pressed-lane feedback, and controlled glow effects. Touch lanes remain available for mobile and handle pointer cancellation safely.

The audio element's `currentTime` is the authoritative game clock. Rendering uses `requestAnimationFrame`, but note position is recalculated from audio time instead of accumulated frame delta. This prevents the chart from drifting when frame rate changes. Background video is synchronized back to audio when drift exceeds a small threshold.

The timing helper centralizes the judgement windows:

- Perfect: up to 45ms;
- Great: up to 90ms;
- Good: up to 140ms;
- Bad: up to 190ms;
- Miss: beyond 190ms.

Difficulty-specific base approach times are:

- Easy: 2,200ms;
- Medium: 1,800ms;
- Hard: 1,400ms.

Public note-speed preference changes only the visual approach duration. It does not change timestamps, hit windows, score, accuracy, audio time, or saved beatmap data. The preference is bounded, stored in local storage, and restored on later visits.

The game now includes:

- a 3, 2, 1, Go countdown;
- direct user-gesture audio unlocking before delayed playback;
- pause and resume through controls, Space, or Escape;
- automatic pause on blur or hidden-tab visibility change;
- restart with confirmation during an active run;
- exit confirmation during an active run;
- audio-position protection during play;
- video resynchronization after resume;
- selectable difficulty before play;
- loading and unavailable-chart states;
- progress display;
- transient judgement feedback;
- touch input with sufficiently large lane targets;
- accessible exit, fullscreen, pause, restart, settings, and preview controls.

### Hold Notes

Hold notes are first-class beatmap objects with lane, start time, end time, duration, head, body, and tail. The player must press near the start, continue holding, and release near the end.

The engine tracks:

- hold start judgement;
- active hold by lane;
- sustained duration ratio;
- release judgement;
- successful hold completion;
- early release;
- missed release.

Repeated keydown events cannot score the same note repeatedly. A hold does not receive full credit from the initial press alone. Its result combines start accuracy, sustain, release accuracy, and completion success. Early release and missed release can retain partial earned value without receiving full completion credit.

Pause, focus loss, restart, and game completion clear unsafe input state. Pending notes at audio completion are converted into misses before results are finalized.

### Scoring and Results

Scoring was extracted into pure helpers with these base values:

- Perfect: 1,000;
- Great: 750;
- Good: 450;
- Bad: 150;
- Miss: 0.

The combo multiplier rises in controlled steps and caps at 1.5x. Weighted accuracy uses earned judgement value divided by the maximum available value and is clamped between zero and one hundred.

Each result records:

- song ID;
- difficulty;
- score;
- rank;
- accuracy;
- current and maximum combo data;
- Perfect, Great, Good, Bad, and Miss counts;
- total and processed note counts;
- successful hold completions;
- early releases;
- played-at timestamp;
- whether the run was a creator preview.

The results page shows the complete breakdown and preserves the visible result even when song metadata or score saving fails.

Registered public players submit through the real score API. Guests retain local result behavior and never call the protected score endpoint. Failed registered submissions are queued locally with duplicate run entries removed, and the player can retry without losing the result.

A run-level guard prevents duplicate submission from effect rerenders or component remounts. Local validation rejects incomplete or internally inconsistent runs before a request is made. Backend validation derives identity from the JWT, verifies the registered-player role, validates score, accuracy, combo, difficulty, total notes, theoretical maximum, published song, PUBLISHED beatmap, and the published map's actual note count.

Creator preview runs are explicitly marked as preview results. They are not written to the normal stored-result history, never call the score endpoint, never enter the pending-score queue, and display a message confirming that they do not affect player statistics.

### Beatmap Generation Inputs and Contract

Creator generation uses the best structured timing information currently available without pretending that a text model heard the raw waveform. Input may include:

- song title;
- artist;
- duration in milliseconds;
- BPM metadata when present;
- raw lyrics;
- scene-segment start and end timestamps;
- segment lyrics;
- selected difficulty;
- four-lane requirement;
- density, chord, spacing, and hold constraints.

The AI must return strict JSON containing difficulty, BPM, offset, and note objects. Every note uses an integer millisecond timestamp and lane from zero to three. Holds also include an end timestamp.

The backend validates:

- requested and returned difficulty agreement;
- supported difficulty;
- lane range;
- finite integer timestamps;
- timestamps within song duration;
- note type;
- duplicate IDs;
- maximum note count;
- BPM range;
- offset range;
- difficulty-specific minimum spacing;
- simultaneous-note limit;
- same-lane overlap;
- hold minimum and maximum duration;
- hold end after hold start.

Malformed or unsafe AI output triggers one corrected generation attempt. If AI is unavailable or still invalid, deterministic fallback generation creates a playable DRAFT and records `generation_source` as FALLBACK. Raw AI text is never stored as a chart.

### Deterministic Basic Beatmaps

The fallback generator is seeded from song ID and difficulty. It does not use unseeded `Math.random`, so the same inputs produce the same chart.

Easy, Medium, and Hard use centralized configuration for:

- default BPM;
- minimum note gap;
- hold chance;
- hold minimum and maximum duration;
- simultaneous-note count;
- relative density.

The generator avoids overlapping notes in the same lane, supports taps while another lane is held, introduces controlled two-note chords at higher difficulties, and produces valid hold notes.

Studio exposes this path directly as Generate Basic Beatmap. This lets a creator intentionally create a deterministic chart without spending or depending on an AI request.

### Shared OpenAI Client

OpenAI initialization was consolidated into a lazy shared client. Beatmap generation, scene planning, and image generation now reuse the same environment configuration instead of maintaining separate client construction.

Lazy initialization also allows the backend and its tests to load without an API key. A missing key becomes a generation-time condition that can use fallback behavior instead of a server-startup failure.

The environment example now includes `OPENAI_BEATMAP_MODEL`, with `gpt-4o-mini` as the default beatmap model.

### Final Beatmap Storage Design

The first intermediate design used one current beatmap row per song and difficulty. That was sufficient for stored public charts, but it could not satisfy the later requirement to test a regenerated draft without replacing the live version.

The final design therefore uses version rows. The Sequelize model and Supabase migration include:

- UUID beatmap ID;
- song foreign key with cascade deletion;
- Easy, Medium, or Hard difficulty;
- version number;
- nullable BPM;
- integer offset in milliseconds;
- duration in milliseconds;
- JSON/JSONB note array;
- AI, FALLBACK, or MANUAL source;
- DRAFT, PUBLISHED, or FAILED status;
- internal error message;
- generated timestamp;
- published timestamp;
- created and updated timestamps.

Database constraints include:

- unique song, difficulty, and version;
- partial unique index allowing one DRAFT per song and difficulty;
- partial unique index allowing one PUBLISHED version per song and difficulty;
- song, difficulty, and status lookup index.

This permits one draft and one live version to coexist safely.

### Safe Generation and Publication Transactions

Generation and validation finish before stored creator work is changed. After a valid proposal exists, the backend transaction removes the previous DRAFT or FAILED attempt and creates a new DRAFT with an incremented version.

If a PUBLISHED row exists, it is untouched during generation. Public players continue receiving that version while the creator previews the new draft.

If regeneration fails:

- the PUBLISHED version remains live;
- an existing DRAFT remains intact;
- a FAILED attempt records safe retry information;
- provider details are not exposed publicly.

Publishing runs in a transaction. It promotes the selected DRAFT to PUBLISHED and replaces the previous public row only after the creator explicitly chooses Publish.

Unpublishing removes public availability while retaining creator access. If no newer DRAFT exists, the published version becomes a DRAFT. If a newer DRAFT already exists, that newer work is preserved and the older public row is removed.

Deleting a draft removes only DRAFT or FAILED work. It cannot delete the PUBLISHED version through the draft-deletion endpoint.

### Creator Studio Panel

The Creator Studio song page contains a separate panel below the active metadata or lyrics card. It does not live inside the lyrics editor and does not change metadata saving, transcription, publishing requirements, or AI-video generation behavior.

The final panel is titled Rhythm Game and explains: “Create an optional interactive beatmap for this song.”

It includes:

- Easy, Medium, and Hard selection;
- Not created, Generating, Draft, Published, and Failed states;
- Generate with AI;
- Generate Basic Beatmap;
- Generate All;
- regeneration;
- note count;
- hold-note count;
- BPM;
- generation source;
- last-generated date;
- Preview;
- Publish beatmap;
- Unpublish beatmap;
- Delete draft;
- retry after failure;
- visible indication when a published version remains live;
- timing offset from -500ms to +500ms;
- Reset offset;
- Save draft settings.

Generation controls are disabled during an active request. This prevents duplicate clicks. The panel updates immediately to Generating, refreshes the server summary after completion, and preserves useful error feedback after a failed request.

Offset changes in Studio are local form state until the creator explicitly chooses Save draft settings. Reset offset returns the unsaved value to zero. Offset controls are disabled unless the selected version is a DRAFT.

### Creator Preview

Preview uses the existing game route with authenticated preview parameters. The client requests the creator-only preview endpoint rather than the public endpoint.

Preview mode:

- requires a creator JWT;
- verifies song ownership on the backend;
- may load a DRAFT;
- prefers the draft when draft and published versions coexist;
- displays Draft Preview prominently;
- replaces the normal exit destination with Back to Studio;
- allows temporary offset adjustment;
- applies temporary offset changes immediately to the audio-based clock;
- provides Save Offset;
- provides Publish;
- disables offset editing for a PUBLISHED-only preview;
- never saves scores.

Ordinary registered users cannot access preview, settings, publish, unpublish, generation, or draft-deletion routes.

### Public Player Product Flow

Public gameplay is read-only. It never invokes AI and never invokes fallback generation. The public difficulty endpoint returns only a PUBLISHED row.

If the requested difficulty has no published map, the game displays: “This rhythm game is not available yet.” It does not reveal draft notes, draft offset, internal errors, or creator settings.

The rhythm feature is optional at the song level:

- song creation does not require a beatmap;
- song draft saving does not require a beatmap;
- AI-video generation does not require a beatmap;
- song publishing does not require a beatmap;
- music, learning, trivia, playground, and reflection features remain usable without a beatmap.

The public song page requests a safe beatmap summary. Play Rhythm Game appears only when at least one PUBLISHED difficulty exists. The link includes an available difficulty so the game does not default to a missing Medium chart.

Rhythm Hub similarly filters published songs to those with at least one PUBLISHED beatmap and links to an available difficulty. If none exist, the hub presents a dedicated no-rhythm-games state instead of listing songs that cannot start.

### Player Presentation Settings

Timing offset was removed from normal player controls. Public players cannot change:

- beatmap offset;
- note timestamps;
- BPM;
- difficulty data;
- published notes;
- judgement windows.

Players can change:

- visual note speed;
- game volume.

Both preferences are stored in local storage. System reduced-motion preferences continue to disable or reduce rhythm animation and background video presentation where supported by the existing CSS.

### API Surface

The final API includes:

- `GET /api/songs/:songId/beatmaps` — public-safe published availability or detailed owner summary;
- `GET /api/songs/:songId/beatmaps/:difficulty` — public PUBLISHED beatmap only;
- `GET /api/songs/:songId/beatmaps/:difficulty/preview` — creator-only DRAFT/PUBLISHED preview;
- `POST /api/songs/:songId/beatmaps/generate` — creator-only AI or BASIC DRAFT generation;
- `POST /api/songs/:songId/beatmaps/generate-all` — creator-only all-difficulty DRAFT generation;
- `PUT /api/songs/:songId/beatmaps/:difficulty/settings` — creator-only DRAFT offset update;
- `PUT /api/songs/:songId/beatmaps/:difficulty/publish` — creator-only DRAFT publication;
- `PUT /api/songs/:songId/beatmaps/:difficulty/unpublish` — creator-only removal from public availability;
- `DELETE /api/songs/:songId/beatmaps/:difficulty/draft` — creator-only safe DRAFT/FAILED deletion.

The public summary never includes notes or internal provider errors. The owner summary includes separate draft, published, and failed information so Studio can accurately represent a live version alongside work in progress.

### Tests Added and Extended

Backend coverage includes:

- valid hold normalization;
- invalid lanes;
- negative and out-of-range timestamps;
- invalid hold lengths;
- same-lane overlap;
- malformed JSON;
- difficulty mismatch;
- invalid BPM and offset metadata;
- deterministic fallback output;
- malformed AI retry then fallback;
- creator-only generation;
- AI and BASIC generation creating DRAFT;
- public denial of DRAFT;
- creator preview access;
- ordinary-player preview denial;
- creator offset editing;
- offset bounds;
- ordinary-player settings denial;
- DRAFT publication;
- public PUBLISHED retrieval;
- unpublishing;
- draft access after unpublishing;
- published-version preservation during regeneration;
- failed-regeneration preservation;
- FAILED summary with published version still live;
- one-draft and one-published partial uniqueness;
- optional song behavior without rhythm;
- JWT-derived score ownership;
- guest score behavior;
- creator score denial;
- draft-song score denial;
- score bounds;
- published-beatmap requirement;
- published-note-count agreement.

Frontend coverage includes:

- timing judgement boundaries;
- missed-note processing;
- visual note-speed behavior;
- audio-derived clock offsets;
- tap scoring;
- hold completion;
- early hold release;
- combo cap;
- weighted accuracy;
- unsafe client beatmap rejection;
- duplicate note rejection;
- duplicate score guard;
- pending-score queue deduplication;
- accessible exit and fullscreen controls;
- difficulty reset;
- countdown;
- blur pause;
- public missing-map error;
- player note-speed and volume controls;
- absence of public timing offset;
- authenticated draft preview;
- Back to Studio;
- temporary preview offset;
- Save Offset;
- Studio loading and empty states;
- Draft metrics;
- published-live indication;
- Publish and Unpublish actions;
- Failed and retry states;
- duplicate generation-click prevention;
- public GET versus creator POST separation;
- guest result behavior;
- registered result saving;
- preview result score suppression;
- song CTA visibility;
- optional song behavior;
- Rhythm Hub published availability.

### Files Created During the Rhythm Work

- `backend/config/rhythm.js`
- `backend/controllers/beatmapController.js`
- `backend/migrations/008_rhythm_beatmaps.sql`
- `backend/models/RhythmBeatmap.js`
- `backend/routes/beatmaps.js`
- `backend/services/beatmapGenerator.js`
- `backend/services/beatmapValidator.js`
- `backend/services/fallbackBeatmapGenerator.js`
- `backend/services/openaiClient.js`
- `backend/tests/beatmapServices.test.js`
- `backend/tests/beatmaps.test.js`
- `frontend/src/components/RhythmGame.test.jsx`
- `frontend/src/components/studio/RhythmBeatmapPanel.jsx`
- `frontend/src/components/studio/RhythmBeatmapPanel.test.jsx`
- `frontend/src/game/scoreSubmission.js`
- `frontend/src/game/scoreSubmission.test.js`
- `frontend/src/game/scoresApi.test.js`
- `frontend/src/pages/RhythmResults.test.jsx`
- `frontend/src/services/beatmapService.js`
- `frontend/src/services/beatmapService.test.js`
- `frontend/src/utils/beatmapNormalizer.js`
- `frontend/src/utils/beatmapNormalizer.test.js`
- `frontend/src/utils/rhythmScoring.js`
- `frontend/src/utils/rhythmScoring.test.js`
- `frontend/src/utils/rhythmTiming.js`
- `frontend/src/utils/rhythmTiming.test.js`

### Existing Files Modified During the Rhythm Work

- `backend/.env.example`
- `backend/models/index.js`
- `backend/routes/scores.js`
- `backend/server.js`
- `backend/services/aiScenePlanner.js`
- `backend/services/frameGenerator.js`
- `backend/tests/scores.test.js`
- `frontend/src/App.css`
- `frontend/src/App.test.jsx`
- `frontend/src/components/RhythmGame.jsx`
- `frontend/src/game/beatmapLoader.js`
- `frontend/src/game/results.js`
- `frontend/src/game/scoresApi.js`
- `frontend/src/game/songDetailsApi.js`
- `frontend/src/pages/RhythmHub.jsx`
- `frontend/src/pages/RhythmResults.jsx`
- `frontend/src/pages/SongExperience.jsx`
- `frontend/src/pages/Studio.jsx`
- `ferlyn_journal.md`

### Verification Record

The final verified state is:

- backend Jest: six suites passed, seventy tests passed;
- frontend Vitest: fourteen files passed, sixty-eight tests passed;
- backend ESLint: passed;
- frontend ESLint: passed;
- Vite production build: passed with 1,903 modules transformed;
- staged `git diff --check`: passed;
- unstaged `git diff --check`: passed;
- Sequelize test schema creation: passed with version and partial uniqueness behavior exercised.

No live OpenAI request was required for verification. AI success, malformed response, provider failure, repair, deterministic fallback, and explicit BASIC generation are covered using controlled tests.

### Development Decisions and Lessons

The most important architecture lesson was that “stored beatmaps” and “creator-approved beatmaps” are different requirements. A one-row READY model prevents generation during public play, but it does not let a creator test a replacement safely. Versioned DRAFT and PUBLISHED rows are necessary when public continuity and creator review must coexist.

Timing offset also belongs to content production, not player difficulty. Allowing every player to move the chart clock would make scores incomparable and obscure whether a published chart was actually synchronized. Moving offset into creator-only draft calibration preserves one authoritative map while still allowing correction for notes that appear early or late.

Note speed is different because it changes only presentation. Separating note speed from timing makes it a safe accessibility and comfort preference without altering competitive results.

The optional-feature decision affected more than Studio. It required revisiting song publication, song-page actions, Rhythm Hub filtering, direct game routes, public API behavior, and score validation. Treating optionality as an end-to-end product rule prevented dead links and stopped unpublished charts from leaking into normal play.

The final workflow is therefore:

1. Save and manage the song normally.
2. Optionally open Rhythm Game in Studio.
3. Select a difficulty.
4. Generate with AI or create a Basic deterministic chart.
5. Store the valid result as DRAFT.
6. Preview with creator authentication.
7. Adjust temporary timing offset if needed.
8. Save draft settings explicitly.
9. Regenerate or keep the draft.
10. Publish the selected draft.
11. Allow public players to fetch only the PUBLISHED version.
12. Continue serving the old PUBLISHED version while a replacement DRAFT is tested.

### Current Limitations and Next Steps

- Apply `008_rhythm_beatmaps.sql` to the real Supabase/PostgreSQL project after reviewing the target database's existing migration state.
- If an older intermediate rhythm table was manually created outside the migration history, write a one-time production reconciliation migration instead of applying destructive schema synchronization.
- Perform real-device playtesting with uploaded media at desktop, tablet, and phone sizes.
- Calibrate representative songs with Bluetooth, wired, and device speakers to evaluate browser and hardware latency.
- Confirm the draft offset sign convention with creators during real preview sessions.
- Test draft publication and rollback against the deployed Supabase transaction behavior.
- Add a distributed generation lock or job queue if the backend will run on multiple instances; the current in-process duplicate guard is appropriate for the present MVP but is not a cross-instance lock.
- Consider retaining archived published versions if creators later require rollback history rather than only one live and one draft version.
- Consider creator-facing generation progress polling if real AI requests become long enough that synchronous request feedback is insufficient.
- Do not expose provider errors, draft notes, or creator settings through public serializers.

### Consolidated Outcome

The rhythm game is now a polished four-lane activity backed by creator-managed persistent charts. It supports taps, holds, timing judgements, weighted accuracy, controlled combo scoring, pause/resume/restart, touch and keyboard input, registered score persistence, guest local behavior, AI-assisted generation, deterministic basic generation, creator preview, safe timing adjustment, explicit publication, and published-only public play.

The feature remains optional for every song. Public gameplay never generates data, never sees draft calibration, and never changes chart timing. Creators can develop a replacement draft without interrupting the live rhythm game, and preview sessions remain separate from player statistics.

---

## 2026-07-13 — Creator Profile, Full-Song Beatmaps, Media Uploads, and Publishing Guidance

### AI Tool Used

OpenAI Codex was used for repository inspection, implementation support, debugging, test updates, and database-state diagnosis. Ferlyn supplied the screenshots, console output, product requirements, and iterative UX decisions.

### Objective

Refine Violet's creator profile and resolve several connected Creator Studio and public rhythm-game issues: failed beatmap generation, charts ending before the song, publication visibility, MP4 uploads, desktop preview sizing, and unclear publishing errors.

### Prompt Summary and Ferlyn's Decisions

Ferlyn directed the following changes:

- reuse the public-profile visual language for Violet's creator profile while making it feel creator-specific;
- strengthen creator statistics, fix stretched song artwork, improve the community empty state, and add a memorable creator quote;
- keep one clear `Generate All` action and remove the two redundant beatmap generation buttons;
- generate Easy, Medium, and Hard charts separately and make note counts depend on song duration and difficulty;
- ensure rhythm charts continue through the full song instead of stopping after a fixed small number of notes;
- show rhythm content publicly only after the parent song is fully published;
- expose each published difficulty as its own playable choice on public and registered-user pages;
- allow MP4 media uploads in addition to MP3 and WAV files;
- make the creator rhythm preview fit normal desktop screens more reliably;
- replace raw backend publishing errors with human-readable, short-lived feedback;
- show missing publishing requirements in a modal and guide the creator to the relevant Studio step;
- when no final video exists, let the creator choose between generating a video and uploading one.

### AI Contribution

Codex inspected the frontend, backend, database models, API routes, and tests, then implemented and refined:

- a dedicated Violet creator-profile component and accompanying profile styling and tests;
- schema repair support for the rhythm beatmap table and published-state fields;
- sequential all-difficulty beatmap generation with clearer partial-failure handling;
- duration-aware AI beatmap requirements, including difficulty-based note density and coverage near the end of each song;
- responsive rhythm-game layout and creator-preview controls;
- public rhythm listings that require a published parent song and present published difficulties separately;
- backend and frontend MP4 acceptance for song media;
- a dedicated final-video upload service and route;
- a publishing-readiness modal with generate-video, upload-video, and redirect actions;
- transient draft-save error handling and clearer creator-facing messages.

### My Review and Decisions

I reviewed the changes through repeated browser screenshots and console output. I clarified that publishing a beatmap alone must not make it public, because the parent song remains the authoritative publication gate. I also confirmed that each song needs a different number of notes based on its duration and chosen difficulty, rather than using one fixed chart size for every song.

I chose to keep rhythm gameplay optional while requiring any public rhythm entry to have both a published song and at least one published difficulty. I also requested a choice between AI generation and manual MP4 upload instead of forcing creators through only one final-video workflow.

### Files Created

- `backend/migrations/009_rhythm_beatmap_published_at.sql`
- `frontend/src/components/profile/CreatorProfile.jsx`
- `frontend/src/components/studio/PublishReadinessModal.jsx`
- `frontend/src/components/studio/PublishReadinessModal.test.jsx`

### Files Modified

- `backend/controllers/beatmapController.js`
- `backend/controllers/songController.js`
- `backend/routes/songs.js`
- `backend/server.js`
- `backend/services/aiStorageService.js`
- `backend/services/beatmapGenerator.js`
- `backend/services/schemaService.js`
- `backend/tests/beatmapServices.test.js`
- `backend/tests/beatmaps.test.js`
- `backend/tests/songLifecycle.test.js`
- `frontend/src/App.css`
- `frontend/src/App.test.jsx`
- `frontend/src/Profile.css`
- `frontend/src/components/RhythmGame.jsx`
- `frontend/src/components/RhythmGame.test.jsx`
- `frontend/src/components/studio/RhythmBeatmapPanel.jsx`
- `frontend/src/components/studio/RhythmBeatmapPanel.test.jsx`
- `frontend/src/components/studio/SongMediaUpload.jsx`
- `frontend/src/components/studio/StudioHeader.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/Profile.test.jsx`
- `frontend/src/pages/RhythmHub.jsx`
- `frontend/src/pages/SongExperience.jsx`
- `frontend/src/pages/Studio.jsx`
- `frontend/src/services/songService.js`
- `ferlyn_journal.md`

### Verification Performed

The implemented changes were checked with the backend Jest suite, frontend Vitest suite, backend and frontend ESLint, the Vite production build, and `git diff --check`. The last complete verification run passed seventy-five backend tests and eighty-five frontend tests, with both lint commands and the production build also passing.

A read-only database diagnostic was also performed for the affected `Sailor Song` record. It confirmed that the newly uploaded MP4 was saved under `audioUrl`, while `videoUrl` still pointed to the older placeholder video. No credentials or secret values were recorded.

### Final Outcome

The branch now contains a more polished Violet creator profile, stronger rhythm chart generation and validation, safer public publication rules, separate public difficulty choices, MP4-compatible media handling, a responsive creator rhythm preview, and a guided publishing-readiness flow.

### Remaining Work

- Correct the final Preview & Publish media-source priority so a newly uploaded MP4 replaces the stale placeholder preview instead of being hidden by the older `videoUrl`.
- Ensure the HTML video element reloads whenever its source changes.
- Re-run the focused Studio preview tests after that media-source correction.
- Apply migration `009_rhythm_beatmap_published_at.sql` to the intended deployed database after confirming its migration state.
- Complete real-browser testing for upload, generation, publication, and public playback using representative full-length songs.

### Lesson

Audio upload, final-video upload, AI generation, and public publication are separate lifecycle states even when they use the same MP4 file type. The UI must identify which state a file updates and must always preview the newest intended media source; otherwise a successful upload can appear to have failed because an older URL still has precedence.

---

## 2026-07-14 — Public Rhythm Hub Song Rows, Selection Polish, and Gameplay Background Choice

### AI Tool Used

OpenAI Codex was used to inspect the public Rhythm Game hub, trace public beatmap and media data, implement the requested interface changes, update regression coverage, diagnose the live Sailor Song video source, and run frontend verification. Ferlyn supplied the desired row layout, the iterative design feedback, and the gameplay screenshot used for the media-background investigation.

### Objective

Replace the public Rhythm Game hub's repeated one-card-per-difficulty presentation with a compact one-row-per-song selection screen, then polish the layout and interactions without copying Rhythm Plus branding or changing Shades of SG's backend behavior. The follow-up objective was to confirm which media source public rhythm gameplay uses and let players choose between the normal purple gameplay background and the Song's MP4 background.

### Rhythm Hub Audit and Data Flow

The original hub loaded published Songs and requested a beatmap summary for each playable Song. It then flattened every published difficulty into a separate card, which repeated the same cover, title, artist, community, and language information up to three times.

The existing public gameplay route was already correct:

- the hub navigates to `/game/:songId?difficulty=EASY|MEDIUM|HARD`;
- `RhythmGame` reads the difficulty query parameter and normalizes it;
- the public beatmap service requests only the selected stored PUBLISHED chart;
- draft preview remains creator-authenticated and separate from public play;
- guest and registered-player score behavior is handled after gameplay and did not need to change.

The public beatmap summary provides one row for Easy, Medium, and Hard. A published summary contains the public beatmap metadata, including its note count. This allowed the frontend to group safely without introducing a new backend route.

### One-Row-Per-Song Refactor

The hub now groups loaded beatmap summaries with a `Map` keyed by `song.id`. Only rows whose status is `PUBLISHED` are added to a Song's `difficulties` array. Duplicate difficulty entries are ignored, and the final controls are ordered Easy, Medium, then Hard.

This grouping produces the following public rules:

- every Song appears at most once;
- a Song with no PUBLISHED beatmap is omitted;
- DRAFT, FAILED, and NOT_CREATED difficulties produce no public action;
- each available difficulty is an explicit semantic link;
- every link retains the correct Song ID and difficulty query parameter;
- note counts come from the published beatmap summary rather than hardcoded data.

Each row contains one meaningful cover image, a semantic Song heading, artist, community/theme, languages, formatted duration, an available-difficulty summary, and compact Easy, Medium, and Hard play actions. Easy retains a green treatment, Medium uses purple, and Hard uses pink/red. The play action includes the difficulty name, note count, and a play icon, with an accessible label such as `Play Sailor Song on Easy difficulty`.

### Visual and Interaction Refinement

The initial row conversion was followed by a dedicated polish pass. The final hub includes:

- a centred content area aligned with the existing site maximum width;
- dark navy and purple surfaces using the existing design tokens;
- square cover artwork with `object-fit: cover`, clipped rounded corners, and a subtle scale effect;
- a deliberate desktop grid for artwork, Song information, and grouped difficulty controls;
- a smaller supporting `DIFFICULTIES AVAILABLE` label with correct singular and plural grammar;
- real Song duration formatted as `m:ss`, omitted cleanly when unavailable;
- metadata ordered as community/theme, language, and duration;
- a two-pixel row lift, brighter surface, purple border glow, and subtle shadow on hover;
- the same clear row treatment through `:focus-within` for keyboard users;
- difficulty-button hover, pressed, and visible focus states;
- default row cursors so the row itself does not imply an action;
- reduced-motion handling that removes lift and image-scale motion;
- tablet wrapping that moves difficulty actions beneath the metadata;
- a single-column mobile layout with full-width difficulty actions and touch targets above forty-four pixels.

No advertisement, favorite control, mapper metadata, fake difficulty rating, placeholder Song, or Rhythm Plus branding was added.

### Client-Side Sorting

Sorting was implemented because the existing public Song payload already contains `publishedDate`, title, and artist. The hub provides Newest, Title, and Artist choices and sorts only the already loaded, grouped Songs. Newest remains the default and uses `publishedDate`; Title and Artist use locale-aware comparisons, with title used as the artist-sort tiebreaker.

The first sort control inherited the project's global `select { width: 100% }` rule and appeared much wider than intended. A follow-up CSS correction made it a compact, left-aligned `Sort by [Newest]` control with a two-hundred-pixel select and a responsive maximum width. No search field, filter system, backend sorting parameter, or difficulty sorting was introduced.

### Rhythm Gameplay Video Investigation

The gameplay media audit confirmed that a beatmap does not own or embed a video. Public gameplay loads two separate resources:

1. the selected PUBLISHED beatmap supplies note timing and chart metadata;
2. the public Song supplies `audioUrl` and the optional `videoUrl`.

`RhythmGame` uses the audio element as the authoritative clock. When a Song has `videoUrl`, a muted, looping video element is rendered behind the gameplay and kept synchronized with the audio position.

The same Song `videoUrl` field can represent either supported final-video workflow:

- creator uploads are stored by `uploadVideoStream` under the Cloudinary `shades-of-sg/uploaded-videos` folder;
- AI-assembled videos are uploaded by `uploadCompiledVideo` under `shades-of-sg/compiled-videos` and persisted by the video assembler.

Gameplay intentionally does not branch on provenance. It consumes the Song's selected final `videoUrl` in the same safe way for either source.

A read-only lookup against the local SQLite state could not classify the screenshot Song because that local schema did not contain `video_public_id`, and the screenshot's Song ID was not present in that local database. The active local API at port 5000 was therefore checked directly. During the first background audit, Sailor Song `ab589907-3903-43e9-83d4-cf3b461a9059` returned:

- status `PUBLISHED`;
- `videoUrl` set to `https://shades-of-sg.vercel.app//videos/placeholder-generation.mp4`;
- `videoPublicId` set to `null`.

At that point, the gameplay background was the configured temporary generation placeholder rather than final media. After Ferlyn uploaded the completed MP4 through the final-video workflow, a second live API check confirmed that the record had changed to:

- status `PUBLISHED`;
- `audioUrl` set to a Cloudinary MP4 under `shades-of-sg/audio`;
- `videoUrl` set to a Cloudinary MP4 under `shades-of-sg/uploaded-videos`;
- `videoPublicId` set to the matching `shades-of-sg/uploaded-videos` public identifier;
- duration set to 210 seconds.

This proved that the final-video upload itself had succeeded and the remaining publishing prompt was a readiness-validation bug rather than a failed Cloudinary upload.

### Purple and Music-Video Background Toggle

Public gameplay now displays a compact Background control in the Run Controls panel with two explicit choices:

- `Purple` uses the normal dark-purple Shades of SG gameplay surface;
- `Music video` uses the Song's `videoUrl` as a muted background.

The implementation preserves the previous video-first behavior for Songs that have a video and no saved player preference. The selected choice is stored locally under `rhythmBackgroundMode`, so it persists for later sessions on the same browser.

When the player enables the video during a run, the video is mounted, moved to the audio element's current time, and resumed only when gameplay is playing. The audio remains the authoritative timing and sound source. Turning the video off unmounts it and reveals the purple surface without changing note timing, phase, score, accuracy, beatmap state, or audio playback.

If a Song has no `videoUrl`, gameplay automatically uses purple, disables the Music video choice, and presents a short availability explanation. The controls use semantic buttons, `aria-pressed`, visible focus rings, distinct text labels, and more than color alone to communicate the current selection.

### Published-Song Readiness Follow-Up Fix

The publishing assistant continued to show “Add a finished video before publishing” even after the final MP4 appeared in both `videoUrl` and `videoPublicId`. The root cause was the backend `publishValidation` status check. It accepted only `READY`, so an already `PUBLISHED` Song was reported as missing `status READY`. The frontend grouped `status READY` with video-related requirements and therefore displayed the misleading Generate AI Video and Upload Video choices.

The backend readiness rule now accepts both `READY` and `PUBLISHED` as valid completed publication states. Existing DRAFT, GENERATING, and ARCHIVED safeguards remain unchanged. A regression assertion uploads a final MP4, publishes the Song, requests readiness again, and verifies that the response remains ready with an empty missing-task list and `songStatus: PUBLISHED`.

### Files Modified

- `frontend/src/pages/RhythmHub.jsx`
- `frontend/src/components/RhythmGame.jsx`
- `frontend/src/App.css`
- `frontend/src/App.test.jsx`
- `frontend/src/components/RhythmGame.test.jsx`
- `backend/controllers/songController.js`
- `backend/tests/songLifecycle.test.js`
- `ferlyn_journal.md`

No API route, model, migration, authentication rule, beatmap lifecycle, or score-persistence behavior was changed. The only backend implementation change was the completed-status readiness correction from READY-only to READY-or-PUBLISHED.

### Test Coverage Added or Updated

The public hub regression coverage now verifies:

- one rendered row per Song;
- one cover and heading rather than repeated difficulty cards;
- PUBLISHED-only difficulty actions;
- Songs without published beatmaps remain hidden;
- unplayable Songs remain hidden;
- correct Song and difficulty route parameters;
- published note counts;
- singular and plural availability labels;
- `m:ss` duration formatting;
- Newest, Title, and Artist sorting.

The gameplay regression coverage now verifies:

- the music-video background is rendered from `song.videoUrl`;
- switching to Purple removes the video and applies the fallback surface;
- switching back restores the video;
- the background choice is persisted;
- Purple is selected automatically when no video exists;
- the Music video choice is disabled and explained when unavailable.

The backend lifecycle regression coverage now also verifies that a creator-uploaded final MP4 remains publish-ready after the Song transitions from `READY` to `PUBLISHED`.

### Verification Performed

The final verified frontend state after the background-toggle work was:

- focused Rhythm Hub application tests: one file passed, sixteen tests passed;
- focused RhythmGame tests: one file passed, nine tests passed;
- complete frontend Vitest suite: sixteen files passed, eighty-eight tests passed;
- frontend ESLint: passed;
- focused backend Song lifecycle suite: one suite passed, twenty-two tests passed;
- complete backend Jest suite: six suites passed, seventy-five tests passed;
- backend ESLint: passed;
- Vite production build: passed with 1,906 modules transformed;
- `git diff --check`: passed.

The production build retained the existing advisory that the primary JavaScript chunk is larger than five hundred kilobytes after minification. The warning did not fail the build and was not introduced as a separate optimization task.

### Final Outcome

The public Rhythm Game hub now reads as a real Song-selection interface rather than a repeated card gallery. It scales cleanly from desktop to mobile, keeps every difficulty action explicit, exposes only published rhythm content, and provides compact client-side sorting without expanding the API surface.

Gameplay now makes its background source an explicit player choice. Users can retain the readable purple surface or view the Song's stored MP4 without affecting the audio clock, chart, scoring, guest behavior, registered score submission, creator preview restrictions, loading state, error state, or result flow.

The publishing assistant now recognizes an already published Song with a valid final MP4 as complete instead of incorrectly asking the creator to generate or upload the video again.

### Remaining Work

- Reconcile the older local SQLite schema with the active application schema before using it for future provenance diagnostics; do not apply destructive synchronization to a deployed database.
- Refresh the open Studio page after the backend reload and confirm the stale video prompt no longer appears for the already published Sailor Song.
- Perform real-browser and real-device playtesting of the background toggle during countdown, active play, pause, restart, fullscreen, and reduced-motion configurations.
- Consider JavaScript chunk splitting as a separate performance task if the production bundle advisory becomes a deployment concern.

### Lesson

Beatmap content and visual media are related at the Song experience level but are separate data contracts. Keeping audio as the authoritative clock and treating video as an optional presentation layer makes the background safely user-selectable without compromising chart timing or score integrity. A stored URL also does not prove that media is final: provenance fields and the actual URL path must be checked before describing a video as uploaded or AI-generated. Readiness validation must additionally recognize terminal lifecycle states correctly; requiring a published record to return to READY can turn a successful upload into a misleading missing-media warning.

---

## 2026-07-14 — Published Final-Video Readiness Correction

### Problem

After a completed MP4 was uploaded successfully, Preview & Publish continued to display “Add a finished video before publishing” and offered Generate AI Video and Upload Video again. A live read-only API check confirmed that Sailor Song already had a Cloudinary `videoUrl`, a matching `videoPublicId`, a 210-second duration, and `PUBLISHED` status.

### Root Cause

The upload and Cloudinary persistence were working. The false prompt came from `publishValidation`, which considered only `READY` a valid completed state. When Studio checked an already `PUBLISHED` Song, readiness returned `status READY` as missing. The publishing modal grouped that missing status with video requirements and incorrectly presented the missing-video workflow.

### Fix

Publication readiness now accepts both `READY` and `PUBLISHED`. DRAFT, GENERATING, and ARCHIVED Songs still fail the completed-state check. No media URL, upload route, generation process, authentication rule, or public Song behavior was changed.

### Regression Coverage

The final-video lifecycle test now uploads an MP4, verifies readiness in READY, publishes the Song, checks readiness again, and confirms:

- `ready` remains `true`;
- `missing` remains empty;
- `songStatus` is `PUBLISHED`.

### Files Modified

- `backend/controllers/songController.js`
- `backend/tests/songLifecycle.test.js`
- `ferlyn_journal.md`

### Verification

- focused Song lifecycle suite: twenty-two tests passed;
- complete backend Jest suite: six suites and seventy-five tests passed;
- backend ESLint: passed;
- focused frontend App suite: sixteen tests passed;
- Vite production build: passed with 1,906 modules transformed;
- `git diff --check`: passed.

### Outcome

An already published Song with a valid uploaded or generated final video is now reported as publish-ready. Studio no longer mistakes the PUBLISHED lifecycle state for a missing video and should stop prompting the creator to generate or upload the same MP4 again.
