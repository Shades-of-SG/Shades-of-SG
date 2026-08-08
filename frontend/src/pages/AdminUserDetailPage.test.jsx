import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminUserDetailPage from './AdminUserDetailPage'

const mocks = vi.hoisted(() => ({
  getAdminUser: vi.fn(),
  getAdminUserCreatorStats: vi.fn(),
  sendAdminPasswordResetLink: vi.fn(),
  updateAdminUserEmail: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ token: 'admin-token' }) }))
vi.mock('../services/adminService', () => ({
  getAdminUser: mocks.getAdminUser,
  getAdminUserCreatorStats: mocks.getAdminUserCreatorStats,
  sendAdminPasswordResetLink: mocks.sendAdminPasswordResetLink,
  updateAdminUserEmail: mocks.updateAdminUserEmail,
}))

const emptySections = {
  badges: { catalogTotal: 9, rows: [], total: 0 },
  bookmarks: { rows: [], total: 0 },
  gameScores: { rows: [], total: 0 },
  instrumentProgress: { rows: [], total: 0 },
  reflections: { rows: [], total: 0 },
  triviaAttempts: { correctCount: 0, rows: [], total: 0 },
}

const memberUser = {
  accountStatus: 'ACTIVE', createdAt: '2026-01-01T02:00:00.000Z', currentLoginStreak: 3, email: 'member@example.com',
  emailVerifiedAt: '2026-01-01T02:00:00.000Z', id: 'user-1', lastActiveDate: '2026-08-01', longestLoginStreak: 10,
  name: 'Member One', role: 'REGISTERED',
}

function renderPage(userId = 'user-1') {
  return render(<MemoryRouter initialEntries={[`/admin/users/${userId}`]}><Routes><Route element={<AdminUserDetailPage />} path="/admin/users/:userId" /></Routes></MemoryRouter>)
}

describe('Admin User Information page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => cleanup())

  it('shows a loading state, then the profile fields formatted as Field: value', async () => {
    mocks.getAdminUser.mockResolvedValue({ sections: emptySections, user: memberUser, warnings: [] })
    renderPage()
    expect(screen.getByRole('heading', { name: 'User Information' })).toBeInTheDocument()
    expect(await screen.findByText('Name: Member One')).toBeInTheDocument()
    expect(screen.getByText('Email: member@example.com')).toBeInTheDocument()
    expect(screen.getByText(/^Password:/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument()
  })

  it('renders six zeroed accordions for a user with no data, without crashing', async () => {
    mocks.getAdminUser.mockResolvedValue({ sections: emptySections, user: memberUser, warnings: [] })
    renderPage()
    expect(await screen.findByText('Bookmarked songs: 0')).toBeInTheDocument()
    expect(screen.getByText('Rhythm game attempts: 0')).toBeInTheDocument()
    expect(screen.getByText('Reflections: 0')).toBeInTheDocument()
    expect(screen.getByText('Badges obtained: 0/9')).toBeInTheDocument()
    expect(screen.getByText('Trivia attempts: 0')).toBeInTheDocument()
    expect(screen.getByText('Instrument challenge progress: 0')).toBeInTheDocument()
  })

  it('shows no Creator-side data tabs for a registered (non-creator) user', async () => {
    mocks.getAdminUser.mockResolvedValue({ sections: emptySections, user: memberUser, warnings: [] })
    renderPage()
    await screen.findByText('Name: Member One')
    expect(screen.queryByRole('button', { name: 'Creator-side data' })).not.toBeInTheDocument()
  })

  it('shows Creator-side data tabs for a creator and loads stats lazily only after switching', async () => {
    const creatorUser = { ...memberUser, id: 'user-2', name: 'Creator Two', role: 'CREATOR', creatorAccessStatus: 'ACTIVE' }
    mocks.getAdminUser.mockResolvedValue({ sections: emptySections, user: creatorUser, warnings: [] })
    mocks.getAdminUserCreatorStats.mockResolvedValue({
      applications: [],
      songs: [],
      summary: {
        events: {}, generationJobs: {}, reflections: {}, rhythmScores: 0,
        songs: { ARCHIVED: 0, DRAFT: 1, GENERATING: 0, PUBLISHED: 1, READY: 0, total: 2 },
      },
    })
    renderPage('user-2')
    await screen.findByText('Name: Creator Two')
    expect(mocks.getAdminUserCreatorStats).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Creator-side data' }))
    await waitFor(() => expect(mocks.getAdminUserCreatorStats).toHaveBeenCalledWith('user-2', 'admin-token'))
    expect(await screen.findByText('This creator has not created any songs yet.')).toBeInTheDocument()
  })

  it('requires an admin password before editing the email, then re-fetches on success', async () => {
    mocks.getAdminUser.mockResolvedValue({ sections: emptySections, user: memberUser, warnings: [] })
    mocks.updateAdminUserEmail.mockResolvedValue({ user: { ...memberUser, email: 'fixed@example.com' } })
    renderPage()
    await screen.findByText('Name: Member One')
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save email' }))
    expect(mocks.updateAdminUserEmail).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText(/administrator password/i), { target: { value: 'password123' } })
    fireEvent.change(within(dialog).getByLabelText(/new email/i), { target: { value: 'fixed@example.com' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save email' }))
    await waitFor(() => expect(mocks.updateAdminUserEmail).toHaveBeenCalledWith('user-1', { adminPassword: 'password123', email: 'fixed@example.com' }, 'admin-token'))
    expect(mocks.getAdminUser).toHaveBeenCalledTimes(2)
  })
})
