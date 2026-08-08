import { afterEach, describe, expect, it, vi } from 'vitest'
import { AUTH_EXPIRED_EVENT } from '../utils/authEvents'
import { getLeaderboard } from './leaderboardService'

describe('leaderboardService', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('notifies the app when a leaderboard request uses an expired session', async () => {
    const expired = vi.fn()
    window.addEventListener(AUTH_EXPIRED_EVENT, expired, { once: true })
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ message: 'Your session is invalid or expired.' }),
      ok: false,
      status: 401,
    })))

    await expect(getLeaderboard({
      difficulty: 'EASY', period: 'all-time', songId: 'song-1', token: 'expired-token',
    })).rejects.toThrow('Your session is invalid or expired.')
    expect(expired).toHaveBeenCalledOnce()
  })
})
