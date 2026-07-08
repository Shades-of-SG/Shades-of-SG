/*
import { Link } from 'react-router-dom'

/*
TODO - Lia

Implement password reset request.
Connect email delivery API.
Add confirmation screen.
*/
/*
export default function ForgotPassword() {
  return (
    <div className="auth-form">
      <p className="eyebrow">Account Recovery</p>
      <h1>Forgot Password</h1>
      <p>Enter your email and a reset link placeholder flow will be wired here.</p>
      <label className="field-stack"><span>Email</span><input placeholder="name@example.com" type="email" /></label>
      <button className="primary-button" type="button">Send OTP</button>
      <p><Link to="/login">Back to login</Link></p>
    </div>
  )
}
*/

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import { sendEmailOtp, verifyEmailOtp, resetPassword, checkEmailExists } from '../services/authApi'

const passwordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .matches(/[0-9]/, 'Password must contain a number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
})

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailExists, setEmailExists] = useState(true)

  let emailTimer

  async function handleEmailChange(e) {
    const newEmail = e.target.value
    setEmail(newEmail)

    clearTimeout(emailTimer)
    if (newEmail.includes("@")) {
      setCheckingEmail(true)
      emailTimer = setTimeout(async () => {
        const res = await checkEmailExists(newEmail)
        setEmailExists(res.exists)
        setError(res.exists ? '' : "Account not registered")
        setCheckingEmail(false)
      }, 300)
    } else {
      setCheckingEmail(false)
    }
  }

  async function handleSendOtp() {
    if (!emailExists) {
      setError("Account not registered")
      return
    }
    const res = await sendEmailOtp(email)
    if (res.success) {
      setOtpSent(true)
      alert("OTP sent to your email")
    } else {
      setError(res.message)
    }
  }

  async function handleVerifyOtp() {
    const res = await verifyEmailOtp(email, otpCode)
    if (res.success) {
      setOtpVerified(true)
      alert("✅ OTP verified")
    } else {
      setError(res.message)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')

    try {
      await passwordSchema.validate({ newPassword, confirmPassword }, { abortEarly: false })
      const res = await resetPassword(email, newPassword)
      if (res.success) {
        alert("Password reset successful. Please login.")
        navigate('/login')
      } else {
        setError(res.message)
      }
    } catch (validationError) {
      setError(validationError.errors.join(', '))
    }
  }

  return (
    <form className="auth-form" onSubmit={handleResetPassword}>
      <p className="eyebrow">Account Recovery</p>
      <h1>Forgot Password</h1>

      <label className="field-stack">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="name@example.com"
          required
        />
        {checkingEmail && <span style={{ color: "blue", fontSize: "12px" }}>Checking email...</span>}
        {!emailExists && !checkingEmail && (
          <span style={{ color: "red", fontSize: "12px" }}>Account not registered</span>
        )}
        {emailExists && !checkingEmail && email.includes("@") && (
          <span style={{ color: "green", fontSize: "12px" }}>✅ Account found</span>
        )}
      </label>

      {!otpSent && (
        <button type="button" onClick={handleSendOtp}>Send OTP</button>
      )}

      {otpSent && !otpVerified && (
        <div>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter 6-digit OTP"
          />
          <button type="button" onClick={handleVerifyOtp}>Verify OTP</button>
        </div>
      )}

      {otpVerified && (
        <>
          <label className="field-stack">
            <span>New Password</span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
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

          <label className="field-stack">
            <span>Confirm Password</span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ marginLeft: "8px" }}
              >
                {showConfirmPassword ? "🙈 Hide" : "🙉 Show"} {/* 👁 O 👁 */}
              </button>
            </div>
          </label>

          <button className="primary-button" type="submit">Reset Password</button>
        </>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      <p><Link to="/login">Back to login</Link></p>
    </form>
  )
}
