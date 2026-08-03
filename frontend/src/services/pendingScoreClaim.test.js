import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearPendingScoreClaim,
  PENDING_SCORE_CLAIM_TTL_MS,
  readPendingScoreClaim,
  storePendingScoreClaim,
} from './pendingScoreClaim'

const completedResult = (overrides = {}) => ({
  accuracy: 90, badHits: 1, difficulty: 'EASY', earlyReleases: 0, goodHits: 1,
  greatHits: 2, holdCompletions: 0, maxCombo: 8, misses: 0, perfectHits: 6,
  playedAt: '2026-08-03T01:00:00.000Z', rank: 'A', score: 8000, songId: 'song-1', totalNotes: 10,
  ...overrides,
})

describe('pending guest score claims', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

  it('stores only a session-scoped claim with a 45 minute expiry and stable nonce', () => {
    const now = Date.parse('2026-08-03T01:00:00.000Z')
    const first = storePendingScoreClaim(completedResult(), now)
    const repeated = storePendingScoreClaim(completedResult(), now + 1000)

    expect(first.claimId).toMatch(/^[0-9a-f-]{36}$/i)
    expect(first.expiresAt).toBe(now + PENDING_SCORE_CLAIM_TTL_MS)
    expect(repeated.claimId).toBe(first.claimId)
    expect(first).not.toHaveProperty('token')
    expect(first).not.toHaveProperty('userId')
    expect(localStorage.length).toBe(0)
  })

  it('expires stale claims and only clears the matching active claim', () => {
    const now = Date.parse('2026-08-03T01:00:00.000Z')
    const pending = storePendingScoreClaim(completedResult(), now)
    clearPendingScoreClaim('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    expect(readPendingScoreClaim(now + 1000)).toMatchObject({ claimId: pending.claimId })

    expect(readPendingScoreClaim(now + PENDING_SCORE_CLAIM_TTL_MS + 1)).toBeNull()
    expect(sessionStorage.length).toBe(0)
  })
})
