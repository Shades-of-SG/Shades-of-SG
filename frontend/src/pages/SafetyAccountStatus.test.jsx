import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SafetyAccountStatus from './SafetyAccountStatus'
import AccountSuspensionStatus from './AccountSuspensionStatus'
import * as safetyService from '../services/userSafetyService'
import * as authApi from '../services/authApi'

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ token: 'member-token' }) }))
vi.mock('../services/userSafetyService', () => ({
  acknowledgeMyWarning: vi.fn(), getMySafetyStatus: vi.fn(), markSafetyNotificationRead: vi.fn(),
}))

const warning = (id, status, values = {}) => ({
  acknowledgedAt: status === 'ACKNOWLEDGED' ? '2026-08-03T02:00:00Z' : null,
  actionTaken: 'Reflection hidden; account remains active.', category: 'HARASSMENT',
  createdAt: '2026-08-03T01:00:00Z', id, mustAcknowledge: status === 'ACTIVE',
  requiredNextStep: status === 'ACTIVE' ? 'Review and acknowledge this warning.' : 'No acknowledgement is required.',
  status, statusExplanation: status === 'WITHDRAWN' ? 'This warning was withdrawn and does not mean that you remain in violation.' : null,
  target: { link: '/profile', status: 'REJECTED', summary: 'Affected private reflection.', title: 'Home', type: 'REFLECTION' },
  userFacingReason: 'A targeted personal attack was removed.', ...values,
  withdrawnAt: status === 'WITHDRAWN' ? '2026-08-03T04:00:00Z' : null,
})

const data = {
  account: { accountStatus: 'ACTIVE', creatorAccessStatus: 'SUSPENDED', isCreator: true },
  appeal: { available: false, supportPath: 'mailto:support@example.com' },
  notifications: [{ createdAt: '2026-08-03T01:01:00Z', id: 'notice-1', link: '/settings/safety?warning=active-1', message: 'Review the formal warning.', readAt: null, title: 'You received a formal warning', type: 'WARNING_ISSUED', warningId: 'active-1' }],
  warnings: [warning('active-1', 'ACTIVE'), warning('ack-1', 'ACKNOWLEDGED'), warning('resolved-1', 'RESOLVED'), warning('withdrawn-1', 'WITHDRAWN')],
}

describe('Safety & Account Status', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    safetyService.getMySafetyStatus.mockResolvedValue(data)
    safetyService.acknowledgeMyWarning.mockResolvedValue({ acknowledgedAt: '2026-08-03T03:00:00Z', status: 'ACKNOWLEDGED' })
    safetyService.markSafetyNotificationRead.mockResolvedValue({ readAt: '2026-08-03T03:00:00Z' })
  })
  afterEach(() => { cleanup(); vi.clearAllMocks(); sessionStorage.clear() })

  it('renders separate access states and active, acknowledged, resolved and withdrawn warning groups', async () => {
    render(<MemoryRouter initialEntries={['/settings/safety?warning=active-1']}><Routes><Route element={<SafetyAccountStatus />} path="/settings/safety" /></Routes></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Safety & Account Status' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Safety & Status' })).toHaveAttribute('href', '/settings/safety')
    expect(await screen.findByRole('heading', { name: 'Active warnings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Acknowledged warnings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Resolved or withdrawn history' })).toBeInTheDocument()
    expect(screen.getAllByText('Resolved').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Withdrawn').length).toBeGreaterThan(0)
    expect(screen.getByText('This warning was withdrawn and does not mean that you remain in violation.')).toBeInTheDocument()
    expect(screen.getByText('A withdrawn warning is not an upheld issue and does not indicate that you remain in violation.')).toBeInTheDocument()
    expect(screen.getByText('Creator Studio is blocked; normal member access and stored songs remain preserved.')).toBeInTheDocument()
    expect(screen.queryByText(/reporter identity/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/private administrator/i)).not.toBeInTheDocument()
  })

  it('acknowledges only after confirmation and announces that content and access remain unchanged', async () => {
    render(<MemoryRouter initialEntries={['/settings/safety']}><SafetyAccountStatus /></MemoryRouter>)
    const activeGroup = (await screen.findByRole('heading', { name: 'Active warnings' })).closest('section')
    fireEvent.click(within(activeGroup).getByRole('button', { name: 'Acknowledge warning' }))
    await waitFor(() => expect(safetyService.acknowledgeMyWarning).toHaveBeenCalledWith('active-1', 'member-token'))
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('does not admit liability'))
    expect(await screen.findByRole('status')).toHaveTextContent('original warning and any separate moderation action remain unchanged')
  })

  it('links and marks the in-product notification while keeping the warning authoritative', async () => {
    render(<MemoryRouter initialEntries={['/settings/safety']}><SafetyAccountStatus /></MemoryRouter>)
    const link = await screen.findByRole('link', { name: /You received a formal warning/ })
    expect(link).toHaveAttribute('href', '/settings/safety?warning=active-1')
    fireEvent.click(link)
    await waitFor(() => expect(safetyService.markSafetyNotificationRead).toHaveBeenCalledWith('notice-1', 'member-token'))
  })

  it('shows a limited member-suspension status without granting normal authenticated access', async () => {
    sessionStorage.setItem('suspensionStatusToken', 'scoped-token')
    vi.spyOn(authApi, 'getSuspensionStatus').mockResolvedValue({ suspension: { accountStatus: 'SUSPENDED', appealAvailable: false, date: '2026-08-03T01:00:00Z', reason: 'Repeated harmful behaviour.', reviewState: 'IN_EFFECT', supportEmail: 'support@example.com' } })
    render(<MemoryRouter><AccountSuspensionStatus /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Your Shades of SG account is unavailable' })).toBeInTheDocument()
    expect(await screen.findByText('Repeated harmful behaviour.')).toBeInTheDocument()
    expect(screen.getByText(/Stored profile, songs, scores, badges, applications, reflections, warnings and history remain preserved/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Return to sign in/ })).toHaveAttribute('href', '/login')
  })
})
