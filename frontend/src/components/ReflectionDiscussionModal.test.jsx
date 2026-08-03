import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ReflectionDiscussionModal from './ReflectionDiscussionModal'
import {
  createReflectionComment, deleteReflectionComment, getReflectionComments,
  likeReflection, unlikeReflection,
} from '../services/reflectionService'

vi.mock('../services/reflectionService', () => ({
  createReflectionComment: vi.fn(), deleteReflectionComment: vi.fn(), getReflectionComments: vi.fn(),
  likeReflection: vi.fn(), unlikeReflection: vi.fn(),
}))

const reflection = {
  author: { avatarUrl: 'https://images.example/rose.jpg', displayName: 'Rose Tan', id: 'user-1' },
  commentCount: 0, content: 'A full reflection about home.', createdAt: '2026-08-01T08:00:00Z',
  displayName: 'Rose Tan', id: 'reflection-1', isAnonymous: false, isLiked: false, likeCount: 2,
}

function renderModal(overrides = {}) {
  const props = {
    onClose: vi.fn(), onLogin: vi.fn(), onReflectionChange: vi.fn(), reflection,
    token: 'token', user: { id: 'user-1' }, ...overrides,
  }
  render(<MemoryRouter><ReflectionDiscussionModal {...props} /></MemoryRouter>)
  return props
}

describe('ReflectionDiscussionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getReflectionComments.mockResolvedValue([])
    createReflectionComment.mockResolvedValue({
      comment: { author: reflection.author, canDelete: true, content: 'A kind reply.', createdAt: '2026-08-02T08:00:00Z', id: 'comment-1' },
      commentCount: 1,
    })
    deleteReflectionComment.mockResolvedValue(null)
    likeReflection.mockResolvedValue({ likeCount: 3, liked: true })
    unlikeReflection.mockResolvedValue({ likeCount: 1, liked: false })
  })
  afterEach(cleanup)

  it('loads comments, exposes public profile navigation, and reports the empty state', async () => {
    renderModal()
    expect(screen.getByRole('dialog', { name: 'Discussion' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Rose Tan/ })).toHaveAttribute('href', '/users/user-1')
    expect(await screen.findByText('No comments yet. Start the conversation.')).toBeInTheDocument()
    expect(getReflectionComments).toHaveBeenCalledWith('reflection-1', 'token')
  })

  it('validates, counts, creates, and deletes comments with visible state feedback', async () => {
    getReflectionComments.mockResolvedValueOnce([{ author: reflection.author, canDelete: true, content: 'Existing reply.', createdAt: '2026-08-02T07:00:00Z', id: 'old-comment' }])
    const props = renderModal()
    await screen.findByText('Existing reply.')
    const textarea = screen.getByLabelText('Add a comment')
    expect(screen.getByText('500 characters remaining')).toBeInTheDocument()

    fireEvent.change(textarea, { target: { value: 'fuck this' } })
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/community guidelines/i)
    expect(createReflectionComment).not.toHaveBeenCalled()

    fireEvent.change(textarea, { target: { value: 'A kind reply.' } })
    expect(screen.getByText('487 characters remaining')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))
    expect(await screen.findByText('Comment posted.')).toBeInTheDocument()
    expect(createReflectionComment).toHaveBeenCalledWith('reflection-1', 'A kind reply.', 'token')
    expect(props.onReflectionChange).toHaveBeenCalledWith(expect.objectContaining({ commentCount: 1 }))

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete comment by Rose Tan' })[0])
    await waitFor(() => expect(deleteReflectionComment).toHaveBeenCalledWith('reflection-1', 'old-comment', 'token'))
    expect(await screen.findByText('Comment removed.')).toBeInTheDocument()
  })

  it('shows clear liked and unliked behavior and sends guests to login', async () => {
    const props = renderModal()
    const like = screen.getByRole('button', { name: /Like 2/ })
    expect(like).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(like)
    await waitFor(() => expect(likeReflection).toHaveBeenCalledWith('reflection-1', 'token'))
    expect(props.onReflectionChange).toHaveBeenCalledWith(expect.objectContaining({ isLiked: true, likeCount: 3 }))

    cleanup()
    const guestProps = renderModal({ token: null, user: null })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(guestProps.onLogin).toHaveBeenCalled()
  })

  it('traps keyboard focus, closes on Escape, and restores focus to the opening control', async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return <MemoryRouter><button onClick={() => setOpen(true)} type="button">Open discussion</button>{open ? <ReflectionDiscussionModal onClose={() => setOpen(false)} onLogin={() => {}} onReflectionChange={() => {}} reflection={reflection} token="token" user={{ id: 'user-1' }} /> : null}</MemoryRouter>
    }
    const { useState } = await import('react')
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open discussion' })
    opener.focus()
    fireEvent.click(opener)
    const close = await screen.findByRole('button', { name: 'Close discussion' })
    await waitFor(() => expect(close).toHaveFocus())
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByLabelText('Add a comment')).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})
