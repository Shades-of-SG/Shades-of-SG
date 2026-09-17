# React + Vite

This directory contains the Shades of SG React 19 and Vite 8 single-page application. It provides public, registered-user, creator, and administrator routes defined in `src/App.jsx`.

Install and verify from this directory with:

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
npm run test:e2e
```

Copy `.env.example` to `.env` and set `VITE_API_URL` to the backend API base including `/api`. Do not commit real deployment values.

## Landing/Home implementation

`src/pages/Landing.jsx` owns the shared public/account-aware Home route `/`. `Landing.css` contains its responsive refinements; shared navigation and footer keep their existing styles. Journey navigation reuses `FeatureCard` with a decorative arrow inside each full-card link. `SongCard` uses `variant="featured"` only for the Home preview; existing default/library variants remain available.

Home continues to request `getPublishedSongs({ limit: 5, page: 1 })` and `getReflections(token)` through the existing public-song/reflection services. It displays up to five items in each existing carousel. The former count-statistics section and requests are removed, while signed-in badge and best-score requests remain. Reflection likes use the existing like/unlike services with request guards and rollback; discussions reuse `ReflectionDiscussionModal`. Ownership edit/delete tools remain on the Reflection Wall. Both creator CTAs use the existing guarded `/apply/creator` route.

Featured artwork loads lazily and falls back when absent or broken. Home styling supplies mobile card stacking, visible focus, equal carousel-card heights and reduced-motion behaviour; carousel scrolling also checks the motion preference. Focused browser coverage is in `e2e/landing.spec.js`; commands and limits are in the [Playwright guide](../docs/guides/PLAYWRIGHT_TESTING.md).

## React Compiler

The current project does not enable React Compiler. Components use standard React hooks and the existing Vite React plugin. Any future compiler adoption should be tested against the media player, rhythm engine, authentication context, and current component suite before changing production configuration.

The frontend is organised into `pages`, `components`, `layouts`, `services`, `context`, `hooks`, `game`, `utils`, and `data`. Frontend route guards guide navigation, but the Express API remains the authorization boundary.

## Expanding the ESLint configuration

The project uses the JavaScript ESLint configuration in `frontend/eslint.config.js`. Keep new code covered by the existing React Hooks and React Refresh rules. If TypeScript is introduced later, add type-aware rules only as part of a deliberate project-wide migration.

Vitest component/service tests use jsdom. Playwright intercepts `/api/**` with deterministic fixtures and does not validate a live backend or database. See [`../docs/guides/PLAYWRIGHT_TESTING.md`](../docs/guides/PLAYWRIGHT_TESTING.md) and [`../docs/reference/ROUTE_INVENTORY.md`](../docs/reference/ROUTE_INVENTORY.md).
