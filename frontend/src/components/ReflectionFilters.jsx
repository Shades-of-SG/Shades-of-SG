export default function ReflectionFilters({ query, setQuery, showAdd, songId, setSongId, songs, sort, setSort, onAdd }) {
  return (
    <section className={`rw-filters${showAdd ? '' : ' rw-filters--without-action'}`} aria-label="Reflection filters">
      <label className="rw-search">
        <span>Search reflections</span>
        <input onChange={(event) => setQuery(event.target.value)} placeholder="Search memories..." type="search" value={query} />
      </label>
      <label>
        <span>Song</span>
        <select onChange={(event) => setSongId(event.target.value)} value={songId}>
          <option value="">All songs</option>
          {songs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
        </select>
      </label>
      <label>
        <span>Sort</span>
        <select onChange={(event) => setSort(event.target.value)} value={sort}>
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
        </select>
      </label>
      {showAdd && <button className="rw-primary-button" onClick={onAdd} type="button">+ Add Reflection</button>}
    </section>
  )
}
