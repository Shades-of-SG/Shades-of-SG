import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'
import { badgePresentation } from '../components/profile/badgeDefinitions'
import { scoreGrade } from '../components/profile/profileUtils'

function renderProfile(fetchImplementation) {
  localStorage.setItem('authToken', 'registered-token')
  localStorage.setItem('authUser', JSON.stringify({ createdAt: '2025-05-01T00:00:00Z', email: 'ferlyn@example.com', id: 'user-1', name: 'Ferlyn', role: 'REGISTERED' }))
  window.history.pushState({}, '', '/profile')
  vi.stubGlobal('fetch', vi.fn(fetchImplementation))
  return render(<AuthProvider><App /></AuthProvider>)
}

function response(data, ok = true) { return Promise.resolve({ json: async () => data, ok, status: ok ? 200 : 500 }) }

describe('registered Profile', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('renders authenticated identity, earned badges, counts, memories, and scores', async () => {
    renderProfile((url) => {
      if (String(url).includes('/badges/')) return response({ badges: [{ earnedAt: '2026-01-01', id: 'b1', name: 'First Memory' }, { earnedAt: '2026-02-01', id: 'b2', name: 'Local Listener' }] })
      if (String(url).includes('/reflections/mine')) return response({ reflections: [{ content: 'A memory of home.', createdAt: '2026-01-02', displayMode: 'PROFILE', id: 'r1', isOwner: true, song: { title: 'Home' }, songId: 's1', tags: ['Home'] }] })
      return response({ scores: [{ accuracy: 96, createdAt: '2026-01-03', difficulty: 'EASY', id: 'g1', score: 1234, song: { title: 'Home' }, songId: 's1' }] })
    })
    expect(await screen.findByRole('heading', { name: 'Ferlyn' })).toBeInTheDocument()
    expect(screen.getByText('First Memory')).toBeInTheDocument()
    expect(screen.getByText('Local Listener')).toBeInTheDocument()
    expect(screen.getByText('A keepsake collected during your Shades of SG journey.')).toBeInTheDocument()
    expect(screen.getByText('A memory of home.')).toBeInTheDocument()
    expect(screen.getByLabelText('Edit memory')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete memory')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('Achievements earned').previousSibling).toHaveTextContent('2')
  })

  it('shows the empty keepsake state when no badges are earned', async () => {
    renderProfile((url) => response(String(url).includes('/badges/') ? { badges: [] } : String(url).includes('/scores/') ? { scores: [] } : { reflections: [] }))
    expect(await screen.findByText('Your keepsake shelf is waiting')).toBeInTheDocument()
  })

  it('keeps other sections usable when one profile request fails', async () => {
    renderProfile((url) => String(url).includes('/badges/') ? response({ message: 'Badge service unavailable' }, false) : response(String(url).includes('/scores/') ? { scores: [] } : { reflections: [] }))
    expect(await screen.findByText('Badge service unavailable')).toBeInTheDocument()
    expect(screen.getByText('No memories shared yet')).toBeInTheDocument()
    expect(screen.getByText('No rhythm scores yet')).toBeInTheDocument()
  })
})

describe('profile presentation helpers', () => {
  it.each([[95, 'S'], [90, 'A'], [80, 'B'], [70, 'C'], [69, 'D'], [null, null]])('grades %s accuracy as %s', (accuracy, grade) => expect(scoreGrade(accuracy)).toBe(grade))
  it('uses neutral metadata for an unknown badge', () => expect(badgePresentation('Unknown')).toMatchObject({ category: 'Journey' }))
})

