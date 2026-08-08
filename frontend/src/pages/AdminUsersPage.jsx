import { AlertTriangle, ShieldAlert, UserRoundCheck, UserRoundX } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AccountModal, AdminPageHeader, ConfirmationModal, CreatorAccessModal, DataTable, EmptyState, Feedback, FilterBar,
  LoadingRows, Pagination, Panel, StatusBadge,
} from '../components/admin/AdminUI'
import PasswordToggle from '../components/PasswordToggle'
import { useAuth } from '../context/AuthContext'
import { deleteAdminUser, getAdminUsers, issueWarning, updateCreatorStatus, updateUserStatus } from '../services/adminService'
import { formatDate, labelFor, relativeTime } from './adminUtils'

const SORT_OPTIONS = [
  { label: 'Newest joined first', value: 'dateJoinedDesc' },
  { label: 'Oldest joined first', value: 'dateJoinedAsc' },
  { label: 'Name A–Z', value: 'nameAsc' },
  { label: 'Name Z–A', value: 'nameDesc' },
]

function ActionMenuModal({ onCancel, onChoose, user }) {
  return <ConfirmationModal confirmLabel="Close" onCancel={onCancel} onConfirm={onCancel} title={`Take action on ${user.name}?`}>
    <div className="admin-form admin-take-action-menu">
      <button className="admin-button admin-button--ghost" onClick={() => onChoose('warning')} type="button"><AlertTriangle aria-hidden="true" />Issue warning</button>
      <button className="admin-button admin-button--ghost" onClick={() => onChoose('account')} type="button">
        {user.accountStatus === 'ACTIVE' ? <><UserRoundX aria-hidden="true" />Suspend member access</> : <><UserRoundCheck aria-hidden="true" />Restore member access</>}
      </button>
      {user.role === 'CREATOR' ? <button className="admin-button admin-button--ghost" onClick={() => onChoose('creatorAccess')} type="button">
        {user.creatorAccessStatus === 'ACTIVE' ? <><ShieldAlert aria-hidden="true" />Suspend creator access</> : <><UserRoundCheck aria-hidden="true" />Restore creator access</>}
      </button> : null}
    </div>
  </ConfirmationModal>
}

