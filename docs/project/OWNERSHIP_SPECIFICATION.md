# Shades of SG – Page Ownership & Design Specification (MVP)

**Last updated:** 8 August 2026
**Document purpose:** Preserve the original page-ownership presentation while distinguishing original responsibility from later shared implementation and maintenance.

## 1. Product Overview

Shades of SG is a public learning and music experience with a creator workflow for song setup, AI-assisted generation, rhythm content, publishing, and community moderation. It also includes registered-user profiles and an administrator governance console.

### Target Users
- Guest user
- Registered user
- Creator
- Administrator

### MVP Principle
Design around feature ownership, not one-page-per-edge-case. Keep the core screens lean and let secondary actions live inside the main pages as tabs, drawers, modals, or sections.

Ownership in this document means original feature responsibility. Later integration or maintenance is shown separately and does not erase the original owner's work.

---

## 2. Final Ownership Matrix

### Lia

**Original ownership:**
- Landing
- Home/public entry experience
- Songs Library
- Authentication flow
- Settings
- Shared navbar
- Guest states
- Error and loading states

**Later implemented contributions:**
- Song bookmarks
- Song reporting and its admin review surface
- Email/account settings work
- Account deletion and administrator user-management work

**Shared integration:**
- Ferlyn contributed substantial backend authentication, OTP, OAuth, profile, route-restoration, lifecycle, and public-data integration.

### Htet

**Original ownership:**
- Song Experience
- Trivia
- AI Generation Status
- AI scene/frame/video generation services
- Video player component
- Subtitle component
- Instrument display component

**Later implemented contributions:**
- Early lifecycle, score, and beatmap migration fixes during integration
- Generation and video-service maintenance

**Shared integration:**
- Ferlyn contributed the current Studio lifecycle, ownership checks, generation orchestration, song sections, and public-song integration.

### Shermaine

**Original ownership:**
- Creator Dashboard
- Learning Hub
- Instrument Playground
- Badge page
- Dashboard widgets
- Creator navigation

**Later implemented contributions:**
- Instrument Discovery Lab audio samples
- Guided Music Lessons rebuild
- Badge catalog, login streak, keepsake, challenge-progress, and song-exploration work

**Shared integration:**
- Ferlyn contributed creator workflow and profile integration; Lia/Ferlyn profile work supplies shared user settings used by badge and keepsake displays.

### Ferlyn

**Original ownership:**
- Studio
- Preview and publishing
- Rhythm Game
- Reflection Wall
- Reflection Moderation
- Profile
- Metadata form
- Publish toggle
- Reflection CRUD states
- Ownership of Supabase, Render, Vercel, and production deployment settings

**Later implemented contributions:**
- Canonical Song and GenerationJob lifecycles
- Multi-creator ownership isolation
- Creator applications and creator-mode separation
- Administrator console: overview, analytics, content, community, and safety workflows
- User/creator profile and interest integration
- Guest-score claiming, leaderboards, discussion comments/likes, and current song-section workflow

**Shared integration:**
- Htet contributed generation and early beatmap/score work.
- Lia contributed settings, bookmarks, reports, deletion, and user-management work.
- Shermaine contributed creator navigation, learning, badges, and keepsake/profile elements.

## 3. Shared Design System

Design these once and reuse across all pages:
- Typography
- Colour scheme
- Spacing scale
- Buttons
- Inputs
- Cards
- Badges
- Modals and confirmation dialogs
- Tabs and filter controls
- Empty states
- Loading skeletons
- Error and retry states
- Responsive rules
- Focus-visible and reduced-motion behavior
- Public, creator, and administrator navigation shells

Current implementation uses shared and feature-specific components under `frontend/src/components`, with layouts under `frontend/src/layouts`. Shared visual implementation does not change original page ownership.

## 4. Shared Behavior Notes

### Mobile Navbar
- Logo
- Hamburger menu
- Easy-to-tap navigation and CTA buttons
- Public, creator, and administrator variants
- No horizontal overflow on tested mobile routes

