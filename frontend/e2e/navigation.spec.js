import { expect, test } from '@playwright/test'
import { accounts, authenticateAs, expectHealthyPage, ids, installMockApi, watchRuntime } from './support/testHarness.js'

test('guest navigation covers the public experience and authentication entry points', async ({ page }) => {
  await installMockApi(page)
  const runtime = watchRuntime(page)
  await page.goto('/')

  const primary = page.getByRole('navigation', { name: 'Primary navigation' })
  await expect(primary.getByRole('link', { name: 'Songs' })).toHaveAttribute('href', '/songs')
  await expect(primary.getByRole('link', { name: 'Learning Hub' })).toHaveAttribute('href', '/learning')
  await expect(primary.getByRole('link', { name: 'Rhythm Game' })).toHaveAttribute('href', '/rhythm-game')
  await expect(primary.getByRole('link', { name: 'Reflection Wall' })).toHaveAttribute('href', '/reflections')
  await primary.getByRole('link', { name: 'Songs' }).click()
  await expect(page.getByRole('heading', { name: 'Every song tells a story of Singapore' })).toBeVisible()
  await page.getByRole('link', { name: 'Login' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expectHealthyPage(page, runtime)
})

test('registered-user navigation exposes profile, settings, application, and public preview', async ({ page }) => {
  await authenticateAs(page, accounts.registered)
  await installMockApi(page, { account: accounts.registered })
  const runtime = watchRuntime(page)
  await page.goto('/')

  await page.getByRole('button', { name: /Open user menu/i }).click()
  await expect(page.getByRole('menuitem', { name: 'View Profile' })).toHaveAttribute('href', '/profile')
  await expect(page.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/settings')
  await expect(page.getByRole('menuitem', { name: /Apply to be a creator/i })).toHaveAttribute('href', '/apply/creator')
  await page.getByRole('menuitem', { name: 'View Profile' }).click()
  await expect(page.getByRole('heading', { name: accounts.registered.name })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Edit Profile' })).toHaveAttribute('href', '/settings#profile')
  await expect(page.getByRole('link', { name: 'Public preview' })).toHaveAttribute('href', `/users/${ids.registered}`)
  await expectHealthyPage(page, runtime)
})

test('creator user mode links normal profile, creator profile, editing, and public previews', async ({ page }) => {
  await authenticateAs(page, accounts.creator, 'user')
  await installMockApi(page, { account: accounts.creator })
  const runtime = watchRuntime(page)
  await page.goto('/profile')

  await expect(page.getByRole('link', { name: 'Creator profile' })).toHaveAttribute('href', '/creator/profile')
  await expect(page.getByRole('link', { name: 'Public preview' })).toHaveAttribute('href', `/users/${ids.creator}`)
  await page.getByRole('link', { name: 'Creator profile' }).click()
  await expect(page).toHaveURL(/\/creator\/profile$/)
  await expect(page.getByRole('link', { name: 'Edit Profile' })).toHaveAttribute('href', '/creator/profile/edit')
  await expect(page.getByRole('link', { name: 'Public Preview' })).toHaveAttribute('href', `/creators/${ids.creator}`)
  await expect(page.getByRole('link', { name: 'User Profile' })).toHaveAttribute('href', '/profile')
  await expectHealthyPage(page, runtime)
})

test('creator mode exposes every creator tool and opens completed jobs in the editor', async ({ page }) => {
  await authenticateAs(page, accounts.creator, 'creator')
  await installMockApi(page, { account: accounts.creator })
  const runtime = watchRuntime(page)
  await page.goto('/creator/dashboard')

  const creatorNav = page.getByRole('navigation', { name: 'Creator navigation' })
  const expectedLinks = {
    Analytics: '/creator/analytics', Collections: '/creator/folders', 'Generation Jobs': '/creator/generation',
    'My Songs': '/creator/songs', Studio: '/creator/studio/new',
  }
  for (const [name, href] of Object.entries(expectedLinks)) {
    await expect(creatorNav.getByRole('link', { name })).toHaveAttribute('href', href)
  }
  await expect(page.getByRole('link', { name: 'View play analytics' })).toHaveAttribute('href', '/creator/analytics')
  await expect(page.getByRole('link', { name: 'Open video editor' })).toHaveAttribute('href', `/creator/editor/${ids.job}`)
  await page.getByRole('link', { name: 'Open video editor' }).click()
  await expect(page.getByRole('heading', { name: 'Timeline Editor' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Exit Editor/i })).toBeVisible()
  await expectHealthyPage(page, runtime)
})

test('admin navigation and every legacy redirect select the intended destination tab', async ({ page }) => {
  await authenticateAs(page, accounts.admin)
  await installMockApi(page, { account: accounts.admin })
  const runtime = watchRuntime(page)
  await page.goto('/admin')

  const adminNav = page.getByRole('navigation', { name: 'Admin navigation' })
  await expect(adminNav.getByRole('link', { name: 'Creators' })).toHaveAttribute('href', '/admin/creators')
  await expect(adminNav.getByRole('link', { name: 'Content' })).toHaveAttribute('href', '/admin/content')
  await expect(adminNav.getByRole('link', { name: 'Safety & Reports' })).toHaveAttribute('href', '/admin/community')

  const redirects = [
    ['/admin/applications', '/admin/creators?tab=applications', 'Applications'],
    ['/admin/songs', '/admin/content?tab=songs', 'Songs'],
    ['/admin/reflections', '/admin/community?tab=reports', 'Reports'],
    ['/admin/folders', '/admin/content?tab=collections', 'Collections'],
    ['/admin/governance', '/admin/activity', null],
  ]
  for (const [legacy, destination, activeTab] of redirects) {
    await page.goto(legacy)
    await expect(page).toHaveURL(new RegExp(`${destination.replace(/[?]/g, '\\?')}$`))
    if (activeTab) {
      await expect(page.getByRole('navigation', { name: 'Page sections' }).getByRole('button', { name: new RegExp(`^${activeTab}`, 'i') })).toHaveAttribute('aria-current', 'page')
    }
  }
  await expectHealthyPage(page, runtime)
})

test('a suspended creator keeps user-mode access but cannot enter creator tools', async ({ page }) => {
  await authenticateAs(page, accounts.suspendedCreator, 'user')
  await installMockApi(page, { account: accounts.suspendedCreator })
  const runtime = watchRuntime(page)
  await page.goto('/creator/dashboard')

  await expect(page.getByRole('heading', { name: 'Creator tools are temporarily unavailable' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Continue to your profile/i })).toHaveAttribute('href', '/profile')
  await page.getByRole('link', { name: /Continue to your profile/i }).click()
  await expect(page.getByRole('heading', { name: accounts.suspendedCreator.name })).toBeVisible()
  await expect(page.getByRole('status')).toContainText(/creator access has been suspended/i)
  await expectHealthyPage(page, runtime)
})
