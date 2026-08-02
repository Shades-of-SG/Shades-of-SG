import { useCallback, useEffect, useRef, useState } from 'react'
import { LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PasswordToggle from '../components/PasswordToggle'
import { useAuth } from '../context/AuthContext'
import { getAuthConfig, getOauthChallenge, loginWithApple, loginWithEmail, loginWithGoogle } from '../services/authApi'
import { hasActiveCreatorAccess } from '../utils/accessStatus'

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client'
const APPLE_SCRIPT = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function loadScript(src) {
  const existing = document.querySelector(`script[src="${src}"]`)
  if (existing?.dataset.loaded === 'true') return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = existing || document.createElement('script')
    const loaded = () => { script.dataset.loaded = 'true'; resolve() }
    script.addEventListener('load', loaded, { once: true })
    script.addEventListener('error', () => reject(new Error('The sign-in provider could not be loaded.')), { once: true })
    if (!existing) {
      script.async = true
      script.defer = true
      script.src = src
      document.head.appendChild(script)
    }
  })
}

function roleDestination(user, activeMode) {
  if (user.role === 'ADMIN') return '/admin'
  if (hasActiveCreatorAccess(user) && activeMode === 'creator') return '/creator/dashboard'
  if (user.role === 'CREATOR') return '/'
  return '/profile'
}

function requestedDestination(state) {
  const from = state?.from
  if (typeof from === 'string') return from.startsWith('/') ? from : ''
  if (!from?.pathname?.startsWith('/')) return ''
  return `${from.pathname}${from.search || ''}${from.hash || ''}`
}

