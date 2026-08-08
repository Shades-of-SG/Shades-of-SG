import { AlertTriangle, CheckCircle2, ChevronRight, FileClock, Flag, Music2, ShieldCheck, UserCheck, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, Feedback, LoadingRows, Panel } from '../components/admin/AdminUI'
import ListeningActivityChart from '../components/admin/ListeningActivityChart'
import { useAuth } from '../context/AuthContext'
import useAdminSummary from '../hooks/useAdminSummary'
import { getAuditLogs } from '../services/adminService'
import { formatDate, labelFor, relativeTime } from './adminUtils'

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

function activityDestination(log) {
  const type = String(log.entityType || '').toUpperCase()
  if (type === 'CREATOR_APPLICATION') return '/admin/creators?tab=applications'
  if (type === 'CREATOR') return '/admin/creators?tab=approved'
  if (type === 'FOLDER_SONG_PROPOSAL') return '/admin/content?tab=placements'
  if (type === 'FOLDER') return '/admin/content?tab=collections'
  if (type === 'SONG') return '/admin/content?tab=songs'
  if (type === 'REFLECTION') return '/admin/community?tab=reports'
  if (type === 'USER_WARNING') return '/admin/community?tab=warnings'
  if (type === 'USER') return '/admin/community?tab=users'
  return ''
}

function chartSummary(series = []) {
  const normalized = series.map((day) => ({ ...day, playbacks: Number(day.playbacks || 0), views: Number(day.views || 0) }))
  const views = normalized.reduce((total, day) => total + day.views, 0)
  const playbacks = normalized.reduce((total, day) => total + day.playbacks, 0)
  const mostActive = normalized.reduce((current, day) => (
    day.views + day.playbacks > (current?.views || 0) + (current?.playbacks || 0) ? day : current
  ), null)
  return { hasActivity: views + playbacks > 0, mostActive, playbacks, views }
}

function chartRange(series = []) {
  if (!series.length) return 'Seven-day Singapore-time window'
  const first = new Date(`${series[0].date}T00:00:00Z`)
  const last = new Date(`${series[series.length - 1].date}T00:00:00Z`)
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) return 'Seven-day Singapore-time window'
  const start = first.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const end = last.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', timeZone: 'UTC', year: 'numeric' })
  return `${start} – ${end}`
}

