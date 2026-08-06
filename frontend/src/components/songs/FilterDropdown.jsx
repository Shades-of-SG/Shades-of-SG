import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FilterDropdown({ allLabel = 'All', label, onChange, options, selected }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const buttonLabel = selected.length === 0 ? allLabel : selected.length === 1 ? selected[0] : 'Multiple'

  function toggleOption(value) {
    if (selected.includes(value)) onChange(selected.filter((item) => item !== value))
    else onChange([...selected, value])
  }

  return (
    <div className="songs-filter-dropdown" ref={rootRef}>
      <span>{label}</span>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="songs-filter-dropdown__toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{buttonLabel}</span>
        <ChevronDown aria-hidden="true" size={16} />
      </button>

      {open ? (
        <div className="songs-filter-dropdown__panel" role="listbox">
          <label className="songs-filter-dropdown__option">
            <input checked={selected.length === 0} onChange={() => onChange([])} type="checkbox" />
            <span>{allLabel}</span>
          </label>
          {options.map((value) => (
            <label className="songs-filter-dropdown__option" key={value}>
              <input checked={selected.includes(value)} onChange={() => toggleOption(value)} type="checkbox" />
              <span>{value}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}
