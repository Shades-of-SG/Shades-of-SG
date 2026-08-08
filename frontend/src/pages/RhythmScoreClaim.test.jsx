import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { readPendingScoreClaim, storePendingScoreClaim } from '../services/pendingScoreClaim'
import RhythmScoreClaim from './RhythmScoreClaim'
import { markNewAccountScoreClaim, storeRegistrationReturn } from '../services/safeReturnPath'

const result = {
  accuracy: 90, badHits: 1, difficulty: 'EASY', earlyReleases: 0, goodHits: 1,
  greatHits: 2, holdCompletions: 0, maxCombo: 8, misses: 0, perfectHits: 6,
  playedAt: new Date().toISOString(), rank: 'A', score: 8000, songId: 'song-1', totalNotes: 10,
}

function renderClaim() {
  return render(<AuthProvider><MemoryRouter><RhythmScoreClaim /></MemoryRouter></AuthProvider>)
}

describe('RhythmScoreClaim', () => {
  beforeEach(() => {
    localStorage.clear(); sessionStorage.clear()
    localStorage.setItem('authToken', 'player-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'player-1', role: 'REGISTERED' }))
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('submits once, refreshes the profile, and clears only after confirmation', async () => {
    const pending = storePendingScoreClaim(result)
    const fetchMock = vi.fn((url) => String(url).endsWith('/scores')
      ? Promise.resolve({ json: async () => ({ score: { id: 'score-1' } }), ok: true })
      : Promise.resolve({ json: async () => ({ badges: [], profile: { displayName: 'Player' }, reflections: [], rhythm: {} }), ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    renderClaim()

    expect(await screen.findByText('Your score has been saved to your account.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/scores'))).toHaveLength(1)
    const claimCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/scores'))
    expect(JSON.parse(claimCall[1].body)).toMatchObject({ claimId: pending.claimId, score: 8000, songId: 'song-1' })
    expect(readPendingScoreClaim()).toBeNull()
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/users/me/profile'))).toBe(true))
  })

  it('retains a failed claim and supports a successful retry', async () => {
    const pending = storePendingScoreClaim(result)
    storeRegistrationReturn('/rhythm-game/claim')
    let attempts = 0
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (String(url).endsWith('/scores')) {
        attempts += 1
        return Promise.resolve(attempts === 1
          ? { json: async () => ({ message: 'internal details' }), ok: false }
          : { json: async () => ({ score: { id: 'score-1' } }), ok: true })
      }
      return Promise.resolve({ json: async () => ({ badges: [], profile: {}, reflections: [], rhythm: {} }), ok: true })
    }))

    renderClaim()
    expect(await screen.findByRole('heading', { name: /couldn.t save your score/i })).toBeInTheDocument()
    expect(readPendingScoreClaim()).toMatchObject({ claimId: pending.claimId })
    expect(sessionStorage.getItem('shades-of-sg:registration-return')).toBe('/rhythm-game/claim')
    expect(screen.queryByText('internal details')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Retry saving' }))
    expect(await screen.findByText('Your score has been saved to your account.')).toBeInTheDocument()
    expect(attempts).toBe(2)
    expect(readPendingScoreClaim()).toBeNull()
    expect(sessionStorage.getItem('shades-of-sg:registration-return')).toBeNull()
  })

  it('uses new-account feedback and clears the durable return only after success', async () => {
    storePendingScoreClaim(result)
    storeRegistrationReturn('/rhythm-game/claim')
    markNewAccountScoreClaim('/rhythm-game/claim')
    vi.stubGlobal('fetch', vi.fn((url) => String(url).endsWith('/scores')
      ? Promise.resolve({ json: async () => ({ score: { id: 'score-1' } }), ok: true })
      : Promise.resolve({ json: async () => ({ badges: [], profile: {}, reflections: [], rhythm: {} }), ok: true })))

    renderClaim()

    expect(await screen.findByText('Your score has been saved to your new account.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Saved Result' })).toHaveAttribute('href', '/game/song-1/results')
    expect(sessionStorage.getItem('shades-of-sg:registration-return')).toBeNull()
  })

  it('does not submit when the pending result is unavailable', () => {
    storePendingScoreClaim(result, Date.now() - (46 * 60 * 1000))
    storeRegistrationReturn('/rhythm-game/claim')
    markNewAccountScoreClaim('/rhythm-game/claim')
    const fetchMock = vi.fn((url) => String(url).endsWith('/users/me/profile')
      ? Promise.resolve({ json: async () => ({ profile: {} }), ok: true })
      : Promise.resolve({ json: async () => ({}), ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    renderClaim()
    expect(screen.getByRole('heading', { name: 'This guest result is no longer available' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/scores'))).toBe(false)
    expect(sessionStorage.getItem('shades-of-sg:registration-return')).toBeNull()
  })
})
