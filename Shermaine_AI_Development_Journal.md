# Shermaine's AI Development Journal

## Purpose

This document records AI-assisted development activity from Shermaine's chat sessions on Shades of SG, in chronological order by date. Each entry covers the prompts given, the changes made to the project, and the reasoning behind key decisions.

This is a personal companion to `AI_DEVELOPMENT_JOURNAL.md`, scoped to sessions Shermaine has directly worked in.

---

## Summary: How Claude Code Has Been Used On This Project

Across four sessions (13 July, 24 July, 4 August, 6 August 2026) and 13 tasks logged below, Claude was used for two roughly equal kinds of work — building/iterating on features, and debugging problems that came up while running the app — plus one documentation handover task.

### Coding & feature building
* **Iterative, screenshot/mockup-driven UI work.** The Creator Dashboard & My Songs redesign (13 Jul, Task 1) was a back-and-forth of small fixes and restyles — chart overflow, non-functional filter pills, "it does not feel cohesive," then a pasted mockup to steer the visual direction — rather than one upfront spec. The same pattern repeated for the Learning Hub timeline and quiz (13 Jul, Task 3) and later a one-line CSS overlap fix (4 Aug, Task 1).
* **Large features built from detailed written specs**, most notably the National Day Learning Experience (13 Jul, Task 3): a Learning Hub redesign, the Heritage Vault archive pages, an Instrument Discovery Lab with real Web Audio synthesis, and a Guided Music Lessons flow — four pages built end-to-end (components, hooks, CSS) in one extended session.
* **A full-stack feature planned before being coded.** The Badge & Keepsake Journal system (4 Aug, Task 2) went through plan mode first: Claude asked clarifying questions (mock data vs. real backend tracking, the 3D-figurine idea vs. a sticker-book journal, one landmark per badge category, what "complete" means for the Instrument Playground badge) before a plan was written and approved, then implemented as a migration, models, services, routes, and a new journal UI.
* **Small, scoped additions** — a hardcoded Archived Songs stat card (13 Jul, Task 5) — done directly against the existing pattern with no back-and-forth needed.
* Claude was explicitly asked to check in before large builds ("checked with the user before coding" for both the Instrument Lab and Guided Lessons), and did so via clarifying questions rather than guessing at route structure, audio approach, or scope.
* **Replacing synthetic audio with real recordings** (6 Aug, Task 1) — the very swap-in point `useInstrumentAudio` was designed for back in the 13 July session — went through plan mode again: research into royalty-free sample sources, a clarifying question on storage architecture (backend DB + Cloudinary vs. static frontend files) and on sourcing scope (ship only the one instrument with a rock-solid source vs. more), then implementation across a new migration, model fields, a seed pipeline, a public endpoint, and a frontend hydration/preload layer — followed by a second round once the user found a usable sample source for three more instruments.
* **A full data-model + flow rebuild planned before being coded** (6 Aug, Task 2): asked to generate consistent Easy/Medium/Hard lesson data for four new National Day songs and rebuild Guided Music Lessons around an instrument → song → difficulty → lesson flow with a real Play/Pause/Restart transport. Went through plan mode with Explore and Plan agents, clarifying questions on the interaction model (playback-style vs. keeping the old call-and-response mechanic), integration scope (unify with the 3 existing songs vs. two parallel systems), and content accuracy — the user supplied two MuseScore reference links, which led to web research grounding each song's key/chords/BPM once MuseScore itself proved unreachable. Approved with one explicit condition ("make sure the rhythm game isn't affected"), which was verified directly rather than assumed. Three quick follow-up refinement requests in the same session — reinstating a "hear a sample first" step, physical-keyboard note input like the Instrument Lab, and including sharps/flats — were each implemented as small, targeted extensions of the same architecture rather than rework.

