import { useState } from 'react'
import * as Yup from 'yup'
import { useAuth } from '../context/AuthContext'
import { updateProfile, checkNameAvailability, checkEmailAvailability } from '../services/authApi'

const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
})

export default function ProfileSettings() {
  const { user, signIn } = useAuth()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await schema.validate({ name, email }, { abortEarly: false })

      const nameRes = await checkNameAvailability(name)
      if (!nameRes.available && name !== user.name) {
        setError('Name already taken')
        return
      }

      const emailRes = await checkEmailAvailability(email)
      if (!emailRes.available && email !== user.email) {
        setError('Email already in use')
        return
      }

      const res = await updateProfile({ name, email })
      if (res.success) {
        signIn(res.user, res.token) // update context
        setSuccess('Changes saved successfully')
      } else {
        setError(res.message)
      }
    } catch (validationError) {
      setError(validationError.errors.join(', '))
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSave}>
      <h1>Profile Settings</h1>

      <label className="field-stack">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="field-stack">
        <span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <button className="primary-button" type="submit">Save Changes</button>
    </form>
  )
}
