import { useState } from 'react'

export default function MoodTagSelector({ selectedTags, onToggleTag, maxSelections = 5 }) {
  const [newTag, setNewTag] = useState('')
  const canAddTag = selectedTags.length < maxSelections
  const maxTagsMessage = `You can add up to ${maxSelections} mood tags. Remove one to add another.`

  function handleAddTag(event) {
    event.preventDefault()

    const trimmedTag = newTag.trim().replace(/^#/, '')

    if (!trimmedTag) {
      return
    }

    if (!canAddTag) {
      return
    }

    const isAlreadySelected = selectedTags.some((tag) => tag.toLowerCase() === trimmedTag.toLowerCase())

    if (!isAlreadySelected) {
      onToggleTag(trimmedTag)
    }

    setNewTag('')
  }

  return (
    <section className="studio-moods">
      <div className="studio-card__section-heading">
        <h3>
          Mood Tags <span>(Max {maxSelections})</span> <span aria-hidden="true"></span>
        </h3>
        <strong>{selectedTags.length} / {maxSelections}</strong>
      </div>

      <div className="studio-moods__grid">
        {selectedTags.map((tag) => (
          <button aria-label={`Remove ${tag} mood tag`} className="studio-mood-pill is-selected" key={tag} onClick={() => onToggleTag(tag)} type="button">
            # {tag} <span aria-hidden="true">x</span>
          </button>
        ))}
      </div>

      <form className="studio-mood-add" onSubmit={handleAddTag}>
        <span aria-hidden="true">+</span>
        <input
          aria-label="Add mood tag"
          aria-describedby="studio-mood-add-message"
          disabled={!canAddTag}
          maxLength={24}
          onChange={(event) => setNewTag(event.target.value)}
          placeholder="Add mood tag"
          value={newTag}
        />
        <button disabled={!newTag.trim() || !canAddTag} type="submit">
          Add
        </button>
      </form>
      <p className={`studio-mood-add__message ${canAddTag ? '' : 'is-visible'}`} id="studio-mood-add-message" aria-live="polite">
        {canAddTag ? '' : maxTagsMessage}
      </p>
    </section>
  )
}
