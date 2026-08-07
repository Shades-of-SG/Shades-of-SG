import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react' //For X, its literally called 'X'
import FilterDropdown from './songs/FilterDropdown'

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'Title', value: 'title' },
  { label: 'Creator', value: 'creator' },
]

function SortDropdown({ direction, onDirectionChange, onSortChange, sort }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const activeLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label || 'Featured'

  function selectOption(value) {
    if (value === sort) {
      onDirectionChange(direction === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(value)
    }
    setOpen(false)
  }

  return (
    <label className="songs-filter-dropdown">
      <span>Sort</span>
      <span className="songs-sort-control">
        <span className="songs-filter-dropdown" ref={rootRef}>
          <button
            aria-expanded={open}
            aria-haspopup="listbox"
            className="songs-filter-dropdown__toggle"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <span>{activeLabel}</span>
            <ChevronDown aria-hidden="true" size={16} />
          </button>
          {open ? (
            <div className="songs-filter-dropdown__panel" role="listbox">
              {SORT_OPTIONS.map((option) => (
                <button
                  aria-selected={option.value === sort}
                  className="songs-filter-dropdown__sort-option"
                  key={option.value}
                  onClick={() => selectOption(option.value)}
                  type="button"
                >
                  <span>{option.label}</span>
                  {option.value === sort ? (direction === 'asc' ? <ArrowUp aria-hidden="true" size={14} /> : <ArrowDown aria-hidden="true" size={14} />) : null}
                </button>
              ))}
            </div>
          ) : null}
        </span>
        <span className="songs-sort-direction">
          <button
            aria-label="Sort ascending"
            aria-pressed={direction === 'asc'}
            onClick={() => onDirectionChange('asc')}
            type="button"
          >
            <ArrowUp aria-hidden="true" size={15} />
          </button>
          <button
            aria-label="Sort descending"
            aria-pressed={direction === 'desc'}
            onClick={() => onDirectionChange('desc')}
            type="button"
          >
            <ArrowDown aria-hidden="true" size={15} />
          </button>
        </span>
      </span>
    </label>
  )
}

export default function FilterBar({
  direction,
  filters,
  hasActiveFilters,
  onChange,
  onClear,
  onDirectionChange,
  onSortChange,
  sort,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount = ['theme', 'language', 'mood'].reduce((count, key) => count + (filters[key]?.length || 0), 0)

  return (
    <form className="filter-bar songs-discovery-toolbar" onSubmit={(event) => event.preventDefault()}>
      <label className="songs-discovery-toolbar__search">
        <span>Search</span>
        <span className="songs-search-field">
          <Search aria-hidden="true" size={19} />
          <input
            onChange={(event) => onChange('search', event.target.value)}
            placeholder="Search songs or creators"
            type="search"
            value={filters.search}
          />
        </span>
      </label>

      <button
        aria-controls="songs-filter-controls"
        aria-expanded={filtersOpen}
        className="songs-filter-toggle"
        onClick={() => setFiltersOpen((current) => !current)}
        type="button"
      >
        <SlidersHorizontal aria-hidden="true" size={18} />
        Filters
        {activeFilterCount > 0 ? <span>{activeFilterCount}</span> : null}
      </button>

      <div className={`songs-filter-controls${filtersOpen ? ' is-open' : ''}`} id="songs-filter-controls">
        <FilterDropdown allLabel="All themes" label="Theme" onChange={(value) => onChange('theme', value)} options={filters.themeOptions} selected={filters.theme} />
        <FilterDropdown allLabel="All languages" label="Language" onChange={(value) => onChange('language', value)} options={filters.languageOptions} selected={filters.language} />
        <FilterDropdown allLabel="All moods" label="Mood" onChange={(value) => onChange('mood', value)} options={filters.moodOptions} selected={filters.mood} />

        <SortDropdown direction={direction} onDirectionChange={onDirectionChange} onSortChange={onSortChange} sort={sort} />

        <button className="songs-clear-filters" disabled={!hasActiveFilters} onClick={onClear} type="button">
          <X /> {/*<X /> or "Clear"*/}
        </button>
      </div>
    </form>
  )
}
