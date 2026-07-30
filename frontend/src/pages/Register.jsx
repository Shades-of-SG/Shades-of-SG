/*
import { Link } from 'react-router-dom'

/*
TODO - Lia

Implement registration fields.
Connect account creation API.
Add role and consent handling.

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
*/


import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
//import { registerWithEmail } from '../services/authApi'   //Commented out since there is another one below including the otp
import * as Yup from 'yup'
//lia.otp.start
import { sendEmailOtp, verifyEmailOtp, registerWithEmail, checkNameAvailability, checkEmailAvailability } from '../services/authApi'
//lia.otp.end
import InterestTagsAccordion from "../components/InterestTagsAccordion";
import PasswordToggle from "../components/PasswordToggle";

// Define Yup schema
const registerSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .matches(/[0-9]/, 'Password must contain a number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
  bio: Yup.string()
    .max(200, "Bio must be at most 200 characters")
    .test("no-forbidden-words", "Bio contains forbidden words", (value) => {
      if (!value) return true;
      const forbidden = ["fuck", "ass"];
      return !forbidden.some((w) => value.toLowerCase().includes(w));
    })
})

export default function Register() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  // Form states
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // OTP states
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)

  // Show/hide password
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Availability checks
  const [nameAvailable, setNameAvailable] = useState(true)
  const [emailAvailable, setEmailAvailable] = useState(true)

  // Handlers
  const [checkingName, setCheckingName] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  //Error message below the relevant fields
  const [fieldErrors, setFieldErrors] = useState({})

  // Debounce timers — refs, not locals: a local is re-created every render so the
  // pending timeout would never actually be cleared.
  const nameTimer = useRef(null);
  const emailTimer = useRef(null);

  async function handleNameChange(e) {
    const newName = e.target.value;
    setFormValues({ ...formValues, name: newName });

    clearTimeout(nameTimer.current);
    if (newName.trim().length > 2) {
      setCheckingName(true);
      nameTimer.current = setTimeout(async () => {
        const res = await checkNameAvailability(newName);
        setNameAvailable(res.available);
        setError(res.available ? '' : res.message);
        setCheckingName(false);
      }, 300);
    } else {
      setCheckingName(false);
    }
  }

  async function handleEmailChange(e) {
    const newEmail = e.target.value;
    setFormValues({ ...formValues, email: newEmail });

    clearTimeout(emailTimer.current);
    if (newEmail.includes("@")) {
      setCheckingEmail(true);
      emailTimer.current = setTimeout(async () => {
        const res = await checkEmailAvailability(newEmail);
        setEmailAvailable(res.available);
        setError(res.available ? '' : res.message);
        setCheckingEmail(false);
      }, 400); //lia increased the debounce from 300 to 400
    } else {
      setCheckingEmail(false);
    }
  }


  async function handleSendOtp() {
    setError('')
    setSuccess('')
    setFieldErrors({})

    try {
      // Run full validation (name, email, password, confirmPassword)
      await registerSchema.validate(formValues, { abortEarly: false })

      // Check availability of name and email
      const nameRes = await checkNameAvailability(formValues.name)
      if (!nameRes.available) {
        setFieldErrors(prev => ({ ...prev, name: 'Name already taken' }))
        return
      }

      const emailRes = await checkEmailAvailability(formValues.email)
      if (!emailRes.available) {
        setFieldErrors(prev => ({ ...prev, email: 'Email already registered' }))
        return
      }

      // If everything passes, send OTP
      const res = await sendEmailOtp(formValues.email)
      if (res.success) {
        setOtpSent(true)
        setSuccess("OTP sent to your email. Enter it below to verify.")
      } else {
        setError(res.message)
      }
    } catch (validationError) {
      if (validationError.name === 'ValidationError') {
        //Map Yup errors to fields
        const errors = {}
        validationError.inner.forEach(err => {
          errors[err.path] = err.message
        })
        setFieldErrors(errors)
      } else {
        setError(validationError.message || "Validation failed")
      }
    }
  }


  async function handleVerifyOtp() {
    setError('')
    setSuccess('')

    const res = await verifyEmailOtp(formValues.email, otpCode)
    if (res.success) {
      setOtpVerified(true)
      setSuccess("Email verified. You can create your account now.")
    } else {
      setError(res.message)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!otpVerified) {
      setError("Please verify your email with OTP before registering.")
      return
    }

    try {
      await registerSchema.validate(formValues, { abortEarly: false })

      setIsSubmitting(true)
      const data = await registerWithEmail(
        formValues.name,
        formValues.email,
        formValues.password,
        formValues.bio,
        selectedTags
      );


      // ✅ signIn persists token + user and clears any guest session
      signIn(data.user, data.token)

      const fallbackPath = data.user.role === 'CREATOR' ? '/creator/dashboard' : '/'
      navigate(fallbackPath, { replace: true })
    } catch (validationError) {
      if (validationError.name === 'ValidationError') {
        const errors = {}
        validationError.inner.forEach(err => {
          errors[err.path] = err.message
        })
        setFieldErrors(errors)
      } else {
        setError(validationError.message || "Registration failed. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }




  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <p className="eyebrow">Join Shades of SG</p>
      <h1>Register</h1>

      <label className="field-stack">
        <span>Name</span>
        <input
          value={formValues.name}
          onChange={handleNameChange}
          placeholder="Your name"
          required
        />
        {checkingName && <span className="field-hint">Checking name…</span>}
        {!nameAvailable && !checkingName && (
          <span className="field-hint field-hint--error">
            Name already taken. Please choose another.
          </span>
        )}
        {nameAvailable && !checkingName && formValues.name.trim().length > 2 && (
          <span className="field-hint field-hint--ok">Name available</span>
        )}
        {fieldErrors.name && (
          <span className="field-hint field-hint--error">{fieldErrors.name}</span>
        )}
      </label>

      <label className="field-stack">
        <span>Email</span>
        <input
          type="email"
          value={formValues.email}
          onChange={handleEmailChange}
          placeholder="name@example.com"
          required
        />
        {checkingEmail && <span className="field-hint">Checking email…</span>}
        {!emailAvailable && !checkingEmail && (
          <span className="field-hint field-hint--error">
            Email already registered. Please use another.
          </span>
        )}
        {emailAvailable && !checkingEmail && formValues.email.includes("@") && (
          <span className="field-hint field-hint--ok">Email available</span>
        )}
        {fieldErrors.email && (
          <span className="field-hint field-hint--error">{fieldErrors.email}</span>
        )}
      </label>


      {/*Update password to allow show/hide*/}
      <label className="field-stack">
        <span>Password</span>
        <span className="field-hint">
          Password must contain at least 8 characters, an uppercase letter and a number.
        </span>
        <div className="input-with-action">
          <input
            type={showPassword ? "text" : "password"}
            value={formValues.password}
            onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
            placeholder="Password"
            required
          />
          <PasswordToggle
            isVisible={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
        </div>
        {fieldErrors.password && (
          <span className="field-hint field-hint--error">{fieldErrors.password}</span>
        )}
      </label>


      <label className="field-stack">
        <span>Confirm Password</span>
        <div className="input-with-action">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={formValues.confirmPassword}
            onChange={(e) => setFormValues({ ...formValues, confirmPassword: e.target.value })}
            placeholder="Confirm Password"
            required
          />
          <PasswordToggle
            isVisible={showConfirmPassword}
            label="password confirmation"
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        </div>
        {fieldErrors.confirmPassword && (
          <span className="field-hint field-hint--error">{fieldErrors.confirmPassword}</span>
        )}
      </label>

      <label className="field-stack">
        <span>Bio</span>
        <textarea
          value={formValues.bio}
          onChange={(e) => setFormValues({ ...formValues, bio: e.target.value })}
          placeholder="Tell us about yourself"
          rows={4}
          style={{ resize: "none" }}
        />
        {fieldErrors.bio && (
          <span className="field-hint field-hint--error">{fieldErrors.bio}</span>
        )}
      </label>

      <InterestTagsAccordion selectedTags={selectedTags} setSelectedTags={setSelectedTags} />




      {/*otp.start*/}
      <span className="field-hint">
        Please wait for the relevant prompts as the necessary materials load.
      </span>
      <button
        className="pill-button pill-button--ghost"
        disabled={otpSent}
        onClick={handleSendOtp}
        type="button"
      >
        {otpSent ? "OTP Sent" : "Send OTP"}
      </button>

      {otpSent && (
        <label className="field-stack">
          <span>One-time code</span>
          <div className="input-with-action">
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit OTP"
              type="text"
              value={otpCode}
            />
            <button
              className="field-action"
              disabled={otpVerified}
              onClick={handleVerifyOtp}
              type="button"
            >
              {otpVerified ? 'Verified' : 'Verify'}
            </button>
          </div>
        </label>
      )}

      {/*otp.end*/}



      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="form-success" role="status">{success}</p>}

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>

      <p className="auth-form__links"><Link to="/login">Already have an account?</Link></p>
    </form>
  )
}
