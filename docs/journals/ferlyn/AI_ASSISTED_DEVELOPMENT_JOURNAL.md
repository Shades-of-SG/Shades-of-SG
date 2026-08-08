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

### Rose Task 3 — Song Metadata and Publishing

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
- Rose should have a distinct creator segment rather than being placed awkwardly beside unrelated content;
- public, registered, and creator users needed different navigation behaviour;
- the Reflection Wall should feel personal and memory-led rather than like a statistics dashboard;
- profile reflections should resemble a scrapbook or digital journal;
- badges should feel like keepsakes rather than generic achievement icons;
- the song-experience flow should lead naturally into play, learning, and reflection;
- the creator portal should stay within creator routes rather than sending Rose into public pages.

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

Connect the local seeded creator credential flow to the creator-side pages without exposing Rose's password in frontend code or tracked documentation.

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

Rose can now log in through the normal `/login` page using the creator seed account stored in `backend/.env`.

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

## 2026-07-08 — Repository Housekeeping, Build Repair, and Development Support

### AI Tool Used

Codex.

### Objective

Resolve Windows Git housekeeping and build problems that interrupted Creator Studio development without duplicating the separate Studio refinement entry for this date.

### Context

The Codex sessions recorded line-ending warnings, an overlong tracked media filename, storage files entering Git, a Vercel/build problem, and a JSX parse failure in Settings.

### Prompt Summary

I asked Codex why Git was converting line endings, how to stop backend uploads from breaking Git, how to repair the deployment/build error, and why Settings failed to compile.

### AI Output

Codex explained the Windows `core.autocrlf` behaviour, added repository line-ending guidance, ignored `backend/storage/`, and removed already tracked upload artefacts from the Git index without deleting the local files. This resolved the filename-too-long path that blocked Git staging.

The Settings parse failure was traced to a component opened with `<div>` but closed with `</CreatorPageShell>`. Codex corrected the closing tag, removed duplicate or unused imports, and rebuilt successfully.

### My Review and Decisions

I kept uploaded development media outside source control and treated line-ending warnings separately from application errors. I also accepted the minimal Settings syntax repair rather than redesigning the page.

### Files Created

- `.gitattributes`

### Files Modified

- `.gitignore`
- `backend/.gitignore`
- `frontend/src/pages/Settings.jsx`
- `package.json`

### Verification Performed

- Git confirmed the problematic upload path was ignored and no longer tracked.
- `npm.cmd run build --prefix frontend` completed successfully after the Settings correction.

### Final Outcome

Generated/uploaded media stopped blocking Git, line-ending behaviour was documented, and the Settings JSX parse error was removed.

### Remaining Work

- Commit housekeeping changes intentionally on the appropriate branch.
- Keep deployment uploads and generated media outside Git.

### Lesson

Repository failures caused by tracked runtime files are different from code failures. Storage directories and line endings need explicit repository policy, while build syntax errors should be repaired at their exact component boundary.

---

## 2026-07-09 — Generation API Debugging and Repository Revert Recovery

### AI Tool Used

Codex.

### Objective

Diagnose creator generation 500 errors and recover the repository after merge and revert operations destabilised the working branch.

### Context

Generation requests failed after branch integration, and later Git operations left a `.gitignore` conflict during an attempted revert.

### Prompt Summary

I asked Codex why creator generation pages returned 500, how to use local versus remote databases safely, and how to return to the earlier working commit without losing control of the repository state.

### AI Output

Codex traced generation failures to a missing Sequelize association alias in Song includes, incompatible job-status naming between the backend and database/model, and local development unintentionally using the remote PostgreSQL configuration. It added safer frontend JSON handling, corrected generation navigation and data-shape reading, and changed development to prefer local SQLite unless remote use is explicitly enabled.

During the later revert, Codex identified the remaining `.gitignore` conflict and planned to retain the normal ignore rules from both sides while removing conflict markers. The recorded session was interrupted, so that revert work is not claimed as fully completed by Codex.

### My Review and Decisions

I asked for the root cause rather than another UI workaround and separated local development data from production configuration. I also used revert recovery to return to a known working project state after the integration became unstable.

### Files Created

No new application file is claimed from the interrupted revert session.

### Files Modified

- `backend/controllers/generationController.js`
- `backend/config/database.js`
- `frontend/src/pages/GenerationProgress.jsx`
- generation-related route and service files present in the recorded branch state

### Verification Performed

- The generation endpoint and local database configuration were checked during the debugging session.
- The later revert session was interrupted and therefore has no claimed final automated verification.

### Final Outcome

The generation failure was correctly separated into association, status, and environment-configuration problems. Repository recovery continued through explicit revert commits, but the interrupted conflict-resolution step remained incomplete in the session log.

### Remaining Work

- Confirm the final reverted branch state and rerun the complete project checks.
- Reconcile lifecycle status names before reintroducing later generation work.

### Lesson

Database aliases, lifecycle constraints, and environment selection can each produce the same 500 response. Reverts also need the same conflict review and verification discipline as forward merges.

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

Before this task, the public footer displayed a Privacy Statement link that returned users to the homepage and a Terms label that did not lead to a completed legal page. The project already had a dark navy visual foundation, lavender and Rose accents, rounded components, shared public navigation, and a full footer, but it did not have a legal-page pattern.

The first Terms implementation established the correct information architecture but initially felt too much like a documentation page. Its hero and typography were also too large for the amount of legal content, and the original quick-navigation pills competed visually with the section cards. The page therefore went through several screenshot-led refinements before becoming the reference design for the Privacy Policy.

### Prompt Summary

I asked Codex to:

- create a dedicated Terms & Conditions page within the existing public `MainLayout`;
- add a clean hero containing the title, introduction, and last-updated date;
- add sticky quick navigation for Acceptance of Terms, Community Guidelines, User Accounts, Reflections & User Content, Intellectual Property, Privacy, Limitation of Liability, and Contact;
- write content specifically for an educational, community-driven Singapore music platform rather than generic placeholder legal copy;
- present every major section in its own rounded card with purple headings, subtle borders, and generous spacing;
- preserve the Shades of SG dark navy, lavender, Rose, rounded-component, and typography system;
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
- increased section-heading hierarchy and added narrow Rose dividers beneath headings;
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

For the Privacy Policy, I chose visual continuity over a separate redesign. The page copies the Terms structure and uses only subtle privacy-specific accents. I accepted shield and lock decoration at low opacity, but kept the palette within lavender, indigo, muted blue, and Rose rather than introducing unrelated greens.

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

The two pages feel like companions: Terms uses a warmer Rose music-and-community treatment, while Privacy uses cooler indigo and trust-oriented shield/lock details. Their interaction design supports both deliberate manual reading and fast section navigation. Manual scrolling produces calm per-card entrance motion, while quick-navigation clicks avoid revealing every intermediate section and instead focus attention on the selected destination.

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

## 2026-07-11 — Authoritative Song Lifecycle and Creator Seed Utility

### AI Tool Used

Codex.

### Objective

Create one authoritative creator-to-public Song lifecycle, keep generation separate from publication, enforce creator ownership, expose only published Songs publicly, and add a safe creator seed command after the development database reset.

### Context

The audit found that Song only supported `DRAFT` and `PUBLISHED`, GenerationJob used older status names, creator ownership was not consistently enforced, public endpoints returned drafts, and production-facing `demo-song` handling remained.

### Prompt Summary

I asked Codex to use `DRAFT → GENERATING → READY → PUBLISHED → ARCHIVED` for Songs and `QUEUED → PROCESSING → COMPLETED / FAILED` for jobs; prevent automatic publication; enforce creator ownership; validate publication requirements; preserve data through an additive migration; remove production demo exceptions; and add an environment-driven creator seed command that creates no demo content.

### AI Output

Codex audited the design documents, models, migrations, authentication, controllers, Cloudinary services, tests, and frontend entry points. It expanded the existing Song record rather than creating a separate draft table, added and backfilled authoritative metadata and media fields, converted legacy statuses, and added creator/status and public-publication indexes without deleting legacy columns.

Public reads now return only `PUBLISHED` Songs, while creator routes use database-verified ownership. Publishing requires an owned `READY` Song, completed generation, required metadata, lyrics, cover, audio, and video. Generation creates a `QUEUED` job, produces `READY` on completion, and never publishes. Failure records `FAILED` and restores a retryable state.

Codex also corrected the Cloudinary video return-shape mismatch, removed production `demo-song` handling, and added an idempotent `seedCreator.js` utility using environment credentials and the existing password hashing. It creates one creator when needed and no Songs, jobs, reflections, scores, segments, frames, or demo records.

### My Review and Decisions

I chose one Song row as the source of truth through drafting, generation, review, publication, and archival. I kept `READY` separate from `PUBLISHED`, preserved legacy columns until later verified cleanup, and kept seeding separate from normal startup.

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

No frontend files were changed in this phase.

### Verification Performed

- Focused lifecycle tests passed: one suite and eight tests.
- The complete backend suite passed: four suites and eighteen tests.
- ESLint passed for the changed backend files.
- `node --check` passed for the seed script and `backend/package.json` parsed successfully.
- The seed script was deliberately not executed, avoiding an unintended database write.

### Final Outcome

The backend now has persistent creator-owned drafts, separate generation state, explicit publication, reversible unpublishing, strict public filtering, and a narrow secure creator seed command.

### Remaining Work

- Apply migration 004 in production.
- Backfill legacy ownerless Songs before enforcing a physical PostgreSQL `NOT NULL` constraint.
- Integrate Studio, My Songs, Dashboard, generation monitoring, and public experiences.

### Lesson

Generation readiness and human publication approval are different decisions. Seed utilities are safest when explicit, narrow, environment-driven, and idempotent.

---

## 2026-07-11 — Studio as the Authoritative Draft Workflow

### AI Tool Used

Codex.

### Objective

Make Creator Studio the authoritative place for persistent Song drafts while retaining the same Song ID through save, refresh, media upload, generation, readiness review, and publication.

### Context

Save Draft and Publish only showed alerts, Generate Video only navigated elsewhere, no Song ID was retained, refresh discarded work, cover images were unsupported, and Preview & Publish used hardcoded fallback media.

### Prompt Summary

I asked Codex to persist the first draft and retain its UUID; reload owned drafts; preserve extracted and manually edited `rawLyrics`; support cover upload and replacement; save before generation; keep media and generation on the same Song; use real preview data; let the backend decide readiness; and avoid redesigning unrelated pages.

### AI Output

Codex audited Studio, routing, authentication, API configuration, Cloudinary helpers, and tests. It retained the existing interface and added `/creator/studio/new`, `/creator/studio/:songId`, and a compatibility redirect.

A dedicated authenticated `songService` now creates the first `DRAFT`, adopts its UUID in the route, updates that same record on later saves, and reloads persisted metadata, lyrics, media, lifecycle status, and saved time after refresh. Existing transcription paths remain, while the final editable value is stored as `rawLyrics`.

Audio and cover uploads now remain attached to the owned Song. Covers receive an immediate local preview and replacement attempts cleanup only after the new upload and database update succeed. Generate Video saves first and starts generation with the stable ID. Preview & Publish uses real persisted values and media, and a shared backend readiness check disables publication until requirements are satisfied.

### My Review and Decisions

I made the route ID the durable workflow identity, reused one save operation before generation, placed readiness authority on the backend, and removed hardcoded preview media that implied content not attached to the draft.

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

### Verification Performed

- Backend tests passed: four suites and nineteen tests.
- Frontend tests passed: two files and ten tests.
- Targeted backend and frontend ESLint passed.
- The frontend build passed with 1,880 modules transformed.
- `git diff --check` reported no whitespace errors.

### Final Outcome

Studio now creates one persistent Song, adopts its UUID, reloads saved work, attaches media to the same record, saves before generation, and relies on the backend for readiness and publication.

### Remaining Work

- Remove the secondary creation form from Generation Tasks.
- Connect My Songs edit actions to the Studio UUID route.
- Add replaced-audio cleanup and complete the real MP4 pipeline.

### Lesson

A persistent draft needs durable identity as well as durable data. Readiness can be explained in the frontend, but it must be decided by the backend.

---

## 2026-07-11 — Generation Around an Existing Studio Song

### AI Tool Used

Codex.

### Objective

Remove duplicate Song creation from Generation Tasks and make every generation attempt use the existing creator-owned Studio Song ID.

### Context

Generation Tasks still contained a second Song form, submitted duplicate and dummy metadata, used inconsistent status names, and protected duplicate active jobs only through a controller lookup.

### Prompt Summary

I asked Codex to remove duplicate creation, start jobs with only an eligible Song ID, enforce creator-scoped access and exact statuses, poll active jobs, prevent simultaneous jobs, preserve failed Songs for retry, ensure completion produces `READY` without publishing, and label configured placeholder media honestly.

