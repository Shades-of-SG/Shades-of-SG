import { Download, ExternalLink, FileSearch, ShieldCheck, UserRoundCheck, UserRoundX } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AdminPageHeader, AdminSummaryError, AdminTabPanel, AdminTabs, ConfirmationModal, DataTable, DetailDrawer, EmptyState, Feedback, FilterBar, LoadingRows, Panel, StatusBadge } from '../components/admin/AdminUI'
import ContextAuditHistory from '../components/admin/ContextAuditHistory'
import { useAuth } from '../context/AuthContext'
import useAdminSummary from '../hooks/useAdminSummary'
import { downloadCreatorResume } from '../services/applicationService'
import { getAdminApplications, getAdminCreators, updateApplicationStatus, updateCreatorStatus } from '../services/adminService'
import { formatDate, labelFor, relativeTime, useTab } from './adminUtils'

const DECISION_LABELS = {
  APPROVED: 'Approve application',
  CHANGES_REQUESTED: 'Request more information',
  INTERVIEW: 'Move to interview',
  REJECTED: 'Reject application',
  SHORTLISTED: 'Shortlist application',
  UNDER_REVIEW: 'Start review',
}

function formatFileSize(bytes) {
  return Number.isFinite(Number(bytes)) ? `${(Number(bytes) / 1024 / 1024).toFixed(2)} MB` : ''
}

function primaryApplicationAction(status) {
  if (status === 'APPROVED' || status === 'REJECTED') return 'View decision'
  if (status === 'CHANGES_REQUESTED') return 'Awaiting applicant'
  if (status === 'SUBMITTED') return 'Review application'
  return 'Continue review'
}

function requiredApplicationAction(status) {
  if (status === 'SUBMITTED') return 'Administrator review'
  if (status === 'UNDER_REVIEW') return 'Continue assessment'
  if (status === 'CHANGES_REQUESTED') return 'Applicant response'
  if (status === 'SHORTLISTED') return 'Choose next review step'
  if (status === 'INTERVIEW') return 'Record interview decision'
  return 'No action required'
}

function Completion({ completion }) {
  const complete = completion?.complete
  const missing = completion?.missingFields || []
  return <span className={`admin-completeness ${complete ? 'is-complete' : 'is-incomplete'}`} title={!complete && missing.length ? `Missing: ${missing.join(', ')}` : undefined}>{complete ? 'Complete' : `Missing ${missing.length || 'details'}`}</span>
}

function ApplicationTimeline({ history = [] }) {
  if (!history.length) return <p>No review activity has been recorded.</p>
  return <ol className="admin-creator-timeline">{history.map((entry) => <li key={entry.id}>
    <div><strong>{labelFor(entry.fromStatus || 'New')} → {labelFor(entry.toStatus)}</strong><time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time></div>
    <p>{entry.actor?.name ? `By ${entry.actor.name}` : 'Recorded by the platform'}{entry.note ? ` · ${entry.note}` : ''}</p>
  </li>)}</ol>
}

function decisionExplanation(status, applicantName) {
  if (status === 'APPROVED') return `Approving ${applicantName} grants creator privileges while retaining their member account and normal profile data. It does not transfer or alter another creator’s content ownership.`
  if (status === 'REJECTED') return `Rejecting this application records the decision and applicant feedback. It does not delete the application, suspend the member account, or remove profile data.`
  if (status === 'CHANGES_REQUESTED') return 'The requested information and feedback will be visible in the applicant’s application portal. The platform will attempt an email notification, but delivery is not guaranteed.'
  return `This moves the application to ${labelFor(status)} and records the administrator action in its history.`
}

