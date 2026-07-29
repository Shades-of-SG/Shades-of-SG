import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAuthConfig, getOauthChallenge, loginWithApple, loginWithEmail, loginWithGoogle } from '../services/authApi'

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client'
const APPLE_SCRIPT = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'

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

function roleDestination(role) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'CREATOR') return '/creator/dashboard'
  return '/profile'
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signOut } = useAuth()
  const [config, setConfig] = useState({ appleAuthEnabled: false, googleAuthEnabled: false })
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const googleButtonRef = useRef(null)

  const completeSignIn = useCallback((data) => {
    signIn(data.user, data.token)
    const requested = location.state?.from?.pathname
    const allowedRequested = requested
      && ((data.user.role === 'ADMIN' && requested.startsWith('/admin'))
        || (data.user.role === 'CREATOR' && requested.startsWith('/creator'))
        || (data.user.role === 'REGISTERED' && ['/profile', '/apply/creator', '/settings'].some((path) => requested.startsWith(path))))
    navigate(allowedRequested ? requested : roleDestination(data.user.role), { replace: true })
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
            setError(''); setIsSubmitting(true)
            try { completeSignIn(await loginWithGoogle(credential, nonce)) }
            catch (nextError) { setError(nextError.message || 'Google sign-in failed. Please try again.') }
            finally { setIsSubmitting(false) }
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
    event.preventDefault(); setError(''); setIsSubmitting(true)
    try {
      const data = await loginWithEmail(email.trim().toLowerCase(), password)
      completeSignIn(data)
    } catch (nextError) {
      if (nextError.code === 'EMAIL_UNVERIFIED') {
        sessionStorage.setItem('pendingVerificationEmail', email.trim().toLowerCase())
        navigate('/verify-email', { state: { email: email.trim().toLowerCase() } })
        return
      }
      setError(nextError.status === 403 ? nextError.message : nextError.status === 401 ? 'Email or password is incorrect.' : 'We could not sign you in. Please try again.')
    } finally { setIsSubmitting(false) }
  }

  async function handleAppleSignIn() {
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
    } finally { setIsSubmitting(false) }
  }

  function continueAsGuest() {
    signOut()
    navigate('/', { replace: true })
  }

  return <form className="auth-form auth-form--login" onSubmit={handleSubmit}>
    <header className="auth-form__header"><p className="eyebrow">Welcome back</p><h1>Sign in</h1><p>Use the same login for registered, creator, and administrator accounts.</p></header>
    <label className="field-stack"><span>Email</span><span className="auth-input-shell"><Mail aria-hidden="true" size={19} /><input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required type="email" value={email} /></span></label>
    <label className="field-stack"><span>Password</span><span className="password-field auth-input-shell"><LockKeyhole aria-hidden="true" size={19} /><input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required type={showPassword ? 'text' : 'password'} value={password} /><button aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}<span>{showPassword ? 'Hide' : 'Show'}</span></button></span></label>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
    {config.googleAuthEnabled || config.appleAuthEnabled ? <div className="auth-divider"><span>or continue with</span></div> : null}
    {config.googleAuthEnabled ? <div className="oauth-google-slot">{!googleReady ? <button className="oauth-google-placeholder" disabled type="button"><span aria-hidden="true">G</span>Continue with Google</button> : null}<div aria-label="Continue with Google" className="oauth-google-button" ref={googleButtonRef} role="group" /></div> : null}
    {config.appleAuthEnabled ? <button className="oauth-provider-button oauth-provider-button--apple" disabled={isSubmitting} onClick={handleAppleSignIn} type="button">Continue with Apple</button> : null}
    <button className="auth-guest-button" onClick={continueAsGuest} type="button"><UserRound aria-hidden="true" size={20} />Continue as guest</button>
    <p className="auth-forgot"><Link to="/forgot-password">Forgot password?</Link></p>
    <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
  </form>
}
