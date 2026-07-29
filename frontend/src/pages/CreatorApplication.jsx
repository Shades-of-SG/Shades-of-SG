import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { getMyCreatorApplications, submitCreatorApplication } from '../services/applicationService'

export default function CreatorApplication() {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [form, setForm] = useState({ portfolioUrl: '', resumeUrl: '', statement: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getMyCreatorApplications(token).then(setApplications).catch((error) => setMessage(error.message))
  }, [token])

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const application = await submitCreatorApplication(form, token)
      setApplications((current) => [application, ...current])
      setMessage('Application submitted for admin review.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="standard-page">
    <PageHeader eyebrow="Creator programme" title="Apply to become a creator" description="Share your National Day music portfolio. Approved applicants receive creator access from a platform administrator." />
    <SectionCard title="Application">
      <form className="settings-form" onSubmit={submit}>
        <label>Resume URL<input type="url" value={form.resumeUrl} onChange={(event) => setForm({ ...form, resumeUrl: event.target.value })} /></label>
        <label>Portfolio URL<input type="url" value={form.portfolioUrl} onChange={(event) => setForm({ ...form, portfolioUrl: event.target.value })} /></label>
        <label>Why would you like to contribute?<textarea minLength="50" maxLength="5000" required value={form.statement} onChange={(event) => setForm({ ...form, statement: event.target.value })} /></label>
        <button className="studio-button studio-button--primary" disabled={busy} type="submit">{busy ? 'Submitting…' : 'Submit application'}</button>
      </form>
      {message ? <p role="status">{message}</p> : null}
    </SectionCard>
    <SectionCard title="Application history">
      {applications.length ? applications.map((application) => <article className="dashboard-job-item" key={application.id}><strong>{application.status.replaceAll('_', ' ')}</strong><span>Submitted {new Date(application.createdAt).toLocaleString()}</span>{application.adminNotes ? <p>{application.adminNotes}</p> : null}</article>) : <p>No applications yet.</p>}
    </SectionCard>
  </div>
}

