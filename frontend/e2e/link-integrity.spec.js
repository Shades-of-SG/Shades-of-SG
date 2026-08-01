import { expect, test } from '@playwright/test'
import { accounts, authenticateAs, ids, installMockApi, watchRuntime } from './support/testHarness.js'

const publicSeeds = [
  '/', '/songs', `/songs/${ids.song}`, `/songs/${ids.song}/trivia`, `/songs/${ids.song}/playground`,
  '/learning', '/learning/heritage-vault', '/learning/instrument-lab', '/learning/guided-lessons',
  '/rhythm-game', '/rhythm-game/leaderboard', `/game/${ids.song}?difficulty=EASY`, `/game/${ids.song}/results`, '/reflections',
  `/creators/${ids.creator}`, `/users/${ids.registered}`, '/login', '/register', '/forgot-password',
  '/reset-password', '/verify-email', '/registration-success', '/privacy', '/terms',
]

const creatorSeeds = [
  '/profile', '/settings', '/creator/dashboard', '/creator/studio/new', `/creator/studio/${ids.song}`,
  '/creator/songs', '/creator/generation', `/creator/generation/${ids.job}`, `/creator/editor/${ids.job}`,
  '/creator/reflections', '/creator/folders', '/creator/analytics', '/creator/profile', '/creator/profile/edit',
]

const adminSeeds = ['/admin', '/admin/creators', '/admin/content', '/admin/community', '/admin/activity']

async function crawlInternalLinks(page, seeds) {
  const destinations = new Set(seeds)
  for (const seed of seeds) {
    await page.goto(seed, { waitUntil: 'domcontentloaded' })
    const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    for (const href of hrefs) {
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
      const current = new URL(page.url())
      const url = new URL(href, current.origin)
      if (url.origin === current.origin) destinations.add(`${url.pathname}${url.search}`)
    }
  }

  for (const destination of destinations) {
    await page.goto(destination, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toHaveCount(0)
  }
}

test('every rendered internal link resolves to a defined route for each account state', async ({ browser }) => {
  test.setTimeout(120_000)
  const roles = [
    { account: null, mode: 'user', seeds: publicSeeds },
    { account: accounts.creator, mode: 'creator', seeds: creatorSeeds },
    { account: accounts.admin, mode: 'user', seeds: adminSeeds },
  ]

  for (const role of roles) {
    const context = await browser.newContext()
    const page = await context.newPage()
    if (role.account) await authenticateAs(page, role.account, role.mode)
    await installMockApi(page, { account: role.account || accounts.registered })
    const runtime = watchRuntime(page)
    await crawlInternalLinks(page, role.seeds)
    expect(runtime.pageErrors).toEqual([])
    expect(runtime.apiErrors).toEqual([])
    await context.close()
  }
})
