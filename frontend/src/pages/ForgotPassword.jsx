import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requestPasswordReset } from '../services/authApi'

export default function ForgotPassword() {
  const navigate = useNavigate(); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); const normalized = email.trim().toLowerCase(); try { await requestPasswordReset(normalized); sessionStorage.setItem('passwordResetEmail', normalized); navigate('/reset-password', { state: { email: normalized } }) } catch { setError('Unable to process the request right now. Please try again later.') } finally { setBusy(false) } }
  return <form className="auth-form" onSubmit={submit}><p className="eyebrow">Account recovery</p><h1>Forgot password</h1><p>Enter your email. If an eligible account exists, we will send a six-digit reset code.</p><label className="field-stack"><span>Email</span><input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="primary-button" disabled={busy} type="submit">{busy ? 'Sending...' : 'Send reset code'}</button><p><Link to="/login">Back to sign in</Link></p></form>
}


/*
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import PasswordToggle from '../components/PasswordToggle'
import { sendEmailOtp, verifyEmailOtp, resetPassword, checkEmailExists } from '../services/authApi'

const passwordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .matches(/[0-9]/, 'Password must contain a number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
})

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailExists, setEmailExists] = useState(true)

  // A ref, not a local — a local is re-created every render so the pending
  // timeout would never actually be cleared.
  const emailTimer = useRef(null)

  async function handleEmailChange(e) {
    const newEmail = e.target.value
    setEmail(newEmail)

    clearTimeout(emailTimer.current)
    if (newEmail.includes("@")) {
      setCheckingEmail(true)
      emailTimer.current = setTimeout(async () => {
        const res = await checkEmailExists(newEmail)
        setEmailExists(res.exists)
        setError(res.exists ? '' : "Account not registered")
        setCheckingEmail(false)
      }, 300)
    } else {
      setCheckingEmail(false)
    }
  }

  async function handleSendOtp() {
    setError('')
    setSuccess('')

    if (!emailExists) {
      setError("Account not registered")
      return
    }
    const res = await sendEmailOtp(email)
    if (res.success) {
      setOtpSent(true)
      setSuccess("OTP sent to your email. Enter it below to continue.")
    } else {
      setError(res.message)
    }
  }

  async function handleVerifyOtp() {
    setError('')
    setSuccess('')

    const res = await verifyEmailOtp(email, otpCode)
    if (res.success) {
      setOtpVerified(true)
      setSuccess("Code verified. Choose a new password below.")
    } else {
      setError(res.message)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await passwordSchema.validate({ newPassword, confirmPassword }, { abortEarly: false })
      const res = await resetPassword(email, newPassword)
      if (res.success) {
        navigate('/login', { state: { notice: 'Password reset successful. Please log in.' } })
      } else {
        setError(res.message)
      }
    } catch (validationError) {
      setError(validationError.errors.join(', '))
    }
  }

  return (
    <form className="auth-form" onSubmit={handleResetPassword}>
      <p className="eyebrow">Account Recovery</p>
      <h1>Forgot Password</h1>

      <label className="field-stack">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="name@example.com"
          required
        />
        {checkingEmail && <span className="field-hint">Checking email…</span>}
        {!emailExists && !checkingEmail && (
          <span className="field-hint field-hint--error">Account not registered</span>
        )}
        {emailExists && !checkingEmail && email.includes("@") && (
          <span className="field-hint field-hint--ok">Account found</span>
        )}
      </label>

      {!otpSent && (
        <button className="pill-button pill-button--ghost" onClick={handleSendOtp} type="button">
          Send OTP
        </button>
      )}

      {otpSent && !otpVerified && (
        <label className="field-stack">
          <span>One-time code</span>
          <div className="input-with-action">
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit OTP"
              type="text"
              value={otpCode}
            />
            <button className="field-action" onClick={handleVerifyOtp} type="button">
              Verify
            </button>
          </div>
        </label>
      )}

      {otpVerified && (
        <>
          <label className="field-stack">
            <span>New Password</span>
            <div className="input-with-action">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                required
              />
              <PasswordToggle
                isVisible={showPassword}
                label="new password"
                onToggle={() => setShowPassword(!showPassword)}
              />
            </div>
          </label>

          <label className="field-stack">
            <span>Confirm Password</span>
            <div className="input-with-action">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
              />
              <PasswordToggle
                isVisible={showConfirmPassword}
                label="password confirmation"
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>
          </label>

          <button className="primary-button" type="submit">Reset Password</button>
        </>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="form-success" role="status">{success}</p>}

      <p className="auth-form__links"><Link to="/login">Back to login</Link></p>
    </form>
  )
}
*/