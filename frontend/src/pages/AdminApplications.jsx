import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { getAdminApplications, updateApplicationStatus } from '../services/adminService'

const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED']

export default function AdminApplications() {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [message, setMessage] = useState('')
  const refresh = useCallback(() => getAdminApplications(token).then((data) => setApplications(data.applications)).catch((error) => setMessage(error.message)), [token])
  useEffect(() => { refresh() }, [refresh])
  const change = async (id, status) => { try { await updateApplicationStatus(id, { status }, token); setMessage(`Application moved to ${status}.`); refresh() } catch (error) { setMessage(error.message) } }
  return <div className="creator-page"><PageHeader eyebrow="Admin" title="Creator applications" description="Review applicants and convert approved accounts into creators." />{message ? <p role="status">{message}</p> : null}<SectionCard title="Applications">{applications.length ? applications.map((application) => <article className="dashboard-job-item" key={application.id}><strong>{application.applicant?.name}</strong><span>{application.applicant?.email} · {application.status.replaceAll('_', ' ')}</span><p>{application.statement}</p><div className="creator-song-actions">{statuses.filter((status) => status !== application.status).map((status) => <button className="studio-button studio-button--secondary" key={status} onClick={() => change(application.id, status)} type="button">{status.replaceAll('_', ' ')}</button>)}</div></article>) : <p>No applications found.</p>}</SectionCard></div>
}
