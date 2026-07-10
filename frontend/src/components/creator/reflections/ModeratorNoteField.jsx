import { useState } from 'react'

export default function ModeratorNoteField({ disabled, initialValue = '', onSave }) {
  const [value, setValue] = useState(initialValue)
  const [savedValue, setSavedValue] = useState(initialValue)

  async function save() {
    try {
      await onSave(value.trim())
      setSavedValue(value.trim())
    } catch {
      // The parent keeps the previous server value and displays the request error.
    }
  }

  return (
    <div className="crm-note-field">
      <label htmlFor="crm-moderator-note">Moderator note</label>
      <textarea
        disabled={disabled}
        id="crm-moderator-note"
        maxLength="1000"
        onChange={(event) => setValue(event.target.value)}
        placeholder="Add notes about this reflection..."
        rows="4"
        value={value}
      />
      <div><span>{value.length} / 1000</span><button disabled={disabled || value.trim() === savedValue} onClick={save} type="button">Save note</button></div>
    </div>
  )
}
