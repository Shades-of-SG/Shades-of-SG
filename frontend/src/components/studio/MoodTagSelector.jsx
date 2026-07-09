import { useState } from 'react'

export default function MoodTagSelector({ selectedTags, onToggleTag, maxSelections = 5 }) {
  const [newTag, setNewTag] = useState('')
  const canAddTag = selectedTags.length < maxSelections

  function handleAddTag(event) {
    event.preventDefault()

    const trimmedTag = newTag.trim().replace(/^#/, '')

    if (!trimmedTag || !canAddTag) {
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
          Mood Tags <span>(Max {maxSelections})</span> <span aria-hidden="true">i</span>
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
          disabled={!canAddTag}
          maxLength={24}
          onChange={(event) => setNewTag(event.target.value)}
          placeholder={canAddTag ? 'Add mood tag' : 'Maximum mood tags reached'}
          value={newTag}
        />
        <button disabled={!newTag.trim() || !canAddTag} type="submit">
          Add
        </button>
      </form>
    </section>
  )
}
