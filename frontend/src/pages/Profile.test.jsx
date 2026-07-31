import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'
import { badgePresentation } from '../components/profile/badgeDefinitions'
import { scoreGrade } from '../components/profile/profileUtils'

function response(data, ok = true) { return Promise.resolve({ json: async () => data, ok, status: ok ? 200 : 500 }) }

describe('profile presentation helpers', () => {
  it.each([[95, 'S'], [90, 'A'], [80, 'B'], [70, 'C'], [69, 'D'], [null, null]])('grades %s accuracy as %s', (accuracy, grade) => expect(scoreGrade(accuracy)).toBe(grade))
  it('uses neutral metadata for an unknown badge', () => expect(badgePresentation('Unknown')).toMatchObject({ category: 'Journey' }))
})

describe('creator Profile', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  function renderCreatorProfile({ beatmaps = {}, failures = {}, profile = null, reflections = [], songs = [], summary = {} } = {}) {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Rose', role: 'CREATOR' }))
    window.history.pushState({}, '', '/creator/profile')
    vi.stubGlobal('fetch', vi.fn((url) => {
      const path = String(url)
      const failure = Object.entries(failures).find(([fragment]) => (
        fragment === '/songs/creator' ? path.endsWith(fragment) : path.includes(fragment)
      ))
      if (failure) return response({ message: failure[1] }, false)
      if (path.includes('/creators/me/profile')) return response(profile ? { profile } : {})
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

  it('renders Rose creator information and profile actions', async () => {
    renderCreatorProfile()

    expect(await screen.findByRole('heading', { level: 1, name: 'Rose' })).toBeInTheDocument()
    expect(screen.getByText('Creator & Storyteller')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Verified creator' })).toBeInTheDocument()
    expect(screen.getByText('Singapore-based artist')).toBeInTheDocument()
    expect(screen.getByText('English, Mandarin')).toBeInTheDocument()
    expect(screen.getByText('Creator since 2025')).toBeInTheDocument()
    expect(screen.getByText(/Every song is a conversation with Singapore's memories/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit Profile' })).toHaveAttribute('href', '/creator/profile/edit')
    expect(screen.getByRole('link', { name: 'Open Settings' })).toHaveAttribute('href', '/creator/settings')
  })

  it('shows only saved social links in the private profile hero', async () => {
    renderCreatorProfile({ profile: {
      bio: 'About Rose', contentFocus: ['Heritage'], creatorSince: '2025', creatorTitle: 'Creator & Storyteller',
      displayName: 'Rose', featuredQuote: 'Stories become songs.', languages: ['English'], location: 'Singapore',
      socialLinks: { instagram: 'https://instagram.com/Rose' }, tagline: 'Songs inspired by home.',
    } })

    const instagram = await screen.findByRole('link', { name: "Visit Rose's Instagram" })
    expect(instagram.closest('.creator-profile-hero')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: "Visit Rose's Website" })).not.toBeInTheDocument()
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

  it('shows approved reflections associated with Rose songs', async () => {
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
    expect(screen.getByRole('heading', { name: 'About Rose' })).toBeInTheDocument()
  })

  it('redirects guests away from the creator profile route', async () => {
    localStorage.clear()
    window.history.pushState({}, '', '/creator/profile')
    render(<AuthProvider><App /></AuthProvider>)

    await waitFor(() => expect(window.location.pathname).toBe('/login'))
    expect(screen.queryByRole('heading', { name: 'Rose' })).not.toBeInTheDocument()
  })
})
