import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { getAuditLogs, getModerationActions, getWarnings, issueWarning, resolveWarning } from '../services/adminService'

export default function AdminGovernance() {
  const { token } = useAuth()
  const [data, setData] = useState({ actions: [], logs: [], warnings: [] })
  const [form, setForm] = useState({ reason: '', userId: '' })
  const [message, setMessage] = useState('')
  const refresh = useCallback(() => Promise.all([getWarnings(token), getModerationActions(token), getAuditLogs(token)]).then(([warnings, actions, logs]) => setData({ actions: actions.actions, logs: logs.auditLogs, warnings: warnings.warnings })).catch((error) => setMessage(error.message)), [token])
  useEffect(() => { refresh() }, [refresh])
  const warn = async (event) => { event.preventDefault(); try { await issueWarning(form, token); setForm({ reason: '', userId: '' }); refresh() } catch (error) { setMessage(error.message) } }
  const resolve = async (id) => { try { await resolveWarning(id, '', token); refresh() } catch (error) { setMessage(error.message) } }
  return <div className="creator-page"><PageHeader eyebrow="Admin" title="Warnings and moderation history" description="Review immutable moderation and audit history, and manage user warnings." />{message ? <p role="status">{message}</p> : null}<SectionCard title="Issue warning"><form className="settings-form" onSubmit={warn}><label>User ID<input required value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} /></label><label>Reason<textarea minLength="5" required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label><button className="studio-button studio-button--primary" type="submit">Issue warning</button></form></SectionCard><SectionCard title="Warning history">{data.warnings.map((warning) => <article className="dashboard-job-item" key={warning.id}><strong>{warning.warnedUser?.name || warning.userId}</strong><span>{warning.status}</span><p>{warning.reason}</p>{warning.status === 'ACTIVE' ? <button className="studio-button studio-button--secondary" onClick={() => resolve(warning.id)} type="button">Resolve</button> : null}</article>)}</SectionCard><SectionCard title="Moderation actions">{data.actions.slice(0, 20).map((action) => <article className="dashboard-job-item" key={action.id}><strong>{action.actionType}</strong><span>{new Date(action.createdAt).toLocaleString()}</span></article>)}</SectionCard><SectionCard title="Audit log">{data.logs.slice(0, 20).map((log) => <article className="dashboard-job-item" key={log.id}><strong>{log.action}</strong><span>{log.entityType} · {new Date(log.createdAt).toLocaleString()}</span></article>)}</SectionCard></div>
}
