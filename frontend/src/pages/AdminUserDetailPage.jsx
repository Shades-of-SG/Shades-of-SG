import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AdminPageHeader, AdminTabPanel, AdminTabs, ConfirmationModal, DataTable, EmptyState, Feedback, LoadingRows, Panel,
  StatusBadge,
} from '../components/admin/AdminUI'
import PasswordToggle from '../components/PasswordToggle'
import { useAuth } from '../context/AuthContext'
import { getAdminUser, getAdminUserCreatorStats, sendAdminPasswordResetLink, updateAdminUserEmail } from '../services/adminService'
import { formatDate, labelFor, relativeTime } from './adminUtils'

const SONG_COUNT_CARDS = [
  ['Total songs', 'total'], ['Drafts', 'DRAFT'], ['Generating', 'GENERATING'],
  ['Ready', 'READY'], ['Published', 'PUBLISHED'], ['Archived', 'ARCHIVED'],
]

function AdminDefinitionList({ children }) {
  return <dl className="admin-detail-list admin-profile-detail-list">{children}</dl>
}

function EmailEditModal({ busy, error, onCancel, onChange, onConfirm, value }) {
  const [showPassword, setShowPassword] = useState(false)
  return <ConfirmationModal busy={busy} confirmLabel="Save email" onCancel={onCancel} onConfirm={onConfirm} title="Edit this user's email">
    <form className="admin-form" onSubmit={(event) => event.preventDefault()}>
      <p>Enter your administrator password to confirm, then the new email address. The user will need to sign in again afterward.</p>
      <label>Your administrator password (required)
        <span className="password-field" style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <input autoComplete="off" onChange={(event) => onChange({ ...value, adminPassword: event.target.value })} required type={showPassword ? 'text' : 'password'} value={value.adminPassword} />
          <PasswordToggle isVisible={showPassword} onToggle={() => setShowPassword((current) => !current)} />
        </span>
      </label>
      <label>New email address (required)<input onChange={(event) => onChange({ ...value, email: event.target.value })} required type="email" value={value.email} /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  </ConfirmationModal>
}

function ResetPasswordModal({ busy, error, onCancel, onChange, onConfirm, value }) {
  const [showPassword, setShowPassword] = useState(false)
  return <ConfirmationModal busy={busy} confirmLabel="Send reset link" onCancel={onCancel} onConfirm={onConfirm} title="Send a password-reset link?">
    <form className="admin-form" onSubmit={(event) => event.preventDefault()}>
      <p>An email with a link to choose a new password will be sent to this user. The link expires in 1 hour and cannot be reused once it succeeds.</p>
      <label>Your administrator password (required)
        <span className="password-field" style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <input autoComplete="off" onChange={(event) => onChange({ ...value, adminPassword: event.target.value })} required type={showPassword ? 'text' : 'password'} value={value.adminPassword} />
          <PasswordToggle isVisible={showPassword} onToggle={() => setShowPassword((current) => !current)} />
        </span>
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  </ConfirmationModal>
}

