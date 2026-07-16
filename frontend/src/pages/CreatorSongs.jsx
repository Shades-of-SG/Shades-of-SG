import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CreatorPageShell from '../components/CreatorPageShell'
import EmptyState from '../components/EmptyState'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import {
  archiveSong,
  deleteSong,
  getCreatorSongs,
  publishSong,
  startGeneration,
  unpublishSong,
} from '../services/songService'

const filters = [
  ['All', 'ALL'],
  ['Drafts', 'DRAFT'],
  ['Generating', 'GENERATING'],
  ['Ready', 'READY'],
  ['Published', 'PUBLISHED'],
  ['Archived', 'ARCHIVED'],
]

const statuses = [
  'DRAFT',
  'GENERATING',
  'READY',
  'PUBLISHED',
  'ARCHIVED',
]

const activeJobStatuses = new Set([
  'QUEUED',
  'PROCESSING',
  'IN_PROGRESS',
])

const emptyStates = {
  ALL: {
    title: 'Your song library is ready',
    description:
      'Create your first song in Studio to start building a music video.',
  },
  DRAFT: {
    title: 'No drafts yet',
    description:
      'Drafts are songs you have saved but have not started generating yet.',
  },
  GENERATING: {
    title: 'No videos are generating',
    description:
      'Songs appear here while their AI music videos are being created.',
  },
  READY: {
    title: 'Nothing is ready to publish yet',
    description:
      'Completed videos awaiting final review will appear here.',
  },
  PUBLISHED: {
    title: 'No published songs yet',
    description:
      'Songs you publish will appear here for you to manage and share.',
  },
  ARCHIVED: {
    title: 'No archived songs',
    description:
      'Archived songs are hidden from your active library without being deleted.',
  },
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.4"
      viewBox="0 0 20 20"
    >
      <path d="m4 10.5 3.6 3.6L16 5.8" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.4"
      viewBox="0 0 20 20"
    >
      <path d="M4 6h12" />
      <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6" />
      <path d="M5.5 6 6 16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l.5-10" />
      <path d="M8.5 9v5M11.5 9v5" />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.4"
      viewBox="0 0 20 20"
    >
      <rect x="3.5" y="4" width="13" height="3" rx="0.8" />
      <path d="M4.5 7v7a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V7" />
      <path d="M8 10h4" />
    </svg>
  )
}

function SongArtwork({ song }) {
  if (song.coverImageUrl) {
    return (
      <img
        alt={`${song.title} cover`}
        className="creator-song-cover"
        src={song.coverImageUrl}
      />
    )
  }

  const initials = song.title
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <div
      aria-label="No cover image"
      className="creator-song-cover creator-song-cover--fallback"
    >
      {initials || '♫'}
    </div>
  )
}

