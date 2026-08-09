import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getReflections, getReflectionComments, getReflectionSongs, likeReflection, unlikeReflection,
} from '../services/reflectionService'
import ReflectionWall from './ReflectionWall'

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ token: null, user: null }) }))
vi.mock('../services/reflectionService', () => ({
  createReflection: vi.fn(), deleteReflection: vi.fn(), getReflections: vi.fn(),
  getReflectionComments: vi.fn(), getReflectionSongs: vi.fn(), likeReflection: vi.fn(),
  unlikeReflection: vi.fn(), updateReflection: vi.fn(),
}))

const reflection = {
  author: null, commentCount: 0, content: 'An anonymous memory.', createdAt: '2026-08-01T08:00:00Z',
  displayName: 'Anonymous', id: 'reflection-1', isAnonymous: true, isLiked: false,
  isOwner: false, likeCount: 4, song: { id: 'song-1', title: 'Home' }, songId: 'song-1', tags: [],
}

describe('ReflectionWall guest likes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getReflections.mockResolvedValue([reflection])
    getReflectionSongs.mockResolvedValue([{ id: 'song-1', title: 'Home' }])
    getReflectionComments.mockResolvedValue([])
    likeReflection.mockResolvedValue({ likeCount: 5, liked: true })
    unlikeReflection.mockResolvedValue({ likeCount: 4, liked: false })
  })

  afterEach(cleanup)

  it('keeps the filter toolbar to one row without a second song search field', async () => {
    render(<MemoryRouter><ReflectionWall /></MemoryRouter>)

    await screen.findByRole('option', { name: 'Home' })
    expect(screen.getByRole('searchbox', { name: 'Search reflections' })).toBeInTheDocument()
    expect(screen.queryByRole('searchbox', { name: 'Search song' })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Song' })).toBeInTheDocument()
  })

  it('lets a guest toggle the card heart and keeps an open modal synchronized', async () => {
    render(<MemoryRouter><ReflectionWall /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Like reflection by Anonymous' }))
    await waitFor(() => expect(likeReflection).toHaveBeenCalledWith('reflection-1', null))
    expect(screen.getByRole('button', { name: 'Unlike reflection by Anonymous' })).toHaveTextContent('5')

    fireEvent.click(screen.getByRole('button', { name: 'View discussion' }))
    expect(screen.getByRole('button', { name: 'Unlike reflection, 5 likes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Unlike reflection, 5 likes' }))
    await waitFor(() => expect(unlikeReflection).toHaveBeenCalledWith('reflection-1', null))
    expect(screen.getByRole('button', { name: 'Like reflection by Anonymous' })).toHaveTextContent('4')
    expect(screen.getByRole('button', { name: 'Like reflection, 4 likes' })).toBeInTheDocument()
  })
})
