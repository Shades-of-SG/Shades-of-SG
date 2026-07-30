import { Download, ExternalLink, UserRoundCheck, UserRoundX } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminPageHeader, AdminTabs, ConfirmationModal, DataTable, DetailDrawer, EmptyState, Feedback, FilterBar, LoadingRows, Panel, StatusBadge } from '../components/admin/AdminUI'
import ContextAuditHistory from '../components/admin/ContextAuditHistory'
import { useAuth } from '../context/AuthContext'
import { downloadCreatorResume } from '../services/applicationService'
import { getAdminApplications, getAdminCreators, updateApplicationStatus, updateCreatorStatus } from '../services/adminService'
import { formatDate, labelFor, relativeTime, useTab } from './adminUtils'

const applicationStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED']

function formatFileSize(bytes) {
  return Number.isFinite(Number(bytes)) ? `${(Number(bytes) / 1024 / 1024).toFixed(2)} MB` : ''
}

export default function AdminCreatorsPage() {
  const { token } = useAuth()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useTab(params, setParams, ['applications', 'approved'], 'applications')
  const [applications, setApplications] = useState([])
  const [creators, setCreators] = useState([])
  const [filters, setFilters] = useState({ creatorAccessStatus: '', search: '', status: '' })
  const [selected, setSelected] = useState(null)
  const [review, setReview] = useState(null)
  const [accountAction, setAccountAction] = useState(null)
  const [feedback, setFeedback] = useState({ message: '', type: 'status' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'applications') {
        const data = await getAdminApplications(token, { search: filters.search, status: filters.status, limit: 100 })
        setApplications(data.applications || [])
      } else {
        const data = await getAdminCreators(token, { creatorAccessStatus: filters.creatorAccessStatus, search: filters.search, limit: 100 })
        setCreators(data.creators || [])
      }
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setLoading(false) }
  }, [filters.creatorAccessStatus, filters.search, filters.status, tab, token])

  useEffect(() => { const timer = window.setTimeout(refresh, filters.search ? 220 : 0); return () => window.clearTimeout(timer) }, [refresh, filters.search])

  function openReview(application, status) {
    setReview({ adminNotes: application.adminNotes || '', applicantFeedback: '', application, status })
  }

  async function submitReview() {
    if (!review) return
    if (['CHANGES_REQUESTED', 'REJECTED'].includes(review.status) && !review.applicantFeedback.trim()) {
      setFeedback({ message: 'Applicant feedback is required for this decision.', type: 'error' }); return
    }
    setBusy(true)
    try {
      await updateApplicationStatus(review.application.id, { adminNotes: review.adminNotes, applicantFeedback: review.applicantFeedback, status: review.status }, token)
      setFeedback({ message: `Application moved to ${labelFor(review.status)}.`, type: 'status' })
      setReview(null); setSelected(null); await refresh()
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function changeCreatorStatus() {
    if (!accountAction) return
    const next = accountAction.creatorAccessStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    setBusy(true)
    try {
      await updateCreatorStatus(accountAction.id, next, token, accountAction.reason || '')
      setFeedback({ message: `${accountAction.name}'s creator access was ${next === 'ACTIVE' ? 'restored' : 'suspended'}.`, type: 'status' })
      setAccountAction(null); setSelected(null); await refresh()
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function download(application) {
    try {
      const blob = await downloadCreatorResume(application.id, token)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = application.resumeFileName || 'resume'; link.click(); URL.revokeObjectURL(url)
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) }
  }

  return <div className="admin-page"><div className="admin-page__inner">
    <AdminPageHeader description="Review applications and manage approved creator access from one place." title="Creators" />
    <AdminTabs active={tab} items={[{ id: 'applications', label: 'Applications', count: applications.length }, { id: 'approved', label: 'Approved Creators', count: creators.length }]} onChange={(next) => { setSelected(null); setTab(next) }} />
    <Feedback {...feedback} />
    <FilterBar onClear={() => setFilters({ creatorAccessStatus: '', search: '', status: '' })} showClear={Boolean(filters.search || filters.status || filters.creatorAccessStatus)}>
      <label>Search<input aria-label="Search creators" onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} placeholder={tab === 'applications' ? 'Name, email or motivation' : 'Name or email'} value={filters.search} /></label>
      {tab === 'applications' ? <label>Status<select onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))} value={filters.status}><option value="">All review stages</option>{applicationStatuses.map((status) => <option key={status} value={status}>{labelFor(status)}</option>)}</select></label> : <label>Creator access<select onChange={(event) => setFilters((value) => ({ ...value, creatorAccessStatus: event.target.value }))} value={filters.creatorAccessStatus}><option value="">All creator access</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select></label>}
    </FilterBar>
    <Panel title={tab === 'applications' ? 'Creator applications' : 'Approved creators'} subtitle={tab === 'applications' ? 'Select an applicant to review their full submission.' : 'Song totals and account access for every creator.'}>
      {loading ? <LoadingRows /> : tab === 'applications' ? (applications.length ? <DataTable caption="Creator applications" columns={['Applicant', 'Submitted', 'Stage', 'Portfolio', 'Action']}>
        {applications.map((application) => <tr className={selected?.id === application.id ? 'is-selected' : ''} key={application.id}>
          <td data-label="Applicant"><button className="admin-row-button" onClick={() => setSelected(application)} type="button"><strong>{application.applicant?.name || 'Unknown applicant'}</strong><small>{application.applicant?.email}</small></button></td>
          <td data-label="Submitted">{formatDate(application.submittedAt || application.createdAt, false)}</td><td data-label="Stage"><StatusBadge status={application.status} /></td>
          <td data-label="Portfolio">{application.portfolioUrl ? <a className="admin-button admin-button--ghost" href={application.portfolioUrl} rel="noreferrer" target="_blank"><ExternalLink />Open</a> : '—'}</td>
          <td data-label="Action"><div className="admin-table__actions"><button className="admin-button admin-button--ghost" onClick={() => setSelected(application)} type="button">Review</button></div></td>
        </tr>)}</DataTable> : <EmptyState description="Try changing the search or status filter." title="No applications found" />) : (creators.length ? <DataTable caption="Approved creators" columns={['Creator', 'Songs', 'Published', 'Creator access', 'User account', 'Recent activity', 'Action']}>
          {creators.map((creator) => <tr className={selected?.id === creator.id ? 'is-selected' : ''} key={creator.id}>
            <td data-label="Creator"><button className="admin-row-button" onClick={() => setSelected(creator)} type="button"><strong>{creator.name}</strong><small>{creator.email}</small></button></td>
            <td data-label="Songs">{creator.songCount}</td><td data-label="Published">{creator.publishedSongCount}</td><td data-label="Creator access"><StatusBadge status={creator.creatorAccessStatus} /></td><td data-label="User account"><StatusBadge status={creator.accountStatus} /></td><td data-label="Recent activity">{relativeTime(creator.updatedAt || creator.createdAt)}</td>
            <td data-label="Action"><div className="admin-table__actions"><button className={`admin-button ${creator.creatorAccessStatus === 'ACTIVE' ? 'admin-button--danger' : 'admin-button--ghost'}`} onClick={() => setAccountAction({ ...creator, reason: '' })} type="button">{creator.creatorAccessStatus === 'ACTIVE' ? 'Suspend creator access' : 'Restore creator access'}</button></div></td>
          </tr>)}</DataTable> : <EmptyState description="Try changing the search or account filter." title="No creators found" />)}
    </Panel>
    <DetailDrawer onClose={() => setSelected(null)} open={Boolean(selected)} title={tab === 'applications' ? 'Application details' : 'Creator details'}>
      {selected ? tab === 'applications' ? <>
        <section className="admin-detail-drawer__section"><h3>Applicant</h3><p><strong>{selected.applicant?.name}</strong><br />{selected.applicant?.email}</p><StatusBadge status={selected.status} /><p>Reference {selected.id.slice(0, 8).toUpperCase()}<br />Submitted {formatDate(selected.submittedAt || selected.createdAt)}<br />Last updated {formatDate(selected.updatedAt)}</p></section>
        <section className="admin-detail-drawer__section"><h3>Introduction</h3><p>{selected.introduction || 'Not provided.'}</p><h3>Experience</h3><p>{selected.experience || selected.statement || 'Not provided.'}</p></section>
        <section className="admin-detail-drawer__section"><h3>Contribution motivation</h3><p>{selected.motivation || selected.statement || 'Not provided.'}</p><h3>Proposed content ideas</h3><p>{selected.contentIdeas || 'Not provided.'}</p></section>
        <section className="admin-detail-drawer__section"><h3>Materials</h3>{selected.portfolioUrl ? <a className="admin-button admin-button--ghost" href={selected.portfolioUrl} rel="noreferrer" target="_blank"><ExternalLink />Portfolio</a> : <p>No portfolio supplied.</p>} {selected.hasResume ? <><button className="admin-button admin-button--ghost" onClick={() => download(selected)} type="button"><Download />Download private resume</button><p>{selected.resumeFileName}{selected.resumeFileSize ? ` · ${formatFileSize(selected.resumeFileSize)}` : ''}</p></> : <p>No resume supplied.</p>}</section>
        <section className="admin-detail-drawer__section"><h3>Status history</h3>{(selected.history || []).map((entry) => <p key={entry.id}><strong>{labelFor(entry.fromStatus || 'New')} → {labelFor(entry.toStatus)}</strong><br />{formatDate(entry.createdAt)}{entry.actor?.name ? ` · ${entry.actor.name}` : ''}{entry.note ? <><br /><small>{entry.note}</small></> : null}</p>)}</section>
        {!['APPROVED', 'REJECTED'].includes(selected.status) ? <section className="admin-detail-drawer__section"><h3>Decision</h3><div className="admin-form"><label>Move to stage<select defaultValue="" onChange={(event) => { if (event.target.value) openReview(selected, event.target.value) }}><option disabled value="">Choose review action</option>{applicationStatuses.filter((status) => status !== selected.status).map((status) => <option key={status} value={status}>{labelFor(status)}</option>)}</select></label></div><div className="admin-form__actions"><button className="admin-button admin-button--danger" onClick={() => openReview(selected, 'REJECTED')} type="button">Reject</button><button className="admin-button admin-button--primary" onClick={() => openReview(selected, 'APPROVED')} type="button">Approve</button></div></section> : null}
      </> : <>
        <section className="admin-detail-drawer__section"><h3>Creator</h3><p><strong>{selected.name}</strong><br />{selected.email}</p><p>Creator access <StatusBadge status={selected.creatorAccessStatus} /><br />User account <StatusBadge status={selected.accountStatus} /></p>{selected.creatorSuspensionReason ? <p><strong>Creator suspension reason:</strong><br />{selected.creatorSuspensionReason}</p> : null}</section>
        <section className="admin-detail-drawer__section"><h3>Content</h3><p>{selected.songCount} total songs<br />{selected.publishedSongCount} published songs<br />Recent activity {relativeTime(selected.updatedAt || selected.createdAt)}</p></section>
        <section className="admin-detail-drawer__section"><h3>Application history</h3>{selected.creatorApplications?.length ? selected.creatorApplications.map((application) => <div key={application.id}><p><strong>{labelFor(application.status)}</strong><br />Submitted {formatDate(application.createdAt, false)}{application.reviewedAt ? ` · reviewed ${formatDate(application.reviewedAt, false)}` : ''}</p>{(application.history || []).map((entry) => <p key={entry.id}>{labelFor(entry.fromStatus || 'New')} → {labelFor(entry.toStatus)}<br /><small>{entry.note || formatDate(entry.createdAt)}</small></p>)}</div>) : <p>No application history is available.</p>}</section>
        <section className="admin-detail-drawer__section"><h3>Warnings and suspensions</h3>{selected.warnings?.length ? selected.warnings.map((warning) => <p key={warning.id}><strong>{warning.reason}</strong><br /><StatusBadge status={warning.status} /> · {formatDate(warning.createdAt, false)}</p>) : <p>No warnings recorded for this creator.</p>}</section>
        <section className="admin-detail-drawer__section"><h3>Creator access controls</h3><p>Joined {formatDate(selected.createdAt, false)}</p><p>This changes access to creator tools only. The user account and all creator-owned content remain unchanged.</p><button className={`admin-button ${selected.creatorAccessStatus === 'ACTIVE' ? 'admin-button--danger' : 'admin-button--primary'}`} onClick={() => setAccountAction({ ...selected, reason: '' })} type="button">{selected.creatorAccessStatus === 'ACTIVE' ? <><UserRoundX />Suspend creator access</> : <><UserRoundCheck />Restore creator access</>}</button></section>
      </> : null}
      {selected ? <ContextAuditHistory entityId={selected.id} token={token} /> : null}
    </DetailDrawer>
    {review ? <ConfirmationModal busy={busy} confirmLabel={review.status === 'APPROVED' ? 'Approve creator' : labelFor(review.status)} danger={review.status === 'REJECTED'} onCancel={() => setReview(null)} onConfirm={submitReview} title={`${labelFor(review.status)} application`}>
      <form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>This decision will be recorded in the application history.</p><label>Internal notes<textarea onChange={(event) => setReview((value) => ({ ...value, adminNotes: event.target.value }))} value={review.adminNotes} /></label>{['CHANGES_REQUESTED', 'REJECTED', 'SHORTLISTED', 'INTERVIEW'].includes(review.status) ? <label>Applicant feedback<textarea onChange={(event) => setReview((value) => ({ ...value, applicantFeedback: event.target.value }))} required={['CHANGES_REQUESTED', 'REJECTED'].includes(review.status)} value={review.applicantFeedback} /></label> : null}</form>
    </ConfirmationModal> : null}
    {accountAction ? <ConfirmationModal busy={busy} confirmLabel={accountAction.creatorAccessStatus === 'ACTIVE' ? 'Suspend creator access' : 'Restore creator access'} danger={accountAction.creatorAccessStatus === 'ACTIVE'} onCancel={() => setAccountAction(null)} onConfirm={changeCreatorStatus} title={accountAction.creatorAccessStatus === 'ACTIVE' ? 'Suspend creator access?' : 'Restore creator access?'}><form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>{accountAction.creatorAccessStatus === 'ACTIVE' ? `${accountAction.name} will lose access to creator tools but can continue using Shades of SG as a regular user. Published songs and creator data will remain unchanged.` : `${accountAction.name} will regain access to the creator dashboard and tools.`}</p>{accountAction.creatorAccessStatus === 'ACTIVE' ? <label>Reason<textarea maxLength="1000" onChange={(event) => setAccountAction((value) => ({ ...value, reason: event.target.value }))} placeholder="Explain the suspension and any appeal guidance" value={accountAction.reason} /></label> : null}</form></ConfirmationModal> : null}
  </div></div>
}
