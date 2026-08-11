import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { getReflectionSongs } from '../services/reflectionService'

export default function PaginatedSongSelect({
  allLabel = '',
  id,
  initialSongs = [],
  label = 'Song',
  onChange,
  required = false,
  showLoadMore = true,
  showSearch = true,
  value = '',
}) {
  const [songs, setSongs] = useState(initialSongs)
  const [pagination, setPagination] = useState(initialSongs.pagination || { page: 1, hasNextPage: false })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const requestId = useRef(0)
  const pickerRef = useRef(null)

  useEffect(() => {
    if (search) return
    const timer = window.setTimeout(() => {
      setSongs(initialSongs)
      setPagination(initialSongs.pagination || { page: 1, hasNextPage: false })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialSongs, search])

  useEffect(() => {
    if (!search.trim()) return undefined
    const currentRequest = ++requestId.current
    const timer = window.setTimeout(() => {
      setLoading(true); setError('')
      getReflectionSongs({ page: 1, search })
        .then((items) => {
          if (currentRequest !== requestId.current) return
          setSongs(items); setPagination(items.pagination)
        })
        .catch((nextError) => { if (currentRequest === requestId.current) setError(nextError.message) })
        .finally(() => { if (currentRequest === requestId.current) setLoading(false) })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [search])

  async function loadMore() {
    if (loading || !pagination.hasNextPage) return
    setLoading(true); setError('')
    try {
      const items = await getReflectionSongs({ page: pagination.page + 1, search })
      const known = new Set(songs.map((song) => song.id))
      setSongs((current) => [...current, ...items.filter((song) => !known.has(song.id))])
      setPagination(items.pagination)
    } catch (nextError) { setError(nextError.message) }
    finally { setLoading(false) }
  }

  const optionSongs = showSearch ? songs : initialSongs
  const selectedMissing = value && !optionSongs.some((song) => song.id === value)
  const selectedSong = songs.find((song) => song.id === value) || initialSongs.find((song) => song.id === value)
  const visibleSongs = songs.filter((song) => !search.trim() || song.title.toLowerCase().includes(search.trim().toLowerCase()))

  if (showSearch) return <div
    className="paginated-song-select paginated-song-picker"
    onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }}
    ref={pickerRef}
  >
    <span className="paginated-song-picker__label" id={id ? `${id}-label` : undefined}>{label}</span>
    <button
      aria-controls={id ? `${id}-options` : undefined}
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-labelledby={id ? `${id}-label ${id}` : undefined}
      className="paginated-song-picker__trigger"
      id={id}
      onClick={() => {
        setOpen((current) => !current)
        if (!open) setSearch('')
      }}
      role="combobox"
      type="button"
    >
      <span>{selectedSong?.title || (selectedMissing ? 'Selected song' : 'Select a song')}</span>
      <ChevronDown aria-hidden="true" size={18} />
    </button>
    {open ? <div className="paginated-song-picker__menu">
      <div className="paginated-song-picker__search">
        <Search aria-hidden="true" size={17} />
        <input
          aria-label={`Search ${label.toLowerCase()}`}
          autoComplete="off"
          autoFocus
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
              pickerRef.current?.querySelector('[role="combobox"]')?.focus()
            }
          }}
          placeholder="Search songs"
          type="search"
          value={search}
        />
      </div>
      <div className="paginated-song-picker__options" id={id ? `${id}-options` : undefined} role="listbox">
        {visibleSongs.length ? visibleSongs.map((song) => <button
          aria-selected={song.id === value}
          className={song.id === value ? 'is-selected' : ''}
          key={song.id}
          onClick={() => {
            onChange(song.id)
            setOpen(false)
            setSearch('')
          }}
          onMouseDown={(event) => event.preventDefault()}
          role="option"
          type="button"
        >{song.title}</button>) : <p>{loading ? 'Searching songs…' : 'No songs found'}</p>}
        {showLoadMore && pagination.hasNextPage ? <button className="paginated-song-picker__more" disabled={loading} onClick={loadMore} onMouseDown={(event) => event.preventDefault()} type="button">{loading ? 'Loading songs…' : 'Load more songs'}</button> : null}
      </div>
      {error ? <span className="paginated-song-picker__error" role="alert">{error} <button onClick={() => setSearch((current) => `${current} `)} type="button">Retry</button></span> : null}
    </div> : null}
  </div>

  return <div className="paginated-song-select">
    <label htmlFor={id}>
      <span>{label}</span>
      <select id={id} onChange={(event) => onChange(event.target.value)} required={required} value={value}>
        {allLabel ? <option value="">{allLabel}</option> : <option disabled value="">Select a song</option>}
        {selectedMissing ? <option value={value}>Selected song</option> : null}
        {optionSongs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
      </select>
    </label>
    {error ? <span role="alert">{error} <button onClick={() => setSearch((current) => `${current} `)} type="button">Retry</button></span> : null}
    {showLoadMore && pagination.hasNextPage ? <button aria-label={`Load more ${label.toLowerCase()} options`} disabled={loading} onClick={loadMore} type="button">{loading ? 'Loading songsâ€¦' : 'Load more songs'}</button> : null}
  </div>
}
