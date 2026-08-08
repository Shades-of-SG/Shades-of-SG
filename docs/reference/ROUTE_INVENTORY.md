# Frontend route and navigation inventory

Last updated: 8 August 2026

Purpose: record the current React routes, access boundaries, entry points and page states. The inventory was rechecked against `frontend/src/App.jsx`; the branch name in the original audit note below is historical.

Audited against `frontend/src/App.jsx` on the `ferlyn-continued` branch. “Back” means the rendered page has a persistent shell navigation or an explicit back/exit action. State columns are `loading / empty / unauthorised / invalid ID`; `n/a` means the state does not apply to that route.

| Route | Required role/account state | Component | UI entry points | Back | States |
|---|---|---|---|---|---|
| `/` | Guest or active registered/creator account in user mode | `Landing` in `MainLayout` | Public navbar Home and brand; auth brand; footer brand; Not Found Return Home; suspended-account sign-out; creator user-mode switch; creator-application Return home | Navbar/footer | yes / yes / n/a / n/a |
| `/songs` | Public | `SongsLibrary` in `MainLayout` | Public navbar; footer; Landing hero, feature, featured-song and CTA links; profile empty states; public-profile error links; song/trivia/playground back links | Navbar/footer | yes / yes / n/a / n/a |
| `/songs/:id` | Public; song must be published | `SongExperience` | Song cards/catalogue/preview; featured/recommended cards; learning song cards; creator/public-profile published-song cards; rhythm-results Back to Song | Navbar/footer plus Back to Songs on error | yes / partial-content fallbacks / n/a / yes |
| `/songs/:id/trivia` | Public; song must be published | `TriviaHub` | Song Experience Start Trivia; Learning Hub song action | Navbar/footer plus Back to Song/Choose another song | yes / yes (questions unavailable) / n/a / yes |
| `/songs/:id/playground` | Public; song must be published | `InstrumentPlayground` | Song Experience Open Playground; Learning Hub song action | Navbar/footer plus Back to Song/Choose another song | yes / partial instrument fallback / n/a / yes |
| `/learning` | Public | `LearningHub` | Public navbar; footer; Landing Learn & Play card; Song Experience learning CTA; profile keepsake empty state | Navbar/footer | yes / yes / n/a / n/a |
| `/learning/heritage-vault` | Public | `HeritageVault` | Learning Hub Heritage Vault card; creator public-collection links | Navbar/footer and onward learning cards | no / yes / n/a / n/a |
| `/learning/instrument-lab` | Public | `InstrumentDiscoveryLab` | Learning Hub card; Heritage Vault continue card | Navbar/footer and guided-lessons continuation | no / local fallback content / n/a / n/a |
| `/learning/guided-lessons` | Public | `GuidedMusicLessons` | Learning Hub card; Heritage Vault and Instrument Lab continuation links | Navbar/footer | no / yes when lessons are unavailable / n/a / n/a |
| `/rhythm-game` | Public | `RhythmHub` | Public navbar; footer; Landing rhythm feature; profile rhythm empty state; gameplay Exit; results Return to Rhythm Games | Navbar/footer | yes / yes / n/a / n/a |
| `/rhythm-game/leaderboard` | Public; signed-in users may also receive their own rank; optional `songId` and `period` filters | `RhythmLeaderboard` | Rhythm Hub View Leaderboard; completed non-preview Rhythm Results | Navbar/footer; explicit Back to Rhythm Game; optional Play This Song | yes / yes / n/a / invalid filters surface an API error |
| `/reflections` | Public; posting identity varies by account | `ReflectionWall` | Public navbar; footer; Landing reflection feature/community link; Heritage Vault CTAs; Song Experience and Rhythm Results reflection CTAs | Navbar/footer | yes / yes / contextual auth modal / invalid song query handled |
| `/creators/:creatorId` | Public unless creator profile is private; owner may preview | `PublicCreatorProfile` | `CreatorNameLink` wherever creator names render; Creator Profile Public Preview | Navbar/footer; owner Back to Creator Profile; error to Songs | yes / yes for songs, collections, reflections / n/a / yes |
| `/users/:userId` | Public unless user profile is private; owner may preview | `PublicUserProfile` in wide `MainLayout` | Normal Profile Public preview | Navbar/footer; owner Back to Profile/Edit; error to Songs | yes / optional sections omitted when empty / n/a / yes |
| `/profile` | Active `REGISTERED` or `CREATOR` account | `Profile` | Registered account dropdown; creator User Profile; suspended-creator continuation | Navbar/footer | yes / yes per profile section / redirect to Login / n/a |
| `/apply/creator` | Active `REGISTERED` account only | `CreatorApplication` | Registered account dropdown | Navbar/footer; Return home after submit | yes / yes for application history / role redirect / n/a |
| `/settings` | Active `REGISTERED` or `CREATOR` account | `Settings` | Registered/creator account menus; profile Edit Profile; creator shared-profile edit link; creator Settings navigation | Navbar/footer | yes / no / redirect to Login / n/a |
| `/privacy` | Public | `PrivacyPolicy` | Footer; Register acceptance checkbox | Navbar/footer and section navigation | no / n/a / n/a / n/a |
| `/terms` | Public | `TermsAndConditions` | Footer; Register acceptance checkbox | Navbar/footer and section navigation | no / n/a / n/a / n/a |
| `/login` | Guest; signed-in accounts redirect by role/mode | `Login` in `AuthLayout` | Public navbar; logout actions; Forgot Password/Otp links; protected-route redirect | Auth brand; Register/Forgot Password links | busy/error / no / signed-in redirect / n/a |
| `/register` | Guest; signed-in accounts redirect | `Register` in `AuthLayout` | Public navbar; Login; reflection guest modal | Auth brand; Sign in link | busy/error / no / signed-in redirect / n/a |
| `/forgot-password` | Guest flow (signed-in users redirect except direct account reset behavior) | `ForgotPassword` | Login; Settings Reset password; missing reset session | Auth brand; Back to sign in | busy/error / no / signed-in redirect / n/a |
| `/reset-password` | Guest with reset email/state | `ResetPassword` | Forgot Password submit; direct missing-session recovery | Auth brand; Request reset/Sign in | busy/error / missing-session state / signed-in redirect / n/a |
| `/verify-email` | Guest with pending email/state | `OtpVerification` | Register submit; Login for unverified account | Auth brand; Back to sign in/Create account | busy/error / missing-session state / signed-in redirect / n/a |
| `/registration-success` | Guest registration flow | `RegistrationSuccess` | Successful OTP verification | Auth brand; Continue to sign in | no / no / signed-in redirect / n/a |
| `/creator` | Active creator, active creator access, creator mode | Redirect to `/creator/dashboard` | Legacy/bookmark only | n/a | redirect-only |
| `/creator/dashboard` | Active creator, active creator access, creator mode | `Dashboard` in `CreatorLayout` | Creator sidebar/brand; mode switches | Creator sidebar/account menu | yes / yes / creator/account suspension states or redirect / n/a |
| `/creator/studio` | Active creator in creator mode | Legacy redirect to `/creator/studio/new` | No current navbar/sidebar/card points here | n/a | redirect-only |
| `/creator/studio/new` | Active creator in creator mode | `Studio` | Creator sidebar/Navbar definitions; My Songs Add Song; Creator Profile Create New Song; invalid-draft recovery | Creator sidebar/account menu | no initial load / blank new draft is intentional / creator/account guard / n/a |
| `/creator/studio/:songId` | Active creator in creator mode; owns song | `Studio` | Dashboard recent songs; My Songs edit; Creator Profile song edit; Video Editor publish; rhythm preview return | Creator sidebar/account menu; invalid state to My Songs/New Song | yes / partial draft fields / creator/account guard / yes |
| `/creator/songs` | Active creator in creator mode | `CreatorSongs` | Creator sidebar; dashboard Open Songs; creator-profile View all songs; Studio recovery | Creator sidebar/account menu | yes / yes per filter / creator/account guard / n/a |
| `/creator/generation` | Active creator in creator mode | `CreatorGenerationJobs` | Creator sidebar; dashboard Review Queue; Generation Progress/Editor exits; Studio generation submit | Creator sidebar/account menu | yes / yes per filter / creator/account guard / n/a |
| `/creator/generation/:id` | Active creator in creator mode; owns job | `GenerationProgress` | Jobs View Status; My Songs active generation; Dashboard non-completed jobs; Video Editor Back to Job | Back to Generation Jobs plus sidebar | yes / phase waiting states / creator/account guard / yes |
| `/creator/editor/:id` | Active creator in creator mode; owns completed job | `VideoEditor` | Completed job action in Jobs, Dashboard, My Songs, and Generation Progress | Exit Editor, Back to Job, sidebar | yes / no generated frames state / creator/account guard / yes |
| `/creator/reflections` | Active creator in creator mode | `ReflectionModeration` | Creator sidebar; Creator Profile View All Reflections | Creator sidebar/account menu | yes / yes / creator/account guard and auth-expiry handling / n/a |
| `/creator/profile` | Active creator in creator mode | `CreatorProfile` | Creator account menu; normal Profile Creator profile; public preview owner banner | User Profile link and creator sidebar | yes / yes per section / creator/account guard and auth-expiry handling / n/a |
| `/creator/profile/edit` | Active creator in creator mode | `CreatorProfileSettings` | Creator Profile Edit Profile; public creator owner banner | Back/Cancel to Creator Profile | yes / no / creator/account guard / n/a |
| `/creator/settings` | Active creator in creator mode | Legacy redirect to `/settings` | Legacy/bookmark only; all current UI points directly to `/settings` | n/a | redirect-only |
| `/admin` | Active administrator | `AdminOverview` in `AdminLayout` | Admin sidebar Overview | Admin sidebar/profile menu | yes / yes / redirect to Login / n/a |
| `/admin/creators` | Active administrator; `tab=applications|approved` | `AdminCreatorsPage` | Admin sidebar; overview creator-application action; `/admin/applications` redirect | Admin sidebar | yes / yes / redirect to Login / invalid tab falls back |
| `/admin/content` | Active administrator; `tab=songs|collections|placements` | `AdminContentPage` | Admin sidebar; `/admin/songs` and `/admin/folders` redirects | Admin sidebar | yes / yes / redirect to Login / invalid tab falls back |
| `/admin/community` | Active administrator; `tab=reports|users|warnings` | `AdminCommunityPage` | Admin sidebar; topbar bell; overview attention actions; `/admin/reflections` redirect | Admin sidebar | yes / yes / redirect to Login / invalid tab falls back |
| `/admin/activity` | Active administrator | `AdminActivityPage` | Admin profile menu; `/admin/governance` redirect | Admin sidebar/profile menu | yes / yes / redirect to Login / n/a |
| `/admin/applications` | Active administrator | Redirect to `/admin/creators?tab=applications` | Legacy/bookmark only | n/a | redirect-only |
| `/admin/songs` | Active administrator | Redirect to `/admin/content?tab=songs` | Legacy/bookmark only | n/a | redirect-only |
| `/admin/reflections` | Active administrator | Redirect to `/admin/community?tab=reports` | Legacy/bookmark only | n/a | redirect-only |
| `/admin/folders` | Active administrator | Redirect to `/admin/content?tab=collections` | Legacy/bookmark only | n/a | redirect-only |
| `/admin/governance` | Active administrator | Redirect to `/admin/activity` | Legacy/bookmark only | n/a | redirect-only |
| `/game/:songId` | Public for published chart; creator token required for `preview=1` | `RhythmGame` (standalone) | Rhythm Hub difficulties; Song Experience; song preview panel; Studio beatmap preview; Results Play Again | Explicit Exit/Back to Studio | yes / unavailable chart overlay / preview is permission-gated / yes |
| `/game/:songId/results` | Public; reached after a game or stored local result | `RhythmResults` (standalone) | Automatic game completion; refresh/stored result | Back to Song/Studio, Return to Rhythm Games/Exit Preview | song details load silently / yes (No score yet) / score persistence is account-aware / unavailable-song fallback |
| `*` | Any | `NotFound` | Any unmatched URL | Return Home | n/a / n/a / n/a / invalid route state |

