import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import useDebouncedValue from '../hooks/useDebouncedValue'
import PasswordToggle from './PasswordToggle'
import { completeEmailChange, requestEmailChange, verifyEmailChangeOtp } from '../services/authApi'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ChangeEmailFlow({ currentEmail, onClose, onComplete, token }) {
  const [step, setStep] = useState('password')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')
  const [changeToken, setChangeToken] = useState('')
  const [error, setError] = useState('')
  const [emailHint, setEmailHint] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const debouncedEmail = useDebouncedValue(newEmail.trim(), 400)

  useEffect(() => {
    if (!cooldown) return undefined
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (!debouncedEmail) { setEmailHint(''); return }
    const normalized = debouncedEmail.toLowerCase()
    if (!EMAIL_PATTERN.test(normalized)) { setEmailHint('Enter a valid email address.'); return }
    if (normalized === currentEmail.toLowerCase()) { setEmailHint('Enter an email address different from your current one.'); return }
    setEmailHint('')
  }, [debouncedEmail, currentEmail])

  async function submitPassword(event) {
    event.preventDefault()
    if (!password) return
    setStep('email')
    setError('')
  }

  async function submitEmail(event) {
    event.preventDefault()
    setError('')
    const normalized = newEmail.trim().toLowerCase()
    if (emailHint) return
    setBusy(true)
    try {
      const data = await requestEmailChange(password, normalized, token)
      setNewEmail(normalized)
      setCooldown(data?.resendCooldownSeconds || 60)
      setStep('otp')
    } catch (nextError) {
      if (nextError.status === 401) { setStep('password'); setError('Incorrect password. Enter your password again.') }
      else setError(nextError.message || 'Unable to request the code right now.')
    } finally {
      setBusy(false)
    }
  }

  async function submitOtp(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await verifyEmailChangeOtp(newEmail, code, token)
      setChangeToken(data.changeToken)
      await completeEmailChange(data.changeToken, token)
      setStep('done')
    } catch (nextError) {
      setError(nextError.status === 429 ? 'Too many attempts. Request another code later.' : (nextError.message || 'The code is invalid or expired.'))
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setError('')
    setBusy(true)
    try {
      const data = await requestEmailChange(password, newEmail, token)
      setCode('')
      setCooldown(data?.resendCooldownSeconds || 60)
    } catch (nextError) {
      setError(nextError.message || 'Unable to send another code right now.')
    } finally {
      setBusy(false)
    }
  }

  function finish() {
    onComplete?.()
  }

  return (
    <div className="account-flow-backdrop" onClick={(event) => { if (event.target === event.currentTarget && step !== 'done') onClose?.() }}>
      <div aria-modal="true" className="account-flow-modal" role="dialog">
        {step !== 'done' ? <button aria-label="Close" className="account-flow-modal__actions is-secondary" onClick={onClose} style={{ justifySelf: 'end', minHeight: 'auto', padding: 4 }} type="button"><X aria-hidden="true" size={18} /></button> : null}

        {step === 'password' ? (
          <form onSubmit={submitPassword}>
            <h2>Confirm your password</h2>
            <p>Enter your current password to change your email address.</p>
            <label>
              <span>Password</span>
              <span className="password-field" style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                <input autoComplete="current-password" onChange={(event) => { setPassword(event.target.value); setError('') }} required type={showPassword ? 'text' : 'password'} value={password} />
                <PasswordToggle isVisible={showPassword} onToggle={() => setShowPassword((current) => !current)} />
              </span>
            </label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <div className="account-flow-modal__actions">
              <button className="is-secondary" onClick={onClose} type="button">Cancel</button>
              <button disabled={!password} type="submit">Continue</button>
            </div>
          </form>
        ) : null}

        {step === 'email' ? (
          <form onSubmit={submitEmail}>
            <h2>New email address</h2>
            <p>We will send a six-digit code to verify this address.</p>
            <label>
              <span>New email</span>
              <input autoComplete="email" onChange={(event) => setNewEmail(event.target.value)} required type="email" value={newEmail} />
              {emailHint ? <span className="field-error">{emailHint}</span> : null}
            </label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <div className="account-flow-modal__actions">
              <button className="is-secondary" onClick={() => setStep('password')} type="button">Back</button>
              <button disabled={busy || !newEmail.trim() || Boolean(emailHint)} type="submit">{busy ? 'Sending…' : 'Send code'}</button>
            </div>
          </form>
        ) : null}

        {step === 'otp' ? (
          <form onSubmit={submitOtp}>
            <h2>Enter verification code</h2>
            <p>A six-digit code was sent to {newEmail}.</p>
            <label>
              <span>Six-digit code</span>
              <input autoComplete="one-time-code" inputMode="numeric" maxLength="6" onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required value={code} />
            </label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="account-flow-modal__resend" disabled={busy || cooldown > 0} onClick={resend} type="button">{cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend code'}</button>
            <div className="account-flow-modal__actions">
              <button className="is-secondary" onClick={() => setStep('email')} type="button">Back</button>
              <button disabled={busy || code.length !== 6} type="submit">{busy ? 'Verifying…' : 'Verify and change email'}</button>
            </div>
          </form>
        ) : null}

        {step === 'done' ? (
          <div>
            <h2>Email updated</h2>
            <p className="form-status" role="status">Your email has been changed to {newEmail}. Please sign in again.</p>
            <div className="account-flow-modal__actions">
              <button onClick={finish} type="button">Sign in again</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
