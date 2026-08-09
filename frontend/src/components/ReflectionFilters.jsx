import PaginatedSongSelect from './PaginatedSongSelect'

export default function ReflectionFilters({ query, setQuery, showAdd, songId, setSongId, songs, sort, setSort, onAdd }) {
  return (
    <section className={`rw-filters${showAdd ? '' : ' rw-filters--without-action'}`} aria-label="Reflection filters">
      <label className="rw-search">
        <span>Search reflections</span>
        <input onChange={(event) => setQuery(event.target.value)} placeholder="Search memories..." type="search" value={query} />
      </label>
      <PaginatedSongSelect allLabel="All songs" initialSongs={songs} label="Song" onChange={setSongId} showLoadMore={false} showSearch={false} value={songId} />
      <label>
        <span>Sort</span>
        <select onChange={(event) => setSort(event.target.value)} value={sort}>
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="most_liked">Most liked</option>
          <option value="most_discussed">Most discussed</option>
        </select>
      </label>
      {showAdd && <button className="rw-primary-button" onClick={onAdd} type="button">+ Add Reflection</button>}
    </section>
  )
}