### AI Output

Codex audited the generation backend, services, creator pages, shared service, environment examples, and tests. Generation Tasks now loads owned `DRAFT` or `READY` Songs with audio and `rawLyrics`, sends only the selected UUID, and never calls Song creation.

The backend validates ownership, lifecycle, prerequisites, and active jobs. Jobs move through `QUEUED`, `PROCESSING`, and terminal states; success requires video and marks the same Song `READY`; failure records its message and restores a retryable state. A partial unique index guarantees one active job per Song. Creator job pages use the shared authenticated service and poll until completion or failure.

Temporary video support moved behind `PLACEHOLDER_VIDEO_URL`. Job details return `videoIsTemporary: true`, the UI explains that review is required, and the real scene, frame, FFmpeg, and Cloudinary path remains available when no placeholder is configured.

### My Review and Decisions

I removed the duplicate form because Studio owns content creation while generation owns processing attempts. I retained a start control for eligible existing Songs, added database-level concurrency protection, and treated placeholders as operational fallbacks rather than generated output.

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

### Verification Performed

- Backend tests passed: four suites and twenty-four tests.
- Frontend tests passed: two files and ten tests.
- Full backend and frontend ESLint passed.
- The frontend build passed with 1,880 modules transformed.
- Searches confirmed that duplicate creation, dummy metadata, old form remnants, and direct generation requests were removed.

### Final Outcome

Generation uses the same Studio Song ID, creates no duplicate Song, protects ownership, rejects simultaneous jobs, supports retry after failure, and never publishes automatically.

### Remaining Work

- Apply migration 005.
- Consider a durable production queue and versioned retry data.
- Complete and validate the real MP4 pipeline in deployment.

### Lesson

Creation and generation are separate responsibilities joined by one durable ID. Concurrency rules belong in the database as well as the controller.

---

## 2026-07-11 — Real Creator Songs and Dashboard Data

### AI Tool Used

Codex.

### Objective

Replace production-facing mock data in My Songs and Dashboard with authenticated creator-scoped backend data, real lifecycle actions, and honest analytics states.

### Context

Both pages still used `pageData.js`, sample Songs, hardcoded counts, fake jobs, and invented play statistics. Archive and delete changed only local React state.

### Prompt Summary

I asked Codex to show exact lifecycle counts and real Song data; connect valid edit, generation, publication, archive, and delete actions; refetch after mutations; show real recent Songs and jobs; remove fake analytics; preserve ownership; and clean up associated Cloudinary assets.

### AI Output

Codex audited both pages and enriched the existing creator Song response with latest job state, readiness, and missing requirements. My Songs now renders real owned records and valid lifecycle actions, refetches after every mutation, and polls active work.

Dashboard now uses one authenticated summary for lifecycle counts, five recent Songs, five recent jobs, and an explicit analytics-availability flag. Archive changes a non-generating owned Song to `ARCHIVED` and clears publication. Delete verifies ownership, rejects generation, gathers cover, audio, video, and frame identifiers, deletes the database record, and then attempts Cloudinary cleanup.

Because no trustworthy play-event source existed, fabricated totals and weekly charts were removed and reported as unavailable rather than zero.

### My Review and Decisions

I enriched the existing creator response instead of adding per-row endpoints, used one summary endpoint for a consistent snapshot, removed fake analytics, and kept post-deletion storage cleanup best-effort.

### Files Created

No files were created in this phase.

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

### Verification Performed

- Backend tests passed: four suites and twenty-eight tests.
- Frontend tests passed: two files and twelve tests.
- Full backend and frontend ESLint passed.
- The frontend build passed with 1,880 modules transformed.
- Tests covered creator-scoped data, real rendering, archive visibility, deletion, ownership, cleanup attempts, and refreshed publication state.

### Final Outcome

My Songs and Dashboard now reflect the authenticated creator's real database state, refetch authoritative results after mutations, and label unavailable analytics honestly.

### Remaining Work

- Add cleanup retries, archive restoration, pagination, and a real play-event model if required.

### Lesson

Creator pages must treat the database as authoritative after every mutation. Unavailable is more honest than an invented value or a misleading zero.

---

## 2026-07-11 — Published Songs Power Public Song Experiences

### AI Tool Used

Codex.

### Objective

Make published Songs the only source for public discovery and Song-specific experiences, preserve real database IDs, and remove production sample and demo fallbacks.

### Context

Landing and Library used sample Songs, Song Experience mixed route IDs with placeholder metadata, Rhythm linked to `demo-song`, and Trivia and Playground displayed fake activity content.

### Prompt Summary

I asked Codex to use only the published Song endpoints across Landing, Library, Experience, Learning, Trivia, Playground, Explore, and rhythm entry; preserve UUIDs; add supported filters; remove `pageData.js`, samples, demo IDs, and fake Song content; retain genuine cultural content; and show honest unavailable states for incomplete supporting features.

### AI Output

Codex audited the public pages and created `publicSongService`. Library now loads published backend Songs with loading, empty, error, search, and filter states. Landing displays up to three real published Songs. Song Experience loads the selected published record and preserves its ID into Trivia, Playground, and Rhythm.

Trivia and Playground validate and display real Song context but no longer imitate unavailable content. Learning Hub retains genuine editorial material while adding published-Song entry points. Rhythm Hub no longer links to a demo, gameplay no longer defaults to `demo-song`, and the bundled demo beatmap, hardcoded media fallback, mock exports, and `pageData.js` were removed.

The backend continues to enforce `PUBLISHED` before optional search, theme, language, and mood filters.

### My Review and Decisions

I used the published endpoints as both data source and access boundary, preserved honest partial experiences, and retained Learning Hub's genuine cultural content because it was not an alternative Song database.

### Files Created

- `frontend/src/services/publicSongService.js`

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

The obsolete `frontend/src/pages/pageData.js` and `frontend/public/beatmaps/demo-song.json` files were deleted.

### Verification Performed

- Backend tests passed: four suites and twenty-nine tests.
- Frontend tests passed: two files and fourteen tests.
- Full backend and frontend ESLint passed.
- The frontend build passed with 1,880 modules transformed.
- Searches confirmed that production no longer referenced sample Songs, creator samples, `demo-song`, Song mocks, or public `pageData.js`.

### Final Outcome

One published Song record now supplies the identity, metadata, and media across public discovery and Song routes. Unpublished Songs remain inaccessible and incomplete supporting features disclose their unavailable state.

### Remaining Work

- Add real trivia, Song-linked instruments, and authored or generated beatmaps.
- Connect secure score persistence and Reflection submission.

### Lesson

A route parameter does not prove that content is public. Every public page must resolve it through a backend publication check.

---

## 2026-07-11 — Published Rhythm Songs and Secure Score Persistence

### AI Tool Used

Codex.

### Objective

Connect rhythm gameplay to playable published Songs and enforce distinct score-persistence rules for guests, registered users, and creators without trusting client identity or rank.

### Context

Rhythm Hub did not distinguish playable Songs, gameplay relied on static beatmaps, and the score endpoint accepted unauthenticated writes, body `userId`, client rank, and unpublished Songs.

### Prompt Summary

I asked Codex to show only playable published Songs; validate the selected ID; use stored audio or video; provide difficulty-specific gameplay without demo data; keep guest and creator results session-only; persist registered scores through JWT identity; derive rank server-side; and reject invalid tokens, unpublished Songs, malformed values, and impossible scores.

### AI Output

Codex audited rhythm loading and score persistence. Rhythm Hub now lists published Songs with audio and at least five seconds of duration. Gameplay validates the route ID through the public API and uses the Song's stored audio or video.

Because no beatmap model existed, Codex added a deterministic duration-derived chart for Easy, Medium, and Hard. Missing duration produces an unavailable state rather than mock notes.

Guests and creators can play without database writes; the frontend persists only for `REGISTERED`. The backend treats a missing token as a guest result with no row, an invalid supplied token as unauthorized, and a creator token as forbidden. Registered identity comes from JWT, rank is derived from accuracy, and validation covers publication, difficulty, score, accuracy, chart size, combo, and a theoretical score maximum.

### My Review and Decisions

I did not persist guest rows with null owners or creator runs as player progress. I kept identity and rank server-authoritative and accepted duration-derived charts as a temporary real-Song configuration.

### Files Created

No files were created in this phase.

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

### Verification Performed

- Backend tests passed: four suites and thirty-eight tests.
- Frontend tests passed: two files and fifteen tests.
- Full backend and frontend ESLint passed.
- The frontend build passed with 1,880 modules transformed.
- Tests covered guest non-persistence, JWT ownership, ignored client identity and rank, creator denial, publication checks, validation, impossible scores, playable real Songs, and exclusion of incomplete Songs.

### Final Outcome

Rhythm Hub now presents playable published Songs with real media and IDs. Guests and creators remain session-only, while registered scores use verified identity and server-derived rank.

### Remaining Work

- Replace procedural notes with beat-aligned charts.
- Add stronger replay verification, retry synchronization, leaderboards, and history if required.
- Complete Reflection Song validation.

### Lesson

Authentication determines who may persist, not who may play. MVP anti-cheat should first protect server-authoritative identity, publication state, rank, and feasible numeric bounds.

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
- connect submissions and public listing to real `PUBLISHED` Song IDs;
- preserve the selected Song ID from Song Experience;
- require guest, registered named, and registered anonymous submissions to enter `PENDING`;
- derive registered identity from JWT rather than client fields;
- add a rejected moderation state and reject action.

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

The redesigned modal uses a warm cream background, 20-pixel rounded corners, purple accents, softer shadows, tighter vertical rhythm, a scrollable form body, and an always-visible footer. The textarea includes a helper message and live character counter. Choosing a song moves focus to the textarea. Memory Type is implemented as a multi-select chip group containing Nostalgia, Family, National Identity, Friendship, School, and Home.

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

In a later integration pass, Codex connected Reflection Wall to the published-Song source of truth. Song choices now come from the public endpoint, Song Experience opens `/reflections?song_id=<song-id>`, and invalid or unpublished context produces a safe unavailable state.

The backend validates the Song ID and `PUBLISHED` status before accepting a reflection. Public queries return only approved, non-deleted reflections joined to a currently published Song, so unpublishing or archiving removes them from public results without deleting their records.

Guest, registered named, and registered anonymous submissions now all begin as `PENDING`. Registered identity and private ownership come from the verified JWT and User record; body-supplied identity and moderation status are ignored. Invalid supplied tokens are rejected rather than treated as guests. The lifecycle was extended with `REJECTED`, and pending submissions are not optimistically added to the public list.

### My Review and Decisions

I preferred optional guest contribution over forcing authentication because the Reflection Wall is intended to collect community memories, including from visitors who may not want an account. I accepted the account option as a value proposition rather than a gate: registered users gain identity, editing, badges, milestones, and future reflection tracking.

I chose not to offer guest nicknames. Every guest appears as Anonymous, which keeps the public presentation and moderation rules simpler. I retained the acknowledgement that guests cannot edit or delete later so the consequence is explicit before submission.

I decided that guest reflections should not appear immediately. They enter Pending moderation and become public only after creator approval. This protects the public wall while preserving a low-friction contribution experience. When pending posts did not appear, I confirmed that this was expected status behaviour and chose to complete the real moderation workspace rather than automatically approving them.

I rejected the first identity layout because its radio buttons floated separately from their text, wasted vertical space, and placed a publishing decision before the user had written anything. I moved identity to the bottom and accepted the more natural Song → Reflection → Tags → Identity → Submit sequence.

For the creator interface, I kept the existing dark navy portal and sidebar rather than duplicating the layout. I chose darker, muted note colours so cards still resemble the public wall without becoming unreadably pale or neon against the creator background. I also preferred a real mobile drawer/detail treatment over squeezing the desktop panel into narrow widths.

I reused the existing `PENDING`, `APPROVED`, and `FLAGGED` statuses and did not add `REJECTED`, because the requested actions did not require a separate rejected-content archive. Permanent removal is handled by the confirmed Delete action. I also avoided creating a full moderation-history table because current requirements could be met safely with latest-moderator metadata.

In the later integration pass, I revised the earlier decision: every identity now starts `PENDING`, because authentication establishes ownership while moderation determines public visibility. I also accepted `REJECTED` so unsuitable content can remain recorded without being public or permanently deleted.

### Files Created

- `backend/migrations/002_guest_reflections.sql`
- `backend/migrations/003_reflection_moderation.sql`
- `backend/migrations/006_reflection_published_song_and_rejection.sql`
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
- `frontend/src/pages/SongExperience.jsx`
- `frontend/src/pages/pageData.js`
- `frontend/src/services/reflectionService.js`
- `frontend/src/test/setup.js`
- `Creator_workflow.md`

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
- The later complete backend suite passed: four suites and forty-four tests.
- The later complete frontend suite passed: two files and sixteen tests.
- Targeted backend and frontend ESLint passed.
- Later tests covered published-Song validation, deep-linking, pending submissions for every identity, JWT ownership, owner boundaries, public exclusions, rejection, and creator authorization.

