import { ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AdminPageHeader, DataTable, EmptyState, Feedback, FilterBar, LoadingRows, Panel, StatusBadge } from '../components/admin/AdminUI'
import { useAuth } from '../context/AuthContext'
import { getAuditLogs, getModerationActions, getWarnings } from '../services/adminService'
import { formatDate, labelFor } from './adminUtils'

function normalize(logs, actions, warnings) {
  return [
    ...logs.map((item) => ({ ...item, actorName: item.actor?.name || 'System', actorRole: item.actor?.role, detail: item.metadata, kind: 'Audit', resource: item.entityType, resourceId: item.entityId, resourceName: item.song?.title || item.creator?.name || '', title: item.action })),
    ...actions.map((item) => ({ ...item, actorName: item.actor?.name || 'System', actorRole: item.actor?.role, detail: { reason: item.reason, song: item.song?.title, targetUser: item.targetUser?.email }, kind: 'Moderation', resource: item.targetType, resourceId: item.targetId, resourceName: item.song?.title || item.targetUser?.name || '', title: item.actionType })),
    ...warnings.map((item) => ({ ...item, actorName: item.issuer?.name || 'Administrator', detail: { reason: item.reason, resolutionNote: item.resolutionNote }, kind: 'Warning', resource: 'USER', resourceId: item.userId, resourceName: item.warnedUser?.name || '', title: item.status === 'RESOLVED' ? 'USER_WARNING_RESOLVED' : 'USER_WARNED' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function isPriorityRecord(record) {
  if (record.kind === 'Warning') return true
  const action = String(record.title || '').toUpperCase()
  if (/CREATOR_APPLICATION_(APPROVED|REJECTED)/.test(action)) return true
  if (/(CREATOR|USER)_(SUSPENDED|ACTIVE|WARNED|WARNING_RESOLVED)/.test(action)) return true
  if (/(FOLDER|SONG_FOLDER_PROPOSAL)_(APPROVED|REJECTED)/.test(action)) return true
  if (/REFLECTION_(REJECTED|APPROVED|PENDING)/.test(action)) return record.actorRole === 'ADMIN'
  if (action === 'REFLECTION_MODERATED') return record.actorRole === 'ADMIN'
  return false
}

function readableValue(value) {
  if (value === null || value === undefined || value === '') return 'Not recorded'
  if (Array.isArray(value)) return value.map((item) => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(', ')
  if (typeof value === 'object') return Object.entries(value).map(([key, nested]) => `${labelFor(key)}: ${readableValue(nested)}`).join(' · ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function metadataEntries(detail) {
  if (!detail || typeof detail !== 'object') return []
  return Object.entries(detail).filter(([, value]) => value !== null && value !== undefined && value !== '')
}

export default function AdminActivityPage() {
  const { token } = useAuth()
  const [records, setRecords] = useState([])
  const [filters, setFilters] = useState({ actor: '', dateFrom: '', dateTo: '', kind: '', resource: '', scope: 'priority' })
  const [expanded, setExpanded] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getAuditLogs(token, { limit: 100 }), getModerationActions(token, { limit: 100 }), getWarnings(token, { limit: 100 })])
      .then(([logs, actions, warnings]) => { if (active) setRecords(normalize(logs.auditLogs || [], actions.actions || [], warnings.warnings || [])) })
      .catch((nextError) => { if (active) setError(nextError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const filtered = useMemo(() => records.filter((record) => {
    const created = new Date(record.createdAt)
    if (filters.scope === 'priority' && !isPriorityRecord(record)) return false
    if (filters.kind && record.kind !== filters.kind) return false
    if (filters.actor && !record.actorName.toLowerCase().includes(filters.actor.toLowerCase())) return false
    if (filters.resource && !String(record.resource || '').toLowerCase().includes(filters.resource.toLowerCase())) return false
    if (filters.dateFrom && created < new Date(`${filters.dateFrom}T00:00:00`)) return false
    if (filters.dateTo && created > new Date(`${filters.dateTo}T23:59:59`)) return false
    return true
  }), [filters, records])
  const resourceTypes = useMemo(() => [...new Set(records.map((record) => record.resource).filter(Boolean))].sort(), [records])
  const hasFilters = filters.scope !== 'priority' || Boolean(filters.actor || filters.dateFrom || filters.dateTo || filters.kind || filters.resource)

  return <div className="admin-page"><div className="admin-page__inner">
    <AdminPageHeader description="Sensitive administrative and safety events, with the complete system trail available when needed." title="Audit history" />
    <Feedback message={error} type="error" />
    <FilterBar onClear={() => setFilters({ actor: '', dateFrom: '', dateTo: '', kind: '', resource: '', scope: 'priority' })} showClear={hasFilters}>
      <label>Event scope<select onChange={(event) => setFilters((value) => ({ ...value, scope: event.target.value }))} value={filters.scope}><option value="priority">Administrative events</option><option value="all">All system events</option></select></label>
      <label>Date from<input onChange={(event) => setFilters((value) => ({ ...value, dateFrom: event.target.value }))} type="date" value={filters.dateFrom} /></label>
      <label>Date to<input onChange={(event) => setFilters((value) => ({ ...value, dateTo: event.target.value }))} type="date" value={filters.dateTo} /></label>
      <label>Action type<select onChange={(event) => setFilters((value) => ({ ...value, kind: event.target.value }))} value={filters.kind}><option value="">All actions</option><option value="Audit">Audit</option><option value="Moderation">Moderation</option><option value="Warning">Warning</option></select></label>
      <label>Actor<input onChange={(event) => setFilters((value) => ({ ...value, actor: event.target.value }))} placeholder="Name" value={filters.actor} /></label>
      <label>Resource type<select onChange={(event) => setFilters((value) => ({ ...value, resource: event.target.value }))} value={filters.resource}><option value="">All resources</option>{resourceTypes.map((resource) => <option key={resource} value={resource}>{labelFor(resource)}</option>)}</select></label>
    </FilterBar>
    <Panel title="Administrative history" subtitle={`${filtered.length} matching records · select a row for details`}>
      {loading ? <LoadingRows /> : filtered.length ? <DataTable caption="Platform activity log" columns={['', 'Action', 'Actor', 'Resource', 'Type', 'Date']}>
        {filtered.map((record) => {
          const key = `${record.kind}-${record.id}`
          const open = expanded === key
          const details = metadataEntries(record.detail)
          return <tbody key={key} className="admin-activity-group"><tr onClick={() => setExpanded(open ? '' : key)}><td data-label="Details"><button aria-label={`${open ? 'Hide' : 'Show'} details for ${labelFor(record.title)}`} className="admin-row-expander" type="button">{open ? <ChevronDown /> : <ChevronRight />}</button></td><td data-label="Action"><strong>{labelFor(record.title)}</strong><small>{record.detail?.reason ? String(record.detail.reason).slice(0, 90) : 'Recorded platform action'}</small></td><td data-label="Actor">{record.actorName}</td><td data-label="Resource"><strong>{record.resourceName ? `${labelFor(record.resource || 'Platform')}: ${record.resourceName}` : labelFor(record.resource || 'Platform')}</strong><small>{record.resourceId || '—'}</small></td><td data-label="Type"><StatusBadge status={record.kind === 'Warning' ? 'FLAGGED' : record.kind === 'Moderation' ? 'CHANGES_REQUESTED' : 'ACTIVE'}>{record.kind}</StatusBadge></td><td data-label="Date">{formatDate(record.createdAt)}</td></tr>{open ? <tr className="admin-activity-detail"><td colSpan="6" data-label="Details"><div><strong>Additional details</strong>{details.length ? <dl className="admin-detail-list">{details.map(([name, value]) => <div key={name}><dt>{labelFor(name)}</dt><dd>{readableValue(value)}</dd></div>)}</dl> : <p>No additional details were recorded.</p>}<details className="admin-raw-details"><summary>View raw data</summary><pre>{JSON.stringify(record.detail || {}, null, 2)}</pre></details></div></td></tr> : null}</tbody>
        })}
      </DataTable> : <EmptyState description="Try widening the date range or clearing one of the filters." title="No activity matches these filters" />}
    </Panel>
  </div></div>
}
