import { AlertTriangle, FileClock, Flag, Music2, UserCheck, UserRoundX, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, Feedback, LoadingRows, Panel } from '../components/admin/AdminUI'
import { useAuth } from '../context/AuthContext'
import { getAdminAnalytics, getAuditLogs } from '../services/adminService'
import { labelFor, relativeTime } from './adminUtils'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function isPriorityLog(log) {
  const action = String(log.action || '').toUpperCase()
  if (/CREATOR_APPLICATION_(APPROVED|REJECTED)/.test(action)) return true
  if (/(CREATOR|USER|ACCOUNT)_(SUSPENDED|ACTIVE|RESTORED|WARNED|WARNING_RESOLVED)/.test(action)) return true
  if (/(FOLDER|SONG_FOLDER_PROPOSAL)_(APPROVED|REJECTED)/.test(action)) return true
  if (/REFLECTION_(REJECTED|APPROVED|PENDING)/.test(action)) return log.actor?.role === 'ADMIN'
  if (action === 'REFLECTION_MODERATED') return log.actor?.role === 'ADMIN'
  return false
}

export default function AdminOverview() {
  const { token } = useAuth()
  const [state, setState] = useState({ analytics: null, logs: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getAdminAnalytics(token), getAuditLogs(token, { limit: 50 })])
      .then(([analytics, logs]) => { if (active) setState({ analytics, logs: (logs.auditLogs || []).filter(isPriorityLog).slice(0, 8) }) })
      .catch((nextError) => { if (active) setError(nextError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const analytics = state.analytics
  const metrics = analytics ? [
    { icon: Users, label: 'Registered users', value: analytics.users.registered, note: `${analytics.users.total} total accounts` },
    { icon: UserCheck, label: 'Approved creators', value: analytics.users.creators, note: 'Creator Studio access' },
    { icon: Music2, label: 'Published songs', value: analytics.songs.published, note: 'Available to the public' },
    { icon: Music2, label: 'Total songs', value: analytics.songs.total, note: 'Across every workflow stage' },
  ] : []
  const attention = analytics ? [
    { count: analytics.pending?.creatorApplications || 0, icon: FileClock, label: 'Creator applications', note: 'Applications awaiting a decision', to: '/admin/creators?tab=applications' },
    { count: analytics.pending?.flaggedReflections || 0, icon: Flag, label: 'Escalated reports', note: 'Flagged content requiring platform review', to: '/admin/community?tab=reports' },
    { count: analytics.pending?.unresolvedWarnings || 0, icon: AlertTriangle, label: 'Unresolved warnings', note: 'Open safety actions to follow up', to: '/admin/community?tab=warnings' },
    { count: analytics.pending?.suspendedAccounts || 0, icon: UserRoundX, label: 'Suspended accounts', note: 'Accounts currently restricted', to: '/admin/community?tab=users' },
  ] : []
  const activitySeries = analytics?.activitySeries || []
  const activityMax = Math.max(1, ...activitySeries.flatMap((item) => [item.views, item.playbacks]))
  const hasChartData = activitySeries.some((item) => item.views || item.playbacks)

  return <div className="admin-page"><div className="admin-page__inner">
    <header className="admin-welcome"><h1>{greeting()}</h1><p>Here is what needs attention across Shades of SG today.</p></header>
    <Feedback message={error} type="error" />
    {loading ? <LoadingRows count={4} /> : <>
      <Panel title="Needs attention" subtitle="Platform-level work requiring an administrator">
        <div className="admin-attention-list">{attention.map(({ count, icon: Icon, label, note, to }) => <article className="admin-attention-item" key={label}><Icon /><div><strong>{count} {label.toLowerCase()}</strong><p>{note}</p></div><Link className="admin-button admin-button--ghost" to={to}>Review</Link></article>)}</div>
      </Panel>
      <div className="admin-metrics">{metrics.map(({ icon: Icon, label, note, value }) => <article className="admin-metric" key={label}><span className="admin-metric__icon"><Icon /></span><div><p>{label}</p><strong>{value}</strong></div><small>{note}</small></article>)}</div>
      <div className="admin-overview-grid">
        <Panel title="Listening activity" subtitle="Song views and playback starts · last 7 days">
          {hasChartData ? <div className="admin-time-chart"><div className="admin-chart-legend"><span>Song views</span><span>Playback starts</span></div><div className="admin-chart-plot">{activitySeries.map((day) => <div className="admin-chart-day" key={day.date} title={`${day.label}: ${day.views} views, ${day.playbacks} playback starts`}><div className="admin-chart-bars"><i style={{ height: `${Math.max(2, (day.views / activityMax) * 100)}%` }} /><i style={{ height: `${Math.max(2, (day.playbacks / activityMax) * 100)}%` }} /></div><span>{day.label}</span></div>)}</div></div> : <EmptyState description="Views and playback starts will appear once listeners interact with songs." title="Not enough activity yet" />}
        </Panel>
        <Panel title="Recent administrative activity">
          {state.logs.length ? <div className="admin-activity-list">{state.logs.map((log) => <article className="admin-activity-item" key={log.id}><span /><div><strong>{labelFor(log.action)}</strong><p>{log.actor?.name || 'System'} · {log.song?.title || log.creator?.name || labelFor(log.entityType || 'platform')}</p></div><time dateTime={log.createdAt}>{relativeTime(log.createdAt)}</time></article>)}</div> : <EmptyState description="Sensitive administrative actions will appear here." title="No recent administrative activity" />}
        </Panel>
      </div>
    </>}
  </div></div>
}
