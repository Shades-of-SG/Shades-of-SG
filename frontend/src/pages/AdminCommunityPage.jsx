import { AlertTriangle, Flag, MessageSquareWarning, ShieldAlert, UserRoundCheck, UserRoundX } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AdminPageHeader, AdminTabs, ConfirmationModal, DataTable, DetailDrawer, EmptyState,
  Feedback, FilterBar, LoadingRows, Pagination, Panel, StatusBadge,
} from '../components/admin/AdminUI'
import ContextAuditHistory from '../components/admin/ContextAuditHistory'
import { useAuth } from '../context/AuthContext'
import { getAdminUsers, getModerationActions, getWarnings, issueWarning, resolveWarning, updateUserStatus } from '../services/adminService'
import { deleteReflection, getModerationReflections, moderateReflection, warnReflectionAuthor } from '../services/reflectionService'
import { formatDate, labelFor, relativeTime, useTab } from './adminUtils'

const reportTypeLabels = {
  ADMIN_FLAG: 'Administrator flag',
  AUTOMATED_FLAG: 'Automated flag',
  CREATOR_ESCALATION: 'Creator escalation',
  MODERATION_APPEAL: 'Moderation appeal',
  USER_REPORT: 'User report',
}

function reportType(report) {
  if (report.reportType && reportTypeLabels[report.reportType]) return report.reportType
  if (!report.moderator) return 'AUTOMATED_FLAG'
  return report.moderator.role === 'CREATOR' ? 'CREATOR_ESCALATION' : 'ADMIN_FLAG'
}

