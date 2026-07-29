import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import {
  downloadCreatorResume, getMyCreatorApplications, removeCreatorResume,
  saveCreatorApplicationDraft, submitCreatorApplicationDraft,
  uploadCreatorResume, withdrawCreatorApplication,
} from '../services/applicationService'

const EMPTY_FORM = { experience: '', motivation: '', portfolioUrl: '' }

export default function CreatorApplication() {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [resume, setResume] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const draft = useMemo(() => applications.find((item) => item.status === 'DRAFT'), [applications])
  const active = useMemo(() => applications.find((item) => ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW'].includes(item.status)), [applications])

  const refresh = useCallback(async () => {
    try {
      const items = await getMyCreatorApplications(token)
      setApplications(items)
      const savedDraft = items.find((item) => item.status === 'DRAFT')
      if (savedDraft) setForm({ experience: savedDraft.experience || '', motivation: savedDraft.motivation || '', portfolioUrl: savedDraft.portfolioUrl || '' })
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }, [token])

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  const save = async () => {
    const saved = await saveCreatorApplicationDraft(form, token)
    if (resume) await uploadCreatorResume(saved.id, resume, token)
    setResume(null)
    await refresh()
    return saved.id
  }

  const saveDraft = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('')
    try { await save(); setMessage('Draft saved privately.') } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  const submit = async () => {
    setBusy(true); setMessage('')
    try {
      const id = await save()
      await submitCreatorApplicationDraft(id, token)
      await refresh()
      setMessage('Application submitted for administrator review.')
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  const withdraw = async (application) => {
    if (!window.confirm('Withdraw this creator application?')) return
    setBusy(true)
    try { await withdrawCreatorApplication(application.id, '', token); await refresh(); setMessage('Application withdrawn.') } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  const removeResume = async () => {
    if (!draft) return
    setBusy(true)
    try { await removeCreatorResume(draft.id, token); await refresh(); setMessage('Resume removed.') } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  const downloadResume = async (application) => {
    try {
      const blob = await downloadCreatorResume(application.id, token)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url; link.download = application.resumeFileName || 'resume'; link.click()
      URL.revokeObjectURL(url)
    } catch (error) { setMessage(error.message) }
  }

  return <div className="standard-page">
    <PageHeader eyebrow="Creator programme" title="Apply to become a creator" description="Save a private draft, submit your portfolio, and follow each review stage." />
    {message ? <p role="status">{message}</p> : null}
    {loading ? <p role="status">Loading application...</p> : null}
    {!loading && !active ? <SectionCard title={draft ? 'Application draft' : 'Start an application'}>
      <form className="settings-form" onSubmit={saveDraft}>
        <label>Relevant experience<textarea maxLength="5000" required value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} /></label>
        <label>Why would you like to contribute?<textarea minLength="50" maxLength="5000" required value={form.motivation} onChange={(event) => setForm({ ...form, motivation: event.target.value })} /></label>
        <label>Portfolio URL (optional with resume)<input type="url" value={form.portfolioUrl} onChange={(event) => setForm({ ...form, portfolioUrl: event.target.value })} /></label>
        <label>Private resume (PDF, DOC or DOCX; 5 MB maximum)<input accept=".pdf,.doc,.docx" onChange={(event) => setResume(event.target.files?.[0] || null)} type="file" /></label>
        {draft?.hasResume ? <p>Stored privately: {draft.resumeFileName} <button onClick={() => downloadResume(draft)} type="button">Download</button> <button disabled={busy} onClick={removeResume} type="button">Remove</button></p> : null}
        <div className="creator-song-actions"><button className="studio-button studio-button--secondary" disabled={busy} type="submit">Save draft</button><button className="studio-button studio-button--primary" disabled={busy} onClick={submit} type="button">Submit for review</button></div>
      </form>
    </SectionCard> : null}
    <SectionCard title="Application history">
      {applications.length ? applications.map((application) => <article className="dashboard-job-item" key={application.id}>
        <strong>{application.status.replaceAll('_', ' ')}</strong>
        <span>{application.submittedAt ? `Submitted ${new Date(application.submittedAt).toLocaleString()}` : `Updated ${new Date(application.updatedAt).toLocaleString()}`}</span>
        {application.applicantFeedback ? <p>Administrator feedback: {application.applicantFeedback}</p> : null}
        {application.hasResume ? <button onClick={() => downloadResume(application)} type="button">Download submitted resume</button> : null}
        {['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(application.status) ? <button disabled={busy} onClick={() => withdraw(application)} type="button">Withdraw</button> : null}
        {(application.history || []).map((entry) => <small key={entry.id}>{entry.toStatus.replaceAll('_', ' ')} - {new Date(entry.createdAt).toLocaleString()}{entry.note ? `: ${entry.note}` : ''}</small>)}
      </article>) : <p>No applications yet.</p>}
    </SectionCard>
  </div>
}
