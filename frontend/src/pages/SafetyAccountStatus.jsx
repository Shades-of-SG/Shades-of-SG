import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bell, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import SettingsNav from '../components/SettingsNav'
import { useAuth } from '../context/AuthContext'
import { acknowledgeMyWarning, getMySafetyStatus, markSafetyNotificationRead } from '../services/userSafetyService'
import '../Settings.css'

const labels = {
  ACKNOWLEDGED: 'Acknowledged', ACTIVE: 'Active', RESOLVED: 'Resolved', WITHDRAWN: 'Withdrawn',
  COPYRIGHT_CONCERN: 'Copyright concern', DANGEROUS_CONTENT: 'Dangerous or self-harm-related content',
  HARASSMENT: 'Harassment or bullying', HATE: 'Hate or discriminatory content', IMPERSONATION: 'Impersonation',
  MISLEADING_CONTENT: 'Misleading content', OFF_TOPIC: 'Off-topic content', OTHER: 'Other',
  PERSONAL_INFORMATION: 'Personal information exposure', PLATFORM_MISUSE: 'Platform misuse',
  SEXUAL_CONTENT: 'Sexual or inappropriate content', SPAM: 'Spam or repeated promotion', THREATS: 'Threats or encouragement of violence',
}

const dateText = (value) => value ? new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not recorded'

function WarningCard({ busy, focus, onAcknowledge, warning }) {
  return <article className={`safety-warning-card is-${warning.status.toLowerCase()}${focus ? ' is-focused' : ''}`} id={`warning-${warning.id}`}>
    <header><div><span className="safety-status-text">{labels[warning.status] || warning.status}</span><h3>{labels[warning.category] || warning.category}</h3></div><time dateTime={warning.createdAt}>{dateText(warning.createdAt)}</time></header>
    <section><h4>What happened</h4><p>{warning.userFacingReason}</p></section>
    {warning.statusExplanation ? <section className="safety-warning-status-explanation"><h4>Current outcome</h4><p>{warning.statusExplanation}</p></section> : null}
    <section><h4>Action and access</h4><p>{warning.actionTaken}</p></section>
    {warning.target ? <section className="safety-affected-content"><h4>Affected content</h4><p><strong>{warning.target.title}</strong> · {warning.target.status}</p>{warning.target.summary ? <p>{warning.target.summary}</p> : null}<Link to={warning.target.link}>Open safe private or public view <ExternalLink aria-hidden="true" /></Link></section> : null}
    <section><h4>Next step</h4><p>{warning.requiredNextStep}</p><p>{warning.status === 'WITHDRAWN' ? 'A withdrawn warning is not an upheld issue and does not indicate that you remain in violation.' : 'Repeated upheld issues may lead to further content or access review, but any restriction requires a separate administrator decision.'}</p></section>
    <footer>
      {warning.mustAcknowledge ? <button disabled={busy} onClick={() => onAcknowledge(warning)} type="button">{busy ? 'Acknowledging…' : 'Acknowledge warning'}</button> : <span><CheckCircle2 aria-hidden="true" />{warning.status === 'ACKNOWLEDGED' ? `Seen ${dateText(warning.acknowledgedAt)}` : warning.status === 'WITHDRAWN' ? `Withdrawn ${dateText(warning.withdrawnAt)}` : warning.status === 'RESOLVED' ? `Resolved ${dateText(warning.resolvedAt)}` : 'No acknowledgement required'}</span>}
      <small>Acknowledgement records that you saw this warning. It is not an admission and does not restore or remove content or access.</small>
    </footer>
  </article>
}