export default function AdminOverview() {
  const { token } = useAuth()
  const { data: analytics, error: analyticsError, loading: analyticsLoading, refresh: refreshAnalytics } = useAdminSummary(token)
  const [logs, setLogs] = useState([])
  const [logsError, setLogsError] = useState('')
  const [logsLoading, setLogsLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    const data = await getAuditLogs(token, { limit: 50 })
    return (data.auditLogs || []).filter(isPriorityLog).slice(0, 6)
  }, [token])

  useEffect(() => {
    let active = true
    fetchLogs()
      .then((nextLogs) => { if (active) setLogs(nextLogs) })
      .catch((error) => { if (active) setLogsError(error.message) })
      .finally(() => { if (active) setLogsLoading(false) })
    return () => { active = false }
  }, [fetchLogs])

  async function retryLogs() {
    setLogsLoading(true)
    setLogsError('')
    try {
      setLogs(await fetchLogs())
    } catch (error) {
      setLogsError(error.message)
    } finally {
      setLogsLoading(false)
    }
  }

  const metrics = analytics ? [
    { icon: Users, label: 'Registered members', value: analytics.users.registered, note: `${analytics.users.total} total accounts including creators and administrators` },
    { icon: UserCheck, label: 'Approved creators', value: analytics.users.creators, note: 'Creator accounts included in the total account count' },
    { icon: Music2, label: 'Published songs', value: analytics.songs.published, note: `${analytics.songs.published} of ${analytics.songs.total} songs are publicly available` },
    { icon: Music2, label: 'Songs across all stages', value: analytics.songs.total, note: 'Includes draft, processing, ready, published and archived songs' },
  ] : []
  const attention = analytics ? [
    { action: 'Review applications', count: analytics.pending?.creatorApplications || 0, icon: FileClock, label: 'Creator applications', note: 'Applications waiting for an administrator decision', priority: 'Review queue', to: '/admin/creators?tab=applications' },
    { action: 'Review reports', count: analytics.pending?.flaggedReflections || 0, icon: Flag, label: 'Escalated reports', note: 'Flagged content waiting for platform review', priority: 'Safety priority', to: '/admin/community?tab=reports' },
    { action: 'View warnings', count: analytics.pending?.unresolvedWarnings || 0, icon: AlertTriangle, label: 'Unresolved warnings', note: 'Open safety actions requiring follow-up', priority: 'Safety follow-up', to: '/admin/community?tab=warnings' },
  ] : []
  const actionableAttention = attention.filter((item) => item.count > 0)
  const attentionTotal = actionableAttention.reduce((total, item) => total + item.count, 0)
  const suspendedAccounts = analytics?.pending?.suspendedAccounts || 0
  const listening = chartSummary(analytics?.activitySeries)
  const listeningRange = chartRange(analytics?.activitySeries)

  return <div className="admin-page"><div className="admin-page__inner admin-overview">
    <header className="admin-welcome"><h1>{greeting()}</h1><p>Review urgent work, platform health and recent administrative changes.</p></header>
    {analytics && analyticsError ? <Feedback message="Overview data could not be refreshed. Showing the most recently loaded summary." type="error" /> : null}

    <Panel className="admin-panel--attention" title="Needs attention" subtitle={attentionTotal ? `${attentionTotal} open ${attentionTotal === 1 ? 'item' : 'items'} across administrator queues` : 'Priority administrator queues'}>
      {analyticsLoading && !analytics ? <LoadingRows count={3} /> : analytics ? <>
        {actionableAttention.length ? <div className="admin-attention-list">{actionableAttention.map(({ action, count, icon: Icon, label, note, priority, to }) => <article className="admin-attention-item is-actionable" key={label}>
          <span aria-hidden="true" className="admin-attention-item__icon"><Icon /></span>
          <div><span className="admin-attention-item__priority">{priority}</span><strong>{count} {count === 1 ? label.replace(/s$/, '').toLowerCase() : label.toLowerCase()}</strong><p>{note}</p></div>
          <Link aria-label={`${action}: ${count} ${label.toLowerCase()}`} className="admin-button admin-button--ghost" to={to}>{action}<ChevronRight aria-hidden="true" /></Link>
        </article>)}</div> : <div aria-live="polite" className="admin-attention-clear" role="status"><CheckCircle2 aria-hidden="true" /><div><strong>No urgent actions</strong><p>No creator applications, escalated reports or unresolved warnings are waiting.</p></div></div>}
        <div className="admin-attention-assurance"><ShieldCheck aria-hidden="true" /><div><strong>{suspendedAccounts ? `${suspendedAccounts} suspended ${suspendedAccounts === 1 ? 'account' : 'accounts'}` : 'No suspended accounts'}</strong><p>{suspendedAccounts ? 'Restricted accounts remain blocked while administrators manage their status.' : 'No member or creator accounts are currently restricted.'}</p></div><Link className="admin-text-link" to="/admin/community?tab=users">{suspendedAccounts ? 'Manage suspended accounts' : 'View account status'}<ChevronRight aria-hidden="true" /></Link></div>
      </> : <div className="admin-overview-state is-error" role="alert"><strong>Attention queues could not be loaded.</strong><p>{analyticsError}</p><button className="admin-button admin-button--ghost" onClick={refreshAnalytics} type="button">Try again</button></div>}
    </Panel>

    <section aria-labelledby="admin-platform-snapshot" className="admin-overview-section">
      <header className="admin-overview-section__header"><div><h2 id="admin-platform-snapshot">Platform snapshot</h2><p>Authoritative account and content totals</p></div></header>
      {analyticsLoading && !analytics ? <LoadingRows count={4} /> : analytics ? <div className="admin-metrics">{metrics.map(({ icon: Icon, label, note, value }) => <article className="admin-metric" key={label}><span aria-hidden="true" className="admin-metric__icon"><Icon /></span><div><p>{label}</p><strong>{value}</strong></div><small>{note}</small></article>)}</div> : <div className="admin-overview-state"><p>Platform totals are unavailable until the overview summary is restored.</p></div>}
    </section>

    <div className="admin-overview-grid">
      <Panel className="admin-panel--chart" title="Listening activity" subtitle={`Song views and playback starts · ${listeningRange}`}>
        {analytics && listening.hasActivity ? <div aria-label="Listening summary for the displayed period" className="admin-chart-summary" role="list"><div role="listitem"><span>Song views</span><strong>{listening.views}</strong></div><div role="listitem"><span>Playback starts</span><strong>{listening.playbacks}</strong></div><div role="listitem"><span>Most active day</span><strong>{listening.mostActive?.label || '—'}</strong></div></div> : null}
        <ListeningActivityChart error={analytics ? '' : analyticsError} loading={analyticsLoading && !analytics} onRetry={refreshAnalytics} series={analytics?.activitySeries || []} />
      </Panel>
      <Panel actions={<Link className="admin-text-link" to="/admin/activity">View audit history<ChevronRight aria-hidden="true" /></Link>} className="admin-panel--activity" subtitle="Latest sensitive administrator decisions" title="Recent administrative activity">
        {logsError && logs.length ? <Feedback message="Recent activity could not be refreshed. Showing the last loaded records." type="error" /> : null}
        {logsLoading && !logs.length ? <LoadingRows count={4} /> : logs.length ? <div className="admin-activity-list">{logs.map((log) => {
          const destination = activityDestination(log)
          const target = log.song?.title || log.creator?.name || labelFor(log.entityType || 'platform')
          const action = labelFor(log.action)
          const exactTime = formatDate(log.createdAt)
          return <article className="admin-activity-item" key={log.id}><span aria-hidden="true" /><div>{destination ? <Link aria-label={`${action}: open ${target}`} className="admin-activity-item__link" to={destination}>{action}<ChevronRight aria-hidden="true" /></Link> : <strong>{action}</strong>}<p><span><b>Actor:</b> {log.actor?.name || 'System'}</span><span><b>Target:</b> {target}</span></p></div><time aria-label={`Recorded ${exactTime}`} dateTime={log.createdAt} title={exactTime}>{relativeTime(log.createdAt)}</time></article>
        })}</div> : logsError ? <div className="admin-overview-state is-error" role="alert"><strong>Recent activity could not be loaded.</strong><p>{logsError}</p><button className="admin-button admin-button--ghost" onClick={retryLogs} type="button">Try again</button></div> : <EmptyState action={<Link className="admin-button admin-button--ghost" to="/admin/activity">View audit history</Link>} description="Sensitive administrator decisions will appear here when they are recorded." title="No recent administrative activity" />}
      </Panel>
    </div>
  </div></div>
}
