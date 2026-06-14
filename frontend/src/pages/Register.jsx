import { Link } from 'react-router-dom'

/*
TODO - Lia

Implement registration fields.
Connect account creation API.
Add role and consent handling.
*/
export default function Register() {
  return (
    <div className="auth-form">
      <p className="eyebrow">Join Shades of SG</p>
      <h1>Register</h1>
      <label className="field-stack"><span>Name</span><input placeholder="Your name" /></label>
      <label className="field-stack"><span>Email</span><input placeholder="name@example.com" type="email" /></label>
      <label className="field-stack"><span>Password</span><input placeholder="Password" type="password" /></label>
      <button className="primary-button" type="button">Register</button>
      <p><Link to="/login">Already have an account?</Link></p>
    </div>
  )
}
