import { AlertTriangle, ExternalLink, Flag, MessageSquareWarning, ShieldAlert, UserRoundCheck, UserRoundX, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AdminPageHeader, AdminSummaryError, AdminTabPanel, AdminTabs, ConfirmationModal, DataTable, DetailDrawer, EmptyState,
  Feedback, FilterBar, LoadingRows, Pagination, Panel, StatusBadge,
} from '../components/admin/AdminUI'
import ContextAuditHistory from '../components/admin/ContextAuditHistory'
import { useAuth } from '../context/AuthContext'
import useAdminSummary from '../hooks/useAdminSummary'
import {
  getAdminUsers, getModerationActions, getSafetyReports, getWarnings, issueWarning,
  resolveSafetyReport, resolveWarning, updateUserStatus,
} from '../services/adminService'
import { formatDate, labelFor, relativeTime, useTab } from './adminUtils'

const caseTypeLabels = {
  ADMIN_FLAG: 'Administrator flag',
  CREATOR_ESCALATION: 'Creator escalation',
  UNATTRIBUTED_FLAG: 'Legacy unattributed flag',
}

const outcomeDetails = {
  DISMISS_REPORT: {
    confirm: 'Dismiss flag',
    message: 'Flag dismissed. The reflection is approved again; no notification was sent.',
    title: 'Dismiss this flag?',
    description: 'The reflection becomes approved and can appear publicly when its song is published. The evidence and action history remain stored. A moderator can review it again later.',
  },
  REMOVE_REFLECTION: {
    confirm: 'Hide reflection',
    message: 'Reflection hidden. Its evidence and history remain stored; no notification was sent.',
    title: 'Hide this reflection?',
    description: 'The reflection becomes rejected and leaves public display. The contributor’s profile, scores, badges and other content are unchanged. The stored reflection can be restored through moderation.',
  },
  RETURN_TO_CREATOR: {
    confirm: 'Return to creator',
    message: 'Reflection returned to the creator moderation queue; no notification was sent.',
    title: 'Return this case to the creator?',
    description: 'The reflection becomes pending and remains out of public display until its song creator reviews it. Evidence and platform history remain stored.',
  },
}

function contributorName(report) {
  return report.account?.name || report.displayName || 'Anonymous contributor'
}