## Audit conclusions

- All current `<Link>`, `<NavLink>`, programmatic `navigate()` destinations, card actions, dropdown actions, back buttons, and creator/admin navigation destinations resolve to a route in `App.jsx`. External `mailto:`, portfolio/social, media, download, and in-page hash links are not router destinations.
- Every non-redirect route is UI-reachable. Redirect-only compatibility routes are intentionally absent from current navigation. Registration verification/success and rhythm results are flow-reachable rather than primary-navigation destinations.
- Creator Generation Jobs remain available in the creator sidebar. Creator-side Collections and Analytics pages have been removed.
- All current Studio navigation points to `/creator/studio/new`; `/creator/studio` remains only for old bookmarks.
- Admin legacy redirects set the destination tab explicitly, and each destination validates `tab` with `useTab`, falling back safely for unsupported values.
- Page-level wrappers (`site-main`, `creator-main`, `.creator-page`, `.profile-page`, `.creator-profile`, and `.studio-page`) use the available width. Remaining `max-width` rules are confined to readable text, forms, modals, navigation bars, and the 1440px admin data canvas; none constrains the public or creator page root. `/users/:userId` now receives `site-main--wide`, matching public creator profiles.

---

## Backend API routes — AI Generation Pipeline

All routes require `requireCreator` middleware (active creator JWT).

