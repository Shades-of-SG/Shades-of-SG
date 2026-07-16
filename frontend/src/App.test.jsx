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

  it('sends the creator token when loading generation progress', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/generation/job-123')
    const fetchMock = vi.fn(async () => ({
      json: async () => ({
        data: {
          id: 'job-123',
          song: { artist: 'Violet', sceneSegments: [], title: 'Generation Test' },
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
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/song-123')
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      json: async () => String(url).includes('/readiness')
        ? { generationStatus: null, missing: ['coverImageUrl'], ready: false, songStatus: 'DRAFT' }
        : {
            song: {
              artist: 'Studio Artist', audioUrl: 'https://media.example/saved-track.mp3', description: 'Saved description', id: 'song-123',
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
    expect(screen.getByText('Saved media: saved-track.mp3')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', 'https://media.example/saved-track.mp3')
    expect(screen.getByRole('heading', { name: 'Rhythm Game' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/creator/studio/song-123')
  })

  it('shows publishing tasks only after Publish is attempted and uses friendly video choices', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/song-456')
    const savedSong = {
      artist: 'Violet', audioUrl: 'https://media.example/song.mp3', coverImageUrl: 'https://media.example/cover.jpg',
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
    fireEvent.click(screen.getByRole('button', { name: 'Next: Preview & Publish' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish Song' })[0])

    expect(await screen.findByRole('dialog', { name: 'Complete these tasks before publishing' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate AI Video' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload Video' })).toBeInTheDocument()
    expect(screen.queryByText(/videoUrl|status READY/)).not.toBeInTheDocument()
  })

  it('publishes with a saved MP4 song-media upload without asking for another video', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/song-mp4')
    const savedSong = {
      artist: 'Violet', audioFileName: 'finished-song.mp4', audioUrl: 'https://media.example/finished-song.mp4',
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
    fireEvent.click(screen.getByRole('button', { name: 'Next: Lyrics' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next: Preview & Publish' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish Song' })[0])

    expect(await screen.findByText('Song published successfully.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Complete these tasks before publishing' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/songs/song-mp4/publish'), expect.objectContaining({ method: 'PUT' }))
  })

  it('uploads the MP4 selected in the publish prompt and publishes immediately', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/song-upload-final')
    const draft = {
      artist: 'Violet', audioUrl: 'https://media.example/source.mp3', coverImageUrl: 'https://media.example/cover.jpg',
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
    fireEvent.click(screen.getByRole('button', { name: 'Next: Lyrics' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next: Preview & Publish' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish Song' })[0])
    const file = new File(['video'], 'final.mp4', { type: 'video/mp4' })
    fireEvent.change(await screen.findByLabelText('Upload finished video'), { target: { files: [file] } })

    expect(await screen.findByText('Video uploaded and song published successfully.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/songs/song-upload-final/video'), expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/songs/song-upload-final/publish'), expect.objectContaining({ method: 'PUT' }))
  })

  it('shows save errors only after Save Draft and dismisses them after five seconds', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
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
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/studio/new')
    const draft = { id: 'mp4-draft', status: 'DRAFT', title: 'MP4 Draft', updatedAt: new Date().toISOString() }
    const ready = { ...draft, status: 'READY', videoUrl: 'https://media.example/uploaded.mp4' }
    const fetchMock = vi.fn(async (url) => {
      const path = String(url)
      if (path.includes('/transcriptions/status')) return { json: async () => ({ configured: true }), ok: true, status: 200 }
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
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
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
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
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
