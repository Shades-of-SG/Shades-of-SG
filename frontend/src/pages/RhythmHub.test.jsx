import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBeatmapSummary } from '../services/beatmapService'
import { getPublishedSongs } from '../services/publicSongService'
import { getMyRhythmProgress } from '../services/scoreService'
import RhythmHub from './RhythmHub'

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../services/beatmapService', () => ({ getBeatmapSummary: vi.fn() }))
vi.mock('../services/publicSongService', () => ({ getPublishedSongs: vi.fn() }))
vi.mock('../services/scoreService', () => ({ getMyRhythmProgress: vi.fn() }))

const songs = [
  {
    artist: 'The Performers', audioUrl: '/home.mp3', coverImageUrl: '', creator: {
      avatarUrl: '/creator.jpg', displayName: 'Heritage Studio', id: 'creator-1',
    },
    durationSecs: 125, id: 'song-1', languages: ['English'], publishedDate: '2026-06-01',
    theme: 'Heritage', title: 'Home Again',
  },
  {
    artist: 'City Voices', audioUrl: '/city.mp3', coverImageUrl: '/city.jpg', creator: {
      avatarUrl: '', displayName: 'Community Lab', id: 'creator-2',
    },
    durationSecs: 90, id: 'song-2', languages: ['Malay'], publishedDate: '2026-05-01',
    theme: 'Community', title: 'City Lights',
  },
]

function renderHub() {
  return render(<MemoryRouter><RhythmHub /></MemoryRouter>)
}

describe('RhythmHub', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ token: null, user: null, userProfile: null })
    getPublishedSongs.mockResolvedValue(songs)
    getBeatmapSummary.mockImplementation((songId) => Promise.resolve(songId === 'song-1' ? [
      { difficulty: 'EASY', published: { noteCount: 40 }, status: 'PUBLISHED' },
      { difficulty: 'MEDIUM', published: { noteCount: 70 }, status: 'PUBLISHED' },
    ] : [{ difficulty: 'HARD', published: { noteCount: 100 }, status: 'PUBLISHED' }]))
    getMyRhythmProgress.mockResolvedValue({ bestScores: [], scores: [] })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('keeps guest play links, distinguishes artist from creator, and filters without exposing scores', async () => {
    renderHub()

    expect(await screen.findByText('Playing as a guest')).toBeInTheDocument()
    expect(screen.getByText(/You can play any song\./)).toHaveTextContent(
      'You can play any song. Log in to save future scores, track personal bests and join the leaderboard.',
    )
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
    expect(screen.queryByText(/scores not saved for guests/i)).not.toBeInTheDocument()
    const home = screen.getByRole('article', { name: 'Home Again' })
    expect(within(home).getByText('The Performers')).toBeInTheDocument()
    expect(within(home).getByRole('link', { name: 'View Heritage Studio’s creator profile' })).toHaveAttribute('href', '/creators/creator-1')
    expect(within(home).getByRole('link', { name: 'Play Home Again on Easy difficulty' })).toHaveAttribute('href', '/game/song-1?difficulty=EASY')
    expect(within(home).queryByText(/best:/i)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search by song title or artist'), { target: { value: 'City Voices' } })
    expect(screen.queryByRole('article', { name: 'Home Again' })).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'City Lights' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search by song title or artist'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Heritage' } })
    expect(screen.getByRole('article', { name: 'Home Again' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'City Lights' })).not.toBeInTheDocument()
  })

  it('shows real authenticated summary, continue data, and chart-scoped personal bests', async () => {
    useAuth.mockReturnValue({
      token: 'player-token',
      user: { id: 'player-1', role: 'REGISTERED' },
      userProfile: { badges: [{ id: 'badge-1' }, { id: 'badge-2' }], rhythm: { bestLeaderboardRank: { position: 3 } } },
    })
    getMyRhythmProgress.mockResolvedValue({
      bestScores: [{ difficulty: 'EASY', score: 9000, songId: 'song-1' }],
      scores: [{ difficulty: 'EASY', score: 7000, songId: 'song-1' }],
    })

    renderHub()

    expect(await screen.findByRole('article', { name: 'Home Again' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/Personal best 9,000/)).toBeInTheDocument())
    expect(screen.getByText('Songs played').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Badges earned').nextElementSibling).toHaveTextContent('2')
    expect(screen.getByText('Best leaderboard rank').nextElementSibling).toHaveTextContent('#3')
    expect(screen.getByText('Best: 9,000')).toBeInTheDocument()
    expect(screen.getAllByText('Not played').length).toBeGreaterThan(0)
    expect(screen.queryByText(/playing as a guest/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/save future scores/i)).not.toBeInTheDocument()
    expect(getMyRhythmProgress).toHaveBeenCalledWith('player-token')
  })

  it('uses safe loading, empty-search, and API-error states', async () => {
    const pending = new Promise(() => {})
    getPublishedSongs.mockReturnValueOnce(pending)
    const view = renderHub()
    expect(screen.getByRole('status')).toHaveTextContent('Loading rhythm games')
    view.unmount()

    getPublishedSongs.mockRejectedValueOnce(new Error('database details should stay private'))
    renderHub()
    expect(await screen.findByRole('alert')).toHaveTextContent('Rhythm games unavailable')
    expect(screen.getByRole('alert')).not.toHaveTextContent('database details')
  })
})
