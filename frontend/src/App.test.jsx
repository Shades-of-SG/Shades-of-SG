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

  it('opens a direct root visit as the logged-out public landing page', () => {
    localStorage.setItem('authToken', 'stale-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))

    render(<AuthProvider resetOnPublicEntry><App /></AuthProvider>)

    expect(screen.getByRole('heading', { level: 1, name: /shades of sg/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument()
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(localStorage.getItem('authUser')).toBeNull()
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

  it('renders creator-scoped My Songs data instead of mock songs', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/songs')
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ songs: [{
        artist: 'Database Artist', coverImageUrl: '', creatorId: 'creator-1', id: 'real-song-1',
        latestGenerationJob: null, publishMissing: [], publishReady: false, rawLyrics: 'Lyrics',
        status: 'DRAFT', title: 'Database Draft', updatedAt: new Date().toISOString(),
      }] }),
      ok: true, status: 200,
    })))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findAllByText('Database Draft')).not.toHaveLength(0)
    expect(screen.queryByText('Song #1')).not.toBeInTheDocument()
    expect(screen.getAllByText('Database Artist')).not.toHaveLength(0)
  })

  it('renders real dashboard summary counts without fake play totals', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/dashboard')
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({
        counts: { ARCHIVED: 1, DRAFT: 2, GENERATING: 0, PUBLISHED: 3, READY: 1, total: 7 },
        generationJobs: [], playAnalyticsAvailable: false, recentSongs: [],
      }),
      ok: true, status: 200,
    })))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByText('Play analytics')).toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    expect(screen.queryByText('1,240')).not.toBeInTheDocument()
    expect(screen.queryByText('Plays this week:')).not.toBeInTheDocument()
  })

  it('renders published backend Songs in the public library with real Explore links', async () => {
    window.history.pushState({}, '', '/songs')
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ songs: [{
        artist: 'Public Artist', coverImageUrl: 'https://media.example/cover.jpg',
        description: 'Published description', id: 'published-1', languages: ['English'],
        moodTags: ['Hopeful'], status: 'PUBLISHED', theme: 'Community', title: 'Published Song',
      }] }),
      ok: true, status: 200,
    })))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('heading', { name: 'Published Song' })).toBeInTheDocument()
    expect(screen.getByText('Public Artist')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explore Song' })).toHaveAttribute('href', '/songs/published-1')
    expect(screen.queryByText('Demo Song')).not.toBeInTheDocument()
  })

  it('loads Song Experience metadata and activity links using the real Song id', async () => {
    window.history.pushState({}, '', '/songs/published-42')
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ song: {
        artist: 'Experience Artist', coverImageUrl: '', description: 'Real cultural description',
        id: 'published-42', languages: ['English', 'Malay'], status: 'PUBLISHED',
        theme: 'Heritage', title: 'Experience Song', videoUrl: '',
      } }),
      ok: true, status: 200,
    })))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Experience Song' })).toBeInTheDocument()
    expect(screen.getByText('Experience Artist')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start Trivia' })).toHaveAttribute('href', '/songs/published-42/trivia')
    expect(screen.getByRole('link', { name: 'Open Playground' })).toHaveAttribute('href', '/songs/published-42/playground')
    expect(screen.getByRole('link', { name: 'Play Rhythm' })).toHaveAttribute('href', '/game/published-42')
    expect(screen.getByRole('link', { name: 'Share a Reflection' })).toHaveAttribute('href', '/reflections?song_id=published-42')
  })

  it('lists only playable published Songs in Rhythm Hub using covers and real ids', async () => {
    window.history.pushState({}, '', '/rhythm-game')
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ songs: [
        { artist: 'Playable Artist', audioUrl: 'https://media.example/song.mp3', coverImageUrl: 'https://media.example/rhythm.jpg', durationSecs: 60, id: 'playable-1', languages: ['English'], status: 'PUBLISHED', theme: 'Community', title: 'Playable Published Song' },
        { artist: 'No Audio', audioUrl: '', coverImageUrl: '', durationSecs: 0, id: 'unplayable-1', languages: [], status: 'PUBLISHED', title: 'Unplayable Song' },
      ] }),
      ok: true, status: 200,
    })))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('heading', { name: 'Playable Published Song' })).toBeInTheDocument()
    expect(screen.getByAltText('Playable Published Song cover')).toHaveAttribute('src', 'https://media.example/rhythm.jpg')
    expect(screen.getByRole('link', { name: 'Play Song' })).toHaveAttribute('href', '/game/playable-1')
    expect(screen.queryByText('Unplayable Song')).not.toBeInTheDocument()
  })

  it('preselects a published Song from the Reflection Wall deep link', async () => {
    window.history.pushState({}, '', '/reflections?song_id=11111111-1111-4111-8111-111111111111')
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      json: async () => String(url).includes('/reflections')
        ? { reflections: [] }
        : { songs: [{ id: '11111111-1111-4111-8111-111111111111', status: 'PUBLISHED', title: 'Deep Link Song' }] },
      ok: true, status: 200,
    })))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByDisplayValue('Deep Link Song')).toBeInTheDocument()
    expect(screen.queryByText(/requested Song is unavailable/i)).not.toBeInTheDocument()
  })
})
