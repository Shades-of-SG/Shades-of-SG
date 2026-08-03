import { useEffect, useMemo, useRef, useState } from 'react'
import { Accessibility, Camera, Eye, ImageOff, Languages, LockKeyhole, Save, Shield, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import InterestTagsAccordion from '../components/InterestTagsAccordion'
import SettingsNav from '../components/SettingsNav'
import { useAuth } from '../context/AuthContext'
import { ALLOWED_INTEREST_TAGS, MAX_INTEREST_TAGS } from '../data/profileInterests'
import { removeUserAvatar, updateMyUserProfile, uploadUserAvatar } from '../services/userProfileService'
import '../Settings.css'

const EMPTY_FORM = {
  bio: '', displayName: '', fontSize: 'MEDIUM', location: '', preferredLanguage: '',
  interestTags: [],
  profileVisibility: 'PUBLIC', reducedMotion: false, showBadges: true,
  showReflections: true, showRhythmRanking: true, theme: 'SYSTEM',
}

function profileForm(profile = {}) {
  return Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, profile[key] ?? EMPTY_FORM[key]]))
}

function validate(form, avatarFile) {
  const errors = {}
  const name = form.displayName.trim()
  if (name.length < 2) errors.displayName = 'Use at least 2 characters.'
  if (name.length > 80) errors.displayName = 'Use 80 characters or fewer.'
  if (form.bio.length > 500) errors.bio = 'Use 500 characters or fewer.'
  if (form.location.length > 100) errors.location = 'Use 100 characters or fewer.'
  if (form.preferredLanguage.length > 40) errors.preferredLanguage = 'Use 40 characters or fewer.'
  if (!Array.isArray(form.interestTags) || form.interestTags.some((tag) => !ALLOWED_INTEREST_TAGS.has(tag))) errors.interestTags = 'Choose supported interest tags.'
  else if (new Set(form.interestTags).size !== form.interestTags.length) errors.interestTags = 'Choose each interest only once.'
  else if (form.interestTags.length > MAX_INTEREST_TAGS) errors.interestTags = `Choose no more than ${MAX_INTEREST_TAGS} interests.`
  if (avatarFile && avatarFile.size > 5 * 1024 * 1024) errors.avatar = 'Profile photo must be 5 MB or smaller.'
  return errors
}

function Toggle({ checked, description, label, onChange }) {
  return (
    <label className="account-settings-toggle">
      <span><strong>{label}</strong><small>{description}</small></span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  )
}

export default function Settings({ section = '' }) {
  const auth = useAuth()
  if (auth.profileLoading && !auth.userProfile) return <div className="account-settings-loading" role="status">Loading settings…</div>
  if (!auth.userProfile) return <div className="account-settings-loading" role="alert">Settings could not be loaded. Refresh the page to try again.</div>
  return <SettingsForm auth={auth} section={section} />
}