function UserSideData({ sections }) {
  const bookmarks = sections?.bookmarks || { rows: [], total: 0 }
  const gameScores = sections?.gameScores || { rows: [], total: 0 }
  const reflections = sections?.reflections || { rows: [], total: 0 }
  const badges = sections?.badges || { catalogTotal: 0, rows: [], total: 0 }
  const trivia = sections?.triviaAttempts || { correctCount: 0, rows: [], total: 0 }
  const instrumentProgress = sections?.instrumentProgress || { rows: [], total: 0 }

  return <div className="admin-accordion-list">
    <details className="admin-accordion" open>
      <summary><span>{`Bookmarked songs: ${bookmarks.total}`}</span></summary>
      {bookmarks.rows.length ? <DataTable caption="Bookmarked songs" columns={['Song', 'Artist', 'Status', 'Bookmarked on']}>
        {bookmarks.rows.map((row) => <tr key={row.songId}>
          <td data-label="Song">{row.song?.title || 'Unknown song'}</td>
          <td data-label="Artist">{row.song?.artist || '—'}</td>
          <td data-label="Status">{row.song ? <StatusBadge status={row.song.status}>{labelFor(row.song.status)}</StatusBadge> : '—'}</td>
          <td data-label="Bookmarked on">{formatDate(row.createdAt, false)}</td>
        </tr>)}
      </DataTable> : <EmptyState title="No bookmarks yet" description="Songs this user bookmarks will show up here." />}
    </details>
    <details className="admin-accordion">
      <summary><span>{`Rhythm game attempts: ${gameScores.total}`}</span></summary>
      {gameScores.rows.length ? <DataTable caption="Rhythm game attempts" columns={['Song', 'Score', 'Accuracy', 'Difficulty', 'Played']}>
        {gameScores.rows.map((row) => <tr key={row.id}>
          <td data-label="Song">{row.song?.title || 'Unknown song'}</td>
          <td data-label="Score">{row.score}</td>
          <td data-label="Accuracy">{row.accuracy != null ? `${Math.round(row.accuracy)}%` : '—'}</td>
          <td data-label="Difficulty">{labelFor(row.difficulty)}</td>
          <td data-label="Played">{relativeTime(row.createdAt)}</td>
        </tr>)}
      </DataTable> : <EmptyState title="No rhythm game attempts recorded" />}
    </details>
    <details className="admin-accordion">
      <summary><span>{`Reflections: ${reflections.total}`}</span></summary>
      {reflections.rows.length ? <DataTable caption="Reflections" columns={['Song', 'Excerpt', 'Status', 'Submitted']}>
        {reflections.rows.map((row) => <tr key={row.id}>
          <td data-label="Song">{row.song?.title || 'Unknown song'}</td>
          <td className="admin-community__wrap" data-label="Excerpt">{row.content}</td>
          <td data-label="Status"><StatusBadge status={row.status}>{labelFor(row.status)}</StatusBadge></td>
          <td data-label="Submitted">{relativeTime(row.createdAt)}</td>
        </tr>)}
      </DataTable> : <EmptyState title="No reflections yet" />}
    </details>
    <details className="admin-accordion">
      <summary><span>{`Badges obtained: ${badges.total}/${badges.catalogTotal}`}</span></summary>
      {badges.rows.length ? <ul className="admin-simple-list">{badges.rows.map((badge) => <li key={badge.id}><strong>{badge.name}</strong><span>{formatDate(badge.earnedAt, false)}</span></li>)}</ul> : <EmptyState title="No badges yet" />}
    </details>
    <details className="admin-accordion">
      <summary><span>{`Trivia attempts: ${trivia.total}${trivia.total ? ` (${trivia.correctCount} correct)` : ''}`}</span></summary>
      {trivia.rows.length ? <DataTable caption="Trivia attempts" columns={['Question', 'Answer', 'Correct?', 'Attempted']}>
        {trivia.rows.map((row) => <tr key={row.id}>
          <td data-label="Question" className="admin-community__wrap">{row.question?.prompt || 'Unknown question'}</td>
          <td data-label="Answer">{row.selectedAnswer}</td>
          <td data-label="Correct?">{row.isCorrect ? 'Yes' : 'No'}</td>
          <td data-label="Attempted">{relativeTime(row.createdAt)}</td>
        </tr>)}
      </DataTable> : <EmptyState title="No trivia attempts yet" />}
    </details>
    <details className="admin-accordion">
      <summary><span>{`Instrument challenge progress: ${instrumentProgress.total}`}</span></summary>
      {instrumentProgress.rows.length ? <ul className="admin-simple-list">{instrumentProgress.rows.map((row) => <li key={row.id}><strong>{labelFor(row.challengeId)}</strong><span>{formatDate(row.completedAt, false)}</span></li>)}</ul> : <EmptyState title="No instrument challenges completed yet" />}
    </details>
  </div>
}

