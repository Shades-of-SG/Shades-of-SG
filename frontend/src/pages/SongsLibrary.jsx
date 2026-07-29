import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Music2, Play, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import FilterBar from '../components/FilterBar'
import Reveal from '../components/Reveal'
import SongCatalogue from '../components/songs/SongCatalogue'
import SongPreviewPanel from '../components/songs/SongPreviewPanel'
import { getBeatmapSummary } from '../services/beatmapService'
import { getPublishedSongs } from '../services/publicSongService'

const PAGE_SIZE = 9
const emptyFilters = { search: '', theme: '', language: '', mood: '' }

function hasFilters(filters) {
  return Object.values(filters).some((value) => value.trim())
}

function byNewest(first, second) {
  const firstDate = Date.parse(first.publishedDate || first.createdAt || 0) || 0
  const secondDate = Date.parse(second.publishedDate || second.createdAt || 0) || 0
  return secondDate - firstDate
}

function SongArtwork({ song }) {
  return song.coverImageUrl ? (
    <img alt={`${song.title} cover artwork`} src={song.coverImageUrl} />
  ) : (
    <span aria-label={`No cover artwork available for ${song.title}`} className="songs-artwork-fallback" role="img">
      <Music2 aria-hidden="true" size={42} />
    </span>
  )
}

function FeaturedSongsSection({ songs }) {
  if (songs.length === 0) return null
  const [featured, ...recommendations] = songs.slice(0, 3)

  return (
    <Reveal as="section" aria-labelledby="featured-recommended-title" className="songs-featured-zone">
      <div className="songs-section-heading">
        <div>
          <p className="eyebrow">Handpicked for you</p>
          <h2 id="featured-recommended-title">Featured &amp; recommended</h2>
          <p>Stories, sounds and perspectives worth discovering.</p>
        </div>
      </div>

      <div className="songs-featured-layout">
        <article className="songs-featured-primary">
          <div className="songs-featured-primary__art"><SongArtwork song={featured} /></div>
          <div className="songs-featured-primary__content">
            <span className="songs-featured-primary__label"><Sparkles aria-hidden="true" size={14} /> Featured song</span>
            <h3>{featured.title}</h3>
            <p className="songs-featured-primary__artist">{featured.artist || 'Artist unavailable'}</p>
            {featured.description ? <p className="songs-featured-primary__description">{featured.description}</p> : null}
            <div className="songs-featured-primary__tags">
              {[featured.theme, ...(featured.moodTags || [])].filter(Boolean).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <Link to={`/songs/${featured.id}`}>Explore song <ArrowRight aria-hidden="true" size={16} /></Link>
          </div>
        </article>

        {recommendations.length > 0 ? (
          <div className="songs-recommendations">
            {recommendations.map((song) => (
              <Link aria-label={`Explore recommended song: ${song.title}`} className="songs-recommendation-card" key={song.id} to={`/songs/${song.id}`}>
                <span className="songs-recommendation-card__art"><SongArtwork song={song} /></span>
                <span className="songs-recommendation-card__copy">
                  <span className="eyebrow">Recommended</span>
                  <strong>{song.title}</strong>
                  <span>{song.artist || 'Artist unavailable'}</span>
                  {song.description ? <small>{song.description}</small> : null}
                </span>
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </Reveal>
  )
}

function CatalogueSkeleton() {
  return (
    <div aria-label="Loading published songs" className="song-catalogue-skeleton" role="status">
      {[0, 1, 2, 3, 4].map((item) => <span aria-hidden="true" key={item} />)}
      <span className="sr-only">Loading published songs</span>
    </div>
  )
}

function Pagination({ currentPage, onPageChange, totalPages }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Song catalogue pages" className="songs-pagination">
      <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} type="button">
        <ArrowLeft aria-hidden="true" size={16} /> <span>Previous</span>
      </button>
      <div>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button aria-current={page === currentPage ? 'page' : undefined} key={page} onClick={() => onPageChange(page)} type="button">{page}</button>
        ))}
      </div>
      <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} type="button">
        <span>Next</span> <ArrowRight aria-hidden="true" size={16} />
      </button>
    </nav>
  )
}

