import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { getLeaderboard } from '../services/leaderboardService'
import RhythmLeaderboard from './RhythmLeaderboard'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'player-token', user: { id: 'user-1' } }),
}))

vi.mock('../services/leaderboardService', () => ({
  getLeaderboard: vi.fn(),
}))

const songs = [
  { difficulties: ['EASY', 'MEDIUM'], id: 'song-1', title: "You'll Be Okay" },
  { difficulties: ['HARD'], id: 'song-2', title: 'Home' },
]

function payload({ difficulty = 'MEDIUM', period = 'weekly', songId = 'song-1' } = {}) {
  const selectedSong = songs.find((song) => song.id === songId)
  const entries = songId === 'song-1' && difficulty === 'MEDIUM' ? [{
    accuracy: 94.25,
    achievedAt: '2026-07-30T10:00:00.000Z',
    avatarUrl: '/avatar.jpg',
    difficulty: 'MEDIUM',
    displayName: 'Ferlyn Ng',
    grade: 'A',
    isCurrentUser: true,
    maxCombo: 88,
    position: 2,
    score: 73385,
    songId,
    songTitle: selectedSong.title,
    userId: 'user-1',
  }] : []
  return {
    availableDifficulties: selectedSong.difficulties,
    currentUser: entries[0] || null,
    difficultyAvailable: selectedSong.difficulties.includes(difficulty),
    entries,
    period,
    selectedDifficulty: difficulty,
    selectedSong,
    songs,
    totalRankedPlayers: entries.length ? 14 : 0,
  }
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

function renderLeaderboard(initialEntry = '/rhythm-game/leaderboard?songId=song-1&difficulty=MEDIUM&period=weekly') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/rhythm-game/leaderboard" element={<><RhythmLeaderboard /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RhythmLeaderboard', () => {
  beforeEach(() => {
    getLeaderboard.mockImplementation((filters) => Promise.resolve(payload(filters)))
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('uses backend positions and preserves song, difficulty, and period filters in the URL', async () => {
    renderLeaderboard()

    expect(await screen.findByText("Your Rank for You'll Be Okay · Medium")).toBeInTheDocument()
    expect(getLeaderboard).toHaveBeenCalledWith({
      difficulty: 'MEDIUM', period: 'weekly', songId: 'song-1', token: 'player-token',
    })
    expect(screen.getAllByText('#2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('73,385 points')).toHaveLength(2)
    expect(screen.getByText('94.25% accuracy')).toBeInTheDocument()
    expect(screen.getByText('2 of 14 ranked players')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ferlyn Ng' })).toHaveAttribute('href', '/users/user-1')
    expect(screen.getByRole('link', { name: 'Play This Song' })).toHaveAttribute('href', '/game/song-1?difficulty=MEDIUM')

    fireEvent.change(screen.getByLabelText('Time period'), { target: { value: 'monthly' } })
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('songId=song-1&difficulty=MEDIUM&period=monthly'))

    fireEvent.change(screen.getByLabelText('Song'), { target: { value: 'song-2' } })
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('songId=song-2&difficulty=HARD&period=monthly'))
    expect(await screen.findByText('No scores for this selection')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Play This Song' })).toHaveAttribute('href', '/game/song-2?difficulty=HARD')
  })

  it('shows a useful API error state', async () => {
    getLeaderboard.mockRejectedValueOnce(new Error('Could not load leaderboard.'))
    renderLeaderboard()
    expect(await screen.findByRole('alert')).toHaveTextContent('Leaderboard unavailable')
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load leaderboard.')
  })
})
