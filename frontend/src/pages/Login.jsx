import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PasswordToggle from '../components/PasswordToggle'
import { useAuth } from '../context/AuthContext'
import { loginWithEmail, checkEmailExists, sendEmailOtp, verifyLoginOtp } from '../services/authApi'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  // Carries over the confirmation from a completed password reset.
  const [success, setSuccess] = useState(location.state?.notice ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Email existence check
  const [emailExists, setEmailExists] = useState(true)
  const [checkingEmail, setCheckingEmail] = useState(false);
  // A ref, not a local — a local is re-created every render so the pending
  // timeout would never actually be cleared.
  const emailTimer = useRef(null);

  // Add state for OTP handling
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');


  async function handleEmailChange(event) {
    const newEmail = event.target.value;
    setEmail(newEmail);

    clearTimeout(emailTimer.current);
    if (newEmail.includes("@")) {
      setCheckingEmail(true);
      emailTimer.current = setTimeout(async () => {
        const res = await checkEmailExists(newEmail);
        setEmailExists(res.exists);
        setError(res.exists ? '' : "Email not registered. Please create an account.");
        setCheckingEmail(false);
      }, 400); //Should I lowkey increase the debounce?? //Yas, increase from 300 to 400
    } else {
      setCheckingEmail(false);
    }
  }


  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const data = await loginWithEmail(email, password)

      if (data.requireOtp) {
        // ✅ OTP required
        setOtpRequired(true);
        setPendingEmail(data.email);

        // Call backend /send-email-otp route
        const res = await sendEmailOtp(data.email);
        if (!res.success) {
          setError(res.message || "Failed to send OTP");
        } else {
          setSuccess("OTP sent to your email. Please verify.");
        }

        setIsSubmitting(false);
        return;
      }

      //Normal login
      // ✅ signIn persists token + user and clears any guest session
      signIn(data.user, data.token)

      const fallbackPath = data.user.role === 'CREATOR' ? '/creator/dashboard' : '/'
      navigate(location.state?.from?.pathname || fallbackPath, { replace: true })
    } catch (nextError) {
      setError(nextError.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }


  async function handleVerifyOtp() {
    setError('')

    try {
      const res = await verifyLoginOtp(pendingEmail, otpCode);
      if (res.success) {
        signIn(res.user, res.token);

        const fallbackPath = res.user.role === 'CREATOR' ? '/creator/dashboard' : '/';
        navigate(fallbackPath, { replace: true });
      } else {
        setError(res.message || "OTP verification failed");
      }
    } catch (err) {
      setError(err.message || "OTP verification failed");
    }
  }


  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <p className="eyebrow">Welcome Back</p>
      <h1>Login</h1>

      <label className="field-stack">
        <span>Email</span>
        <input
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={handleEmailChange}
          required
        />
        {checkingEmail && <span className="field-hint">Checking email…</span>}
        {!emailExists && !checkingEmail && (
          <span className="field-hint field-hint--error">
            Email not registered. Please create an account.
          </span>
        )}
        {emailExists && !checkingEmail && email.includes("@") && (
          <span className="field-hint field-hint--ok">Email registered</span>
        )}
      </label>



      <label className="field-stack">
        <span>Password</span>
        <div className="input-with-action">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
          />
          <PasswordToggle
            isVisible={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
        </div>
      </label>

      {/* Render an OTP input if otpRequired is true */}
      {otpRequired && (
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



      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="form-success" role="status">{success}</p>}


      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>

      <p className="auth-form__links">
        <Link to="/forgot-password">Forgot password?</Link>{' '}
        <Link to="/register">Create account</Link>
      </p>
    </form>
  )
}
