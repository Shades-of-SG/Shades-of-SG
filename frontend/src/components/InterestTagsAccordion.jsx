import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { INTEREST_TAG_CATEGORIES, MAX_INTEREST_TAGS } from '../data/profileInterests'

export default function InterestTagsAccordion({ error = '', onChange, selectedTags = [] }) {
  const [limitMessage, setLimitMessage] = useState('')

  function toggleTag(tag) {
    if (selectedTags.includes(tag)) {
      setLimitMessage('')
      onChange(selectedTags.filter((selected) => selected !== tag))
      return
    }
    if (selectedTags.length >= MAX_INTEREST_TAGS) {
      setLimitMessage(`Choose up to ${MAX_INTEREST_TAGS} interests.`)
      return
    }
    setLimitMessage('')
    onChange([...selectedTags, tag])
  }

  return (
    <fieldset aria-describedby={`interest-tags-help${error || limitMessage ? ' interest-tags-error' : ''}`} className="interest-tags">
      <legend>Interests <i>Optional</i></legend>
      <p id="interest-tags-help">Choose up to {MAX_INTEREST_TAGS} topics to share on your profile.</p>
      <div className="interest-tags__groups">
        {INTEREST_TAG_CATEGORIES.map((category) => <details key={category.label} open>
          <summary>{category.label}<ChevronDown aria-hidden="true" /></summary>
          <div className="interest-tags__choices">
            {category.tags.map((tag) => {
              const selected = selectedTags.includes(tag)
              return <button aria-pressed={selected} className={selected ? 'is-selected' : ''} key={tag} onClick={() => toggleTag(tag)} type="button">{tag}</button>
            })}
          </div>
        </details>)}
      </div>
      {error || limitMessage ? <small id="interest-tags-error" role="alert">{error || limitMessage}</small> : null}
    </fieldset>
  )
}
