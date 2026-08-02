import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AuthProvider } from './context/AuthContext'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders the public landing shell', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /discover singapore through music and memories/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /explore songs/i })).toBeInTheDocument()
  })

  it('keeps registration success reachable after verification signs the user in', () => {
    localStorage.setItem('authToken', 'registered-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'user-1', name: 'Bellen', role: 'REGISTERED' }))
    window.history.pushState({}, '', '/registration-success')

    render(<AuthProvider><App /></AuthProvider>)

    expect(screen.getByRole('heading', { name: 'Email verified' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue to your profile' })).toHaveAttribute('href', '/profile')
  })

  it('preserves an authenticated creator in User Mode across a direct root refresh', () => {
    localStorage.setItem('activeMode', 'user')
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))

    render(<AuthProvider><App /></AuthProvider>)

    expect(screen.getByRole('heading', { level: 1, name: /discover singapore through music and memories/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open user menu for Rose/i })).toBeInTheDocument()
    expect(localStorage.getItem('authToken')).toBe('creator-token')
    expect(localStorage.getItem('activeMode')).toBe('user')
  })

  it('switches an approved creator from the creator portal to the normal user shell', async () => {
    localStorage.setItem('activeMode', 'creator')
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({
      accountStatus: 'ACTIVE', creatorAccessStatus: 'ACTIVE', id: 'creator-1', name: 'Rose', role: 'CREATOR',
    }))
    window.history.pushState({}, '', '/creator/dashboard')
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ counts: {}, generationJobs: [], recentSongs: [] }),
      ok: true,
      status: 200,
    })))

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByText('Creator Mode')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /open creator menu for Rose.*creator mode/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Switch to User Mode' }))

    await waitFor(() => expect(window.location.pathname).toBe('/'))
    expect(localStorage.getItem('activeMode')).toBe('user')
    expect(JSON.parse(localStorage.getItem('authUser')).role).toBe('CREATOR')
    expect(screen.getByRole('button', { name: /open user menu for Rose/i })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Creator navigation' })).not.toBeInTheDocument()
  })

  it('switches an approved creator from the normal user menu to Creator Mode', async () => {
    localStorage.setItem('activeMode', 'user')
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({
      accountStatus: 'ACTIVE', creatorAccessStatus: 'ACTIVE', id: 'creator-1', name: 'Rose', role: 'CREATOR',
    }))
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ counts: {}, generationJobs: [], recentSongs: [] }),
      ok: true,
      status: 200,
    })))

    render(<AuthProvider><App /></AuthProvider>)

    fireEvent.click(screen.getByRole('button', { name: /open user menu for Rose/i }))
    expect(screen.getByText('User Mode')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Switch to Creator Mode' }))

    await waitFor(() => expect(window.location.pathname).toBe('/creator/dashboard'))
    expect(localStorage.getItem('activeMode')).toBe('creator')
    expect(JSON.parse(localStorage.getItem('authUser')).role).toBe('CREATOR')
    expect(await screen.findByText('Creator Mode')).toBeInTheDocument()
  })

  it('does not expose the Creator Mode switch to a creator with suspended creator access', () => {
    localStorage.setItem('activeMode', 'creator')
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({
      accountStatus: 'ACTIVE', creatorAccessStatus: 'SUSPENDED', creatorSuspensionReason: 'Programme review pending.',
      id: 'creator-1', name: 'Rose', role: 'CREATOR',
    }))

    render(<AuthProvider><App /></AuthProvider>)

    fireEvent.click(screen.getByRole('button', { name: /open user menu for Rose/i }))
    expect(screen.queryByRole('menuitem', { name: 'Switch to Creator Mode' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('status').some((status) => /creator access has been suspended/i.test(status.textContent))).toBe(true)
    expect(screen.getAllByRole('status').some((status) => status.textContent.includes('Programme review pending.'))).toBe(true)
    expect(localStorage.getItem('activeMode')).toBe('user')
  })

  it('uses CreatorRoute to keep User Mode out of direct creator URLs', async () => {
    localStorage.setItem('activeMode', 'user')
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({
      accountStatus: 'ACTIVE', creatorAccessStatus: 'ACTIVE', id: 'creator-1', name: 'Rose', role: 'CREATOR',
    }))
    window.history.pushState({}, '', '/creator/dashboard')

    render(<AuthProvider><App /></AuthProvider>)

    await waitFor(() => expect(window.location.pathname).toBe('/'))
    expect(screen.queryByRole('navigation', { name: 'Creator navigation' })).not.toBeInTheDocument()
  })

  it('uses only the top-navbar account menu on registered settings pages', () => {
    localStorage.setItem('authToken', 'registered-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'user-1', name: 'Bellen', role: 'REGISTERED' }))
    window.history.pushState({}, '', '/settings')

    render(<AuthProvider><App /></AuthProvider>)

    expect(screen.getByRole('button', { name: /open user menu for bellen/i })).toBeInTheDocument()
    expect(screen.queryByLabelText('Creator account actions')).not.toBeInTheDocument()
  })

  it('redirects guests away from the creator moderation route', async () => {
    window.history.pushState({}, '', '/creator/reflections')
    render(<AuthProvider><App /></AuthProvider>)

    await waitFor(() => expect(window.location.pathname).toBe('/'))
    expect(screen.getByRole('heading', { level: 1, name: /discover singapore through music and memories/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /reflection moderation/i })).not.toBeInTheDocument()
  })

  it('allows an authenticated creator to open reflection moderation', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
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

  it('redirects the legacy creator plays route to the main analytics page', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/plays')
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({
        events: { SONG_PLAYBACK_STARTED: 3 }, generationJobs: {}, reflections: {}, rhythmScores: 2,
        songs: { PUBLISHED: 1, total: 1 },
      }),
      ok: true,
      status: 200,
    })))

    render(<AuthProvider><App /></AuthProvider>)

    await waitFor(() => expect(window.location.pathname).toBe('/creator/analytics'))
    expect(await screen.findByRole('heading', { name: 'My song analytics' })).toBeInTheDocument()
    expect(screen.getByText('Playback starts')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Total Plays' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Analytics' })).toHaveAttribute('href', '/creator/analytics')
  })

  it('blocks a creator-suspended user from direct creator URLs while keeping regular-user navigation', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({
      accountStatus: 'ACTIVE', creatorAccessStatus: 'SUSPENDED',
      creatorSuspensionReason: 'Programme review pending.', id: 'creator-1', name: 'Rose', role: 'CREATOR',
    }))
    window.history.pushState({}, '', '/creator/dashboard')

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('heading', { name: /creator tools are temporarily unavailable/i })).toBeInTheDocument()
    expect(screen.getByText(/You can continue using Shades of SG as a regular user/)).toBeInTheDocument()
    expect(screen.getByText('Programme review pending.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /continue to your profile/i })).toHaveAttribute('href', '/profile')
    expect(screen.queryByRole('navigation', { name: /creator navigation/i })).not.toBeInTheDocument()
  })

  it('lets a creator-suspended user open the regular user profile', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({
      accountStatus: 'ACTIVE', creatorAccessStatus: 'SUSPENDED',
      id: 'creator-1', name: 'Rose', role: 'CREATOR',
    }))
    window.history.pushState({}, '', '/profile')
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      json: async () => String(url).includes('/badges/') ? { badges: [] } : String(url).includes('/scores/mine') ? { scores: [] } : { reflections: [] },
      ok: true,
      status: 200,
    })))

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('heading', { name: 'My Memories' })).toBeInTheDocument()
    expect(screen.getByText(/You can continue using Shades of SG as a regular user/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Creator account actions')).not.toBeInTheDocument()
  })

  it('shows the reason and appeal guidance for a fully suspended cached account', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({
      accountStatus: 'SUSPENDED', accountSuspensionReason: 'Account safety review.',
      creatorAccessStatus: 'ACTIVE', id: 'creator-1', name: 'Rose', role: 'CREATOR',
    }))
    window.history.pushState({}, '', '/creator/dashboard')

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('heading', { name: /Your Shades of SG account is unavailable/i })).toBeInTheDocument()
    expect(screen.getByText('Account safety review.')).toBeInTheDocument()
    expect(screen.getByText(/appeal/i)).toBeInTheDocument()
  })

  it('sends the creator token when loading generation progress', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/generation/job-123')
    const fetchMock = vi.fn(async () => ({
      json: async () => ({
        data: {
          id: 'job-123',
          song: { artist: 'Rose', sceneSegments: [], title: 'Generation Test' },
          status: 'COMPLETED',
        },
        success: true,
      }),
      ok: true,
      status: 200,
    }))
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByText('Generation Test')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/generation/job-123/status'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer creator-token' }) }),
    )
    expect(screen.queryByText(/unauthorized/i)).not.toBeInTheDocument()
  })

  it('loads an existing creator draft into Studio by song id', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/song-123')
    const savedAt = new Date('2026-07-20T14:34:00.000Z')
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      json: async () => String(url).includes('/readiness')
        ? { generationStatus: null, missing: ['coverImageUrl'], ready: false, songStatus: 'DRAFT' }
        : {
            song: {
              artist: 'Studio Artist', audioUrl: 'https://media.example/saved-track.mp3', description: 'Saved description', id: 'song-123',
              languages: ['English'], moodTags: ['hopeful'], otherLanguages: [],
              rawLyrics: 'Saved lyrics', status: 'DRAFT', theme: 'Community',
              title: 'Saved Studio Draft', updatedAt: savedAt.toISOString(),
            },
          },
      ok: true,
      status: 200,
    })))

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByDisplayValue('Saved Studio Draft')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Studio Artist')).toBeInTheDocument()
    expect(screen.getByText('Saved media: saved-track.mp3')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', 'https://media.example/saved-track.mp3')
    expect(
      screen.queryByRole('heading', { name: 'Rhythm Game' })
    ).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Next: Lyrics' })
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Next: Beatmap' })
    )

    expect(
      await screen.findByRole('heading', { name: 'Rhythm Game' })
    ).toBeInTheDocument()
    expect(screen.getAllByText(`Draft last saved ${savedAt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`).length).toBeGreaterThan(0)
    expect(window.location.pathname).toBe('/creator/studio/song-123')
  })

  it('shows publishing tasks only after Publish is attempted and uses friendly video choices', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/song-456')
    const savedSong = {
      artist: 'Rose', audioUrl: 'https://media.example/song.mp3', coverImageUrl: 'https://media.example/cover.jpg',
      description: 'Description', durationSecs: 120, id: 'song-456', languages: ['English'], moodTags: [],
      otherLanguages: [], rawLyrics: 'Lyrics', status: 'DRAFT', theme: 'Community', title: 'Modal Song', updatedAt: new Date().toISOString(),
    }
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const path = String(url)
      if (path.includes('/beatmaps')) return { json: async () => ({ beatmaps: [] }), ok: true, status: 200 }
      if (path.includes('/transcriptions/status')) return { json: async () => ({ configured: true }), ok: true, status: 200 }
      if (path.includes('/readiness')) return { json: async () => ({ missing: ['videoUrl', 'status READY'], ready: false, songStatus: 'DRAFT' }), ok: true, status: 200 }
      return { json: async () => ({ song: savedSong }), ok: true, status: 200 }
    }))

    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByDisplayValue('Modal Song')).toBeInTheDocument()
    expect(screen.queryByText(/Publishing requirements remaining|videoUrl|status READY/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next: Lyrics' }))
    fireEvent.click(screen.getByRole('button', {name: 'Next: Beatmap',}))
    fireEvent.click(screen.getByRole('button', { name: 'Next: Preview & Publish' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish Song' })[0])

    expect(await screen.findByRole('dialog', { name: 'Complete these tasks before publishing' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate AI Video' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload Video' })).toBeInTheDocument()
    expect(screen.queryByText(/videoUrl|status READY/)).not.toBeInTheDocument()
  })

  it('publishes with a saved MP4 song-media upload without asking for another video', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/song-mp4')
    const savedSong = {
      artist: 'Rose', audioFileName: 'finished-song.mp4', audioUrl: 'https://media.example/finished-song.mp4',
      coverImageUrl: 'https://media.example/cover.jpg', description: 'Description', durationSecs: 120,
      id: 'song-mp4', languages: ['English'], moodTags: [], otherLanguages: [], rawLyrics: 'Lyrics',
      status: 'GENERATING', theme: 'Community', title: 'Uploaded Video Song', updatedAt: new Date().toISOString(),
    }
    const fetchMock = vi.fn(async (url) => {
      const path = String(url)
      if (path.includes('/beatmaps')) return { json: async () => ({ beatmaps: [] }), ok: true, status: 200 }
      if (path.includes('/readiness')) return { json: async () => ({ missing: [], ready: true, songStatus: 'READY' }), ok: true, status: 200 }
      if (path.includes('/publish')) return { json: async () => ({ song: { ...savedSong, status: 'PUBLISHED', videoUrl: savedSong.audioUrl } }), ok: true, status: 200 }
      return { json: async () => ({ song: savedSong }), ok: true, status: 200 }
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByDisplayValue('Uploaded Video Song')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'English' })).toBeChecked()
    fireEvent.click(
      screen.getByRole('button', { name: 'Next: Lyrics' })
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Next: Beatmap' })
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Next: Preview & Publish' })
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish Song' })[0])

    expect(await screen.findByText('Song published successfully.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Complete these tasks before publishing' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/songs/song-mp4/publish'), expect.objectContaining({ method: 'PUT' }))
  })

  it('uploads the MP4 selected in the publish prompt and publishes immediately', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/song-upload-final')
    const draft = {
      artist: 'Rose', audioUrl: 'https://media.example/source.mp3', coverImageUrl: 'https://media.example/cover.jpg',
      description: 'Description', durationSecs: 120, id: 'song-upload-final', languages: ['English'], moodTags: [],
      otherLanguages: [], rawLyrics: 'Lyrics', status: 'DRAFT', theme: 'Community', title: 'Final Upload Song',
      updatedAt: new Date().toISOString(),
    }
    const readySong = { ...draft, status: 'READY', videoUrl: 'https://media.example/final.mp4' }
    const fetchMock = vi.fn(async (url) => {
      const path = String(url)
      if (path.includes('/beatmaps')) return { json: async () => ({ beatmaps: [] }), ok: true, status: 200 }
      if (path.endsWith('/video')) return { json: async () => ({ song: readySong }), ok: true, status: 200 }
      if (path.includes('/readiness')) return { json: async () => ({ missing: [], ready: true, songStatus: 'READY' }), ok: true, status: 200 }
      if (path.includes('/publish')) return { json: async () => ({ song: { ...readySong, status: 'PUBLISHED' } }), ok: true, status: 200 }
      return { json: async () => ({ song: draft }), ok: true, status: 200 }
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByDisplayValue('Final Upload Song')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Next: Lyrics' })
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Next: Beatmap' })
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Next: Preview & Publish' })
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish Song' })[0])
    const file = new File(['video'], 'final.mp4', { type: 'video/mp4' })
    fireEvent.change(await screen.findByLabelText('Upload finished video'), { target: { files: [file] } })

    expect(await screen.findByText('Video uploaded and song published successfully.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/songs/song-upload-final/video'), expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/songs/song-upload-final/publish'), expect.objectContaining({ method: 'PUT' }))
  })

  it('shows save errors only after Save Draft and dismisses them after five seconds', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/new')
    vi.useFakeTimers()
    render(<AuthProvider><App /></AuthProvider>)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }))
      await Promise.resolve()
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Add a song title before saving your draft.')
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('creates metadata first and uploads a new MP4 through the video endpoint', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/new')
    const draft = { id: 'mp4-draft', status: 'DRAFT', title: 'MP4 Draft', updatedAt: new Date().toISOString() }
    const ready = { ...draft, status: 'READY', videoUrl: 'https://media.example/uploaded.mp4' }
    const fetchMock = vi.fn(async (url) => {
      const path = String(url)
      if (path.includes('/transcriptions/status')) return { json: async () => ({ configured: true }), ok: true, status: 200 }
      if (path.endsWith('/songs/creator/mp4-draft')) return { json: async () => ({ song: ready }), ok: true, status: 200 }
      if (path.endsWith('/songs')) return { json: async () => ({ song: draft }), ok: true, status: 201 }
      if (path.endsWith('/songs/mp4-draft/video')) return { json: async () => ({ song: ready }), ok: true, status: 200 }
      return { json: async () => ({ beatmaps: [] }), ok: true, status: 200 }
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthProvider><App /></AuthProvider>)
    fireEvent.change(screen.getByPlaceholderText('Song Title'), { target: { value: 'MP4 Draft' } })
    const file = new File(['video'], 'finished.mp4', { type: 'video/mp4' })
    fireEvent.change(screen.getByLabelText('Upload song media'), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }))

    expect(await screen.findByText('Draft saved.')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/creator/studio/mp4-draft')
    const createCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/songs'))
    const videoCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/songs/mp4-draft/video'))
    expect(createCall[1]).toMatchObject({ method: 'POST' })
    expect(createCall[1].body).toBeTypeOf('string')
    expect(videoCall[1]).toMatchObject({ method: 'POST' })
    expect(videoCall[1].body).toBeInstanceOf(FormData)
    fireEvent.click(screen.getByRole('button', { name: 'Next: Lyrics' }))
    expect(await screen.findByRole('button', { name: 'Extract Lyrics' })).toBeEnabled()
  })

  it('renders creator-scoped My Songs data instead of mock songs', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/songs')
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ songs: [{
        artist: 'Database Artist', coverImageUrl: '', creatorId: 'creator-1', id: 'real-song-1',
        latestGenerationJob: { id: 'job-1', status: 'PROCESSING' }, publishMissing: [], publishReady: false, rawLyrics: 'Lyrics',
        status: 'GENERATING', title: 'Database Draft', updatedAt: new Date().toISOString(),
      }] }),
      ok: true, status: 200,
    })))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findAllByText('Database Draft')).not.toHaveLength(0)
    expect(screen.queryByText('Song #1')).not.toBeInTheDocument()
    expect(screen.getAllByText('Database Artist')).not.toHaveLength(0)
    const editButton = screen.getByRole('button', { name: 'Edit song' })
    expect(editButton).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Archive song' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete song' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'View Generation' })).toBeEnabled()
    fireEvent.click(editButton)
    expect(window.location.pathname).toBe('/creator/studio/real-song-1')
  })

  it('uses the archive icon as an archive and unarchive toggle', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/songs')
    let status = 'ARCHIVED'
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const path = String(url)
      if (path.endsWith('/unarchive')) status = 'READY'
      const song = {
        artist: 'Archive Artist', audioUrl: 'https://media.example/archive.mp3', creatorId: 'creator-1',
        id: 'archive-song-1', latestGenerationJob: null, rawLyrics: 'Lyrics', status,
        title: 'Archived Song', updatedAt: new Date().toISOString(),
      }
      return {
        json: async () => path.endsWith('/unarchive') ? { song } : { songs: [song] },
        ok: true,
        status: 200,
      }
    }))

    render(<AuthProvider><App /></AuthProvider>)
    const restoreButton = await screen.findByRole('button', { name: 'Unarchive song' })
    fireEvent.click(restoreButton)

    expect(await screen.findByText('Song restored.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Archive song' })).toBeEnabled()
  })

  it('renders real dashboard summary counts without fake play totals', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
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
    expect(screen.getByText('Playback starts')).toBeInTheDocument()
    expect(screen.getByRole('link', {
      name: 'View play analytics',
    })).toHaveAttribute('href', '/creator/analytics')
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
    expect(await screen.findAllByRole('heading', { name: 'Published Song' })).toHaveLength(2)
    expect(screen.getAllByText('Public Artist')).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Explore Song' })).toHaveAttribute('href', '/songs/published-1')
    expect(screen.queryByText('Demo Song')).not.toBeInTheDocument()
  })

  it('loads Song Experience metadata and activity links using the real Song id', async () => {
    window.history.pushState({}, '', '/songs/published-42')
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      json: async () => String(url).includes('/beatmaps') ? { beatmaps: [{ difficulty: 'MEDIUM', status: 'PUBLISHED' }] } : ({ song: {
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
    expect(screen.getByRole('link', { name: 'Play Medium Rhythm' })).toHaveAttribute('href', '/game/published-42?difficulty=MEDIUM')
    expect(screen.getByRole('link', { name: 'Share a Reflection' })).toHaveAttribute('href', '/reflections?song_id=published-42')
    expect(screen.getByRole('button', { name: /play angklung/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play kompang/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play erhu/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play tabla/i })).toBeInTheDocument()
    expect(screen.getByText(/which band performed the 2016 ndp theme song/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'B. 53A' })).toBeInTheDocument()
  })

  it('prioritizes linked API instruments over Song Experience placeholders', async () => {
    window.history.pushState({}, '', '/songs/published-with-instruments')
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      json: async () => String(url).includes('/beatmaps') ? { beatmaps: [] } : ({ song: {
        artist: 'Instrument Artist', id: 'published-with-instruments', instruments: [{
          description: 'A linked instrument description.', id: 'linked-kulintang', imageUrl: 'https://media.example/kulintang.jpg', name: 'Kulintang', origin: 'Southeast Asia',
        }], status: 'PUBLISHED', title: 'Linked Instrument Song', triviaQuestions: [{
          correctAnswer: 'API answer', options: ['API answer', 'Other answer'], prompt: 'API quiz question?',
        }],
      } }),
      ok: true, status: 200,
    })))

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('button', { name: /play kulintang: a linked instrument description/i })).toBeInTheDocument()
    expect(screen.getByAltText('Kulintang')).toHaveAttribute('src', 'https://media.example/kulintang.jpg')
    expect(screen.queryByRole('button', { name: /play angklung/i })).not.toBeInTheDocument()
    expect(screen.getByText('API quiz question?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'A. API answer' })).toBeInTheDocument()
    expect(screen.queryByText(/which band performed the 2016 ndp theme song/i)).not.toBeInTheDocument()
  })

  it('shows the recovered instrument placeholders in an empty song playground', async () => {
    window.history.pushState({}, '', '/songs/playground-song/playground')
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ song: {
        artist: 'Playground Artist', id: 'playground-song', instruments: [], languages: ['English'], status: 'PUBLISHED', theme: 'Community', title: 'Playground Song',
      } }),
      ok: true, status: 200,
    })))

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('heading', { name: 'Playground Song Playground' })).toBeInTheDocument()
    expect(screen.getByText('Angklung')).toBeInTheDocument()
    expect(screen.getByText('Kompang')).toBeInTheDocument()
    expect(screen.getByText('Erhu')).toBeInTheDocument()
    expect(screen.getByText('Tabla')).toBeInTheDocument()
    expect(screen.getByText(/bamboo instrument shaken to produce a note/i)).toBeInTheDocument()
    expect(screen.queryByText(/instruments unavailable/i)).not.toBeInTheDocument()
  })

  it('keeps a published song usable while disabling rhythm when no beatmap is published', async () => {
    window.history.pushState({}, '', '/songs/published-no-rhythm')
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      json: async () => String(url).includes('/beatmaps') ? { beatmaps: [{ difficulty: 'MEDIUM', status: 'NOT_CREATED' }] } : { song: { id: 'published-no-rhythm', status: 'PUBLISHED', title: 'Song Without Rhythm' } },
      ok: true, status: 200,
    })))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Song Without Rhythm' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /play rhythm/i })).not.toBeInTheDocument()
    expect(screen.getByText('Rhythm game unavailable')).toHaveAttribute('title', 'This rhythm game is not available yet.')
  })

  it('groups published Rhythm Hub difficulties into one playable song row', async () => {
    window.history.pushState({}, '', '/rhythm-game')
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      json: async () => {
        if (String(url).includes('/songs/playable-1/beatmaps')) return { beatmaps: [
          { difficulty: 'HARD', published: { noteCount: 100 }, status: 'PUBLISHED' },
          { difficulty: 'EASY', published: { noteCount: 40 }, status: 'PUBLISHED' },
          { difficulty: 'MEDIUM', published: { noteCount: 70 }, status: 'PUBLISHED' },
          { difficulty: 'MEDIUM', noteCount: 72, status: 'DRAFT' },
        ] }
        if (String(url).includes('/songs/no-published-rhythm/beatmaps')) return { beatmaps: [
          { difficulty: 'EASY', status: 'NOT_CREATED' },
          { difficulty: 'MEDIUM', noteCount: 70, status: 'DRAFT' },
        ] }
        return { songs: [
          { artist: 'Playable Artist', audioUrl: 'https://media.example/song.mp3', coverImageUrl: 'https://media.example/rhythm.jpg', durationSecs: 60, id: 'playable-1', languages: ['English'], status: 'PUBLISHED', theme: 'Community', title: 'Playable Published Song' },
          { artist: 'Draft Mapper', audioUrl: 'https://media.example/draft.mp3', coverImageUrl: '', durationSecs: 60, id: 'no-published-rhythm', languages: ['Malay'], status: 'PUBLISHED', theme: 'Heritage', title: 'No Published Rhythm Song' },
          { artist: 'No Audio', audioUrl: '', coverImageUrl: '', durationSecs: 0, id: 'unplayable-1', languages: [], status: 'PUBLISHED', title: 'Unplayable Song' },
        ] }
      },
      ok: true, status: 200,
    })))
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('article', { name: 'Playable Published Song' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { name: 'Playable Published Song' })).toHaveLength(1)
    expect(screen.getAllByAltText('Playable Published Song cover artwork')).toHaveLength(1)
    expect(screen.getByText('3 difficulties available')).toBeInTheDocument()
    expect(screen.getByText('1:00')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Play Playable Published Song on Easy difficulty' })).toHaveAttribute('href', '/game/playable-1?difficulty=EASY')
    expect(screen.getByRole('link', { name: 'Play Playable Published Song on Medium difficulty' })).toHaveAttribute('href', '/game/playable-1?difficulty=MEDIUM')
    expect(screen.getByRole('link', { name: 'Play Playable Published Song on Hard difficulty' })).toHaveAttribute('href', '/game/playable-1?difficulty=HARD')
    expect(screen.queryByText('No Published Rhythm Song')).not.toBeInTheDocument()
    expect(screen.queryByText('Unplayable Song')).not.toBeInTheDocument()
  })

  it('formats Rhythm Hub duration and sorts loaded songs by newest, title, or artist', async () => {
    window.history.pushState({}, '', '/rhythm-game')
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      json: async () => String(url).includes('/beatmaps')
        ? { beatmaps: [{ difficulty: 'EASY', published: { id: 'easy-map', noteCount: 32 }, status: 'PUBLISHED' }] }
        : { songs: [
          { artist: 'Zulu Artist', audioUrl: 'https://media.example/older.mp3', coverImageUrl: '', durationSecs: 65, id: 'older-song', languages: ['English'], publishedDate: '2026-01-05T00:00:00.000Z', theme: 'Community', title: 'Alpha Echo' },
          { artist: 'Alpha Artist', audioUrl: 'https://media.example/newer.mp3', coverImageUrl: '', durationSecs: 125, id: 'newer-song', languages: ['Malay'], publishedDate: '2026-06-10T00:00:00.000Z', theme: 'Heritage', title: 'Zulu Beat' },
        ] },
      ok: true,
      status: 200,
    })))

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findAllByRole('article')).toHaveLength(2)
    expect(screen.getAllByRole('article')[0]).toHaveTextContent('Zulu Beat')
    expect(screen.getAllByText('1 difficulty available')).toHaveLength(2)
    expect(screen.getByText('1:05')).toBeInTheDocument()
    expect(screen.getByText('2:05')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'title' } })
    expect(screen.getAllByRole('article')[0]).toHaveTextContent('Alpha Echo')

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'artist' } })
    expect(screen.getAllByRole('article')[0]).toHaveTextContent('Zulu Beat')
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
