import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PasswordToggle from '../components/PasswordToggle'
import { registerAccount } from '../services/authApi'
import { markNewAccountScoreClaim, readRegistrationReturn, safeReturnPath, storeRegistrationReturn } from '../services/safeReturnPath'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRegistration(values) {
  const errors = {}
  const name = values.name.trim()
  const email = values.email.trim()

  if (name.length < 2 || name.length > 255) {
    errors.name = 'Full name must be between 2 and 255 characters.'
  }
  if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (values.password.length < 8 || values.password.length > 128) {
    errors.password = 'Password must be between 8 and 128 characters.'
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  if (!values.acceptTerms) {
    errors.acceptTerms = 'Accept the Terms of Use to continue.'
  }
  if (!values.acceptPrivacy) {
    errors.acceptPrivacy = 'Accept the Privacy Policy to continue.'
  }

  return errors
}

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnPath = safeReturnPath(location.state?.from) || readRegistrationReturn()
  const [form, setForm] = useState({ acceptPrivacy: false, acceptTerms: false, confirmPassword: '', email: '', name: '', password: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const submitInFlight = useRef(false)
  useEffect(() => {
    if (returnPath) storeRegistrationReturn(returnPath)
  }, [returnPath])
  const update = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (submitInFlight.current) return
    const nextFieldErrors = validateRegistration(form)
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }
    const email = form.email.trim().toLowerCase()
    submitInFlight.current = true
    setIsSubmitting(true)
    try {
      await registerAccount({ acceptPrivacy: form.acceptPrivacy, acceptTerms: form.acceptTerms, email, name: form.name.trim(), password: form.password })
      sessionStorage.setItem('pendingVerificationEmail', email)
      if (returnPath) storeRegistrationReturn(returnPath)
      markNewAccountScoreClaim(returnPath)
      navigate('/verify-email', { replace: true, state: { email, from: returnPath } })
    } catch (nextError) {
      const temporarilyUnavailable = !nextError.status || [502, 503, 504].includes(nextError.status)
      if (nextError.status === 409) {
        setFieldErrors((current) => ({
          ...current,
          email: 'This email cannot be used. Continue to sign in or recover your account.',
        }))
      } else setError(nextError.status === 429
          ? 'Too many attempts. Please wait and try again.'
          : temporarilyUnavailable
            ? 'The account service is temporarily unavailable. Please wait a moment and try again.'
            : nextError.message || 'We could not create your account. Check the form and try again.')
    } finally { submitInFlight.current = false; setIsSubmitting(false) }
  }

  return <form className="auth-form auth-form--register" noValidate onSubmit={handleSubmit}>
    <header className="auth-form__header"><p className="eyebrow">Join Shades of SG</p><h1>Create account</h1><p>Join a community that celebrates Singapore&rsquo;s vibrant music culture.</p></header>
    <label className="field-stack"><span>Full name</span><input aria-describedby={fieldErrors.name ? 'register-name-error' : undefined} aria-invalid={Boolean(fieldErrors.name)} autoComplete="name" maxLength="255" onChange={(event) => update('name', event.target.value)} placeholder="Enter your full name" required value={form.name} />{fieldErrors.name ? <span className="field-hint field-hint--error" id="register-name-error">{fieldErrors.name}</span> : null}</label>
    <label className="field-stack"><span>Email</span><input aria-describedby={fieldErrors.email ? 'register-email-error' : undefined} aria-invalid={Boolean(fieldErrors.email)} autoComplete="email" onChange={(event) => update('email', event.target.value)} placeholder="Enter your email" required type="email" value={form.email} />{fieldErrors.email ? <span className="field-hint field-hint--error" id="register-email-error">{fieldErrors.email}</span> : null}</label>
    <label className="field-stack"><span>Password</span><span className="field-hint" id="register-password-requirements">Use between 8 and 128 characters.</span><span className="password-field"><input aria-describedby={`register-password-requirements${fieldErrors.password ? ' register-password-error' : ''}`} aria-invalid={Boolean(fieldErrors.password)} aria-label="Password" autoComplete="new-password" maxLength="128" minLength="8" onChange={(event) => update('password', event.target.value)} placeholder="Create a password" required type={showPassword ? 'text' : 'password'} value={form.password} /><PasswordToggle isVisible={showPassword} onToggle={() => setShowPassword((current) => !current)} /></span>{fieldErrors.password ? <span className="field-hint field-hint--error" id="register-password-error">{fieldErrors.password}</span> : null}</label>
    <label className="field-stack"><span>Confirm password</span><span className="password-field"><input aria-describedby={fieldErrors.confirmPassword ? 'register-confirm-password-error' : undefined} aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-label="Confirm password" autoComplete="new-password" maxLength="128" minLength="8" onChange={(event) => update('confirmPassword', event.target.value)} placeholder="Confirm your password" required type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} /><PasswordToggle isVisible={showConfirmPassword} label="password confirmation" onToggle={() => setShowConfirmPassword((current) => !current)} /></span>{fieldErrors.confirmPassword ? <span className="field-hint field-hint--error" id="register-confirm-password-error">{fieldErrors.confirmPassword}</span> : null}</label>
    <div><label className="auth-check"><input aria-describedby={fieldErrors.acceptTerms ? 'register-terms-error' : undefined} aria-invalid={Boolean(fieldErrors.acceptTerms)} checked={form.acceptTerms} onChange={(event) => update('acceptTerms', event.target.checked)} type="checkbox" /><span>I accept the <Link to="/terms">Terms of Use</Link></span></label>{fieldErrors.acceptTerms ? <span className="field-hint field-hint--error" id="register-terms-error">{fieldErrors.acceptTerms}</span> : null}</div>
    <div><label className="auth-check"><input aria-describedby={fieldErrors.acceptPrivacy ? 'register-privacy-error' : undefined} aria-invalid={Boolean(fieldErrors.acceptPrivacy)} checked={form.acceptPrivacy} onChange={(event) => update('acceptPrivacy', event.target.checked)} type="checkbox" /><span>I accept the <Link to="/privacy">Privacy Policy</Link></span></label>{fieldErrors.acceptPrivacy ? <span className="field-hint field-hint--error" id="register-privacy-error">{fieldErrors.acceptPrivacy}</span> : null}</div>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Creating account...' : 'Create account'}</button>
    <p className="auth-switch auth-switch--center">Already have an account? <Link state={{ from: returnPath }} to="/login">Sign in</Link></p>
  </form>
}