### Debugging
* **Crash diagnosis from pasted stack traces**, the most common debugging pattern in this journal: a server crashing at import time from a missing `OPENAI_API_KEY` (13 Jul, Task 7), and two separate "package declared in `package.json` but never installed" import failures (`lucide-react` on 13 Jul, `wavesurfer.js` on 24 Jul) — each diagnosed to its root cause before running `npm install`, rather than just reacting to the surface error.
* **Merge conflict resolution** (13 Jul, Task 6) — resolved by actually reconciling both sides of each conflicting hunk instead of picking one, since they addressed unrelated concerns.
* **A real regression caught mid-implementation**, not just user-reported: while building the badge system, Claude noticed its own earlier hook placement (badge evaluation on every authenticated request) was corrupting unrelated tests and causing SQLite contention, and fixed it by scoping the hook to just the two real "session start" routes.
* **A production database error** (missing migration on the live Supabase database) diagnosed and fixed directly, but only after explicit confirmation before touching the shared database.
* **A full revert on request** (13 Jul, Task 2) — when asked to "undo every single change," reverted committed files via `git checkout` and manually removed new CSS with no prior committed version, confirming a clean `git status` afterwards.
* **Credential/environment troubleshooting isolated from application code** (6 Aug, Task 1): when Cloudinary uploads failed with "Invalid Signature," reproduced the same failure against the pre-existing, untouched upload code path first to rule out a code bug, then tested the raw credentials directly against Cloudinary's own API (bypassing the app entirely) to confirm the secret itself was wrong — twice, the second time isolating a single look-alike character (`1` vs `l`) after an initial fix attempt still failed.
* **Lint-driven hook redesign** (6 Aug, Task 2): a first draft of the new playback hook failed ESLint's `react-hooks` rules three separate ways (mutating a ref during render, a recursive `useCallback` referencing itself before its own declaration, and calling `setState` synchronously inside an effect body) — each read from the actual rule error text and fixed by redesigning the hook around state and cleanup-based timeout cancellation rather than refs, not by suppressing the lint rule.
* **A real bug caught before it shipped, not just a lint complaint**: the first version of the sequencer played chord steps via `playChord()`, which looks each note up by label against the *chosen instrument's own* note list — silently dropping any chord tone (like F#4) that instrument's scale doesn't contain, exactly the trap the whole "instrument-agnostic song data" design was meant to avoid. Caught by re-reading the hook's own reasoning against `useInstrumentAudio.js`, not by a failing test, and fixed before any test was written against the buggy version.
* **Test-infrastructure debugging** (6 Aug, Task 2): a mocked `AudioContext` built with an arrow function threw `is not a constructor` (arrow functions can't be called with `new`) — fixed by switching to a plain `function`; two timer-based test assertions failed on a single large `vi.advanceTimersByTime()` call across a chain of recursively-rescheduled timers, traced to React's effect-flush timing and fixed by advancing in per-step chunks, each in its own `act()`; and an accessible-name collision between the page's existing hero button and a new button (both named "Start Learning") surfaced as an ambiguous "multiple elements found" test failure, fixed by renaming the new button.

### Patterns worth noting
* Verification was almost always empirical where possible — booting the dev server and reading its logs, checking `node_modules` for an installed version, re-running the exact query that had previously failed — rather than assuming a fix worked.
* Placeholder/unverified content (illustrative melody notes, placeholder badge art, unverified Heritage Vault quotes) was consistently flagged as such in-code and in summaries, not presented as authoritative.
* Claude caught and corrected its own mistakes when they happened — e.g. an overly broad `taskkill` command was flagged to the user and replaced with a properly scoped tool call; in the 6 August session, a summary that implied a feature was "wired end-to-end" was corrected once the user reported it wasn't actually audible yet, with the real state (an empty database, a failed upload) explained plainly rather than glossed over.
* Real, uncomfortable findings were surfaced rather than hidden — flagging that a shared production/dev database was about to be touched before running a migration against it, and telling the user directly that a Cloudinary secret they'd pasted in plaintext chat should be treated as exposed and rotated.
* One task (Project Handover Documentation, 13 Jul, Task 4) was purely about leaving clean context for future sessions, producing `IMPLEMENTATION_PROGRESS.md` with an honest completion percentage and a concrete next-actions list.

---

## 13 July 2026

### Task 1: Creator Dashboard & My Songs Redesign

#### AI Tool Used
Claude

#### Prompts
* A sequence of iterative UI requests on the Creator Dashboard: fix the "Plays this week" chart bars overflowing their card; make the "My Songs" filter pills actually filter the list; "improve the ui of the my songs section please, im not sure which style i want but right now, it does not feel cohesive with the rest of the page"; standardize the My Songs page's nav bar/icons/padding to match the Dashboard; remove the "Needs Review" stat card and resize the remaining two.
* Screenshot + "along with the kpi cards, i'd like for the songs section to look something like this [mockup: song list + lyrics detail panel]. when i toggle between songs, it shows the lyrics accordingly. enable filtering as well please."
* "could you add those 2 buttons please. for add song, direct to studio when clicked. for select song, when clicked, circles should appear at each of the song cards... beside the select song button, add a trash bin icon and an archive icon" — multi-select, delete, and archive.
* Screenshot + "taking inspiration from the ui here, please revamp the ui" (a mockup collage of Home/Reflections/Settings designs) — clarified via question to mean a hero-photo visual treatment applied to the Dashboard, then "apply the same ui changes to my songs please."
* Two follow-up screenshot bug reports: the "My Songs" header text was slightly clipped, and the trash/archive icons should turn white once "Select Song" is clicked rather than staying disabled-looking.

#### Files Modified
* `frontend/src/pages/Dashboard.jsx`, `frontend/src/pages/CreatorSongs.jsx`
* `frontend/src/components/CreatorPageShell.jsx`
* `frontend/src/pages/pageData.js`
* `frontend/src/App.css`

#### Changes Made
* Fixed the weekly-plays chart's grid so the expand-on-hover tooltip no longer overflowed its card, and made the first/last bars' tooltips anchor inward instead of centering off the edge.
* Wired the "My Songs" filter pills to real state on both Dashboard and My Songs, backed by a shared `creatorSongs` data array and status/filter constants moved into `pageData.js`.
* Rebuilt the My Songs page around a two-column song-list-plus-lyrics-detail layout (`creator-song-browser`), added bulk selection (checkbox circles), and wired Trash/Archive icon buttons — archiving a song now excludes it from the default "All" filter view.
* Standardized My Songs onto the same `CreatorPageShell` header used by Dashboard (breadcrumb, account icons, padding) instead of a different shared header component.
* Added a `creator-page--hero` CSS modifier (photo-backed header, gradient title, colour-accented stat cards) applied to both Dashboard and My Songs for a cohesive, less "flat dashboard" look.

#### Decisions Made
* Kept all restyling scoped through the new `creator-page--hero` class rather than editing the base `.creator-page` rules, so other creator pages (Studio, Generation Jobs, etc.) were unaffected.
* Made archived songs disappear from the default song list rather than just visually flagging them, since "archived" was described as removing it from the "main song directory."

#### Verification
* Reasoned directly against the existing CSS/JSX; no automated test suite exists for this app's frontend, so changes were checked by re-reading the resulting component output rather than a running browser (none available in this environment at the time).

---

### Task 2: Generation Jobs History Feature (Added, Then Reverted)

#### AI Tool Used
Claude

#### Prompts
* A short sequence of requests to add generation-history features to `GenerationProgress.jsx`: display attempts/versions/timestamps, add status filters, rename "Not Started" to "Not Started (Queued)", add a progress bar for in-progress jobs, add a "Review" button to every card, then remove the three original placeholder cards above the history list.
* "omg undo every single change in generation progress. revert all changes made in relation to GenerationProgress.jsx"

#### Files Modified (temporarily, then reverted)
* `frontend/src/pages/GenerationProgress.jsx`
* `frontend/src/App.css`

#### Changes Made
* Built out a full generation-history list (attempt/version, status badges, timestamps, a progress bar, filter pills, a "Review" button) before being asked to fully undo it.
* Reverted `GenerationProgress.jsx` to its last committed state via `git checkout`, and manually removed every CSS rule added for the feature from `App.css` (the badge-status variants and all `.generation-history-*` rules), since those were new additions with no prior committed version to check out.

#### Verification
* `git status` confirmed both files were byte-for-byte clean afterwards, with no other files affected.

---

### Task 3: National Day Learning Experience

#### AI Tool Used
Claude

#### Prompts
* "would like you to redesign my existing Learning Hub page to feel more engaging, interactive, and modern" — a detailed spec for a hero, interactive timeline, three learning-module cards, a "Did You Know?" fact cycler, and a mini quiz.
* Follow-ups: fix a timeline text-wrapping bug; restyle the whole page from a red/gold National Day palette to match the Creator Dashboard's violet/pink hero look (after a mockup screenshot); match the quiz card's width to the fact card's and keep it stable after answering; expand the quiz to multiple cyclable questions; animate question transitions like the fact cycler.
* A long spec for a "Cultural & Historical Explorer" page — an archive/museum-style browsing experience with expandable "collections" of mixed media (photos, newspaper clippings, quotes, audio, facts) telling Singapore's National Day story through question-led narrative rather than a timeline. Clarified via questions: don't wire the two vague sub-page names to real routes yet, build only what already has a home.
* "could you rename my pages and the folder to 'The Heritage Vault'? ... ensure all buttons and routes are renamed accordingly."
* A follow-up spec for a "Final Section: Reflection & Community" closing the Vault with an emotional prompt and two CTAs into the Reflection Wall; then "could you switch the positions of the 'Continue exploring' section and the 'Final exhibit' section?" and a width-matching fix.
* A large spec for an "Instrument Discovery Lab" — a playable instrument gallery using real Web Audio synthesis, explicitly asked to be checked with the user before coding. Clarifying questions asked and answered: new standalone route (not replacing the existing per-song `/songs/:id/playground`); synthesized Web Audio tones now, swappable for real recordings later; 4-5 representative instruments rather than the full ~9 listed.
* An equally large spec for "Guided Music Lessons" — a Listen/Learn/Practice/Insight/Check lesson flow, again asked to be checked first. Clarifying questions asked and answered: click-sequence note matching (no microphone); frontend-only progress via localStorage (no backend); one song fully built, two as locked preview cards; reuse and extend the Instrument Lab's audio engine.

#### Files Created
* `frontend/src/components/Reveal.jsx`, `frontend/src/hooks/useReveal.js`
* `frontend/src/pages/HeritageVault.jsx` (created as `CulturalExplorer.jsx`, then renamed)
* `frontend/src/components/vault/VaultFolder.jsx`, `frontend/src/components/vault/VaultItem.jsx` (created as `components/archive/Archive*.jsx`, then renamed)
* `frontend/src/pages/InstrumentDiscoveryLab.jsx`
* `frontend/src/components/lab/InstrumentCard.jsx`, `frontend/src/components/lab/InstrumentPlayer.jsx`
* `frontend/src/hooks/useInstrumentAudio.js`
* `frontend/src/pages/GuidedMusicLessons.jsx`
* `frontend/src/components/lessons/LessonCard.jsx`, `frontend/src/components/lessons/LessonSection.jsx`, `frontend/src/components/lessons/LessonPlayer.jsx`
* `frontend/src/hooks/useLessonProgress.js`

#### Files Modified
* `frontend/src/pages/LearningHub.jsx`, `frontend/src/App.jsx`, `frontend/src/App.css`
* `frontend/src/pages/ReflectionWall.jsx`

#### Changes Made
* **Learning Hub:** replaced the placeholder three-card layout with a hero, a 5-milestone expandable timeline (smooth `grid-template-rows` accordion animation), three module cards linking to the other pages, a cycling "Did You Know?" fact card, and a 5-question quiz with instant feedback — all fading in on scroll via the new `Reveal`/`useReveal` utilities.
* **The Heritage Vault:** built 5 expandable "archive folder" collections, each holding a mix of photo/newspaper/quote/fact/story/audio/video items rendered by a polymorphic `VaultItem` component; "Did You Know?" facts flip in 3D on click; closed with a "Living Archive" reflection section (randomly-chosen prompt, "Share Your Reflection" / "Read Community Reflections" CTAs into `/reflections`).
* Added a `?compose=1` query param to `ReflectionWall.jsx` so the Vault's "Share Your Reflection" button lands with the reflection composer already open, rather than just navigating there.
* **Instrument Discovery Lab:** built a 5-instrument gallery (Piano, Angklung, Kompang, Erhu, Tabla) with a real Web Audio synthesis engine (`useInstrumentAudio`), keyboard bindings, a "Quick Compare" preview row, a traditional-melody demo button, and three no-scoring mini challenges per instrument.
* **Guided Music Lessons:** built a lesson library (progress bars, locked/unlocked states) and a fully interactive lesson for "Count On Me, Singapore" — Listen, then per-section Learn → Practice (click-sequence matching with encouraging retry feedback and a pulsing "next note" highlight) → Check, each section carrying its own embedded "Music Insight" (major scale / chord / rhythm repetition), ending in a completion celebration screen. "Home" and "Stand Up for Singapore" ship as locked preview cards.
* Cross-linked all three module pages to each other and back to the Learning Hub consistently.

#### How AI Helped
* Asked clarifying questions before starting both the Instrument Lab and Guided Lessons builds, as explicitly requested, rather than guessing at route structure, audio approach, or scope — each answer meaningfully changed what got built (e.g. a standalone route instead of extending the existing per-song playground; localStorage instead of new backend work).
* Caught and fixed a real React anti-pattern mid-session: an early version of both the instrument player and the lesson player reset local state (played notes, practice progress) via a `useEffect` keyed on the selected item's id, which React's lint rules flagged (`react-hooks/set-state-in-effect`, cascading renders). Fixed by remounting the player via `key={selectedId}` from the parent instead, which is the idiomatic fix and removed the effect entirely.
* Kept each new page's colour identity distinct (Learning Hub pink/violet, Vault amber/gold, Lab teal/coral, Lessons rose/gold) while reusing the same structural patterns (gradient-clip hero titles, the `Reveal` fade-in, the accordion technique) across all of them, so the pages feel like one family without feeling identical.
* Where source material couldn't be verified — Heritage Vault quotes/newspaper clippings, the exact melody of "Count On Me, Singapore" — labelled it explicitly as illustrative/simplified in-code rather than presenting it as authoritative, and said so in the summary each time.

#### Decisions Made
* Instrument Discovery Lab is a new standalone route (`/learning/instrument-lab`), independent of any song id, leaving the older `/songs/:id/playground` untouched.
* "Note detection" in both the Lab and Lessons means comparing the clicked/tapped pad sequence to an expected order — no microphone or pitch-detection.
* Built 5 of the ~9 originally-listed instruments, and 1 of the 3 listed songs fully, per explicit scope agreement rather than attempting all of them.
* Lesson progress persists via `localStorage` only (mirroring the existing `frontend/src/game/results.js` pattern), not the real Express/Sequelize backend.
* `useInstrumentAudio` was designed so a `samples` map on any instrument/voice object is checked before falling back to oscillator synthesis, so real recordings can replace synthesized tones later with a one-line data change and no code changes.

#### Remaining Work
* No real browser/device QA has been performed on any of these four pages — this environment had no browser tool available at any point, so all verification was ESLint + `vite build` only.
* Real instrument/song audio recordings still need to be sourced and wired in via the `samples` map.
* "Home" and "Stand Up for Singapore" lessons still need to be built out using the same `LessonSection`/`LessonPlayer` pattern.
* The "Count On Me, Singapore" note sequences need sign-off from someone who knows the real melody — they're currently simplified and illustrative.
* Heritage Vault's photo/video/audio tiles are still styled placeholders, not real archival media.

#### Verification
* `npx eslint src` and `npx vite build` run clean after every change across this task; no visual/manual verification was possible in this environment.

---

### Task 4: Project Handover Documentation

#### AI Tool Used
Claude

#### Prompts
* "Before we end this session, I'd like to prepare everything so future chats can continue this feature without relying on this conversation's context" — a detailed required structure for a new `IMPLEMENTATION_PROGRESS.md` (feature overview, staged work plan, per-stage status, master checklist, completion percentage, current implementation state, next actions, notes & decisions).

#### Files Created
* `IMPLEMENTATION_PROGRESS.md`

#### Files Modified
* `frontend/src/pages/HeritageVault.jsx`

#### Changes Made
* Wrote `IMPLEMENTATION_PROGRESS.md` scoped to the National Day Learning Experience (the four pages from Task 3), following the requested structure exactly, including an honest "~70% vs. full original vision / ~90% vs. agreed scope" progress split and a Next Actions list led by "run this in a real browser," since none of it had been visually verified.
* While auditing the Vault's closing links for the handover doc, found and fixed two stale cross-links left over from before the other pages existed: the "Guided Music Lessons" continuation card was still an inert button, and the "Instrument Playground" card still pointed at the old `/songs/demo-song/playground` route instead of the new Instrument Discovery Lab.

#### Decisions Made
* Scoped the handover document to the Learning Experience feature specifically (not the earlier Dashboard/My Songs work from Task 1), since that work had no open threads or pending decisions, whereas the Learning Experience has explicit, recorded remaining work.
* Fixed the two stale links found during the audit immediately rather than only noting them as a known gap, since they were quick, unambiguous corrections.

#### Verification
* `npx eslint src` and `npx vite build` re-run clean after the link fixes.

---

### Task 5: Archived Songs Stat Card

#### AI Tool Used
Claude

#### Prompts
* "on the creator dashboard, add another card for archived songs. under page data, hard code it as 0 archived songs for now"

#### Files Modified
* `frontend/src/pages/Dashboard.jsx`
* `frontend/src/pages/pageData.js`

#### Changes Made
* Added a new "Archived" card to the Dashboard's stats grid, matching the existing Total Songs / Published / Processing / Total Plays cards' `SectionCard` layout and linking through to `/creator/songs`.
* Backed the card with a new hardcoded `dashboardArchivedSongsCount` constant (set to `0`) in `pageData.js`, as requested, rather than deriving it from `creatorSongs`.

#### Verification
* Reasoned directly against the existing stats-grid pattern already used by the other four cards; no build/test tooling run for this small addition.

---

### Task 6: `main` Merge Conflict Resolution

#### AI Tool Used
Claude

#### Prompts
* Pasted a terminal transcript showing `git pull origin main` / `git merge main` failing with unmerged files, and asked what unresolved conflicts remained.
* "yes please resolve these merges directly"

#### Files Modified
* `.gitignore`
* `frontend/.env.example`

#### Changes Made
* Ran `git status` to confirm only two files had real conflicts (`.gitignore`, `frontend/.env.example`) — everything else in the merge's long file list was already auto-merged and staged.
* Resolved `.gitignore`: dropped the current branch's `frontend/.env.example` ignore line (that file is a tracked template, not a real secret) and kept main's `ferlyn_jounral.md` addition.
* Resolved `frontend/.env.example`: combined both sides rather than picking one — kept main's `/api` relative URL convention (with its Vite-proxy/Vercel comment) and kept this branch's `SEED_CREATOR_*` lines, since the two conflicting hunks addressed unrelated concerns.
* Staged both resolved files with `git add`, leaving the actual `git commit` for the user to run themselves.

#### Decisions Made
* Merged both hunks of `frontend/.env.example` together instead of choosing a side, since neither hunk fully superseded the other (API URL convention vs. seed-creator credentials).

#### Verification
* `git status --short` confirmed no remaining `UU`/`AA` unmerged paths after staging.

---

### Task 7: Post-Merge Startup Crash Debugging

#### AI Tool Used
Claude

#### Prompts
* Pasted a backend crash stack trace right after completing the Task 6 merge: `OpenAIError: Missing credentials... at aiScenePlanner.js:7`.
* "yes please" (to add a real OpenAI key) → "just added my key, please help me resolve the issue" (twice — first with a placeholder value, then with the real key) → "key pasted".
* Pasted a second, unrelated crash from the frontend Vite dev server: `Failed to resolve import "lucide-react" from "src/pages/GenerationProgress.jsx"`.

#### Files Modified
* `backend/.env` (`OPENAI_API_KEY`)
* `frontend/node_modules` (via `npm install`, adding `lucide-react`)

#### Changes Made
* Diagnosed the backend crash: the merge brought in a new AI scene-planning feature (`backend/services/aiScenePlanner.js`) that constructs its `OpenAI` client at module-import time, so a missing `OPENAI_API_KEY` crashes the entire server on boot rather than only when that feature is actually used.
* Caught that the first value the user pasted (`OPENAI_API_KEY=my_open_ai_key`) was leftover placeholder text, not a real key (real OpenAI keys start with `sk-`), and checked before treating it as a fix.
* After a real `sk-proj-...` key was pasted, started the backend dev server in the background to verify the fix and confirmed via its logs that it now reaches `Database connected successfully` / `Server is running...` with no thrown error. Attempted to stop that verification server with an overly-broad `taskkill //F //IM node.exe` (which risked killing unrelated node processes on the machine), then corrected course by loading and using the scoped `TaskStop` tool instead — and flagged the earlier command to the user directly rather than staying quiet about it.
* Diagnosed the frontend crash: `lucide-react` was already declared in `frontend/package.json` (pulled in by the same merge) but had never actually been installed into `node_modules`. Ran `npm install` in `frontend/`, which added the package and resolved the import error.

#### How AI Helped
* Didn't apply the pasted OpenAI key blindly — flagged that the first value looked like unfilled placeholder text before proceeding, avoiding a false "fixed" report.
* Verified both fixes empirically (booting the backend server and reading its log; checking the installed `lucide-react` version) rather than assuming the change would work.

#### Decisions Made
* Left the 2 `npm audit` vulnerabilities (1 low, 1 high) surfaced by `npm install` unaddressed for now rather than running `npm audit fix` automatically, since that can silently bump dependency versions.

#### Remaining Work
* `npm audit fix` (or a manual look at the 2 flagged vulnerabilities) is still outstanding for `frontend/`.

#### Verification
* Backend: background `npm run dev` run, log output read directly, showing `Database connected successfully` and `Server is running in development mode on port 5000` with no thrown error.
* Frontend: confirmed `node_modules/lucide-react/package.json` reports version `1.24.0` after `npm install`.

---

## 24 July 2026

### Task 1: WaveSurfer.js Missing Dependency Fix

#### AI Tool Used
Claude

#### Prompts
* Pasted a Vite dev-server error: `[plugin:vite:import-analysis] Failed to resolve import "wavesurfer.js" from "src/pages/VideoEditor.jsx". Does the file exist?`

#### Files Modified
* `frontend/node_modules` (via `npm install`, adding `wavesurfer.js`)

#### Changes Made
* Diagnosed the crash: `wavesurfer.js` was already declared in `frontend/package.json` (`^7.12.10`) but was missing from `node_modules`, so Vite couldn't resolve the import despite the dependency being listed.
* Ran `npm install` in `frontend/`, which pulled in the missing package and resolved the import error.

#### Decisions Made
* Confirmed via `package.json` and a direct `node_modules` check that the package was declared-but-not-installed before running `npm install`, rather than assuming the import path or version constraint itself was wrong.

#### Verification
* Confirmed `frontend/node_modules/wavesurfer.js` was present after `npm install`; advised restarting the Vite dev server to clear the stale import-analysis error.

---

## 4 August 2026

### Task 1: Learning Hub Timeline Description Overlap Fix

#### AI Tool Used
Claude

#### Prompts
* "for the timeline on learning hub titled 'Singapore's National Day Journey', could you shift the description of each milestone to the right? its overalapping the line connecting the milestones"

#### Files Modified
* `frontend/src/App.css`

#### Changes Made
* Diagnosed the overlap: `.learning-timeline__body` spanned `grid-column: 1 / -1`, so the description block started under the icon column, where the connecting line (`.learning-timeline__track::before`, positioned at `left: 27px`) sits.
* Changed `.learning-timeline__body` to `grid-column: 2 / -1` so the description aligns with the milestone title column instead of the icon/line column.

#### Verification
* Reasoned directly against the existing CSS grid definition (`.learning-timeline__item { grid-template-columns: 56px 1fr; }`); no build/test tooling needed for this one-line CSS change.

---

### Task 2: Badge & Keepsake Journal System

#### AI Tool Used
Claude

#### Prompts
* "i want to create badges for the users, this is my ideation so far: Consistency badges (for logging in) — Day One, 7-Day Streak, 30-Day Streak, Consistency Champion (50 Days), Dedicated Learner (100 Days); Reflection Badges — Thought Starter, Reflective Mind, Deep Thinker; Instrument Playground — can link to fun challenges. i want the badges to be stored under the 'My keepsakes' section in profile. since its named 'my keepsakes' i thought of having 3d figurines of singapore's key landmarks eg. the merlion or something related to the achievement. when clicked, it will turn around and show the actual badge design. please use placeholders for now for both the 3d and 2d model"
* Clarifying answers given during plan mode: chose "Full stack" scope (real backend streak tracking and badge-awarding, not mock data); "ok scratch the 3d model idea, i want a sticker book instead. the 'badges' will be like stickers and the 'my keepsakes' is a journal where i can flip and view entries. i want the font to look like actual legible handwriting on grid paper"; chose one landmark sticker per badge category; clarified the Instrument Playground badge should be awarded "when all challenges are complete" (referring to the existing 'play 3 notes' / 'find the highest note' / 'find the lowest note' challenges in the Instrument Discovery Lab).
* Approved the written implementation plan via ExitPlanMode.
* (After implementation) pasted a live "Internal Server Error" stack trace from a running dev server — `column User.last_active_date does not exist` — and asked for help debugging it.

#### Files Created
* `backend/migrations/022_badges_streaks_and_challenges.sql`
* `backend/models/InstrumentChallengeProgress.js`
* `backend/services/badgeCatalog.js`
* `backend/services/badgeAwardService.js`
* `backend/services/streakService.js`
* `backend/routes/instrumentPlayground.js`
* `backend/tests/badges.test.js`
* `frontend/src/components/profile/KeepsakeJournal.jsx`
* `frontend/src/services/instrumentPlaygroundService.js`

#### Files Modified
* `backend/models/User.js`, `backend/models/Badge.js`, `backend/models/index.js`
* `backend/routes/auth.js`, `backend/routes/users.js`, `backend/routes/reflections.js`, `backend/server.js`
* `backend/tests/userProfiles.test.js`
* `frontend/index.html`
* `frontend/src/components/profile/badgeDefinitions.js`, `frontend/src/components/profile/ProfileBadges.jsx`
* `frontend/src/Profile.css`
* `frontend/src/components/lab/InstrumentPlayer.jsx`

#### Changes Made

**Backend**
* Added a 9-badge catalog (`badgeCatalog.js`) across three categories — Consistency (Merlion), Reflection (National Gallery), Instrument Playground (Esplanade) — each with a name, description, and an `isEarned` criteria function.
* Added login-streak tracking on `User` (`lastActiveDate`, `currentLoginStreak`, `longestLoginStreak`), updated via a new `streakService.recordDailyActivity`.
* Added `badgeAwardService.evaluateAndAward(userId)`, which checks streak/reflection-count/instrument-challenge-count against the catalog and idempotently inserts any newly-earned `Badge` rows (backed by a new unique `(user_id, name)` index).
* Added a new `instrument_challenge_progress` table/model tracking which of the three canonical challenge ids (`three-notes`, `lowest-note`, `highest-note`) a user has completed, and a `POST /api/instrument-playground/challenges/:challengeId/complete` route that records progress and re-evaluates badges.
* Wired reflection badge evaluation into `POST /api/reflections`.

**Frontend**
* Replaced the flat badge-card grid in "My Keepsakes" with `KeepsakeJournal.jsx`: a paginated sticker-book journal — one page per badge category, graph-paper page background, a "Patrick Hand" handwritten heading, earned badges rendered as tilted circular stickers, unearned badges as dashed-outline placeholders, and a click-to-flip 3D interaction (reusing the existing `.vault-fact` flip-card CSS idiom, re-themed) revealing the badge name/description/earned date on the back.
* Added the Patrick Hand Google Font, scoped to the journal.
* Wired `InstrumentPlayer.jsx` to report challenge completions to the backend once per challenge, only for logged-in users.

#### How AI Helped
* Explored the existing Profile/"My Keepsakes" component, the (unused) `Badge` model/read-endpoint, and the existing Instrument Discovery Lab challenge checklist before proposing a design.
* Ran a scoped plan-mode discussion — asking clarifying questions on backend scope, the sticker-book redesign, landmark-per-category mapping, and the Instrument Playground trigger — before writing an implementation plan for approval.
* Implemented the migration, models, services, routes, catalog, journal UI, and CSS.
* Caught and fixed a real regression during implementation: an initial version hooked badge evaluation into the shared `requireAuth` middleware, which fired on nearly every authenticated request. This both corrupted unrelated existing tests' badge-count assertions and caused SQLite write contention (`SQLITE_BUSY`) across the test suite. Diagnosed from actual test failures and fixed by scoping the streak/award hook to only the two routes that represent a real session start (`POST /auth/login` and `GET /users/me/profile`), and by serializing the award-checking queries inside a single transaction.
* Updated one pre-existing test (`userProfiles.test.js`) whose badge-count assertion was a legitimate, correct consequence of the new feature, and confirmed a separate, already-failing `statsService.test.js` test was unrelated and pre-existing (verified against the pre-change baseline via `git stash`).
* Stood up an isolated scratch SQLite database and a second frontend/backend dev-server pair (distinct ports, a temporary Vite proxy config, and a CORS allow-list override) to browser-test the full flow end-to-end with Playwright, without touching the real database or the already-running dev servers.
* Diagnosed a follow-up production error hit directly (`column User.last_active_date does not exist`) as the new migration never having been applied to the real Supabase Postgres database, and — after explicit confirmation — applied `022_badges_streaks_and_challenges.sql` to that database inside a transaction (first checking for pre-existing duplicate `(user_id, name)` badge rows that would have broken the new unique index), then verified the fix by re-running the exact previously-failing query.

#### Decisions Made
* Replaced the 5 pre-existing placeholder badge names in `badgeDefinitions.js` (`First Memory`, `Rhythm Rookie`, etc.) outright, since no backend logic had ever awarded them.
* Counted a login "day" from any authenticated hit to `POST /auth/login` or `GET /users/me/profile` (the two points that represent an actual session start in the app's real auth flow) rather than every authenticated API call, to keep the feature's write cost proportional and avoid interfering with unrelated routes/tests.
* Tracked Instrument Playground challenge completion as "achieved at least once, ever, on any instrument" rather than per-instrument-session, since the existing challenge checklist resets on reselect and the badge should reward eventual mastery of all three challenge types.
* Kept the sticker/landmark art as simple lucide-icon placeholders per the explicit "use placeholders for now" instruction, with the mapping (Merlion/National Gallery/Esplanade) chosen so real illustrations can be swapped in later without touching logic.
* Applied the missed production migration via a direct transactional `pg` script rather than leaving the app broken, but only after explicit confirmation, since it touches a real shared database.

#### Remaining Work
* Swap the placeholder lucide-icon stickers for real landmark artwork.
* Consider surfacing `longestLoginStreak` in the UI (currently tracked but not shown).
* Extend the Instrument Playground badge trigger if new challenge types are ever added to `InstrumentPlayer.jsx`'s `CHALLENGES` list (the catalog assumes exactly 3).
* Add a migration-runner script (or CI check) so future schema changes can't reach a running environment before the corresponding `.sql` file is applied — this gap caused the production error fixed in this session.

#### Verification
* `cd backend && npm test` — full suite green except one pre-existing, unrelated failure in `statsService.test.js` (confirmed present on the unmodified baseline).
* `cd frontend && npm run build` — succeeds.
* Manual end-to-end browser verification via an isolated Playwright session (separate scratch database, backend port, and frontend port from the already-running dev servers): logged in, confirmed the journal renders with grid-paper background and the "Patrick Hand" font, flipped an earned sticker to see its entry, paged through all three category pages, submitted reflections and completed all three instrument challenges via the API, and confirmed the corresponding badges appeared.
* After applying the production migration: re-ran the exact previously-failing `User.findOne` query against the real Supabase database and confirmed it now succeeds and returns the new streak fields with their default values.

---

## 6 August 2026

### Task 1: Real Instrument Audio Samples for the Instrument Discovery Lab

#### AI Tool Used
Claude

#### Prompts
* "I want to add playable instrument samples to the existing instrument playground (currently, theres only synthetic sounds for each instrument)" — a full spec for Piano, Angklung, Kompang, Erhu, Tabla: recommend royalty-free sample sources (fall back to synthetic if none exist), store audio efficiently on the database, reusable playback, a "hear before you begin lessons" affordance, efficient preloading, desktop/mobile support, and easy to extend with more instruments later.
* Clarifying answers given during plan mode: confirmed **backend DB + Cloudinary storage** (not static frontend files) so the database holds URLs/metadata rather than audio blobs; confirmed **ship Piano now, the rest stay synthetic** initially, and asked Claude to recommend other rock-solid public-domain sources for the remaining instruments so she could decide later.
* Approved the written implementation plan via ExitPlanMode.
* "the sounds are stilll synthetic, including the piano. where did you insert the audio samples?" — after implementation, reported that nothing was actually audible yet.
* Pasted real Cloudinary credentials directly into chat and asked for help troubleshooting an "Invalid Signature" upload error.
* "try again please" (after updating the secret in `.env`) — the seed then hit a live Supabase Postgres database instead of the assumed local SQLite.
* "could you get the rest of the instruments to have real sample sounds please. i already providede the link for tabla" — a Sample Focus collection URL for Tabla, asking whether it and other instruments on that site were usable.
* "ok great! add this into my ai development journal please and label this entry with the date 6 august 2026."

#### Files Created
* `backend/migrations/025_instrument_lab_samples.sql`
* `backend/scripts/seedLabInstruments.js`
* `backend/controllers/instrumentController.js`, `backend/routes/instruments.js`
* `backend/audio-sources/manifest.json`, `backend/audio-sources/README.md`, and (gitignored) `backend/audio-sources/{piano,tabla,kompang,angklung}/*.mp3`
* `frontend/src/data/instruments.js`
* `frontend/src/hooks/useLabInstruments.js`
* `frontend/src/services/instrumentSamplesService.js`

#### Files Modified
* `backend/models/Instrument.js`, `backend/services/aiStorageService.js`, `backend/server.js`, `backend/package.json`, `backend/.gitignore`
* `frontend/src/pages/InstrumentDiscoveryLab.jsx`, `frontend/src/components/lab/InstrumentCard.jsx`, `frontend/src/components/lessons/LessonPlayer.jsx`
* `frontend/src/hooks/useInstrumentAudio.js`, `frontend/src/data/songExperienceInstrumentFallbacks.js`, `frontend/src/App.css`

#### Changes Made

**Backend**
* Extended the existing (previously unused-for-this-purpose) `instruments` table with `slug`, `samples` (a JSON map of note label → Cloudinary URL or `{ url, playbackRate }`), `sample_format`, `sample_license`, `sample_attribution`.
* Added an optional `{ folder, publicId }` param to `aiStorageService.uploadAudioStream` (backward-compatible) so instrument notes upload into predictable per-instrument Cloudinary folders instead of the one shared song-audio folder.
* Built `seedLabInstruments.js`: reads a committed `manifest.json`, uploads whichever locally-provided note files it finds, computes `playbackRate` for any `derivedNotes` (one recording reused across several note labels via pitch-shift), and upserts the result onto the matching `Instrument` row by `slug`. Missing files are skipped with a warning rather than erroring, so the manifest can describe instruments ahead of having every file.
* Added a public, unauthenticated `GET /api/instruments/lab-samples` endpoint returning each seeded instrument's sample map.

**Frontend**
* Consolidated the two duplicated hardcoded instrument-definition arrays (`InstrumentDiscoveryLab.jsx` and `songExperienceInstrumentFallbacks.js`) into one shared `data/instruments.js`.
* Added `useLabInstruments()`, which merges the static definitions with whatever `GET /api/instruments/lab-samples` returns — before that resolves, or for any note it doesn't cover, everything is identical to the prior synth-only behaviour, so there's no loading state and no all-or-nothing gate.
* Extended `useInstrumentAudio.js` with `preloadInstrument()` (a decode-only `AudioContext`, warms the existing shared `audioBufferCache` ahead of interaction) and pitch-shift playback (`AudioBufferSourceNode.playbackRate`), wired into idle-time gallery preload, hover-preload, and preload-on-select.
* Added a "🔊 Preview" button to each instrument gallery card (hear-before-you-play), and pointed `LessonPlayer.jsx`'s lesson voice at the real, hydrated Piano instrument instead of a hardcoded synthesis-only object.

**Sourcing**
* Sourced and wired 4 of the 5 instruments with real audio: **Piano** (Salamander Grand Piano V3, CC BY 3.0, fetched from a public npm/CDN mirror — 5 recorded notes, 5 more derived via pitch-shift), **Tabla** (Sample Focus's Single Hit Full/High/Low, from the collection link the user provided), **Kompang** (Sample Focus's generic frame-drum one-shots, since no dedicated royalty-free kompang recording exists — kompang *is* a frame drum, so this is an honest substitution), and **Angklung** (one Sample Focus recording, pitch-shifted to cover its other 4 notes). **Erhu** stays synthetic — nothing found on Sample Focus reads as a clean isolated note rather than a full melodic phrase clip.

#### How AI Helped
* Ran a scoped plan-mode discussion (Explore agents against the existing `useInstrumentAudio`/lesson code, a Plan agent for the storage-architecture design, live web research into royalty-free sample libraries) before writing an implementation plan for approval, and asked two clarifying questions — storage architecture and initial sourcing scope — rather than assuming either.
* Actually fetched real audio rather than only describing where to find it: downloaded 5 Salamander piano notes from a public, no-login CDN mirror; for Sample Focus (which gates its download button behind a free account), found that each sample's own page streams the full audio openly for its in-page player, located the underlying CloudFront URL in the page's embedded data, and fetched the exact same bytes the download button would give using a `Referer` header — the same license (royalty-free, no attribution, commercial-OK) applies either way.
* Verified as much as possible without a real browser in this environment: ran the migration and seed logic directly against the dev database, called the new controller function directly to check its response shape, confirmed uploaded Cloudinary URLs actually served `audio/mpeg` content, and ran the full backend Jest suite plus `eslint`/`vite build` on both sides.
* When the user reported the audio still sounded synthetic, didn't guess — checked the actual database state, found it genuinely empty (the earlier verification had used a throwaway fake-URL row that was deliberately deleted afterwards, and the real Cloudinary upload had never succeeded), and explained exactly what had and hadn't happened rather than assuming the fix was already live.
* Diagnosed the "Invalid Signature" Cloudinary error empirically: reproduced the identical failure against the existing, untouched upload code path to rule out a code bug, then tested the raw credentials directly against Cloudinary's own `ping` endpoint (bypassing the app's signature logic entirely) to prove the secret itself was rejected — and did the same test again after the user's first fix, this time finding the mismatch was a single look-alike character (`1` instead of `l`).
* Caught that a script had silently connected to the wrong database (local SQLite instead of the real Supabase Postgres the seed script had just used) because it forgot to load `dotenv` — noticed from an unexpected `dialect: sqlite` log line rather than assuming the first successful-looking run was correct.
* Flagged, unprompted, that the user's `.env` pointed to a real shared Supabase database before running schema changes against it, and separately that a Cloudinary secret pasted in plaintext chat should be rotated.

#### Decisions Made
* Chose backend DB + Cloudinary over static frontend files for sample storage, per the user's explicit choice, reusing the existing song-audio upload pattern rather than inventing a new one.
* Used a `derivedNotes`/pitch-shift mechanism (one recorded one-shot reused across several note labels at different playback rates) for Tabla's 4th note and all of Angklung's non-root notes, instead of requiring a separately-licensed file per note — reduces both licensing surface and payload size.
* Left Erhu on synthesis rather than force-fitting a mismatched recording, since nothing found was a clean isolated note.
* Deleted a throwaway fake-URL test row from the real database immediately after using it to verify the write path, rather than leaving placeholder data sitting in a shared database.

#### Remaining Work
* Erhu still has no real sample source — synthetic until one is found.
* The Cloudinary secret pasted into this chat should be rotated on the Cloudinary dashboard.
* Live end-to-end verification by actually starting the Express server and hitting it over HTTP was not possible in this environment (it hangs on `app.listen()`, likely a Windows Firewall prompt nobody can click in a non-interactive shell) — verified via direct controller/script invocation instead; worth a real run in a normal terminal.

#### Verification
* `cd backend && npx eslint .` and `cd frontend && npx eslint src` — clean on both.
* `cd frontend && npm run build` — succeeds.
* `cd backend && npx jest --runInBand` — 186 passing; the 2 failures are pre-existing and unrelated, confirmed by reproducing them identically against a clean `git stash`ed checkout.
* Applied the migration and ran the seed script for real against the live Supabase database with working Cloudinary credentials; confirmed via a direct controller call that `GET /api/instruments/lab-samples` returns complete, correctly-shaped sample maps for Piano, Tabla, Kompang, and Angklung, and confirmed several of the resulting Cloudinary URLs return `200 OK` / `audio/mpeg` when fetched directly.

---

### Task 2: Guided Music Lessons Rebuild — New Songs, Instrument→Song→Difficulty Flow, Free-Play Keyboard

#### AI Tool Used
Claude

#### Prompts
* "I want to create lesson data for these songs: Our Singapore, Tomorrow's Here Today, You'll Be Okay, Giants (2026). For every song, generate lesson data for Easy (simple melody), Medium (simple melody with harder rhythm), Hard (simple melody with chords). Each lesson should include song title, difficulty, BPM, ordered notes, measure groupings, suggested practice tips. Use the same schema across all songs... I want to build guided music lessons. Flow: instrument → song → difficulty → lesson begins... progress indicator, play/pause, restart, lesson completion... lessons should be data-driven, songs stored separately from lesson logic, difficulty should determine which notes are shown... design so additional songs can easily be added later" — plus two MuseScore links offered as sheet-music references when asked whether illustrative arrangements were acceptable.
* Clarifying answers given during plan mode: chose playback-style teaching (tempo-driven Play/Pause/Restart with a progress indicator) over keeping the old call-and-response "tap the right key" mechanic; chose to migrate the 3 existing songs into the new schema/flow rather than keep two parallel lesson systems; confirmed illustrative-but-grounded note data was acceptable once real sheet music proved unreachable (MuseScore blocked automated access with a 403).
* Approved the written implementation plan via ExitPlanMode, with one explicit condition: "yes, but make sure the rhythm game isnt affected please."
* "teach me how to play the song after letting the user hear the sample of the song as well, similar to what i had previously."
* "can you allow the users to click keys on their keyboards to play the notes, similar to instrument discovery lab?"
* Screenshot of the free-play keyboard + "include sharps/flats in the notes as well please" — the keyboard only showed the instrument's natural notes, so notes like F#4 (visibly used in the song's measure display) had no way to be played.
* "add all changes made to shermaine's ai development journal with the same date (6 august) and include all changes/debugging done. follow journal format."