### Final Outcome

The Reflection Wall now supports a complete low-friction guest contribution journey without sacrificing moderation. Guests can share a memory anonymously, understand the ownership limitation, select meaningful tags, and receive a clear confirmation. Registered users can still choose profile or anonymous display while retaining ownership controls.

Creators now have a real moderation workspace rather than a placeholder. Pending guest memories can be searched, filtered, inspected, annotated, approved, flagged, or deleted. Approved memories become visible publicly; flagged and pending content remain hidden. Counts and cards update without a full-page refresh, failed requests preserve the previous state, and the interface remains usable across desktop, tablet, and mobile layouts.

The result connects the public contribution experience, database status model, creator portal, and public visibility rule into one functional workflow.

The later integration also made Reflection Wall part of the published-Song source of truth. Real Song IDs drive selection and deep-linking, unpublished-Song content cannot leak publicly, and every identity enters the same creator-controlled moderation queue.

### Remaining Work

- Perform a final manual browser review at the team's exact 1280-pixel laptop, tablet, and mobile target widths.
- Decide whether registered-user reflections should continue to publish immediately or also enter moderation before production.
- The later integration resolved the previous item: registered named and anonymous submissions now also begin as `PENDING`.
- Apply migration 006 in existing environments that predate the integration.
- Add a moderation-history table only if the project later needs a full audit trail rather than the latest moderator metadata.
- Consider displaying a real pending count in the shared creator sidebar through a central data source; the previous hardcoded badge was removed.
- Add optional notifications for creators when new guest reflections arrive and for registered contributors when a submission changes status.
- Replace the current token mechanism with expiring server-managed sessions before production deployment.
- Confirm production retention and deletion policies for anonymous guest content.

### Lesson

Guest contribution and moderation are one workflow, not two independent features. Allowing anonymous submission without building the approval path creates content that is saved correctly but appears lost to both visitors and creators. The public visibility rule was not the bug; the missing creator transition from `PENDING` to `APPROVED` was.

The strongest implementation reused the existing status model and creator shell, added only the metadata required for real operations, and kept public and moderation serializers separate. This reduced schema risk and protected anonymous-account privacy while still giving creators the context they need.

Form hierarchy also changes how welcoming a feature feels. Asking users to pick a song and write their memory before deciding how to publish follows their natural mental sequence. Clickable identity cards, a visible action footer, compact spacing, and post-contribution account prompts made authentication feel like an optional benefit rather than a barrier.

Authentication and moderation answer different questions. Authentication establishes private ownership; moderation determines public suitability. Joining public reflections to currently published Songs also preserves the creator's publication decision throughout the experience.

---

## 2026-07-12 — Final Integration QA, Cleanup, and Deployment Readiness

### AI Tool Used

AI-assisted coding workflow recorded in `Creator_workflow.md`; the specific AI tool was not named in the Phase 8 entry.

### Objective

Audit the integrated creator, public, guest, registered-user, and creator-moderation workflows, remove remaining production mock behaviour, harden deployment configuration, and distinguish locally verified readiness from checks that still required deployed infrastructure.

### Context

The exact date is supported by commit `71dc641ec4ef6718d19f91c779fdf7ace0a42530`, committed on 12 July 2026 at 00:35:05 Singapore time with the subject `Phase 8 Complete - Final Integration QA, Cleanup, and Deployment Readiness`.

The integrated workflow still needed final review of migration safety, ownership boundaries, mock and placeholder usage, authentication configuration, seed behaviour, analytics honesty, automated coverage, and deployment documentation.

### Prompt Summary

The recorded Phase 8 scope was to:

- audit the integrated workflows without adding unrelated features;
- remove fabricated analytics and remaining production mock behaviour;
- make creator seeding explicit rather than automatic;
- require a configured production authentication secret;
- review migrations, constraints, indexes, and legacy compatibility;
- quarantine unsafe legacy ownerless Songs without unauthorised destructive cleanup;
- review API, CORS, uploads, environments, and deployment configuration;
- run the complete local tests, lint, build, and diff checks;
- document checks that could not be completed without deployed services.

### AI Output

The audit removed fabricated totals, weekly values, top-Song data, and completion rate from Total Plays. With no persisted play-event source, the page now states that analytics are unavailable.

Automatic creator seeding was removed from startup. `npm run seed:creator` remains explicit and creates no demo content. The insecure production token fallback was removed; production requires `AUTH_TOKEN_SECRET` or `JWT_SECRET`, and a test proves token creation fails closed without either value.

Clean PostgreSQL schema creation now makes `songs.creator_id` non-null with a restrictive user foreign key. Existing migration 004 deliberately does not force `NOT NULL` while unknown orphan rows may exist. Public Song reads, scores, reflection submissions, and public reflection joins quarantine ownerless Songs.

The migration review confirmed the additive order of migrations 001 through 006 and the required indexes. No PostgreSQL `DATABASE_URL` was available, so clean Supabase/PostgreSQL execution was not claimed. A local SQLite audit found no orphan jobs, segments, frames, reflections, or scores, but found two legacy published Songs with null ownership. They were not deleted because destructive cleanup was not authorised.

Repository searches confirmed that normal production code no longer referenced the recorded mock Song arrays, demo IDs, dummy metadata, fake weekly charts, or direct localhost API URLs. Intentional placeholder and procedural rhythm limitations remained labelled. Environment examples and deployment documentation were updated.

### My Review and Decisions

The recorded decisions preserved non-destructive database behaviour and did not use `force: true`. Legacy ownerless records were quarantined rather than silently deleted. Unavailable analytics and missing content remained honest, seeding stayed explicit, production secrets fail closed, and the journal did not claim infrastructure verification that was unavailable locally.

### Files Created

No files were created in this phase.

### Files Modified

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

### Verification Performed

- Backend tests passed: four suites and forty-five tests.
- Frontend tests passed: two files and sixteen tests.
- Root `npm test` exited successfully with the same totals.
- Root `npm run lint` passed with no reported errors.
- The frontend build passed with 1,880 modules transformed.
- `git diff --check` passed with only line-ending conversion warnings.
- The local SQLite integrity audit found no orphan jobs, segments, frames, reflections, or GameScores.
- Clean PostgreSQL migrations and live deployed-service testing were not performed because the required URL and credentials were unavailable.

### Final Outcome

The integrated workflow remained green under the recorded local checks. Remaining mock analytics were removed, production authentication and creator seeding were hardened, unsafe ownerless Songs were excluded from public and persistence paths, and deployment documentation was aligned with the implementation.

### Remaining Work

- Run migrations 001 through 006 on a clean temporary PostgreSQL database and inspect the required indexes.
- Review and assign or delete the quarantined null-owner Songs before enforcing `NOT NULL` on the existing database.
- Complete live Render, Vercel, Supabase, and Cloudinary testing.
- Complete the final AI MP4 pipeline, authored beatmaps, persisted play analytics, and real Song-specific learning content.

### Lesson

Deployment readiness requires more than a green build: fail-closed secrets, explicit seeds, honest unavailable states, ownership boundaries, non-destructive migrations, and a clear distinction between verified local behaviour and infrastructure-dependent checks.

---

## 2026-07-12 — Registered Navigation, Branch Integration, and Creator-Managed Beatmaps

### AI Tool Used

Codex.

### Objective

Consolidate the day's Codex sessions covering a teammate-branch merge, standardised registered navigation, and the continuation of the creator-controlled rhythm-game and persistent-beatmap workflow.

### Context

The work came from separate Codex sessions stored under `sessions/2026/07/12`. The repository needed `feat/public-task-1` merged into `main`; registered pages still used inconsistent account controls; and the rhythm game needed stored creator-generated beatmaps rather than generation during public play.

### Prompt Summary

I asked Codex to:

- merge the current teammate branch into `main`, resolve conflicts carefully, and push the result;
- make logged-in navigation match the guest navbar while using only the profile image as the account-menu trigger;
- remove duplicated page-level user panels and keep profile, settings, and logout in one dropdown;
- retain translation controls and consistent responsive navigation;
- continue the partially completed four-lane rhythm-game upgrade;
- make beatmap generation a creator-controlled Studio feature using stored Easy, Medium, and Hard charts;
- prevent public gameplay from editing timing or generating charts;
- record and commit the completed work.

### AI Output

Codex fetched the latest branch state, audited both histories, started a no-commit merge, and reviewed eleven conflicts. It preserved the newer creator/public architecture while integrating unique public Song, reflection, statistics, component, and dependency work. The merge was committed as `8048046`, pushed to `origin/main`, and left the local and remote branches aligned with a clean worktree.

The registered navbar was standardised around the logo, public navigation links, language control, and a profile-image dropdown. The duplicate account label, arrow, and page-level user block were removed. The dropdown retained profile, settings, and logout, and the change was committed as `0536892` without including unrelated rhythm work.

The rhythm workflow added a persistent `RhythmBeatmap` model and migration, creator-owned beatmap routes and services, AI and deterministic fallback generation, validation, Studio controls, stored difficulty charts, public loading of published charts, score validation, and rhythm timing/scoring utilities. Public players select a published chart but cannot edit creator timing or trigger generation.

### My Review and Decisions

I asked Codex to retain unique teammate work without replacing newer lifecycle and ownership rules. For navigation, I chose a compact image-only account trigger and removed repeated user panels. For rhythm gameplay, I kept generation and timing control in Studio so public play remains stable and uses persisted creator-approved data.

### Files Created

- `backend/migrations/008_rhythm_beatmaps.sql`
- `backend/models/RhythmBeatmap.js`
- `backend/controllers/beatmapController.js`
- `backend/routes/beatmaps.js`
- `backend/services/beatmapGenerator.js`
- `backend/services/beatmapValidator.js`
- `backend/services/fallbackBeatmapGenerator.js`
- `frontend/src/components/studio/RhythmBeatmapPanel.jsx`
- `frontend/src/services/beatmapService.js`
- rhythm scoring, timing, normalisation, and regression test files recorded in commit `0569d3d`

### Files Modified

- `backend/server.js`
- `backend/routes/scores.js`
- `frontend/src/components/RhythmGame.jsx`
- `frontend/src/pages/RhythmHub.jsx`
- `frontend/src/pages/RhythmResults.jsx`
- `frontend/src/pages/SongExperience.jsx`
- `frontend/src/pages/Studio.jsx`
- `frontend/src/Navbar.css`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/components/CreatorPageShell.jsx`
- `frontend/src/context/TranslationContext.jsx`
- `frontend/src/components/LanguageSwitcher.jsx`
- `ferlyn_journal.md`

### Verification Performed

- The branch merge was pushed successfully and local/remote `main` matched.
- The rhythm pass recorded fifty-nine backend tests and thirty-eight frontend tests passing, plus lint and production build checks.
- Navigation and translation tests, frontend lint, and the frontend build passed before commit `0536892` was pushed.
- The session continued investigating one later generation-pipeline failure rather than recording it as resolved.

### Final Outcome

The teammate branch was integrated into `main`, authenticated navigation became consistent, and the rhythm feature gained creator-managed persistent beatmaps instead of public-time generation.

### Remaining Work

- Continue investigating the generation-pipeline failure identified at the end of the rhythm session.
- Apply the rhythm-beatmap migration to deployed databases.
- Validate generated charts and media timing with real published Songs.

### Lesson

Large merges require semantic comparison, not automatic selection of one side. Persistent creator-approved beatmaps also provide a safer public experience than generating or editing timing during gameplay.

---

## 2026-07-13 — Creator Profile, Rhythm Publishing, and Video-Generation Debugging

### AI Tool Used

Codex.

### Objective

Consolidate the day's creator-profile, rhythm publishing, transcription, frame generation, export, and integration work.

### Context

Codex sessions on 13 July investigated whether GPT-4o and Whisper responsibilities conflicted, why frame generation slowed after the first frames, why generation and export failed, and why published data and creator profile pages were incomplete.

### Prompt Summary

I asked Codex to diagnose transcription and generation-model responsibilities, improve frame and export reliability, refine the creator profile, generate all beatmap difficulties correctly, simplify duplicate controls, improve creator publishing guidance, and combine the creator and public-task branches safely.

### AI Output

Codex separated speech transcription from scene-planning responsibilities, added transcription guardrails and tests, and worked through database, scene-planning, frame, video-assembly, caption, export, and Studio handoff failures. Commits across the day record generation recovery, export correction, generated-video handoff back into Studio, and a combined creator/public integration branch.

The creator profile was changed from a dashboard-like page into a creator-focused presentation. Rhythm publishing gained full-Song chart generation, creator-only timing controls, a publish-readiness modal, correct published beatmap state, media-upload refinements, and clearer generation/publishing feedback.

Codex committed the profile and publishing refinement in `66df5bf` and created the local integration branch with merge commit `8a529f3`. Earlier creator feedback was committed as `afccd79`; its push remained blocked because the saved GitHub CLI login was invalid.

### My Review and Decisions

I repeatedly tested the pages and asked Codex to distinguish root causes instead of treating every failure as a model conflict. I kept creator timing and publish readiness explicit, removed redundant generation buttons, and required the creator profile to feel like a portfolio rather than another dashboard.

### Files Created

- `backend/migrations/009_rhythm_beatmap_published_at.sql`
- `frontend/src/components/studio/PublishReadinessModal.jsx`
- creator-profile components and tests recorded in commit `66df5bf`

### Files Modified

- `backend/controllers/beatmapController.js`
- `backend/controllers/generationController.js`
- `backend/controllers/songController.js`
- `backend/services/aiScenePlanner.js`
- `backend/services/transcriptionService.js`
- `backend/services/videoAssembler.js`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/Profile.css`
- `frontend/src/pages/Studio.jsx`
- `frontend/src/pages/VideoEditor.jsx`
- `frontend/src/pages/CreatorGenerationJobs.jsx`
- `frontend/src/components/studio/RhythmBeatmapPanel.jsx`
- `frontend/src/components/studio/SongMediaUpload.jsx`

