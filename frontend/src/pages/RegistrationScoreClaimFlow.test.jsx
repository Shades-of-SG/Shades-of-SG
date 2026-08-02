import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'
import { readPendingScoreClaim, storePendingScoreClaim } from '../services/pendingScoreClaim'

function response(data, status = 200) {
  return Promise.resolve({
    headers: { get: () => null },
    json: async () => data,
    ok: status >= 200 && status < 300,
    status,
  })
}

const result = {
  accuracy: 90, badHits: 1, difficulty: 'EASY', earlyReleases: 0, goodHits: 1,
  greatHits: 2, holdCompletions: 0, maxCombo: 8, misses: 0, perfectHits: 6,
  playedAt: new Date().toISOString(), rank: 'A', score: 8000, songId: 'song-1', totalNotes: 10,
}

function renderApp() {
  return render(<AuthProvider><App /></AuthProvider>)
}

function completeRegistrationForm() {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New Player' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new-player@example.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-pass-123' } })
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'secure-pass-123' } })
  fireEvent.click(screen.getByLabelText(/I accept the Terms of Use/))
  fireEvent.click(screen.getByLabelText(/I accept the Privacy Policy/))
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('new-account guest score claim flow', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState({}, '', '/') })

  it('survives registration and OTP reloads, authenticates, and claims exactly once', async () => {
    const pending = storePendingScoreClaim(result)
    const profile = {
      account: { role: 'REGISTERED' }, badges: [], profile: { displayName: 'New Player', userId: 'new-player-1' }, reflections: [],
      rhythm: { bestScore: 8000, gamesPlayed: 1, topScores: [{ ...result, id: 'score-1', song: { id: 'song-1', title: 'Guest Song' } }] },
    }
    const fetchMock = vi.fn((url, options = {}) => {
      const path = String(url)
      if (path.endsWith('/auth/register')) return response({ message: 'Verification code sent.' }, 201)
      if (path.endsWith('/auth/verify-email')) return response({
        token: 'new-player-token', user: { email: 'new-player@example.com', emailVerified: true, id: 'new-player-1', role: 'REGISTERED' },
      })
      if (path.endsWith('/scores') && options.method === 'POST') return response({ score: { id: 'score-1', userId: 'new-player-1' } }, 201)
      if (path.endsWith('/scores/mine')) return response({ bestScores: [{ difficulty: 'EASY', score: 8000, songId: 'song-1' }], scores: [{ ...result, id: 'score-1' }] })
      if (path.endsWith('/users/me/profile')) return response(profile)
      if (path.endsWith('/songs/song-1/beatmaps')) return response({ beatmaps: [{ difficulty: 'EASY', published: { noteCount: 10 }, status: 'PUBLISHED' }] })
      if (path.endsWith('/songs/song-1')) return response({ song: { id: 'song-1', title: 'Guest Song' } })
      if (path.endsWith('/songs')) return response({ songs: [{ artist: 'Artist', audioUrl: '/guest-song.mp3', durationSecs: 60, id: 'song-1', title: 'Guest Song' }] })
      throw new Error(`Unexpected request: ${path}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    window.history.replaceState({ idx: 0, key: 'guest-result', usr: { result } }, '', '/game/song-1/results')
    renderApp()
    fireEvent.click(await screen.findByRole('link', { name: 'Create Account and Save' }))
    expect(window.location.pathname).toBe('/register')
    expect(sessionStorage.getItem('shades-of-sg:registration-return')).toBe('/rhythm-game/claim')

    cleanup()
    window.history.replaceState({}, '', '/register')
    renderApp()
    completeRegistrationForm()
    await waitFor(() => expect(window.location.pathname).toBe('/verify-email'))
    expect(readPendingScoreClaim()).toMatchObject({ claimId: pending.claimId })

    cleanup()
    window.history.replaceState({}, '', '/verify-email')
    renderApp()
    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '246810' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify email' }))

    expect(await screen.findByText('Your score has been saved to your new account.')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/rhythm-game/claim')
    const claimCalls = fetchMock.mock.calls.filter(([url, options]) => String(url).endsWith('/scores') && options?.method === 'POST')
    expect(claimCalls).toHaveLength(1)
    expect(claimCalls[0][1].headers.Authorization).toBe('Bearer new-player-token')
    expect(JSON.parse(claimCalls[0][1].body)).toMatchObject({ claimId: pending.claimId, songId: 'song-1' })
    expect(JSON.parse(claimCalls[0][1].body)).not.toHaveProperty('userId')
    expect(readPendingScoreClaim()).toBeNull()
    expect(sessionStorage.getItem('shades-of-sg:registration-return')).toBeNull()
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/users/me/profile'))).toBe(true))

    fireEvent.click(screen.getByRole('link', { name: 'Rhythm Games' }))
    expect(await screen.findByText('Best: 8,000')).toBeInTheDocument()
  })
})
