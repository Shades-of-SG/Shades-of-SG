import { useState } from 'react'
import * as Yup from 'yup'
import { changePassword } from '../services/authApi'

const schema = Yup.object().shape({
  oldPassword: Yup.string().required('Old password required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain uppercase')
    .matches(/[0-9]/, 'Must contain number')
    .required('New password required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password required'),
})

export default function AccountSecurity() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [twoFA, setTwoFA] = useState(false)

  async function handleChangePassword(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await schema.validate({ oldPassword, newPassword, confirmPassword }, { abortEarly: false })
      const res = await changePassword({ oldPassword, newPassword })
      if (res.success) {
        setSuccess('Password changed successfully')
      } else {
        setError(res.message)
      }
    } catch (validationError) {
      setError(validationError.errors.join(', '))
    }
  }

  return (
    <div className="auth-form">
      <h1>Account & Security</h1>

      <form onSubmit={handleChangePassword}>
        <label className="field-stack">
          <span>Old Password</span>
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </label>

        <label className="field-stack">
          <span>New Password</span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>

        <label className="field-stack">
          <span>Confirm New Password</span>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </label>

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <button className="primary-button" type="submit">Change Password</button>
      </form>

      <div className="field-stack" style={{ marginTop: '2rem' }}>
        <span>Enable 2FA</span>
        <label>
          <input type="checkbox" checked={twoFA} onChange={() => setTwoFA(!twoFA)} />
          {twoFA ? 'On' : 'Off'}
        </label>
      </div>
    </div>
  )
}
