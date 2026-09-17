import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import Landing from './Landing'

const mocks = vi.hoisted(() => ({
  getBadgeCatalog: vi.fn(),
  getCommunityStats: vi.fn(),
  getMyBestScores: vi.fn(),
  getMyStats: vi.fn(),
  getPublishedSongs: vi.fn(),
  getReflections: vi.fn(),
  getReflectionComments: vi.fn(),
  likeReflection: vi.fn(),
  unlikeReflection: vi.fn(),
  getUserBadges: vi.fn(),
}))

vi.mock('../services/badgeService', () => ({ getBadgeCatalog: mocks.getBadgeCatalog, getUserBadges: mocks.getUserBadges }))
vi.mock('../services/publicSongService', () => ({ getPublishedSongs: mocks.getPublishedSongs }))
vi.mock('../services/reflectionService', () => ({ getReflections: mocks.getReflections, getReflectionComments: mocks.getReflectionComments, likeReflection: mocks.likeReflection, unlikeReflection: mocks.unlikeReflection }))
vi.mock('../services/scoreService', () => ({ getMyBestScores: mocks.getMyBestScores }))
vi.mock('../services/statsService', () => ({
  getCommunityStats: mocks.getCommunityStats,
  getMyStats: mocks.getMyStats,
}))

function renderLanding() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Landing />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Landing page', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mocks.getReflectionComments.mockResolvedValue([])
    mocks.likeReflection.mockResolvedValue({ liked: true, likeCount: 5 })
    mocks.unlikeReflection.mockResolvedValue({ liked: false, likeCount: 4 })
    mocks.getBadgeCatalog.mockResolvedValue([])
    mocks.getCommunityStats.mockResolvedValue({ reflectionsCount: 9, songsCount: 6, usersCount: 14 })
    mocks.getMyBestScores.mockResolvedValue(null)
    mocks.getMyStats.mockResolvedValue({})
    mocks.getPublishedSongs.mockResolvedValue([])
    mocks.getReflections.mockResolvedValue([])
    mocks.getUserBadges.mockResolvedValue([])
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({ reflectionsCount: 9, songsCount: 6, usersCount: 14 }),
        ok: true,
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    cleanup()
  })

  it('does not request admin-only platform analytics', async () => {
    renderLanding()

    expect(await screen.findByRole('heading', { name: /Where Singapore's stories become music/i })).toBeInTheDocument()
    expect(mocks.getCommunityStats).not.toHaveBeenCalled()
    expect(mocks.getMyStats).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('renders the updated hero and linked journey cards', () => {
    renderLanding()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: "Where Singapore's stories become music.",
      })
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Explore Songs' })[0]).toHaveAttribute('href', '/songs')
    expect(screen.queryByRole('heading', { name: "Made for Singapore's music community" })).not.toBeInTheDocument()
    for (const label of ['For Listeners', 'For Creators', 'For Everyone', 'Songs Library']) expect(screen.queryByText(label)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Share Your Music' })).toHaveAttribute(
      'href',
      '/apply/creator'
    )
    expect(screen.getByRole('link', { name: /Discover Music/ })).toHaveAttribute(
      'href',
      '/songs'
    )
    expect(screen.getByRole('link', { name: /Explore the Story/ })).toHaveAttribute('href', '/learning')
    expect(screen.getByRole('link', { name: /Play the Rhythm/ })).toHaveAttribute(
      'href',
      '/rhythm-game'
    )
    expect(screen.getByRole('link', { name: /Join the Conversation/ })).toHaveAttribute(
      'href',
      '/reflections'
    )
  })

  it('prefers the current profile display name over a stale session name', async () => {
    localStorage.setItem('authToken', 'player-token')
    localStorage.setItem('authUser', JSON.stringify({
      id: 'user-1', name: 'Tan Paint', role: 'REGISTERED', sharedProfile: { displayName: 'Vernice Tan' },
    }))

    renderLanding()

    expect(await screen.findByText('Welcome, Vernice Tan')).toBeInTheDocument()
    expect(screen.queryByText('Welcome, Tan Paint')).not.toBeInTheDocument()
  })

  it('places the view-all links in their section headers', async () => {
    mocks.getPublishedSongs.mockResolvedValue([{ id: 'song-1', title: 'Home' }])
    mocks.getReflections.mockResolvedValue([
      {
        content: 'A community memory.',
        createdAt: '2026-07-01T10:00:00.000Z',
        displayName: 'Listener',
        id: 'reflection-1',
        song: { title: 'Home' },
      },
    ])

    renderLanding()

    const songsLink = await screen.findByRole('link', { name: /View all songs/ })
    const reflectionsLink = screen.getByRole('link', { name: /View all reflections/ })

    expect(songsLink).toHaveAttribute('href', '/songs')
    expect(songsLink.closest('header')).not.toBeNull()
    expect(reflectionsLink).toHaveAttribute('href', '/reflections')
    expect(reflectionsLink.closest('header')).not.toBeNull()
  })
})

describe('Landing dynamic previews and interactions', () => {
  const reflection = {
    id: 'memory-1', content: 'A memory supplied by the API.', displayName: 'Anonymous',
    isAnonymous: true, isLiked: false, likeCount: 4, commentCount: 2,
    createdAt: '2026-08-01T08:00:00.000Z', song: { id: 'backend-song', title: 'Backend song' },
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mocks.getPublishedSongs.mockResolvedValue({ items: [{
      id: 'backend-song', title: 'Backend song', creator: { id: 'creator-1', displayName: 'Local creator' },
      theme: 'Community', languages: ['English', 'Malay'], description: 'A story supplied by the API.',
    }] })
    mocks.getReflections.mockResolvedValue([reflection])
    mocks.getReflectionComments.mockResolvedValue([])
    mocks.likeReflection.mockResolvedValue({ liked: true, likeCount: 5 })
    mocks.unlikeReflection.mockResolvedValue({ liked: false, likeCount: 4 })
  })

  afterEach(cleanup)

  it('keeps API previews, creator links and fallback artwork with concise metadata', async () => {
    renderLanding()
    const songLink = await screen.findByRole('link', { name: 'Explore Song: Backend song' })
    expect(songLink).toHaveAttribute('href', '/songs/backend-song')
    expect(mocks.getPublishedSongs).toHaveBeenCalledWith({ limit: 5, page: 1 })
    expect(mocks.getReflections).toHaveBeenCalledWith(null)
    expect(screen.getByRole('link', { name: 'Local creator' })).toHaveAttribute('href', '/creators/creator-1')
    const metadata = screen.getByLabelText('Song metadata')
    for (const label of ['Community', 'English', 'Malay']) expect(within(metadata).getByText(label)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'No cover image for Backend song' })).toBeInTheDocument()
    expect(screen.queryByText('Artist:')).not.toBeInTheDocument()
    expect(screen.queryByText('Language(s):')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Become a Creator' })).toHaveAttribute('href', '/apply/creator')
    expect(screen.queryByRole('heading', { name: 'Stats' })).not.toBeInTheDocument()
  })

  it('falls back for missing fields and a broken image', async () => {
    mocks.getPublishedSongs.mockResolvedValue({ items: [{ id: 'bare-song', title: 'Bare song', coverImageUrl: '/missing-cover.jpg' }] })
    renderLanding()
    const image = await screen.findByRole('img', { name: 'Bare song cover' })
    fireEvent.error(image)
    expect(screen.getByRole('img', { name: 'No cover image for Bare song' })).toBeInTheDocument()
    expect(screen.getByText('Artist unavailable')).toBeInTheDocument()
    expect(screen.getByText('Uncategorised')).toBeInTheDocument()
    expect(screen.getByText('Language not specified')).toBeInTheDocument()
    expect(screen.getByText('Explore this song and the story behind it.')).toBeInTheDocument()
  })

  it.each([
    ['a single language', ['Tamil'], 'Tamil'],
    ['a string language', 'English', 'English'],
    ['an empty language array', [], 'Language not specified'],
  ])('handles %s in featured metadata', async (_, languages, expected) => {
    mocks.getPublishedSongs.mockResolvedValue({ items: [{ id: 'language-song', title: 'Language song', languages }] })
    renderLanding()
    const metadata = await screen.findByLabelText('Song metadata')
    expect(within(metadata).getByText(expected)).toBeInTheDocument()
    expect(within(metadata).getByText('Uncategorised')).toBeInTheDocument()
  })

  it('opens the existing discussion, loads comments and preserves anonymous memory metadata', async () => {
    renderLanding()
    const trigger = await screen.findByRole('button', { name: 'View discussion', exact: true })
    const card = trigger.closest('article')
    expect(within(card).getByText('Anonymous')).toBeInTheDocument()
    expect(within(card).getByText('Backend song')).toBeInTheDocument()
    expect(card.querySelector('time')).toHaveAttribute('datetime', reflection.createdAt)
    fireEvent.click(trigger)
    expect(await screen.findByRole('dialog', { name: 'Discussion' })).toBeInTheDocument()
    expect(mocks.getReflectionComments).toHaveBeenCalledWith('memory-1', null)
    expect(await screen.findByText('No comments yet. Start the conversation.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close discussion' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('uses existing like/unlike endpoints and rolls back a failed request', async () => {
    renderLanding()
    fireEvent.click(await screen.findByRole('button', { name: 'Like reflection by Anonymous' }))
    const unlike = await screen.findByRole('button', { name: 'Unlike reflection by Anonymous' })
    expect(mocks.likeReflection).toHaveBeenCalledWith('memory-1', null)
    expect(await within(unlike).findByText('5')).toBeInTheDocument()
    fireEvent.click(unlike)
    expect(await screen.findByRole('button', { name: 'Like reflection by Anonymous' })).toHaveTextContent('4')
    expect(mocks.unlikeReflection).toHaveBeenCalledWith('memory-1', null)
    mocks.likeReflection.mockRejectedValueOnce(new Error('Unable to like this memory.'))
    fireEvent.click(screen.getByRole('button', { name: 'Like reflection by Anonymous' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to like this memory.')
    expect(screen.getByRole('button', { name: 'Like reflection by Anonymous' })).toHaveTextContent('4')
  })
})
