import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import {
  deleteReflection,
  getModerationReflections,
  getReflectionSongs,
  moderateReflection,
} from '../services/reflectionService'
import ReflectionModeration from './ReflectionModeration'

vi.mock('../services/reflectionService', () => ({
  deleteReflection: vi.fn(),
  getModerationReflections: vi.fn(),
  getReflectionSongs: vi.fn(),
  moderateReflection: vi.fn(),
}))

const pendingReflection = {
  content: 'Rain at the National Day parade with my family.',
  createdAt: '2026-07-11T03:00:00.000Z',
  displayName: 'Anonymous',
  guestSubmission: true,
  id: 'reflection-1',
  isAnonymous: true,
  moderatedAt: null,
  moderator: null,
  moderatorNote: null,
  song: { id: 'song-1', title: 'Home' },
  songId: 'song-1',
  status: 'PENDING',
  tags: ['Family', 'National Day'],
}

const approvedReflection = {
  ...pendingReflection,
  displayName: 'Ferlyn',
  guestSubmission: false,
  id: 'reflection-2',
  isAnonymous: false,
  status: 'APPROVED',
}

function response(reflections, overrides = {}) {
  return {
    pagination: { limit: 8, page: 1, total: reflections.length, totalPages: reflections.length ? 1 : 0 },
    reflections,
    stats: { approved: 1, flagged: 0, newToday: 2, newYesterday: 1, pending: 1, ...overrides },
  }
}

function renderPage() {
  localStorage.setItem('authToken', 'creator-token')
  localStorage.setItem('authUser', JSON.stringify({ id: 'creator-1', name: 'Violet', role: 'CREATOR' }))
  return render(
    <MemoryRouter>
      <AuthProvider><ReflectionModeration /></AuthProvider>
    </MemoryRouter>,
  )
}

describe('ReflectionModeration', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getReflectionSongs.mockResolvedValue([{ id: 'song-1', title: 'Home' }])
    getModerationReflections.mockImplementation(({ status }) => Promise.resolve(
      status === 'APPROVED' ? response([approvedReflection]) : response([pendingReflection]),
    ))
    moderateReflection.mockImplementation((id, values) => Promise.resolve({
      ...(id === approvedReflection.id ? approvedReflection : pendingReflection),
      moderator: { id: 'creator-1', name: 'Violet' },
      moderatedAt: '2026-07-11T05:00:00.000Z',
      moderatorNote: values.moderatorNote || null,
      status: values.status,
    }))
    deleteReflection.mockResolvedValue(null)
  })

  it('shows loading skeletons before rendering pending reflections from the API', async () => {
    let resolveRequest
    getModerationReflections.mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve }))
    renderPage()

    expect(await screen.findByRole('status', { name: 'Loading reflections' })).toBeInTheDocument()

    await act(async () => resolveRequest(response([pendingReflection])))
    expect((await screen.findAllByText(/Rain at the National Day parade/))[0]).toBeInTheDocument()
    expect(screen.getByText('Guest submission')).toBeInTheDocument()
  })

  it('switches tabs and sends combined search, song, date, and anonymous filters', async () => {
    renderPage()
    await screen.findAllByText(/Rain at the National Day parade/)

    fireEvent.click(screen.getByRole('tab', { name: /Approved/ }))
    await waitFor(() => expect(getModerationReflections).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'APPROVED' }),
      'creator-token',
    ))

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search reflections' }), { target: { value: 'family' } })
    fireEvent.change(screen.getByLabelText('Song'), { target: { value: 'song-1' } })
    fireEvent.change(screen.getByLabelText('Submitted since'), { target: { value: '2026-07-01' } })
    fireEvent.click(screen.getByLabelText('Anonymous only'))

    await waitFor(() => expect(getModerationReflections).toHaveBeenLastCalledWith(
      expect.objectContaining({
        anonymousOnly: true,
        dateFrom: '2026-07-01',
        search: 'family',
        songId: 'song-1',
        status: 'APPROVED',
      }),
      'creator-token',
    ))
  })

  it('approves a pending reflection and updates the workspace without reloading the page', async () => {
    renderPage()
    await screen.findAllByText(/Rain at the National Day parade/)

    fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0])

    await waitFor(() => expect(moderateReflection).toHaveBeenCalledWith(
      pendingReflection.id,
      expect.objectContaining({ status: 'APPROVED' }),
      'creator-token',
    ))
    expect(await screen.findByText('All caught up')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('approved and published')
  })

  it('flags an approved reflection and removes it from the approved tab', async () => {
    renderPage()
    await screen.findAllByText(/Rain at the National Day parade/)
    fireEvent.click(screen.getByRole('tab', { name: /Approved/ }))
    await screen.findAllByText('Ferlyn')

    fireEvent.click(screen.getAllByRole('button', { name: 'Flag / Unpublish' })[0])

    await waitFor(() => expect(moderateReflection).toHaveBeenCalledWith(
      approvedReflection.id,
      expect.objectContaining({ status: 'FLAGGED' }),
      'creator-token',
    ))
    expect(await screen.findByText('No approved memories yet')).toBeInTheDocument()
  })

  it('deletes only after confirmation', async () => {
    renderPage()
    await screen.findAllByText(/Rain at the National Day parade/)
    fireEvent.click(screen.getAllByRole('button', { name: /Delete reflection by Anonymous/ })[0])

    const dialog = screen.getByRole('dialog', { name: 'Delete this reflection?' })
    expect(deleteReflection).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => expect(deleteReflection).toHaveBeenCalledWith(pendingReflection.id, 'creator-token'))
    expect(await screen.findByText('All caught up')).toBeInTheDocument()
  })

  it('keeps the previous reflection and counts when a moderation request fails', async () => {
    moderateReflection.mockRejectedValueOnce(new Error('Moderation service unavailable.'))
    renderPage()
    await screen.findAllByText(/Rain at the National Day parade/)

    fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0])

    expect(await screen.findByRole('alert')).toHaveTextContent('Moderation service unavailable.')
    expect(screen.getAllByText(/Rain at the National Day parade/)[0]).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Pending.*1/ })).toBeInTheDocument()
  })
})
