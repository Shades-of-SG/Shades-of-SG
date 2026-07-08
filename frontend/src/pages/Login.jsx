import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginWithEmail, checkEmailExists } from '../services/authApi'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Email existence check
  const [emailExists, setEmailExists] = useState(true)
  const [checkingEmail, setCheckingEmail] = useState(false);
  let emailTimer;

  async function handleEmailChange(event) {
    const newEmail = event.target.value;
    setEmail(newEmail);

    clearTimeout(emailTimer);
    if (newEmail.includes("@")) {
      setCheckingEmail(true);
      emailTimer = setTimeout(async () => {
        const res = await checkEmailExists(newEmail);
        setEmailExists(res.exists);
        setError(res.exists ? '' : "Email not registered. Please create an account.");
        setCheckingEmail(false);
      }, 300); //Should I lowkey increase the debounce??
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
      signIn(data.user, data.token)

      const fallbackPath = data.user.role === 'CREATOR' ? '/creator/dashboard' : '/'
      navigate(location.state?.from?.pathname || fallbackPath, { replace: true })
    } catch (nextError) {
      setError(nextError.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
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
        {checkingEmail && (
          <span style={{ color: "blue", fontSize: "12px" }}>Checking email...</span>
        )}
        {!emailExists && !checkingEmail && (
          <span style={{ color: "red", fontSize: "12px" }}>
            Email not registered. Please create an account.
          </span>
        )}
        {emailExists && !checkingEmail && email.includes("@") && (
          <span style={{ color: "green", fontSize: "12px" }}>✅ Email registered</span>
        )}
      </label>



      <label className="field-stack">
        <span>Password</span>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ marginLeft: "8px" }}
          >
            {showPassword ? "🙈 Hide" : "👁 Show"} {/* 🙉 */}
          </button>
        </div>
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>

      <p>
        <Link to="/forgot-password">Forgot password?</Link>{' '}
        <Link to="/register">Create account</Link>
      </p>
    </form>
  )
}
