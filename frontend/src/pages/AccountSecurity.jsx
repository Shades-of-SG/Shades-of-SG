import { useState } from 'react'
import * as Yup from 'yup'
import PasswordToggle from '../components/PasswordToggle'
import { useAuth } from '../context/AuthContext'
import { changePassword, updateTwoFA } from '../services/authApi'

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
  // ✅ Hooks must be inside component
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFASuccess, setTwoFASuccess] = useState('');


  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { user, signIn } = useAuth()

  // AuthProvider resolves the stored user synchronously, so the tick box already
  // reflects the saved setting on the first render after a refresh.
  const [twoFA, setTwoFA] = useState(user?.enable2fa ?? false)

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await schema.validate({ oldPassword, newPassword, confirmPassword }, { abortEarly: false })
      const res = await changePassword({ oldPassword, newPassword })
      if (res.success) {
        setPasswordSuccess('Password changed successfully');
      } else {
        setPasswordError(res.message);
      }

    } catch (err) {
      if (err.name === 'ValidationError') {
        setPasswordError(err.errors.join(', '));
      } else {
        setPasswordError(err.message || 'Something went wrong');
      }

    }

  }

  async function handleToggleTwoFA() {
    const newValue = !twoFA;
    setTwoFA(newValue);
    setTwoFAError('');
    setTwoFASuccess('');

    try {
      const res = await updateTwoFA(newValue);
      if (res.success) {
        signIn(res.user, localStorage.getItem("token"));
        setTwoFASuccess(newValue ? '2FA enabled' : '2FA disabled');
      } else {
        setTwoFA(!newValue);
        setTwoFAError(res.message || 'Could not update your 2FA setting');
      }
    } catch (err) {
      setTwoFA(!newValue);
      setTwoFAError(err.message || 'Could not update your 2FA setting');
    }
  }

  if (!user) {
    return (
      <section className="settings-card">
        <p className="settings-card__loading">Loading settings…</p>
      </section>
    )
  }

  return (
    <div className="settings-stack">
      <form className="settings-card settings-form" onSubmit={handleChangePassword}>
        <header className="settings-card__head">
          <h2>Change Password</h2>
          <p>Use at least 8 characters, including an uppercase letter and a number.</p>
        </header>

        <label className="field-stack">
          <span>Old Password</span>
          <div className="input-with-action">
            <input
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Current password"
              type={showOldPassword ? "text" : "password"}
              value={oldPassword}
            />
            <PasswordToggle
              isVisible={showOldPassword}
              label="old password"
              onToggle={() => setShowOldPassword(!showOldPassword)}
            />
          </div>
        </label>

        <label className="field-stack">
          <span>New Password</span>
          <div className="input-with-action">
            <input
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
            />
            <PasswordToggle
              isVisible={showNewPassword}
              label="new password"
              onToggle={() => setShowNewPassword(!showNewPassword)}
            />
          </div>
        </label>

        <label className="field-stack">
          <span>Confirm New Password</span>
          <div className="input-with-action">
            <input
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
            />
            <PasswordToggle
              isVisible={showConfirmPassword}
              label="password confirmation"
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </div>
        </label>

        {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
        {passwordSuccess && <p className="form-success" role="status">{passwordSuccess}</p>}

        <button className="primary-button button--block" type="submit">Change Password</button>
      </form>

      <section className="settings-card">
        <header className="settings-card__head">
          <h2>Two-Factor Authentication (2FA)</h2>
          <p>Add an extra layer of security to your account.</p>
        </header>

        <div className="settings-toggle-row">
          <span className="settings-toggle-row__label">Status</span>
          <span className={`status-pill ${twoFA ? 'is-on' : 'is-off'}`}>{twoFA ? 'ON' : 'OFF'}</span>

          <label className="checkbox-row">
            <input checked={twoFA} onChange={handleToggleTwoFA} type="checkbox" />
            <span>{twoFA ? 'On' : 'Off'}</span>
          </label>
        </div>

        {/* ✅ Messages now appear directly beneath the checkbox */}
        {twoFAError && <p className="form-error" role="alert">{twoFAError}</p>}
        {twoFASuccess && <p className="form-success" role="status">{twoFASuccess}</p>}
      </section>
    </div>
  )
}
