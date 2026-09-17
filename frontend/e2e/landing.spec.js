import { expect, test } from '@playwright/test'
import { ids, installMockApi, watchRuntime, expectHealthyPage, accounts, authenticateAs } from './support/testHarness.js'

const reflectionId = '00000000-0000-4000-8000-000000000030'

async function installLandingApi(page) {
  await installMockApi(page)
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/songs') {
      return route.fulfill({ json: { items: Array.from({ length: 5 }, (_, index) => ({
        id: index === 0 ? ids.song : `song-${index}`, title: `Local song ${index + 1}`,
        creator: { id: ids.creator, displayName: 'Local artist' }, artist: 'Local artist',
        theme: 'Community', languages: ['English', 'Malay'],
        description: 'Singapore memories and music. '.repeat(index + 1),
      })) } })
    }
    if (url.pathname === '/api/reflections') {
      return route.fulfill({ json: { reflections: Array.from({ length: 5 }, (_, index) => ({
        id: index === 0 ? reflectionId : `memory-${index}`, displayName: 'Anonymous',
        isAnonymous: true, isLiked: false, isOwner: false, likeCount: 4, commentCount: 2,
        createdAt: '2026-08-01T08:00:00.000Z', content: 'A memory from Singapore. '.repeat(index + 2),
        song: { id: ids.song, title: 'Local song 1' },
      })) } })
    }
    if (url.pathname === `/api/reflections/${reflectionId}/comments`) {
      return route.fulfill({ json: { comments: [] } })
    }
    if (url.pathname === `/api/reflections/${reflectionId}/like`) {
      return route.fulfill({ json: { liked: route.request().method() === 'POST', likeCount: route.request().method() === 'POST' ? 5 : 4 } })
    }
    return route.fallback()
  })
}

for (const width of [1440, 768, 390, 320]) {
  test(`Home at ${width}px preserves previews, focus, carousel and refresh`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await installLandingApi(page)
    const runtime = watchRuntime(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: "Where Singapore's stories become music." })).toBeVisible()
    await expect(page.locator('.song-card--featured')).toHaveCount(5)
    await expect(page.locator('.landing-memories .rw-card')).toHaveCount(5)
    await expect(page.getByRole('heading', { name: 'Stats', exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: "Made for Singapore's music community" })).toHaveCount(0)
    await expect(page.locator('#journey .feature-card__destination')).toHaveCount(0)
    await expect(page.locator('#journey .feature-card a')).toHaveCount(0)
    const chipsFit = await page.locator('.featured-song__metadata').evaluateAll((groups) => groups.every((group) =>
      [...group.children].every((chip) => chip.getBoundingClientRect().right <= group.getBoundingClientRect().right + 1)
    ))
    expect(chipsFit).toBe(true)
    const journey = page.getByRole('link', { name: /Discover Music/ })
    await journey.focus()
    await expect(journey).toBeFocused()
    expect(await journey.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
    const songs = page.getByRole('group', { name: 'Featured songs', exact: true })
    await songs.scrollIntoViewIfNeeded()
    const track = songs.locator('.carousel-track')
    const startOffset = await track.evaluate((element) => parseFloat(getComputedStyle(element).paddingLeft))
    await songs.getByRole('button', { name: 'Next', exact: true }).click()
    await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
    await songs.getByRole('button', { name: 'Previous', exact: true }).click()
    await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeLessThanOrEqual(startOffset + 1)
    const heights = await page.locator('.song-card--featured').evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect().height))
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1)
    const memoryHeights = await page.locator('.landing-memories .carousel-item').evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect().height))
    expect(Math.max(...memoryHeights) - Math.min(...memoryHeights)).toBeLessThanOrEqual(1)
    const discussion = page.getByRole('button', { name: 'View discussion', exact: true }).first()
    await discussion.click()
    await expect(page.getByRole('dialog', { name: 'Discussion' })).toBeVisible()
    await expect(page.getByText('No comments yet. Start the conversation.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Close discussion' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(discussion).toBeFocused()
    const like = page.getByRole('button', { name: 'Like reflection by Anonymous', exact: true }).first()
    await like.click()
    await expect(page.getByRole('button', { name: 'Unlike reflection by Anonymous', exact: true }).first()).toHaveText('5')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('.song-card--featured')).toHaveCount(5)
    await expectHealthyPage(page, runtime)
  })
}

test('Home actions and every navbar/footer internal link navigate to existing routes', async ({ page }) => {
  await installLandingApi(page)
  const runtime = watchRuntime(page)
  await page.goto('/')
  await expect(page.locator('.song-card--featured')).toHaveCount(5)
  const cases = [
    ['.hero-actions', 'Explore Songs', '/songs'],
    ['.hero-actions', 'Share Your Music', '/apply/creator'],
    ['#journey', /Discover Music/, '/songs'],
    ['#journey', /Explore the Story/, '/learning'],
    ['#journey', /Play the Rhythm/, '/rhythm-game'],
    ['#journey', /Join the Conversation/, '/reflections'],
    ['.landing-page', /View all songs/, '/songs'],
    ['.landing-page', 'Explore Song: Local song 1', `/songs/${ids.song}`],
    ['.song-card--featured', 'Local artist', `/creators/${ids.creator}`],
    ['.landing-page', /View all reflections/, '/reflections'],
    ['.landing-cta', 'Explore Songs', '/songs'],
    ['.landing-cta', 'Become a Creator', '/apply/creator'],
  ]
  for (const [container, name, path] of cases) {
    await page.goto('/')
    const link = page.locator(container).getByRole('link', { name, exact: typeof name === 'string' }).first()
    await expect(link).toHaveAttribute('href', path)
    if (container === '#journey') { await link.focus(); await page.keyboard.press('Enter') }
    else await link.click()
    await expect(page).toHaveURL(new RegExp(`${path === '/apply/creator' ? '/login' : path}$`))
    await expectHealthyPage(page, runtime)
  }
  await page.goto('/')
  const hrefs = await page.locator('.site-header a[href], .site-footer a[href]').evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute('href')).filter((href) => href.startsWith('/')))])
  expect(hrefs).toEqual(expect.arrayContaining(['/', '/songs', '/learning', '/rhythm-game', '/reflections', '/login', '/register', '/privacy', '/terms']))
  for (const href of hrefs) {
    await page.goto('/')
    const link = page.locator(`.site-header a[href="${href}"], .site-footer a[href="${href}"]`).first()
    await link.click()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
    await expectHealthyPage(page, runtime)
  }
})

test('registered listeners can enter the existing creator application from Home', async ({ page }) => {
  await authenticateAs(page, accounts.registered)
  await installLandingApi(page)
  const runtime = watchRuntime(page)
  await page.goto('/')
  await page.getByRole('link', { name: 'Share Your Music' }).click()
  await expect(page).toHaveURL(/\/apply\/creator$/)
  await expectHealthyPage(page, runtime)
})
