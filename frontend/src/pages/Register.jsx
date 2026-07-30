import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { registerAccount } from '../services/authApi'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ acceptPrivacy: false, acceptTerms: false, confirmPassword: '', email: '', name: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }))

  async function handleSubmit(event) {
    event.preventDefault(); setError('')
    const email = form.email.trim().toLowerCase()
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (!form.acceptTerms || !form.acceptPrivacy) return setError('Accept the Terms of Use and Privacy Policy to continue.')
    setIsSubmitting(true)
    try {
      await registerAccount({ acceptPrivacy: form.acceptPrivacy, acceptTerms: form.acceptTerms, email, name: form.name.trim(), password: form.password })
      sessionStorage.setItem('pendingVerificationEmail', email)
      navigate('/verify-email', { replace: true, state: { email } })
    } catch (nextError) {
      setError(nextError.status === 409
        ? 'An account with this email already exists.'
        : nextError.status === 429
          ? 'Too many attempts. Please wait and try again.'
          : nextError.status === 503
            ? 'Email verification is temporarily unavailable. Please try again later.'
            : nextError.message || 'We could not create your account. Check the form and try again.')
    } finally { setIsSubmitting(false) }
  }

  return <form className="auth-form auth-form--register" onSubmit={handleSubmit}>
    <header className="auth-form__header"><p className="eyebrow">Join Shades of SG</p><h1>Create account</h1><p>Join a community that celebrates Singapore&rsquo;s vibrant music culture.</p></header>
    <label className="field-stack"><span>Full name</span><input autoComplete="name" onChange={(event) => update('name', event.target.value)} placeholder="Enter your full name" required value={form.name} /></label>
    <label className="field-stack"><span>Email</span><input autoComplete="email" onChange={(event) => update('email', event.target.value)} placeholder="Enter your email" required type="email" value={form.email} /></label>
    <label className="field-stack"><span>Password</span><span className="password-field"><input autoComplete="new-password" minLength="8" onChange={(event) => update('password', event.target.value)} placeholder="Create a password" required type={showPassword ? 'text' : 'password'} value={form.password} /><button aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}<span>{showPassword ? 'Hide' : 'Show'}</span></button></span></label>
    <label className="field-stack"><span>Confirm password</span><input autoComplete="new-password" minLength="8" onChange={(event) => update('confirmPassword', event.target.value)} placeholder="Confirm your password" required type={showPassword ? 'text' : 'password'} value={form.confirmPassword} /></label>
    <label className="auth-check"><input checked={form.acceptTerms} onChange={(event) => update('acceptTerms', event.target.checked)} type="checkbox" /><span>I accept the <Link to="/terms">Terms of Use</Link></span></label>
    <label className="auth-check"><input checked={form.acceptPrivacy} onChange={(event) => update('acceptPrivacy', event.target.checked)} type="checkbox" /><span>I accept the <Link to="/privacy">Privacy Policy</Link></span></label>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Creating account...' : 'Create account'}</button>
    <p className="auth-switch auth-switch--center">Already have an account? <Link to="/login">Sign in</Link></p>
  </form>
}
