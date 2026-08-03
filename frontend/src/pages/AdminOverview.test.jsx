import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useAdminSummary from '../hooks/useAdminSummary'
import { getAuditLogs } from '../services/adminService'
import AdminOverview from './AdminOverview'

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ token: 'admin-token' }) }))
vi.mock('../hooks/useAdminSummary', () => ({ default: vi.fn() }))
vi.mock('../services/adminService', () => ({ getAuditLogs: vi.fn() }))

const activitySeries = [
  { date: '2026-07-28', label: '28 Jul', playbacks: 1, views: 2 },
  { date: '2026-07-29', label: '29 Jul', playbacks: 4, views: 7 },
  { date: '2026-07-30', label: '30 Jul', playbacks: 0, views: 1 },
  { date: '2026-07-31', label: '31 Jul', playbacks: 0, views: 0 },
  { date: '2026-08-01', label: '1 Aug', playbacks: 0, views: 0 },
  { date: '2026-08-02', label: '2 Aug', playbacks: 0, views: 0 },
  { date: '2026-08-03', label: '3 Aug', playbacks: 0, views: 0 },
]

const summary = {
  activitySeries,
  pending: { creatorApplications: 2, flaggedReflections: 3, suspendedAccounts: 1, unresolvedWarnings: 4 },
  songs: { published: 6, total: 9 },
  users: { admins: 1, creators: 4, registered: 8, total: 13 },
}

const records = [
  { action: 'CREATOR_APPLICATION_APPROVED', actor: { name: 'Aisha', role: 'ADMIN' }, createdAt: '2026-08-03T01:00:00.000Z', entityId: 'application-1', entityType: 'CREATOR_APPLICATION', id: 'audit-1' },
  { action: 'USER_WARNED', actor: { name: 'Ben', role: 'ADMIN' }, createdAt: '2026-08-02T01:00:00.000Z', entityId: 'warning-1', entityType: 'USER_WARNING', id: 'audit-2' },
  { action: 'FOLDER_APPROVED', actor: { name: 'Chen', role: 'ADMIN' }, createdAt: '2026-08-01T01:00:00.000Z', entityId: 'folder-1', entityType: 'FOLDER', id: 'audit-3' },
]

function renderOverview() {
  return render(<MemoryRouter><AdminOverview /></MemoryRouter>)
}

describe('AdminOverview hierarchy and states', () => {
  beforeEach(() => {
    useAdminSummary.mockReturnValue({ data: summary, error: '', loading: false, refresh: vi.fn() })
    getAuditLogs.mockResolvedValue({ auditLogs: records })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('prioritises non-zero attention queues with specific accessible destinations', () => {
    renderOverview()

    const applications = screen.getByRole('link', { name: 'Review applications: 2 creator applications' })
    expect(applications).toHaveAttribute('href', '/admin/creators?tab=applications')
    expect(screen.getByRole('link', { name: 'Review reports: 3 escalated reports' })).toHaveAttribute('href', '/admin/community?tab=reports')
    expect(screen.getByRole('link', { name: 'View warnings: 4 unresolved warnings' })).toHaveAttribute('href', '/admin/community?tab=warnings')
    expect(screen.getByRole('link', { name: /Manage suspended accounts/ })).toHaveAttribute('href', '/admin/community?tab=users')

    applications.focus()
    expect(applications).toHaveFocus()
    expect(screen.getByText('Safety priority')).toBeInTheDocument()
  })

  it('shows one intentional accessible all-clear state instead of four zero rows', () => {
    useAdminSummary.mockReturnValue({ data: { ...summary, pending: { creatorApplications: 0, flaggedReflections: 0, suspendedAccounts: 0, unresolvedWarnings: 0 } }, error: '', loading: false, refresh: vi.fn() })
    renderOverview()

    expect(screen.getByText('No urgent actions').closest('[role="status"]')).toHaveTextContent('No urgent actions')
    expect(screen.getByText('No suspended accounts')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Review applications/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Review reports/ })).not.toBeInTheDocument()
  })

  it('uses authoritative summary values and explains related metrics', () => {
    renderOverview()

    expect(screen.getByText('Registered members').closest('.admin-metric')).toHaveTextContent('8')
    expect(screen.getByText('Registered members').closest('.admin-metric')).toHaveTextContent('13 total accounts including creators and administrators')
    expect(screen.getByText('Published songs').closest('.admin-metric')).toHaveTextContent('6 of 9 songs are publicly available')
    expect(screen.getByText('Songs across all stages').closest('.admin-metric')).toHaveTextContent('9')
  })

  it('derives listening totals, most active day, and date range from the returned series', () => {
    renderOverview()

    const listening = screen.getByRole('list', { name: 'Listening summary for the displayed period' })
    expect(listening).toHaveTextContent(/Song views\s*10/)
    expect(listening).toHaveTextContent(/Playback starts\s*5/)
    expect(listening).toHaveTextContent(/Most active day\s*29 Jul/)
    expect(screen.getByText(/28 Jul – 3 Aug 2026/)).toBeInTheDocument()
  })

  it('keeps loading and summary-refresh failure states explicit without discarding loaded data', () => {
    useAdminSummary.mockReturnValue({ data: null, error: '', loading: true, refresh: vi.fn() })
    getAuditLogs.mockImplementation(() => new Promise(() => {}))
    const { unmount } = renderOverview()
    expect(screen.getAllByRole('status', { name: 'Loading' }).length).toBeGreaterThanOrEqual(3)
    expect(screen.queryByText('No urgent actions')).not.toBeInTheDocument()
    unmount()

    useAdminSummary.mockReturnValue({ data: summary, error: 'Network unavailable', loading: false, refresh: vi.fn() })
    getAuditLogs.mockResolvedValue({ auditLogs: [] })
    renderOverview()
    expect(screen.getByRole('alert')).toHaveTextContent('Showing the most recently loaded summary')
    expect(screen.getByRole('list', { name: 'Listening summary for the displayed period' })).toBeInTheDocument()
  })

  it('renders one and many activity records with clear actor, target, time, and destinations', async () => {
    getAuditLogs.mockResolvedValue({ auditLogs: [records[0]] })
    const { unmount } = renderOverview()
    expect(await screen.findByText('Actor:')).toBeInTheDocument()
    expect(screen.getByText('Aisha')).toBeInTheDocument()
    expect(screen.getByText(/Target:/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Creator Application Approved: open Creator Application' })).toHaveAttribute('href', '/admin/creators?tab=applications')
    expect(screen.getByRole('link', { name: 'View audit history' })).toHaveAttribute('href', '/admin/activity')
    unmount()

    getAuditLogs.mockResolvedValue({ auditLogs: [...records, ...records.map((record, index) => ({ ...record, id: `copy-${index}` }))] })
    const many = renderOverview()
    await waitFor(() => expect(many.container.querySelectorAll('.admin-activity-item')).toHaveLength(6))
  })

  it('has intentional zero and retryable error states for recent activity', async () => {
    getAuditLogs.mockResolvedValue({ auditLogs: [] })
    const { unmount } = renderOverview()
    expect(await screen.findByRole('heading', { name: 'No recent administrative activity' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'View audit history' })).not.toHaveLength(0)
    unmount()

    getAuditLogs.mockRejectedValue(new Error('Audit service unavailable'))
    renderOverview()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Recent activity could not be loaded.')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No recent administrative activity' })).not.toBeInTheDocument()
  })
})
