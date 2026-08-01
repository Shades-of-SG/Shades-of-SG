# Playwright end-to-end testing

The browser suite is isolated from the application database. It intercepts `/api/**` in the browser and supplies deterministic registered-user, creator, suspended-creator, and administrator fixtures from `frontend/e2e/support/testHarness.js`. It never starts the Express backend, runs migrations, resets data, or seeds the local/production database.

## Local commands

From the repository root:

```powershell
npm.cmd install --prefix frontend
npm.cmd run test:e2e:install --prefix frontend
npm.cmd run test:e2e --prefix frontend
```

Playwright starts Vite on `http://127.0.0.1:4173` automatically. Set `PLAYWRIGHT_BASE_URL` only when testing an already-running frontend:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:5173'
npm.cmd run test:e2e --prefix frontend
```

No database credentials or test-account environment variables are required for the mocked suite. If a future separate live-backend project is added, it must use dedicated non-production accounts and an isolated database; do not point these tests at production.

On failure, screenshots, videos, and traces are written below `frontend/test-results`. The HTML report is written to `frontend/playwright-report`. GitHub Actions uploads both directories only when the job fails.
