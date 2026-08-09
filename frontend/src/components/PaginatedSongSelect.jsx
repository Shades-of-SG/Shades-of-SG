import { useEffect, useRef, useState } from 'react'
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
  const requestId = useRef(0)

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

  const selectedMissing = value && !songs.some((song) => song.id === value)
  return <div className="paginated-song-select">
    {showSearch ? <label htmlFor={id ? `${id}-search` : undefined}>
      <span>Search {label.toLowerCase()}</span>
      <input aria-label={`Search ${label.toLowerCase()}`} id={id ? `${id}-search` : undefined} onChange={(event) => setSearch(event.target.value)} placeholder="Type a song title" type="search" value={search} />
    </label> : null}
    <label htmlFor={id}>
      <span>{label}</span>
      <select id={id} onChange={(event) => onChange(event.target.value)} required={required} value={value}>
        {allLabel ? <option value="">{allLabel}</option> : <option disabled value="">Select a song</option>}
        {selectedMissing ? <option value={value}>Selected song</option> : null}
        {songs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
      </select>
    </label>
    {error ? <span role="alert">{error} <button onClick={() => setSearch((current) => `${current} `)} type="button">Retry</button></span> : null}
    {showLoadMore && pagination.hasNextPage ? <button aria-label={`Load more ${label.toLowerCase()} options`} disabled={loading} onClick={loadMore} type="button">{loading ? 'Loading songsâ€¦' : 'Load more songs'}</button> : null}
  </div>
}
