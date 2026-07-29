import { useState } from 'react'
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
      setError(nextError.status === 409 ? 'An account with this email already exists.' : nextError.status === 429 ? 'Too many attempts. Please wait and try again.' : 'We could not create your account. Check the form and try again.')
    } finally { setIsSubmitting(false) }
  }

  return <form className="auth-form" onSubmit={handleSubmit}>
    <p className="eyebrow">Join Shades of SG</p><h1>Create account</h1>
    <label className="field-stack"><span>Full name</span><input autoComplete="name" onChange={(event) => update('name', event.target.value)} required value={form.name} /></label>
    <label className="field-stack"><span>Email</span><input autoComplete="email" onChange={(event) => update('email', event.target.value)} required type="email" value={form.email} /></label>
    <label className="field-stack"><span>Password</span><span className="password-field"><input autoComplete="new-password" minLength="8" onChange={(event) => update('password', event.target.value)} required type={showPassword ? 'text' : 'password'} value={form.password} /><button onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? 'Hide' : 'Show'}</button></span></label>
    <label className="field-stack"><span>Confirm password</span><input autoComplete="new-password" minLength="8" onChange={(event) => update('confirmPassword', event.target.value)} required type={showPassword ? 'text' : 'password'} value={form.confirmPassword} /></label>
    <label className="auth-check"><input checked={form.acceptTerms} onChange={(event) => update('acceptTerms', event.target.checked)} type="checkbox" />I accept the <Link to="/terms">Terms of Use</Link>.</label>
    <label className="auth-check"><input checked={form.acceptPrivacy} onChange={(event) => update('acceptPrivacy', event.target.checked)} type="checkbox" />I accept the <Link to="/privacy">Privacy Policy</Link>.</label>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Creating account...' : 'Create account'}</button>
    <p><Link to="/login">Already have an account?</Link></p>
  </form>
}