function CreatorSideData({ error, loading, stats }) {
  if (loading) return <LoadingRows />
  if (error) return <EmptyState description={error} title="Unable to load creator statistics" />
  if (!stats) return null
  const { applications = [], songs = [], summary } = stats
  return <div className="admin-creator-side-data">
    <div className="admin-stat-grid">
      {SONG_COUNT_CARDS.map(([label, key]) => <div className="admin-stat-card" key={key}><strong>{summary.songs[key] || 0}</strong><span>{label}</span></div>)}
    </div>
    <div className="admin-stat-grid">
      <div className="admin-stat-card"><strong>{summary.rhythmScores || 0}</strong><span>Rhythm game scores</span></div>
      <div className="admin-stat-card"><strong>{summary.reflections?.APPROVED || 0}</strong><span>Approved reflections</span></div>
      <div className="admin-stat-card"><strong>{summary.generationJobs?.COMPLETED || 0}</strong><span>Completed generations</span></div>
      <div className="admin-stat-card"><strong>{summary.events?.SONG_PAGE_VIEWED || 0}</strong><span>Song page views</span></div>
    </div>
    <Panel title="Songs">
      {songs.length ? <DataTable caption="Creator songs" columns={['Title', 'Artist', 'Status', 'Published', 'Last updated']}>
        {songs.map((song) => <tr key={song.id}>
          <td data-label="Title">{song.title}</td>
          <td data-label="Artist">{song.artist || '—'}</td>
          <td data-label="Status"><StatusBadge status={song.status}>{labelFor(song.status)}</StatusBadge></td>
          <td data-label="Published">{song.publishedDate ? formatDate(song.publishedDate, false) : '—'}</td>
          <td data-label="Last updated">{relativeTime(song.updatedAt)}</td>
        </tr>)}
      </DataTable> : <EmptyState title="This creator has not created any songs yet." />}
    </Panel>
    <Panel title="Creator application history">
      {applications.length ? <ul className="admin-simple-list">{applications.map((application) => <li key={application.id}><strong>{labelFor(application.status)}</strong><span>{formatDate(application.createdAt, false)}</span></li>)}</ul> : <EmptyState title="No creator application on record" />}
    </Panel>
  </div>
}

