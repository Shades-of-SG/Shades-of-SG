import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { downloadCreatorResume } from '../services/applicationService'
import { getAdminApplications, updateApplicationStatus } from '../services/adminService'

const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED']

export default function AdminApplications() {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const refresh = useCallback(() => getAdminApplications(token, { search, status: filter }).then((data) => setApplications(data.applications)).catch((error) => setMessage(error.message)).finally(() => setLoading(false)), [filter, search, token])
  useEffect(() => { const timer = window.setTimeout(refresh, 200); return () => window.clearTimeout(timer) }, [refresh])
  const change = async (application, status) => {
    const adminNotes = window.prompt('Optional internal review note (not visible to the applicant):', application.adminNotes || '') || ''
    let applicantFeedback = ''
    if (['CHANGES_REQUESTED', 'REJECTED', 'SHORTLISTED', 'INTERVIEW'].includes(status)) applicantFeedback = window.prompt('Feedback visible to the applicant:') || ''
    if (['CHANGES_REQUESTED', 'REJECTED'].includes(status) && !applicantFeedback) return
    if (status === 'APPROVED' && !window.confirm(`Approve ${application.applicant?.name} and convert this account to CREATOR?`)) return
    setBusyId(application.id)
    try { await updateApplicationStatus(application.id, { adminNotes, applicantFeedback, status }, token); setMessage(`Application moved to ${status.replaceAll('_', ' ')}.`); await refresh() } catch (error) { setMessage(error.message) } finally { setBusyId('') }
  }
  const download = async (application) => {
    try { const blob = await downloadCreatorResume(application.id, token); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = application.resumeFileName || 'resume'; link.click(); URL.revokeObjectURL(url) } catch (error) { setMessage(error.message) }
  }
  return <div className="creator-page">
    <PageHeader eyebrow="Admin" title="Creator applications" description="Review private application materials and convert approved applicants into creators." />
    {message ? <p role="status">{message}</p> : null}
    <div className="filter-bar"><label>Search<input onChange={(event) => setSearch(event.target.value)} placeholder="Name, email or motivation" value={search} /></label><label>Status<select onChange={(event) => setFilter(event.target.value)} value={filter}><option value="">All review stages</option>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label></div>
    <SectionCard title="Applications">{loading ? <p role="status">Loading applications...</p> : applications.length ? applications.map((application) => <article className="dashboard-job-item" key={application.id}>
      <strong>{application.applicant?.name}</strong><span>{application.applicant?.email} - {application.status.replaceAll('_', ' ')}</span>
      <p><b>Experience:</b> {application.experience || application.statement}</p><p><b>Motivation:</b> {application.motivation || application.statement}</p>
      {application.portfolioUrl ? <a href={application.portfolioUrl} rel="noreferrer" target="_blank">Open portfolio</a> : null}{application.hasResume ? <button onClick={() => download(application)} type="button">Download private resume</button> : null}
      <label>Move to stage<select disabled={busyId === application.id} onChange={(event) => { if (event.target.value) change(application, event.target.value) }} value=""><option value="">Choose action</option>{statuses.filter((status) => status !== application.status).map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label>
      {(application.history || []).map((entry) => <small key={entry.id}>{entry.fromStatus || 'NEW'} to {entry.toStatus} - {new Date(entry.createdAt).toLocaleString()}</small>)}
    </article>) : <p>No applications found.</p>}</SectionCard>
  </div>
}
