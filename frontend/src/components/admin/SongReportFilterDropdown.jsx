import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

// Admin-scoped variant of songs/FilterDropdown.jsx's multi-select checkbox-popover UX,
// adapted to filter by song id while displaying each song's title and pending-report count.
export default function SongReportFilterDropdown({ onChange, options, selected }) {
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

  const selectedOptions = options.filter((option) => selected.includes(option.songId))
  const buttonLabel = selectedOptions.length === 0
    ? 'All reported songs'
    : selectedOptions.length === 1 ? selectedOptions[0].songTitle : `${selectedOptions.length} songs`

  function toggleOption(songId) {
    if (selected.includes(songId)) onChange(selected.filter((item) => item !== songId))
    else onChange([...selected, songId])
  }

  return (
    <div className="songs-filter-dropdown admin-song-report-filter" ref={rootRef}>
      <span>Song</span>
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
            <span>All reported songs</span>
          </label>
          {options.length === 0 ? <p className="admin-song-report-filter__empty">No songs currently have pending reports.</p> : options.map((option) => (
            <label className="songs-filter-dropdown__option" key={option.songId}>
              <input checked={selected.includes(option.songId)} onChange={() => toggleOption(option.songId)} type="checkbox" />
              <span>{option.songTitle} ({option.pendingCount})</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}