#### Files Created
* `frontend/src/data/songs.js`
* `frontend/src/utils/songTiming.js`
* `frontend/src/hooks/useSequencePlayer.js`, `frontend/src/hooks/useSequencePlayer.test.js`
* `frontend/src/hooks/useSongProgress.js`, `frontend/src/hooks/useSongProgress.test.js`
* `frontend/src/components/lessons/InstrumentPicker.jsx`, `frontend/src/components/lessons/SongCard.jsx`, `frontend/src/components/lessons/DifficultyPicker.jsx`, `frontend/src/components/lessons/SequenceProgress.jsx`, `frontend/src/components/lessons/LessonKeyboard.jsx`
* `frontend/src/pages/GuidedMusicLessons.test.jsx`

#### Files Deleted
* `frontend/src/hooks/useLessonProgress.js` (superseded by `useSongProgress.js` — confirmed unused elsewhere via grep before deleting)
* `frontend/src/components/lessons/LessonSection.jsx` and `frontend/src/components/lessons/LessonCard.jsx` (the old call-and-response practice mechanic and its fixed-difficulty song card, both replaced outright rather than kept alongside the new flow)

#### Files Modified
* `frontend/src/pages/GuidedMusicLessons.jsx` (rewritten as a 4-stage machine)
* `frontend/src/components/lessons/LessonPlayer.jsx` (rewritten for playback transport, then extended twice more for the listen-gate and free-play keyboard)
* `frontend/src/App.css`

