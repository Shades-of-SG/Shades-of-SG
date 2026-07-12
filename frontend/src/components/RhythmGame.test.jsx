import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RhythmGame from './RhythmGame'
import { AuthProvider } from '../context/AuthContext'

const mocks = vi.hoisted(() => ({
  fetchSongDetails: vi.fn(),
  loadBeatmap: vi.fn(),
  publishBeatmap: vi.fn(),
  saveBeatmapSettings: vi.fn(),
}))

vi.mock('../game/songDetailsApi', () => ({ fetchSongDetails: mocks.fetchSongDetails }))
vi.mock('../game/beatmapLoader', () => ({ DIFFICULTIES: ['easy', 'medium', 'hard'], loadBeatmap: mocks.loadBeatmap }))
vi.mock('../services/beatmapService', () => ({ publishBeatmap: mocks.publishBeatmap, saveBeatmapSettings: mocks.saveBeatmapSettings }))

const song = { audioUrl: '/song.mp3', durationSecs: 10, id: 'song-1', title: 'Test Song', videoUrl: '' }
const chart = (difficulty = 'medium', status = 'PUBLISHED') => ({
  difficulty,
  durationMs: 10000,
  generationSource: 'FALLBACK',
  notes: [{ id: `${difficulty}-tap`, lane: 0, startMs: 1000, status: 'pending', type: 'tap' }],
  offsetMs: 0,
  status,
})

function renderGame(entry = '/game/song-1') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/game/:songId" element={<RhythmGame />} />
          <Route path="/rhythm-game" element={<p>Song selection</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('RhythmGame controls and lifecycle', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.fetchSongDetails.mockResolvedValue(song)
    mocks.loadBeatmap.mockImplementation((_song, difficulty, options) => Promise.resolve(chart(difficulty, options?.preview ? 'DRAFT' : 'PUBLISHED')))
    mocks.publishBeatmap.mockResolvedValue({})
    mocks.saveBeatmapSettings.mockResolvedValue({})
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(), createLinearGradient: () => ({ addColorStop: vi.fn() }), fillRect: vi.fn(),
      fillText: vi.fn(), setTransform: vi.fn(), strokeRect: vi.fn(),
    })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    cleanup()
  })

  it('uses accessible exit/fullscreen controls and resets when difficulty changes', async () => {
    renderGame()
    expect(await screen.findByRole('button', { name: 'Exit to rhythm song selection' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Start' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'hard' }))
    await waitFor(() => expect(mocks.loadBeatmap).toHaveBeenLastCalledWith(song, 'hard', expect.objectContaining({ preview: false, signal: expect.any(AbortSignal), token: null })))
    expect(await screen.findByRole('button', { name: 'Start' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'hard' })).toHaveClass('active')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('coordinates the countdown and automatically pauses on window blur', async () => {
    renderGame()
    const start = await screen.findByRole('button', { name: 'Start' })
    vi.useFakeTimers()
    await act(async () => {
      fireEvent.click(start)
      await Promise.resolve()
    })
    expect(screen.getByText('3')).toBeInTheDocument()
    await act(async () => {
      vi.advanceTimersByTime(2800)
      await Promise.resolve()
    })
    fireEvent(window, new Event('blur'))
    expect(screen.getByRole('heading', { name: 'Take a breath' })).toBeInTheDocument()
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })

  it('uses the requested stored difficulty with authenticated creator preview access', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', role: 'CREATOR' }))
    renderGame('/game/song-1?difficulty=HARD&preview=1')
    await waitFor(() => expect(mocks.fetchSongDetails).toHaveBeenCalledWith('song-1', expect.objectContaining({ preview: true, token: 'creator-token' })))
    expect(mocks.loadBeatmap).toHaveBeenCalledWith(song, 'hard', expect.objectContaining({ preview: true, token: 'creator-token' }))
    expect(await screen.findByText('Draft Preview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to Studio' })).toBeInTheDocument()
  })

  it('shows a clear error and cannot start when no stored READY map exists', async () => {
    mocks.loadBeatmap.mockRejectedValueOnce(new Error('This rhythm game is not available yet.'))
    renderGame()
    expect(await screen.findByRole('alert')).toHaveTextContent('not available yet')
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()
  })

  it('offers only visual note speed and volume to players, never timing offset', async () => {
    renderGame()
    await screen.findByRole('button', { name: 'Start' })
    fireEvent.click(screen.getByRole('button', { name: /show details/i }))
    expect(screen.getByLabelText('Visual note speed')).toBeInTheDocument()
    expect(screen.getByLabelText('Game volume')).toBeInTheDocument()
    expect(screen.queryByLabelText(/timing offset/i)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Visual note speed'), { target: { value: '1.25' } })
    expect(localStorage.getItem('rhythmNoteSpeed')).toBe('1.25')
  })

  it('allows a creator to preview and save a temporary DRAFT offset', async () => {
    localStorage.setItem('authToken', 'creator-token')
    localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', role: 'CREATOR' }))
    renderGame('/game/song-1?difficulty=MEDIUM&preview=1')
    const slider = await screen.findByLabelText('Draft preview timing offset')
    fireEvent.change(slider, { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Offset' }))
    await waitFor(() => expect(mocks.saveBeatmapSettings).toHaveBeenCalledWith('song-1', 'medium', 100, 'creator-token'))
  })
})
