import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminCreatorsPage from './AdminCreatorsPage'

const mocks = vi.hoisted(() => ({
  downloadCreatorResume: vi.fn(),
  getAdminApplications: vi.fn(),
  getAdminCreators: vi.fn(),
  refreshSummary: vi.fn(),
  updateApplicationStatus: vi.fn(),
  updateCreatorStatus: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ token: 'admin-token' }) }))
vi.mock('../hooks/useAdminSummary', () => ({
  default: () => ({
    data: { tabCounts: { creatorApplications: 4, creators: 2 } },
    error: '',
    loading: false,
    refresh: mocks.refreshSummary,
  }),
}))
vi.mock('../services/adminService', () => ({
  getAdminApplications: mocks.getAdminApplications,
  getAdminCreators: mocks.getAdminCreators,
  updateApplicationStatus: mocks.updateApplicationStatus,
  updateCreatorStatus: mocks.updateCreatorStatus,
}))
vi.mock('../services/applicationService', () => ({ downloadCreatorResume: mocks.downloadCreatorResume }))
vi.mock('../components/admin/ContextAuditHistory', () => ({ default: () => <section aria-label="Context audit history" /> }))

const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED']
const baseApplication = {
  adminNotes: 'Internal assessment note.',
  allowedTransitions: ['UNDER_REVIEW', 'CHANGES_REQUESTED', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED'],
  applicant: { accountStatus: 'ACTIVE', email: 'amira@example.com', name: 'Amira Tan' },
  applicantFeedback: '',
  completion: { complete: true, missingFields: [] },
  contentIdeas: 'A neighbourhood oral-history series shaped around National Day songs.',
  createdAt: '2026-07-01T02:00:00.000Z',
  experience: 'Community music workshops and documentary editing.',
  guidelinesAccepted: true,
  hasResume: true,
  history: [{ actor: { name: 'Review Admin', role: 'ADMIN' }, createdAt: '2026-07-02T02:00:00.000Z', fromStatus: 'SUBMITTED', id: 'history-1', note: 'Initial review.', toStatus: 'UNDER_REVIEW' }],
  id: 'application-submitted',
  introduction: 'I am a community musician and educator.',
  latestAdministrativeAction: { actorName: 'Review Admin', createdAt: '2026-07-02T02:00:00.000Z', status: 'UNDER_REVIEW' },
  motivation: 'I want to make Singapore music histories approachable to younger audiences.',
  portfolioUrl: 'https://portfolio.example.test/amira',
  resumeFileName: 'amira-resume.pdf',
  resumeFileSize: 120000,
  status: 'SUBMITTED',
  submittedAt: '2026-07-01T02:00:00.000Z',
  updatedAt: '2026-07-02T02:00:00.000Z',
}

const applications = [
  baseApplication,
  {
    ...baseApplication,
    allowedTransitions: [],
    applicant: { accountStatus: 'ACTIVE', email: 'approved@example.com', name: 'Approved Applicant' },
    completion: { complete: false, missingFields: ['Proposed contribution'] },
    hasResume: false,
    history: [],
    id: 'application-approved',
    latestAdministrativeAction: { actorName: 'Review Admin', createdAt: '2026-07-03T02:00:00.000Z', status: 'APPROVED' },
    portfolioUrl: null,
    resumeFileName: null,
    status: 'APPROVED',
  },
  {
    ...baseApplication,
    allowedTransitions: ['REJECTED'],
    applicant: { accountStatus: 'ACTIVE', email: 'waiting@example.com', name: 'Waiting Applicant' },
    id: 'application-waiting',
    status: 'CHANGES_REQUESTED',
  },
  {
    ...baseApplication,
    allowedTransitions: [],
    applicant: { accountStatus: 'ACTIVE', email: 'rejected@example.com', name: 'Rejected Applicant' },
    id: 'application-rejected',
    status: 'REJECTED',
  },
]

const creators = [
  {
    accountStatus: 'ACTIVE',
    createdAt: '2026-01-01T02:00:00.000Z',
    creatorAccessStatus: 'ACTIVE',
    creatorApplications: [],
    email: 'creator@example.com',
    id: 'creator-1',
    name: 'Creator One',
    publishedSongCount: 0,
    songCount: 0,
    updatedAt: '2026-07-03T02:00:00.000Z',
    warnings: [],
  },
  {
    accountStatus: 'SUSPENDED',
    createdAt: '2026-01-01T02:00:00.000Z',
    creatorAccessStatus: 'SUSPENDED',
    creatorSuspensionReason: 'Creator programme review.',
    creatorApplications: [],
    email: 'separate@example.com',
    id: 'creator-2',
    name: 'Separate States',
    publishedSongCount: 2,
    songCount: 3,
    updatedAt: '2026-07-02T02:00:00.000Z',
    warnings: [],
  },
]

function renderPage(entry = '/admin/creators?tab=applications') {
  return render(<MemoryRouter initialEntries={[entry]}><Routes><Route element={<AdminCreatorsPage />} path="/admin/creators" /></Routes></MemoryRouter>)
}

describe('Admin Creators workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAdminApplications.mockResolvedValue({ applicationStatuses: statuses, applications, pagination: { total: 4 } })
    mocks.getAdminCreators.mockResolvedValue({ creators, pagination: { total: 2 } })
    mocks.updateApplicationStatus.mockResolvedValue({ application: { ...baseApplication, status: 'APPROVED' } })
    mocks.updateCreatorStatus.mockResolvedValue({ creator: { ...creators[0], creatorAccessStatus: 'SUSPENDED' } })
    mocks.refreshSummary.mockResolvedValue(undefined)
  })

  afterEach(() => cleanup())

  it('shows server counts, completeness, latest action, and state-aware application actions', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: 'Applications: 4' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approved Creators: 2' })).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: 'Creator applications' })
    expect(within(table).getAllByText('Complete')).toHaveLength(3)
    expect(within(table).getByText('Missing 1')).toHaveAttribute('title', 'Missing: Proposed contribution')
    expect(within(table).getAllByText('View decision')).toHaveLength(2)
    expect(within(table).getByText('Awaiting applicant')).toBeInTheDocument()
    expect(within(table).getByText('Applicant response')).toBeInTheDocument()
    expect(within(table).getByText('Not provided')).toBeInTheDocument()
    expect(within(table).getByRole('link', { name: 'Open Amira Tan portfolio in a new tab' })).toHaveAttribute('target', '_blank')
    expect(mocks.getAdminApplications).toHaveBeenCalledWith('admin-token', expect.objectContaining({ limit: 100 }))
  })

  it('shows every submitted field and returns focus to the application trigger', async () => {
    renderPage()
    const trigger = await screen.findByRole('button', { name: 'Open application for Amira Tan' })
    trigger.focus()
    fireEvent.click(trigger)
    const drawer = screen.getByRole('complementary', { name: 'Application review' })
    expect(within(drawer).getByText(baseApplication.motivation)).toBeInTheDocument()
    expect(within(drawer).getByText(baseApplication.experience)).toBeInTheDocument()
    expect(within(drawer).getByText(baseApplication.contentIdeas)).toBeInTheDocument()
    expect(within(drawer).getByText('I am a community musician and educator.')).toBeInTheDocument()
    expect(within(drawer).getByRole('link', { name: 'Open external portfolio' })).toHaveAttribute('rel', 'noopener noreferrer')
    expect(within(drawer).getByRole('button', { name: 'Download private resume' })).toBeInTheDocument()
    expect(within(drawer).getByText(/Initial review\./)).toBeInTheDocument()
    expect(drawer).not.toHaveTextContent('application-submitted')
    fireEvent.click(within(drawer).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('confirms approval effects, prevents duplicate decisions, and refreshes rows and counts', async () => {
    let resolveDecision
    mocks.updateApplicationStatus.mockImplementationOnce(() => new Promise((resolve) => { resolveDecision = resolve }))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Open application for Amira Tan' }))
    fireEvent.click(screen.getByRole('button', { name: 'Approve application' }))
    const dialog = screen.getByRole('dialog', { name: 'Approved application' })
    expect(dialog).toHaveTextContent('grants creator privileges')
    expect(dialog).toHaveTextContent('retaining their member account')
    expect(dialog).toHaveTextContent('does not transfer or alter another creator’s content ownership')
    const confirm = within(dialog).getByRole('button', { name: 'Approve application' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(mocks.updateApplicationStatus).toHaveBeenCalledTimes(1)
    resolveDecision({ application: { ...baseApplication, status: 'APPROVED' } })
    expect(await screen.findByRole('status')).toHaveTextContent('Application moved to Approved')
    await waitFor(() => expect(mocks.refreshSummary).toHaveBeenCalledTimes(1))
    expect(mocks.getAdminApplications).toHaveBeenCalledTimes(2)
  })

  it('keeps a failed decision recoverable and does not report success', async () => {
    mocks.updateApplicationStatus.mockRejectedValueOnce(new Error('The application changed on the server.'))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Open application for Amira Tan' }))
    fireEvent.click(screen.getByRole('button', { name: 'Approve application' }))
    fireEvent.click(screen.getByRole('dialog').querySelector('footer button:last-child'))
    expect(await screen.findByRole('alert')).toHaveTextContent('No decision was recorded')
    expect(screen.getByRole('dialog', { name: 'Approved application' })).toBeInTheDocument()
    expect(mocks.refreshSummary).not.toHaveBeenCalled()
  })

  it('keeps creator and member states distinct and requires a traceable suspension reason', async () => {
    renderPage('/admin/creators?tab=approved')
    const table = await screen.findByRole('table', { name: 'Approved creators' })
    const separateRow = within(table).getByRole('button', { name: 'Open creator details for Separate States' }).closest('tr')
    expect(within(separateRow).getByText('Creator access')).toBeInTheDocument()
    expect(within(separateRow).getByText('Member account')).toBeInTheDocument()
    expect(within(separateRow).getAllByText('Suspended')).toHaveLength(2)
    expect(within(table).getByText('0 songs')).toBeInTheDocument()

    fireEvent.click(within(table).getByRole('button', { name: 'Open creator details for Creator One' }))
    const drawer = screen.getByRole('complementary', { name: 'Creator details' })
    expect(within(drawer).getByRole('link', { name: 'Public creator profile' })).toHaveAttribute('href', '/creators/creator-1')
    expect(within(drawer).getByRole('link', { name: /Member status in Safety & Reports/ })).toHaveAttribute('href', '/admin/community?tab=users')
    fireEvent.click(within(drawer).getByRole('button', { name: 'Suspend creator access' }))
    const dialog = screen.getByRole('dialog', { name: 'Suspend creator access?' })
    expect(dialog).toHaveTextContent('can still log in')
    expect(dialog).toHaveTextContent('published content remains public')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Suspend creator access' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a reason')
    expect(mocks.updateCreatorStatus).not.toHaveBeenCalled()
    fireEvent.change(within(dialog).getByRole('textbox', { name: /Administrator reason/ }), { target: { value: 'Repeated creator programme policy breaches.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Suspend creator access' }))
    await waitFor(() => expect(mocks.updateCreatorStatus).toHaveBeenCalledWith('creator-1', 'SUSPENDED', 'admin-token', 'Repeated creator programme policy breaches.'))
  })
})