#### Changes Made

**Song data (`data/songs.js`)**
* Authored all 7 songs — the 4 new ones plus the 3 existing ("Count On Me, Singapore," "Home," "Stand Up for Singapore," the latter two previously locked placeholders with zero note content) — in one consistent schema: `{ id, title, subtitle, description, icon, keySignature, year, difficulties: { easy, medium, hard } }`, each difficulty carrying `bpm`, `isEstimate`, `timeSignature`, an ordered `steps` array (each step `{ measure, beats, type, notes }`, where `notes` is `[]` for a rest, one entry for a melody note, or several for a chord), and `practiceTips`.
* Grounded the illustrative arrangements in real key/chord/tempo research: "Our Singapore" (D major, 105 BPM, D-G-A-D) and "Tomorrow's Here Today" (D major voicing of a recording in E, 129 BPM, D-G-Bm-A) came from confirmed sources; "You'll Be Okay" and "Giants (2026)" (both released May 2026) had no tempo found anywhere searched, so their BPM is flagged `isEstimate: true`.
* Built Easy/Medium/Hard mechanically from one melody+chord definition per song via small builder functions, rather than hand-writing roughly 340 note objects: Easy is flat one-beat-per-note; Medium keeps the same pitches but splits one note per measure into a repeated eighth-note pair (more notes, harder rhythm); Hard keeps Easy's rhythm but promotes each measure's downbeat to a full chord (melody note plus that measure's harmony triad, deduplicated by label).
* Every note is a self-contained `{ label, frequency }` pair rather than a lookup key into the chosen instrument's own note list, so any song plays correctly on any instrument regardless of that instrument's actual range (piano has no sharps; angklung has only 5 notes; kompang/tabla aren't even pitched).

**Playback engine**
* Added `useSequencePlayer.js`: a state-driven hook (no changes to the existing `useInstrumentAudio.js`) that plays the current step's notes and schedules one `setTimeout` to advance, cancelled via the effect's own cleanup function on pause or step change — that cancellation is what makes Pause freeze exactly in place and Play resume from that same note rather than from the top. `restart()` seeks to step 0, continuing playback if it was already running or staying paused if it wasn't.
* Added `useSongProgress.js`, replacing `useLessonProgress.js`: tracks per-song, per-difficulty completion under a new `songLessonProgress:<songId>` localStorage key (not a migration of the old `lessonProgress:<id>` shape, since the interaction model changed completely from section-counting to difficulty-completion).

**Page flow**
* Rebuilt `GuidedMusicLessons.jsx` as a linear instrument → song → difficulty → lesson stage machine, reusing the existing `useLabInstruments()` hook and the Instrument Lab's own `InstrumentCard` for instrument selection, a new `SongCard` grid (dropping the old fixed-difficulty badge and locked "Coming Soon" state, since every song now has real content at every difficulty), a new `DifficultyPicker` showing BPM and estimated duration per tier, and a rewritten `LessonPlayer`.
* `LessonPlayer` now has two sub-stages, mirroring the flow the lesson used to have: **Step 1 · Listen** — a "▶ Play Sample" button lets the learner hear the full difficulty's sequence before committing, with a "Start Learning the Notes" button that explicitly resets playback to note 1 (even mid-sample) before switching to **Step 2 · Learn** — the tempo-driven Play/Pause/Restart transport, a measure-grouped note-sequence display (`SequenceProgress`), and the difficulty's practice tips.
* Added `LessonKeyboard.jsx`: a free-play keyboard shown during the Learn stage, letting the learner click a key or press its bound physical letter to hear that note on the chosen instrument — mirroring the Instrument Discovery Lab's `InstrumentPlayer` key-binding pattern. Its note set (and letter assignment) is derived from the actual notes the current song difficulty uses, low to high, not from the instrument's fixed scale — so sharps/flats like F#4 or C#5 are always playable even on an instrument whose own notes are all naturals, and sharp/flat keys get a distinct darker "black key" look.

**CSS**
* Removed roughly 150 lines of now-dead rules for the deleted call-and-response mechanic (`.lesson-key`, `.lesson-section__*`, `.lesson-phrase*`, the old `.lesson-card*`, `.lesson-listen__play/__hint/__continue`) after confirming via grep that no remaining `.jsx` file referenced them, and updated the reduced-motion media query's selector list to match. Added new rules for the instrument/song/difficulty pickers, the transport buttons, the note-sequence chips, and the free-play keyboard (reusing the Lab's `.lab-keyboard`/`.lab-key` layout, recoloured to the lesson page's rose palette).

#### How AI Helped
* Ran Explore agents against the existing `GuidedMusicLessons.jsx`/lesson components/`useInstrumentAudio.js` and a Plan agent for the schema/architecture design before writing anything, and asked clarifying questions (interaction model, migration scope, content accuracy) rather than guessing — the interaction-model answer in particular changed the whole shape of the rebuild (playback transport instead of call-and-response).
* When the user's two MuseScore reference links returned HTTP 403 (bot-blocked) via `WebFetch`, didn't give up on grounding the content — searched chord-chart and BPM-lookup sites instead (chordu.com, songbpm.com, Ultimate Guitar search snippets) to confirm real keys/chords/tempo for two of the four songs, and was upfront that the other two (both brand-new May 2026 releases) had no confirmed tempo anywhere searched.
* A first draft of `useSequencePlayer` failed ESLint's `react-hooks` rules three separate ways in one pass (ref mutation during render, a self-referencing `useCallback` accessed before its own declaration, and synchronous `setState` inside an effect body) — read each rule's actual explanation rather than disabling the rule, and redesigned the hook around plain state plus an effect's cleanup function instead of refs.
* Caught a real bug in its own first draft before any test caught it: chord steps were being played via `playChord()`, which looks each note up against the *instrument's own* note list and silently drops anything not on it — exactly the failure mode the "self-contained note data" design was meant to prevent (e.g. every F#4/C#5 chord tone would have been silently dropped on Piano). Fixed by calling `playNote()` directly per note instead.
* Debugged its own test suite empirically rather than guessing at fixes: an arrow-function `AudioContext` mock threw `is not a constructor` (fixed by using a plain `function`); a missing `close()` method on that mock threw during unmount cleanup; two fake-timer assertions failed when a single large `vi.advanceTimersByTime()` call was used across a chain of recursively-rescheduled timers, traced to React's effect-flush timing and fixed by advancing in per-step chunks each wrapped in its own `act()`; and an ambiguous "multiple elements found" failure was traced to the page's pre-existing hero button and the new "Start Learning" button sharing the same accessible name, fixed by renaming the new one.
* Verified the "don't break the rhythm game" condition directly rather than asserting it: grepped the entire `src/game/` engine and every `Rhythm*` page/component for every symbol this work touched (zero matches — confirmed it's a fully separate feature sharing only the untouched `useInstrumentAudio.js`/`data/instruments.js`), then explicitly re-ran all 32 rhythm-game tests with the changes in place. Separately, when a full-suite run surfaced 4 unrelated failing tests elsewhere, confirmed via `git stash` that they failed identically on the clean baseline before concluding they were pre-existing and not a regression from this work.
* Computed the actual maximum number of unique notes any single song/difficulty uses (11, via a one-off Node script against the finished data) before sizing the free-play keyboard's key-binding pool, rather than guessing a number that might run out for a future song.

#### Decisions Made
* Migrated all 3 pre-existing songs into the new schema/flow rather than keeping the old call-and-response lesson system running alongside it, per the user's explicit choice — one unified page and data model going forward.
* Kept illustrative note data honest about its own confidence: two songs' BPM came from confirmed sources, the other two are explicitly flagged `isEstimate: true` in the data itself, not just in a comment.
* Generated Medium/Hard mechanically from each song's single melody+chord definition instead of hand-authoring three full note lists per song, trading a small amount of upfront design complexity for guaranteed musical consistency across tiers and much cheaper future song additions.
* Made the free-play keyboard's note set (and key bindings) derive from the song's own notes rather than the instrument's fixed scale, so sharps/flats are never unreachable regardless of which instrument is chosen.
* Gave "Restart" state-aware behaviour (keep playing if already playing, stay paused if not) instead of always forcing playback, while making the Listen→Learn transition unconditionally reset to note 1, since those are different real user intents (seeking within a lesson vs. starting a lesson fresh).
* Used a new `songLessonProgress:` localStorage key prefix instead of migrating the old `lessonProgress:` shape, since section-completion counts have no meaningful mapping onto difficulty-tier completion — old keys are left as harmless orphaned entries rather than fabricating migrated progress.

#### Remaining Work
* All 7 songs' note/rhythm data is still simplified and illustrative, not verbatim transcriptions — same standing caveat as the original "Count On Me, Singapore" lesson.
* "You'll Be Okay" and "Giants (2026)" BPM values are estimates; no confirmed tempo was found for either at authoring time.
* None of the 4 new songs have real recorded audio wired in yet — they play through the same synthesis-or-real-sample instrument voice as everything else in this feature, per the existing `useInstrumentAudio` swap-in design from the 13 July session.
* The 4 pre-existing failing tests found while running the full suite (`App.test.jsx`, `ReflectionModeration.test.jsx`, `UserProfileSystem.test.jsx`, `pendingScoreClaim.test.js`) are still unfixed — confirmed unrelated to this work but remain outstanding.

#### Verification
* `cd frontend && npx eslint <changed files>` — clean after every round of changes, including the two follow-up extensions.
* `cd frontend && npm run build` — succeeded after every round of changes.
* CSS brace balance (`{`/`}` count) checked directly after each App.css edit to catch a stray bracket before running anything else.
* `cd frontend && npx vitest run` on the new/changed files — 15 tests passing across `useSequencePlayer.test.js`, `useSongProgress.test.js`, and `GuidedMusicLessons.test.jsx` (instrument→song→difficulty→lesson navigation, back-navigation at each stage, Play/Pause/Restart timing via fake timers, the Listen→Learn reset, and both click and physical-keydown paths on the free-play keyboard).
* Explicitly re-ran `RhythmGame.test.jsx`, `RhythmHub.test.jsx`, `RhythmResults.test.jsx`, `RhythmScoreClaim.test.jsx`, `RhythmLeaderboard.test.jsx`, `rhythmScoring.test.js`, and `RegistrationScoreClaimFlow.test.jsx` (32 tests) with all changes in place — all passing, confirming the rhythm game is unaffected.
* Ran the full frontend suite once; of the failures found, confirmed via `git stash` (reverting to the clean baseline and re-running the same 4 failing files) that they fail identically without this work, i.e. pre-existing and unrelated.

---

## Scope Note

This journal only covers sessions this assistant has direct transcript access to. It does not retroactively reconstruct earlier sessions (including ones reflected only in git history, such as commits predating this file) — those would need their prompts/summaries supplied directly to be added accurately.
