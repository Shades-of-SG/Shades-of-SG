# Playwright end-to-end testing

Last updated: 16 September 2026 (Landing/Home coverage)

Purpose: explain the isolated mocked-browser suite and safe local commands.

The browser suite is isolated from the application database. It intercepts `/api/**` in the browser and supplies deterministic registered-user, creator, suspended-creator, and administrator fixtures from `frontend/e2e/support/testHarness.js`. It never starts the Express backend, runs migrations, resets data, or seeds the local/production database.

## Local commands

From the repository root:

```powershell
npm.cmd install --prefix frontend
npm.cmd run test:e2e:install --prefix frontend
npm.cmd run test:e2e --prefix frontend
```

Playwright builds the frontend and starts Vite preview on `http://127.0.0.1:4173` automatically. Set `PLAYWRIGHT_BASE_URL` only when testing an already-running frontend:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:5173'
npm.cmd run test:e2e --prefix frontend
```

No database credentials or test-account environment variables are required for the mocked suite. If a future separate live-backend project is added, it must use dedicated non-production accounts and an isolated database; do not point these tests at production.

On failure, screenshots, videos, and traces are written below `frontend/test-results`. The HTML report is written to `frontend/playwright-report`. GitHub Actions uploads both directories only when the job fails.


## Focused Landing/Home checks

From the repository root (PowerShell):

```powershell
npm.cmd run test --prefix frontend -- src/pages/Landing.test.jsx src/components/ReflectionCard.test.jsx src/components/ReflectionDiscussionModal.test.jsx
npm.cmd run test --prefix frontend -- src/App.test.jsx -t 'renders the public landing shell|preserves an authenticated creator in User Mode across a direct root refresh|redirects guests away from the creator moderation route'
npm.cmd run test:e2e --prefix frontend -- landing.spec.js --reporter=line
npm.cmd run build --prefix frontend
npm.cmd run lint --prefix frontend
```

The Home browser file adds six tests: four viewport checks (1440, 768, 390 and 320 pixels), all Home/navbar/footer internal link destinations, and registered creator-application entry. It covers API-supplied previews, removed count-statistics cards, visible focus, keyboard activation of journey links, equal card heights, carousel navigation under reduced motion, discussion comments/focus restoration, mocked likes and Home refresh. Broken-artwork and missing-metadata fallbacks are covered by the component tests. This is Chromium viewport emulation, not real-device or screen-reader certification.

If the default browser cache is unavailable, install into the project's ignored dependency cache and keep the variable set for the test run:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) 'frontend/node_modules/.cache/ms-playwright'
npm.cmd run test:e2e:install --prefix frontend
npm.cmd run test:e2e --prefix frontend -- landing.spec.js --reporter=line
```

Dated execution results and unrelated baseline failures are recorded in [Ferlyn's journal](../journals/ferlyn/Ferlyn_AI_ASSISTED_DEVELOPMENT_JOURNAL.md). The separate read-only live API/browser checks performed during this phase were supplemental checks, not part of this mocked Playwright suite; no live like/comment writes were tested.