| Method | Route | Controller | Purpose |
|---|---|---|---|
| GET | `/api/generation` | `getAllJobs` | List all generation jobs owned by the authenticated creator |
| GET | `/api/generation/:id/status` | `getGenerationStatus` | Poll job status including nested song, scene segments, and generated frames |
| POST | `/api/generation/start` | `startGeneration` | Create a QUEUED generation job for an owned DRAFT/READY song and begin the async pipeline |
| POST | `/api/generation/retry/:jobId` | `retryGeneration` | Reset a FAILED job to PROCESSING and re-enter the pipeline |
| POST | `/api/generation/:jobId/export` | `exportVideo` | Re-assemble video (with optional caption burn) and upload to Cloudinary |
| POST | `/api/generation/frame/:frameId/regenerate` | `regenerateFrame` | Regenerate a single frame image using GPT Image 2 with optional user feedback prompt |
| POST | `/api/generation/:id/edit-advanced` | `editFrameAdvanced` | Update scene visual prompt and lyrics, regenerate frame, optionally propagate to chorus siblings via normalizeCacheKey matching |
| POST | `/api/generation/job/:jobId/assistant-command` | `handleAssistantCommand` | Send natural language command to DeepSeek AI Copilot; returns a read-only JSON patch preview |
| POST | `/api/generation/scene/regenerate-prompt` | `regenerateSingleScenePrompt` | Generate a new visual prompt for given lyrics using DeepSeek/GPT-4o-mini |
| POST | `/api/generation/:id/confirm-scenes` | `confirmScenes` | Accept creator-edited scenes, save SceneSegments, update transcription, and resume pipeline from Phase 3 |
| DELETE | `/api/generation/:id` | `deleteJob` | Delete a non-processing job and its associated song, segments, and frames |

Route file: [`backend/routes/aiGeneration.js`](file:///c:/Users/oxy/WebstormProjects/Shades-of-SG/backend/routes/aiGeneration.js). Controller: [`backend/controllers/generationController.js`](file:///c:/Users/oxy/WebstormProjects/Shades-of-SG/backend/controllers/generationController.js).
