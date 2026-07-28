import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, MoonStar, Music2, Sparkles, Sunrise, UsersRound, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import FilterBar from '../components/FilterBar'
import Reveal from '../components/Reveal'
import SongCard from '../components/SongCard'
import { getPublishedSongs } from '../services/publicSongService'

const emptyFilters = { search: '', theme: '', language: '', mood: '' }
const sortLabels = { featured: 'Featured', newest: 'Newest', title: 'A–Z' }

function hasFilters(filters) {
  return Object.values(filters).some((value) => value.trim())
}

function byNewest(first, second) {
  const firstDate = Date.parse(first.publishedDate || first.createdAt || 0) || 0
  const secondDate = Date.parse(second.publishedDate || second.createdAt || 0) || 0
  return secondDate - firstDate
}

function ThemeIcon({ theme }) {
  const normalizedTheme = theme.toLowerCase()
  if (normalizedTheme.includes('unity') || normalizedTheme.includes('harmony') || normalizedTheme.includes('community')) {
    return <UsersRound aria-hidden="true" size={18} />
  }
  if (normalizedTheme.includes('identity') || normalizedTheme.includes('national')) {
    return <MoonStar aria-hidden="true" size={18} />
  }
  if (normalizedTheme.includes('resilien') || normalizedTheme.includes('hope')) {
    return <Sunrise aria-hidden="true" size={18} />
  }
  if (normalizedTheme.includes('celebrat') || normalizedTheme.includes('fun')) {
    return <Sparkles aria-hidden="true" size={18} />
  }
  return <Music2 aria-hidden="true" size={18} />
}

function FeaturedSong({ onSurprise, song }) {
  const tags = [...(song.languages || []), ...(song.moodTags || [])].slice(0, 5)

  return (
    <Reveal as="section" aria-labelledby="featured-song-title" className="songs-featured">
      <div className="songs-featured__artwork">
        {song.coverImageUrl ? (
          <img alt={`${song.title} cover`} src={song.coverImageUrl} />
        ) : (
          <div className="songs-featured__fallback"><Music2 aria-hidden="true" size={52} /></div>
        )}
      </div>
      <div className="songs-featured__content">
        <div className="songs-featured__meta">
          <span>Featured Singapore Song</span>
          {song.theme ? <span>{song.theme}</span> : null}
        </div>
        <h2 id="featured-song-title">{song.title}</h2>
        {song.artist ? <p className="songs-featured__artist">{song.artist}</p> : null}
        {song.description ? <p className="songs-featured__description">{song.description}</p> : null}
        {tags.length > 0 ? (
          <div aria-label="Featured song tags" className="songs-featured__tags">
            {tags.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}
          </div>
        ) : null}
        <div className="songs-featured__actions">
          <Link className="songs-primary-action" to={`/songs/${song.id}`}>
            Explore Song <ArrowRight aria-hidden="true" size={17} />
          </Link>
          <button className="songs-surprise-action" onClick={onSurprise} type="button">
            <Sparkles aria-hidden="true" size={16} /> Play a Singapore song
          </button>
        </div>
      </div>
    </Reveal>
  )
}

function SongSkeletons() {
  return (
    <section aria-label="Loading published songs" className="songs-grid songs-skeleton-grid" role="status">
      <span className="sr-only">Loading published songs</span>
      {[0, 1, 2].map((item) => (
        <div aria-hidden="true" className="song-skeleton" key={item}>
          <span className="song-skeleton__image" />
          <span className="song-skeleton__line song-skeleton__line--short" />
          <span className="song-skeleton__line song-skeleton__line--title" />
          <span className="song-skeleton__line" />
          <span className="song-skeleton__line" />
        </div>
      ))}
    </section>
  )
}