### Verification Performed

- The creator/public integration branch was created only after the recorded tests, lint, and build passed.
- Transcription regression tests were added for the corrected model behaviour.
- The local integration branch was not pushed in that session.

### Final Outcome

Creator profile and rhythm publishing became more coherent, generation and export failures were progressively corrected, and the creator/public branches were combined locally with verified history.

### Remaining Work

- Reauthenticate GitHub CLI before pushing the remaining branch.
- Continue deployed testing of long frame-generation and export jobs.
- Review generated lyrics and captions with real vocal audio.

### Lesson

AI pipeline failures need to be isolated by stage: transcription, planning, frame generation, assembly, upload, and frontend handoff can fail independently even when they appear as one generation error.

---

## 2026-07-14 — Rhythm Hub Polish, Media Hardening, and Merge-Conflict Resolution

### AI Tool Used

Codex.

### Objective

Refine the public Rhythm Hub, make gameplay video selection honest, harden creator media handling, and resolve overlapping integration-branch conflicts without losing working features.

### Context

The Rhythm Hub duplicated Song information across difficulty cards, uploaded or AI-generated MP4 media was not consistently used, several branches overlapped heavily, and live statistics, creator data, and score persistence exposed additional integration problems.

### Prompt Summary

I asked Codex to redesign Rhythm Hub as one compact row per Song, polish selection and responsive behaviour, add a purple/video gameplay-background toggle, use actual uploaded or generated MP4 media, merge Public Task 2, audit and resolve later merge conflicts, repair `generationController.js`, diagnose fake or unavailable live data, and fix registered score persistence.

### AI Output

Codex changed Rhythm Hub to one Song row with difficulty actions, real media and metadata, responsive behaviour, selection polish, and a gameplay background choice. It corrected published-video readiness so an uploaded MP4 could satisfy the relevant requirement without a misleading confirmation gate.

The media-hardening pass added authorization to raw creator requests, corrected transcription and AI-scene handling, improved uploaded-media preview and export behaviour, and added regression coverage. During branch integration, Codex produced a read-only merge audit, compared both sides of conflicted files, resolved and staged `generationController.js`, and preserved lifecycle, transcription, export, frame-regeneration, and required exports.

The live-statistics diagnosis identified an unmounted or unavailable `/api/stats` route rather than a card-rendering problem. Registered score persistence was traced to missing `max_combo` and `rank` columns in the live table; those columns and the score-history index were added and verified, while guest and creator runs remained local.

### My Review and Decisions

I chose one Song row with difficulty actions instead of repeated cards, required a real background choice rather than silent fallback media, and asked Codex to compare merge semantics file by file. I kept public-score ownership tied to registered accounts and did not turn guests or creator previews into stored player progress.

### Files Created

No unique new file was required for the Rhythm Hub layout; merge and media work reused existing project files.

### Files Modified

- `frontend/src/pages/RhythmHub.jsx`
- `frontend/src/components/RhythmGame.jsx`
- `frontend/src/App.css`
- `frontend/src/pages/SongExperience.jsx`
- `frontend/src/pages/CreatorSongs.jsx`
- `frontend/src/pages/Studio.jsx`
- `frontend/src/pages/VideoEditor.jsx`
- `backend/controllers/generationController.js`
- `backend/controllers/songController.js`
- `backend/routes/aiGeneration.js`
- `backend/services/aiScenePlanner.js`
- `backend/services/transcriptionService.js`
- `backend/tests/songLifecycle.test.js`
- `backend/tests/transcriptionService.test.js`

### Verification Performed

- Rhythm Hub and background-toggle tests, frontend lint, and the production build passed before commit `22df5fb`.
- Published-video readiness tests passed before commit `f7bef39`.
- `generationController.js` passed `node --check` and `git diff --check` after conflict resolution.
- Registered score persistence was covered by nineteen focused checks in the session, and the live schema additions were verified.

### Final Outcome

The rhythm selection page became compact and media-aware, creator media handling was hardened, important integration conflicts were resolved without discarding newer lifecycle logic, and live score persistence was repaired.

### Remaining Work

- Complete and commit any merge files still unresolved after the recorded controller repair.
- Verify `/api/stats` and saved score retries after deployment.
- Continue end-to-end testing with Cloudinary and generated MP4 media.

### Lesson

Merge resolution must preserve behaviour across both branches, not merely remove conflict markers. Live-data failures also require tracing the entire route, schema, and client path before changing UI fallbacks.

---

## 2026-07-15 — Studio Media Uploads, Transcription Guardrails, and Media Layout

### AI Tool Used

Codex.

### Objective

Resolve Studio upload and publish-state failures, stop unusable transcription output from becoming lyrics, and correct the public Song media layout without changing upload behaviour.

### Context

MP4 uploads produced backend errors or inactive buttons, some uploaded-file state was missing, and low-vocal audio caused the transcription model to echo its prompt. A separate layout issue allowed the Song video to overflow its media card.

### Prompt Summary

I asked Codex to trace the 500 errors, repair MP4 upload and active-state handling, preserve repeated choruses and ad-libs in genuine vocals, reject prompt-only transcription output, and constrain the actual Song video to a responsive media container.

### AI Output

Codex corrected Song, upload, transcription, schema, and error-handling paths; added the `audio_file_name` migration and schema/transcription regression tests; and aligned Studio, Dashboard, My Songs, score retry, and reflection rendering with the corrected data shapes.

The transcription prompt that could be echoed during silence or unclear audio was removed. Prompt-only output is now rejected with a clear “No usable vocals were detected” state, while genuine repetition and line structure remain allowed.

The Song media layout was then constrained to a responsive 16:9 card without altering uploaded-MP4 selection or playback behaviour.

### My Review and Decisions

I asked Codex to preserve genuine lyrical repetition but reject instructions masquerading as lyrics. I also separated layout correction from media logic so the visual fix would not disturb the upload path.

### Files Created

- `backend/migrations/010_song_audio_file_name.sql`
- `backend/tests/schemaService.test.js`
- `backend/tests/transcriptionService.test.js`

### Files Modified

- `backend/controllers/generationController.js`
- `backend/controllers/songController.js`
- `backend/routes/songs.js`
- `backend/routes/transcriptions.js`
- `backend/services/schemaService.js`
- `backend/services/transcriptionService.js`
- `frontend/src/components/studio/SongMediaUpload.jsx`
- `frontend/src/pages/Studio.jsx`
- `frontend/src/pages/CreatorSongs.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/App.css`

### Verification Performed

- The transcription-focused pass recorded twenty-nine tests passing and backend lint passing.
- The media-layout pass recorded ninety-three tests, lint, and the production build passing.
- Commit `adc8a0f` records the broader error corrections.

### Final Outcome

Studio media errors were hardened, unusable prompt-echo transcription no longer populates lyrics, and Song video remains contained in its responsive media card.

### Remaining Work

- Continue end-to-end MP4 upload and publish testing against deployed storage.
- Review low-confidence transcription with more real vocal samples.

### Lesson

Model output must be validated against failure patterns, not accepted because it is non-empty. Layout and media-state fixes should also be isolated so visual changes do not hide backend problems.

---

## 2026-07-16 — Post-Merge UI Restoration and Reflection Entry Flow

### AI Tool Used

Codex.

### Objective

Recover working creator and rhythm UI after a large merge removed styles and request wiring, then improve the direct path from Song content into reflection composition.

### Context

After the integration merge, Studio styling, generation polling authorization, creator Song details, Rhythm Hub layout, background controls, My Songs contrast, and navbar avatar styles were missing or broken.

### Prompt Summary

I asked Codex to find the lost branch designs, restore the broken pages without discarding merged functionality, fix the oversized profile icon, make the background choice a real toggle, and open Add Reflection automatically after the user selects Share Your Reflection.

### AI Output

Codex compared the current branch with the pre-merge history and restored missing Studio CSS, authenticated generation polling, creator Song detail loading, overlapping navigation fixes, My Songs contrast, the complete Rhythm Hub card layout, the segmented background toggle, and the registered navbar stylesheet.

The profile icon problem was traced to deletion of `Navbar.css`; restoring it recovered the circular avatar, cropping, account dropdown, hover state, and responsive menu. Reflection entry now uses `/reflections?compose=1`, opens the composer after data loads, removes the one-time query flag after opening, and retains the guest/login choice for unauthenticated visitors.

### My Review and Decisions

I asked Codex to recover the known working branch design instead of improvising replacements. I kept the reflection deep link one-time so dismissing the modal does not reopen it on every render.

### Files Created

- `frontend/src/game/songDetailsApi.test.js`
- restored `frontend/src/Navbar.css`

### Files Modified

- `frontend/src/App.css`
- `frontend/src/App.test.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/pages/GenerationProgress.jsx`
- `frontend/src/pages/ReflectionWall.jsx`
- `frontend/src/game/songDetailsApi.js`

### Verification Performed

- Rhythm Hub restoration recorded ninety-four frontend tests and the production build passing.
- The segmented toggle passed nine focused rhythm tests and the production build.
- Navbar restoration and the reflection deep-link change passed their recorded build and targeted lint checks.

### Final Outcome

The principal merge regressions were restored from verified branch history, the registered avatar and menus behaved normally, and Song-to-reflection navigation could open the composer directly.

### Remaining Work

- Continue visual review across all restored responsive widths.
- Finish any broader integration checks not covered by the focused restoration commits.

### Lesson

When a merge removes styling, the fastest reliable recovery is to compare against the last known working commit and restore complete selector groups rather than patch isolated symptoms.

---

## 2026-07-17 — Generation Recovery, Supabase Drafts, and Real Video Export

### AI Tool Used

Codex.

### Objective

Recover generation against Supabase, remove hardcoded video-export behaviour, and improve real Song media handoff across Studio, Video Editor, and Song Experience.

### Context

Generation drafts were not reliably reaching Supabase, generation and export still failed in later stages, and public/creator media pages could fall back to hardcoded video behaviour. A separate session also investigated OpenAI project quota configuration without changing or recording any secret values.

### Prompt Summary

I asked Codex to diagnose the failed generation path, confirm whether database data had been cleared, repair video export and media selection, and explain the remaining OpenAI quota response.

### AI Output

Codex updated database selection and schema handling so generation drafts could be sent to Supabase, repaired generation, introduced a shared custom video player, and aligned Studio, Video Editor, and Song Experience with real media URLs. The export path was changed to use generated or uploaded video rather than a hardcoded source.

The quota session distinguished application code from OpenAI project billing and advised testing the selected project directly. No API key was copied into the journal and no quota problem was falsely recorded as a code fix.

### My Review and Decisions

I asked whether the database had been wiped and required Codex to verify the data path before further changes. I kept the quota investigation separate from application fixes and did not record secret values.

### Files Created

- `frontend/src/components/shared/CustomVideoPlayer.jsx`

### Files Modified

- `backend/config/database.js`
- `backend/controllers/generationController.js`
- `backend/controllers/songController.js`
- `backend/services/aiScenePlanner.js`
- `backend/services/schemaService.js`
- `backend/services/transcriptionService.js`
- `backend/services/videoAssembler.js`
- `frontend/src/pages/SongExperience.jsx`
- `frontend/src/pages/Studio.jsx`
- `frontend/src/pages/VideoEditor.jsx`
- `frontend/src/components/SongCard.jsx`

### Verification Performed