export default function AdminUserDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState({ message: '', type: 'status' })
  const [modal, setModal] = useState(null)
  const [modalError, setModalError] = useState('')
  const [busy, setBusy] = useState(false)
  const [side, setSide] = useState('user')
  const [creatorStats, setCreatorStats] = useState(null)
  const [creatorStatsLoading, setCreatorStatsLoading] = useState(false)
  const [creatorStatsError, setCreatorStatsError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const result = await getAdminUser(userId, token)
      setData(result)
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }, [userId, token])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (side !== 'creator' || data?.user?.role !== 'CREATOR' || creatorStats || creatorStatsLoading) return undefined
    const timer = window.setTimeout(() => {
      setCreatorStatsLoading(true)
      setCreatorStatsError('')
      getAdminUserCreatorStats(userId, token)
        .then((result) => setCreatorStats(result))
        .catch((error) => setCreatorStatsError(error.message))
        .finally(() => setCreatorStatsLoading(false))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [side, data, creatorStats, creatorStatsLoading, userId, token])

  async function submitEmailEdit() {
    if (!modal.adminPassword || !modal.email) { setModalError('Enter your password and the new email address.'); return }
    setBusy(true)
    setModalError('')
    try {
      await updateAdminUserEmail(userId, { adminPassword: modal.adminPassword, email: modal.email }, token)
      setFeedback({ message: 'Email updated. The user will need to sign in again.', type: 'status' })
      setModal(null)
      await load()
    } catch (error) {
      setModalError(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitPasswordReset() {
    if (!modal.adminPassword) { setModalError('Enter your administrator password.'); return }
    setBusy(true)
    setModalError('')
    try {
      const result = await sendAdminPasswordResetLink(userId, modal.adminPassword, token)
      setFeedback({ message: result?.message || 'A password-reset link has been emailed to the user.', type: 'status' })
      setModal(null)
    } catch (error) {
      setModalError(error.message)
    } finally {
      setBusy(false)
    }
  }

  const user = data?.user

  return <div className="admin-page admin-user-detail"><div className="admin-page__inner">
    <button className="admin-button admin-button--ghost" onClick={() => navigate(-1)} type="button"><ArrowLeft aria-hidden="true" />Back</button>
    <AdminPageHeader description="Everything linked to this account in one place, for progress tracking and moderation." title="User Information" />
    <Feedback {...feedback} />
    {loading ? <LoadingRows /> : loadError ? <EmptyState action={<button className="admin-button admin-button--ghost" onClick={load} type="button">Retry</button>} description={loadError} title="Unable to load this user" /> : user ? <>
      <Panel title="Profile">
        <AdminDefinitionList>
          <div><dt>Name</dt><dd>{`Name: ${user.name}`}</dd></div>
          <div><dt>Email</dt><dd>{`Email: ${user.email}`} <button className="admin-button admin-button--ghost admin-inline-action" onClick={() => { setModalError(''); setModal({ adminPassword: '', email: '', type: 'email' }) }} type="button">Edit</button></dd></div>
          <div><dt>Password</dt><dd>Password: <button className="admin-button admin-button--ghost admin-inline-action" onClick={() => { setModalError(''); setModal({ adminPassword: '', type: 'resetPassword' }) }} type="button">Reset Password</button></dd></div>
          <div><dt>Role</dt><dd>{`Role: ${labelFor(user.role)}`}</dd></div>
          <div><dt>Member account status</dt><dd>Member account status: <StatusBadge status={user.accountStatus}>{labelFor(user.accountStatus)}</StatusBadge></dd></div>
          {user.role === 'CREATOR' ? <div><dt>Creator access status</dt><dd>Creator access status: <StatusBadge status={user.creatorAccessStatus}>{labelFor(user.creatorAccessStatus)}</StatusBadge></dd></div> : null}
          {user.accountSuspensionReason ? <div><dt>Account suspension reason</dt><dd>{`Account suspension reason: ${user.accountSuspensionReason}`}</dd></div> : null}
          {user.creatorSuspensionReason ? <div><dt>Creator suspension reason</dt><dd>{`Creator suspension reason: ${user.creatorSuspensionReason}`}</dd></div> : null}
          <div><dt>Date joined</dt><dd>{`Date joined: ${formatDate(user.createdAt, false)}`}</dd></div>
          <div><dt>Last active</dt><dd>{`Last active: ${user.lastActiveDate ? formatDate(user.lastActiveDate, false) : 'No recorded activity'}`}</dd></div>
          <div><dt>Current login streak</dt><dd>{`Current login streak: ${user.currentLoginStreak || 0} day${user.currentLoginStreak === 1 ? '' : 's'}`}</dd></div>
          <div><dt>Longest login streak</dt><dd>{`Longest login streak: ${user.longestLoginStreak || 0} day${user.longestLoginStreak === 1 ? '' : 's'}`}</dd></div>
          <div><dt>Email verified</dt><dd>{`Email verified: ${user.emailVerifiedAt ? formatDate(user.emailVerifiedAt, false) : 'Not verified'}`}</dd></div>
          <div><dt>User ID</dt><dd>{`User ID: ${user.id}`}</dd></div>
        </AdminDefinitionList>
      </Panel>

      {user.role === 'CREATOR' ? <AdminTabs active={side} items={[
        { id: 'user', label: 'User-side data' },
        { id: 'creator', label: 'Creator-side data' },
      ]} onChange={setSide} /> : null}
      <AdminTabPanel key={side}>
        {user.role === 'CREATOR' && side === 'creator'
          ? <CreatorSideData error={creatorStatsError} loading={creatorStatsLoading} stats={creatorStats} />
          : <UserSideData sections={data.sections} />}
      </AdminTabPanel>
    </> : null}

    {modal?.type === 'email' ? <EmailEditModal busy={busy} error={modalError} onCancel={() => setModal(null)} onChange={setModal} onConfirm={submitEmailEdit} value={modal} /> : null}
    {modal?.type === 'resetPassword' ? <ResetPasswordModal busy={busy} error={modalError} onCancel={() => setModal(null)} onChange={setModal} onConfirm={submitPasswordReset} value={modal} /> : null}
  </div></div>
}
