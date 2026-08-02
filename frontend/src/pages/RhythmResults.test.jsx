import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import RhythmResults from './RhythmResults'

function result(playedAt) {
  return {
    accuracy: 90, badHits: 0, difficulty: 'MEDIUM', earlyReleases: 0, goodHits: 1,
    greatHits: 0, holdCompletions: 0, maxCombo: 1, misses: 0, perfectHits: 0,
    playedAt, processedNotes: 1, rank: 'A', score: 450, songId: 'song-1', totalNotes: 1,
  }
}

function renderResults(gameResult) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[{ pathname: '/game/song-1/results', state: { result: gameResult } }]}>
        <Routes><Route path="/game/:songId/results" element={<RhythmResults />} /></Routes>
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

describe('RhythmResults score persistence', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('keeps guest results local and never calls the protected score endpoint', async () => {
    const fetchMock = vi.fn(async () => ({ json: async () => ({ song: { id: 'song-1', title: 'Guest Song' } }), ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    renderResults(result('guest-run'))
    expect(await screen.findByText(/saved on this device/i)).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/scores'))).toBe(false)
  })

  it('submits one completed registered run and confirms the save', async () => {
    localStorage.setItem('authToken', 'player-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'player-1', role: 'REGISTERED' }))
    const fetchMock = vi.fn(async (url) => {
      if (String(url).endsWith('/scores')) return { json: async () => ({ score: { id: 'score-1' } }), ok: true }
      if (String(url).endsWith('/users/me/profile')) return { json: async () => profileResponse(), ok: true }
      return { json: async () => ({ song: { id: 'song-1', title: 'Player Song' } }), ok: true }
    })
    vi.stubGlobal('fetch', fetchMock)
    const view = renderResults(result('registered-run'))
    expect(await screen.findByText(/score saved to your profile/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Leaderboard' })).toHaveAttribute(
      'href',
      '/rhythm-game/leaderboard?songId=song-1&difficulty=MEDIUM',
    )
    view.rerender(
      <AuthProvider>
        <MemoryRouter initialEntries={[{ pathname: '/game/song-1/results', state: { result: result('registered-run') } }]}>
          <Routes><Route path="/game/:songId/results" element={<RhythmResults />} /></Routes>
        </MemoryRouter>
      </AuthProvider>,
    )
    await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/scores'))).toHaveLength(1))
    await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/users/me/profile')).length).toBeGreaterThanOrEqual(2))
  })

  it('submits a creator public run while keeping draft previews unsaved', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', role: 'CREATOR' }))
    const fetchMock = vi.fn(async (url) => {
      if (String(url).endsWith('/scores')) return { json: async () => ({ score: { id: 'score-creator' } }), ok: true }
      if (String(url).endsWith('/users/me/profile')) return { json: async () => profileResponse(), ok: true }
      return { json: async () => ({ song: { id: 'song-1', title: 'Creator Song' } }), ok: true }
    })
    vi.stubGlobal('fetch', fetchMock)
    renderResults(result('creator-public-run'))
    expect(await screen.findByText(/score saved to your profile/i)).toBeInTheDocument()
    await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/scores'))).toHaveLength(1))
  })

  it('never saves a creator preview result', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', role: 'CREATOR' }))
    const fetchMock = vi.fn(async (url) => String(url).endsWith('/users/me/profile')
      ? { json: async () => profileResponse(), ok: true }
      : { json: async () => ({ song: { id: 'song-1', title: 'Draft Song' } }), ok: true })
    vi.stubGlobal('fetch', fetchMock)
    renderResults({ ...result('preview-run'), preview: true })
    expect(await screen.findByText(/does not affect player statistics/i)).toBeInTheDocument()
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/songs/creator/song-1'))).toBe(true))
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/scores'))).toBe(false)
    expect(screen.getByRole('link', { name: 'Back to Studio' })).toHaveAttribute('href', '/creator/studio/song-1')
  })
})
