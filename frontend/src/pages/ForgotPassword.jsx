import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requestPasswordReset } from '../services/authApi'

export default function ForgotPassword() {
  const navigate = useNavigate(); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); const normalized = email.trim().toLowerCase(); try { await requestPasswordReset(normalized); sessionStorage.setItem('passwordResetEmail', normalized); navigate('/reset-password', { state: { email: normalized } }) } catch { setError('Unable to process the request right now. Please try again later.') } finally { setBusy(false) } }
  return <form className="auth-form" onSubmit={submit}><p className="eyebrow">Account recovery</p><h1>Forgot password</h1><p>Enter your email. If an eligible account exists, we will send a six-digit reset code.</p><label className="field-stack"><span>Email</span><input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="primary-button" disabled={busy} type="submit">{busy ? 'Sending...' : 'Send reset code'}</button><p><Link to="/login">Back to sign in</Link></p></form>
}
