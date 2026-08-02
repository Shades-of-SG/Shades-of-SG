import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import SongsLibrary from './SongsLibrary'
import { AuthProvider } from '../context/AuthContext'

const mocks = vi.hoisted(() => ({
  getBeatmapSummary: vi.fn(),
  getPublishedSongs: vi.fn(),
}))

vi.mock('../services/publicSongService', () => ({ getPublishedSongs: mocks.getPublishedSongs }))
vi.mock('../services/beatmapService', () => ({ getBeatmapSummary: mocks.getBeatmapSummary }))

const songs = [
  {
    artist: 'The Home Team',
    coverImageUrl: '/home.jpg',
    description: 'A song about the place we share.',
    durationSecs: 185,
    id: 'home',
    languages: ['English'],
    moodTags: ['Reflective'],
    publishedDate: '2026-07-20T00:00:00.000Z',
    theme: 'Identity',
    title: 'Home',
    videoUrl: '/home.mp4',
  },
  {
    artist: 'Community Voices',
    description: 'Celebrating familiar streets and neighbourhood stories.',
    durationSecs: 142,
    id: 'streets',
    languages: ['English'],
    moodTags: ['Joyful'],
    publishedDate: '2026-06-10T00:00:00.000Z',
    theme: 'Community',
    title: 'Our Streets',
    videoUrl: '',
  },
  {
    artist: 'Lion City Ensemble',
    description: 'A bright musical portrait of the city.',
    durationSecs: 201,
    id: 'city',
    languages: ['Mandarin'],
    moodTags: ['Energetic'],
    publishedDate: '2026-05-02T00:00:00.000Z',
    theme: 'Identity',
    title: 'City Lights',
    videoUrl: '/city.mp4',
  },
]

function filteredSongs(filters = {}) {
  return songs.filter((song) => {
    const search = filters.search?.toLowerCase()
    const themes = filters.theme || []
    const languages = filters.language || []
    const moods = filters.mood || []
    return (!themes.length || themes.includes(song.theme))
      && (!languages.length || languages.some((value) => song.languages.includes(value)))
      && (!moods.length || moods.some((value) => song.moodTags.includes(value)))
      && (!search || [song.title, song.artist].join(' ').toLowerCase().includes(search))
  })
}

describe('Songs Library', () => {
  beforeEach(() => {
    mocks.getPublishedSongs.mockImplementation((filters) => Promise.resolve(filteredSongs(filters)))
    mocks.getBeatmapSummary.mockImplementation((songId) => Promise.resolve(
      songId === 'home'
        ? [{ difficulty: 'EASY', status: 'PUBLISHED' }, { difficulty: 'MEDIUM', status: 'NOT_CREATED' }]
        : [],
    ))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  function renderPage() {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/songs']}>
          <SongsLibrary />
          <LocationProbe />
        </MemoryRouter>
      </AuthProvider>,
    )
  }

  it('shows the discovery content and a non-autoplaying default preview', async () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: /Every song tells.*Singapore/ })).toBeInTheDocument()
    expect(await screen.findByText('3 songs available')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Featured & recommended' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Play featured song' })).toHaveAttribute('href', '/songs/home')
    expect(screen.getByRole('region', { name: 'Browse all songs' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Select .* preview/ })).toHaveLength(3)

    const video = screen.getByLabelText('Home video preview')
    expect(video).not.toHaveAttribute('autoplay')
    expect(video).toHaveAttribute('preload', 'metadata')
  })

  it('updates the contextual panel when a row is selected and shows a missing-video fallback', async () => {
    renderPage()
    await screen.findByText('3 songs available')

    fireEvent.click(screen.getByRole('button', { name: 'Select Our Streets preview' }))

    const preview = screen.getByRole('complementary', { name: 'Preview for Our Streets' })
    expect(within(preview).getByText('Video preview unavailable')).toBeInTheDocument()
    expect(within(preview).getByText('This song does not currently have an AI-generated music video.')).toBeInTheDocument()
    expect(within(preview).getByRole('link', { name: 'Explore Song' })).toHaveAttribute('href', '/songs/streets')
  })

  it('shows the rhythm action only for a published beatmap', async () => {
    renderPage()
    await screen.findByText('3 songs available')

    const homePreview = screen.getByRole('complementary', { name: 'Preview for Home' })
    expect(await within(homePreview).findByRole('link', { name: 'Play Rhythm Game' })).toHaveAttribute(
      'href',
      '/game/home?difficulty=EASY',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Select Our Streets preview' }))
    const streetsPreview = screen.getByRole('complementary', { name: 'Preview for Our Streets' })
    expect(within(streetsPreview).queryByRole('link', { name: 'Play Rhythm Game' })).not.toBeInTheDocument()
  })

  it('keeps filters server-backed and clears active filters', async () => {
    renderPage()
    await screen.findByText('3 songs available')

    fireEvent.click(screen.getByRole('button', { name: 'All themes' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Community' }))

    await waitFor(() => expect(mocks.getPublishedSongs).toHaveBeenLastCalledWith({
      language: [], mood: [], search: '', theme: ['Community'],
    }, null))
    expect(await screen.findByText('Showing 1–1 of 1 songs')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Theme: Community filter' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(await screen.findByText('Showing 1–3 of 3 songs')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled()
  })

  it('shows an actionable empty state for a search with no matches', async () => {
    renderPage()
    await screen.findByText('3 songs available')

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'not-a-song' } })

    expect(await screen.findByRole('heading', { name: 'No songs found' })).toBeInTheDocument()
    expect(screen.getByText('Try changing or clearing your filters.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Clear filters' }).some((button) => !button.disabled)).toBe(true)
  })

  it('updates preview context from keyboard focus', async () => {
    renderPage()
    await screen.findByText('3 songs available')

    fireEvent.focus(screen.getByRole('button', { name: 'Select City Lights preview' }))

    expect(screen.getByRole('complementary', { name: 'Preview for City Lights' })).toBeInTheDocument()
  })

  it('resets selection safely when pagination changes', async () => {
    const paginatedSongs = Array.from({ length: 10 }, (_, index) => ({
      ...songs[index % songs.length],
      id: `song-${index + 1}`,
      title: `Song ${index + 1}`,
      videoUrl: '',
    }))
    mocks.getPublishedSongs.mockResolvedValue(paginatedSongs)
    mocks.getBeatmapSummary.mockResolvedValue([])
    renderPage()
    await screen.findByText('10 songs available')

    fireEvent.click(screen.getByRole('button', { name: 'Select Song 2 preview' }))
    expect(screen.getByRole('complementary', { name: 'Preview for Song 2' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '2' }))
    expect(await screen.findByRole('complementary', { name: 'Preview for Song 10' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
  })

  it('exposes a retry state when a video fails', async () => {
    renderPage()
    await screen.findByText('3 songs available')

    fireEvent.error(screen.getByLabelText('Home video preview'))

    expect(screen.getByText('Preview couldn’t be loaded')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="current-location">{location.pathname}</span>
}