describe('creator Profile', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  function renderCreatorProfile({ beatmaps = {}, failures = {}, reflections = [], songs = [], summary = {} } = {}) {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/profile')
    vi.stubGlobal('fetch', vi.fn((url) => {
      const path = String(url)
      const failure = Object.entries(failures).find(([fragment]) => (
        fragment === '/songs/creator' ? path.endsWith(fragment) : path.includes(fragment)
      ))
      if (failure) return response({ message: failure[1] }, false)
      if (path.includes('/songs/creator/dashboard/summary')) return response({ counts: {}, generationJobs: [], recentSongs: [], ...summary })
      if (path.includes('/reflections/moderation')) return response({ pagination: { limit: 24, page: 1, total: reflections.length, totalPages: 1 }, reflections, stats: {} })
      if (path.includes('/beatmaps')) {
        const songId = Object.keys(beatmaps).find((id) => path.includes(`/songs/${id}/`))
        return response({ beatmaps: songId ? beatmaps[songId] : [] })
      }
      if (path.endsWith('/songs/creator')) return response({ songs })
      return response({})
    }))

    return render(<AuthProvider><App /></AuthProvider>)
  }

  const publishedSong = {
    id: 'published-1', languages: ['English'], publishedDate: '2026-07-02', status: 'PUBLISHED',
    theme: 'Heritage', title: 'Orchid Skies', updatedAt: '2026-07-03',
  }
  const draftSong = {
    id: 'draft-1', languages: ['Mandarin'], status: 'DRAFT', theme: 'Community',
    title: 'Market Morning', updatedAt: '2026-07-08',
  }

  it('renders Violet creator information and profile actions', async () => {
    renderCreatorProfile()

    expect(await screen.findByRole('heading', { level: 1, name: 'Violet' })).toBeInTheDocument()
    expect(screen.getByText('Creator & Storyteller')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Verified creator' })).toBeInTheDocument()
    expect(screen.getByText('Singapore-based artist')).toBeInTheDocument()
    expect(screen.getByText('English, Mandarin')).toBeInTheDocument()
    expect(screen.getByText('Creator since 2025')).toBeInTheDocument()
    expect(screen.getByText(/Every song is a conversation with Singapore's memories/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit Profile' })).toHaveAttribute('href', '/creator/settings')
    expect(screen.getByRole('link', { name: 'Open Settings' })).toHaveAttribute('href', '/creator/settings')
  })

  it('calculates published, draft, ready, and total counts from creator songs', async () => {
    renderCreatorProfile({ songs: [publishedSong, draftSong, { ...draftSong, id: 'generating-1', status: 'GENERATING', title: 'Generating' }, { ...draftSong, id: 'ready-1', status: 'READY', title: 'Ready' }] })

    await waitFor(() => {
      expect(screen.getByText('Published songs').previousSibling).toHaveTextContent('1')
      expect(screen.getByText('In-progress songs').previousSibling).toHaveTextContent('2')
      expect(screen.getByText('Ready to publish').previousSibling).toHaveTextContent('1')
      expect(screen.getByText('Total songs').previousSibling).toHaveTextContent('4')
    })
  })

  it('orders published songs before drafts and exposes appropriate actions', async () => {
    renderCreatorProfile({ beatmaps: { 'published-1': [{ difficulty: 'EASY', status: 'PUBLISHED' }] }, songs: [draftSong, publishedSong] })

    await screen.findByRole('heading', { name: 'Orchid Skies' })
    const collection = screen.getByRole('heading', { name: 'Published Collection' }).closest('section')
    const songHeadings = within(collection).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    expect(songHeadings).toEqual(['Orchid Skies', 'Market Morning'])
    expect(within(collection).getByRole('link', { name: 'View Public Page' })).toHaveAttribute('href', '/songs/published-1')
    expect(within(collection).getByRole('link', { name: 'Continue Editing' })).toHaveAttribute('href', '/creator/studio/draft-1')
    expect(within(collection).getByText('Rhythm Ready')).toBeInTheDocument()
  })

  it('shows the collection empty state without fake songs', async () => {
    renderCreatorProfile()
    expect(await screen.findByRole('heading', { name: 'The collection is waiting for its first song' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create a song' })).toHaveAttribute('href', '/creator/studio/new')
  })

  it('shows approved reflections associated with Violet songs', async () => {
    renderCreatorProfile({
      reflections: [{ content: 'This brought back Sunday mornings with my grandmother.', createdAt: '2026-07-09', displayName: 'Mei', id: 'reflection-1', isAnonymous: false, song: { id: 'published-1', title: 'Orchid Skies' }, songId: 'published-1', status: 'APPROVED' }],
      songs: [publishedSong],
    })

    expect(await screen.findByText('This brought back Sunday mornings with my grandmother.')).toBeInTheDocument()
    expect(screen.getByText('Mei')).toBeInTheDocument()
    const community = screen.getByRole('heading', { name: 'From the Community' }).closest('section')
    expect(within(community).getByText(/Orchid Skies/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View All Reflections' })).toHaveAttribute('href', '/creator/reflections')
  })

  it('shows a reflection empty state instead of testimonials', async () => {
    renderCreatorProfile({ songs: [publishedSong] })
    expect(await screen.findByRole('heading', { name: 'Stories will gather here' })).toBeInTheDocument()
    expect(screen.getByText(/listeners begin sharing memories/i)).toBeInTheDocument()
  })

  it('renders a deduplicated recent activity list from real generation jobs', async () => {
    renderCreatorProfile({ summary: { generationJobs: [
      { createdAt: '2026-07-10', id: 'job-1', song: { id: 'published-1', title: 'Orchid Skies' }, status: 'COMPLETED' },
      { createdAt: '2026-07-09', id: 'job-2', song: { id: 'published-1', title: 'Orchid Skies' }, status: 'PROCESSING' },
    ] } })

    expect(await screen.findByText('Generation completed')).toBeInTheDocument()
    expect(screen.getAllByText('Orchid Skies')).toHaveLength(1)
    expect(screen.queryByText('Generation in progress')).not.toBeInTheDocument()
  })

  it('keeps section-specific API errors visible and retryable', async () => {
    renderCreatorProfile({ failures: { '/songs/creator': 'Unable to load creator songs.' } })

    expect(await screen.findByText('Unable to load creator songs.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Retry' })).not.toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'About Violet' })).toBeInTheDocument()
  })

  it('redirects guests away from the creator profile route', async () => {
    localStorage.clear()
    window.history.pushState({}, '', '/creator/profile')
    render(<AuthProvider><App /></AuthProvider>)

    await waitFor(() => expect(window.location.pathname).toBe('/login'))
    expect(screen.queryByRole('heading', { name: 'Violet' })).not.toBeInTheDocument()
  })
})