- Commits `36d231f`, `3ee83be`, and `0709baf` record the Supabase draft, generation, and export corrections.
- The sessions did not record one final complete automated-suite total, so no broader test count is claimed here.

### Final Outcome

Generation drafts reached Supabase, generation recovered, and video playback/export moved toward real persisted Song media instead of hardcoded sources.

### Remaining Work

- Complete deployed generation and export testing.
- Resolve the external OpenAI project quota issue separately from the codebase.
- Finish the public creator-profile work that was started but not completed in the recorded session.

### Lesson

External quota failures and application defects can look identical in the UI. Database persistence, provider access, generation, upload, and export must be verified separately.

---

## 2026-07-20 — Rhythm Duration Formatting and Regression Follow-up Start

### AI Tool Used

Codex.

### Objective

Record the part of the 20 July session completed before the broader statistics, hold-note, and saved-date regression work was finalised on 21 July.

### Context

The user session began on 20 July and continued into the work later recorded and committed on 21 July. This entry includes only the distinct 20 July result so the next entry is not duplicated.

### Prompt Summary

I asked Codex to replace compact numeric Song duration such as `3:29` with a more readable minutes-and-seconds label while beginning investigation of live statistics and hold-note behaviour.

### AI Output

Codex changed Rhythm Hub duration presentation to wording such as `3 mins 29 secs` and updated the related frontend test. The broader statistics and hold-note corrections continued into the following dated entry.

### My Review and Decisions

I preferred a plain-language duration because it is easier to scan on the Song card than an unexplained compact timestamp.

### Files Created

No files were created.

### Files Modified

- `frontend/src/pages/RhythmHub.jsx`
- `frontend/src/App.test.jsx`

### Verification Performed

- Commit `d4bd1f6` records the duration-format change.
- The complete regression verification is recorded in the following 21 July entry and is not repeated here.

### Final Outcome

Rhythm Song cards display duration in readable minutes-and-seconds wording.

### Remaining Work

- Continue the live-statistics, hold-note, typography, and saved-date corrections completed on 21 July.

### Lesson

Even a small display change should be separated from a larger regression batch when the work crosses a date boundary, so the journal remains chronological without duplicating the final verification.

---

## 2026-07-21 — Landing Statistics, Rhythm Hold Notes, and Draft Timestamp Corrections

### AI Tool Used

AI-assisted coding workflow recorded in the shared journal; the specific AI tool was not named in that entry.

### Objective

Restore database-backed landing statistics, correct rhythm hold-note rendering and completion, standardise statistic typography, and include date and time in the Studio saved label.

### Context

Landing cards remained at zero, active hold notes disappeared after their lane was pressed, rhythm statistic values had inconsistent sizes, and Studio displayed only a saved time.

### Prompt Summary

I asked the AI-assisted workflow to restore database counts; keep hold notes visible and complete them when held through the end while preserving early-release scoring; use one statistic font size; include a readable saved date and time; and record the work.

### AI Output

The investigation traced the zero values to the existing statistics router not being mounted. `GET /api/stats` was restored using the existing service: Active Explorers counts `REGISTERED` users, Heritage Songs counts `PUBLISHED` Songs, and Stories Shared counts `APPROVED` reflections. Test database isolation was restored so `NODE_ENV=test` always uses SQLite.

A dedicated hold geometry helper now anchors a note in `holding` state to the hit line while its remaining body and tail stay visible. Holding through the end completes successfully; early release retains existing scoring. One `rhythm-stat-value` class now controls all live values, and Studio uses locale-aware medium date and short time styles.

### My Review and Decisions

I reused the existing statistics service, kept public counts restricted to registered, published, or approved records, anchored only actively held notes, preserved early-release rules, and required test isolation so automated tests cannot modify production Supabase data.

### Files Created

- `backend/tests/stats.test.js`
- `backend/tests/statsService.test.js`
- `frontend/src/game/rhythmRenderer.js`
- `frontend/src/pages/Landing.test.jsx`

### Files Modified

- `backend/config/database.js`
- `backend/server.js`
- `backend/tests/health.test.js`
- `frontend/src/App.css`
- `frontend/src/App.test.jsx`
- `frontend/src/components/RhythmGame.jsx`
- `frontend/src/components/RhythmGame.test.jsx`
- `frontend/src/pages/Studio.jsx`
- `AI_DEVELOPMENT_JOURNAL.md`

### Verification Performed

- Focused backend tests passed: three suites and seven tests.
- The complete backend suite passed: ten suites and eighty-nine tests.
- Focused frontend tests passed: three suites and thirty-three tests before the final hold integration case.
- The complete frontend suite passed: sixteen files and ninety-eight tests.
- Changed files passed ESLint, with one pre-existing Studio hook warning.
- The frontend build and `git diff --check` passed.

### Final Outcome

Landing statistics reflect database records, sustained hold notes remain visible and complete correctly, rhythm values share one typography rule, and the Studio saved label includes a locale-aware date and time.

### Remaining Work

- Deploy both applications and compare landing counts with Supabase.
- Manually play a full hold note using keyboard and touch controls.

### Lesson

Fallback data may indicate missing route mounting rather than a rendering bug. Canvas behaviour is easier to test when geometry is separated, and production-data safety must be enforced before backend tests run.

---

## 2026-07-21 — Registered Profile Redesign and MP4 Beatmap Compatibility

### AI Tool Used

Codex.

### Objective

Redesign the registered-user Profile around real memories and music activity, then ensure AI-generated or uploaded MP4 files can supply the duration and media required for beatmap generation.

### Context

The Profile page needed a responsive personal journey rather than placeholder content. Separately, Songs with an MP4 but no independent audio file could not generate beatmaps because duration and usable media-source data were missing.

### Prompt Summary

I asked Codex to implement the supplied scrapbook-style Profile design using real APIs, editable supported fields, partial-failure handling, theme persistence, responsive layouts, and existing navigation. I later asked it to fix beatmap generation for MP4 media produced by a teammate's AI video workflow.

### AI Output

Codex rebuilt Profile with independently loaded memories, badges, rhythm scores, statistics, profile editing, theme persistence, retries, empty states, skeletons, and accessible modals. It added authenticated name/email updates without inventing unavailable biography or avatar database fields, normalised API response naming, and used honest fallbacks for missing optional data.

For rhythm compatibility, MP4 uploads now persist duration and act as the audio source when no separate audio exists. Extracted YouTube audio carries its duration into the created Song, and regression tests prove that MP4-backed Songs can generate beatmaps.

### My Review and Decisions

I kept Profile within the existing registered navbar and limited edits to fields supported by the database. I accepted honest fallbacks rather than adding unsupported biography or avatar claims. For beatmaps, I treated persisted MP4 media as usable only when the backend stores the duration and source information required by generation.

### Files Created

- `frontend/src/components/profile/EditProfileModal.jsx`
- profile interaction and API regression tests recorded in commit `5dee53a`

### Files Modified

