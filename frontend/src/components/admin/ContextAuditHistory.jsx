import { useEffect, useState } from 'react'
import { getAuditLogs } from '../../services/adminService'

const labelFor = (value = '') => String(value).replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
const formatDate = (value) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown time'

export default function ContextAuditHistory({ entityId, token }) {
  const [state, setState] = useState({ entityId: '', logs: [] })

  useEffect(() => {
    if (!entityId) return undefined
    let active = true
    getAuditLogs(token, { entityId, limit: 6 })
      .then((data) => { if (active) setState({ entityId, logs: data.auditLogs || [] }) })
      .catch(() => { if (active) setState({ entityId, logs: [] }) })
    return () => { active = false }
  }, [entityId, token])

  const loading = state.entityId !== entityId
  return <section className="admin-detail-drawer__section admin-context-history"><h3>Audit history</h3>{loading ? <p>Loading history…</p> : state.logs.length ? <ol>{state.logs.map((log) => <li key={log.id}><span /><div><strong>{labelFor(log.action)}</strong><small>{log.actor?.name || 'System'} · {formatDate(log.createdAt)}</small></div></li>)}</ol> : <p>No audit events recorded for this item.</p>}</section>
}