### Guest Session State
- Guests can browse published songs, use learning routes, play Rhythm Game, view leaderboards, and read approved reflections.
- Guests may submit an anonymous pending reflection.
- Guest rhythm results are temporary browser state and are not stored as a GameScore until authenticated claim.
- “Sign in to save progress” or equivalent authentication prompts are used for persisted actions.
- Safe protected routes are restored after authentication; unsafe external return paths are rejected.

### Home vs Landing Page
- The current route `/` is the shared public landing/home experience.
- The original separate `/home` page is not implemented and should not be presented as current.
- Signed-in users receive account-aware navigation and content on the shared experience.

### Reflection Page
- Original moderation ownership remains with Ferlyn.
- Guest and registered submissions begin `PENDING`.
- Registered owners may edit/delete their own reflections.
- Creators moderate only reflections attached to their own songs.
- Administrators have platform-wide moderation, warning, report, and audit authority.
- Approved reflections support authenticated comments and likes.

### Navbar Variants

1. Guest Navbar
Navigation:
- Logo/Home
- Songs
- Learning Hub
- Rhythm Game
- Reflection Wall
- Login
- Register

2. Registered User Navbar
Navigation:
- Logo/Home
- Songs
- Learning Hub
- Rhythm Game
- Reflection Wall
- Profile
- Settings
- Creator application (registered users)
- Logout

3. Creator Navbar
Navigation:
- Dashboard
- Studio
- My Songs
- AI Generation
- Manage Reflections
- Creator Profile
- Switch to user mode
- Shared Settings
- Logout

4. Administrator Navbar
Navigation:
- Overview
- Users
- Creators and applications
- Content
- Community
- Activity
- Logout

Navigation Rules:
- Guest → Registered after registration, email verification, and login
- Registered users apply for creator access; they do not self-register directly as creators
- Creator mode requires `role=CREATOR`, active account, and active creator access
- Creator-tool suspension does not automatically suspend the user's normal public account
- Administrator routes require `role=ADMIN`

---

## 5. Sitemap

```
Public / Guest
│
├── Landing (`/`)
├── Songs Library (`/songs`)
│     └── Song Experience (`/songs/:id`)
│             ├── Trivia (`/songs/:id/trivia`)
│             ├── Instrument Playground (`/songs/:id/playground`)
│             └── Rhythm Game (`/game/:songId`)
├── Learning Hub (`/learning`)
│     ├── Heritage Vault
│     ├── Instrument Discovery Lab
│     └── Guided Music Lessons
├── Rhythm Hub and Leaderboard
├── Reflection Wall
├── Public User / Creator Profiles
└── Login / Register / Verification / Recovery

Registered User
│
├── Profile
├── Settings
├── Creator Application
└── Guest Score Claim

Creator
│
├── Dashboard
├── Studio
├── My Songs
├── Generation Jobs
│     ├── Generation Progress
│     └── Video Editor
├── Reflection Moderation
└── Creator Profile

Administrator
│
├── Overview
├── Users and User Detail
├── Creators and Applications
├── Content and Collections
├── Community and Safety
└── Activity and Audit Logs
```

## 6. Page Breakdown

### Lia Pages

#### Landing Page
**Route:** `/`

**Components:**
- Guest/registered navbar
- Hero section
- Feature journey
- Featured published songs
- Reflection/community preview
- CTA sections
- Footer
- Loading and API-degraded states

**Later shared work:** Ferlyn integrated current published-song lifecycle, statistics, authentication, and public profile behavior.

#### Home Page
**Original Route:** `/home`

**Current Status:** Deprecated as a separate route. Account-aware home behavior is integrated into `/`, Profile, Learning Hub, and navigation components.

#### Songs Library
**Route:** `/songs`

**Components:**
- Search
- Theme/language/mood filters
- Sort controls
- Song catalogue and preview panel
- Bookmark action
- Song-report dialog
- Loading, empty, retry, and responsive states

#### Authentication Flow
**Routes:** `/login`, `/register`, `/verify-email`, `/registration-success`, `/forgot-password`, `/reset-password`

