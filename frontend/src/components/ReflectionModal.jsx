import { useEffect, useRef, useState } from 'react'

const MEMORY_TYPES = ['Nostalgia', 'Family', 'National Day', 'Friendship', 'School', 'Home']

export default function ReflectionModal({ draft, isGuest = false, reflection, songs, user, onClose, onDraftChange, onSave }) {
  const [content, setContent] = useState(reflection?.content || draft?.content || '')
  const [isAnonymous, setIsAnonymous] = useState(reflection?.isAnonymous ?? draft?.isAnonymous ?? false)
  const [songId, setSongId] = useState(reflection?.songId || draft?.songId || '')
  const [guestConfirmed, setGuestConfirmed] = useState(false)
  const [memoryTypes, setMemoryTypes] = useState(reflection?.tags || draft?.tags || [])
  const textareaRef = useRef(null)

  useEffect(() => {
    const close = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [onClose])

  useEffect(() => {
    if (!reflection) onDraftChange?.({ content, isAnonymous, songId, tags: memoryTypes })
  }, [content, isAnonymous, memoryTypes, onDraftChange, reflection, songId])

  function selectSong(event) {
    setSongId(event.target.value)
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function toggleMemoryType(type) {
    setMemoryTypes((current) => current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type])
  }

  function submit(event) {
    event.preventDefault()
    onSave({ content: content.trim(), displayMode: isGuest || isAnonymous ? 'ANONYMOUS' : 'PROFILE', isAnonymous: isGuest || isAnonymous, songId, tags: memoryTypes })
  }

  return (
    <div className="rw-modal-backdrop" onMouseDown={onClose} role="presentation">
      <form aria-labelledby="rw-modal-title" aria-modal="true" className="rw-modal rw-reflection-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit} role="dialog">
        <header className="rw-modal-header rw-reflection-modal__header">
          <div>
            <p>Community Memory Wall</p>
            <h2 id="rw-modal-title">{reflection ? 'Edit Reflection' : 'Add Reflection'}</h2>
            <span>Share a memory inspired by Singapore&apos;s songs.</span>
          </div>
          <button aria-label="Close" onClick={onClose} type="button">&times;</button>
        </header>

        <div className="rw-reflection-modal__body">
          <section className="rw-journal-section">
            <label className="rw-field-label" htmlFor="reflection-song">Song</label>
            <select id="reflection-song" onChange={selectSong} required value={songId}>
              <option disabled value="">Select a song</option>
              {songs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
            </select>
          </section>

          <section className="rw-journal-section">
            <label className="rw-field-label" htmlFor="reflection-content">Reflection</label>
            <textarea
              id="reflection-content"
              maxLength="1000"
              onChange={(event) => setContent(event.target.value)}
              placeholder="Tell us what this song reminds you of..."
              ref={textareaRef}
              required
              rows="6"
              value={content}
            />
            <div className="rw-reflection-help">
              <span>Share a memory, a place, a person, or a feeling.</span>
              <output aria-live="polite">{content.length} / 1000 characters</output>
            </div>
          </section>

          <fieldset className="rw-memory-types">
            <legend>Memory Type <span>Optional</span></legend>
            <div className="rw-memory-type-chips">
              {MEMORY_TYPES.map((type) => (
                <label className="rw-tag-chip" key={type}>
                  <input
                    checked={memoryTypes.includes(type)}
                    onChange={() => toggleMemoryType(type)}
                    type="checkbox"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {!isGuest && (
            <fieldset className="rw-identity-choice">
              <legend>How would you like to appear?</legend>
              <div className="rw-identity-grid">
                <label className={`rw-identity-card${!isAnonymous ? ' is-selected' : ''}`}>
                  <div className="rw-identity-card__title">
                    <input checked={!isAnonymous} name="display-mode" onChange={() => setIsAnonymous(false)} type="radio" />
                    <strong>My Profile</strong>
                  </div>
                  <span className="rw-identity-card__name">{user?.name || 'Your profile'}</span>
                  <p>Your username will be shown.<br />You can edit or delete later.</p>
                </label>
                <label className={`rw-identity-card${isAnonymous ? ' is-selected' : ''}`}>
                  <div className="rw-identity-card__title">
                    <input checked={isAnonymous} name="display-mode" onChange={() => setIsAnonymous(true)} type="radio" />
                    <strong>Anonymous</strong>
                  </div>
                  <p>Your reflection appears as Anonymous.<br />You can still edit it from your account.</p>
                </label>
              </div>
            </fieldset>
          )}

          {isGuest && (
            <fieldset className="rw-identity-choice rw-guest-identity">
              <legend>How you&apos;ll appear</legend>
              <div className="rw-identity-card is-selected">
                <div className="rw-identity-card__title"><span className="rw-selected-dot" aria-hidden="true" /><strong>Anonymous</strong></div>
                <p>Your reflection will be reviewed before appearing on the wall.</p>
              </div>
              <label className="rw-guest-confirmation">
                <input checked={guestConfirmed} onChange={(event) => setGuestConfirmed(event.target.checked)} type="checkbox" />
                <span>I understand I cannot edit or delete this reflection later.</span>
              </label>
            </fieldset>
          )}
        </div>

        <footer className="rw-reflection-modal__footer">
          <button className="rw-modal-cancel" onClick={onClose} type="button">Cancel</button>
          <button className="rw-primary-button" disabled={!content.trim() || !songId || (isGuest && !guestConfirmed)} type="submit">
            {reflection ? 'Save Changes' : 'Save Reflection'}
          </button>
        </footer>
      </form>
    </div>
  )
}