export default function SafetyAccountStatus() {
  const { token } = useAuth()
  const [params] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState('')
  const focusId = params.get('warning') || ''
  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await getMySafetyStatus(token)); setError('') }
    catch (nextError) { setError(nextError.message) }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])
  useEffect(() => {
    if (!data || !focusId) return
    const frame = window.requestAnimationFrame(() => document.getElementById(`warning-${focusId}`)?.scrollIntoView?.({ block: 'center' }))
    return () => window.cancelAnimationFrame(frame)
  }, [data, focusId])
  const groups = useMemo(() => ({
    active: data?.warnings?.filter((item) => item.status === 'ACTIVE') || [],
    acknowledged: data?.warnings?.filter((item) => item.status === 'ACKNOWLEDGED') || [],
    history: data?.warnings?.filter((item) => ['RESOLVED', 'WITHDRAWN'].includes(item.status)) || [],
  }), [data])
  async function acknowledge(warning) {
    if (!window.confirm('Acknowledge that you have seen this warning? This does not admit liability, resolve the warning, or restore content or access.')) return
    setBusyId(warning.id); setMessage('')
    try { await acknowledgeMyWarning(warning.id, token); setMessage('Warning acknowledged. The original warning and any separate moderation action remain unchanged.'); await load() }
    catch (nextError) { setError(nextError.message) }
    finally { setBusyId('') }
  }
  async function openNotification(notification) {
    if (!notification.readAt) {
      try { await markSafetyNotificationRead(notification.id, token); setData((current) => ({ ...current, notifications: current.notifications.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item) })) }
      catch { /* The warning record remains authoritative if read-state delivery fails. */ }
    }
  }
  return <div className="account-settings safety-account-status">
    <header className="account-settings__hero"><p>Account centre</p><h1>Safety &amp; Account Status</h1><span>Review formal warnings and moderation decisions that affect your account or content.</span></header>
    <SettingsNav />
    {message ? <div aria-live="polite" className="account-settings__message" role="status">{message}</div> : null}
    {error ? <div className="safety-account-error" role="alert"><p>{error}</p><button onClick={load} type="button">Try again</button></div> : null}
    {loading ? <p aria-live="polite" className="safety-account-loading" role="status">Loading safety and account status…</p> : null}
    {!loading && data ? <main className="safety-account-content">
      <section className="account-settings__section"><div className="account-settings__heading"><ShieldCheck aria-hidden="true" /><div><h2>Access status</h2><p>Member and creator access are managed independently.</p></div></div><div className="safety-access-grid"><article><strong>Member account</strong><span>{data.account.accountStatus}</span><p>{data.account.accountStatus === 'ACTIVE' ? 'Normal authenticated member features remain available.' : 'Normal authenticated features are blocked while this action remains in effect.'}</p></article>{data.account.isCreator ? <article><strong>Creator access</strong><span>{data.account.creatorAccessStatus}</span><p>{data.account.creatorAccessStatus === 'ACTIVE' ? 'Creator Studio is available.' : 'Creator Studio is blocked; normal member access and stored songs remain preserved.'}</p></article> : null}</div><p className="safety-appeal-note">No in-product appeal route currently exists. Contact <a href={data.appeal.supportPath}>Shades of SG support</a> for questions or restoration review.</p></section>
      <section className="account-settings__section"><div className="account-settings__heading"><Bell aria-hidden="true" /><div><h2>Notifications</h2><p>These alerts link to the authoritative warning or decision record below.</p></div></div>{data.notifications.length ? <ol className="safety-notification-list">{data.notifications.map((notification) => <li className={notification.readAt ? '' : 'is-unread'} key={notification.id}><Link onClick={() => openNotification(notification)} to={notification.link}><strong>{notification.title}</strong><span>{notification.message}</span><time dateTime={notification.createdAt}>{dateText(notification.createdAt)}</time></Link></li>)}</ol> : <p>No safety notifications.</p>}</section>
      {[['Active warnings', groups.active], ['Acknowledged warnings', groups.acknowledged], ['Resolved or withdrawn history', groups.history]].map(([title, warnings]) => <section className="account-settings__section safety-warning-group" key={title}><div className="account-settings__heading"><AlertTriangle aria-hidden="true" /><div><h2>{title}</h2><p>{warnings.length ? `${warnings.length} record${warnings.length === 1 ? '' : 's'}` : 'No records in this group.'}</p></div></div>{warnings.map((warning) => <WarningCard busy={busyId === warning.id} focus={focusId === warning.id} key={warning.id} onAcknowledge={acknowledge} warning={warning} />)}</section>)}
    </main> : null}
  </div>
}
