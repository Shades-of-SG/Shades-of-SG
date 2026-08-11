import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SongExperience from './SongExperience'

const mocks = vi.hoisted(() => ({
  getPublishedSong: vi.fn(),
  trackAnalyticsEvent: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ token: 'listener-token' }) }))
vi.mock('../hooks/useInstrumentAudio', () => ({ default: () => ({ playNote: vi.fn() }) }))
vi.mock('../hooks/useLabInstruments', () => ({ default: () => [] }))
vi.mock('../services/publicSongService', () => ({ getPublishedSong: mocks.getPublishedSong }))
vi.mock('../services/analyticsService', () => ({ trackAnalyticsEvent: mocks.trackAnalyticsEvent }))
vi.mock('../components/shared/CustomVideoPlayer', () => ({
  default: ({ onPlay }) => <button onClick={onPlay} type="button">Play song media</button>,
}))

const song = {
  artist: 'Community Artist',
  createdAt: '2026-08-01T00:00:00.000Z',
  id: 'song-1',
  instruments: [],
  title: 'Our Singapore Story',
  triviaQuestions: [],
  videoUrl: '/song.mp4',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/songs/song-1']}>
      <Routes><Route element={<SongExperience />} path="/songs/:id" /></Routes>
    </MemoryRouter>,
  )
}

describe('Song experience analytics', () => {
  beforeEach(() => {
    mocks.getPublishedSong.mockResolvedValue(song)
    mocks.trackAnalyticsEvent.mockResolvedValue({ accepted: true })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('records a view only after the published song loads and records media playback', async () => {
    renderPage()

    expect(await screen.findAllByRole('heading', { name: song.title })).not.toHaveLength(0)
    await waitFor(() => expect(mocks.trackAnalyticsEvent).toHaveBeenCalledWith(
      'SONG_PAGE_VIEWED',
      { songId: song.id },
      'listener-token',
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Play song media' }))

    expect(mocks.trackAnalyticsEvent).toHaveBeenCalledWith(
      'SONG_PLAYBACK_STARTED',
      { songId: song.id },
      'listener-token',
    )
  })

  it('does not count a view when the song request fails', async () => {
    mocks.getPublishedSong.mockRejectedValue(new Error('Published song not found.'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Published song not found.')
    expect(mocks.trackAnalyticsEvent).not.toHaveBeenCalled()
  })
})
