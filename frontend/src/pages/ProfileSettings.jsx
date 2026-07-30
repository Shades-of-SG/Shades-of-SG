import { useState } from 'react'
import * as Yup from 'yup'
import { useAuth } from '../context/AuthContext'
import { updateProfile, checkNameAvailability, checkEmailAvailability } from '../services/authApi'
import InterestTagsAccordion from "../components/InterestTagsAccordion";

const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  bio: Yup.string()
    .max(200, "Bio must be at most 200 characters")
    .test("no-forbidden-words", "Bio contains forbidden words", (value) => {
      if (!value) return true;
      const forbidden = ["fuck", "ass"];
      return !forbidden.some((w) => value.toLowerCase().includes(w));
    }),
})

export default function ProfileSettings() {
  const { user, signIn } = useAuth()

  // AuthProvider resolves the stored user synchronously, so these are already
  // populated on the first render after a refresh instead of falling back to blanks.
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [selectedTags, setSelectedTags] = useState(user?.interestTags ?? [])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await schema.validate({ name, email, bio }, { abortEarly: false })

      const nameRes = await checkNameAvailability(name) //Try to make into real time checking same as login/register with debounce
      if (!nameRes.available && name !== user.name) {
        setError('Name already taken')
        return
      }

      const emailRes = await checkEmailAvailability(email)
      if (!emailRes.available && email !== user.email) {
        setError('Email already in use')
        return
      }

      const res = await updateProfile({ name, email, bio, interestTags: selectedTags });
      if (res.success) {
        signIn(res.user, res.token); // update context
        setSuccess('Changes saved successfully');
      } else {
        setError(res.message);
      }
    } catch (err) {
      if (err.name === 'ValidationError') {
        setError(err.errors.join(', '));
      } else {
        setError(err.message || 'Something went wrong');
      }
    }
  }

  if (!user) {
    return (
      <section className="settings-card">
        <p className="settings-card__loading">Loading profile…</p>
      </section>
    )
  }

  return (
    <form className="settings-card settings-form" onSubmit={handleSave}>
      <header className="settings-card__head">
        <h2>Profile</h2>
        <p>Update the name, email, bio, and interests shown on your profile.</p>
      </header>

      <label className="field-stack">
        <span>Name</span>
        <input onChange={(e) => setName(e.target.value)} placeholder="Your name" value={name} />
      </label>

      <label className="field-stack">
        <span>Email</span>
        <input
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          type="email"
          value={email}
        />
      </label>

      <label className="field-stack">
        <span>Bio</span>
        <textarea
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself"
          rows={4}
          style={{ resize: "none" }}
          value={bio}
        />
      </label>

      <InterestTagsAccordion selectedTags={selectedTags} setSelectedTags={setSelectedTags} />

      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="form-success" role="status">{success}</p>}

      <button className="primary-button button--block" type="submit">Save Changes</button>
    </form>
  )
}
