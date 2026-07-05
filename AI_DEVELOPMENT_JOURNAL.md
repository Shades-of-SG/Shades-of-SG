# Shades of SG - AI Development Journal

## Purpose

This document records significant AI-assisted development activities throughout the project.

The objective is to provide:

* Transparency
* Traceability
* Evidence of human oversight
* Evidence of iterative improvement

This document should be updated whenever AI contributes to architecture, design, implementation, debugging, testing, or documentation.

---

# Entry Template

## Date

YYYY-MM-DD

## Feature

Feature name

## AI Tool Used

Examples:

* Codex
* ChatGPT
* Claude
* Gemini

## Objective

What problem was being solved?

## Prompt Summary

High-level summary of prompt provided to AI.

Do NOT need entire chat history.

Example:

"Generate React component structure for reflection wall with CRUD support."

## AI Output Summary

What did the AI generate?

Examples:

* Component scaffold
* API endpoints
* Database schema
* Test cases
* UI layout
* Refactoring suggestions

## Human Review

Was the output accepted?

* Fully accepted
* Partially accepted
* Rejected

## Human Modifications

Describe changes made after AI generation.

Example:

* Added moderation status.
* Removed redundant API call.
* Simplified state management.

## Final Outcome

Short summary of final implemented solution.

---

# Project Entries

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

Ferlyn provided the feature direction in several stages:

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

Ferlyn approved the overall direction but repeatedly corrected the implementation details so that the feature matched the intended Rhythm Plus style and the Shades of SG project flow. The final result was shaped by both AI implementation and human design review.

### Human Modifications and Inputs

Ferlyn's inputs directly changed the feature direction in the following ways:

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

Ferlyn provided the `Base.md` specification and requested the whole responsive webapp base layout for:

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

Ferlyn corrected the workflow by reminding Codex that the edits also needed to be recorded in the AI development journal.

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

Ferlyn requested a Padlet-like Reflection Wall based on a visual reference and hand-drawn layout sketch.

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

Ferlyn provided the visual reference and clarified the interaction requirement for the add-post component.

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

Ferlyn added `SEED_CREATOR_EMAIL` and `SEED_CREATOR_PASSWORD` to `backend/.env` and asked how to route that account into the creator side pages.

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

Ferlyn provided the seed environment variables and requested the connection to the creator side.

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

Ferlyn noticed that clicking `Songs` from the creator account redirected to the public `/songs` page and requested that the creator view should stay fully creator-only instead of jumping between public and creator layouts.

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

Ferlyn identified the issue by testing the creator account flow in the browser.

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

# AI Usage Summary

## Architecture

AI-Assisted

Human-Reviewed

## Database Design

AI-Assisted

Human-Modified

## Frontend Development

AI-Assisted

Human-Reviewed

## Backend Development

AI-Assisted

Human-Reviewed

## Testing

AI-Assisted

Human-Reviewed

## Documentation

AI-Assisted

Human-Reviewed

---

# Reflection

## What AI Did Well

AI helped turn a broad feature idea into a working rhythm game implementation quickly. It translated Ferlyn's tickets into concrete frontend components, backend routes, beatmap files, result calculations, and UI states.

AI was also useful for iteration. When Ferlyn pointed out layout and readability issues, AI refactored the gameplay page into clearer layers, improved the video overlay, separated controls from the gameplay board, and made the Results page feel more connected to Shades of SG.

AI also helped keep the work traceable by running linting, tests, builds, and route checks after implementation.

## What AI Did Poorly

The first rhythm game layouts were too close to a generic web game and not close enough to the Rhythm Plus reference. The play button, ready text, controls, and board layout needed human correction before the page felt usable.

The first video background attempt also needed refinement because the video distracted from gameplay. Ferlyn had to clarify that the video should stay visible but must not reduce note readability.

The current beatmap is still manual demo data. AI did not implement real audio analysis or automatic note generation from the MP3.

## Human Contributions

Ferlyn provided the feature vision, Rhythm Plus reference, MP3 example, gameplay recording, screenshots, acceptance criteria, and multiple rounds of design review.

Ferlyn made the key product decisions:

* The game should support `D F J K`.
* Beatmaps should load by song id and difficulty.
* Gameplay should use generated song videos as fullscreen backgrounds.
* The Results page should connect to reflection, not just end the game.
* Scoring logic should stay stable while the Results page UI improves.

Ferlyn's feedback directly corrected UI hierarchy, layering, pause behavior, countdown behavior, and platform integration.