**Components:**
- Login and strong-password registration forms
- Email verification and resend OTP
- Password-reset request, verification, and completion
- Configured Google/Apple buttons
- Safe return-path restoration
- Guest-score claim continuation
- Validation, success, cooldown, expiry, and suspension states

#### Settings
**Routes:** `/settings`, `/settings/profile`, `/settings/account-security`, `/settings/data-privacy`

**Components:**
- Shared profile information and avatar
- Bio and cultural-interest tags
- Preferred language/location
- Theme, font-size, and reduced-motion preferences
- Public visibility and profile-section toggles
- Password reset and email change
- Hard-delete account confirmation

#### Shared States
**Components:**
- Public and signed-in navigation
- Authentication-required modal
- Account/creator-access suspended states
- Loading skeletons
- Empty states
- Not Found page
- Generic retry/error state

---

### Htet Pages

#### Song Experience
**Route:** `/songs/:id`

**Components:**
- Custom video/audio player
- Formatted lyrics and song sections
- Song details and cultural summary
- Instrument content
- Creator attribution
- Trivia, playground, rhythm, and reflection links
- Invalid/unpublished/missing-content states

#### Trivia
**Route:** `/songs/:id/trivia`

**Components:**
- Question cards
- Answer options
- Immediate feedback
- Result and retry state
- Explicit fallback/unavailable content handling

**Current Limitation:** A complete database-backed content-authoring and attempt-history workflow is not established for every Song.

#### AI Generation Status
**Routes:** `/creator/generation`, `/creator/generation/:id`

**Components:**
- Job list and status filters
- Current stage and progress
- Polling state
- Failure and retry information
- Owner-scoped navigation to Video Editor

---

### Shermaine Pages

#### Creator Dashboard
**Route:** `/creator/dashboard`

**Components:**
- Song and workflow summary cards
- Recent songs
- Generation status/actions
- Moderation and Studio quick links
- Creator account/mode controls

#### Learning Hub
**Route:** `/learning`

**Components:**
- Learning introduction
- Heritage, instrument, and guided-lesson entry cards
- Song learning links
- Empty/unavailable states

#### Instrument Playground
**Routes:** `/songs/:id/playground`, `/learning/instrument-lab`

**Components:**
- Instrument selection
- Real sample playback
- Visual key/note feedback
- Instructions and challenges
- Authenticated challenge progress

#### Badge Page
**Current Location:** Badge shelf, Profile, creator/profile keepsakes, and related components rather than a standalone `/badges` route.

**Components:**
- Canonical badge definitions
- Earned/locked states
- Category and sticker presentation
- Login streak, reflection, playground, and song-exploration awards

#### Creator Navigation
**Components:**
- Dashboard
- Studio
- My Songs
- Generation Jobs
- Manage Reflections
- Creator Profile
- Account and mode switching

---

### Ferlyn Pages

#### Studio
**Routes:** `/creator/studio/new`, `/creator/studio/:songId`

**Components:**
- Persistent draft and metadata stepper
- Title, artist, theme, languages, mood, and description fields
- Cover/audio/video upload
- Whisper transcription
- Rich lyrics editor
- AI-assisted song-section recommendations and validation
- Beatmap generation/publishing panel
- Readiness checklist and preview/publish panel

#### Preview
**Current Location:** Integrated into Studio and the Video Editor instead of a standalone `/preview/:songId` route.

**Components:**
- Public-style song preview
- Media and readiness status
- Explicit publish confirmation
- Return-to-edit actions

#### Rhythm Game
**Routes:** `/rhythm-game`, `/rhythm-game/leaderboard`, `/game/:songId`, `/game/:songId/results`, `/rhythm-game/claim`

**Components:**
- Song/difficulty selection
- Falling notes and timing/scoring engine
- Accuracy, combo, score, and rank
- Results and leaderboard
- Guest authentication/claim flow
- Creator beatmap preview

#### Reflection Wall
**Route:** `/reflections`

**Components:**
- Approved reflection feed
- Song/tag filtering
- Guest/registered submission
- Anonymous/profile display
- Owner edit/delete
- Likes and discussion comments

