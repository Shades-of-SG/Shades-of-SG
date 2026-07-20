import { useEffect, useRef, useState } from 'react'

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]'

export default function EditProfileModal({ error, onClose, onSave, saving, user }) {
  const [values, setValues] = useState({ email: user.email || '', name: user.name || '' })
  const formRef = useRef(null)
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose()
      if (event.key !== 'Tab') return

      const focusable = [...(formRef.current?.querySelectorAll(FOCUSABLE) || [])]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, saving])

  function change(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  return (
    <div
      aria-labelledby="edit-profile-title"
      aria-modal="true"
      className="profile-modal"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}
      role="dialog"
    >
      <form onSubmit={(event) => { event.preventDefault(); onSave(values) }} ref={formRef}>
        <div className="profile-modal__heading">
          <div><p>Account details</p><h2 id="edit-profile-title">Edit profile</h2></div>
          <button aria-label="Close edit profile" disabled={saving} onClick={onClose} type="button">×</button>
        </div>
        <p className="profile-modal__intro">Update the account details currently supported by Shades of SG.</p>
        <label>
          <span>Name</span>
          <input autoComplete="name" maxLength="100" onChange={(event) => change('name', event.target.value)} ref={nameRef} required value={values.name} />
        </label>
        <label>
          <span>Email</span>
          <input autoComplete="email" onChange={(event) => change('email', event.target.value)} required type="email" value={values.email} />
        </label>
        {error ? <p className="profile-modal__error" role="alert">{error}</p> : null}
        <div className="profile-modal__actions">
          <button disabled={saving} onClick={onClose} type="button">Cancel</button>
          <button className="profile-button" disabled={saving || !values.name.trim() || !values.email.trim()} type="submit">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
