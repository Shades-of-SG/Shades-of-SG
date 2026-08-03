import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegistrationSuccess() {
  const { user } = useAuth()

  return <div className="auth-form"><p className="eyebrow">Account ready</p><h1>Email verified</h1><p>{user ? 'Your Shades of SG account was created successfully, and you are now signed in.' : 'Your Shades of SG account was created successfully. You can now sign in.'}</p><Link className="primary-button" to={user ? '/profile' : '/login'}>{user ? 'Continue to your profile' : 'Continue to sign in'}</Link></div>
}
