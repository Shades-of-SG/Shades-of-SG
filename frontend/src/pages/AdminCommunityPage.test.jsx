import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminCommunityPage from './AdminCommunityPage'

const service = vi.hoisted(() => ({
  getAdminUsers: vi.fn(), getAuditLogs: vi.fn(), getModerationActions: vi.fn(), getSafetyReports: vi.fn(),
  getWarnings: vi.fn(), issueWarning: vi.fn(), resolveSafetyReport: vi.fn(), resolveWarning: vi.fn(), updateUserStatus: vi.fn(),
}))
const refreshSummary = vi.hoisted(() => vi.fn())

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ token: 'admin-token' }) }))
vi.mock('../hooks/useAdminSummary', () => ({ default: () => ({
  data: { tabCounts: { reports: 1, users: 1, warnings: 1 } }, error: '', loading: false, refresh: refreshSummary,
}) }))
vi.mock('../services/adminService', () => service)

const report = {
  account: { accountStatus: 'ACTIVE', creatorAccessStatus: 'SUSPENDED', email: 'creator@example.com', id: 'user-1', name: 'Creator Member', role: 'CREATOR' },
  caseTypes: ['CREATOR_ESCALATION', 'ADMIN_FLAG'],
  comments: [{ content: 'The surrounding discussion stays visible as evidence.', contributor: { name: 'Context Member', role: 'REGISTERED' }, createdAt: '2026-08-01T01:00:00Z', id: 'comment-1', status: 'REMOVED' }],
  content: 'Original reported reflection evidence.', displayName: 'Creator Member', firstReportedAt: '2026-08-01T01:00:00Z',
  id: 'report-1', latestReportedAt: '2026-08-02T01:00:00Z',
  moderationHistory: [{ actionType: 'REFLECTION_FLAGGED', actor: { name: 'Song Creator', role: 'CREATOR' }, createdAt: '2026-08-01T01:00:00Z', reason: 'Escalated for platform review.' }],
  reasons: ['Escalated for platform review.'], reportCount: 2, reporterName: 'Private Reporter', requiredAction: 'ADMIN_REVIEW', reviewState: 'OPEN',
  song: { creator: { id: 'creator-1', name: 'Song Creator' }, id: 'song-1', status: 'PUBLISHED', title: 'Context Song' },
  targetType: 'REFLECTION', userId: 'user-1',
}

function renderPage(entry = '/admin/community') {
  return render(<MemoryRouter initialEntries={[entry]}><AdminCommunityPage /></MemoryRouter>)
}

