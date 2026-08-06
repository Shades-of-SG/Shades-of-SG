import { expect } from '@playwright/test'

export const ids = {
  admin: '00000000-0000-4000-8000-000000000003',
  creator: '00000000-0000-4000-8000-000000000002',
  job: '00000000-0000-4000-8000-000000000020',
  registered: '00000000-0000-4000-8000-000000000001',
  song: '00000000-0000-4000-8000-000000000010',
}

export const accounts = {
  registered: { accountStatus: 'ACTIVE', email: 'player.e2e@example.test', id: ids.registered, name: 'E2E Player', role: 'REGISTERED' },
  creator: { accountStatus: 'ACTIVE', creatorAccessStatus: 'ACTIVE', email: 'creator.e2e@example.test', id: ids.creator, name: 'E2E Creator', role: 'CREATOR' },
  suspendedCreator: { accountStatus: 'ACTIVE', creatorAccessStatus: 'SUSPENDED', creatorSuspensionReason: 'E2E creator-access check.', email: 'suspended.e2e@example.test', id: ids.creator, name: 'Suspended Creator', role: 'CREATOR' },
  admin: { accountStatus: 'ACTIVE', email: 'admin.e2e@example.test', id: ids.admin, name: 'E2E Admin', role: 'ADMIN' },
}

const song = {
  artist: 'Test Artist', audioUrl: '', coverImageUrl: '', description: 'A deterministic E2E song.',
  durationSecs: 120, id: ids.song, languages: ['English'], publishedDate: '2026-01-01T00:00:00.000Z',
  rawLyrics: 'Test lyrics', status: 'PUBLISHED', theme: 'Community', title: 'E2E Song', updatedAt: '2026-01-01T00:00:00.000Z',
}

const completedJob = {
  id: ids.job, progress: 100, status: 'COMPLETED', song: {
    ...song, sceneSegments: [{ endTime: 5, generatedFrames: [{ frameOrder: 0, id: 'frame-1', imageUrl: '' }], id: 'scene-1', lyrics: 'Test lyrics', startTime: 0 }],
  },
}

function profileFor(account = accounts.registered) {
  return {
    account: { email: account.email, emailVerified: true, isCreator: account.role === 'CREATOR', role: account.role, userId: account.id },
    badges: [],
    profile: {
      avatarUrl: '', bio: 'E2E profile biography.', createdAt: '2025-01-01T00:00:00.000Z', displayName: account.name,
      fontSize: 'MEDIUM', isCreator: account.role === 'CREATOR', location: 'Singapore', preferredLanguage: 'English',
      profileVisibility: 'PUBLIC', reducedMotion: true, showBadges: true, showReflections: true, showRhythmRanking: true,
      theme: 'DARK', userId: account.id,
    },
    reflections: [],
    rhythm: { bestAccuracy: 0, bestScore: 0, gamesPlayed: 0, recentScores: [], totalScore: 0 },
  }
}

const creatorProfile = {
  avatarUrl: '', bio: 'E2E creator biography.', contentFocus: ['Community'], creatorSince: '2025',
  creatorTitle: 'Community Music Creator', displayName: accounts.creator.name, featuredQuote: '', languages: ['English'],
  location: 'Singapore', showCommunityReflections: true, socialLinks: {}, tagline: 'Music for E2E journeys.', visibility: 'PUBLIC',
}

function adminAnalytics() {
  return {
    activitySeries: [], events: {}, generationJobs: 1,
    pending: { creatorApplications: 0, flaggedReflections: 0, suspendedAccounts: 0, unresolvedWarnings: 0 },
    reflections: 0, scores: 0, songs: { published: 1, total: 1 }, users: { admins: 1, creators: 1, registered: 1, total: 3 },
  }
}