function validateLogin(email, password) {
  const errors = {}
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Enter your password.'
  else if (password.length < 8 || password.length > 128) errors.password = 'Password must be between 8 and 128 characters.'
  return errors
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signOut } = useAuth()
  const [config, setConfig] = useState({ appleAuthEnabled: false, googleAuthEnabled: false })
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const googleButtonRef = useRef(null)
  const submissionRef = useRef(false)

  const completeSignIn = useCallback((data) => {
    const activeMode = signIn(data.user, data.token)
    const requested = requestedDestination(location.state)
    const requestedPath = requested.split(/[?#]/, 1)[0]
    const allowedRequested = requested
      && ((data.user.role === 'ADMIN' && requestedPath.startsWith('/admin'))
        || (hasActiveCreatorAccess(data.user) && activeMode === 'creator' && requestedPath.startsWith('/creator'))
        || (data.user.role === 'CREATOR' && requestedPath.startsWith('/profile'))
        || (data.user.role === 'REGISTERED' && ['/profile', '/apply/creator', '/settings'].some((path) => requestedPath.startsWith(path))))
    navigate(allowedRequested ? requested : roleDestination(data.user, activeMode), { replace: true })
  }, [location.state, navigate, signIn])

  useEffect(() => { getAuthConfig().then(setConfig).catch(() => {}) }, [])

  useEffect(() => {
    if (!config.googleAuthEnabled || !config.googleClientId || !googleButtonRef.current) return undefined
    let active = true
    getOauthChallenge('GOOGLE')
      .then(async ({ nonce }) => {
        await loadScript(GOOGLE_SCRIPT)
        if (!active || !window.google?.accounts?.id || !googleButtonRef.current) return
        window.google.accounts.id.initialize({
          callback: async ({ credential }) => {
            if (submissionRef.current) return
            submissionRef.current = true
            setError(''); setIsSubmitting(true)
            try { completeSignIn(await loginWithGoogle(credential, nonce)) }
            catch (nextError) { setError(nextError.message || 'Google sign-in failed. Please try again.') }
            finally { submissionRef.current = false; setIsSubmitting(false) }
          },
          client_id: config.googleClientId,
          nonce,
        })
        googleButtonRef.current.replaceChildren()
        const buttonWidth = Math.min(400, Math.max(240, googleButtonRef.current.clientWidth || 400))
        window.google.accounts.id.renderButton(googleButtonRef.current, { shape: 'rectangular', size: 'large', text: 'continue_with', theme: 'filled_black', width: buttonWidth })
        setGoogleReady(true)
      })
      .catch((nextError) => active && setError(nextError.message || 'Google sign-in is unavailable.'))
    return () => { active = false }
  }, [completeSignIn, config.googleAuthEnabled, config.googleClientId])

  async function handleSubmit(event) {
    event.preventDefault()
    if (submissionRef.current) return
    const normalizedEmail = email.trim().toLowerCase()
    const nextFieldErrors = validateLogin(normalizedEmail, password)
    setFieldErrors(nextFieldErrors)
    setError('')
    if (Object.keys(nextFieldErrors).length) return
    submissionRef.current = true
    setIsSubmitting(true)
    try {
      const data = await loginWithEmail(normalizedEmail, password)
      completeSignIn(data)
    } catch (nextError) {
      if (nextError.code === 'EMAIL_UNVERIFIED') {
        sessionStorage.setItem('pendingVerificationEmail', normalizedEmail)
        navigate('/verify-email', { state: { email: normalizedEmail } })
        return
      }
      setError(nextError.status === 403 ? nextError.message : nextError.status === 401 ? 'Email or password is incorrect.' : 'We could not sign you in. Please try again.')
    } finally { submissionRef.current = false; setIsSubmitting(false) }
  }

  async function handleAppleSignIn() {
    if (submissionRef.current) return
    submissionRef.current = true
    setError(''); setIsSubmitting(true)
    try {
      const [{ nonce, state }] = await Promise.all([getOauthChallenge('APPLE'), loadScript(APPLE_SCRIPT)])
      if (!window.AppleID?.auth) throw new Error('Apple sign-in is unavailable.')
      window.AppleID.auth.init({
        clientId: config.appleClientId,
        nonce,
        redirectURI: config.appleRedirectUri,
        scope: 'name email',
        state,
        usePopup: true,
      })
      const result = await window.AppleID.auth.signIn()
      const returnedState = result.authorization?.state || result.state
      if (returnedState && returnedState !== state) throw new Error('Apple returned an invalid sign-in state.')
      completeSignIn(await loginWithApple({
        code: result.authorization?.code,
        nonce,
        state: returnedState || state,
        user: result.user,
      }))
    } catch (nextError) {
      if (nextError?.error !== 'popup_closed_by_user') setError(nextError.message || 'Apple sign-in failed. Please try again.')
    } finally { submissionRef.current = false; setIsSubmitting(false) }
  }

  function continueAsGuest() {
    if (submissionRef.current) return
    signOut()
    navigate('/', { replace: true })
  }

  return <form className="auth-form auth-form--login" onSubmit={handleSubmit}>
    <header className="auth-form__header"><p className="eyebrow">Welcome back</p><h1>Sign in</h1><p>Use the same login for registered, creator, and administrator accounts.</p></header>
    <label className="field-stack"><span>Email</span><span className="auth-input-shell"><Mail aria-hidden="true" size={19} /><input aria-describedby={fieldErrors.email ? 'login-email-error' : undefined} aria-invalid={Boolean(fieldErrors.email)} aria-label="Email" autoComplete="email" maxLength={320} onChange={(event) => { setEmail(event.target.value); setFieldErrors((current) => ({ ...current, email: '' })) }} placeholder="name@example.com" required type="email" value={email} /></span>{fieldErrors.email ? <span className="field-hint field-hint--error" id="login-email-error">{fieldErrors.email}</span> : null}</label>
    <label className="field-stack"><span>Password</span><span className="password-field auth-input-shell"><LockKeyhole aria-hidden="true" size={19} /><input aria-describedby={fieldErrors.password ? 'login-password-error' : undefined} aria-invalid={Boolean(fieldErrors.password)} aria-label="Password" autoComplete="current-password" maxLength={128} minLength={8} onChange={(event) => { setPassword(event.target.value); setFieldErrors((current) => ({ ...current, password: '' })) }} placeholder="Enter your password" required type={showPassword ? 'text' : 'password'} value={password} /><PasswordToggle isVisible={showPassword} onToggle={() => setShowPassword((current) => !current)} /></span>{fieldErrors.password ? <span className="field-hint field-hint--error" id="login-password-error">{fieldErrors.password}</span> : null}</label>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
    {config.googleAuthEnabled || config.appleAuthEnabled ? <div className="auth-divider"><span>or continue with</span></div> : null}
    {config.googleAuthEnabled ? <div className="oauth-google-slot">{!googleReady ? <button className="oauth-google-placeholder" disabled type="button"><span aria-hidden="true">G</span>Continue with Google</button> : null}<div aria-label="Continue with Google" className="oauth-google-button" ref={googleButtonRef} role="group" /></div> : null}
    {config.appleAuthEnabled ? <button className="oauth-provider-button oauth-provider-button--apple" disabled={isSubmitting} onClick={handleAppleSignIn} type="button">Continue with Apple</button> : null}
    <button className="auth-guest-button" disabled={isSubmitting} onClick={continueAsGuest} type="button"><UserRound aria-hidden="true" size={20} />Continue as guest</button>
    <p className="auth-forgot"><Link to="/forgot-password">Forgot password?</Link></p>
    <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
  </form>
}