export default function CreatorSongs() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [songs, setSongs] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [isSelectMode, setIsSelectMode] = useState(false)
  const [checkedSongIds, setCheckedSongIds] = useState(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) {
        setLoading(true)
      }

      try {
        const nextSongs = await getCreatorSongs(token)

        setSongs(nextSongs)

        setSelectedId((currentId) =>
          nextSongs.some((song) => song.id === currentId)
            ? currentId
            : nextSongs[0]?.id || ''
        )

        setError('')
      } catch (nextError) {
        setError(nextError.message)
      } finally {
        if (!quiet) {
          setLoading(false)
        }
      }
    },
    [token]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    const hasActiveGeneration = songs.some(
      (song) =>
        song.status === 'GENERATING' ||
        activeJobStatuses.has(song.latestGenerationJob?.status)
    )

    if (!hasActiveGeneration) {
      return undefined
    }

    const timer = window.setInterval(() => {
      load({ quiet: true })
    }, 3000)

    return () => window.clearInterval(timer)
  }, [load, songs])

  useEffect(() => {
    if (!error && !success) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setError('')
      setSuccess('')
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [error, success])

  const counts = useMemo(
    () =>
      Object.fromEntries(
        statuses.map((status) => [
          status,
          songs.filter((song) => song.status === status).length,
        ])
      ),
    [songs]
  )

  const visibleSongs =
    filter === 'ALL'
      ? songs.filter((song) => song.status !== 'ARCHIVED')
      : songs.filter((song) => song.status === filter)

  const selected =
    visibleSongs.find((song) => song.id === selectedId) ||
    visibleSongs[0] ||
    null

  const selectedSongs = songs.filter((song) =>
    checkedSongIds.has(song.id)
  )

  const archiveableSelectedSongs = selectedSongs.filter(
    (song) => !['GENERATING', 'ARCHIVED'].includes(song.status)
  )

  const latestStatus = selected?.latestGenerationJob?.status

  const canGenerate =
    selected &&
    ['DRAFT', 'READY'].includes(selected.status) &&
    Boolean(selected.audioUrl) &&
    Boolean(selected.rawLyrics?.trim()) &&
    !activeJobStatuses.has(latestStatus)

  function toggleSelectMode() {
    setIsSelectMode((current) => !current)
    setCheckedSongIds(new Set())
  }

  function toggleChecked(songId) {
    setCheckedSongIds((current) => {
      const next = new Set(current)

      if (next.has(songId)) {
        next.delete(songId)
      } else {
        next.add(songId)
      }

      return next
    })
  }

  async function mutate(song, operation, successText) {
    setBusyId(song.id)
    setError('')
    setSuccess('')

    try {
      await operation()
      setSuccess(successText)
      await load({ quiet: true })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusyId('')
    }
  }

  async function handleDeleteSelected() {
    if (checkedSongIds.size === 0 || bulkBusy) {
      return
    }

    const confirmed = window.confirm(
      `Permanently delete ${checkedSongIds.size} selected song${
        checkedSongIds.size === 1 ? '' : 's'
      }? This cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setBulkBusy(true)
    setError('')
    setSuccess('')

    try {
      await Promise.all(
        selectedSongs.map((song) => deleteSong(song.id, token))
      )

      setCheckedSongIds(new Set())
      setSuccess(
        `${selectedSongs.length} song${
          selectedSongs.length === 1 ? '' : 's'
        } deleted.`
      )

      await load({ quiet: true })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBulkBusy(false)
    }
  }

  async function handleArchiveSelected() {
    if (archiveableSelectedSongs.length === 0 || bulkBusy) {
      return
    }

    setBulkBusy(true)
    setError('')
    setSuccess('')

    try {
      await Promise.all(
        archiveableSelectedSongs.map((song) =>
          archiveSong(song.id, token)
        )
      )

      setCheckedSongIds(new Set())
      setSuccess(
        `${archiveableSelectedSongs.length} song${
          archiveableSelectedSongs.length === 1 ? '' : 's'
        } archived.`
      )

      await load({ quiet: true })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBulkBusy(false)
    }
  }

  function confirmDelete(song) {
    const confirmed = window.confirm(
      `Permanently delete “${song.title}”? This cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    mutate(
      song,
      () => deleteSong(song.id, token),
      'Song deleted.'
    )
  }

  function handleSongRowClick(songId) {
    if (isSelectMode) {
      toggleChecked(songId)
      return
    }

    setSelectedId(songId)
  }

  return (
    <CreatorPageShell
      breadcrumbs={['My Songs']}
      className="creator-page--hero"
      description="Manage your saved drafts, generation progress, ready songs, and public releases."
      title="My Songs"
      actions={
        <>
          <Link
            className="studio-button studio-button--primary"
            to="/creator/studio/new"
          >
            Add Song
          </Link>

          <button
            className="studio-button studio-button--secondary"
            onClick={toggleSelectMode}
            type="button"
          >
            {isSelectMode ? 'Done' : 'Select Song'}
          </button>

          <button
            aria-label="Delete selected songs"
            className="creator-icon-button"
            disabled={
              !isSelectMode ||
              checkedSongIds.size === 0 ||
              bulkBusy
            }
            onClick={handleDeleteSelected}
            title="Delete selected songs"
            type="button"
          >
            <TrashIcon />
          </button>

          <button
            aria-label="Archive selected songs"
            className="creator-icon-button"
            disabled={
              !isSelectMode ||
              archiveableSelectedSongs.length === 0 ||
              bulkBusy
            }
            onClick={handleArchiveSelected}
            title="Archive selected songs"
            type="button"
          >
            <ArchiveIcon />
          </button>
        </>
      }
    >
      <section className="stats-grid stats-grid--two-col">
        <SectionCard title="Drafts">
          <strong>{loading ? '-' : counts.DRAFT}</strong>
          <p>Songs being prepared.</p>
        </SectionCard>

        <SectionCard title="Published">
          <strong>{loading ? '-' : counts.PUBLISHED}</strong>
          <p>Live in the public library.</p>
        </SectionCard>
      </section>

      {error && (
        <div
          className="studio-workflow-message is-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="studio-workflow-message is-success"
          role="status"
        >
          {success}
        </div>
      )}

      <div
        aria-label="Song filters"
        className="dashboard-filter-bar"
      >
        {filters.map(([label, value]) => (
          <button
            className={`dashboard-filter-pill ${
              filter === value ? 'is-selected' : ''
            }`}
            key={value}
            onClick={() => {
              setFilter(value)
              setCheckedSongIds(new Set())
            }}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p role="status">Loading your songs…</p>}

      {!loading && visibleSongs.length === 0 && (
        <EmptyState {...emptyStates[filter]} />
      )}

      {!loading && visibleSongs.length > 0 && (
        <div className="creator-song-browser">
          <div className="creator-song-browser__list">
            {visibleSongs.map((song) => {
              const isSelected = song.id === selected?.id
              const isChecked = checkedSongIds.has(song.id)

              return (
                <div
                  aria-pressed={
                    isSelectMode ? isChecked : isSelected
                  }
                  className={[
                    'dashboard-song-item',
                    'creator-song-row',
                    isSelectMode ? 'is-select-mode' : '',
                    isSelected && !isSelectMode ? 'is-selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={song.id}
                  onClick={() => handleSongRowClick(song.id)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      event.preventDefault()
                      handleSongRowClick(song.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {isSelectMode && (
                    <button
                      aria-label={
                        isChecked
                          ? `Deselect ${song.title}`
                          : `Select ${song.title}`
                      }
                      className={`creator-select-circle ${
                        isChecked ? 'is-checked' : ''
                      }`}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleChecked(song.id)
                      }}
                      type="button"
                    >
                      {isChecked && <CheckIcon />}
                    </button>
                  )}

                  <SongArtwork song={song} />

                  <div className="dashboard-song-copy">
                    <h3>{song.title}</h3>
                    <p>{song.artist || 'Artist not set'}</p>

                    <span
                      className={`dashboard-song-badge is-${song.status.toLowerCase()}`}
                    >
                      {song.status}
                    </span>

                    {song.latestGenerationJob && (
                      <small>
                        Generation: {song.latestGenerationJob.status}
                      </small>
                    )}

                    {song.updatedAt && (
                      <small>
                        Edited{' '}
                        {new Date(
                          song.updatedAt
                        ).toLocaleString()}
                      </small>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {selected && (
            <SectionCard className="creator-song-detail">
              <div className="creator-song-detail__header">
                <SongArtwork song={selected} />

                <div className="dashboard-song-copy">
                  <h3>{selected.title}</h3>
                  <p>{selected.artist || 'Artist not set'}</p>

                  <span
                    className={`dashboard-song-badge is-${selected.status.toLowerCase()}`}
                  >
                    {selected.status}
                  </span>

                  {selected.latestGenerationJob && (
                    <small>
                      Generation:{' '}
                      {selected.latestGenerationJob.status}
                    </small>
                  )}
                </div>
              </div>

              <div className="creator-song-actions">
                {selected.status === 'PUBLISHED' && (
                  <button
                    onClick={() =>
                      navigate(`/songs/${selected.id}`)
                    }
                    type="button"
                  >
                    View
                  </button>
                )}

                <button
                  disabled={busyId === selected.id}
                  onClick={() =>
                    navigate(`/creator/studio/${selected.id}`)
                  }
                  type="button"
                >
                  Edit
                </button>

                {canGenerate && (
                  <button
                    disabled={busyId === selected.id}
                    onClick={() =>
                      mutate(
                        selected,
                        () =>
                          startGeneration(selected.id, token),
                        latestStatus === 'FAILED'
                          ? 'Generation retry queued.'
                          : 'Generation queued.'
                      )
                    }
                    type="button"
                  >
                    {latestStatus === 'FAILED'
                      ? 'Retry'
                      : 'Generate'}
                  </button>
                )}

                {selected.latestGenerationJob && (
                  <button
                    onClick={() =>
                      navigate(
                        `/creator/generation/${selected.latestGenerationJob.id}`
                      )
                    }
                    type="button"
                  >
                    View Generation
                  </button>
                )}

                {selected.status === 'READY' && (
                  <button
                    disabled={
                      !selected.publishReady ||
                      busyId === selected.id
                    }
                    onClick={() =>
                      mutate(
                        selected,
                        () => publishSong(selected.id, token),
                        'Song published.'
                      )
                    }
                    title={
                      selected.publishReady
                        ? ''
                        : `Missing: ${
                            selected.publishMissing?.join(', ') ||
                            'publishing requirements'
                          }`
                    }
                    type="button"
                  >
                    Publish
                  </button>
                )}

                {selected.status === 'PUBLISHED' && (
                  <button
                    disabled={busyId === selected.id}
                    onClick={() =>
                      mutate(
                        selected,
                        () => unpublishSong(selected.id, token),
                        'Song unpublished and returned to Ready.'
                      )
                    }
                    type="button"
                  >
                    Unpublish
                  </button>
                )}

                {!['GENERATING', 'ARCHIVED'].includes(
                  selected.status
                ) && (
                  <button
                    disabled={busyId === selected.id}
                    onClick={() =>
                      mutate(
                        selected,
                        () => archiveSong(selected.id, token),
                        'Song archived.'
                      )
                    }
                    type="button"
                  >
                    Archive
                  </button>
                )}

                {selected.status !== 'GENERATING' && (
                  <button
                    disabled={busyId === selected.id}
                    onClick={() => confirmDelete(selected)}
                    type="button"
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className="creator-song-detail__lyrics">
                <h4>Lyrics</h4>

                {selected.rawLyrics ? (
                  <pre>{selected.rawLyrics}</pre>
                ) : (
                  <p className="creator-song-detail__empty-lyrics">
                    No lyrics yet. Head to Studio to write or
                    extract some.
                  </p>
                )}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </CreatorPageShell>
  )
}
