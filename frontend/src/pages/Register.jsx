import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { registerAccount } from '../services/authApi'
import { getPostLoginDestination } from '../services/postLoginIntent'

export default function Register() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const data = await registerAccount(name, email, password)
      signIn(data.user, data.token)
      navigate(getPostLoginDestination('/'), { replace: true })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <p className="eyebrow">Join Shades of SG</p><h1>Register</h1>
      <label className="field-stack"><span>Name</span><input onChange={(event) => setName(event.target.value)} placeholder="Your name" required value={name} /></label>
      <label className="field-stack"><span>Email</span><input onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required type="email" value={email} /></label>
      <label className="field-stack"><span>Password</span><input minLength="8" onChange={(event) => setPassword(event.target.value)} placeholder="Password" required type="password" value={password} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Creating account...' : 'Register'}</button>
      <p><Link to="/login">Already have an account?</Link></p>
    </form>
  )
}
