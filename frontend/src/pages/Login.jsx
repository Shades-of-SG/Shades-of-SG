import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginWithEmail } from '../services/authApi'
import { getPostLoginDestination } from '../services/postLoginIntent'

/*
TODO - Lia

Implement login form handling.
Connect authentication API.
Add validation and error states.
*/
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const data = await loginWithEmail(email, password)
      signIn(data.user, data.token)

      const fallbackPath = data.user.role === 'CREATOR' ? '/creator/dashboard' : '/'
      navigate(getPostLoginDestination(location.state?.from?.pathname || fallbackPath), { replace: true })
    } catch (nextError) {
      setError(nextError.message)
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
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          required
          type="email"
          value={email}
        />
      </label>
      <label className="field-stack">
        <span>Password</span>
        <input
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
          type="password"
          value={password}
        />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
      <p><Link to="/forgot-password">Forgot password?</Link> <Link to="/register">Create account</Link></p>
    </form>
  )
}
