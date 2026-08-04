import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useDebouncedValue from '../hooks/useDebouncedValue'
import { requestPasswordReset } from '../services/authApi'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  const navigate = useNavigate(); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [fieldErrors, setFieldErrors] = useState({})
  const debouncedEmail = useDebouncedValue(email.trim(), 400)
  useEffect(() => {
    if (!debouncedEmail) return
    setFieldErrors((current) => ({ ...current, email: EMAIL_PATTERN.test(debouncedEmail) ? '' : 'Enter a valid email address.' }))
  }, [debouncedEmail])
  async function submit(event) {
    event.preventDefault(); setError('')
    const normalized = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalized)) { setFieldErrors({ email: 'Enter a valid email address.' }); return }
    setBusy(true)
    try { await requestPasswordReset(normalized); sessionStorage.setItem('passwordResetEmail', normalized); navigate('/reset-password', { state: { email: normalized } }) } catch { setError('Unable to process the request right now. Please try again later.') } finally { setBusy(false) }
  }
  return <form className="auth-form" onSubmit={submit}><p className="eyebrow">Account recovery</p><h1>Forgot password</h1><p>Enter your email. If an eligible account exists, we will send a six-digit reset code.</p><label className="field-stack"><span>Email</span><input aria-describedby={fieldErrors.email ? 'forgot-password-email-error' : undefined} aria-invalid={Boolean(fieldErrors.email)} autoComplete="email" onChange={(event) => { setEmail(event.target.value); setFieldErrors((current) => ({ ...current, email: '' })) }} required type="email" value={email} />{fieldErrors.email ? <span className="field-hint field-hint--error" id="forgot-password-email-error">{fieldErrors.email}</span> : null}</label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="primary-button" disabled={busy} type="submit">{busy ? 'Sending...' : 'Send reset code'}</button><p><Link to="/login">Back to sign in</Link></p></form>
}