export default function SongsLibrary() {
  const catalogueRef = useRef(null)
  const [songs, setSongs] = useState([])
  const [availableSongs, setAvailableSongs] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [sort, setSort] = useState('featured')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const [rhythmBySong, setRhythmBySong] = useState({})
  const [selectedSongId, setSelectedSongId] = useState('')
  const [playingSongId, setPlayingSongId] = useState('')
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
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
        .catch((nextError) => {
          if (!active) return
          setError(nextError.message)
          setSongs([])
        })
        .finally(() => active && setLoading(false))
    }, filters.search ? 250 : 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [filters, requestVersion])

  useEffect(() => {
    if (availableSongs.length === 0) return undefined
    let active = true
    Promise.all(availableSongs.map(async (song) => {
      const beatmaps = await getBeatmapSummary(song.id).catch(() => [])
      return [song.id, beatmaps.filter((beatmap) => beatmap.status === 'PUBLISHED').map((beatmap) => beatmap.difficulty)]
    })).then((entries) => {
      if (active) setRhythmBySong(Object.fromEntries(entries))
    })
    return () => { active = false }
  }, [availableSongs])

  const catalog = availableSongs.length > 0 ? availableSongs : songs
  const options = useMemo(() => ({
    languageOptions: [...new Set(catalog.flatMap((song) => song.languages || []))].sort(),
    moodOptions: [...new Set(catalog.flatMap((song) => song.moodTags || []))].sort(),
    themeOptions: [...new Set(catalog.map((song) => song.theme).filter(Boolean))].sort(),
  }), [catalog])

  const featuredSong = availableSongs[0] || (!filtersActive ? songs[0] : null)
  const sortedSongs = useMemo(() => {
    const nextSongs = [...songs]
    if (sort === 'newest') return nextSongs.sort(byNewest)
    if (sort === 'title') return nextSongs.sort((first, second) => first.title.localeCompare(second.title))
    return nextSongs
  }, [songs, sort])
  const totalPages = Math.max(1, Math.ceil(sortedSongs.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const pageSongs = sortedSongs.slice(startIndex, startIndex + PAGE_SIZE)
  const selectedSong = pageSongs.find((song) => song.id === selectedSongId) || pageSongs[0] || featuredSong
  const activeSelectedId = selectedSong?.id || ''

  const activeFilters = [
    filters.search && { key: 'search', label: `Search: ${filters.search}` },
    filters.theme && { key: 'theme', label: filters.theme },
    filters.language && { key: 'language', label: filters.language },
    filters.mood && { key: 'mood', label: filters.mood },
  ].filter(Boolean)

  function resetCatalogueContext() {
    setCurrentPage(1)
    setSelectedSongId('')
    setPlayingSongId('')
    setMobilePreviewOpen(false)
  }

  function updateFilter(key, value) {
    resetCatalogueContext()
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function clearFilters() {
    resetCatalogueContext()
    setFilters(emptyFilters)
  }

  function changeSort(value) {
    resetCatalogueContext()
    setSort(value)
  }

  function scrollToCatalogue() {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    catalogueRef.current?.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  function changePage(page) {
    setCurrentPage(page)
    setSelectedSongId('')
    setPlayingSongId('')
    setMobilePreviewOpen(false)
    window.requestAnimationFrame(() => scrollToCatalogue())
  }

  function selectSong(songId, options = {}) {
    setSelectedSongId(songId)
    if (!options.fromFocus) setMobilePreviewOpen(true)
  }

  return (
    <div className="page-stack songs-library-page">
      <Reveal as="header" className="songs-library-intro">
        <div aria-hidden="true" className="songs-header-art">
          <div className="songs-header-art__notes"><Music2 size={26} /><Music2 size={18} /><Music2 size={22} /></div>
          <svg className="songs-header-art__skyline" viewBox="0 0 620 110">
            <path d="M4 98h66V78h20V55h18v43h45V70h31v28h38V46h12l8-27 8 27h12v52h38V66h20v32h52V52h12v46h36V73h50v25h48V60h22v38h78" />
          </svg>
        </div>
        <div className="songs-library-intro__content">
          <p className="eyebrow">Explore Singapore&rsquo;s soundtrack</p>
          <h1>Every song tells<br />a story of <span>Singapore</span></h1>
          <p className="songs-library-intro__subtitle">Discover original songs inspired by our people, culture and everyday moments.</p>
          <div className="songs-library-intro__utility">
            {availableSongs.length > 0 || (!loading && !error) ? (
              <p className="songs-library-intro__count"><Music2 aria-hidden="true" size={16} />{availableSongs.length} {availableSongs.length === 1 ? 'song' : 'songs'} available</p>
            ) : null}
            <div className="songs-library-intro__actions">
              {featuredSong ? <Link to={`/songs/${featuredSong.id}`}><Play aria-hidden="true" size={17} /> Play featured song</Link> : null}
              <button onClick={scrollToCatalogue} type="button">Jump to catalogue <ArrowRight aria-hidden="true" size={16} /></button>
            </div>
          </div>
        </div>
      </Reveal>

      <FeaturedSongsSection songs={availableSongs.length > 0 ? availableSongs : songs} />

      <section aria-labelledby="browse-songs-title" className="songs-library-catalog" ref={catalogueRef}>
        <div className="songs-section-heading songs-section-heading--catalogue">
          <div>
            <p className="eyebrow">The complete collection</p>
            <h2 id="browse-songs-title">Browse all songs</h2>
            <p>Explore stories, moods and moments from Singapore through music.</p>
          </div>
        </div>

        <FilterBar filters={{ ...filters, ...options }} hasActiveFilters={filtersActive} onChange={updateFilter} onClear={clearFilters} onSortChange={changeSort} sort={sort} />

        <div className="songs-catalogue-summary">
          <p aria-live="polite">{sortedSongs.length > 0 ? `Showing ${startIndex + 1}–${Math.min(startIndex + PAGE_SIZE, sortedSongs.length)} of ${sortedSongs.length} songs` : 'Showing 0 songs'}</p>
          {activeFilters.length > 0 ? (
            <div aria-label="Active filters" className="songs-active-filters">
              {activeFilters.map((filter) => (
                <button aria-label={`Remove ${filter.label} filter`} key={filter.key} onClick={() => updateFilter(filter.key, '')} type="button">{filter.label} <X aria-hidden="true" size={14} /></button>
              ))}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="state-box songs-library-error" role="alert">
            <strong>We couldn’t load the song catalogue.</strong><span>{error}</span>
            <button onClick={() => setRequestVersion((current) => current + 1)} type="button">Try again</button>
          </div>
        ) : null}

        {loading ? <div className="songs-catalogue-layout"><CatalogueSkeleton /><SongPreviewPanel loading /></div> : null}

        {!loading && !error && pageSongs.length > 0 ? (
          <div className="songs-catalogue-layout">
            <div className="songs-catalogue-main">
              <SongCatalogue onSelect={selectSong} playingSongId={playingSongId} rhythmBySong={rhythmBySong} selectedSongId={activeSelectedId} songs={pageSongs} startIndex={startIndex} />
              <Pagination currentPage={safePage} onPageChange={changePage} totalPages={totalPages} />
            </div>
            <SongPreviewPanel
              key={activeSelectedId}
              mobileOpen={mobilePreviewOpen}
              onClose={() => setMobilePreviewOpen(false)}
              onPause={() => setPlayingSongId('')}
              onPlay={() => setPlayingSongId(activeSelectedId)}
              rhythmDifficulties={rhythmBySong[activeSelectedId] || []}
              song={selectedSong}
              sticky={pageSongs.length >= 5}
            />
          </div>
        ) : null}

        {!loading && !error && pageSongs.length === 0 ? (
          <div className="songs-empty-state"><Music2 aria-hidden="true" size={36} /><h2>No songs found</h2><p>Try changing or clearing your filters.</p>{filtersActive ? <button onClick={clearFilters} type="button">Clear filters</button> : null}</div>
        ) : null}
      </section>
    </div>
  )
}
