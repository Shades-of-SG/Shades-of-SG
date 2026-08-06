import { expect, test } from '@playwright/test'
import { accounts, authenticateAs, expectHealthyPage, ids, installMockApi, watchRuntime } from './support/testHarness.js'

test('invalid routes and public resource IDs render recoverable states', async ({ page }) => {
  await installMockApi(page)
  const runtime = watchRuntime(page)

  await page.goto('/route-that-does-not-exist')
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Return Home' })).toHaveAttribute('href', '/')

  const cases = [
    ['/songs/invalid-resource-id', /Published song not found|Resource not found/i],
    ['/songs/invalid-resource-id/trivia', /Resource not found/i],
    ['/songs/invalid-resource-id/playground', /Resource not found/i],
    ['/users/invalid-resource-id', 'Profile unavailable'],
    ['/creators/invalid-resource-id', 'Creator profile unavailable'],
  ]
  for (const [path, expected] of cases) {
    await page.goto(path)
    if (typeof expected === 'string') await expect(page.getByRole('heading', { name: expected })).toBeVisible()
    else await expect(page.getByRole('alert')).toContainText(expected)
  }
  expect(runtime.pageErrors).toEqual([])
  expect(runtime.apiErrors.every((entry) => entry.startsWith('404 '))).toBe(true)
})

test('invalid creator resource IDs retain a clear route back to a valid workspace', async ({ page }) => {
  await authenticateAs(page, accounts.creator, 'creator')
  await installMockApi(page, { account: accounts.creator })
  const runtime = watchRuntime(page)

  await page.goto('/creator/studio/invalid-resource-id')
  await expect(page.getByRole('heading', { name: 'Draft unavailable' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back to My Songs' })).toBeVisible()

  await page.goto('/creator/generation/invalid-resource-id')
  await expect(page.getByRole('heading', { name: 'Unable to Load Job' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back to Generation Jobs' })).toBeVisible()

  await page.goto('/creator/editor/invalid-resource-id')
  await expect(page.getByRole('heading', { name: 'Video Editor Unavailable' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Exit to Generation Jobs/i })).toBeVisible()
  expect(runtime.pageErrors).toEqual([])
  expect(runtime.apiErrors.every((entry) => entry.startsWith('404 '))).toBe(true)
})

test('rhythm game and result screens always provide exit and return navigation', async ({ page }) => {
  await installMockApi(page)
  const runtime = watchRuntime(page)
  await page.goto(`/game/${ids.song}?difficulty=EASY`)
  await expect(page.getByRole('button', { name: 'Exit to rhythm song selection' })).toBeVisible()
  await page.getByRole('button', { name: 'Exit to rhythm song selection' }).click()
  await expect(page).toHaveURL(/\/rhythm-game$/)

  await page.goto(`/game/${ids.song}/results`)
  await expect(page.getByRole('heading', { name: 'Your session result has expired' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Return to Rhythm Games' })).toHaveAttribute('href', '/rhythm-game')

  await page.goto('/rhythm-game/leaderboard')
  await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back to Rhythm Game' })).toHaveAttribute('href', '/rhythm-game')
  await expectHealthyPage(page, runtime)
})

test('primary guest, registered, creator, and admin journeys have no page errors or API 404/500 responses', async ({ browser }) => {
  // 20 full-page navigations across 4 fresh browser contexts — comparably expensive
  // to link-integrity.spec.js's crawl, which already opts into the same longer budget.
  test.setTimeout(120_000)
  const journeys = [
    { account: null, mode: 'user', paths: ['/', '/songs', '/learning', '/rhythm-game', '/reflections'] },
    { account: accounts.registered, mode: 'user', paths: ['/profile', '/settings', '/apply/creator'] },
    { account: accounts.creator, mode: 'creator', paths: ['/creator/dashboard', '/creator/songs', '/creator/generation', `/creator/editor/${ids.job}`, '/creator/profile'] },
    { account: accounts.admin, mode: 'user', paths: ['/admin', '/admin/creators', '/admin/content', '/admin/community', '/admin/activity'] },
  ]

  for (const journey of journeys) {
    const context = await browser.newContext()
    const page = await context.newPage()
    if (journey.account) await authenticateAs(page, journey.account, journey.mode)
    await installMockApi(page, { account: journey.account || accounts.registered })
    const runtime = watchRuntime(page)
    for (const path of journey.paths) {
      await page.goto(path)
      await expectHealthyPage(page, runtime)
    }
    await context.close()
  }
})
