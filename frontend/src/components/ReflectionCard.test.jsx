import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ReflectionCard from './ReflectionCard'

const reflection = {
  author: { avatarUrl: '', displayName: 'Memory Keeper', id: 'user-1' },
  commentCount: 2, content: 'A reflection about home.', createdAt: '2026-08-01T08:00:00Z',
  displayName: 'Memory Keeper', id: 'reflection-1', isAnonymous: false, isLiked: false,
  isOwner: false, likeCount: 4, song: { id: 'song-1', title: 'Home' },
}

describe('ReflectionCard', () => {
  afterEach(cleanup)

  it('exposes a keyboard-accessible heart without replacing discussion behavior', () => {
    const onLike = vi.fn()
    const onOpen = vi.fn()
    render(<MemoryRouter><ReflectionCard likeBusy={false} onDelete={() => {}} onEdit={() => {}} onLike={onLike} onOpen={onOpen} reflection={reflection} /></MemoryRouter>)
    const heart = screen.getByRole('button', { name: 'Like reflection by Memory Keeper' })
    expect(heart).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(heart)
    expect(onLike).toHaveBeenCalledWith(reflection)
    fireEvent.click(screen.getByRole('button', { name: 'View discussion' }))
    expect(onOpen).toHaveBeenCalledWith(reflection)
  })

  it('groups engagement controls separately from the discussion link', () => {
    const { container } = render(<MemoryRouter><ReflectionCard likeBusy={false} onDelete={() => {}} onEdit={() => {}} onLike={() => {}} onOpen={() => {}} reflection={reflection} /></MemoryRouter>)
    const summary = container.querySelector('.rw-card-discussion-summary')
    const engagement = summary.querySelector('.rw-card-engagement')
    expect(engagement).toContainElement(screen.getByRole('button', { name: 'Like reflection by Memory Keeper' }))
    expect(engagement).toContainElement(container.querySelector('.rw-card-comment-count'))
    expect(engagement).not.toContainElement(screen.getByRole('button', { name: 'View discussion' }))
  })

  it('shows selected and request-busy states', () => {
    render(<MemoryRouter><ReflectionCard likeBusy onDelete={() => {}} onEdit={() => {}} onLike={() => {}} onOpen={() => {}} reflection={{ ...reflection, isLiked: true, likeCount: 5 }} /></MemoryRouter>)
    const heart = screen.getByRole('button', { name: 'Unlike reflection by Memory Keeper' })
    expect(heart).toHaveAttribute('aria-pressed', 'true')
    expect(heart).toBeDisabled()
    expect(heart.querySelector('svg')).toHaveAttribute('fill', 'currentColor')
  })

  it('shows one generic anonymous identity without a separate badge and keeps the song pill', () => {
    const { container } = render(<MemoryRouter><ReflectionCard likeBusy={false} onDelete={() => {}} onEdit={() => {}} onLike={() => {}} onOpen={() => {}} reflection={{ ...reflection, author: null, displayName: 'Anonymous', isAnonymous: true }} /></MemoryRouter>)
    expect(screen.getAllByText('Anonymous')).toHaveLength(1)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(container.querySelector('.rw-anonymous-badge')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Anonymous/ })).not.toBeInTheDocument()
  })
})
