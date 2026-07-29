import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAuthConfig, loginWithEmail } from '../services/authApi'

function roleDestination(role) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'CREATOR') return '/creator/dashboard'
  return '/profile'
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signOut } = useAuth()
  const [config, setConfig] = useState({ appleAuthEnabled: false })
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => { getAuthConfig().then(setConfig).catch(() => {}) }, [])

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setIsSubmitting(true)
    try {
      const data = await loginWithEmail(email.trim().toLowerCase(), password)
      signIn(data.user, data.token)
      const requested = location.state?.from?.pathname
      const allowedRequested = requested
        && ((data.user.role === 'ADMIN' && requested.startsWith('/admin'))
          || (data.user.role === 'CREATOR' && requested.startsWith('/creator'))
          || (data.user.role === 'REGISTERED' && ['/profile', '/apply/creator', '/settings'].some((path) => requested.startsWith(path))))
      navigate(allowedRequested ? requested : roleDestination(data.user.role), { replace: true })
    } catch (nextError) {
      if (nextError.code === 'EMAIL_UNVERIFIED') {
        sessionStorage.setItem('pendingVerificationEmail', email.trim().toLowerCase())
        navigate('/verify-email', { state: { email: email.trim().toLowerCase() } })
        return
      }
      setError(nextError.status === 403 ? nextError.message : nextError.status === 401 ? 'Email or password is incorrect.' : 'We could not sign you in. Please try again.')
    } finally { setIsSubmitting(false) }
  }

  function continueAsGuest() {
    signOut()
    navigate('/', { replace: true })
  }

  return <form className="auth-form" onSubmit={handleSubmit}>
    <p className="eyebrow">Welcome back</p><h1>Sign in</h1><p>Use the same login for registered, creator, and administrator accounts.</p>
    <label className="field-stack"><span>Email</span><input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required type="email" value={email} /></label>
    <label className="field-stack"><span>Password</span><span className="password-field"><input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type={showPassword ? 'text' : 'password'} value={password} /><button aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? 'Hide' : 'Show'}</button></span></label>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
    {config.appleAuthEnabled ? <button disabled type="button">Sign in with Apple</button> : null}
    <button className="auth-guest-button" onClick={continueAsGuest} type="button">Continue as guest</button>
    <p><Link to="/forgot-password">Forgot password?</Link></p><p>New here? <Link to="/register">Create a normal account</Link></p>
  </form>
}
