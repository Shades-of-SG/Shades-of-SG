import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminUsersPage from './AdminUsersPage'

const mocks = vi.hoisted(() => ({
  deleteAdminUser: vi.fn(),
  getAdminUsers: vi.fn(),
  issueWarning: vi.fn(),
  updateCreatorStatus: vi.fn(),
  updateUserStatus: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ token: 'admin-token' }) }))
vi.mock('../services/adminService', () => ({
  deleteAdminUser: mocks.deleteAdminUser,
  getAdminUsers: mocks.getAdminUsers,
  issueWarning: mocks.issueWarning,
  updateCreatorStatus: mocks.updateCreatorStatus,
  updateUserStatus: mocks.updateUserStatus,
}))

const users = [
  {
    accountStatus: 'ACTIVE', createdAt: '2026-01-01T02:00:00.000Z', creatorAccessStatus: 'ACTIVE',
    email: 'member@example.com', id: 'user-1', name: 'Member One', role: 'REGISTERED',
  },
  {
    accountStatus: 'ACTIVE', createdAt: '2026-02-01T02:00:00.000Z', creatorAccessStatus: 'ACTIVE',
    email: 'creator@example.com', id: 'user-2', name: 'Creator Two', role: 'CREATOR',
  },
]

function renderPage() {
  return render(<MemoryRouter initialEntries={['/admin/users']}><Routes><Route element={<AdminUsersPage />} path="/admin/users" /></Routes></MemoryRouter>)
}

describe('Admin Users page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAdminUsers.mockResolvedValue({ pagination: { page: 1, total: 2, totalPages: 1 }, users })
  })

  afterEach(() => cleanup())

  it('renders a row with exactly two action buttons and a View More (name) link', async () => {
    renderPage()
    const table = await screen.findByRole('table', { name: 'Users' })
    const row = within(table).getByText('Member One').closest('tr')
    const actionButtons = within(row).getAllByRole('button')
    expect(actionButtons.map((button) => button.textContent)).toEqual(['Take action', 'Delete account'])
    expect(within(row).getByRole('link', { name: /Member One/ })).toHaveAttribute('href', '/admin/users/user-1')
  })

  it('excludes admins from the list by never rendering an admin row', async () => {
    renderPage()
    await screen.findByRole('table', { name: 'Users' })
    expect(screen.queryByText('Administrator')).not.toBeInTheDocument()
  })

  it('debounces search and re-fetches with role/sort filters', async () => {
    renderPage()
    await screen.findByRole('table', { name: 'Users' })
    fireEvent.change(screen.getByLabelText('Search users'), { target: { value: 'creator' } })
    await waitFor(() => expect(mocks.getAdminUsers).toHaveBeenCalledWith('admin-token', expect.objectContaining({ search: 'creator' })))

    fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'nameAsc' } })
    await waitFor(() => expect(mocks.getAdminUsers).toHaveBeenCalledWith('admin-token', expect.objectContaining({ sort: 'nameAsc' })))
  })

  it('offers a creator-access option in Take action only for creator rows', async () => {
    renderPage()
    const table = await screen.findByRole('table', { name: 'Users' })
    const memberRow = within(table).getByText('Member One').closest('tr')
    fireEvent.click(within(memberRow).getByRole('button', { name: 'Take action' }))
    let dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByText(/creator access/i)).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))

    const creatorRow = within(table).getByText('Creator Two').closest('tr')
    fireEvent.click(within(creatorRow).getByRole('button', { name: 'Take action' }))
    dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Suspend creator access/i)).toBeInTheDocument()
  })

  it('will not submit the delete modal without both a reason and a password', async () => {
    renderPage()
    const table = await screen.findByRole('table', { name: 'Users' })
    const row = within(table).getByText('Member One').closest('tr')
    fireEvent.click(within(row).getByRole('button', { name: 'Delete account' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Permanently delete account' }))
    expect(mocks.deleteAdminUser).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText(/Reason/), { target: { value: 'Requested by the user.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Permanently delete account' }))
    expect(mocks.deleteAdminUser).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText(/administrator password/i), { target: { value: 'password123' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Permanently delete account' }))
    await waitFor(() => expect(mocks.deleteAdminUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      adminPassword: 'password123', reason: 'Requested by the user.',
    }), 'admin-token'))
  })
})