- `backend/routes/auth.js`
- `backend/services/authService.js`
- `backend/tests/authProfile.test.js`
- `backend/controllers/songController.js`
- `backend/tests/songLifecycle.test.js`
- `frontend/src/Profile.css`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/Profile.test.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/profile/ProfileHero.jsx`
- `frontend/src/components/profile/ProfileMemories.jsx`
- `frontend/src/components/profile/ProfileBadges.jsx`
- `frontend/src/components/profile/ProfileMusicJourney.jsx`
- `frontend/src/components/profile/ProfileStats.jsx`
- `frontend/src/pages/CreatorGenerationJobs.jsx`
- `frontend/src/pages/CreatorGenerationJobs.test.jsx`

### Verification Performed

- Profile verification recorded 101 frontend tests and 92 backend tests passing.
- The production build and targeted frontend/backend lint passed.
- Full-project lint remained blocked by unrelated pre-existing errors in three media components.
- MP4 beatmap verification recorded 93 backend tests and 102 frontend tests passing.

### Final Outcome

Registered users gained a responsive, API-backed Profile experience, and uploaded or generated MP4 media can now provide the duration and source needed for persistent beatmap generation.

### Remaining Work

- Add biography and avatar persistence only after supported backend fields are designed.
- Complete manual Profile checks at the recorded responsive widths.
- Verify MP4 beatmap generation in the deployed environment.

### Lesson

Frontend polish should not imply data capabilities the backend lacks. Media compatibility also depends on persisted metadata, not merely the presence of a playable URL.

---

## 2026-07-29 — Public Music Discovery, Multi-Creator Isolation, and Secure Account Onboarding

### AI Tool Used

Codex.

### Objective

Polish public music discovery, shift the platform from one original creator to multiple approved creators, and implement secure registration, verification, recovery, and creator-application workflows.

### Context

Separate Codex sessions on 29 July covered Landing and Songs Library visual refinement, then a repository-wide multi-creator isolation audit and authentication/onboarding implementation. Coursework sessions about Jupyter, Faker, and NLTK were unrelated and excluded.

### Prompt Summary

I asked Codex to preserve existing public data and routing while refining landing-page hierarchy, spacing, animation, guest-first loading, and the Songs Library. I then asked it to remove single-client assumptions, isolate creator-owned data, support approved creator applications, and implement secure email verification and password recovery without destructive production database actions.

### AI Output

Codex refined Landing and Songs Library into a denser, responsive music-discovery experience with improved section headers, links, cards, filtering, reveal motion, guest-first behaviour, and retained API logic. The public design work was committed as `51cf03a`; later Songs Library and creator-curation commits continued the same date's work.

The multi-creator audit introduced creator applications, folders, moderation/audit records, analytics events, ownership-scoped services and routes, admin workflows, and supporting migrations. Codex documented the isolation review rather than executing a production reset.

Authentication then gained one shared login, normal `REGISTERED` signup without client-selected roles, six-digit hashed OTP verification, forgot-password OTP, token revocation through `authVersion`, database-checked role and status, SMTP templates, private resume validation, creator-application review stages, and approval that upgrades the existing account instead of creating a duplicate. Apple login remained hidden because it was not implemented safely.

### My Review and Decisions

I kept the existing public architecture and asked for visual polish rather than replacement. For multi-creator work, I required isolation at database, backend, and frontend boundaries. I also required onboarding to preserve existing accounts, avoid destructive migrations, hide incomplete Apple login, and never expose account existence through recovery responses.

### Files Created

- multi-creator migrations 011 through 016
- `docs/MULTI_CREATOR_ISOLATION_AUDIT.md`
- `docs/AUTHENTICATION_SETUP.md`
- `backend/models/AuthOtp.js`
- `backend/services/otpService.js`
- `backend/services/emailService.js`
- authentication and onboarding test files
- creator application, admin, folder, analytics, and curation components and services recorded in the 29 July commits

### Files Modified

- `README.md`
- `Project Details/HIGH_LEVEL_DESIGN.md`
- `backend/routes/auth.js`
- `backend/routes/admin.js`
- `backend/routes/creatorApplications.js`
- `backend/middleware/auth.js`
- `backend/services/authService.js`
- `frontend/src/pages/Landing.jsx`
- `frontend/src/pages/SongsLibrary.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/pages/OtpVerification.jsx`
- `frontend/src/pages/ForgotPassword.jsx`
- `frontend/src/pages/ResetPassword.jsx`
- `frontend/src/pages/CreatorApplication.jsx`
- `frontend/src/pages/AdminApplications.jsx`

### Verification Performed

- Public discovery tests and the production build passed before commit `51cf03a`.
- Authentication verification recorded thirteen backend suites with 120 tests and nineteen frontend files with 115 tests passing.
- Backend and frontend lint, the frontend build, and `git diff --check` passed.
- Scans found no destructive SQL, hardcoded secrets, sensitive OTP/token logging, production schema sync, or automatic creator seeding.
- SMTP delivery was mocked; no real production email or migration was claimed.

### Final Outcome

Public discovery was polished without replacing its live data flow, while the project gained a substantially broader multi-creator and secure onboarding foundation with explicit non-destructive deployment steps.

### Remaining Work

- Apply migrations in order after a managed-database backup and staging review.
- Configure real SMTP secrets and verify delivery.
- Replace process-local rate limiting if multiple backend instances are used.
- Implement Apple login only with the required paid Apple configuration and secure account linking.

### Lesson

Multi-creator support is an authorization redesign, not a label change. Secure onboarding also requires verification, recovery privacy, revocation, rate limiting, and deployment discipline as one connected workflow.

---

## 2026-07-30 — Admin Moderation, OAuth, Creator Applications, and Separate Suspension States

### AI Tool Used

Codex.

### Objective

Consolidate the day's admin-dashboard, moderation, Google authentication, creator-application, and access-suspension work.

### Context

The admin interface needed a clearer information hierarchy, audit logs had to remain active without occupying primary navigation, pending creator moderation had to stay separate from platform reports, and suspending creator privileges should not remove normal registered-user access.

### Prompt Summary

I asked Codex to remove the obsolete Collections page, implement supported Google login without a fake Apple flow, refine the Admin Dashboard, move audit history to a secondary route without deleting records, limit Safety & Reports to real flagged cases and involved users, redesign creator applications, and separate whole-account suspension from creator-access suspension.

### AI Output

Codex removed the Collections route and navigation, added Google OAuth support through migration 017 and the existing authentication flow, and restored Song Experience instrument and trivia sections using explicit fallback data.

The admin interface kept Overview, Creators, Content, and Safety & Reports as primary sections. Audit history remains accessible through `/admin/activity`; Reports requests only `FLAGGED` cases; ordinary `PENDING` reflections remain in creator moderation; Users shows only accounts connected to moderation activity; and Warnings & Actions combines warning and suspension/restoration history.

The creator-application flow was refined, and migration 018 separated full account state from creator-access state. Creator-suspended users retain normal features but cannot use creator routes or APIs. Published Songs remain published unless an administrator explicitly unpublishes one with a reason. The implementation preserved ownership and records and added audit events.

### My Review and Decisions

I required audit logging to remain active even after removing it from primary navigation. I kept pending reflection review with creators rather than treating every pending post as an admin report. I also separated creator privileges from the underlying user account so creator suspension does not erase ordinary access or content ownership.

### Files Created

- `backend/migrations/017_oauth_identities.sql`
- `backend/migrations/018_separate_creator_access_status.sql`
- `frontend/src/components/AccountAccessSuspended.jsx`
- `frontend/src/components/CreatorAccessSuspended.jsx`
- creator-application presentation components and access-separation tests recorded in commit `107abcc`

### Files Modified

- `backend/routes/admin.js`
- `backend/routes/auth.js`
- `backend/routes/reflections.js`
- `backend/middleware/auth.js`
- `backend/services/oauthService.js`
- `frontend/src/layouts/AdminLayout.jsx`
- `frontend/src/pages/AdminCommunityPage.jsx`
- `frontend/src/pages/AdminActivityPage.jsx`
- `frontend/src/pages/CreatorApplication.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`

### Verification Performed

- Corrected admin moderation passed 132 frontend tests, 126 backend tests, frontend lint, the production build, and clean diff validation.
- Separate suspension passed fifteen backend suites with 136 tests and twenty-one frontend files with 137 tests.
- ESLint, the frontend build, and `git diff --check` passed.
- No database reset or record deletion was required.

### Final Outcome

Admin navigation and moderation responsibilities became clearer, Google login gained a real supported path, creator applications were refined, and creator privileges can now be suspended independently of normal user access.

### Remaining Work

- Apply migrations 017 and 018 in the required deployment order.
- Configure and verify Google OAuth deployment values.
- Continue manual admin and suspension testing with real creator accounts.

### Lesson

Platform moderation, creator moderation, audit history, account suspension, and creator-access suspension are distinct responsibilities and should not share one overloaded status or screen.

---

## 2026-07-31 — Creator/User Mode Switching and Shared Profile Settings

### AI Tool Used

Codex.

### Objective

Let approved creators switch between creator and normal-user interfaces without changing their database role, then unify user identity, public profiles, avatars, and settings.

### Context

Creators use one account but needed an explicit UI mode. Profile identity was duplicated across user and creator data, `/settings` was still a placeholder, and public user profiles and privacy-safe activity views were missing.

### Prompt Summary

I asked Codex to preserve the `CREATOR` role while switching UI modes, protect every creator route, respect both account and creator-access suspension, keep the existing purple creator profile, distinguish `/profile` from `/creator/profile`, add public user profiles, and replace placeholder settings with working shared account controls.

### AI Output

Codex added persisted `activeMode`, switch actions in both account menus, mode labels, and a dedicated `CreatorRoute`. Suspended creators remain able to use normal features but cannot enter creator mode or creator routes. Backend middleware and ownership queries remain authoritative and no role or database data changes during switching.

The profile/settings restructure made `/profile` the user's activity view and `/creator/profile` the creator portfolio. It added privacy-safe `/users/:userId` profiles, functional Profile, Account, Preferences, and Privacy settings, a shared `user_profiles` identity record, Cloudinary avatar upload/removal with validation, dense rhythm ranking, badge progression, and consistent avatar/name rendering across navigation and creator components. Private profiles return a non-revealing 404.

### My Review and Decisions

I kept role and mode separate: role is authorization, while mode is a frontend preference. I preserved the existing creator-profile design and moved shared identity into one record rather than maintaining duplicate names and avatars.

### Files Created

- `backend/migrations/019_creator_profiles.sql`
- `backend/migrations/020_user_profiles.sql`
- `backend/models/UserProfile.js`
- `backend/routes/users.js`
- `backend/services/userProfileService.js`
- `frontend/src/components/CreatorRoute.jsx`
- `frontend/src/pages/PublicUserProfile.jsx`
- `frontend/src/services/userProfileService.js`
- shared profile-system regression tests

### Files Modified

- `backend/models/CreatorProfile.js`
- `backend/routes/creators.js`
- `backend/routes/auth.js`
- `backend/controllers/songController.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/Settings.jsx`
- `frontend/src/pages/CreatorProfileSettings.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/CreatorAccountWidget.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/Profile.css`
- `frontend/src/Settings.css`

### Verification Performed

- Mode switching passed 136 backend tests, 141 frontend tests, thirty focused mode-switch tests, ESLint, and the production build.
- The shared profile/settings system passed 146 backend tests and 147 frontend tests.
- Backend and frontend lint and the production build passed.

### Final Outcome

Approved creators can switch presentation modes without weakening authorization, and shared identity, public user profiles, avatar handling, rankings, badges, and settings now use a coherent profile system.

### Remaining Work

- Apply migrations 019 and 020 in order.
- Add notifications, data export, account deletion, and verified email changing only when fully implemented.
- Consider signed media delivery if private avatars require access-controlled URLs.

### Lesson

Authorization role, creator-access status, and UI mode must remain separate. Shared identity should also have one source of truth so user and creator experiences cannot drift.

---

## 2026-08-01 — Route Connectivity, Rhythm Ranking, and Deployment Debugging

### AI Tool Used

Codex.

### Objective

Audit page connectivity across the application, make rhythm scores and rankings consistent, fix the remaining test failures, and diagnose deployed registration and Google sign-in problems.

### Context

Several Codex sessions on 1 August covered one connected quality pass. Creator routes and page layouts needed clearer navigation, rhythm results were not consistently saved or reflected on profiles, and the deployed application returned registration, CORS, and OAuth errors.

### Prompt Summary

I asked Codex to inventory every route and its navigation paths, standardise creator-page headers, keep the Studio header as the layout reference, remove the duplicated Total Plays navigation, and add recoverable route states. I then asked it to verify score persistence for registered users and creators, rank players fairly within the same song and difficulty, fix the remaining tests, and trace the deployed registration `503`, preview CORS failures, and Google origin mismatch.

### AI Output

Codex created a route inventory and Playwright coverage for guest, creator, and administrator journeys. It connected completed generation jobs to the editor, added invalid-ID recovery, made `/users/:userId` use the wide layout, retained `/creator/studio` as a legacy redirect, and redirected `/creator/plays` to `/creator/analytics` after I decided that Total Plays duplicated Analytics. Creator brand navigation and non-hero page headings were aligned with Studio.

The rhythm investigation found that creator accounts in user mode were blocked by a frontend role check and that profile data remained cached after successful submissions. Codex corrected score submission and refresh behaviour, added song/difficulty/time-period leaderboard filters, backend ranking and privacy-safe identity handling, result-to-leaderboard links, and profile best-rank details. It also stabilised authentication callbacks and separated Vitest unit-test discovery from Playwright tests.

For deployment, Codex traced the registration `503` to OTP email delivery rather than a Node crash, bounded SMTP timeouts, made password hashing asynchronous, added duplicate-submission protection, and broadened CORS only to the project team's Vercel preview pattern. I chose Brevo SMTP on port 2525 so the project could remain on Render's free tier. Registration then worked. Google sign-in was handled separately by adding exact authorised JavaScript origins because Google OAuth does not accept the backend CORS wildcard.

### My Review and Decisions

I removed the separate Total Plays item but retained its legacy redirect and the underlying analytics tracking. I required leaderboard comparisons to stay within one song and difficulty rather than comparing unrelated raw scores. For deployment, I rejected a paid Render upgrade and selected a compatible free SMTP relay. I also kept the stable production frontend as the preferred Google OAuth origin while allowing the current preview explicitly for testing.

### Files Created

- `docs/route-inventory.md`
- `docs/playwright-testing.md`
- `.github/workflows/frontend-e2e.yml`
- `frontend/playwright.config.js`
- Playwright route, link-integrity, mobile-refresh, and resilience specifications
- `backend/services/rhythmRankingService.js`
- `frontend/src/pages/RhythmLeaderboard.jsx`
- `frontend/src/pages/RhythmLeaderboard.css`
- `frontend/src/services/leaderboardService.js`
- route, sidebar, leaderboard, and score regression tests

### Files Modified

- `backend/routes/scores.js`
- `backend/routes/reflections.js`
- `backend/routes/auth.js`
- `backend/server.js`
- `backend/services/authService.js`
- `backend/services/emailService.js`
- `backend/services/otpService.js`
- `backend/.env.example`
- `frontend/src/App.jsx`
- `frontend/src/App.css`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/pages/RhythmHub.jsx`
- `frontend/src/pages/RhythmResults.jsx`
- `frontend/src/pages/CreatorAnalytics.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/vite.config.js`
- `README.md`
- `docs/AUTHENTICATION_SETUP.md`

### Verification Performed

- The route audit passed the production build and fifteen Playwright tests.
- Score persistence checks recorded twelve backend tests, ten submission/results tests, five public-profile privacy tests, and four profile UI tests passing.
- The leaderboard API regression suite recorded eleven score tests passing, with frontend and backend lint and the production build also passing.
- The final test-repair session reported all requested suites passing without deleting, skipping, or weakening tests.
- CORS and health checks passed seven tests; matching project previews returned the expected preflight response while a different Vercel team remained rejected.
- The user confirmed that registration worked after the SMTP configuration change.
- No database reset, reseed, schema change, or Supabase action was performed for these fixes.

### Final Outcome

Routes became auditable and recoverable, creator navigation and headings became consistent, rhythm results now feed profiles and fair leaderboards, and deployed registration worked using the selected free SMTP configuration.

### Remaining Work

- Verify Google sign-in after the authorised-origin configuration has propagated.
- Prefer the stable production Vercel URL because newly generated preview hashes require separate Google authorisation.
- Retain the existing bundle-size and dependency-audit findings as separate maintenance work.

### Lesson

Navigation quality requires both route coverage and recoverable states. Deployment failures also need each layer separated: application response handling, CORS, SMTP transport, and OAuth origin rules can fail independently.

---

## 2026-08-02 — Safe Violet Integration and Authentication Hardening

### AI Tool Used

Codex.

### Objective

Compare the Violet task branch with `main`, preserve its useful ideas without importing destructive or incompatible code, and integrate secure registration, session handling, UUID validation, and profile settings on a clean branch.

### Context

The remote Violet branch ended at `2e9913c`, while the local branch contained the unpushed destructive revert `aaac598`. Directly merging the local branch would have removed large portions of the current project. The integration therefore required a read-only safety audit before any implementation.

### Prompt Summary

I first asked Codex to compare `main`, the remote Violet branch, and the local Violet branch and record all differences. I then approved a phased process: preserve the dangerous local commit with a backup pointer, create a clean integration branch from `main`, integrate registration only, fix malformed UUID handling, integrate login/session improvements, add profile bio and interest settings, and finish with a regression and security review.

### AI Output

Codex confirmed that `aaac598` was local and unpushed, created `backup/violet-task-4-destructive-revert`, and created `integration/violet-registration-main-c16f59a` from the approved `main` baseline. It found that Violet's Landing and Songs Library matched `main`, so no unnecessary replacement was performed.

The phased implementation added secure registration validation and database-backed OTP verification, hardened login and corrupted-session recovery, preserved requested routes, and rejected Violet's duplicate auth router, conflicting storage keys, in-memory OTPs, immediate authentication of unverified accounts, and account-enumerating availability checks. A malformed `song-1` route exposed PostgreSQL UUID errors, so reusable validation was added before analytics, song, and beatmap queries.

Profile settings retained the existing `UserProfile` and avatar architecture. Codex added an additive interest-tag migration, canonical server-validated tags, optional bio handling, responsive settings navigation, and immediate context/cache synchronisation. The final review found and fixed normalised duplicate tags and additional auth-routing and external UUID gaps. The work was committed as four focused commits followed by the reviewed integration fix and merged through PR #30.