## Lessons Learned

For this project, a rhythm game feature should not be treated as a separate mini-game. It needs to support the wider Shades of SG journey: listen, play, understand, and reflect.

Visual polish matters most when it improves readability and flow. The most important changes were not fancy effects, but clear layering, centered gameplay, visible notes, intentional start state, pause support, and a meaningful Results page that leads to Reflection Wall work.

Human review was essential because the AI could implement mechanics, but Ferlyn's references and product judgement determined whether the feature actually matched the intended experience.

---

## 2026-07-01

### Feature

Studio Page Rebuild

### AI Tool Used

Codex

### Objective

Rebuild only the creator Studio page from scratch so it matches the provided Figma reference, stays responsive across desktop and tablet/mobile widths, and avoids the instability of the previous implementation.

### Prompt Summary

Ferlyn requested a full rebuild of the Studio page only, with reusable components, a collapsible creator sidebar, a responsive metadata form, a live preview panel, footer actions, local React state only, no API calls, and no changes to unrelated pages, routing, authentication, or backend logic.

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

Refine the Creator Studio page so the Song Information card and surrounding Studio layout more closely match Ferlyn's provided Figma screenshots.

### Prompt Summary

Ferlyn requested several visual corrections to the Creator Studio page, especially the Song Information container. The requested layout was:

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

In progress. Ferlyn is comparing the updated Studio card against the Figma screenshot and giving visual correction prompts.

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

* Continue pixel-level visual tuning against the Figma screenshot if Ferlyn identifies remaining spacing, sizing, or color differences.
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

Ferlyn requested multiple follow-up improvements to the Studio page:

* Add a remove or cross button beside the uploaded audio file.
* Allow uploaded audio to be played from the live preview.
* Allow a detected YouTube link to be playable in the preview area.
* Leave YouTube duration as `--` because backend metadata extraction is not implemented yet.
* Turn the Mood Tags add row into a usable text field.
* Add icons to the mood and language pills in the preview.
* Replace the preview pill icons with the supplied SVGs.
* Ensure all selected mood tags appear in the preview, not only the first mood.
* Extract the Ferlyn profile, dark mode, and notification cluster into a reusable component because it repeats across creator pages.
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
* Replaced the mood and language pill icons with Ferlyn-provided SVG paths.
* Updated the preview to display every selected mood tag as its own pill.
* Updated the preview language pill and language count to include custom "Others" input values.
* Made typing in the custom language field automatically select the `Others` checkbox.
* Extracted the creator profile/actions cluster into `CreatorAccountWidget`.
* Updated `StudioHeader` to consume the reusable account widget.
* Updated `Studio.jsx` to render `StudioHeader` instead of owning header markup directly.
* Moved the account cluster CSS from Studio-specific selectors to reusable `creator-account-widget` selectors.

### Human Review

Partially accepted through iterative review.

Ferlyn reviewed the UI in the browser after each small change and identified missing behavior or visual mismatches, including missing mood display, custom language handling, and repeated header account markup.

### Human Modifications

No direct human code modifications were made during this follow-up.

Ferlyn provided the visual references, SVG icon paths, and product decisions for how the preview should behave.

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

Ferlyn asked Codex to add everything completed during the recent Creator Studio work into `AI_DEVELOPMENT_JOURNAL.md` again.

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

Ferlyn specifically requested that the AI journal be updated again after the Studio refinements.

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

Ferlyn asked Codex to continue improving the Creator Studio lyrics workflow through several prompts:

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
* Confirmed that `yt-dlp` was installed but not available on PATH because Python installed it under `C:\Users\belle\AppData\Local\Programs\Python\Python313\Scripts`.
* Verified that setting `YT_DLP_PATH` to the full `yt-dlp.exe` path and restarting the backend allowed the backend to locate the tool.
* Diagnosed a pasted YouTube URL with an incomplete video ID and added a clearer validation error for that case.

### Human Review

Accepted through iterative browser review.

Ferlyn tested the Studio page in the local browser, shared screenshots of confusing states, and confirmed which behavior should change next. The feedback drove fixes for stale Lyrics content, misleading AI status, YouTube extraction handling, and lyrics formatting.

### Human Modifications

Ferlyn installed `yt-dlp` locally using:

* `py -m pip install yt-dlp`

Ferlyn also updated local environment configuration in `backend/.env`, including the OpenAI key and `YT_DLP_PATH`. Secret values were not recorded in the journal.

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
