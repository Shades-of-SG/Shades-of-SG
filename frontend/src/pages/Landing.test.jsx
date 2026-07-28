import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Landing from './Landing'

const mocks = vi.hoisted(() => ({
  getPublishedSongs: vi.fn(),
  getReflections: vi.fn(),
}))

vi.mock('../services/publicSongService', () => ({ getPublishedSongs: mocks.getPublishedSongs }))
vi.mock('../services/reflectionService', () => ({ getReflections: mocks.getReflections }))

describe('Landing page', () => {
  beforeEach(() => {
    mocks.getPublishedSongs.mockResolvedValue([])
    mocks.getReflections.mockResolvedValue([])
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

  it('renders the latest community summary returned by the database API', async () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )

    expect(await screen.findByText('6 songs')).toBeInTheDocument()
    expect(screen.getByText('9 shared memories')).toBeInTheDocument()
    expect(screen.getByText('Interactive cultural experiences')).toBeInTheDocument()
    expect(screen.queryByText('14 Active Explorers')).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/stats$/))
  })

  it('renders the updated hero and linked journey cards', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Discover Singapore through music and memories',
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explore Songs' })).toHaveAttribute('href', '/songs')
    expect(screen.getByRole('link', { name: 'Discover How It Works' })).toHaveAttribute(
      'href',
      '#journey'
    )
    expect(screen.getByRole('link', { name: /Listen & Discover/ })).toHaveAttribute(
      'href',
      '/songs'
    )
    expect(screen.getByRole('link', { name: /Learn & Play/ })).toHaveAttribute('href', '/learning')
    expect(screen.getByRole('link', { name: /Test Your Rhythm/ })).toHaveAttribute(
      'href',
      '/rhythm-game'
    )
    expect(screen.getByRole('link', { name: /Share Your Memory/ })).toHaveAttribute(
      'href',
      '/reflections'
    )
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

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )

    const songsLink = await screen.findByRole('link', { name: /View all songs/ })
    const reflectionsLink = screen.getByRole('link', { name: /View all reflections/ })

    expect(songsLink).toHaveAttribute('href', '/songs')
    expect(songsLink.closest('header')).not.toBeNull()
    expect(reflectionsLink).toHaveAttribute('href', '/reflections')
    expect(reflectionsLink.closest('header')).not.toBeNull()
  })
})
