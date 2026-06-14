import { Link } from 'react-router-dom'

/*
TODO - Lia

Implement password reset request.
Connect email delivery API.
Add confirmation screen.
*/
export default function ForgotPassword() {
  return (
    <div className="auth-form">
      <p className="eyebrow">Account Recovery</p>
      <h1>Forgot Password</h1>
      <p>Enter your email and a reset link placeholder flow will be wired here.</p>
      <label className="field-stack"><span>Email</span><input placeholder="name@example.com" type="email" /></label>
      <button className="primary-button" type="button">Send Reset Link</button>
      <p><Link to="/login">Back to login</Link></p>
    </div>
  )
}
