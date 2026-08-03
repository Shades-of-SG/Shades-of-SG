import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resendRegistrationOtp, verifyRegistrationOtp } from '../services/authApi'

export default function OtpVerification() {
  const location = useLocation(); const navigate = useNavigate()
  const { signIn } = useAuth()
  const email = location.state?.email || sessionStorage.getItem('pendingVerificationEmail') || ''
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(60)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (!cooldown) return undefined; const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer) }, [cooldown])
  async function verify(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      const data = await verifyRegistrationOtp(email, code)
      if (!data?.token || !data?.user) throw new Error('The verification response was incomplete.')
      signIn(data.user, data.token)
      sessionStorage.removeItem('pendingVerificationEmail')
      navigate('/registration-success', { replace: true })
    } catch (nextError) {
      setError(nextError.status === 429 ? 'Too many incorrect attempts. Request a new code.' : 'The code is invalid or expired.')
    } finally { setBusy(false) }
  }
  async function resend() {
    setError(''); setMessage(''); setBusy(true)
    try { await resendRegistrationOtp(email); setCooldown(60); setMessage('A new code has been sent. Previous codes no longer work.') } catch (nextError) { setError(nextError.status === 429 ? `Please wait ${nextError.retryAfter || 60} seconds before resending.` : 'We could not send another code. Try again later.') } finally { setBusy(false) }
  }
  if (!email) return <div className="auth-form"><h1>Verification session missing</h1><p>Start registration again to receive a code.</p><Link to="/register">Create account</Link></div>
  return <form className="auth-form" onSubmit={verify}><p className="eyebrow">Email verification</p><h1>Enter your six-digit code</h1><p>We sent a code to <strong>{email}</strong>. It expires after 10 minutes.</p><label className="field-stack"><span>Verification code</span><input autoComplete="one-time-code" inputMode="numeric" maxLength="6" onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} pattern="\d{6}" required value={code} /></label>{error ? <p className="form-error" role="alert">{error}</p> : null}{message ? <p role="status">{message}</p> : null}<button className="primary-button" disabled={busy || code.length !== 6} type="submit">{busy ? 'Checking...' : 'Verify email'}</button><button disabled={busy || cooldown > 0} onClick={resend} type="button">{cooldown ? `Resend available in ${cooldown}s` : 'Resend code'}</button><p><Link to="/login">Back to sign in</Link></p></form>
}