function SettingsForm({ auth, section }) {
  const { token, updateUser, updateUserProfile, user, userProfile } = auth
  const fileInput = useRef(null)
  const [form, setForm] = useState(() => profileForm(userProfile.profile))
  const [baseline, setBaseline] = useState(() => JSON.stringify(profileForm(userProfile.profile)))
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const target = section === 'account-security' ? '#account' : section === 'data-privacy' ? '#privacy' : section === 'profile' ? '#profile' : window.location.hash
    if (!target) return undefined
    const frame = requestAnimationFrame(() => document.querySelector(target)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [section])

  const previewUrl = useMemo(() => avatarFile ? URL.createObjectURL(avatarFile) : '', [avatarFile])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])
  const currentAvatar = previewUrl || (!avatarRemoved ? userProfile?.profile?.avatarUrl : '')
  const dirty = Boolean(baseline && (JSON.stringify(form) !== baseline || avatarFile || avatarRemoved))
  const initial = form.displayName.trim().charAt(0).toUpperCase() || 'U'

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setMessage('')
  }

  function chooseAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((current) => ({ ...current, avatar: 'Choose a JPG, PNG, or WebP image.' }))
      return
    }
    setAvatarFile(file)
    setAvatarRemoved(false)
    setErrors((current) => ({ ...current, avatar: '' }))
  }

  async function save(event) {
    event.preventDefault()
    const nextErrors = validate(form, avatarFile)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      document.querySelector('.account-settings [aria-invalid="true"]')?.focus()
      return
    }
    setSaving(true)
    setMessage('')
    try {
      let response = await updateMyUserProfile({
        ...form,
        bio: form.bio.trim(), displayName: form.displayName.trim(), location: form.location.trim(),
        preferredLanguage: form.preferredLanguage.trim(),
      }, token)
      if (avatarFile) response = await uploadUserAvatar(avatarFile, token)
      else if (avatarRemoved) response = await removeUserAvatar(token)
      const next = { ...userProfile, profile: response.profile }
      updateUserProfile(next)
      updateUser({ ...user, avatarUrl: response.profile.avatarUrl, bio: response.profile.bio, name: response.profile.displayName, sharedProfile: response.profile })
      const values = profileForm(response.profile)
      setForm(values)
      setBaseline(JSON.stringify(values))
      setAvatarFile(null)
      setAvatarRemoved(false)
      if (fileInput.current) fileInput.current.value = ''
      setMessage('Settings saved.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    if (!userProfile?.profile) return
    const values = profileForm(userProfile.profile)
    setForm(values)
    setBaseline(JSON.stringify(values))
    setAvatarFile(null)
    setAvatarRemoved(false)
    setErrors({})
    setMessage('Changes discarded.')
  }

  return (
    <div className="account-settings">
      <header className="account-settings__hero">
        <p>Account centre</p><h1>Settings</h1>
        <span>Manage the shared profile and preferences used in both User and Creator modes.</span>
      </header>
      <SettingsNav />

      <form noValidate onSubmit={save}>
        {message ? <div aria-live="polite" className="account-settings__message" role="status">{message}</div> : null}

        <section className="account-settings__section" id="profile">
          <div className="account-settings__heading"><UserRound aria-hidden="true" /><div><h2>Profile</h2><p>Your name and photo are shared across the site.</p></div></div>
          <div className="account-settings-avatar">
            <div>{currentAvatar ? <img alt="Profile preview" src={currentAvatar} /> : <span>{initial}</span>}</div>
            <div><input accept="image/jpeg,image/png,image/webp" hidden onChange={chooseAvatar} ref={fileInput} type="file" /><button onClick={() => fileInput.current?.click()} type="button"><Camera aria-hidden="true" />{currentAvatar ? 'Replace photo' : 'Upload photo'}</button><button className="is-secondary" disabled={!currentAvatar} onClick={() => { setAvatarFile(null); setAvatarRemoved(Boolean(userProfile.profile.avatarUrl)); if (fileInput.current) fileInput.current.value = '' }} type="button"><ImageOff aria-hidden="true" />Remove</button><small>JPG, PNG, or WebP, up to 5 MB.</small>{errors.avatar ? <em>{errors.avatar}</em> : null}</div>
          </div>
          <div className="account-settings-grid">
            <label><span>Display name</span><input aria-invalid={Boolean(errors.displayName)} maxLength="80" onChange={(event) => update('displayName', event.target.value)} value={form.displayName} />{errors.displayName ? <small>{errors.displayName}</small> : null}</label>
            <label><span>Location <i>Optional</i></span><input aria-invalid={Boolean(errors.location)} maxLength="100" onChange={(event) => update('location', event.target.value)} placeholder="Singapore" value={form.location} />{errors.location ? <small>{errors.location}</small> : null}</label>
            <label className="is-wide"><span>Bio <i>Optional</i></span><textarea aria-invalid={Boolean(errors.bio)} maxLength="500" onChange={(event) => update('bio', event.target.value)} rows="4" value={form.bio} /><b>{form.bio.length} / 500</b>{errors.bio ? <small>{errors.bio}</small> : null}</label>
            <label><span>Profile visibility</span><select onChange={(event) => update('profileVisibility', event.target.value)} value={form.profileVisibility}><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select><b>Private profiles return no identity or activity to other people.</b></label>
          </div>
          <InterestTagsAccordion error={errors.interestTags} onChange={(value) => update('interestTags', value)} selectedTags={form.interestTags} />
        </section>

        <section className="account-settings__section" id="account">
          <div className="account-settings__heading"><LockKeyhole aria-hidden="true" /><div><h2>Account</h2><p>Sign-in and security information.</p></div></div>
          <div className="account-settings-account-row"><div><strong>Email address</strong><span>{userProfile.account.email} · {userProfile.account.emailVerified === false ? 'Verification required' : 'Verified'}</span><small>Email changes require password confirmation and verification of the new address, so they are not available here yet.</small></div><Link to="/forgot-password">Reset password</Link></div>
        </section>

        <section className="account-settings__section" id="preferences">
          <div className="account-settings__heading"><Accessibility aria-hidden="true" /><div><h2>Preferences</h2><p>Saved presentation and accessibility choices.</p></div></div>
          <div className="account-settings-grid">
            <label><span><Languages aria-hidden="true" /> Preferred language</span><input aria-invalid={Boolean(errors.preferredLanguage)} maxLength="40" onChange={(event) => update('preferredLanguage', event.target.value)} placeholder="English" value={form.preferredLanguage} />{errors.preferredLanguage ? <small>{errors.preferredLanguage}</small> : null}</label>
            <label><span>Theme</span><select onChange={(event) => update('theme', event.target.value)} value={form.theme}><option value="SYSTEM">Use device setting</option><option value="LIGHT">Light</option><option value="DARK">Dark</option></select></label>
            <label><span>Text size</span><select onChange={(event) => update('fontSize', event.target.value)} value={form.fontSize}><option value="SMALL">Small</option><option value="MEDIUM">Medium</option><option value="LARGE">Large</option></select></label>
          </div>
          <Toggle checked={form.reducedMotion} description="Reduce decorative transitions and movement." label="Reduce motion" onChange={(value) => update('reducedMotion', value)} />
        </section>

        <section className="account-settings__section" id="privacy">
          <div className="account-settings__heading"><Shield aria-hidden="true" /><div><h2>Privacy</h2><p>Choose which activity appears on your public user profile.</p></div></div>
          <div className="account-settings-toggle-list">
            <Toggle checked={form.showBadges} description="Show earned achievements." label="Show badges" onChange={(value) => update('showBadges', value)} />
            <Toggle checked={form.showRhythmRanking} description="Show your best score, ranking, and games played." label="Show rhythm summary" onChange={(value) => update('showRhythmRanking', value)} />
            <Toggle checked={form.showReflections} description="Show approved reflections that use your profile identity." label="Show reflections" onChange={(value) => update('showReflections', value)} />
          </div>
          <p className="account-settings__privacy-note"><Eye aria-hidden="true" /> These controls never expose pending, rejected, flagged, or anonymous reflections.</p>
        </section>

        <footer className="account-settings__actions"><button className="is-secondary" disabled={saving || !dirty} onClick={cancel} type="button">Cancel</button><button disabled={saving || !dirty} type="submit"><Save aria-hidden="true" />{saving ? 'Saving…' : 'Save changes'}</button></footer>
      </form>
    </div>
  )
}
