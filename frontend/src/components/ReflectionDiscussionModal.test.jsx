import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ReflectionDiscussionModal from './ReflectionDiscussionModal'
import {
  createReflectionComment, deleteReflectionComment, getReflectionComments,
  likeReflection, likeReflectionComment, reportReflectionComment, unlikeReflection,
  unlikeReflectionComment,
} from '../services/reflectionService'

vi.mock('../services/reflectionService', () => ({
  createReflectionComment: vi.fn(), deleteReflectionComment: vi.fn(), getReflectionComments: vi.fn(),
  likeReflection: vi.fn(), likeReflectionComment: vi.fn(), reportReflectionComment: vi.fn(),
  unlikeReflection: vi.fn(), unlikeReflectionComment: vi.fn(),
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
    likeReflectionComment.mockResolvedValue({ likeCount: 1, liked: true })
    unlikeReflection.mockResolvedValue({ likeCount: 1, liked: false })
    unlikeReflectionComment.mockResolvedValue({ likeCount: 0, liked: false })
    reportReflectionComment.mockResolvedValue({ report: { id: 'report-1', status: 'PENDING' } })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'prompt').mockReturnValue('This comment needs review.')
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('loads comments, exposes public profile navigation, and reports the empty state', async () => {
    renderModal()
    expect(screen.getByRole('dialog', { name: 'Discussion' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Rose Tan/ })).toHaveAttribute('href', '/users/user-1')
    expect(await screen.findByText('No comments yet. Start the conversation.')).toBeInTheDocument()
    expect(getReflectionComments).toHaveBeenCalledWith('reflection-1', 'token')
  })

  it('shows only the generic anonymous identity without a profile link or badge', async () => {
    const { container } = render(<MemoryRouter><ReflectionDiscussionModal
      onClose={() => {}}
      onLogin={() => {}}
      onReflectionChange={() => {}}
      reflection={{ ...reflection, author: null, displayName: 'Anonymous', isAnonymous: true }}
      token="token"
      user={{ id: 'user-1' }}
    /></MemoryRouter>)
    expect(screen.getAllByText('Anonymous')).toHaveLength(1)
    expect(screen.queryByRole('link', { name: /Anonymous/ })).not.toBeInTheDocument()
    expect(container.querySelector('.rw-anonymous-badge')).not.toBeInTheDocument()
    expect(await screen.findByText('No comments yet. Start the conversation.')).toBeInTheDocument()
  })

  it('validates, counts, creates, and deletes comments with visible state feedback', async () => {
    getReflectionComments.mockResolvedValueOnce([{ author: reflection.author, canDelete: true, canReport: true, content: 'Existing reply.', createdAt: '2026-08-02T07:00:00Z', id: 'old-comment' }])
    const props = renderModal()
    await screen.findByText('Existing reply.')
    const textarea = screen.getByLabelText('Add a comment')
    expect(screen.getByText('500 characters remaining')).toBeInTheDocument()

    fireEvent.change(textarea, { target: { value: 'x'.repeat(501) } })
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/500 characters or fewer/i)
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

  it('submits one authenticated comment report with visible success feedback', async () => {
    getReflectionComments.mockResolvedValueOnce([{ author: reflection.author, canDelete: false, canReport: true, content: 'Concerning reply.', createdAt: '2026-08-02T07:00:00Z', id: 'reported-comment' }])
    renderModal()
    fireEvent.click(await screen.findByRole('button', { name: 'Report comment by Rose Tan' }))
    await waitFor(() => expect(reportReflectionComment).toHaveBeenCalledWith('reflection-1', 'reported-comment', 'This comment needs review.', 'token'))
    expect(await screen.findByText('Comment reported for review.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Report comment by Rose Tan' })).not.toBeInTheDocument()
  })

  it('likes and unlikes an individual comment while guests are directed to login', async () => {
    getReflectionComments.mockResolvedValueOnce([{ author: reflection.author, canDelete: false, canReport: false, content: 'Helpful reply.', createdAt: '2026-08-02T07:00:00Z', id: 'liked-comment', isLiked: false, likeCount: 0 }])
    renderModal()
    const like = await screen.findByRole('button', { name: 'Like comment by Rose Tan, 0 likes' })
    expect(like).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(like)
    await waitFor(() => expect(likeReflectionComment).toHaveBeenCalledWith('reflection-1', 'liked-comment', 'token'))
    const unlike = screen.getByRole('button', { name: 'Unlike comment by Rose Tan, 1 likes' })
    expect(unlike).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(unlike)
    await waitFor(() => expect(unlikeReflectionComment).toHaveBeenCalledWith('reflection-1', 'liked-comment', 'token'))

    cleanup()
    getReflectionComments.mockResolvedValueOnce([{ author: reflection.author, content: 'Guest-visible reply.', createdAt: '2026-08-02T07:00:00Z', id: 'guest-comment', isLiked: false, likeCount: 2 }])
    const guestProps = renderModal({ token: null, user: null })
    fireEvent.click(await screen.findByRole('button', { name: 'Like comment by Rose Tan, 2 likes' }))
    expect(guestProps.onLogin).toHaveBeenCalledTimes(1)
    expect(likeReflectionComment).toHaveBeenCalledTimes(1)
  })

  it('blocks rapid duplicate comment likes and restores state after failure', async () => {
    let rejectLike
    likeReflectionComment.mockReturnValueOnce(new Promise((resolve, reject) => { rejectLike = reject }))
    getReflectionComments.mockResolvedValueOnce([{ author: reflection.author, content: 'Helpful reply.', createdAt: '2026-08-02T07:00:00Z', id: 'busy-comment', isLiked: false, likeCount: 4 }])
    renderModal()
    const like = await screen.findByRole('button', { name: 'Like comment by Rose Tan, 4 likes' })
    fireEvent.click(like)
    fireEvent.click(like)
    expect(likeReflectionComment).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Unlike comment by Rose Tan, 5 likes' })).toBeDisabled()

    await act(async () => rejectLike(new Error('Comment like could not be saved.')))
    expect(screen.getByRole('button', { name: 'Like comment by Rose Tan, 4 likes' })).toBeEnabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Comment like could not be saved.')
  })

  it('shows clear liked behavior and lets guests like without logging in', async () => {
    const props = renderModal()
    const like = screen.getByRole('button', { name: /Like reflection, 2 likes/ })
    expect(like).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(like)
    await waitFor(() => expect(likeReflection).toHaveBeenCalledWith('reflection-1', 'token'))
    expect(props.onReflectionChange).toHaveBeenCalledWith(expect.objectContaining({ isLiked: true, likeCount: 3 }))

    cleanup()
    const guestProps = renderModal({ token: null, user: null })
    fireEvent.click(screen.getByRole('button', { name: /Like reflection, 2 likes/ }))
    await waitFor(() => expect(likeReflection).toHaveBeenCalledWith('reflection-1', null))
    expect(guestProps.onReflectionChange).toHaveBeenCalledWith(expect.objectContaining({ isLiked: true, likeCount: 3 }))
    expect(guestProps.onLogin).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(guestProps.onLogin).toHaveBeenCalledTimes(1)

    cleanup()
    const unlikeProps = renderModal({ reflection: { ...reflection, isLiked: true, likeCount: 3 }, token: null, user: null })
    fireEvent.click(screen.getByRole('button', { name: /Unlike reflection, 3 likes/ }))
    await waitFor(() => expect(unlikeReflection).toHaveBeenCalledWith('reflection-1', null))
    expect(unlikeProps.onReflectionChange).toHaveBeenCalledWith(expect.objectContaining({ isLiked: false, likeCount: 1 }))
  })

  it('blocks rapid duplicate guest likes and rolls back a failed optimistic update', async () => {
    let rejectLike
    likeReflection.mockReturnValueOnce(new Promise((resolve, reject) => { rejectLike = reject }))
    const props = renderModal({ token: null, user: null })
    const like = screen.getByRole('button', { name: /Like reflection, 2 likes/ })
    fireEvent.click(like)
    fireEvent.click(like)
    expect(likeReflection).toHaveBeenCalledTimes(1)
    expect(props.onReflectionChange).toHaveBeenCalledWith(expect.objectContaining({ isLiked: true, likeCount: 3 }))

    await act(async () => rejectLike(new Error('Like could not be saved.')))
    expect(props.onReflectionChange).toHaveBeenLastCalledWith(reflection)
    expect(screen.getByRole('alert')).toHaveTextContent('Like could not be saved.')
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