describe('Safety & Reports administration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    service.getAuditLogs.mockResolvedValue({ auditLogs: [] })
    service.getSafetyReports.mockResolvedValue({ pagination: { page: 1, total: 1, totalPages: 1 }, reports: [report] })
    service.getWarnings.mockResolvedValue({ warnings: [{ id: 'warning-1', reason: 'Earlier warning', status: 'ACTIVE' }] })
    service.getAdminUsers.mockResolvedValue({ users: [] })
    service.getModerationActions.mockResolvedValue({ actions: [] })
    service.issueWarning.mockResolvedValue({ warning: { id: 'warning-2' } })
    service.resolveSafetyReport.mockResolvedValue({ outcome: 'DISMISS_REPORT' })
    service.resolveWarning.mockResolvedValue({ warning: { id: 'warning-1', status: 'RESOLVED' } })
    service.updateUserStatus.mockResolvedValue({ user: {} })
    refreshSummary.mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('shows grouped open-case evidence, real context, distinct access states, and no reporter identity', async () => {
    renderPage()
    expect((await screen.findAllByText('Original reported reflection evidence.')).length).toBe(2)
    expect(screen.getAllByText('Creator escalation').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Administrator flag').length).toBeGreaterThan(0)
    expect(screen.getByText(/2 recorded flag events/)).toBeInTheDocument()
    expect(screen.getByText('The surrounding discussion stays visible as evidence.')).toBeInTheDocument()
    expect(screen.getByText(/Context Member · Removed/)).toBeInTheDocument()
    expect(screen.getByText('Member account').parentElement).toHaveTextContent('Active')
    expect(screen.getByText('Creator access').parentElement).toHaveTextContent('Suspended')
    expect(screen.queryByText('Private Reporter')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open full song review/ })).toHaveAttribute('href', '/admin/content?tab=songs&songId=song-1')
  })

  it('requires a clear report outcome, prevents repeated submission, and restores row focus on close', async () => {
    renderPage()
    const row = await screen.findByRole('button', { name: /Original reported reflection evidence/ })
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss flag' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Dismiss flag' }))
    expect(service.resolveSafetyReport).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText('Administrator reason (required)'), { target: { value: 'The evidence does not breach platform policy.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Dismiss flag' }))
    expect(await within(dialog).findByRole('button', { name: 'Working…' })).toBeDisabled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Working…' }))
    expect(service.resolveSafetyReport).toHaveBeenCalledTimes(1)
    expect(service.resolveSafetyReport).toHaveBeenCalledWith('report-1', {
      outcome: 'DISMISS_REPORT', reason: 'The evidence does not breach platform policy.',
    }, 'admin-token')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Close report details' }))
    await waitFor(() => expect(row).toHaveFocus())
  })

  it('links warnings to their triggering reflection and does not claim delivery', async () => {
    renderPage()
    await screen.findAllByText('Original reported reflection evidence.')
    fireEvent.click(screen.getByRole('button', { name: 'Issue warning' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('does not suspend access or claim notification delivery')
    fireEvent.change(within(dialog).getByLabelText('Specific reason (required)'), { target: { value: 'Do not submit abusive public reflections.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Record warning' }))
    await waitFor(() => expect(service.issueWarning).toHaveBeenCalledWith({
      reason: 'Do not submit abusive public reflections.', sourceId: 'report-1', sourceType: 'REFLECTION', userId: 'user-1',
    }, 'admin-token'))
    expect(await screen.findByRole('status')).toHaveTextContent('No delivery notification was sent')
  })

  it('labels creator and member access separately for safety-linked users and routes creator controls correctly', async () => {
    service.getAdminUsers.mockResolvedValue({ users: [{
      accountStatus: 'ACTIVE', activeWarningCount: 1, creatorAccessStatus: 'SUSPENDED', creatorSuspensionReason: 'Creator review.',
      email: 'creator@example.com', flaggedContentCount: 2, id: 'user-1', latestSafetyEvent: { createdAt: '2026-08-02T01:00:00Z', type: 'CREATOR_SUSPENDED' },
      name: 'Creator Member', role: 'CREATOR', warningCount: 3,
    }] })
    renderPage('/admin/community?tab=users')
    expect(await screen.findByText('Creator Suspended')).toBeInTheDocument()
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Suspended').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Creator Membercreator@example.com/ }))
    const drawer = screen.getByLabelText('User safety review')
    expect(within(drawer).getByText('Member account').parentElement).toHaveTextContent('Active')
    expect(within(drawer).getByText('Creator access').parentElement).toHaveTextContent('Suspended')
    expect(within(drawer).getByRole('link', { name: /Creator access management/ })).toHaveAttribute('href', '/admin/creators?tab=approved&search=creator%40example.com')
  })

  it('keeps warning triggers and a focused, expandable safety timeline without duplicating Audit History', async () => {
    service.getWarnings.mockResolvedValue({ warnings: [{
      createdAt: '2026-08-01T01:00:00Z', id: 'warning-1', issuer: { name: 'Safety Admin' }, reason: 'Specific conduct warning.',
      source: { id: 'reflection-1', song: { id: 'song-1', title: 'Context Song' }, type: 'REFLECTION' }, status: 'ACTIVE',
      userId: 'user-1', warnedUser: { accountStatus: 'ACTIVE', email: 'member@example.com', id: 'user-1', name: 'Member' },
    }] })
    service.getModerationActions.mockResolvedValue({ actions: [{
      actionType: 'USER_SUSPENDED', actor: { name: 'Safety Admin' }, createdAt: '2026-08-02T01:00:00Z', id: 'action-1',
      metadata: { publishedContentBehavior: 'UNCHANGED' }, reason: 'Broader platform risk.', targetType: 'USER', targetUser: { email: 'member@example.com', name: 'Member' },
    }] })
    renderPage('/admin/community?tab=warnings')
    expect(await screen.findByText('Specific conduct warning.')).toBeInTheDocument()
    expect(screen.getByText('Context Song')).toBeInTheDocument()
    const details = screen.getByText('View details')
    fireEvent.click(details)
    expect(screen.getByText('Broader platform risk.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open complete Audit History' })).toHaveAttribute('href', '/admin/activity')
  })

  it('uses an intentional retryable error state without showing an empty success state', async () => {
    service.getSafetyReports.mockRejectedValueOnce(new Error('Safety service unavailable.')).mockResolvedValueOnce({ pagination: {}, reports: [] })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Safety cases unavailable' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No open reflection cases' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading cases' }))
    expect(await screen.findByRole('heading', { name: 'No open reflection cases' })).toBeInTheDocument()
    expect(service.getSafetyReports).toHaveBeenCalledTimes(2)
  })
})