function EscalatedReports({ onFeedback, token }) {
  const [reports, setReports] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [filters, setFilters] = useState({ dateFrom: '', search: '' })
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [history, setHistory] = useState([])
  const [notes, setNotes] = useState({})
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const selected = useMemo(() => reports.find((item) => item.id === selectedId) || reports[0] || null, [reports, selectedId])
  const note = selected ? (notes[selected.id] ?? selected.moderatorNote ?? '') : ''

  const refresh = useCallback(async (page = pagination.page) => {
    setLoading(true)
    try {
      // FLAGGED is the platform-safety queue. PENDING remains exclusively in creator moderation.
      const data = await getModerationReflections({
        dateFrom: filters.dateFrom,
        limit: 12,
        page,
        search: filters.search,
        status: 'FLAGGED',
      }, token)
      const next = data.reflections || []
      setReports(next)
      setPagination(data.pagination || { page: 1, total: next.length, totalPages: 1 })
      setSelectedId((current) => next.some((item) => item.id === current) ? current : (next[0]?.id || ''))
    } catch (error) {
      onFeedback({ message: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [filters.dateFrom, filters.search, onFeedback, pagination.page, token])

  useEffect(() => {
    const timer = window.setTimeout(() => refresh(1), filters.search ? 220 : 0)
    return () => window.clearTimeout(timer)
  }, [filters.dateFrom, filters.search, refresh])

  useEffect(() => {
    if (!selected?.userId) return undefined
    let active = true
    getWarnings(token, { limit: 20, userId: selected.userId })
      .then((data) => { if (active) setHistory(data.warnings || []) })
      .catch(() => { if (active) setHistory([]) })
    return () => { active = false }
  }, [selected?.userId, token])

  async function updateStatus(status, successMessage) {
    if (!selected) return
    setBusy(true)
    try {
      await moderateReflection(selected.id, { moderatorNote: note, status }, token)
      onFeedback({ message: successMessage, type: 'status' })
      setModal(null)
      await refresh(pagination.page)
    } catch (error) {
      onFeedback({ message: error.message, type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function saveNote() {
    if (!selected) return
    setBusy(true)
    try {
      const updated = await moderateReflection(selected.id, { moderatorNote: note, status: 'FLAGGED' }, token)
      setReports((items) => items.map((item) => item.id === updated.id ? updated : item))
      setNotes((items) => ({ ...items, [updated.id]: updated.moderatorNote || '' }))
      onFeedback({ message: 'Internal note saved.', type: 'status' })
    } catch (error) {
      onFeedback({ message: error.message, type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function removeContent() {
    setBusy(true)
    try {
      await deleteReflection(selected.id, token)
      onFeedback({ message: 'Harmful content removed from public view.', type: 'status' })
      setModal(null)
      await refresh(pagination.page)
    } catch (error) {
      onFeedback({ message: error.message, type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function warnAccount() {
    setBusy(true)
    try {
      await warnReflectionAuthor(selected.id, modal.reason, token)
      onFeedback({ message: 'Warning issued and recorded.', type: 'status' })
      setModal(null)
      const data = await getWarnings(token, { limit: 20, userId: selected.userId })
      setHistory(data.warnings || [])
    } catch (error) {
      onFeedback({ message: error.message, type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function changeAccount() {
    const next = selected.account?.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    setBusy(true)
    try {
      await updateUserStatus(selected.userId, next, token)
      onFeedback({ message: `Account ${next === 'ACTIVE' ? 'restored' : 'suspended'}.`, type: 'status' })
      setModal(null)
      await refresh(pagination.page)
    } catch (error) {
      onFeedback({ message: error.message, type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const hasFilters = Boolean(filters.search || filters.dateFrom)

  return <>
    <FilterBar onClear={() => setFilters({ dateFrom: '', search: '' })} showClear={hasFilters}>
      <label>Search reports<input aria-label="Search safety reports" onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} placeholder="Content, contributor or song" value={filters.search} /></label>
      <label>Flagged since<input onChange={(event) => setFilters((value) => ({ ...value, dateFrom: event.target.value }))} type="date" value={filters.dateFrom} /></label>
    </FilterBar>
    {loading ? <LoadingRows /> : reports.length ? <div className="admin-report-layout">
      <Panel title="Platform moderation queue" subtitle={`${pagination.total} escalated, reported or flagged items requiring review`}>
        <div className="admin-report-list">{reports.map((report) => {
          const type = reportType(report)
          return <button className={`admin-report-row ${selected?.id === report.id ? 'is-selected' : ''}`} key={report.id} onClick={() => setSelectedId(report.id)} type="button">
            <span className="admin-report-row__top"><strong>{report.song?.title || 'Unknown song'}</strong><StatusBadge status={type}>{reportTypeLabels[type]}</StatusBadge></span>
            <p>{report.content.length > 150 ? `${report.content.slice(0, 150)}…` : report.content}</p>
            <small>{report.account?.name || report.displayName || 'Anonymous contributor'} · {relativeTime(report.moderatedAt || report.updatedAt)}</small>
          </button>
        })}</div>
        <Pagination onNext={() => refresh(pagination.page + 1)} onPrevious={() => refresh(pagination.page - 1)} page={pagination.page} totalPages={pagination.totalPages} />
      </Panel>
      <aside className="admin-report-detail">
        <header><h2>Report details</h2></header>
        {selected ? <>
          <div className="admin-report-detail__body">
            <section><h3>Case type</h3><StatusBadge status={reportType(selected)}>{reportTypeLabels[reportType(selected)]}</StatusBadge></section>
            <section><h3>Escalation reason</h3><p>{selected.moderatorNote || 'Flagged for platform safety review. No reason was recorded.'}</p></section>
            <section><h3>Original content</h3><p>{selected.content}</p></section>
            <section><h3>Context</h3><p><strong>Song:</strong> {selected.song?.title}<br /><strong>Creator:</strong> {selected.song?.creator?.name || 'Unknown creator'}<br /><strong>Contributor:</strong> {selected.account?.name || selected.displayName || 'Anonymous'}{selected.account?.email ? <><br />{selected.account.email}</> : null}<br /><strong>Flagged:</strong> {formatDate(selected.moderatedAt || selected.updatedAt)}</p></section>
            <section><h3>Previous warnings</h3>{selected.userId && history.length ? history.slice(0, 4).map((warning) => <p key={warning.id}>{warning.reason}<br /><small>{labelFor(warning.status)} · {formatDate(warning.createdAt, false)}</small></p>) : <p>No previous account warnings.</p>}</section>
            <section><h3>Internal note</h3><textarea aria-label="Internal moderation note" className="admin-report-note" maxLength="1000" onChange={(event) => setNotes((items) => ({ ...items, [selected.id]: event.target.value }))} value={note} /><button className="admin-button admin-button--ghost" disabled={busy} onClick={saveNote} type="button">Save note</button></section>
            <ContextAuditHistory entityId={selected.id} token={token} />
          </div>
          <div className="admin-report-detail__actions"><button className="admin-button admin-button--primary" disabled={busy} onClick={() => setModal({ entity: 'dismiss' })} type="button">Dismiss report</button><button className="admin-button admin-button--ghost" disabled={busy} onClick={() => setModal({ entity: 'return' })} type="button">Return to creator</button>{selected.userId ? <button className="admin-button admin-button--ghost" disabled={busy} onClick={() => setModal({ entity: 'warn', reason: '' })} type="button"><AlertTriangle />Warn account</button> : null}</div>
          <div className="admin-report-detail__danger"><button className="admin-button admin-button--danger" disabled={busy} onClick={() => setModal({ entity: 'remove' })} type="button">Remove content</button>{selected.userId ? <button className="admin-button admin-button--danger" disabled={busy} onClick={() => setModal({ entity: 'account' })} type="button">{selected.account?.accountStatus === 'SUSPENDED' ? 'Restore account' : 'Suspend account'}</button> : null}</div>
        </> : null}
      </aside>
    </div> : <EmptyState description={hasFilters ? 'Try clearing the report filters.' : 'Creator escalations, user reports, automatic safety flags and moderation appeals will appear here.'} icon={Flag} title="No platform reports" />}
    {modal?.entity === 'dismiss' ? <ConfirmationModal busy={busy} confirmLabel="Dismiss report" onCancel={() => setModal(null)} onConfirm={() => updateStatus('APPROVED', 'Report dismissed and content restored.')} title="Dismiss this report?"><p>The case will close and the reflection will return to its approved state.</p></ConfirmationModal> : null}
    {modal?.entity === 'return' ? <ConfirmationModal busy={busy} confirmLabel="Return to creator" onCancel={() => setModal(null)} onConfirm={() => updateStatus('PENDING', 'Report returned to the song creator.')} title="Return this report to the creator?"><p>The reflection will move to the creator’s normal moderation queue for a new decision.</p></ConfirmationModal> : null}
    {modal?.entity === 'remove' ? <ConfirmationModal busy={busy} confirmLabel="Remove content" danger onCancel={() => setModal(null)} onConfirm={removeContent} title="Remove this content?"><p>The reflection will be rejected and removed from public view. This action is recorded.</p></ConfirmationModal> : null}
    {modal?.entity === 'warn' ? <ConfirmationModal busy={busy} confirmLabel="Issue warning" danger onCancel={() => setModal(null)} onConfirm={warnAccount} title="Warn this account?"><form className="admin-form"><label>Reason<textarea minLength="5" onChange={(event) => setModal((value) => ({ ...value, reason: event.target.value }))} required value={modal.reason} /></label></form></ConfirmationModal> : null}
    {modal?.entity === 'account' ? <ConfirmationModal busy={busy} confirmLabel={selected.account?.accountStatus === 'SUSPENDED' ? 'Restore account' : 'Suspend account'} danger={selected.account?.accountStatus !== 'SUSPENDED'} onCancel={() => setModal(null)} onConfirm={changeAccount} title={selected.account?.accountStatus === 'SUSPENDED' ? 'Restore this account?' : 'Suspend this account?'}><p>This platform-level account action will be recorded in the audit log.</p></ConfirmationModal> : null}
  </>
}

function AccountActionHistory({ actions }) {
  return <Panel title="Account action history" subtitle="Administrative suspensions and restorations remain visible and auditable.">
    {actions.length ? <DataTable caption="Account action history" columns={['User', 'Action', 'Administrator', 'Reason', 'Date']}>
      {actions.map((action) => <tr key={action.id}>
        <td data-label="User"><strong>{action.targetUser?.name || action.targetUserId || 'Unknown user'}</strong><small>{action.targetUser?.email}</small></td>
        <td data-label="Action"><StatusBadge status={action.actionType}>{action.actionType === 'USER_ACTIVE' ? 'Account restored' : 'Account suspended'}</StatusBadge></td>
        <td data-label="Administrator">{action.actor?.name || 'Administrator'}</td>
        <td data-label="Reason">{action.reason || 'No reason recorded'}</td>
        <td data-label="Date">{formatDate(action.createdAt)}</td>
      </tr>)}
    </DataTable> : <EmptyState description="Suspension and restoration actions will appear here." title="No account actions found" />}
  </Panel>
}

export default function AdminCommunityPage() {
  const { token } = useAuth()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useTab(params, setParams, ['reports', 'users', 'warnings'], 'reports')
  const [users, setUsers] = useState([])
  const [warnings, setWarnings] = useState([])
  const [actions, setActions] = useState([])
  const [filters, setFilters] = useState({ accountStatus: '', role: '', search: '', status: '' })
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
          getWarnings(token, { limit: 100, search: filters.search, status: filters.status }),
          getModerationActions(token, { limit: 100, scope: 'account' }),
        ])
        setWarnings(warningData.warnings || [])
        setActions(actionData.actions || [])
      }
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [filters.accountStatus, filters.role, filters.search, filters.status, tab, token])

  useEffect(() => {
    const timer = window.setTimeout(refresh, filters.search ? 220 : 0)
    return () => window.clearTimeout(timer)
  }, [filters.search, refresh])

  async function submitAccountChange() {
    const next = modal.user.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    setBusy(true)
    try {
      await updateUserStatus(modal.user.id, next, token)
      setFeedback({ message: `Account ${next === 'ACTIVE' ? 'restored' : 'suspended'}.`, type: 'status' })
      setModal(null); setSelected(null); await refresh()
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function submitWarning() {
    if (!modal.reason.trim()) return
    setBusy(true)
    try {
      await issueWarning({ reason: modal.reason, userId: modal.user.id }, token)
      setFeedback({ message: 'Warning issued and recorded.', type: 'status' })
      setModal(null); setSelected(null); await refresh()
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function submitResolve() {
    setBusy(true)
    try {
      await resolveWarning(modal.warning.id, modal.resolutionNote, token)
      setFeedback({ message: 'Warning resolved.', type: 'status' })
      setModal(null); setSelected(null); await refresh()
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return <div className="admin-page"><div className="admin-page__inner">
    <AdminPageHeader description="Review escalated and reported safety cases, repeat offenders, appeals, warnings and account actions." title="Safety & Reports" />
    <AdminTabs active={tab} items={[{ id: 'reports', label: 'Reports' }, { id: 'users', label: 'Users', count: users.length }, { id: 'warnings', label: 'Warnings & Actions', count: warnings.filter((warning) => warning.status === 'ACTIVE').length }]} onChange={(next) => { setFilters({ accountStatus: '', role: '', search: '', status: '' }); setSelected(null); setTab(next) }} />
    <Feedback {...feedback} />
    {tab === 'reports' ? <EscalatedReports onFeedback={setFeedback} token={token} /> : <>
      <FilterBar onClear={() => setFilters({ accountStatus: '', role: '', search: '', status: '' })} showClear={hasFilters}>
        <label>Search<input aria-label={tab === 'users' ? 'Search safety users' : 'Search warning history'} onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} placeholder={tab === 'users' ? 'Name or email' : 'Warning reason'} value={filters.search} /></label>
        {tab === 'users' ? <>
          <label>Role<select onChange={(event) => setFilters((value) => ({ ...value, role: event.target.value }))} value={filters.role}><option value="">All roles</option><option value="REGISTERED">Registered</option><option value="CREATOR">Creator</option></select></label>
          <label>Account<select onChange={(event) => setFilters((value) => ({ ...value, accountStatus: event.target.value }))} value={filters.accountStatus}><option value="">All accounts</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select></label>
        </> : <label>Status<select onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))} value={filters.status}><option value="">All warnings</option><option value="ACTIVE">Active</option><option value="RESOLVED">Resolved</option></select></label>}
      </FilterBar>
      {loading ? <LoadingRows /> : tab === 'users' ? <Panel title="Reported users and repeat offenders" subtitle="Only accounts connected to reports, flags, warnings or account actions are shown.">
        {users.length ? <DataTable caption="Safety-related users" columns={['User', 'Role', 'Flagged content', 'Warnings', 'Account', 'Last updated', 'Action']}>
          {users.map((user) => <tr className={selected?.id === user.id ? 'is-selected' : ''} key={user.id}>
            <td data-label="User"><button className="admin-row-button" onClick={() => setSelected(user)} type="button"><strong>{user.name}</strong><small>{user.email}</small></button></td>
            <td data-label="Role">{labelFor(user.role)}</td>
            <td data-label="Flagged content">{user.flaggedContentCount || 0}</td>
            <td data-label="Warnings">{user.activeWarningCount ? <StatusBadge status="FLAGGED">{user.activeWarningCount} active / {user.warningCount} total</StatusBadge> : `${user.warningCount || 0} total`}</td>
            <td data-label="Account"><StatusBadge status={user.accountStatus} /></td>
            <td data-label="Last updated">{formatDate(user.updatedAt, false)}</td>
            <td data-label="Action"><button className="admin-button admin-button--ghost" onClick={() => setSelected(user)} type="button">View</button></td>
          </tr>)}
        </DataTable> : <EmptyState description={hasFilters ? 'Try changing or clearing the filters.' : 'Accounts will appear after a report, flag, warning or platform account action.'} title="No safety-related users" />}
      </Panel> : <>
        <Panel title="Warning history" subtitle="Every warning and resolution remains auditable.">
          {warnings.length ? <DataTable caption="Warning history" columns={['User', 'Reason', 'Issued by', 'Status', 'Date', 'Action']}>
            {warnings.map((warning) => <tr className={selected?.id === warning.id ? 'is-selected' : ''} key={warning.id}>
              <td data-label="User"><button className="admin-row-button" onClick={() => setSelected(warning)} type="button"><strong>{warning.warnedUser?.name || warning.userId}</strong><small>{warning.warnedUser?.email}</small></button></td>
              <td data-label="Reason">{warning.reason}</td><td data-label="Issued by">{warning.issuer?.name || 'Administrator'}</td><td data-label="Status"><StatusBadge status={warning.status} /></td><td data-label="Date">{relativeTime(warning.createdAt)}</td>
              <td data-label="Action"><div className="admin-table__actions">{warning.status === 'ACTIVE' ? <button className="admin-button admin-button--ghost" onClick={() => setModal({ entity: 'resolve', resolutionNote: '', warning })} type="button">Resolve</button> : null}<button className={`admin-button ${warning.warnedUser?.accountStatus === 'ACTIVE' ? 'admin-button--danger' : 'admin-button--ghost'}`} onClick={() => setModal({ entity: 'account', user: { ...warning.warnedUser, id: warning.userId } })} type="button">{warning.warnedUser?.accountStatus === 'SUSPENDED' ? 'Restore' : 'Suspend'}</button></div></td>
            </tr>)}
          </DataTable> : <EmptyState description="Warnings issued through platform safety review will appear here." icon={MessageSquareWarning} title="No warnings found" />}
        </Panel>
        <AccountActionHistory actions={actions} />
      </>}
    </>}
    <DetailDrawer onClose={() => setSelected(null)} open={Boolean(selected)} title={tab === 'users' ? 'User safety details' : 'Warning details'}>
      {selected ? <>{tab === 'users' ? <>
        <section className="admin-detail-drawer__section"><h3>User</h3><p><strong>{selected.name}</strong><br />{selected.email}</p><StatusBadge status={selected.accountStatus} /></section>
        <section className="admin-detail-drawer__section"><h3>Safety history</h3><p>{selected.flaggedContentCount || 0} flagged content items<br />{selected.warningCount || 0} warnings ({selected.activeWarningCount || 0} active)<br />Last updated {formatDate(selected.updatedAt, false)}</p></section>
        <section className="admin-detail-drawer__section"><h3>Actions</h3><div className="admin-form__actions"><button className="admin-button admin-button--ghost" onClick={() => setModal({ entity: 'warning', reason: '', user: selected })} type="button"><ShieldAlert />Issue warning</button><button className={`admin-button ${selected.accountStatus === 'ACTIVE' ? 'admin-button--danger' : 'admin-button--primary'}`} onClick={() => setModal({ entity: 'account', user: selected })} type="button">{selected.accountStatus === 'ACTIVE' ? <><UserRoundX />Suspend</> : <><UserRoundCheck />Restore</>}</button></div></section>
      </> : <>
        <section className="admin-detail-drawer__section"><h3>Warning</h3><p>{selected.reason}</p><StatusBadge status={selected.status} /></section>
        <section className="admin-detail-drawer__section"><h3>Record</h3><p>Issued by {selected.issuer?.name || 'Administrator'}<br />{formatDate(selected.createdAt)}</p>{selected.resolutionNote ? <p><strong>Resolution:</strong> {selected.resolutionNote}</p> : null}</section>
      </>}<ContextAuditHistory entityId={selected.id} token={token} /></> : null}
    </DetailDrawer>
    {modal?.entity === 'warning' ? <ConfirmationModal busy={busy} confirmLabel="Issue warning" danger onCancel={() => setModal(null)} onConfirm={submitWarning} title={`Warn ${modal.user.name}?`}><form className="admin-form"><label>Reason<textarea minLength="5" onChange={(event) => setModal((value) => ({ ...value, reason: event.target.value }))} required value={modal.reason} /></label></form></ConfirmationModal> : null}
    {modal?.entity === 'account' ? <ConfirmationModal busy={busy} confirmLabel={modal.user.accountStatus === 'SUSPENDED' ? 'Restore account' : 'Suspend account'} danger={modal.user.accountStatus !== 'SUSPENDED'} onCancel={() => setModal(null)} onConfirm={submitAccountChange} title={modal.user.accountStatus === 'SUSPENDED' ? 'Restore this account?' : 'Suspend this account?'}><p>This account-level action will be recorded.</p></ConfirmationModal> : null}
    {modal?.entity === 'resolve' ? <ConfirmationModal busy={busy} confirmLabel="Resolve warning" onCancel={() => setModal(null)} onConfirm={submitResolve} title="Resolve this warning?"><form className="admin-form"><label>Resolution note<textarea onChange={(event) => setModal((value) => ({ ...value, resolutionNote: event.target.value }))} value={modal.resolutionNote} /></label></form></ConfirmationModal> : null}
  </div></div>
}