#### Reflection Moderation
**Route:** `/creator/reflections`

**Components:**
- Owner-scoped moderation queue
- Status/search/song/date/anonymous filters
- Reflection detail panel
- Approve, flag, reject, delete, note, and warning actions

#### Profile
**Routes:** `/profile`, `/users/:userId`, `/creators/:creatorId`, `/creator/profile`, `/creator/profile/edit`

**Components:**
- Shared user identity and privacy
- Rhythm scores/ranking
- Reflection history
- Badge shelf and keepsakes
- Creator biography/social links and published songs

---

#### Creator Application
**Route:** `/apply/creator`

**Current Contribution Evidence:** Primarily Ferlyn implementation

**Components:**
- Draft application
- Resume upload/download/removal
- Introduction, experience, motivation, ideas, guidelines, and links
- Submission, withdrawal, feedback, and history

#### Administrator Console
**Routes:** `/admin`, `/admin/users*`, `/admin/creators`, `/admin/content`, `/admin/community`, `/admin/activity`

**Current Contribution Evidence:** Shared Ferlyn/Lia implementation

**Components:**
- Overview and analytics
- User details, email correction, reset link, suspension, restoration, and deletion
- Creator/application review and creator-access suspension
- Song lifecycle, reports, folders, and placement proposals
- Reflection/community safety, warnings, moderation actions, and audit logs

---

## 6. Badge Design Notes

### Lia
- Song discovery and bookmark/report experiences
- Original concepts: first login, heritage explorer, song discoverer
- Current integration: song exploration awards are implemented through Shermaine's badge catalog work

### Htet
- Trivia and song-experience achievements remain suitable concepts
- No unsupported trivia badge is claimed as implemented

### Shermaine
- Owns current badge catalog/display work
- Implemented login-streak, playground, reflection, and song-exploration definitions and presentation

### Ferlyn
- Rhythm, reflection, and profile surfaces expose earned achievements
- Badge catalog ownership remains Shermaine-led even where badges display on Ferlyn-owned Profile pages

---

## 7. Scope Guideline

Current submission-critical scope:
- Landing and Songs Library
- Authentication, verification, recovery, and settings
- Song Experience
- Creator Dashboard and Studio
- AI generation status with honest placeholder limitation
- Learning Hub and instrument experiences
- Rhythm Game, results, leaderboard, and guest claim
- Reflection Wall, discussions, and moderation
- User/creator profiles
- Creator applications
- Administrator governance and safety

Do not claim the following as fully implemented:
- Dependable final AI MP4 generation without placeholder fallback
- Complete database-backed lesson/trivia authoring for every Song
- A standalone Home, Badge, Preview, or Lessons API route where the current router does not define one
- Planned notification, data-export, or multiple fully designed theme systems

---

## 8. Migration Contribution Notes

Migration attribution already recorded in file headers is retained without further assignment in this update.

### Ferlyn Ng
- Guest reflections and moderation (`002`, `003`)
- Studio media, multi-creator roles, applications, folders, safety, analytics, authentication, OAuth, profiles, interests, score claims, discussions, and admin indexes (`010`–`020`, selected `021`–`024`)

### Lia Insyirah
- Song bookmarks (`021_song_bookmarks.sql`)
- Account deletion and hard-delete compatibility (`025_account_deletion.sql`, `026_account_hard_delete.sql`)
- Song reports (`025_song_reports.sql`)

### Shermaine
- Login streaks, badges, and instrument challenges (`024_badges_streaks_and_challenges.sql`)
- Instrument Lab samples (`025_instrument_lab_samples.sql`)
- Badge definitions and song-exploration badges (`026_badge_definitions.sql`, `027_song_exploration_badges.sql`)

### Shared — Ferlyn Ng and Htet Aung
- Initial schema and early lifecycle/generation/score/beatmap alignment (`001`, `004`–`009`)

### Needs Team Confirmation
- Migration `028_song_section_recommendations.sql` ownership
- Whether commits by `Solitice-debug <250466Q@mymail.nyp.edu.sg>` should be attributed to Ferlyn Ng
