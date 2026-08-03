import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import MainLayout from '../layouts/MainLayout'
import RhythmResults from './RhythmResults'
import { storePendingScoreClaim } from '../services/pendingScoreClaim'

function result(playedAt, overrides = {}) {
  return {
    accuracy: 90, badHits: 0, difficulty: 'MEDIUM', earlyReleases: 0, goodHits: 1,
    greatHits: 0, holdCompletions: 0, maxCombo: 1, misses: 0, perfectHits: 0,
    playedAt, processedNotes: 1, rank: 'A', score: 450, songId: 'song-1', totalNotes: 1,
    ...overrides,
  }
}

function renderResults(gameResult, { layout = false } = {}) {
  const resultsRoute = <Route element={<RhythmResults />} path="/game/:songId/results" />
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[{ pathname: '/game/song-1/results', state: gameResult ? { result: gameResult } : null }]}>
        <Routes>
          {layout ? <Route element={<MainLayout role="guest" />}>{resultsRoute}</Route> : resultsRoute}
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

function profileResponse() {
  return {
    account: { role: 'REGISTERED' }, badges: [], reflections: [], rhythm: { bestScore: 450, gamesPlayed: 1, rank: 1, recentScores: [] },
    profile: { displayName: 'Player', userId: 'player-1' },
  }
}

function authenticate(role = 'REGISTERED') {
  localStorage.setItem('authToken', role === 'CREATOR' ? 'creator-token' : 'player-token')
  localStorage.setItem('authUser', JSON.stringify({ id: role === 'CREATOR' ? 'creator-1' : 'player-1', role }))
}