function ReportWorkspace({ onFeedback, onSummaryRefresh, token }) {
  const [reports, setReports] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [filters, setFilters] = useState({ dateFrom: '', search: '' })
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [warnings, setWarnings] = useState([])
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const rowRefs = useRef(new Map())
  const selected = useMemo(() => reports.find((item) => item.id === selectedId) || null, [reports, selectedId])

  const refresh = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await getSafetyReports(token, { ...filters, limit: 12, page })
      const next = data.reports || []
      setReports(next)
      setPagination(data.pagination || { page: 1, total: next.length, totalPages: 1 })
      setSelectedId((current) => next.some((item) => item.id === current) ? current : (next[0]?.id || ''))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [filters, token])

  useEffect(() => {
    const timer = window.setTimeout(() => refresh(1), filters.search ? 220 : 0)
    return () => window.clearTimeout(timer)
  }, [filters, refresh])

  useEffect(() => {
    if (!selected?.userId) return undefined
    let active = true
    getWarnings(token, { limit: 20, userId: selected.userId })
      .then((data) => { if (active) setWarnings(data.warnings || []) })
      .catch(() => { if (active) setWarnings([]) })
    return () => { active = false }
  }, [selected?.userId, token])

  function closeDetails() {
    const id = selectedId
    setSelectedId('')
    window.requestAnimationFrame(() => rowRefs.current.get(id)?.focus())
  }

  async function submitOutcome() {
    if (modal.reason.trim().length < 5) { onFeedback({ message: 'Enter a specific resolution reason.', type: 'error' }); return }
    setBusy(true)
    try {
      await resolveSafetyReport(selected.id, { outcome: modal.outcome, reason: modal.reason }, token)
      onFeedback({ message: outcomeDetails[modal.outcome].message, type: 'status' })
      setModal(null)
      await Promise.all([refresh(pagination.page), onSummaryRefresh()])
    } catch (requestError) {
      onFeedback({ message: requestError.message, type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function submitWarning() {
    if (modal.reason.trim().length < 5) { onFeedback({ message: 'Enter a specific warning reason.', type: 'error' }); return }
    setBusy(true)
    try {
      await issueWarning({ reason: modal.reason, sourceId: selected.id, sourceType: 'REFLECTION', userId: selected.userId }, token)
      onFeedback({ message: 'Warning recorded in product history. No delivery notification was sent.', type: 'status' })
      setModal(null)
      const data = await getWarnings(token, { limit: 20, userId: selected.userId })
      setWarnings(data.warnings || [])
      await onSummaryRefresh()
    } catch (requestError) {
      onFeedback({ message: requestError.message, type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function submitAccountChange() {
    if (modal.reason.trim().length < 5) { onFeedback({ message: 'Enter a reason for this member-account action.', type: 'error' }); return }
    const accountStatus = selected.account.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    setBusy(true)
    try {
      await updateUserStatus(selected.userId, accountStatus, token, modal.reason)
      onFeedback({ message: `Member account ${accountStatus === 'ACTIVE' ? 'restored' : 'suspended'}.`, type: 'status' })
      setModal(null)
      await Promise.all([refresh(pagination.page), onSummaryRefresh()])
    } catch (requestError) {
      onFeedback({ message: requestError.message, type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const hasFilters = Boolean(filters.search || filters.dateFrom)
  const primaryReason = selected?.reasons?.[0] || 'No moderation reason was recorded for this legacy flag.'

  return <>
    <FilterBar onClear={() => setFilters({ dateFrom: '', search: '' })} showClear={hasFilters}>
      <label>Search open cases<input aria-label="Search safety reports" onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} placeholder="Content, contributor or song" value={filters.search} /></label>
      <label>Flagged since<input aria-label="Flagged since" onChange={(event) => setFilters((value) => ({ ...value, dateFrom: event.target.value }))} type="date" value={filters.dateFrom} /></label>
    </FilterBar>
    {error ? <div className="admin-inline-error" role="alert"><span>{reports.length ? 'The queue could not be refreshed. Previously loaded cases remain visible.' : error}</span><button className="admin-button admin-button--ghost" onClick={() => refresh(pagination.page)} type="button">Retry</button></div> : null}
    {loading && !reports.length ? <LoadingRows /> : reports.length ? <div className={`admin-report-layout ${selected ? '' : 'has-no-selection'}`}>
      <Panel title="Open reflection safety cases" subtitle={`${pagination.total} flagged reflections awaiting a recorded outcome`}>
        <div className="admin-report-list">{reports.map((report) => <button
          aria-pressed={selected?.id === report.id}
          className={`admin-report-row ${selected?.id === report.id ? 'is-selected' : ''}`}
          key={report.id}
          onClick={() => setSelectedId(report.id)}
          ref={(node) => { if (node) rowRefs.current.set(report.id, node); else rowRefs.current.delete(report.id) }}
          type="button"
        >
          <span className="admin-report-row__top"><strong>Reflection · {report.song?.title || 'Unknown song'}</strong><StatusBadge status="OPEN">Open</StatusBadge></span>
          <span className="admin-report-row__types">{report.caseTypes.map((type) => <StatusBadge key={type} status={type}>{caseTypeLabels[type]}</StatusBadge>)}</span>
          <p>{report.content.length > 170 ? `${report.content.slice(0, 170)}…` : report.content}</p>
          <dl className="admin-report-row__facts"><div><dt>Contributor</dt><dd>{contributorName(report)}</dd></div><div><dt>Reason</dt><dd>{report.reasons?.[0] || 'Not recorded'}</dd></div><div><dt>Flag events</dt><dd>{report.reportCount}</dd></div><div><dt>Latest</dt><dd>{relativeTime(report.latestReportedAt)}</dd></div></dl>
          <small>Required action: review evidence and record one outcome</small>
        </button>)}</div>
        <Pagination onNext={() => refresh(pagination.page + 1)} onPrevious={() => refresh(pagination.page - 1)} page={pagination.page} totalPages={pagination.totalPages} />
      </Panel>
      {selected ? <aside aria-label="Safety case review" className="admin-report-detail">
        <header><div><h2>Safety case review</h2><p>Open · Reflection</p></div><button aria-label="Close report details" onClick={closeDetails} type="button"><X /></button></header>
        <div className="admin-report-detail__body">
          <section><h3>Case source</h3><div className="admin-report-row__types">{selected.caseTypes.map((type) => <StatusBadge key={type} status={type}>{caseTypeLabels[type]}</StatusBadge>)}</div><p>{selected.reportCount} recorded flag {selected.reportCount === 1 ? 'event' : 'events'} · first {formatDate(selected.firstReportedAt)} · latest {formatDate(selected.latestReportedAt)}</p></section>
          <section className="admin-report-evidence"><h3>Original reported reflection</h3><blockquote>{selected.content}</blockquote><p><strong>Contributor:</strong> {contributorName(selected)}{selected.account ? ` · ${labelFor(selected.account.role)}` : ' · Guest submission'}</p></section>
          <section><h3>Recorded flag reason</h3><p>{primaryReason}</p>{selected.reasons?.slice(1).map((reason) => <p key={reason}>{reason}</p>)}</section>
          <section><h3>Song and creator context</h3><p><strong>Song:</strong> {selected.song?.title || 'Unknown song'} · {labelFor(selected.song?.status || 'unknown')}<br /><strong>Creator:</strong> {selected.song?.creator?.name || 'Unknown creator'}</p>{selected.song?.id ? <Link className="admin-button admin-button--ghost admin-inline-link" to={`/admin/content?tab=songs&songId=${encodeURIComponent(selected.song.id)}`}><ExternalLink />Open full song review</Link> : null}</section>
          <section><h3>Surrounding discussion</h3>{selected.comments?.length ? <ol className="admin-case-timeline">{selected.comments.map((comment) => <li key={comment.id}><div><strong>{comment.contributor?.name || 'Unknown member'} · {labelFor(comment.status)}</strong><p>{comment.content}</p><time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time></div></li>)}</ol> : <p>No discussion comments are attached to this reflection.</p>}</section>
          <section><h3>Contributor safety snapshot</h3>{selected.account ? <><div className="admin-access-pair"><span><small>Member account</small><StatusBadge status={selected.account.accountStatus}>{labelFor(selected.account.accountStatus)}</StatusBadge></span>{selected.account.role === 'CREATOR' ? <span><small>Creator access</small><StatusBadge status={selected.account.creatorAccessStatus}>{labelFor(selected.account.creatorAccessStatus)}</StatusBadge></span> : null}</div><p>{warnings.filter((warning) => warning.status === 'ACTIVE').length} active · {warnings.length} total warnings</p></> : <p>This is a guest contribution, so account actions are unavailable.</p>}</section>
          <section><h3>Moderation timeline</h3>{selected.moderationHistory?.length ? <ol className="admin-case-timeline">{selected.moderationHistory.map((action, index) => <li key={`${action.actionType}-${action.createdAt}-${index}`}><div><strong>{labelFor(action.actionType)}</strong><p>{action.reason || 'No reason recorded'}</p><time dateTime={action.createdAt}>{formatDate(action.createdAt)} · {labelFor(action.actor?.role || 'system')}</time></div></li>)}</ol> : <p>No prior moderation actions were recorded.</p>}</section>
          <ContextAuditHistory entityId={selected.id} token={token} />
        </div>
        <div className="admin-report-detail__actions"><button className="admin-button admin-button--primary" disabled={busy} onClick={() => setModal({ outcome: 'DISMISS_REPORT', reason: '', type: 'outcome' })} type="button">Dismiss flag</button><button className="admin-button admin-button--ghost" disabled={busy} onClick={() => setModal({ outcome: 'RETURN_TO_CREATOR', reason: '', type: 'outcome' })} type="button">Return to creator</button>{selected.userId ? <button className="admin-button admin-button--ghost" disabled={busy} onClick={() => setModal({ reason: '', type: 'warning' })} type="button"><AlertTriangle />Issue warning</button> : null}</div>
        <div className="admin-report-detail__danger"><button className="admin-button admin-button--danger" disabled={busy} onClick={() => setModal({ outcome: 'REMOVE_REFLECTION', reason: '', type: 'outcome' })} type="button">Hide reflection</button>{selected.account ? <button className="admin-button admin-button--danger" disabled={busy} onClick={() => setModal({ reason: '', type: 'account' })} type="button">{selected.account.accountStatus === 'SUSPENDED' ? 'Restore member account' : 'Suspend member account'}</button> : null}</div>
      </aside> : null}
    </div> : <EmptyState action={error ? <button className="admin-button admin-button--ghost" onClick={() => refresh(1)} type="button">Retry loading cases</button> : null} description={hasFilters ? 'Try clearing the case filters.' : 'Creator and administrator reflection flags will appear here. User reports, automated flags and appeals are not implemented.'} icon={Flag} title={error ? 'Safety cases unavailable' : 'No open reflection cases'} />}
    {modal?.type === 'outcome' ? <ConfirmationModal busy={busy} confirmLabel={outcomeDetails[modal.outcome].confirm} danger={modal.outcome === 'REMOVE_REFLECTION'} onCancel={() => setModal(null)} onConfirm={submitOutcome} title={outcomeDetails[modal.outcome].title}><form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>{outcomeDetails[modal.outcome].description}</p><label>Administrator reason (required)<textarea maxLength="2000" minLength="5" onChange={(event) => setModal((value) => ({ ...value, reason: event.target.value }))} required value={modal.reason} /></label><p className="admin-field-note">The in-product decision and audit record are authoritative; this action does not claim to send a notification.</p></form></ConfirmationModal> : null}
    {modal?.type === 'warning' ? <ConfirmationModal busy={busy} confirmLabel="Record warning" danger onCancel={() => setModal(null)} onConfirm={submitWarning} title={`Warn ${contributorName(selected)}?`}><form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>This warning will link to the reported reflection and remain in history after resolution. It does not suspend access or claim notification delivery.</p><label>Specific reason (required)<textarea maxLength="2000" minLength="5" onChange={(event) => setModal((value) => ({ ...value, reason: event.target.value }))} required value={modal.reason} /></label></form></ConfirmationModal> : null}
    {modal?.type === 'account' ? <AccountModal busy={busy} onCancel={() => setModal(null)} onConfirm={submitAccountChange} onReason={(reason) => setModal((value) => ({ ...value, reason }))} reason={modal.reason} user={selected.account} /> : null}
  </>
}

function AccountModal({ busy, onCancel, onConfirm, onReason, reason, user }) {
  const restoring = user.accountStatus === 'SUSPENDED'
  return <ConfirmationModal busy={busy} confirmLabel={restoring ? 'Restore member account' : 'Suspend member account'} danger={!restoring} onCancel={onCancel} onConfirm={onConfirm} title={restoring ? 'Restore this member account?' : 'Suspend this member account?'}><form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>{restoring
    ? 'Login and authenticated member access resume on the existing account. Stored profiles, songs, scores, badges, applications, reflections and history are reused; creator access remains in its separately recorded state.'
    : 'Login and all authenticated member access stop immediately, including creator-only access. Stored profiles, songs, scores, badges, applications, reflections and history remain. Published songs stay public unless separately changed in Content.'}</p><label>Administrator reason (required)<textarea maxLength="1000" minLength="5" onChange={(event) => onReason(event.target.value)} placeholder={restoring ? 'Explain why access is safe to restore' : 'Explain the broader platform risk and include appeal guidance'} required value={reason} /></label></form></ConfirmationModal>
}

function SafetyActionHistory({ actions }) {
  return <Panel actions={<Link className="admin-text-link" to="/admin/activity">Open complete Audit History</Link>} title="Safety action timeline" subtitle="A focused moderation history; complete system events remain in Audit History.">
    {actions.length ? <DataTable caption="Safety action timeline" columns={['Affected item', 'Action', 'Administrator', 'Date', 'Details']}>
      {actions.map((action) => <tr key={action.id}>
        <td data-label="Affected item"><strong>{action.targetUser?.name || action.song?.title || labelFor(action.targetType)}</strong><small>{action.song?.title || action.targetUser?.email}</small></td>
        <td data-label="Action"><StatusBadge status={action.actionType}>{labelFor(action.actionType)}</StatusBadge></td>
        <td data-label="Administrator">{action.actor?.name || 'System'}</td>
        <td data-label="Date"><time dateTime={action.createdAt}>{formatDate(action.createdAt)}</time></td>
        <td data-label="Details"><details className="admin-action-details"><summary>View details</summary><p>{action.reason || 'No reason recorded'}</p>{action.metadata?.outcome ? <p>Outcome: {labelFor(action.metadata.outcome)}</p> : null}</details></td>
      </tr>)}
    </DataTable> : <EmptyState description="Warnings, content outcomes and access changes will appear here." title="No safety actions found" />}
  </Panel>
}

export default function AdminCommunityPage() {
  const { token } = useAuth()
  const { data: summary, error: summaryError, loading: summaryLoading, refresh: refreshSummary } = useAdminSummary(token)
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useTab(params, setParams, ['reports', 'users', 'warnings'], 'reports')
  const [users, setUsers] = useState([])
  const [warnings, setWarnings] = useState([])
  const [actions, setActions] = useState([])
  const [filters, setFilters] = useState({ accountStatus: '', actionType: '', dateFrom: '', role: '', search: '', status: '' })
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null)
  const [feedback, setFeedback] = useState({ message: '', type: 'status' })
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (tab === 'reports') return
    setLoading(true)
    try {
      if (tab === 'users') {
        const data = await getAdminUsers(token, { accountStatus: filters.accountStatus, limit: 100, role: filters.role, scope: 'safety', search: filters.search })
        setUsers(data.users || [])
      } else {
        const [warningData, actionData] = await Promise.all([
          getWarnings(token, { dateFrom: filters.dateFrom, limit: 100, search: filters.search, status: filters.status }),
          getModerationActions(token, { actionType: filters.actionType, dateFrom: filters.dateFrom, limit: 100, scope: 'safety', search: filters.search }),
        ])
        setWarnings(warningData.warnings || [])
        setActions(actionData.actions || [])
      }
    } catch (requestError) {
      setFeedback({ message: requestError.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [filters.accountStatus, filters.actionType, filters.dateFrom, filters.role, filters.search, filters.status, tab, token])

  useEffect(() => {
    const timer = window.setTimeout(refresh, filters.search ? 220 : 0)
    return () => window.clearTimeout(timer)
  }, [filters.search, refresh])

  async function submitAccountChange() {
    if (modal.reason.trim().length < 5) { setFeedback({ message: 'Enter a reason for this member-account action.', type: 'error' }); return }
    const accountStatus = modal.user.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    setBusy(true)
    try {
      await updateUserStatus(modal.user.id, accountStatus, token, modal.reason)
      setFeedback({ message: `Member account ${accountStatus === 'ACTIVE' ? 'restored' : 'suspended'}.`, type: 'status' })
      setModal(null); setSelected(null); await Promise.all([refresh(), refreshSummary()])
    } catch (requestError) { setFeedback({ message: requestError.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function submitWarning() {
    if (modal.reason.trim().length < 5) { setFeedback({ message: 'Enter a specific warning reason.', type: 'error' }); return }
    setBusy(true)
    try {
      await issueWarning({ reason: modal.reason, userId: modal.user.id }, token)
      setFeedback({ message: 'Warning recorded in product history. No delivery notification was sent.', type: 'status' })
      setModal(null); setSelected(null); await Promise.all([refresh(), refreshSummary()])
    } catch (requestError) { setFeedback({ message: requestError.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function submitResolve() {
    if (modal.resolutionNote.trim().length < 5) { setFeedback({ message: 'Enter a resolution note.', type: 'error' }); return }
    setBusy(true)
    try {
      await resolveWarning(modal.warning.id, modal.resolutionNote, token)
      setFeedback({ message: 'Warning resolved and retained in history.', type: 'status' })
      setModal(null); setSelected(null); await Promise.all([refresh(), refreshSummary()])
    } catch (requestError) { setFeedback({ message: requestError.message, type: 'error' }) } finally { setBusy(false) }
  }

  const clearFilters = () => setFilters({ accountStatus: '', actionType: '', dateFrom: '', role: '', search: '', status: '' })
  const hasFilters = Object.values(filters).some(Boolean)

  return <div className="admin-page admin-community"><div className="admin-page__inner">
    <AdminPageHeader description="Review real reflection flags, linked users, warnings and traceable moderation outcomes." title="Safety & Reports" />
    <AdminTabs active={tab} items={[
      { id: 'reports', label: 'Reports', count: summary?.tabCounts?.reports, countLoading: summaryLoading },
      { id: 'users', label: 'Users', count: summary?.tabCounts?.users, countLoading: summaryLoading },
      { id: 'warnings', label: 'Warnings & Actions', count: summary?.tabCounts?.warnings, countLoading: summaryLoading },
    ]} onChange={(next) => { setLoading(true); clearFilters(); setSelected(null); setTab(next) }} />
    <AdminSummaryError message={summaryError} onRetry={refreshSummary} />
    <Feedback {...feedback} />
    <AdminTabPanel key={tab}>
      {tab === 'reports' ? <ReportWorkspace onFeedback={setFeedback} onSummaryRefresh={refreshSummary} token={token} /> : <>
        <FilterBar onClear={clearFilters} showClear={hasFilters}>
          <label>Search<input aria-label={tab === 'users' ? 'Search safety users' : 'Search warning and action history'} onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} placeholder={tab === 'users' ? 'Name or email' : 'Recorded reason'} value={filters.search} /></label>
          {tab === 'users' ? <><label>Role<select onChange={(event) => setFilters((value) => ({ ...value, role: event.target.value }))} value={filters.role}><option value="">All roles</option><option value="REGISTERED">Registered</option><option value="CREATOR">Creator</option></select></label><label>Member account<select onChange={(event) => setFilters((value) => ({ ...value, accountStatus: event.target.value }))} value={filters.accountStatus}><option value="">All member states</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select></label></> : <><label>Warning status<select onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))} value={filters.status}><option value="">All warnings</option><option value="ACTIVE">Active</option><option value="RESOLVED">Resolved</option></select></label><label>Action<select onChange={(event) => setFilters((value) => ({ ...value, actionType: event.target.value }))} value={filters.actionType}><option value="">All safety actions</option><option value="USER_WARNED">Warning issued</option><option value="USER_WARNING_RESOLVED">Warning resolved</option><option value="REFLECTION_REMOVED_BY_ADMIN">Reflection hidden</option><option value="SAFETY_REPORT_DISMISSED">Flag dismissed</option><option value="CREATOR_SUSPENDED">Creator access suspended</option><option value="USER_SUSPENDED">Member account suspended</option></select></label><label>Since<input aria-label="History since" onChange={(event) => setFilters((value) => ({ ...value, dateFrom: event.target.value }))} type="date" value={filters.dateFrom} /></label></>}
        </FilterBar>
        {loading ? <LoadingRows /> : tab === 'users' ? <Panel className="admin-community__users" title="Safety-linked users" subtitle="Only accounts connected to a flag, warning or access action are shown.">
          {users.length ? <DataTable caption="Safety-related users" columns={['User', 'Role', 'Flagged', 'Warnings', 'Member', 'Creator access', 'Latest safety event', 'Action']}>
            {users.map((user) => <tr className={selected?.id === user.id ? 'is-selected' : ''} key={user.id}>
              <td data-label="User"><button className="admin-row-button" onClick={() => setSelected(user)} type="button"><strong>{user.name}</strong><small>{user.email}</small></button></td><td data-label="Role">{labelFor(user.role)}</td><td data-label="Flagged">{user.flaggedContentCount || 0}</td><td data-label="Warnings">{user.activeWarningCount ? <StatusBadge status="FLAGGED">{user.activeWarningCount} active / {user.warningCount} total</StatusBadge> : `${user.warningCount || 0} total`}</td><td data-label="Member"><StatusBadge status={user.accountStatus}>{labelFor(user.accountStatus)}</StatusBadge></td><td data-label="Creator access">{user.role === 'CREATOR' ? <StatusBadge status={user.creatorAccessStatus}>{labelFor(user.creatorAccessStatus)}</StatusBadge> : 'Not applicable'}</td><td data-label="Latest safety event">{user.latestSafetyEvent ? <><strong>{labelFor(user.latestSafetyEvent.type)}</strong><small>{formatDate(user.latestSafetyEvent.createdAt, false)}</small></> : 'No dated event'}</td><td data-label="Action"><button className="admin-button admin-button--ghost" onClick={() => setSelected(user)} type="button">Review</button></td>
            </tr>)}
          </DataTable> : <EmptyState description={hasFilters ? 'Try changing or clearing the filters.' : 'Accounts appear after a flag, warning or access action.'} title="No safety-linked users" />}
        </Panel> : <><Panel title="Warning history" subtitle="Warnings remain visible after resolution; the in-product record is authoritative.">
          {warnings.length ? <DataTable caption="Warning history" columns={['User', 'Reason', 'Trigger', 'Issued by', 'Status', 'Date', 'Action']}>
            {warnings.map((warning) => <tr className={selected?.id === warning.id ? 'is-selected' : ''} key={warning.id}>
              <td data-label="User"><button className="admin-row-button" onClick={() => setSelected(warning)} type="button"><strong>{warning.warnedUser?.name || 'Unknown user'}</strong><small>{warning.warnedUser?.email}</small></button></td><td data-label="Reason" className="admin-community__wrap">{warning.reason}</td><td data-label="Trigger">{warning.source ? <><strong>{labelFor(warning.source.type)}</strong><small>{warning.source.song?.title || 'Linked moderation item'}</small></> : 'General account warning'}</td><td data-label="Issued by">{warning.issuer?.name || 'Administrator'}</td><td data-label="Status"><StatusBadge status={warning.status}>{labelFor(warning.status)}</StatusBadge></td><td data-label="Date"><time dateTime={warning.createdAt}>{relativeTime(warning.createdAt)}</time></td><td data-label="Action"><div className="admin-table__actions">{warning.status === 'ACTIVE' ? <button className="admin-button admin-button--ghost" onClick={() => setModal({ entity: 'resolve', resolutionNote: '', warning })} type="button">Resolve</button> : null}<button className={`admin-button ${warning.warnedUser?.accountStatus === 'ACTIVE' ? 'admin-button--danger' : 'admin-button--ghost'}`} onClick={() => setModal({ entity: 'account', reason: '', user: { ...warning.warnedUser, id: warning.userId } })} type="button">{warning.warnedUser?.accountStatus === 'SUSPENDED' ? 'Restore member' : 'Suspend member'}</button></div></td>
            </tr>)}
          </DataTable> : <EmptyState description="Warnings issued through safety review will appear here and remain after resolution." icon={MessageSquareWarning} title="No warnings found" />}
        </Panel><SafetyActionHistory actions={actions} /></>}
      </>}
    </AdminTabPanel>
    <DetailDrawer onClose={() => setSelected(null)} open={Boolean(selected)} title={tab === 'users' ? 'User safety review' : 'Warning record'}>
      {selected ? <>{tab === 'users' ? <>
        <section className="admin-detail-drawer__section"><h3>User</h3><p><strong>{selected.name}</strong><br />{selected.email}<br />{labelFor(selected.role)}</p><div className="admin-access-pair"><span><small>Member account</small><StatusBadge status={selected.accountStatus}>{labelFor(selected.accountStatus)}</StatusBadge></span>{selected.role === 'CREATOR' ? <span><small>Creator access</small><StatusBadge status={selected.creatorAccessStatus}>{labelFor(selected.creatorAccessStatus)}</StatusBadge></span> : null}</div>{selected.accountSuspensionReason ? <p><strong>Member suspension reason:</strong><br />{selected.accountSuspensionReason}</p> : null}{selected.creatorSuspensionReason ? <p><strong>Creator access reason:</strong><br />{selected.creatorSuspensionReason}</p> : null}</section>
        <section className="admin-detail-drawer__section"><h3>Safety history</h3><p>{selected.flaggedContentCount || 0} open flagged reflections<br />{selected.warningCount || 0} warnings ({selected.activeWarningCount || 0} active)</p>{selected.latestSafetyEvent ? <p><strong>Latest:</strong> {labelFor(selected.latestSafetyEvent.type)}<br />{formatDate(selected.latestSafetyEvent.createdAt)}</p> : null}</section>
        <section className="admin-detail-drawer__section"><h3>Related review surfaces</h3><div className="admin-creator-links"><Link className="admin-button admin-button--ghost" to={selected.role === 'CREATOR' ? `/creators/${encodeURIComponent(selected.id)}` : `/users/${encodeURIComponent(selected.id)}`}><ExternalLink />Public profile</Link>{selected.role === 'CREATOR' ? <Link className="admin-button admin-button--ghost" to={`/admin/creators?tab=approved&search=${encodeURIComponent(selected.email)}`}><ShieldAlert />Creator access management</Link> : null}</div></section>
        <section className="admin-detail-drawer__section"><h3>Proportionate account actions</h3><div className="admin-form__actions"><button className="admin-button admin-button--ghost" onClick={() => setModal({ entity: 'warning', reason: '', user: selected })} type="button"><ShieldAlert />Issue warning</button><button className={`admin-button ${selected.accountStatus === 'ACTIVE' ? 'admin-button--danger' : 'admin-button--primary'}`} onClick={() => setModal({ entity: 'account', reason: '', user: selected })} type="button">{selected.accountStatus === 'ACTIVE' ? <><UserRoundX />Suspend member</> : <><UserRoundCheck />Restore member</>}</button></div></section>
      </> : <><section className="admin-detail-drawer__section"><h3>Warning</h3><p>{selected.reason}</p><StatusBadge status={selected.status}>{labelFor(selected.status)}</StatusBadge></section><section className="admin-detail-drawer__section"><h3>Trigger</h3><p>{selected.source ? `${labelFor(selected.source.type)} · ${selected.source.song?.title || 'Linked moderation item'}` : 'General account warning; no content trigger was linked.'}</p></section><section className="admin-detail-drawer__section"><h3>Record</h3><p>Issued by {selected.issuer?.name || 'Administrator'}<br />{formatDate(selected.createdAt)}</p>{selected.resolutionNote ? <p><strong>Resolution:</strong> {selected.resolutionNote}<br />{selected.resolver?.name ? `Resolved by ${selected.resolver.name}` : ''}</p> : null}</section></>}<ContextAuditHistory entityId={selected.id} token={token} /></> : null}
    </DetailDrawer>
    {modal?.entity === 'warning' ? <ConfirmationModal busy={busy} confirmLabel="Record warning" danger onCancel={() => setModal(null)} onConfirm={submitWarning} title={`Warn ${modal.user.name}?`}><form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>This creates an authoritative in-product warning record. It does not claim an email or push notification was sent.</p><label>Specific reason (required)<textarea maxLength="2000" minLength="5" onChange={(event) => setModal((value) => ({ ...value, reason: event.target.value }))} required value={modal.reason} /></label></form></ConfirmationModal> : null}
    {modal?.entity === 'account' ? <AccountModal busy={busy} onCancel={() => setModal(null)} onConfirm={submitAccountChange} onReason={(reason) => setModal((value) => ({ ...value, reason }))} reason={modal.reason} user={modal.user} /> : null}
    {modal?.entity === 'resolve' ? <ConfirmationModal busy={busy} confirmLabel="Resolve warning" onCancel={() => setModal(null)} onConfirm={submitResolve} title="Resolve this warning?"><form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>The warning remains in history with this resolution record.</p><label>Resolution note (required)<textarea maxLength="2000" minLength="5" onChange={(event) => setModal((value) => ({ ...value, resolutionNote: event.target.value }))} required value={modal.resolutionNote} /></label></form></ConfirmationModal> : null}
  </div></div>
}
