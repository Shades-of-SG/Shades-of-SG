import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import PasswordToggle from '../components/PasswordToggle'
import useDebouncedValue from '../hooks/useDebouncedValue'
import { completePasswordReset, requestPasswordReset, verifyPasswordResetOtp } from '../services/authApi'

const PASSWORD_REQUIREMENTS_TEXT = 'Use 8-128 characters, with an uppercase letter, a lowercase letter, a number, and a special character.'

function passwordIssues(password) {
  const issues = []
  if (password.length < 8 || password.length > 128) issues.push('Use 8-128 characters.')
  if (!/[a-z]/.test(password)) issues.push('Add a lowercase letter.')
  if (!/[A-Z]/.test(password)) issues.push('Add an uppercase letter.')
  if (!/\d/.test(password)) issues.push('Add a number.')
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('Add a special character.')
  return issues
}

export default function ResetPassword({ afterCompletePath = '/login', onComplete, requestPath = '/forgot-password' }) {
  const location = useLocation(); const email = location.state?.email || sessionStorage.getItem('passwordResetEmail') || ''
  const [code, setCode] = useState(''); const [resetToken, setResetToken] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [error, setError] = useState(''); const [fieldErrors, setFieldErrors] = useState({}); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false); const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const debouncedPassword = useDebouncedValue(password, 400)
  const debouncedConfirmPassword = useDebouncedValue(confirmPassword, 400)
  useEffect(() => { if (!cooldown) return undefined; const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer) }, [cooldown])
  const passwordError = fieldErrors.password || (debouncedPassword ? passwordIssues(debouncedPassword).join(' ') : '')
  const confirmPasswordError = fieldErrors.confirmPassword
    || (debouncedConfirmPassword && debouncedConfirmPassword !== password ? 'Passwords do not match.' : '')
  async function verify(event) { event.preventDefault(); setBusy(true); setError(''); try { const data = await verifyPasswordResetOtp(email, code); setResetToken(data.resetToken); setMessage('Code verified. Choose a new password.') } catch (nextError) { setError(nextError.status === 429 ? 'Too many attempts. Request another code later.' : 'The code is invalid or expired.') } finally { setBusy(false) } }
  async function complete(event) {
    event.preventDefault(); setError('')
    const nextFieldErrors = {
      confirmPassword: !confirmPassword ? 'Confirm your new password.' : confirmPassword !== password ? 'Passwords do not match.' : '',
      password: passwordIssues(password).join(' '),
    }
    setFieldErrors(nextFieldErrors)
    if (nextFieldErrors.password || nextFieldErrors.confirmPassword) return
    setBusy(true)
    try { await completePasswordReset(resetToken, password); sessionStorage.removeItem('passwordResetEmail'); setMessage('Password updated successfully. You can now sign in.'); setResetToken('COMPLETE'); onComplete?.() } catch { setError('The reset session is invalid or expired. Request a new code.') } finally { setBusy(false) }
  }
  async function resend() { setBusy(true); setError(''); try { const data = await requestPasswordReset(email); setMessage('If the account is eligible, a new code has been sent.'); setCode(''); setCooldown(data?.resendCooldownSeconds || 60) } catch (nextError) { setError(nextError.status === 429 ? `Sorry, please wait ${nextError.retryAfter || 60} seconds before trying again.` : 'Unable to request another code right now.') } finally { setBusy(false) } }
  if (!email) return <div className="auth-form"><h1>Reset session missing</h1><Link to={requestPath}>Request a reset code</Link></div>
  if (resetToken === 'COMPLETE') return <div className="auth-form"><p className="eyebrow">Password reset</p><h1>Password updated</h1><p>{message}</p><Link className="primary-button" to={afterCompletePath}>Sign in</Link></div>
  if (resetToken) return <form className="auth-form" onSubmit={complete}><p className="eyebrow">Secure reset</p><h1>Choose a new password</h1>{message ? <p role="status">{message}</p> : null}<label className="field-stack"><span>New password</span><span className="field-hint" id="reset-password-requirements">{PASSWORD_REQUIREMENTS_TEXT}</span><span className="password-field"><input aria-describedby={`reset-password-requirements${passwordError ? ' reset-password-error' : ''}`} aria-invalid={Boolean(passwordError)} autoComplete="new-password" maxLength="128" minLength="8" onChange={(event) => { setPassword(event.target.value); setFieldErrors((current) => ({ ...current, password: '' })) }} required type={showPassword ? 'text' : 'password'} value={password} /><PasswordToggle isVisible={showPassword} onToggle={() => setShowPassword((current) => !current)} /></span>{passwordError ? <span className="field-hint field-hint--error" id="reset-password-error">{passwordError}</span> : null}</label><label className="field-stack"><span>Confirm new password</span><span className="password-field"><input aria-describedby={confirmPasswordError ? 'reset-confirm-password-error' : undefined} aria-invalid={Boolean(confirmPasswordError)} autoComplete="new-password" maxLength="128" minLength="8" onChange={(event) => { setConfirmPassword(event.target.value); setFieldErrors((current) => ({ ...current, confirmPassword: '' })) }} required type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} /><PasswordToggle isVisible={showConfirmPassword} label="password confirmation" onToggle={() => setShowConfirmPassword((current) => !current)} /></span>{confirmPasswordError ? <span className="field-hint field-hint--error" id="reset-confirm-password-error">{confirmPasswordError}</span> : null}</label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="primary-button" disabled={busy} type="submit">{busy ? 'Updating...' : 'Update password'}</button></form>
  return <form className="auth-form" onSubmit={verify}><p className="eyebrow">Password reset</p><h1>Enter your reset code</h1><p>If an eligible account exists, a code was sent to {email}.</p><label className="field-stack"><span>Six-digit code</span><input autoComplete="one-time-code" inputMode="numeric" maxLength="6" onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required value={code} /></label>{error ? <p className="form-error" role="alert">{error}</p> : null}{message ? <p role="status">{message}</p> : null}<button className="primary-button" disabled={busy || code.length !== 6} type="submit">Verify code</button><button disabled={busy || cooldown > 0} onClick={resend} type="button">{cooldown > 0 ? `Resend available in ${cooldown}s` : 'You may try again'}</button></form>
}
