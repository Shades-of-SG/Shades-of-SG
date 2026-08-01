import { expect, test } from '@playwright/test'
import { accounts, authenticateAs, expectHealthyPage, ids, installMockApi, watchRuntime } from './support/testHarness.js'

test('public and admin mobile menus expose usable navigation', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await installMockApi(page)
  const runtime = watchRuntime(page)
  await page.goto('/')
  const publicToggle = page.getByRole('button', { name: 'Toggle navigation menu' })
  await publicToggle.click()
  await expect(publicToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Learning Hub', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible()

  const adminContext = await page.context().browser().newContext({ viewport: { height: 844, width: 390 } })
  const adminPage = await adminContext.newPage()
  await authenticateAs(adminPage, accounts.admin)
  await installMockApi(adminPage, { account: accounts.admin })
  await adminPage.goto('/admin')
  await adminPage.getByRole('button', { name: /sidebar/i }).click()
  await expect(adminPage.getByRole('navigation', { name: 'Admin navigation' }).getByRole('link', { name: 'Content' })).toBeVisible()
  await adminContext.close()
  await expectHealthyPage(page, runtime)
})

test('creator navigation remains complete and free of horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await authenticateAs(page, accounts.creator, 'creator')
  await installMockApi(page, { account: accounts.creator })
  const runtime = watchRuntime(page)
  await page.goto('/creator/dashboard')
  const nav = page.getByRole('navigation', { name: 'Creator navigation' })
  await expect(nav.getByRole('link', { name: 'Generation Jobs' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Collections' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Analytics' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await expectHealthyPage(page, runtime)
})

test('browser refresh preserves protected and dynamic routes', async ({ page }) => {
  await authenticateAs(page, accounts.creator, 'creator')
  await installMockApi(page, { account: accounts.creator })
  const runtime = watchRuntime(page)

  const cases = [
    ['/creator/dashboard', 'Dashboard'],
    [`/creator/generation/${ids.job}`, 'Generation Progress'],
    [`/creator/editor/${ids.job}`, 'Timeline Editor'],
    [`/creator/studio/${ids.song}`, 'Studio'],
  ]
  for (const [path, heading] of cases) {
    await page.goto(path)
    await page.reload()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible()
  }
  await expectHealthyPage(page, runtime)
})

test('/users/:userId uses the wide MainLayout and page roots use the available viewport', async ({ page }) => {
  await authenticateAs(page, accounts.registered)
  await installMockApi(page, { account: accounts.registered })
  const runtime = watchRuntime(page)
  await page.goto(`/users/${ids.registered}`)
  await expect(page.locator('main.site-main')).toHaveClass(/site-main--wide/)
  const dimensions = await page.evaluate(() => {
    const main = document.querySelector('main.site-main')
    const profile = document.querySelector('.profile-page')
    return {
      main: main?.getBoundingClientRect().width || 0,
      profile: profile?.getBoundingClientRect().width || 0,
      viewport: document.documentElement.clientWidth,
    }
  })
  expect(dimensions.main).toBeGreaterThanOrEqual(dimensions.viewport - 1)
  expect(dimensions.profile).toBeGreaterThanOrEqual(dimensions.viewport - 1)
  await expectHealthyPage(page, runtime)
})
