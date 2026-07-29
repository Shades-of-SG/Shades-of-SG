import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import {
  getAuditLogs, getModerationActions, getWarnings, issueWarning,
  resolveWarning, updateUserStatus,
} from '../services/adminService'

export default function AdminGovernance() {
  const { token } = useAuth()
  const [data, setData] = useState({ actions: [], logs: [], warnings: [] })
  const [form, setForm] = useState({ reason: '', userId: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(() => Promise.all([getWarnings(token), getModerationActions(token), getAuditLogs(token)])
    .then(([warnings, actions, logs]) => setData({ actions: actions.actions, logs: logs.auditLogs, warnings: warnings.warnings }))
    .catch((error) => setMessage(error.message)).finally(() => setLoading(false)), [token])
  useEffect(() => { refresh() }, [refresh])
  const warn = async (event) => { event.preventDefault(); try { await issueWarning(form, token); setForm({ reason: '', userId: '' }); setMessage('Warning issued.'); await refresh() } catch (error) { setMessage(error.message) } }
  const resolve = async (id) => { try { await resolveWarning(id, '', token); setMessage('Warning resolved.'); await refresh() } catch (error) { setMessage(error.message) } }
  const toggleAccount = async (warning) => {
    const next = warning.warnedUser?.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    if (!window.confirm(`${next === 'SUSPENDED' ? 'Suspend' : 'Restore'} this account?`)) return
    try { await updateUserStatus(warning.userId, next, token); setMessage(`Account ${next.toLowerCase()}.`); await refresh() } catch (error) { setMessage(error.message) }
  }
  return <div className="creator-page">
    <PageHeader eyebrow="Admin" title="Warnings and moderation history" description="Review immutable history, manage warnings, and suspend or restore abusive accounts." />
    {message ? <p role="status">{message}</p> : null}{loading ? <p role="status">Loading governance records...</p> : null}
    <SectionCard title="Issue warning"><form className="settings-form" onSubmit={warn}><label>User ID<input required value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} /></label><label>Reason<textarea minLength="5" required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label><button className="studio-button studio-button--primary" type="submit">Issue warning</button></form></SectionCard>
    <SectionCard title="Warning history">{data.warnings.length ? data.warnings.map((warning) => <article className="dashboard-job-item" key={warning.id}><strong>{warning.warnedUser?.name || warning.userId}</strong><span>{warning.status} - account {warning.warnedUser?.accountStatus}</span><p>{warning.reason}</p><div className="creator-song-actions">{warning.status === 'ACTIVE' ? <button onClick={() => resolve(warning.id)} type="button">Resolve warning</button> : null}<button onClick={() => toggleAccount(warning)} type="button">{warning.warnedUser?.accountStatus === 'SUSPENDED' ? 'Restore account' : 'Suspend account'}</button></div></article>) : <p>No warnings found.</p>}</SectionCard>
    <SectionCard title="Moderation actions">{data.actions.length ? data.actions.slice(0, 20).map((action) => <article className="dashboard-job-item" key={action.id}><strong>{action.actionType}</strong><span>{action.actor?.name || action.actorId} - {new Date(action.createdAt).toLocaleString()}</span></article>) : <p>No moderation actions found.</p>}</SectionCard>
    <SectionCard title="Audit log">{data.logs.length ? data.logs.slice(0, 20).map((log) => <article className="dashboard-job-item" key={log.id}><strong>{log.action}</strong><span>{log.entityType} - {new Date(log.createdAt).toLocaleString()}</span></article>) : <p>No audit entries found.</p>}</SectionCard>
  </div>
}