describe('RhythmResults score persistence and presentation', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('keeps guest results session-only and offers future-facing account actions', async () => {
    const fetchMock = vi.fn(async () => ({ json: async () => ({ song: { id: 'song-1', theme: 'Home', title: 'Guest Song' } }), ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    renderResults(result('guest-run'), { layout: true })

    expect(await screen.findByRole('heading', { name: 'Save Your Future Scores' })).toBeInTheDocument()
    expect(screen.getByText(/This result is available for this session only/)).toHaveTextContent(
      'This result is available for this session only. Log in before your next game to save future scores, track personal bests, earn badges and join the leaderboard.',
    )
    expect(screen.queryByText(/log in to save (this|your) result/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Create Account' })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: 'Write a Reflection' })).toHaveAttribute('href', '/reflections?song_id=song-1&compose=1')
    expect(screen.getByRole('link', { name: 'Explore This Song' })).toHaveAttribute('href', '/songs/song-1')
    expect(screen.getByRole('link', { name: 'Return to Rhythm Games' })).toHaveAttribute('href', '/rhythm-game')
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(localStorage.getItem('rhythmResult:song-1')).toBeNull()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/scores'))).toBe(false)
  })

  it('offers to save the completed result only while its matching claim is pending', async () => {
    const gameResult = result(new Date().toISOString())
    const pending = storePendingScoreClaim(gameResult)
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ song: { id: 'song-1', title: 'Guest Song' } }), ok: true })))
    renderResults(gameResult)

    expect(await screen.findByRole('heading', { name: 'Save This Score' })).toBeInTheDocument()
    expect(screen.getByText(/save this result, track personal bests/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log In and Save' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Create Account and Save' })).toHaveAttribute('href', '/register')
    expect(pending.claimId).toBeTruthy()
    expect(sessionStorage.length).toBe(1)
  })

  it('shows a friendly fallback for an expired or invalid guest result', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({}), ok: false })))
    renderResults(null)

    expect(screen.getByRole('heading', { name: 'Your session result has expired' })).toBeInTheDocument()
    expect(screen.getByText(/Guest results are available only for the session/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return to Rhythm Games' })).toHaveAttribute('href', '/rhythm-game')
  })

  it('shows confirmed personal-best and leaderboard details for a saved registered run', async () => {
    authenticate()
    const fetchMock = vi.fn(async (url) => {
      const requestUrl = String(url)
      if (requestUrl.endsWith('/scores/mine')) return { json: async () => ({ bestScores: [{ difficulty: 'MEDIUM', score: 400, songId: 'song-1' }], scores: [] }), ok: true }
      if (requestUrl.includes('/scores/leaderboard')) return { json: async () => ({ currentUser: { position: 2 } }), ok: true }
      if (requestUrl.endsWith('/scores')) return { json: async () => ({ score: { id: 'score-1' } }), ok: true }
      if (requestUrl.endsWith('/users/me/profile')) return { json: async () => profileResponse(), ok: true }
      return { json: async () => ({ song: { coverImageUrl: '/cover.jpg', id: 'song-1', theme: 'Community', title: 'Player Song' } }), ok: true }
    })
    vi.stubGlobal('fetch', fetchMock)
    const view = renderResults(result('registered-run'))

    expect(await screen.findByText(/score saved to your profile/i)).toBeInTheDocument()
    expect(await screen.findByText('New Personal Best')).toBeInTheDocument()
    expect(screen.getByText('Personal best').nextElementSibling).toHaveTextContent('450')
    expect(screen.getByText('Previous best').nextElementSibling).toHaveTextContent('400')
    expect(screen.getByText('Leaderboard rank').nextElementSibling).toHaveTextContent('#2')
    expect(screen.queryByRole('heading', { name: 'Save Your Future Scores' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Write a Reflection' })).toHaveAttribute('href', '/reflections?song_id=song-1&compose=1')
    expect(screen.getByRole('link', { name: 'View Leaderboard' })).toHaveAttribute(
      'href',
      '/rhythm-game/leaderboard?songId=song-1&difficulty=MEDIUM',
    )

    view.rerender(
      <AuthProvider>
        <MemoryRouter initialEntries={[{ pathname: '/game/song-1/results', state: { result: result('registered-run') } }]}>
          <Routes><Route element={<RhythmResults />} path="/game/:songId/results" /></Routes>
        </MemoryRouter>
      </AuthProvider>,
    )
    await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/scores'))).toHaveLength(1))
  })

  it('does not label a lower score as a new personal best', async () => {
    authenticate()
    const fetchMock = vi.fn(async (url) => {
      const requestUrl = String(url)
      if (requestUrl.endsWith('/scores/mine')) return { json: async () => ({ bestScores: [{ difficulty: 'MEDIUM', score: 900, songId: 'song-1' }], scores: [] }), ok: true }
      if (requestUrl.includes('/scores/leaderboard')) return { json: async () => ({ currentUser: { position: 4 } }), ok: true }
      if (requestUrl.endsWith('/scores')) return { json: async () => ({ score: { id: 'score-lower' } }), ok: true }
      if (requestUrl.endsWith('/users/me/profile')) return { json: async () => profileResponse(), ok: true }
      return { json: async () => ({ song: { id: 'song-1', title: 'Player Song' } }), ok: true }
    })
    vi.stubGlobal('fetch', fetchMock)
    renderResults(result('ordinary-run'))

    expect(await screen.findByText(/score saved to your profile/i)).toBeInTheDocument()
    expect(screen.queryByText('New Personal Best')).not.toBeInTheDocument()
    expect(screen.getByText('Personal best').nextElementSibling).toHaveTextContent('900')
    expect(screen.getByText('Previous best').nextElementSibling).toHaveTextContent('900')
  })

  it('submits a creator public run while keeping draft previews unsaved', async () => {
    authenticate('CREATOR')
    const fetchMock = vi.fn(async (url) => {
      const requestUrl = String(url)
      if (requestUrl.endsWith('/scores/mine')) return { json: async () => ({ bestScores: [], scores: [] }), ok: true }
      if (requestUrl.endsWith('/scores')) return { json: async () => ({ score: { id: 'score-creator' } }), ok: true }
      if (requestUrl.endsWith('/users/me/profile')) return { json: async () => profileResponse(), ok: true }
      return { json: async () => ({ song: { id: 'song-1', title: 'Creator Song' } }), ok: true }
    })
    vi.stubGlobal('fetch', fetchMock)
    renderResults(result('creator-public-run'))
    expect(await screen.findByText(/score saved to your profile/i)).toBeInTheDocument()
    await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/scores'))).toHaveLength(1))

    cleanup()
    fetchMock.mockClear()
    renderResults({ ...result('preview-run'), preview: true })
    expect(await screen.findByText(/does not affect player statistics/i)).toBeInTheDocument()
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/songs/creator/song-1'))).toBe(true))
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/scores'))).toBe(false)
    expect(screen.getByRole('link', { name: 'Back to Studio' })).toHaveAttribute('href', '/creator/studio/song-1')
    expect(screen.queryByRole('link', { name: 'Write a Reflection' })).not.toBeInTheDocument()
  })

  it('keeps the score visible when song metadata cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ message: 'private details' }), ok: false })))
    renderResults(result('missing-song'))

    expect(await screen.findByText('Song details unavailable')).toBeInTheDocument()
    expect(screen.getByText('Song details are unavailable, but your result is still here.')).toBeInTheDocument()
    expect(screen.queryByText('private details')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Total score 450')).toBeInTheDocument()
  })
})