function DeleteUserModal({ busy, error, onCancel, onChange, onConfirm, value }) {
  const [showPassword, setShowPassword] = useState(false)
  return <ConfirmationModal busy={busy} confirmLabel="Permanently delete account" danger onCancel={onCancel} onConfirm={onConfirm} title={`Permanently delete ${value.user.name}'s account?`}>
    <form className="admin-form" onSubmit={(event) => event.preventDefault()}>
      <p>This permanently erases the account: profile, badges, scores, reflections, bookmarks{value.user.role === 'CREATOR' ? ', songs and creator data' : ''}. This cannot be undone.</p>
      <label>Reason (required)<textarea maxLength="1000" minLength="5" onChange={(event) => onChange({ ...value, reason: event.target.value })} required value={value.reason} /></label>
      <label>Your administrator password (required)
        <span className="password-field" style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <input autoComplete="off" onChange={(event) => onChange({ ...value, adminPassword: event.target.value })} required type={showPassword ? 'text' : 'password'} value={value.adminPassword} />
          <PasswordToggle isVisible={showPassword} onToggle={() => setShowPassword((current) => !current)} />
        </span>
      </label>
      {value.showConfirmContentDeletion ? <label className="admin-checkbox-field">
        <input checked={value.confirmContentDeletion} onChange={(event) => onChange({ ...value, confirmContentDeletion: event.target.checked })} type="checkbox" />
        <span>{error || 'This account owns published content. Delete it anyway.'}</span>
      </label> : null}
      {error && !value.showConfirmContentDeletion ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  </ConfirmationModal>
}

export default function AdminUsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [filters, setFilters] = useState({ accountStatus: '', role: '', search: '', sort: 'dateJoinedDesc' })
  const [modal, setModal] = useState(null)
  const [feedback, setFeedback] = useState({ message: '', type: 'status' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const refresh = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const data = await getAdminUsers(token, { ...filters, limit: 25, page })
      setUsers(data.users || [])
      setPagination(data.pagination || { page: 1, total: (data.users || []).length, totalPages: 1 })
    } catch (error) {
      setFeedback({ message: `${error.message} Existing results may be out of date.`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [filters, token])

  useEffect(() => {
    const timer = window.setTimeout(() => refresh(1), filters.search ? 220 : 0)
    return () => window.clearTimeout(timer)
  }, [filters, refresh])

  const clearFilters = () => setFilters({ accountStatus: '', role: '', search: '', sort: filters.sort })
  const hasFilters = Boolean(filters.search || filters.role || filters.accountStatus)

  async function submitWarning() {
    if (modal.reason.trim().length < 5) { setFeedback({ message: 'Enter a specific warning reason.', type: 'error' }); return }
    setBusy(true)
    try {
      await issueWarning({ reason: modal.reason, userId: modal.user.id }, token)
      setFeedback({ message: 'Warning recorded in product history. No delivery notification was sent.', type: 'status' })
      setModal(null)
      await refresh(pagination.page)
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' })
    } finally { setBusy(false) }
  }

  async function submitAccountChange() {
    if (modal.reason.trim().length < 5) { setFeedback({ message: 'Enter a reason for this member-account action.', type: 'error' }); return }
    const next = modal.user.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    setBusy(true)
    try {
      await updateUserStatus(modal.user.id, next, token, modal.reason)
      setFeedback({ message: `Member account ${next === 'ACTIVE' ? 'restored' : 'suspended'}.`, type: 'status' })
      setModal(null)
      await refresh(pagination.page)
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' })
    } finally { setBusy(false) }
  }

  async function submitCreatorAccessChange() {
    if (modal.reason.trim().length < 5) { setFeedback({ message: 'Enter a reason for this creator-access action.', type: 'error' }); return }
    const next = modal.user.creatorAccessStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    setBusy(true)
    try {
      await updateCreatorStatus(modal.user.id, next, token, modal.reason)
      setFeedback({ message: `Creator access ${next === 'ACTIVE' ? 'restored' : 'suspended'}.`, type: 'status' })
      setModal(null)
      await refresh(pagination.page)
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' })
    } finally { setBusy(false) }
  }

  async function submitDelete() {
    if (modal.reason.trim().length < 5) { setDeleteError('Enter a reason of at least 5 characters.'); return }
    if (!modal.adminPassword) { setDeleteError('Enter your administrator password.'); return }
    setBusy(true)
    setDeleteError('')
    try {
      await deleteAdminUser(modal.user.id, {
        adminPassword: modal.adminPassword, confirmContentDeletion: modal.confirmContentDeletion, reason: modal.reason,
      }, token)
      setFeedback({ message: `${modal.user.name}'s account was permanently deleted.`, type: 'status' })
      setModal(null)
      await refresh(pagination.page)
    } catch (error) {
      if (error.code === 'PUBLISHED_CONTENT_PRESENT') {
        setDeleteError(error.message)
        setModal((value) => ({ ...value, showConfirmContentDeletion: true }))
      } else {
        setDeleteError(error.message)
      }
    } finally { setBusy(false) }
  }

  return <div className="admin-page admin-users"><div className="admin-page__inner">
    <AdminPageHeader description="Search every member and creator account, take moderation action, or open a full profile." title="Users" />
    <Feedback {...feedback} />
    <FilterBar onClear={clearFilters} showClear={hasFilters}>
      <label>Search<input aria-label="Search users" onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} placeholder="Name or email" value={filters.search} /></label>
      <label>Role<select onChange={(event) => setFilters((value) => ({ ...value, role: event.target.value }))} value={filters.role}>
        <option value="">All roles</option>
        <option value="REGISTERED">Registered</option>
        <option value="CREATOR">Creator</option>
      </select></label>
      <label>Member account<select onChange={(event) => setFilters((value) => ({ ...value, accountStatus: event.target.value }))} value={filters.accountStatus}>
        <option value="">All member states</option>
        <option value="ACTIVE">Active</option>
        <option value="SUSPENDED">Suspended</option>
      </select></label>
      <label>Sort<select onChange={(event) => setFilters((value) => ({ ...value, sort: event.target.value }))} value={filters.sort}>
        {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select></label>
    </FilterBar>
    <Panel subtitle={`${pagination.total} account${pagination.total === 1 ? '' : 's'} found`} title="Users">
      {loading ? <LoadingRows /> : users.length ? <>
        <DataTable caption="Users" columns={['User', 'Role', 'Member', 'Creator access', 'Date joined', 'Actions']}>
          {users.map((user) => <tr key={user.id}>
            <td data-label="User"><Link className="admin-row-button" to={`/admin/users/${encodeURIComponent(user.id)}`}><strong>{user.name}</strong><small>{user.email}</small></Link></td>
            <td data-label="Role">{labelFor(user.role)}</td>
            <td data-label="Member"><StatusBadge status={user.accountStatus}>{labelFor(user.accountStatus)}</StatusBadge></td>
            <td data-label="Creator access">{user.role === 'CREATOR' ? <StatusBadge status={user.creatorAccessStatus}>{labelFor(user.creatorAccessStatus)}</StatusBadge> : 'Not applicable'}</td>
            <td data-label="Date joined"><time dateTime={user.createdAt}>{formatDate(user.createdAt, false)}</time><small>{relativeTime(user.createdAt)}</small></td>
            <td data-label="Actions"><div className="admin-table__actions">
              <button className="admin-button admin-button--ghost" onClick={() => setModal({ type: 'actionMenu', user })} type="button">Take action</button>
              <button className="admin-button admin-button--danger" onClick={() => { setDeleteError(''); setModal({ adminPassword: '', confirmContentDeletion: false, reason: '', showConfirmContentDeletion: false, type: 'delete', user }) }} type="button">Delete account</button>
            </div></td>
          </tr>)}
        </DataTable>
        <Pagination onNext={() => refresh(pagination.page + 1)} onPrevious={() => refresh(pagination.page - 1)} page={pagination.page} totalPages={pagination.totalPages} />
      </> : <EmptyState description={hasFilters ? 'Try changing or clearing the filters.' : 'Registered members and creators will appear here.'} title="No users found" />}
    </Panel>

    {modal?.type === 'actionMenu' ? <ActionMenuModal onCancel={() => setModal(null)} onChoose={(type) => setModal({ reason: '', type, user: modal.user })} user={modal.user} /> : null}
    {modal?.type === 'warning' ? <ConfirmationModal busy={busy} confirmLabel="Record warning" danger onCancel={() => setModal(null)} onConfirm={submitWarning} title={`Warn ${modal.user.name}?`}>
      <form className="admin-form" onSubmit={(event) => event.preventDefault()}>
        <p>This creates an authoritative in-product warning record. It does not claim an email or push notification was sent.</p>
        <label>Specific reason (required)<textarea maxLength="2000" minLength="5" onChange={(event) => setModal((value) => ({ ...value, reason: event.target.value }))} required value={modal.reason} /></label>
      </form>
    </ConfirmationModal> : null}
    {modal?.type === 'account' ? <AccountModal busy={busy} onCancel={() => setModal(null)} onConfirm={submitAccountChange} onReason={(reason) => setModal((value) => ({ ...value, reason }))} reason={modal.reason} user={modal.user} /> : null}
    {modal?.type === 'creatorAccess' ? <CreatorAccessModal busy={busy} onCancel={() => setModal(null)} onConfirm={submitCreatorAccessChange} onReason={(reason) => setModal((value) => ({ ...value, reason }))} reason={modal.reason} user={modal.user} /> : null}
    {modal?.type === 'delete' ? <DeleteUserModal busy={busy} error={deleteError} onCancel={() => setModal(null)} onChange={setModal} onConfirm={submitDelete} value={modal} /> : null}
  </div></div>
}
