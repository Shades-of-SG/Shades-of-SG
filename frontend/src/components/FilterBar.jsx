export default function FilterBar({ filters, onChange }) {
  return <form className="filter-bar" onSubmit={(event) => event.preventDefault()}>
    <label><span>Search</span><input onChange={(event) => onChange('search', event.target.value)} placeholder="Search songs, artists, themes, or languages" type="search" value={filters.search} /></label>
    <label><span>Theme</span><select onChange={(event) => onChange('theme', event.target.value)} value={filters.theme}><option value="">All</option>{filters.themeOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    <label><span>Language</span><select onChange={(event) => onChange('language', event.target.value)} value={filters.language}><option value="">All</option>{filters.languageOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    <label><span>Mood</span><select onChange={(event) => onChange('mood', event.target.value)} value={filters.mood}><option value="">All</option>{filters.moodOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
  </form>
}
