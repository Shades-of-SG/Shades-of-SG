import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, AtSign, Globe2, Music2, Save, Video } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getMyCreatorProfile, updateMyCreatorProfile,
} from '../services/creatorProfileService'

const EMPTY_FORM = {
  bio: '', contentFocus: '', creatorTitle: '', featuredQuote: '',
  instagram: '', languages: '', showCommunityReflections: true,
  tagline: '', tiktok: '', visibility: 'PUBLIC', website: '', youtube: '',
}

const SOCIAL_FIELDS = [
  { icon: Globe2, key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
  { icon: AtSign, key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { icon: Video, key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { icon: Music2, key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
]

function toForm(profile) {
  return {
    ...EMPTY_FORM,
    bio: profile.bio || '',
    contentFocus: (profile.contentFocus || []).join(', '),
    creatorTitle: profile.creatorTitle || '',
    featuredQuote: profile.featuredQuote || '',
    instagram: profile.socialLinks?.instagram || '',
    languages: (profile.languages || []).join(', '),
    showCommunityReflections: profile.showCommunityReflections !== false,
    tagline: profile.tagline || '',
    tiktok: profile.socialLinks?.tiktok || '',
    visibility: profile.visibility || 'PUBLIC',
    website: profile.socialLinks?.website || '',
    youtube: profile.socialLinks?.youtube || '',
  }
}

function splitList(value) {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
}

function normalizeSocialValue(value) {
  const trimmed = String(value || '').trim()
  return ['http://', 'https://'].includes(trimmed.toLowerCase()) ? '' : trimmed
}

function validate(values) {
  const errors = {}
  if (values.tagline.length > 160) errors.tagline = 'Use 160 characters or fewer.'
  if (values.bio.length > 2000) errors.bio = 'Use 2,000 characters or fewer.'
  if (values.featuredQuote.length > 300) errors.featuredQuote = 'Use 300 characters or fewer.'
  if (values.creatorTitle.length > 100) errors.creatorTitle = 'Use 100 characters or fewer.'
  for (const [key, label] of [['languages', 'Languages'], ['contentFocus', 'Content focus']]) {
    const items = splitList(values[key])
    if (items.length > 10 || items.some((item) => item.length > 40)) errors[key] = `${label} supports up to 10 values of 40 characters each.`
  }
  for (const key of ['instagram', 'tiktok', 'website', 'youtube']) {
    const value = normalizeSocialValue(values[key])
    if (!value) continue
    try {
      const url = new URL(value)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol')
    } catch { errors[key] = 'Enter a complete http or https URL.' }
  }
  return errors
}

function CharacterCount({ limit, value }) {
  return <small className={value.length > limit ? 'is-error' : ''}>{value.length} / {limit}</small>
}

export default function CreatorProfileSettings() {
  const { token, updateUser, user, userProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [baseline, setBaseline] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const dirty = useMemo(() => Boolean(baseline && JSON.stringify(form) !== baseline), [baseline, form])
  const sharedIdentity = userProfile?.profile || {}
  const initial = (sharedIdentity.displayName || user?.name || 'Creator').trim().charAt(0).toUpperCase() || 'C'

  useEffect(() => {
    let active = true
    getMyCreatorProfile(token)
      .then((profile) => {
        if (!active) return
        const values = toForm(profile)
        setForm(values)
        setBaseline(JSON.stringify(values))
      })
      .catch((error) => active && setMessage(error.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [token])

  useEffect(() => {
    function warnBeforeUnload(event) {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [dirty])

  useEffect(() => {
    function warnBeforeNavigation(event) {
      if (!dirty || event.defaultPrevented || event.button !== 0) return
      const link = event.target.closest?.('a[href]')
      if (!link || link.target === '_blank' || !link.href.startsWith(window.location.origin)) return
      if (!window.confirm('Discard your unsaved profile changes?')) event.preventDefault()
    }
    document.addEventListener('click', warnBeforeNavigation, true)
    return () => document.removeEventListener('click', warnBeforeNavigation, true)
  }, [dirty])

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setMessage('')
  }

  function cancel() {
    if (dirty && !window.confirm('Discard your unsaved profile changes?')) return
    navigate('/creator/profile')
  }

  async function save(event) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      document.querySelector('.creator-profile-settings [aria-invalid="true"]')?.focus()
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const profile = await updateMyCreatorProfile({
        bio: form.bio,
        contentFocus: splitList(form.contentFocus),
        creatorTitle: form.creatorTitle,
        featuredQuote: form.featuredQuote,
        languages: splitList(form.languages),
        showCommunityReflections: form.showCommunityReflections,
        socialLinks: Object.fromEntries(SOCIAL_FIELDS.map(({ key }) => [key, normalizeSocialValue(form[key]) || null])),
        tagline: form.tagline,
        visibility: form.visibility,
      }, token)
      updateUser({ ...user, creatorProfile: profile })
      navigate('/creator/profile', { replace: true, state: { profileSaved: true } })
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="creator-profile creator-profile-settings"><div className="creator-profile-settings__loading" role="status">Loading profile settings…</div></div>

  return (
    <div className="creator-profile creator-profile-settings">
      <header className="creator-profile-settings__header">
        <button aria-label="Back to profile" onClick={cancel} type="button"><ArrowLeft aria-hidden="true" /></button>
        <div><p className="creator-profile-section-kicker">Creator Studio</p><h1>Edit Profile</h1><p>Control what people see on your public creator page. Account and security details stay in Account Settings.</p></div>
      </header>

      <form noValidate onSubmit={save}>
        {message ? <div className="creator-profile-settings__message" role="alert">{message}</div> : null}

        <section className="creator-profile-settings__section">
          <div className="creator-profile-settings__section-heading"><div><h2>Shared profile identity</h2><p>Your photo and display name are managed once in Account Settings and used in both modes.</p></div></div>
          <div className="creator-profile-avatar-editor">
            <div className="creator-profile-avatar">{sharedIdentity.avatarUrl ? <img alt="Current shared profile" src={sharedIdentity.avatarUrl} /> : <span>{initial}</span>}</div>
            <div><strong>{sharedIdentity.displayName || user?.name}</strong><Link className="creator-profile-shared-settings-link" to="/settings#profile">Change photo or display name in Account Settings</Link></div>
          </div>
        </section>

        <section className="creator-profile-settings__section">
          <div className="creator-profile-settings__section-heading"><div><h2>Creator identity</h2><p>The creator-specific title and introduction shown in the profile hero.</p></div></div>
          <div className="creator-profile-form-grid">
            <label><span>Creator title</span><input aria-invalid={Boolean(errors.creatorTitle)} maxLength="100" onChange={(event) => update('creatorTitle', event.target.value)} placeholder="Creator & Storyteller" value={form.creatorTitle} />{errors.creatorTitle ? <small className="field-error">{errors.creatorTitle}</small> : null}</label>
            <label className="is-wide"><span>Short tagline</span><textarea aria-invalid={Boolean(errors.tagline)} maxLength="160" onChange={(event) => update('tagline', event.target.value)} rows="2" value={form.tagline} /><CharacterCount limit={160} value={form.tagline} />{errors.tagline ? <small className="field-error">{errors.tagline}</small> : null}</label>
            <label className="is-wide"><span>About / bio</span><textarea aria-invalid={Boolean(errors.bio)} maxLength="2000" onChange={(event) => update('bio', event.target.value)} rows="6" value={form.bio} /><CharacterCount limit={2000} value={form.bio} />{errors.bio ? <small className="field-error">{errors.bio}</small> : null}</label>
          </div>
        </section>

        <section className="creator-profile-settings__section">
          <div className="creator-profile-settings__section-heading"><div><h2>Creative details</h2><p>Separate multiple languages or focus areas with commas.</p></div></div>
          <div className="creator-profile-form-grid">
            <label><span>Languages</span><input aria-invalid={Boolean(errors.languages)} onChange={(event) => update('languages', event.target.value)} placeholder="English, Mandarin" value={form.languages} />{errors.languages ? <small className="field-error">{errors.languages}</small> : null}</label>
            <label className="is-wide"><span>Content focus or genres</span><input aria-invalid={Boolean(errors.contentFocus)} onChange={(event) => update('contentFocus', event.target.value)} placeholder="Heritage, Community, Storytelling" value={form.contentFocus} />{errors.contentFocus ? <small className="field-error">{errors.contentFocus}</small> : null}</label>
            <label className="is-wide"><span>Featured quote</span><textarea aria-invalid={Boolean(errors.featuredQuote)} maxLength="300" onChange={(event) => update('featuredQuote', event.target.value)} rows="3" value={form.featuredQuote} /><CharacterCount limit={300} value={form.featuredQuote} />{errors.featuredQuote ? <small className="field-error">{errors.featuredQuote}</small> : null}</label>
          </div>
        </section>

        <section className="creator-profile-settings__section">
          <div className="creator-profile-settings__section-heading"><div><h2>Social links</h2><p>Optional links shown on your public profile. Enter complete URLs beginning with http:// or https://.</p></div></div>
          <div className="creator-profile-form-grid">
            {SOCIAL_FIELDS.map(({ icon: Icon, key, label, placeholder }) => <label key={key}><span className="creator-profile-social-field-label"><Icon aria-hidden="true" />{label}</span><input aria-invalid={Boolean(errors[key])} inputMode="url" onChange={(event) => update(key, event.target.value)} placeholder={placeholder} value={form[key]} />{errors[key] ? <small className="field-error">{errors[key]}</small> : null}</label>)}
          </div>
        </section>

        <section className="creator-profile-settings__section">
          <div className="creator-profile-settings__section-heading"><div><h2>Privacy</h2><p>Choose whether people can open your public profile and see community responses.</p></div></div>
          <div className="creator-profile-privacy-grid">
            <label><span>Profile visibility</span><select onChange={(event) => update('visibility', event.target.value)} value={form.visibility}><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select><small>A private profile returns no creator details to other users or guests.</small></label>
            <label className="creator-profile-toggle"><input checked={form.showCommunityReflections} onChange={(event) => update('showCommunityReflections', event.target.checked)} type="checkbox" /><span><strong>Show community reflections publicly</strong><small>Only approved reflections on published songs can appear.</small></span></label>
          </div>
        </section>

        <footer className="creator-profile-settings__actions">
          <button className="is-secondary" disabled={saving} onClick={cancel} type="button">Cancel</button>
          <button disabled={saving || !dirty} type="submit"><Save aria-hidden="true" />{saving ? 'Saving…' : 'Save changes'}</button>
        </footer>
      </form>
    </div>
  )
}