export default function AdminCreatorsPage() {
  const { token } = useAuth()
  const { data: summary, error: summaryError, loading: summaryLoading, refresh: refreshSummary } = useAdminSummary(token)
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useTab(params, setParams, ['applications', 'approved'], 'applications')
  const [applicationStatuses, setApplicationStatuses] = useState([])
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
        setApplicationStatuses(data.applicationStatuses || [])
      } else {
        const data = await getAdminCreators(token, { creatorAccessStatus: filters.creatorAccessStatus, search: filters.search, limit: 100 })
        setCreators(data.creators || [])
      }
    } catch (error) {
      setFeedback({ message: `${error.message} Existing results may be out of date.`, type: 'error' })
    } finally { setLoading(false) }
  }, [filters.creatorAccessStatus, filters.search, filters.status, tab, token])

  useEffect(() => {
    const timer = window.setTimeout(refresh, filters.search ? 220 : 0)
    return () => window.clearTimeout(timer)
  }, [refresh, filters.search])

  function openReview(application, status) {
    setReview({ adminNotes: application.adminNotes || '', applicantFeedback: '', application, status })
  }

  async function submitReview() {
    if (!review || busy) return
    if (['CHANGES_REQUESTED', 'REJECTED'].includes(review.status) && !review.applicantFeedback.trim()) {
      setFeedback({ message: 'Applicant feedback is required for this decision.', type: 'error' })
      return
    }
    setBusy(true)
    try {
      await updateApplicationStatus(review.application.id, { adminNotes: review.adminNotes, applicantFeedback: review.applicantFeedback, status: review.status }, token)
      setFeedback({ message: `Application moved to ${labelFor(review.status)}.`, type: 'status' })
      setReview(null)
      setSelected(null)
      await Promise.all([refresh(), refreshSummary()])
    } catch (error) {
      setFeedback({ message: `${error.message} No decision was recorded.`, type: 'error' })
    } finally { setBusy(false) }
  }

  async function changeCreatorStatus() {
    if (!accountAction || busy) return
    const next = accountAction.creatorAccessStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    if (accountAction.reason.trim().length < 5) {
      setFeedback({ message: `Enter a reason for ${next === 'ACTIVE' ? 'restoring' : 'suspending'} creator access.`, type: 'error' })
      return
    }
    setBusy(true)
    try {
      await updateCreatorStatus(accountAction.id, next, token, accountAction.reason || '')
      setFeedback({ message: `${accountAction.name}'s creator access was ${next === 'ACTIVE' ? 'restored' : 'suspended'}.`, type: 'status' })
      setAccountAction(null)
      setSelected(null)
      await Promise.all([refresh(), refreshSummary()])
    } catch (error) {
      setFeedback({ message: `${error.message} Creator access was not changed.`, type: 'error' })
    } finally { setBusy(false) }
  }

  async function download(application) {
    try {
      const blob = await downloadCreatorResume(application.id, token)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = application.resumeFileName || 'resume'
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) }
  }

  return <div className="admin-page admin-creators"><div className="admin-page__inner">
    <AdminPageHeader description="Review applications and manage approved creator access from one place." title="Creators" />
    <AdminTabs active={tab} items={[
      { id: 'applications', label: 'Applications', count: summary?.tabCounts?.creatorApplications, countLoading: summaryLoading },
      { id: 'approved', label: 'Approved Creators', count: summary?.tabCounts?.creators, countLoading: summaryLoading },
    ]} onChange={(next) => { setLoading(true); setSelected(null); setTab(next) }} />
    <AdminSummaryError message={summaryError} onRetry={refreshSummary} />
    <Feedback {...feedback} />
    <AdminTabPanel key={tab}>
      <FilterBar onClear={() => setFilters({ creatorAccessStatus: '', search: '', status: '' })} showClear={Boolean(filters.search || filters.status || filters.creatorAccessStatus)}>
        <label>Search<input aria-label="Search creators" onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} placeholder={tab === 'applications' ? 'Name, email or motivation' : 'Name or email'} value={filters.search} /></label>
        {tab === 'applications' ? <label>Status<select onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))} value={filters.status}><option value="">All review stages</option>{applicationStatuses.map((status) => <option key={status} value={status}>{labelFor(status)}</option>)}</select></label> : <label>Creator access<select onChange={(event) => setFilters((value) => ({ ...value, creatorAccessStatus: event.target.value }))} value={filters.creatorAccessStatus}><option value="">All creator access</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select></label>}
      </FilterBar>
      <Panel className="admin-creators__panel" title={tab === 'applications' ? 'Creator applications' : 'Approved creators'} subtitle={tab === 'applications' ? 'Review submitted information and the next required action.' : 'Creator privileges and member-account access are managed separately.'}>
        {loading ? <LoadingRows /> : tab === 'applications' ? (applications.length ? <DataTable caption="Creator applications" columns={['Applicant', 'Submitted', 'Review stage', 'Completeness', 'Portfolio', 'Latest admin action', 'Action required']}>
          {applications.map((application) => <tr className={selected?.id === application.id ? 'is-selected' : ''} key={application.id}>
            <td data-label="Applicant"><button aria-label={`Open application for ${application.applicant?.name || 'unknown applicant'}`} className="admin-row-button" onClick={() => setSelected(application)} type="button"><strong>{application.applicant?.name || 'Unknown applicant'}</strong><small>{application.applicant?.email || 'Email unavailable'}</small></button></td>
            <td data-label="Submitted">{formatDate(application.submittedAt || application.createdAt, false)}</td>
            <td data-label="Review stage"><StatusBadge status={application.status}>{labelFor(application.status)}</StatusBadge></td>
            <td data-label="Completeness"><Completion completion={application.completion} /></td>
            <td data-label="Portfolio">{application.portfolioUrl ? <a aria-label={`Open ${application.applicant?.name || 'applicant'} portfolio in a new tab`} className="admin-text-link" href={application.portfolioUrl} rel="noopener noreferrer" target="_blank"><ExternalLink aria-hidden="true" />Open portfolio</a> : <span className="admin-muted">Not provided</span>}</td>
            <td data-label="Latest admin action">{application.latestAdministrativeAction ? <><strong>{labelFor(application.latestAdministrativeAction.status)}</strong><small>{application.latestAdministrativeAction.actorName} · {relativeTime(application.latestAdministrativeAction.createdAt)}</small></> : <span className="admin-muted">No admin action yet</span>}</td>
            <td data-label="Action required"><strong>{requiredApplicationAction(application.status)}</strong><button className="admin-button admin-button--ghost admin-creators__row-action" onClick={() => setSelected(application)} type="button">{primaryApplicationAction(application.status)}</button></td>
          </tr>)}</DataTable> : <EmptyState description="Try changing the search or status filter." title="No applications found" />) : (creators.length ? <DataTable caption="Approved creators" columns={['Creator', 'Content', 'Creator access', 'Member account', 'Recent activity', 'Action']}>
          {creators.map((creator) => <tr className={selected?.id === creator.id ? 'is-selected' : ''} key={creator.id}>
            <td data-label="Creator"><button aria-label={`Open creator details for ${creator.name}`} className="admin-row-button" onClick={() => setSelected(creator)} type="button"><strong>{creator.name}</strong><small>{creator.email}</small></button></td>
            <td data-label="Content"><strong>{creator.songCount} {creator.songCount === 1 ? 'song' : 'songs'}</strong><small>{creator.publishedSongCount} published</small></td>
            <td data-label="Creator access"><span className="admin-access-state"><span>Creator access</span><StatusBadge status={creator.creatorAccessStatus}>{labelFor(creator.creatorAccessStatus)}</StatusBadge></span></td>
            <td data-label="Member account"><span className="admin-access-state"><span>Member account</span><StatusBadge status={creator.accountStatus}>{labelFor(creator.accountStatus)}</StatusBadge></span></td>
            <td data-label="Recent activity">{relativeTime(creator.updatedAt || creator.createdAt)}</td>
            <td data-label="Action"><button className="admin-button admin-button--ghost admin-creators__row-action" onClick={() => setSelected(creator)} type="button">View creator details</button></td>
          </tr>)}</DataTable> : <EmptyState description="Try changing the search or creator-access filter." title="No approved creators found" />)}
      </Panel>
    </AdminTabPanel>

    <DetailDrawer onClose={() => setSelected(null)} open={Boolean(selected)} title={tab === 'applications' ? 'Application review' : 'Creator details'}>
      {selected ? tab === 'applications' ? <>
        <section className="admin-detail-drawer__section admin-creator-review__summary"><div><h3>Applicant profile</h3><p><strong>{selected.applicant?.name || 'Unknown applicant'}</strong><br />{selected.applicant?.email || 'Email unavailable'}</p></div><StatusBadge status={selected.status}>{labelFor(selected.status)}</StatusBadge><dl className="admin-detail-list"><div><dt>Submitted</dt><dd>{formatDate(selected.submittedAt || selected.createdAt)}</dd></div><div><dt>Last updated</dt><dd>{formatDate(selected.updatedAt)}</dd></div><div><dt>Member account</dt><dd>{labelFor(selected.applicant?.accountStatus || 'Unknown')}</dd></div><div><dt>Completeness</dt><dd><Completion completion={selected.completion} /></dd></div></dl></section>
        <section className="admin-detail-drawer__section admin-creator-review__copy"><h3>Introduction</h3><p>{selected.introduction || 'Not provided.'}</p></section>
        <section className="admin-detail-drawer__section admin-creator-review__copy"><h3>Motivation</h3><p>{selected.motivation || selected.statement || 'Not provided.'}</p></section>
        <section className="admin-detail-drawer__section admin-creator-review__copy"><h3>Relevant experience</h3><p>{selected.experience || selected.statement || 'Not provided.'}</p></section>
        <section className="admin-detail-drawer__section admin-creator-review__copy"><h3>Proposed contribution</h3><p>{selected.contentIdeas || 'Not provided.'}</p></section>
        <section className="admin-detail-drawer__section"><h3>Portfolio and supporting material</h3><div className="admin-creator-links">{selected.portfolioUrl ? <a className="admin-button admin-button--ghost" href={selected.portfolioUrl} rel="noopener noreferrer" target="_blank"><ExternalLink aria-hidden="true" />Open external portfolio</a> : <p>Portfolio not provided.</p>}{selected.hasResume ? <button className="admin-button admin-button--ghost" onClick={() => download(selected)} type="button"><Download aria-hidden="true" />Download private resume</button> : <p>Resume not provided.</p>}</div>{selected.hasResume ? <p className="admin-muted">{selected.resumeFileName}{selected.resumeFileSize ? ` · ${formatFileSize(selected.resumeFileSize)}` : ''}</p> : null}</section>
        <section className="admin-detail-drawer__section"><h3>Previous review activity</h3>{selected.applicantFeedback ? <p><strong>Latest applicant feedback</strong><br />{selected.applicantFeedback}</p> : null}{selected.adminNotes ? <p><strong>Internal notes</strong><br />{selected.adminNotes}</p> : null}<ApplicationTimeline history={selected.history} /></section>
        <section className="admin-detail-drawer__section"><h3>{selected.allowedTransitions?.length ? 'Available decisions' : 'Decision'}</h3>{selected.allowedTransitions?.length ? <><p>Only workflow actions valid from {labelFor(selected.status)} are available.</p><div className="admin-creator-decisions">{selected.allowedTransitions.map((status) => <button className={`admin-button ${status === 'REJECTED' ? 'admin-button--danger' : status === 'APPROVED' ? 'admin-button--primary' : 'admin-button--ghost'}`} key={status} onClick={() => openReview(selected, status)} type="button">{DECISION_LABELS[status] || `Move to ${labelFor(status)}`}</button>)}</div></> : <p>This completed decision is view-only and cannot be reopened.</p>}</section>
      </> : <>
        <section className="admin-detail-drawer__section"><h3>Creator profile</h3><p><strong>{selected.name}</strong><br />{selected.email}</p><div className="admin-access-pair"><span><small>Creator access</small><StatusBadge status={selected.creatorAccessStatus}>{labelFor(selected.creatorAccessStatus)}</StatusBadge></span><span><small>Member account</small><StatusBadge status={selected.accountStatus}>{labelFor(selected.accountStatus)}</StatusBadge></span></div>{selected.creatorSuspensionReason ? <p><strong>Creator suspension reason</strong><br />{selected.creatorSuspensionReason}</p> : null}<div className="admin-creator-links"><Link className="admin-button admin-button--ghost" to={`/creators/${encodeURIComponent(selected.id)}`}><ExternalLink aria-hidden="true" />Public creator profile</Link><Link className="admin-button admin-button--ghost" to="/admin/community?tab=users"><ShieldCheck aria-hidden="true" />Member status in Safety &amp; Reports</Link></div></section>
        <section className="admin-detail-drawer__section"><h3>Content and activity</h3><p>{selected.songCount} total {selected.songCount === 1 ? 'song' : 'songs'}<br />{selected.publishedSongCount} published<br />Recent creator activity {relativeTime(selected.updatedAt || selected.createdAt)}</p><Link className="admin-text-link" to="/admin/content?tab=songs"><FileSearch aria-hidden="true" />Open Content management</Link></section>
        <section className="admin-detail-drawer__section"><h3>Application decision and history</h3>{selected.creatorApplications?.length ? selected.creatorApplications.map((application) => <div key={application.id}><p><strong>{labelFor(application.status)}</strong><br />Submitted {formatDate(application.createdAt, false)}{application.reviewedAt ? ` · reviewed ${formatDate(application.reviewedAt, false)}` : ''}</p><ApplicationTimeline history={application.history} /></div>) : <p>No application history is available.</p>}</section>
        <section className="admin-detail-drawer__section"><h3>Warnings</h3>{selected.warnings?.length ? selected.warnings.map((warning) => <p key={warning.id}><strong>{warning.reason}</strong><br /><StatusBadge status={warning.status} /> · {formatDate(warning.createdAt, false)}</p>) : <p>No warnings recorded for this creator.</p>}</section>
        <section className="admin-detail-drawer__section"><h3>Creator access controls</h3><p>Joined {formatDate(selected.createdAt, false)}. This control changes creator privileges only; member-account moderation remains in Safety &amp; Reports.</p><button className={`admin-button ${selected.creatorAccessStatus === 'ACTIVE' ? 'admin-button--danger' : 'admin-button--primary'}`} onClick={() => setAccountAction({ ...selected, reason: '' })} type="button">{selected.creatorAccessStatus === 'ACTIVE' ? <><UserRoundX aria-hidden="true" />Suspend creator access</> : <><UserRoundCheck aria-hidden="true" />Restore creator access</>}</button></section>
      </> : null}
      {selected ? <ContextAuditHistory entityId={selected.id} token={token} /> : null}
    </DetailDrawer>

    {review ? <ConfirmationModal busy={busy} confirmLabel={DECISION_LABELS[review.status] || labelFor(review.status)} danger={review.status === 'REJECTED'} onCancel={() => setReview(null)} onConfirm={submitReview} title={`${labelFor(review.status)} application`}>
      <form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>{decisionExplanation(review.status, review.application.applicant?.name || 'this applicant')}</p><label>Internal notes <span className="admin-field-note">Visible only to administrators</span><textarea maxLength="5000" onChange={(event) => setReview((value) => ({ ...value, adminNotes: event.target.value }))} value={review.adminNotes} /></label>{['CHANGES_REQUESTED', 'REJECTED', 'SHORTLISTED', 'INTERVIEW'].includes(review.status) ? <label>Applicant feedback {['CHANGES_REQUESTED', 'REJECTED'].includes(review.status) ? '(required)' : '(optional)'}<textarea maxLength="5000" onChange={(event) => setReview((value) => ({ ...value, applicantFeedback: event.target.value }))} required={['CHANGES_REQUESTED', 'REJECTED'].includes(review.status)} value={review.applicantFeedback} /></label> : null}</form>
    </ConfirmationModal> : null}
    {accountAction ? <ConfirmationModal busy={busy} confirmLabel={accountAction.creatorAccessStatus === 'ACTIVE' ? 'Suspend creator access' : 'Restore creator access'} danger={accountAction.creatorAccessStatus === 'ACTIVE'} onCancel={() => setAccountAction(null)} onConfirm={changeCreatorStatus} title={accountAction.creatorAccessStatus === 'ACTIVE' ? 'Suspend creator access?' : 'Restore creator access?'}><form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>{accountAction.creatorAccessStatus === 'ACTIVE' ? `${accountAction.name} will lose Creator Studio and creator-only operations. They can still log in and use their active member account and normal profile. Existing songs and creator data remain owned by them, and published content remains public. An administrator can restore creator access here later.` : `${accountAction.name} will regain Creator Studio and creator-only operations. Their existing songs and creator data will be available again without recreation.`}</p><label>Administrator reason (required)<textarea maxLength="1000" minLength="5" onChange={(event) => setAccountAction((value) => ({ ...value, reason: event.target.value }))} placeholder={accountAction.creatorAccessStatus === 'ACTIVE' ? 'Explain the suspension and any appeal guidance' : 'Explain why creator access is safe to restore'} required value={accountAction.reason} /></label></form></ConfirmationModal> : null}
  </div></div>
}
