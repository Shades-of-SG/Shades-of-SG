import {
  AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Home,
  Lightbulb, LoaderCircle, LockKeyhole, Save, ShieldCheck, Sparkles,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ApplicationHistory from '../components/creatorApplication/ApplicationHistory'
import ApplicationProgress from '../components/creatorApplication/ApplicationProgress'
import CharacterField from '../components/creatorApplication/CharacterField'
import ResumeUpload from '../components/creatorApplication/ResumeUpload'
import { formatDate, STATUS_LABELS } from '../components/creatorApplication/applicationPresentation'
import { useAuth } from '../context/AuthContext'
import {
  downloadCreatorResume, getMyCreatorApplications, removeCreatorResume,
  saveCreatorApplicationDraft, submitCreatorApplicationDraft,
  uploadCreatorResume, withdrawCreatorApplication,
} from '../services/applicationService'
import './CreatorApplication.css'

const EMPTY_FORM = { contentIdeas: '', experience: '', guidelinesAccepted: false, introduction: '', motivation: '', portfolioUrl: '' }
const EDITABLE_STATUSES = ['DRAFT', 'CHANGES_REQUESTED']
const IN_REVIEW_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW']
const MAX_RESUME_SIZE = 5 * 1024 * 1024
const STEPS = [
  { shortTitle: 'About You', title: 'Let’s start with you', description: 'Tell us a little about yourself and your interest in preserving Singapore’s musical and cultural stories.' },
  { shortTitle: 'Experience', title: 'Share your experience', description: 'Share any creative, cultural, educational, music, design or community experience. Formal experience is not required.' },
  { shortTitle: 'Contribution', title: 'What would you like to create?', description: 'Tell us what you hope to create and how your work could contribute to Shades of SG.' },
  { shortTitle: 'Review', title: 'Review your application', description: 'Take a moment to check your answers. You can edit any section before sending it to our team.' },
]

function isValidWebUrl(value) {
  if (!value.trim()) return true
  try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
}

function replaceApplication(items, next) {
  const current = items.find((item) => item.id === next.id)
  const merged = { ...current, ...next, history: next.history || current?.history || [] }
  return current ? items.map((item) => item.id === next.id ? merged : item) : [merged, ...items]
}

function ReviewSection({ children, onEdit, step, title }) {
  return <section className="creator-review-section"><div className="creator-review-section__heading"><h3>{title}</h3><button onClick={() => onEdit(step)} type="button">Edit <span className="sr-only">{title}</span></button></div>{children}</section>
}

export default function CreatorApplication() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(EMPTY_FORM))
  const [activeStep, setActiveStep] = useState(0)
  const [furthestStep, setFurthestStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState({ message: '', type: 'status' })
  const [upload, setUpload] = useState({ fileName: '', progress: 0, state: 'idle' })
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submittedApplication, setSubmittedApplication] = useState(null)
  const draft = useMemo(() => applications.find((item) => EDITABLE_STATUSES.includes(item.status)), [applications])
  const active = useMemo(() => applications.find((item) => IN_REVIEW_STATUSES.includes(item.status)), [applications])
  const isDirty = JSON.stringify(form) !== savedSnapshot

  const refresh = useCallback(async ({ hydrateForm = false } = {}) => {
    const items = await getMyCreatorApplications(token)
    setApplications(items)
    const savedDraft = items.find((item) => EDITABLE_STATUSES.includes(item.status))
    if (hydrateForm && savedDraft) {
      const values = {
        contentIdeas: savedDraft.contentIdeas || '', experience: savedDraft.experience || '',
        guidelinesAccepted: Boolean(savedDraft.guidelinesAccepted), introduction: savedDraft.introduction || '',
        motivation: savedDraft.motivation || '', portfolioUrl: savedDraft.portfolioUrl || '',
      }
      setForm(values)
      setSavedSnapshot(JSON.stringify(values))
    }
    return items
  }, [token])

  useEffect(() => {
    let live = true
    refresh({ hydrateForm: true }).catch((error) => {
      if (live) setFeedback({ message: error.message, type: 'error' })
    }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [refresh])

  useEffect(() => {
    const protectDraft = (event) => {
      if (!isDirty || submittedApplication) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', protectDraft)
    return () => window.removeEventListener('beforeunload', protectDraft)
  }, [isDirty, submittedApplication])

  useEffect(() => {
    const protectClientNavigation = (event) => {
      if (!isDirty || submittedApplication || event.defaultPrevented) return
      const link = event.target.closest?.('a[href]')
      if (!link || link.getAttribute('href')?.startsWith('#')) return
      if (!window.confirm('You have unsaved application changes. Leave without saving them?')) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    document.addEventListener('click', protectClientNavigation, true)
    return () => document.removeEventListener('click', protectClientNavigation, true)
  }, [isDirty, submittedApplication])

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined, summary: undefined }))
    setFeedback({ message: '', type: 'status' })
  }

  function validate(step = activeStep, all = false) {
    const next = {}
    const check = (index) => all || step === index
    if (check(0) && !form.introduction.trim()) next.introduction = 'Please add a short introduction.'
    if (check(1)) {
      if (!form.experience.trim()) next.experience = 'Please tell us about your relevant experience.'
      if (!isValidWebUrl(form.portfolioUrl)) next.portfolioUrl = 'Enter a complete link beginning with http:// or https://.'
    }
    if (check(2)) {
      if (form.motivation.trim().length < 50) next.motivation = 'Please write at least 50 characters so we can understand your motivation.'
      if (!form.contentIdeas.trim()) next.contentIdeas = 'Please share at least one content idea.'
    }
    if (check(3) || all) {
      if (!form.guidelinesAccepted) next.guidelinesAccepted = 'Please agree to the creator guidelines before submitting.'
      if (!draft?.hasResume && !form.portfolioUrl.trim()) next.materials = 'Add a portfolio link or upload a resume before submitting.'
    }
    if (Object.keys(next).length) next.summary = `Please review ${Object.keys(next).length} ${Object.keys(next).length === 1 ? 'item' : 'items'} before continuing.`
    setErrors(next)
    return next
  }

  async function persistDraft({ announce = false } = {}) {
    const saved = await saveCreatorApplicationDraft(form, token)
    setApplications((items) => replaceApplication(items, saved))
    setSavedSnapshot(JSON.stringify(form))
    if (announce) setFeedback({ message: 'Draft saved privately. You can safely return later.', type: 'success' })
    return saved
  }

  async function saveDraft() {
    setBusy(true); setFeedback({ message: '', type: 'status' })
    try { await persistDraft({ announce: true }) } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function saveAndExit() {
    setBusy(true); setFeedback({ message: '', type: 'status' })
    try { await persistDraft(); navigate('/') } catch (error) { setFeedback({ message: error.message, type: 'error' }); setBusy(false) }
  }

  async function continueToNextStep() {
    if (Object.keys(validate()).length) return
    setBusy(true); setFeedback({ message: '', type: 'status' })
    try {
      await persistDraft()
      const next = Math.min(activeStep + 1, STEPS.length - 1)
      setActiveStep(next); setFurthestStep((value) => Math.max(value, next)); window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  function editStep(step) {
    setErrors({}); setActiveStep(step); setFurthestStep((value) => Math.max(value, step)); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function selectResume(file) {
    const extension = file.name.toLowerCase().split('.').pop()
    if (!['pdf', 'docx'].includes(extension)) {
      setErrors((value) => ({ ...value, resume: 'Choose a PDF or DOCX file.' })); return
    }
    if (file.size > MAX_RESUME_SIZE) {
      setErrors((value) => ({ ...value, resume: 'This file is larger than 5 MB. Choose a smaller resume.' })); return
    }
    if (!file.size) {
      setErrors((value) => ({ ...value, resume: 'This file is empty. Choose another resume.' })); return
    }
    setBusy(true); setErrors((value) => ({ ...value, resume: undefined, materials: undefined })); setFeedback({ message: '', type: 'status' })
    setUpload({ fileName: file.name, progress: 0, state: 'uploading' })
    try {
      const saved = await persistDraft()
      const uploaded = await uploadCreatorResume(saved.id, file, token, (progress) => setUpload((value) => ({ ...value, progress })))
      setApplications((items) => replaceApplication(items, uploaded))
      setUpload({ fileName: file.name, progress: 100, state: 'complete' })
      setFeedback({ message: `${file.name} uploaded and saved privately.`, type: 'success' })
    } catch (error) {
      setUpload({ fileName: file.name, progress: 0, state: 'error' })
      setErrors((value) => ({ ...value, resume: error.message }))
    } finally { setBusy(false) }
  }

  async function removeResume() {
    if (!draft || !window.confirm(`Remove ${draft.resumeFileName} from this draft?`)) return
    setBusy(true); setFeedback({ message: '', type: 'status' })
    try {
      await removeCreatorResume(draft.id, token)
      setApplications((items) => items.map((item) => item.id === draft.id ? { ...item, hasResume: false, resumeFileName: null, resumeFileSize: null, resumeMimeType: null } : item))
      setUpload({ fileName: '', progress: 0, state: 'idle' })
      setFeedback({ message: 'Resume removed from your private draft.', type: 'success' })
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function downloadResume(application) {
    try {
      const blob = await downloadCreatorResume(application.id, token)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url; link.download = application.resumeFileName || 'resume'; link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) }
  }

  async function submit() {
    const validation = validate(activeStep, true)
    if (Object.keys(validation).length) {
      if (validation.introduction) editStep(0)
      else if (validation.experience || validation.portfolioUrl) editStep(1)
      else if (validation.motivation || validation.contentIdeas) editStep(2)
      return
    }
    setBusy(true); setFeedback({ message: '', type: 'status' })
    try {
      const saved = await persistDraft()
      const result = await submitCreatorApplicationDraft(saved.id, token)
      setSubmittedApplication(result.application)
      await refresh()
      setSavedSnapshot(JSON.stringify(form))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function withdraw(application) {
    if (!window.confirm(`Withdraw this ${application.status === 'DRAFT' ? 'draft' : 'creator application'}? This cannot be undone.`)) return
    setBusy(true)
    try {
      await withdrawCreatorApplication(application.id, '', token)
      await refresh({ hydrateForm: application.id === draft?.id })
      if (application.id === draft?.id) { setForm(EMPTY_FORM); setSavedSnapshot(JSON.stringify(EMPTY_FORM)); setActiveStep(0); setFurthestStep(0) }
      setFeedback({ message: 'Application withdrawn.', type: 'success' })
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  function continueDraft() {
    setActiveStep(0); setFurthestStep(0); document.querySelector('.creator-application-card')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) return <div className="creator-application-page"><div className="creator-application-loading" role="status"><LoaderCircle className="is-spinning" /><strong>Loading your application</strong><span>Retrieving your private draft and application history…</span></div></div>

  return <div className="creator-application-page">
    <header className="creator-application-hero">
      <p className="creator-application-eyebrow"><Sparkles /> Creator programme</p>
      <h1>Become a Shades of SG Creator</h1>
      <p>Help bring Singapore’s songs, memories and cultural stories to life. Tell us about yourself, your ideas and how you would like to contribute.</p>
      <div className="creator-application-private-note"><LockKeyhole />Your draft is saved privately and is only visible to you and authorised administrators.</div>
    </header>

    {feedback.message ? <div className={`creator-application-feedback creator-application-feedback--${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.type === 'error' ? <AlertCircle /> : <CheckCircle2 />}<span>{feedback.message}</span></div> : null}

    {submittedApplication ? <section className="creator-submission-confirmation">
      <span className="creator-submission-confirmation__icon"><Check /></span>
      <p className="creator-application-eyebrow">Application submitted</p>
      <h2>Thank you for applying, {user?.name?.split(' ')[0] || 'creator'}!</h2>
      <p>Our team will review your application and update you by email when its status changes.</p>
      <dl><div><dt>Application reference</dt><dd>{submittedApplication.id.slice(0, 8).toUpperCase()}</dd></div><div><dt>Submitted</dt><dd>{formatDate(submittedApplication.submittedAt)}</dd></div><div><dt>Current status</dt><dd><span className="creator-status creator-status--submitted">Submitted</span></dd></div></dl>
      <div className="creator-submission-confirmation__next"><h3>What happens next?</h3><ol><li className="is-complete"><span><Check /></span><div><strong>Application received</strong><p>Your answers and private materials are safely stored.</p></div></li><li><span>2</span><div><strong>Team review</strong><p>An authorised administrator will review your experience and ideas.</p></div></li><li><span>3</span><div><strong>We’ll update you</strong><p>You may receive an outcome or a request for additional information.</p></div></li></ol></div>
      <div className="creator-submission-confirmation__actions"><a className="creator-button creator-button--primary" href="#application-history">View application status <ArrowRight /></a><Link className="creator-button creator-button--secondary" to="/"><Home />Return home</Link></div>
    </section> : null}

    {!submittedApplication && !active ? <section className="creator-application-card">
      <ApplicationProgress currentStep={activeStep} maxStep={furthestStep} onStepChange={editStep} steps={STEPS} />
      <div className="creator-application-card__body">
        <div className="creator-application-step-heading"><p>Step {activeStep + 1} of {STEPS.length}</p><h2>{STEPS[activeStep].title}</h2><span>{STEPS[activeStep].description}</span></div>
        {errors.summary ? <div className="creator-validation-summary" role="alert"><AlertCircle /><div><strong>{errors.summary}</strong><p>Fields that need attention are marked below.</p></div></div> : null}

        {activeStep === 0 ? <div className="creator-application-form-grid">
          <label className="creator-application-field"><span>Full name</span><small>This comes from your Shades of SG profile.</small><input disabled value={user?.name || ''} /></label>
          <label className="creator-application-field"><span>Email</span><small>We’ll send application updates to this address.</small><input disabled value={user?.email || ''} /></label>
          <CharacterField error={errors.introduction} help="For example, tell us what connects you to Singapore’s music, heritage or communities." label="Short introduction" maxLength={2000} onChange={(event) => updateField('introduction', event.target.value)} rows={6} value={form.introduction} />
        </div> : null}

        {activeStep === 1 ? <div className="creator-application-form-grid">
          <CharacterField error={errors.experience} help="Personal projects, volunteering, school work and community activities all count." label="Relevant experience" maxLength={5000} onChange={(event) => updateField('experience', event.target.value)} rows={7} value={form.experience} />
          <label className={`creator-application-field${errors.portfolioUrl ? ' has-error' : ''}`} htmlFor="creator-portfolio-url"><span>Portfolio URL <em>Optional with a resume</em></span><small id="creator-portfolio-help">Link to a website, shared portfolio, video channel or other example of your work.</small><input aria-describedby={`creator-portfolio-help${errors.portfolioUrl ? ' creator-portfolio-error' : ''}`} aria-invalid={Boolean(errors.portfolioUrl)} id="creator-portfolio-url" onChange={(event) => updateField('portfolioUrl', event.target.value)} placeholder="https://your-portfolio.example" type="url" value={form.portfolioUrl} />{errors.portfolioUrl ? <small className="creator-application-field__error" id="creator-portfolio-error">{errors.portfolioUrl}</small> : null}</label>
          <ResumeUpload application={draft} busy={busy} error={errors.resume} onDownload={() => downloadResume(draft)} onRemove={removeResume} onSelect={selectResume} upload={upload} />
        </div> : null}

        {activeStep === 2 ? <div className="creator-application-form-grid">
          <CharacterField error={errors.motivation} help="What draws you to the mission, and what perspective would you bring? Minimum 50 characters." label="Why would you like to contribute?" maxLength={5000} minLength={50} onChange={(event) => updateField('motivation', event.target.value)} rows={7} value={form.motivation} />
          <CharacterField error={errors.contentIdeas} help="For example: an NDP-song visual story, an oral-history feature, or a learning activity." label="Proposed NDP-song or cultural content ideas" maxLength={5000} onChange={(event) => updateField('contentIdeas', event.target.value)} rows={7} value={form.contentIdeas} />
        </div> : null}

        {activeStep === 3 ? <div className="creator-review">
          <ReviewSection onEdit={editStep} step={0} title="About you"><dl><div><dt>Full name</dt><dd>{user?.name}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div><div className="is-wide"><dt>Introduction</dt><dd>{form.introduction || 'Not provided'}</dd></div></dl></ReviewSection>
          <ReviewSection onEdit={editStep} step={1} title="Experience"><dl><div className="is-wide"><dt>Relevant experience</dt><dd>{form.experience || 'Not provided'}</dd></div><div><dt>Portfolio</dt><dd>{form.portfolioUrl ? <a href={form.portfolioUrl} rel="noreferrer" target="_blank">Open portfolio</a> : 'Not added'}</dd></div><div><dt>Resume</dt><dd>{draft?.hasResume ? <span className="creator-review__upload"><CheckCircle2 />{draft.resumeFileName} · Upload complete</span> : 'Not uploaded'}</dd></div></dl></ReviewSection>
          <ReviewSection onEdit={editStep} step={2} title="Your contribution"><dl><div className="is-wide"><dt>Why you’d like to contribute</dt><dd>{form.motivation || 'Not provided'}</dd></div><div className="is-wide"><dt>Content ideas</dt><dd>{form.contentIdeas || 'Not provided'}</dd></div></dl></ReviewSection>
          {errors.materials ? <p className="creator-review__error" role="alert"><AlertCircle />{errors.materials} <button onClick={() => editStep(1)} type="button">Add materials</button></p> : null}
          <label className={`creator-guidelines${errors.guidelinesAccepted ? ' has-error' : ''}`}><input checked={form.guidelinesAccepted} onChange={(event) => updateField('guidelinesAccepted', event.target.checked)} type="checkbox" /><span><strong>I agree to the creator guidelines</strong><small>I will submit respectful, accurate and appropriate content about Singapore’s music and cultural stories.</small>{errors.guidelinesAccepted ? <em>{errors.guidelinesAccepted}</em> : null}</span></label>
          <div className="creator-review__privacy"><ShieldCheck /><p><strong>Your application stays private</strong>Only you and authorised administrators can view your draft, answers and resume.</p></div>
        </div> : null}
      </div>

      <footer className="creator-application-card__footer">
        <button className="creator-button creator-button--text" disabled={busy} onClick={saveAndExit} type="button"><Clock3 />Save & exit</button>
        <div>
          {activeStep > 0 ? <button className="creator-button creator-button--secondary" disabled={busy} onClick={() => setActiveStep((value) => value - 1)} type="button"><ArrowLeft />Back</button> : null}
          <button className="creator-button creator-button--secondary" disabled={busy} onClick={saveDraft} type="button">{busy ? <LoaderCircle className="is-spinning" /> : <Save />}Save draft</button>
          {activeStep < STEPS.length - 1 ? <button className="creator-button creator-button--primary" disabled={busy || upload.state === 'uploading'} onClick={continueToNextStep} type="button">{busy ? <LoaderCircle className="is-spinning" /> : null}Continue <ArrowRight /></button> : <button className="creator-button creator-button--primary" disabled={busy || upload.state === 'uploading'} onClick={submit} type="button">{busy ? <LoaderCircle className="is-spinning" /> : null}Submit application <ArrowRight /></button>}
        </div>
      </footer>
    </section> : null}

    {!submittedApplication && active ? <section className="creator-active-application"><span><Lightbulb /></span><div><p className="creator-application-eyebrow">Application in progress</p><h2>{STATUS_LABELS[active.status]}</h2><p>Your submitted application is read-only while our team reviews it. We’ll email you when its status changes.</p><a className="creator-button creator-button--primary" href="#application-history">View current status <ArrowRight /></a></div></section> : null}

    <ApplicationHistory applications={applications} busy={busy} onContinue={continueDraft} onDownload={downloadResume} onWithdraw={withdraw} />
  </div>
}
