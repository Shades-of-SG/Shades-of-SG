import { useAuth } from '../context/AuthContext'
import { deleteAccount } from '../services/authApi'
import { useNavigate } from 'react-router-dom'

export default function DataPrivacy() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleDelete() {
    const confirm = window.confirm('Are you sure you wish to delete this account? This action is non-reversible.')
    if (!confirm) return

    const res = await deleteAccount(user.id)
    if (res.success) {
      signOut()
      navigate('/')
    } else {
      alert(res.message)
    }
  }

  return (
    <div className="auth-form">
      <h1>Data & Privacy</h1>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>

      <button className="danger-button" onClick={handleDelete}>Delete Account</button>
    </div>
  )
}