function responseFor(pathname, method, account) {
  if (pathname.includes('invalid-resource-id')) return { status: 404, body: { message: 'Resource not found.' } }

  if (pathname === '/api/users/me/profile') return { body: profileFor(account) }
  if (pathname.match(/^\/api\/users\/[^/]+\/profile$/)) return { body: { ...profileFor(account), isOwner: true } }
  if (pathname === '/api/creators/me/profile') return { body: { profile: creatorProfile } }
  if (pathname.match(/^\/api\/creators\/[^/]+\/profile$/)) return { body: { collections: [], isOwner: true, profile: creatorProfile, reflections: [], songs: [song], stats: { communityReflections: 0, publishedCollections: 0, publishedSongs: 1 } } }

  if (pathname === '/api/songs/creator/dashboard/summary') return { body: { counts: { PUBLISHED: 1, total: 1 }, generationJobs: [completedJob], recentSongs: [song] } }
  if (pathname === '/api/songs/creator') return { body: { songs: [{ ...song, latestGenerationJob: { id: ids.job, status: 'COMPLETED' } }] } }
  if (pathname.startsWith('/api/songs/creator/')) return { body: { song } }
  if (pathname.match(/^\/api\/songs\/[^/]+\/beatmaps$/)) return { body: { beatmaps: [{ difficulty: 'EASY', noteCount: 1, published: { noteCount: 1 }, status: 'PUBLISHED' }] } }
  if (pathname.match(/^\/api\/songs\/[^/]+\/beatmaps\/[^/]+(?:\/preview)?$/)) return { body: { beatmap: { difficulty: 'EASY', durationMs: 120000, notes: [{ id: 'note-1', lane: 0, startMs: 1000, type: 'tap' }], offsetMs: 0, status: 'PUBLISHED' } } }
  if (pathname === '/api/songs') return { body: { songs: [song] } }
  if (pathname.match(/^\/api\/songs\/[^/]+$/)) return { body: { song } }

  if (pathname === '/api/generation') return { body: { data: [completedJob], success: true } }
  if (pathname.match(/^\/api\/generation\/[^/]+\/status$/)) return { body: { data: completedJob, success: true } }
  if (pathname.startsWith('/api/generation/')) return { body: { success: true, videoUrl: '' } }

  if (pathname === '/api/reflections' || pathname === '/api/reflections/mine') return { body: { reflections: [] } }
  if (pathname === '/api/reflections/moderation') return { body: { pagination: { limit: 8, page: 1, total: 0, totalPages: 0 }, reflections: [], stats: { approved: 0, flagged: 0, newToday: 0, newYesterday: 0, pending: 0, rejected: 0 } } }
  if (pathname === '/api/creator-applications/mine') return { body: { applications: [] } }
  if (pathname === '/api/folders') return { body: { folders: [] } }
  if (pathname === '/api/transcriptions/status') return { body: { configured: false } }

  if (pathname === '/api/admin/analytics') return { body: adminAnalytics() }
  if (pathname === '/api/admin/creator-applications') return { body: { applications: [], pagination: {} } }
  if (pathname === '/api/admin/creators') return { body: { creators: [], pagination: {} } }
  if (pathname === '/api/admin/users') return { body: { pagination: {}, users: [] } }
  if (pathname === '/api/admin/songs') return { body: { pagination: {}, songs: [] } }
  if (pathname === '/api/admin/folders') return { body: { folders: [], pagination: {} } }
  if (pathname === '/api/admin/folder-song-proposals') return { body: { pagination: {}, proposals: [] } }
  if (pathname === '/api/admin/audit-logs') return { body: { auditLogs: [], pagination: {} } }
  if (pathname === '/api/admin/moderation-actions') return { body: { actions: [], pagination: {} } }
  if (pathname === '/api/admin/warnings') return { body: { pagination: {}, warnings: [] } }
  if (pathname === '/api/scores/mine') return { body: { scores: [] } }
  if (pathname === '/api/scores/leaderboard') return { body: { currentUser: null, entries: [] } }
  if (pathname.startsWith('/api/badges/')) return { body: { badges: [] } }
  if (pathname === '/api/analytics/events' && method === 'POST') return { body: { tracked: true } }

  return { body: {} }
}

export async function installMockApi(page, { account = accounts.registered } = {}) {
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const result = responseFor(url.pathname, request.method(), account)
    await route.fulfill({
      body: JSON.stringify(result.body),
      contentType: 'application/json',
      status: result.status || 200,
    })
  })
}

export async function authenticateAs(page, account, mode = 'user') {
  await page.addInitScript(({ nextAccount, nextMode }) => {
    try {
      localStorage.setItem('authToken', `e2e-${nextAccount.role.toLowerCase()}-token`)
      localStorage.setItem('authUser', JSON.stringify(nextAccount))
      localStorage.setItem('activeMode', nextMode)
    } catch {
      // Playwright also runs init scripts in originless documents where storage is unavailable.
    }
  }, { nextAccount: account, nextMode: mode })
}

export function watchRuntime(page) {
  const pageErrors = []
  const apiErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 400) apiErrors.push(`${response.status()} ${response.url()}`)
  })
  return { apiErrors, pageErrors }
}

export async function expectHealthyPage(page, runtime, { allowApiErrors = false } = {}) {
  await expect(page.locator('body')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toHaveCount(0)
  expect(runtime.pageErrors).toEqual([])
  if (!allowApiErrors) expect(runtime.apiErrors).toEqual([])
}
