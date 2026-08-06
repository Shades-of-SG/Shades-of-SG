import { useState } from 'react'
import { X } from 'lucide-react'
import PasswordToggle from './PasswordToggle'
import { deleteMyAccount } from '../services/authApi'

export default function DeleteAccountFlow({ onClose, onDeleted, token }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await deleteMyAccount(password, token)
      onDeleted?.()
    } catch (nextError) {
      setError(nextError.status === 401 ? 'Incorrect password.' : (nextError.message || 'Unable to delete the account right now.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="account-flow-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
      <div aria-modal="true" className="account-flow-modal" role="dialog">
        <button aria-label="Close" className="account-flow-modal__actions is-secondary" onClick={onClose} style={{ justifySelf: 'end', minHeight: 'auto', padding: 4 }} type="button"><X aria-hidden="true" size={18} /></button>
        <form onSubmit={submit}>
          <h2>Confirm account deletion</h2>
          <p>Enter your password to permanently delete this account. This cannot be undone from here.</p>
          <label>
            <span>Password</span>
            <span className="password-field" style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
              <input autoComplete="current-password" onChange={(event) => { setPassword(event.target.value); setError('') }} required type={showPassword ? 'text' : 'password'} value={password} />
              <PasswordToggle isVisible={showPassword} onToggle={() => setShowPassword((current) => !current)} />
            </span>
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="account-flow-modal__actions">
            <button className="is-secondary" onClick={onClose} type="button">Cancel</button>
            <button className="is-danger" disabled={busy || !password} type="submit">{busy ? 'Deleting…' : 'Delete account'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