### My Review and Decisions

I required `main` to remain authoritative and Violet to be treated only as a source of compatible ideas. I preserved the dangerous commit through a backup branch rather than deleting history. I postponed 2FA, writable email, account deletion, data export, and any control without a complete backend. I also kept production test placeholders such as `song-1` where they were isolated mocks, while ensuring malformed runtime IDs are rejected before database queries.

### Files Created

- `frontend/src/components/PasswordToggle.jsx`
- `frontend/src/context/AuthSession.test.jsx`
- `backend/middleware/validateUuid.js`
- `backend/migrations/021_user_profile_interest_tags.sql`
- `backend/services/profileInterests.js`
- `frontend/src/components/InterestTagsAccordion.jsx`
- `frontend/src/components/SettingsNav.jsx`
- `frontend/src/data/profileInterests.js`

### Files Modified

- `backend/routes/auth.js`
- `backend/routes/analytics.js`
- `backend/routes/beatmaps.js`
- `backend/routes/songs.js`
- `backend/routes/users.js`
- `backend/models/UserProfile.js`
- `backend/services/authService.js`
- `backend/services/userProfileService.js`
- `frontend/src/App.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/context/SessionContext.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/pages/OtpVerification.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Settings.jsx`
- `frontend/src/Settings.css`
- `frontend/src/Profile.css`
- associated backend and frontend tests

### Verification Performed

- Registration integration recorded ten frontend authentication tests and twenty-two backend registration/OTP tests passing.
- UUID validation recorded forty-four analytics/song lifecycle tests, thirty-two beatmap/score tests, and eighteen frontend rhythm/service tests passing.
- Login and session hardening recorded fifty-one frontend tests and twenty-seven backend tests passing.
- Profile/settings verification recorded seventeen backend suites with 168 tests and twenty-eight frontend files with 174 tests passing before final review.
- The final integration review recorded seventeen backend suites with 171 tests, twenty-eight frontend files with 176 tests, and fifteen Playwright tests passing.
- The production build, targeted lint, backend syntax checks, vocabulary parity, and diff validation passed.
- No existing migration was rewritten and no database reset, truncation, recreation, or reseed was performed.

### Final Outcome

Selected Violet ideas were integrated onto the current architecture without importing the destructive revert or obsolete authentication system. The resulting branch added secure onboarding, session recovery, UUID protection, and coherent profile settings while preserving `main`.

### Remaining Work

- Apply migration 021 once after the normal managed PostgreSQL backup.
- Deploy the backend and frontend together so interest-tag serialization and UI vocabulary remain aligned.
- Implement postponed security/account features only as complete database-backed workflows.

### Lesson

A feature branch is not automatically a safe source of code. Comparing ancestry, preserving dangerous commits, and integrating in small tested phases made it possible to recover useful ideas without replaying destructive history.

---

## 2026-08-03 — Rhythm Guest Claims, Reflection Discussions, and Admin Safety Workflows

### AI Tool Used

Codex.

### Objective

Improve the rhythm-game discovery and results journey, let guests securely claim a completed score after authentication, add Reflection Wall discussions, and refine administrator content and safety workflows.

### Context

Four Codex sessions on 3 August covered public rhythm pages, registration return handling, community discussions, and incremental admin-dashboard work. The changes had to preserve the existing dark-purple design, current authentication architecture, creator ownership, and production data.

### Prompt Summary

I asked Codex to improve song selection and result messaging without redesigning the interface, remove repeated guest warnings, preserve a guest result through login or registration, and show the user's best rhythm history. I then requested Padlet-style reflection discussions and a staged admin refinement covering authoritative counts, accessible charts and motion, creator applications, content review, Safety & Reports, user-facing warnings, and the acknowledged-warning lifecycle.

### AI Output

Codex added rhythm search, filters, sorting, progress summaries, personal bests, clearer artist-versus-creator identity, responsive result presentation, and positive guest messaging. Guest results became short-lived `sessionStorage` claims with a UUID, validated internal return path, server-side validation, and database idempotency through migration 022. A registration redirect race was found and fixed so the claim survives OTP verification, page refresh, and auth hydration; failed claims remain retryable and successful claims refresh profile data. Profiles now show up to three valid personal bests.

Reflection Wall gained a responsive, keyboard-accessible discussion modal, comments, likes, counts, sorting, anonymous-identity protection, validation, profanity filtering, rate limiting, and authorised deletion. Migration 023 added the discussion records and indexes without changing existing reflection data.

The admin work replaced tab-array counts with authoritative database counts, added an accessible listening chart and clearer Overview hierarchy, improved application and content review, and based Safety & Reports on actual flagged reflections rather than unsupported report concepts. Migration 025 added user safety notifications and required an enum-safe correction after PostgreSQL rejected `ACKNOWLEDGED`. The final warning lifecycle treats only `ACTIVE` warnings as urgent; `ACKNOWLEDGED`, `RESOLVED`, and `WITHDRAWN` remain visible history with explicit state-aware actions and notifications.

### My Review and Decisions

I kept one welcoming guest notice rather than repeating warnings on every song card. I required claim ownership to come from authentication and duplicate submissions to be safe. I preserved anonymous reflections without exposing user IDs. For admin work, I required real database-backed cases and kept member suspension separate from creator-access suspension. I also required acknowledged warnings to leave the Overview attention count without being deleted from history.

### Files Created

- `backend/migrations/022_guest_score_claim_id.sql`
- `frontend/src/pages/RhythmScoreClaim.jsx`
- `frontend/src/services/pendingScoreClaim.js`
- `frontend/src/services/safeReturnPath.js`
- guest-claim and protected-route tests
- `backend/migrations/023_reflection_discussions.sql`
- `backend/models/ReflectionComment.js`
- `backend/models/ReflectionLike.js`
- `backend/services/commentContentService.js`
- `frontend/src/components/ReflectionDiscussionModal.jsx`
- reflection discussion tests
- `backend/migrations/024_admin_summary_indexes.sql`
- `backend/migrations/025_user_safety_notifications.sql`
- `backend/models/ModerationFlag.js`
- `backend/models/Notification.js`
- `backend/routes/safety.js`
- admin summary, chart, moderation, safety, and user-status components, services, and tests

### Files Modified

