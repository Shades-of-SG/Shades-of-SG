import { expect, test } from '@playwright/test'
import { ids, installMockApi } from './support/testHarness.js'

const reflectionId = '00000000-0000-4000-8000-000000000030'

test('mobile reflection discussion stays within the viewport and restores keyboard focus', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await installMockApi(page)
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/reflections') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ reflections: [{
        author: { avatarUrl: '', displayName: 'E2E Player', id: ids.registered },
        commentCount: 0, content: 'A long-form reflection that opens in a focused mobile discussion.',
        createdAt: '2026-08-01T08:00:00.000Z', displayName: 'E2E Player', id: reflectionId,
        isAnonymous: false, isLiked: false, isOwner: false, likeCount: 4,
        song: { id: ids.song, title: 'E2E Song' }, songId: ids.song, status: 'APPROVED', tags: [],
      }] }) })
    }
    if (url.pathname === `/api/reflections/${reflectionId}/comments`) {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ comments: [] }) })
    }
    return route.fallback()
  })

  await page.goto('/reflections')
  const trigger = page.getByRole('button', { name: 'View discussion', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Discussion' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('link', { name: /E2E Player/ })).toHaveAttribute('href', `/users/${ids.registered}`)
  await expect(page.getByText('No comments yet. Start the conversation.')).toBeVisible()
  await expect(page.getByText('Log in to like or join the discussion.')).toBeVisible()

  await expect.poll(() => dialog.evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(844)
  const bounds = await dialog.evaluate((element) => {
    const box = element.getBoundingClientRect()
    return { bottom: box.bottom, left: box.left, right: box.right, top: box.top, viewportHeight: innerHeight, viewportWidth: innerWidth }
  })
  expect(bounds.left).toBeGreaterThanOrEqual(0)
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth)
  expect(bounds.top).toBeGreaterThanOrEqual(0)
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewportHeight)

  await expect(page.getByRole('button', { name: 'Close discussion' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})
