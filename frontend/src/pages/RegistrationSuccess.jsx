import { Link } from 'react-router-dom'

export default function RegistrationSuccess() {
  return <div className="auth-form"><p className="eyebrow">Account ready</p><h1>Email verified</h1><p>Your Shades of SG account was created successfully. You can now sign in.</p><Link className="primary-button" to="/login">Continue to sign in</Link></div>
}
