import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'

export default function FilterBar({
  filters,
  hasActiveFilters,
  onChange,
  onClear,
  onSortChange,
  sort,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount = ['theme', 'language', 'mood'].filter((key) => filters[key]).length

  return (
    <form className="filter-bar songs-discovery-toolbar" onSubmit={(event) => event.preventDefault()}>
      <label className="songs-discovery-toolbar__search">
        <span>Search</span>
        <span className="songs-search-field">
          <Search aria-hidden="true" size={19} />
          <input
            onChange={(event) => onChange('search', event.target.value)}
            placeholder="Search songs, artists, themes, or languages"
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
        <label>
          <span>Theme</span>
          <select onChange={(event) => onChange('theme', event.target.value)} value={filters.theme}>
            <option value="">All themes</option>
            {filters.themeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>

        <label>
          <span>Language</span>
          <select onChange={(event) => onChange('language', event.target.value)} value={filters.language}>
            <option value="">All languages</option>
            {filters.languageOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>

        <label>
          <span>Mood</span>
          <select onChange={(event) => onChange('mood', event.target.value)} value={filters.mood}>
            <option value="">All moods</option>
            {filters.moodOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>

        <label>
          <span>Sort</span>
          <select aria-label="Sort songs" onChange={(event) => onSortChange(event.target.value)} value={sort}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="title">A–Z</option>
          </select>
        </label>

        <button className="songs-clear-filters" disabled={!hasActiveFilters} onClick={onClear} type="button">
          Clear filters
        </button>
      </div>
    </form>
  )
}
