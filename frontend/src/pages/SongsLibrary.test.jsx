import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import SongsLibrary from './SongsLibrary'

const mocks = vi.hoisted(() => ({ getPublishedSongs: vi.fn() }))

vi.mock('../services/publicSongService', () => ({
  getPublishedSongs: mocks.getPublishedSongs,
}))

const songs = [
  {
    artist: 'The Home Team',
    description: 'A song about the place we share.',
    id: 'home',
    languages: ['English'],
    moodTags: ['Reflective'],
    publishedDate: '2026-07-20T00:00:00.000Z',
    theme: 'Identity',
    title: 'Home',
  },
  {
    artist: 'Community Voices',
    description: 'Celebrating familiar streets and neighbourhood stories.',
    id: 'streets',
    languages: ['English'],
    moodTags: ['Joyful'],
    publishedDate: '2026-06-10T00:00:00.000Z',
    theme: 'Community',
    title: 'Our Streets',
  },
  {
    artist: 'Lion City Ensemble',
    description: 'A bright musical portrait of the city.',
    id: 'city',
    languages: ['Mandarin'],
    moodTags: ['Energetic'],
    publishedDate: '2026-05-02T00:00:00.000Z',
    theme: 'Identity',
    title: 'City Lights',
  },
]

describe('Songs Library', () => {
  beforeEach(() => {
    mocks.getPublishedSongs.mockResolvedValue(songs)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/songs']}>
        <SongsLibrary />
        <LocationProbe />
      </MemoryRouter>
    )
  }

  it('presents the available catalog with a dynamic featured song', async () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Explore Singapore\u2019s Soundtrack' })
    ).toBeInTheDocument()
    expect(await screen.findByText('3 songs available')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explore Song' })).toHaveAttribute(
      'href',
      '/songs/home'
    )
    expect(screen.getByText('Featured Singapore Song')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Identity, 2 songs' })).toBeInTheDocument()

    const grid = screen.getByRole('region', { name: 'Song results' })
    expect(within(grid).getAllByRole('link', { name: /Explore song:/ })).toHaveLength(3)
    expect(screen.getByRole('link', { name: /Share your memory/ })).toHaveAttribute(
      'href',
      '/reflections'
    )
    expect(
      screen.getByRole('heading', { name: 'Every Singapore song carries a story' })
    ).toBeInTheDocument()
  })

  it('opens a randomly selected available Singapore song', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    renderPage()
    await screen.findByText('3 songs available')

    fireEvent.click(screen.getByRole('button', { name: 'Play a Singapore song' }))

    expect(screen.getByTestId('current-location')).toHaveTextContent('/songs/city')
    random.mockRestore()
  })

  it('keeps filters server-backed and exposes removable active filters', async () => {
    renderPage()
    await screen.findByText('3 songs available')

    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'Community' } })

    await waitFor(() => {
      expect(mocks.getPublishedSongs).toHaveBeenLastCalledWith({
        language: '',
        mood: '',
        search: '',
        theme: 'Community',
      })
    })
    expect(screen.getByRole('button', { name: 'Remove Community filter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
  })

  it('applies a live-data theme tile through the existing filter', async () => {
    renderPage()
    await screen.findByText('3 songs available')

    fireEvent.click(screen.getByRole('button', { name: 'Community, 1 song' }))

    await waitFor(() => {
      expect(mocks.getPublishedSongs).toHaveBeenLastCalledWith({
        language: '',
        mood: '',
        search: '',
        theme: 'Community',
      })
    })
    expect(screen.getByRole('button', { name: 'Community, 1 song' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('sorts the returned song grid alphabetically without changing routes', async () => {
    renderPage()
    await screen.findByText('3 songs available')

    fireEvent.change(screen.getByLabelText('Sort songs'), { target: { value: 'title' } })

    const grid = screen.getByLabelText('Song grid')
    const songLinks = within(grid).getAllByRole('link', { name: /Explore song:/ })
    expect(songLinks.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Explore song: City Lights',
      'Explore song: Home',
      'Explore song: Our Streets',
    ])
    expect(screen.getAllByText('A\u2013Z')).toHaveLength(2)
  })
})

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="current-location">{location.pathname}</span>
}