- `backend/models/GameScore.js`
- `backend/routes/scores.js`
- `backend/routes/reflections.js`
- `backend/routes/admin.js`
- `backend/routes/auth.js`
- `backend/services/rhythmRankingService.js`
- `frontend/src/App.jsx`
- `frontend/src/App.css`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/pages/RhythmHub.jsx`
- `frontend/src/pages/RhythmResults.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/pages/OtpVerification.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/ReflectionWall.jsx`
- `frontend/src/pages/AdminOverview.jsx`
- `frontend/src/pages/AdminCommunityPage.jsx`
- `frontend/src/pages/AdminContentPage.jsx`
- `frontend/src/pages/AdminCreatorsPage.jsx`
- `frontend/src/pages/SafetyAccountStatus.jsx`
- associated services, styles, and tests

### Verification Performed

- Initial rhythm improvements recorded twenty-one frontend rhythm/integration tests and fifty-three backend song/score tests passing; the production build and changed-file lint passed.
- The secure guest claim flow recorded 176 backend tests and fifty-five focused frontend tests passing. Its registration fix then recorded sixty-six relevant frontend tests and twenty-five backend claim tests passing.
- Reflection discussions recorded seventeen backend suites with 182 tests, twenty new backend reflection tests, four frontend unit tests, and one mobile Playwright test passing.
- Admin regression comparisons showed that the observed failures existed before the admin task or were load-sensitive; no motion-task regression was found.
- The final warning-lifecycle work recorded 205 backend tests passing, with backend/frontend lint, the production build, and diff validation passing.
- The full frontend result was 255 of 262 passing; the remaining seven belonged to previously documented claim, reflection-moderation, and App test groups rather than the warning work.
- No production database migration was applied automatically and no reset or reseed was performed.

### Final Outcome

The rhythm journey became clearer and safer for both guests and authenticated users, Reflection Wall became a discussion space, and administrator workflows gained authoritative counts, evidence-based moderation, user notifications, and a coherent warning lifecycle.

### Remaining Work

- Apply migrations 022, 023, 024, and 025 in order after a managed-database backup.
- Complete manual responsive visual checks where the in-app browser was unavailable.
- Continue addressing the seven documented frontend baseline failures separately.
- Treat client-originated gameplay results as validated but not cryptographically proven until a server-issued gameplay token exists.

### Lesson

Cross-page workflows fail at boundaries: guest state, authentication redirects, database idempotency, and cached profiles must agree. Moderation state also needs explicit meanings so history, urgent attention, and access control are not conflated.

---

## 2026-08-05 — Documentation Reorganisation and Temporary File Cleanup

### AI Tool Used

Codex.

### Objective

Confirm which temporary repository files were safe to remove and choose an accurate commit message for the documentation cleanup.

### Context

The repository contained root-level journal and documentation files alongside temporary Video Editor comparison files and generated audio outputs. I asked Codex to review the change set before committing it.

### Prompt Summary

I asked whether the listed files were safe to remove and what the cleanup commit should be named.

### AI Output

Codex identified the intended operation as moving four Markdown documents into `docs/` and deleting temporary JSX and audio files. It advised staging the complete change set so Git could recognise the documentation changes as moves and suggested the commit message `chore: organize docs and remove temporary files`.

### My Review and Decisions

I accepted the focused repository-hygiene scope: preserve the documentation by moving it rather than deleting it, and remove only the identified temporary comparison and generated-output files.

### Files Created

None.

### Files Modified

- `AI_DEVELOPMENT_JOURNAL.md` moved to `docs/AI_DEVELOPMENT_JOURNAL.md`
- `Base.md` moved to `docs/Base.md`
- `Creator_workflow.md` moved to `docs/Creator_workflow.md`
- `ferlyn_journal.md` moved to `docs/ferlyn_journal.md`
- five temporary Video Editor JSX files removed
- `test_output.m4a` and `test_output2.m4a` removed

### Verification Performed

- The completed change was recorded in commit `08a7837` with the suggested message.
- Git recorded the four documentation files as moves into `docs/`.

### Final Outcome

The project documentation was consolidated under `docs/`, and temporary comparison and generated audio files were removed from the repository.

### Remaining Work

None recorded for this cleanup.

### Lesson

Reviewing the complete staged set before committing helps Git preserve file history and prevents temporary development artefacts from being mistaken for project source files.

---

## 2026-08-06 — Branch Recovery, Creator Route Removal, and Merge Repair

### AI Tool Used

Codex.

### Objective

Recover valid Public Task 1 and Violet work without overwriting `main`, remove obsolete creator Collections and Analytics pages, fix the resulting frontend failures, and resolve the remaining integration conflict and CSS syntax error.

### Context

Pulling and merging appeared to delete unrelated files because two feature branches contained destructive revert commits. Separate sessions then covered a safe reconstruction of Public Task 1, a review of Violet Task 4, requested creator-route removal, test repair, a conflict in the analytics route, and an unclosed CSS media query.

### Prompt Summary

I asked Codex to compare the Public 1, Violet 4, and `main` branches, prove whether earlier work had already merged, simulate the unsafe merge, reconstruct a safe combined branch, fix its extra regressions, and advise on the pull request. I then asked it to remove creator-side Collections and Analytics, fix all reported errors, create focused commits, resolve the integration conflict with `main`, and repair the CSS build error.

### AI Output

Codex identified `098ee01` and `aaac598` as destructive reverts rather than ordinary pull behaviour. A dry merge showed that Public 1 would fast-forward and intentionally remove thousands of lines, so `main` was left unchanged. Codex created `integration/public-task-1-preserve-main`, replayed valid Public Task 1 functionality on top of current `main`, produced `PUBLIC_TASK_1_SAFE_INTEGRATION_REPORT.md`, and fixed the integration-only Landing regressions in commit `98a3374`. It verified that Violet's valid ideas were already represented in `main`, aborted replay of obsolete authentication code, and documented that decision in `VIOLET_TASK_4_INTEGRATION_REPORT.md` at `cf60da5`.

The creator cleanup removed Collections, Analytics, and the legacy Total Plays page, plus their routes, navigation, shortcuts, service methods, mocks, and route-inventory references, while preserving analytics event tracking and public/admin collection behaviour. Codex then fixed authentication validation lint, stale tests, rhythm-duration formatting, and incorrect pending-score-claim clearing, creating commits `5ee75b4` and `f1796eb`.

The later merge conflict was isolated to `backend/routes/analytics.js`. The resolution preserved both creator analytics summaries and song-exploration badge awarding inside the transaction, producing merge commit `21965b6`. Finally, an unclosed desktop media query in `frontend/src/App.css` was repaired and recorded as `8d9e7fc`.

### My Review and Decisions

I did not accept a fast-forward merely because Git reported no conflict; the file-level effect had to preserve both feature and `main` work. I approved the clean reconstruction branch and required its extra failures to be reduced to `main`'s known baseline before it was considered safe. I accepted that Violet needed no code replay because its useful work already had newer implementations. I also explicitly requested the creator Collections and Analytics removal while preserving unrelated public/admin behaviour and backend tracking.

### Files Created

- `PUBLIC_TASK_1_SAFE_INTEGRATION_REPORT.md`
- `VIOLET_TASK_4_INTEGRATION_REPORT.md`

### Files Modified

- Public Task 1 song bookmark, reporting, Songs Library, Landing, moderation, model, migration, service, and test files recorded in the integration report
- `docs/route-inventory.md`
- `frontend/src/App.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/components/studio/CreatorSidebar.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/CreatorAnalytics.jsx` removed
- `frontend/src/pages/CreatorFolders.jsx` removed
- `frontend/src/pages/TotalPlays.jsx` removed
- `frontend/src/pages/RhythmHub.jsx`
- `frontend/src/services/pendingScoreClaim.js`
- authentication and profile test files
- `backend/routes/analytics.js`
- `frontend/src/App.css`

### Verification Performed

- The safe Public Task 1 reconstruction deleted no `main` files and initially passed the production build, thirty public backend tests, and fourteen Songs Library tests.
- After regression repair, the integration branch recorded 263 frontend tests passing with the same eleven known failures as `main`; seventeen targeted Landing/Songs tests, the build, and changed-file lint passed.
- Creator-route removal passed the production build, changed-file lint, and relevant route, dashboard, and sidebar tests.
- The following fix commit recorded frontend lint, 276 unit tests, the production build, and diff validation passing.
- The analytics merge resolution passed lint and twenty-five analytics tests with no conflict markers or unmerged entries.
- The final CSS fix passed the production build; only the existing bundle-size warning remained.

### Final Outcome

Public Task 1 was recovered on a safe integration branch without deleting `main` files, obsolete Violet code was not replayed, creator Collections and Analytics were removed as requested, frontend validation returned to green, the analytics conflict preserved both behaviours, and the CSS build error was fixed.

### Remaining Work

- Push and review the safe integration branch through a pull request rather than merging either destructive original branch.
- Apply any migrations included by the resulting pull request in the documented deployment order.
- Keep the audit reports with the integration history for future branch recovery.

### Lesson

A conflict-free merge can still be destructive when the incoming commit intentionally deletes files. Tree and ancestry audits, dry merges, baseline comparisons, and focused integration branches provide stronger evidence of safety than Git's conflict count alone.

---

## 2026-08-07 — DeepSeek Song Sections and Formatted Studio Lyrics

### AI Tool Used

Codex.

### Objective

Evaluate whether DeepSeek could replace the existing OpenAI models, then use it specifically for Creator Studio lyric-section recommendations and rhythm beatmap generation while retaining a suitable transcription provider.

### Context

The project used separate AI paths for beatmap generation, audio transcription, and video scene planning. I wanted to reduce the relevant GPT usage but later narrowed the task to lyrics and section labels in Creator Studio rather than changing the video planner.

### Prompt Summary

I first asked Codex how to replace the OpenAI model used for beatmap and song extraction with DeepSeek V4 Pro. After the provider audit, I instructed it to ignore video-planner and lyric-stanza scene work, focus on section extraction for the Creator Studio lyrics page, update the displayed lyrics after labels were extracted or edited, and propagate the formatted lyrics anywhere song details are shown.

### AI Output

Codex found that beatmaps and scene planning used text-generation models, while transcription used OpenAI Whisper's audio endpoint. It advised that DeepSeek could replace text generation but not the timestamped audio transcription path. The implementation therefore separated the providers: Whisper remains responsible for transcription, and DeepSeek produces editable song-section recommendations and rhythm beatmaps. Strict JSON parsing, validation, and one controlled retry were added for structured DeepSeek responses.

The backend gained owner-only song-section APIs and persistence through migration 028. The Studio gained an editable section card, protected confirmed edits from accidental regeneration, and passed confirmed sections into beatmap generation. After my follow-up, section extraction and editing also rebuild `rawLyrics` with labels such as `[Verse 1]` and `[Chorus 1]`. The formatted lyrics update immediately in Studio and are returned consistently by Studio, My Songs, public song-detail, and game-detail APIs. Video-planner GPT-4o usage was left unchanged as requested.

The session's direct push attempt stopped because the GitHub CLI authentication had expired and local `main` was behind the remote. Git history later records the feature in commit `2f2cb68`, created shortly after midnight on 8 August.

### My Review and Decisions

I narrowed the scope after the initial model audit and explicitly excluded the video scene planner. I accepted a mixed-provider design because DeepSeek did not provide the timestamped audio-transcription endpoint needed by the current workflow. I also required saved section edits to become the visible lyrics everywhere rather than remaining isolated recommendation metadata.

### Files Created

- `backend/controllers/songSectionsController.js`
- `backend/migrations/028_song_section_recommendations.sql`
- `backend/services/deepseekClient.js`
- `backend/services/deepseekJsonService.js`
- `backend/services/songSectionService.js`
- `backend/services/whisperClient.js`
- `backend/tests/providerClients.test.js`
- `backend/tests/songSectionService.test.js`
- `backend/tests/songSections.test.js`
- `frontend/src/components/studio/SongSectionsCard.jsx`
- `frontend/src/components/studio/SongSectionsCard.test.jsx`

### Files Modified

- `README.md`
- `backend/.env.example`
- `backend/controllers/songController.js`
- `backend/models/Song.js`
- `backend/routes/songs.js`
- `backend/routes/transcriptions.js`
- `backend/services/beatmapGenerator.js`
- `backend/services/schemaService.js`
- `backend/services/transcriptionService.js`
- `backend/tests/beatmaps.test.js`
- `backend/tests/transcriptionService.test.js`
- `frontend/src/App.css`
- `frontend/src/components/studio/LyricsCard.jsx`
- `frontend/src/pages/Studio.jsx`
- `frontend/src/services/songService.js`

### Verification Performed

- The provider and section implementation recorded forty-three focused backend tests and eight frontend section/beatmap tests passing.
- Frontend lint and the production build passed.
- No paid provider requests were made because the AI providers were mocked in tests.
- The formatted-lyrics follow-up recorded thirty-seven relevant backend tests and three frontend component tests passing, together with frontend lint and the production build.
- The full backend run still had two unrelated stale badge-count assertions, and four existing frontend App tests failed during authentication/profile refresh.
- The unrelated image file identified during the session was not modified by Codex.

### Final Outcome

Creator Studio gained persisted, editable DeepSeek song-section recommendations and consistently formatted lyrics, while Whisper remained responsible for timestamped transcription and the unrelated video-planner path stayed unchanged.

### Remaining Work

- Configure the separate OpenAI transcription and DeepSeek environment variables in deployment.
- Apply migration 028 through the project's managed migration process.
- Restart or redeploy the backend and verify the workflow with a real uploaded song.
- Resolve the unrelated baseline test failures separately.

### Lesson

Replacing an AI model requires tracing each task to its actual modality and API contract. A text-generation provider can improve structured lyric analysis without being a valid substitute for timestamped speech-to-text.

---

## 2026-08-08 — Song Library Filter Repair and Documentation Audit

### AI Tool Used

Codex.

### Objective

Fix the Song Library filter control overlap, then reorganise and update the project documentation while preserving original document structures, implementation accuracy, and evidence-based team attribution.

### Context

One Codex session addressed a visible filter-bar layering problem. A separate documentation session inspected the current repository, moved related documents into a clearer hierarchy, updated major project records, and added migration ownership headers. The first documentation revision changed some original formats too heavily, so I directed Codex to retrieve the pre-edit versions from Git and correct the work in place.

### Prompt Summary

I asked Codex to place the filter menu beside the sort arrows and confirm that its functions still worked. For documentation, I requested a repository-wide audit based on current frontend, backend, migrations, and Git history; safe file moves; updates to design, implementation, use-case, and ownership records; a database schema overview; and evidence-based migration headers without changing executable SQL.

After reviewing the first result, I told Codex that I needed the Markdown files actually corrected to their original heading hierarchy, sequence, tables, templates, terminology, diagrams, and writing style rather than replaced by new summary reports. I then required use cases to be grouped by actor or functional domain, separated legacy allocation from actual cross-feature contributions, and corrected the final draft again so old use-case identifiers were not reused for replacement scopes. I also returned the `Solitice-debug` identity mapping and migration 028 ownership to `Needs team confirmation` because the evidence was not sufficient.

### AI Output

Codex fixed the filter bar so the sort selector, direction arrows, and functional clear button sit together without layering, while preserving responsive menu behaviour.

For documentation, Codex moved tracked files with Git history preserved, added central documentation, journal, and archive indexes, created a schema overview and current use-case specification, and added concise ownership headers to thirty-three migrations without changing their SQL bodies. It identified model/migration differences, duplicate migration prefixes, legacy fields, and other schema risks rather than modifying the database to hide them.

In response to my correction, Codex retrieved the original High-Level Design, implementation plan, ownership document, use-case documents, authentication guide, and frontend README from their historical paths. It restored their original structures while placing current facts inside the appropriate sections. The use-case allocation was then changed from exclusive member groups to functional domains and an evidence-based contribution matrix. The final correction restored or deprecated the original UC-05, UC-08, and UC-10 through UC-16 meanings, introduced separate current-scope IDs, shortened clipped tables, removed low-contrast inline code from table cells, and linked detailed architecture and schema information to their dedicated documents.

### My Review and Decisions

I rejected the first documentation result as too much of a generated replacement and required the lecturer-facing original formats to remain authoritative. I also rejected an artificially exclusive ownership model because Git and journal evidence showed cross-feature contributions. When interim attribution assigned migration 028 to Lia and treated `Solitice-debug` as Ferlyn, I reviewed the uncertainty and directed both back to `Needs team confirmation`. I prohibited further moves, commits, pushes, deletion, resets, or migration behaviour changes during the corrective pass.

### Files Created

- `docs/README.md`
- `docs/journals/README.md`
- `docs/archive/README.md`
- `docs/project/DATABASE_SCHEMA_OVERVIEW.md`
- `docs/project/USE_CASE_SPECIFICATION.md`

### Files Modified

- `frontend/src/components/FilterBar.jsx`
- `frontend/src/SongsLibrary.css`
- `README.md`
- `frontend/README.md`
- `docs/project/HIGH_LEVEL_DESIGN.md`
- `docs/project/PROJECT_IMPLEMENTATION_PHASE.md`
- `docs/project/OWNERSHIP_SPECIFICATION.md`
- `docs/guides/AUTHENTICATION_SETUP.md`
- `docs/reference/ROUTE_INVENTORY.md`
- documentation and journal paths moved under the current `docs/` hierarchy
- all thirty-three migration files received attribution headers only
- `backend/migrations/028_song_section_recommendations.sql` ownership header was returned to `Needs team confirmation`

### Verification Performed

- Song Library tests recorded fourteen of fourteen passing; frontend lint and the production build passed.
- Local Markdown links and the old active-path scan passed.
- Executable SQL comparison confirmed that the bodies of all thirty-three migrations were unchanged.
- The schema overview covered all thirty-five Sequelize model tables.
- The frontend production build passed. Playwright reported sixteen tests passing but timed out during shutdown after 180 seconds.
- Backend tests recorded 254 passing with four existing badge/profile/stat expectation failures. Frontend tests recorded 283 passing with eight existing authentication-refresh failures.
- Lint reported one existing unused variable in `emailChangeAndAccountDeletion.test.js`.
- The final use-case validation recorded thirty-nine unique use cases, thirty-nine matching allocation rows, complete templates, no broken links or trailing whitespace, and a maximum table-line length of 132 characters.
- Diff validation passed, and no documentation-session commit or push was performed.

### Final Outcome

The Song Library filter controls no longer overlap. Project documentation is now organised under a clearer hierarchy, but its principal documents again follow their original approved structures while reflecting current implementation facts, schema risks, cross-feature contributions, and unresolved attribution honestly.

### Remaining Work

- Obtain team confirmation for the `Solitice-debug` identity, migration 028, creator applications, administrator features, folders, and deployment ownership.
- Decide whether ignored backup patch artefacts are required as submission evidence.
- Complete production-dependent smoke testing and address the recorded baseline test failures separately.
- Review and commit the documentation work in focused groups only after the team approves the unresolved ownership decisions.

### Lesson

Accurate documentation is not only about current facts; its established structure is part of the assessment evidence. AI can accelerate repository comparison, but human review must correct over-redesign, reused identifiers, overconfident attribution, and ownership models that erase shared contributions.
