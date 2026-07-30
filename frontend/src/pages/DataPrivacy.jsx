import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { deleteAccount } from '../services/authApi'

export default function DataPrivacy() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  if (!user) {
    return (
      <section className="settings-card">
        <p className="settings-card__loading">Loading settings…</p>
      </section>
    )
  }

  async function handleDelete() {
    const confirm = window.confirm('Are you sure you wish to delete this account? This action is non-reversible.')
    if (!confirm) return

    setError('')

    try {
      const res = await deleteAccount(user.id)
      if (res.success) {
        signOut()
        navigate('/')
      } else {
        setError(res.message || 'Could not delete your account')
      }
    } catch (err) {
      setError(err.message || 'Could not delete your account')
    }
  }

  return (
    <section className="settings-card">
      <header className="settings-card__head">
        <h2>Data &amp; Privacy</h2>
        <p>Review the details tied to your account, or remove it entirely.</p>
      </header>

      <dl className="detail-list">
        <div>
          <dt>Name</dt>
          <dd>{user.name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
      </dl>

      <div className="settings-card__danger">
        <h3>Delete account</h3>
        <p>This permanently removes your account and cannot be undone.</p>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="danger-button button--block" onClick={handleDelete} type="button">
          Delete Account
        </button>
      </div>
    </section>
  )
}