export default function SongsLibrary() {
  const navigate = useNavigate()
  const [songs, setSongs] = useState([])
  const [availableSongs, setAvailableSongs] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [sort, setSort] = useState('featured')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const filtersActive = hasFilters(filters)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      getPublishedSongs(filters)
        .then((data) => {
          if (!active) return
          setSongs(data)
          if (!hasFilters(filters)) setAvailableSongs(data)
          setError('')
        })
        .catch((nextError) => active && setError(nextError.message))
        .finally(() => active && setLoading(false))
    }, filters.search ? 250 : 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [filters])

  const catalog = availableSongs.length > 0 ? availableSongs : songs
  const options = useMemo(() => ({
    languageOptions: [...new Set(catalog.flatMap((song) => song.languages || []))].sort(),
    moodOptions: [...new Set(catalog.flatMap((song) => song.moodTags || []))].sort(),
    themeOptions: [...new Set(catalog.map((song) => song.theme).filter(Boolean))].sort(),
  }), [catalog])
  const themeCounts = useMemo(() => catalog.reduce((counts, song) => {
    if (!song.theme) return counts
    counts.set(song.theme, (counts.get(song.theme) || 0) + 1)
    return counts
  }, new Map()), [catalog])

  const featuredSong = availableSongs[0] || (!filtersActive ? songs[0] : null)
  const sortedSongs = useMemo(() => {
    const nextSongs = [...songs]
    if (sort === 'newest') return nextSongs.sort(byNewest)
    if (sort === 'title') return nextSongs.sort((first, second) => first.title.localeCompare(second.title))
    return nextSongs
  }, [songs, sort])

  const gridSongs = sortedSongs

  const activeFilters = [
    filters.search && { key: 'search', label: `Search: ${filters.search}` },
    filters.theme && { key: 'theme', label: filters.theme },
    filters.language && { key: 'language', label: filters.language },
    filters.mood && { key: 'mood', label: filters.mood },
  ].filter(Boolean)

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function clearFilters() {
    setFilters(emptyFilters)
  }

  function openRandomSong() {
    if (catalog.length === 0) return
    const song = catalog[Math.floor(Math.random() * catalog.length)]
    navigate(`/songs/${song.id}`)
  }

  return (
    <div className="page-stack songs-library-page">
      <Reveal as="header" className="songs-library-intro">
        <div aria-hidden="true" className="songs-header-art">
          <svg className="songs-header-art__crescent" viewBox="0 0 120 120">
            <path d="M82 16C43 25 26 68 48 101" />
          </svg>
          <div className="songs-header-art__stars">
            {[0, 1, 2, 3, 4].map((star) => <span key={star} />)}
          </div>
          <svg className="songs-header-art__skyline" viewBox="0 0 620 110">
            <path d="M4 98h66V78h20V55h18v43h45V70h31v28h38V46h12l8-27 8 27h12v52h38V66h20v32h52V52h12v46h36V73h50v25h48V60h22v38h78" />
          </svg>
        </div>
        <p className="eyebrow">Songs of Singapore</p>
        <h1>Explore Singapore&rsquo;s Soundtrack</h1>
        <p className="songs-library-intro__subtitle">
          Discover songs that capture Singapore&rsquo;s memories, identity and culture.
        </p>
        {availableSongs.length > 0 || (!loading && !error) ? (
          <p className="songs-library-intro__count">
            <Music2 aria-hidden="true" size={16} />
            {availableSongs.length} {availableSongs.length === 1 ? 'song' : 'songs'} available
          </p>
        ) : null}
      </Reveal>

      {featuredSong ? <FeaturedSong onSurprise={openRandomSong} song={featuredSong} /> : null}

      {options.themeOptions.length > 0 ? (
        <Reveal as="section" aria-labelledby="songs-theme-title" className="songs-theme-browser">
          <div className="songs-theme-browser__header">
            <div>
              <p className="eyebrow">Curated themes</p>
              <h2 id="songs-theme-title">Browse by theme</h2>
            </div>
            <button
              aria-pressed={!filters.theme}
              className={!filters.theme ? 'is-active' : ''}
              onClick={() => updateFilter('theme', '')}
              type="button"
            >
              All songs <span>{catalog.length}</span>
            </button>
          </div>
          <div className="songs-theme-tiles">
            {options.themeOptions.map((theme) => {
              const count = themeCounts.get(theme) || 0
              return (
                <button
                  aria-label={`${theme}, ${count} ${count === 1 ? 'song' : 'songs'}`}
                  aria-pressed={filters.theme === theme}
                  className={filters.theme === theme ? 'is-active' : ''}
                  key={theme}
                  onClick={() => updateFilter('theme', theme)}
                  type="button"
                >
                  <ThemeIcon theme={theme} />
                  <span>{theme}</span>
                  <strong>{count}</strong>
                </button>
              )
            })}
          </div>
        </Reveal>
      ) : null}

      <div className="songs-library-catalog">
        <Reveal as="section" aria-label="Discover songs" className="songs-discovery">
          <FilterBar
            filters={{ ...filters, ...options }}
            hasActiveFilters={filtersActive}
            onChange={updateFilter}
            onClear={clearFilters}
            onSortChange={setSort}
            sort={sort}
          />

          {activeFilters.length > 0 ? (
            <div aria-label="Active filters" className="songs-active-filters">
              {activeFilters.map((filter) => (
                <button
                  aria-label={`Remove ${filter.label} filter`}
                  key={filter.key}
                  onClick={() => updateFilter(filter.key, '')}
                  type="button"
                >
                  {filter.label} <X aria-hidden="true" size={14} />
                </button>
              ))}
            </div>
          ) : null}
        </Reveal>

        {error ? <div className="state-box songs-library-error" role="alert">{error}</div> : null}

        {loading ? <SongSkeletons /> : null}

        {!loading && !error ? (
          <section aria-labelledby="songs-results-title" className="songs-results">
            <div className="songs-results__header">
              <h2 className="sr-only" id="songs-results-title">Song results</h2>
              <p>Showing <strong>{gridSongs.length}</strong> {gridSongs.length === 1 ? 'song' : 'songs'}</p>
              <p>Sorted by <strong>{sortLabels[sort]}</strong></p>
            </div>

            {gridSongs.length > 0 ? (
              <div aria-label="Song grid" className="songs-grid">
                {gridSongs.map((song, index) => (
                  <Reveal delay={index * 80} key={song.id}>
                    <SongCard song={song} variant="library" />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="songs-empty-state">
                <Music2 aria-hidden="true" size={36} />
                <h2>No songs found</h2>
                <p>No published songs match these filters. Try clearing them to discover more music.</p>
                {filtersActive ? <button onClick={clearFilters} type="button">Clear filters</button> : null}
              </div>
            )}
          </section>
        ) : null}
      </div>

      <Reveal as="aside" aria-label="Share a song memory" className="songs-library-cta">
        <div>
          <h2>Every Singapore song carries a story</h2>
          <p>Share the memories, moments and places these songs bring back.</p>
        </div>
        <Link to="/reflections">
          Share your memory <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </Reveal>
    </div>
  )
}
