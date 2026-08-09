import { useState } from 'react'
import PaginatedSongSelect from '../../PaginatedSongSelect'

export default function ModerationFilters({ filters, hasActiveFilters, onChange, onClear, songs }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="crm-filter-shell">
      <button aria-expanded={isOpen} className="crm-filter-toggle" onClick={() => setIsOpen((current) => !current)} type="button">
        Filters {hasActiveFilters ? <span>Active</span> : null}
      </button>
      {isOpen ? <button aria-label="Close filter drawer" className="crm-filter-backdrop" onClick={() => setIsOpen(false)} type="button" /> : null}
      <div className={`crm-filters${isOpen ? ' is-open' : ''}`}>
      <div className="crm-filter-mobile-header"><strong>Filter reflections</strong><button aria-label="Close filters" onClick={() => setIsOpen(false)} type="button">×</button></div>
      <label className="crm-search">
        <span className="crm-sr-only">Search reflections</span>
        <span aria-hidden="true" className="crm-search__icon">⌕</span>
        <input
          onChange={(event) => onChange('search', event.target.value)}
          placeholder="Search memories, authors, songs or tags…"
          type="search"
          value={filters.search}
        />
      </label>
      <PaginatedSongSelect allLabel="All songs" initialSongs={songs} label="Song" onChange={(value) => onChange('songId', value)} value={filters.songId} />
      <label>
        <span>Submitted since</span>
        <input onChange={(event) => onChange('dateFrom', event.target.value)} type="date" value={filters.dateFrom} />
      </label>
      <label className="crm-anonymous-toggle">
        <input checked={filters.anonymousOnly} onChange={(event) => onChange('anonymousOnly', event.target.checked)} type="checkbox" />
        <span>Anonymous only</span>
      </label>
      {hasActiveFilters ? <button className="crm-clear-filters" onClick={() => { onClear(); setIsOpen(false) }} type="button">Clear filters</button> : null}
      </div>
    </div>
  )
}
