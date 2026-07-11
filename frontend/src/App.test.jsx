import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AuthProvider } from './context/AuthContext'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders the public landing shell', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /shades of sg/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /browse songs/i })).toBeInTheDocument()
  })

  it('redirects guests away from the creator moderation route', async () => {
    window.history.pushState({}, '', '/creator/reflections')
    render(<AuthProvider><App /></AuthProvider>)

    await waitFor(() => expect(window.location.pathname).toBe('/login'))
    expect(screen.queryByRole('heading', { name: /reflection moderation/i })).not.toBeInTheDocument()
  })

  it('allows an authenticated creator to open reflection moderation', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/reflections')
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      json: async () => String(url).includes('/moderation')
        ? {
            pagination: { limit: 8, page: 1, total: 0, totalPages: 0 },
            reflections: [],
            stats: { approved: 0, flagged: 0, newToday: 0, newYesterday: 0, pending: 0 },
          }
        : { songs: [] },
      ok: true,
      status: 200,
    })))

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('heading', { name: /reflection moderation/i })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/creator/reflections')
  })

  it('loads an existing creator draft into Studio by song id', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/song-123')
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      json: async () => String(url).includes('/readiness')
        ? { generationStatus: null, missing: ['coverImageUrl'], ready: false, songStatus: 'DRAFT' }
        : {
            song: {
              artist: 'Studio Artist', description: 'Saved description', id: 'song-123',
              languages: ['English'], moodTags: ['hopeful'], otherLanguages: [],
              rawLyrics: 'Saved lyrics', status: 'DRAFT', theme: 'Community',
              title: 'Saved Studio Draft', updatedAt: new Date().toISOString(),
            },
          },
      ok: true,
      status: 200,
    })))

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByDisplayValue('Saved Studio Draft')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Studio Artist')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/creator/studio/song-123')
  })
})
