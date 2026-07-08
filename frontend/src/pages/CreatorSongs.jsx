import { useState } from 'react'
import { Link } from 'react-router-dom'
import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'
import EmptyState from '../components/EmptyState'
import { creatorSongs, songFilterStatusMap, songStatusFilters } from './pageData'

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 20 20">
      <path d="m4 10.5 3.6 3.6L16 5.8" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" viewBox="0 0 20 20">
      <path d="M4 6h12" />
      <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6" />
      <path d="M5.5 6 6 16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l.5-10" />
      <path d="M8.5 9v5M11.5 9v5" />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" viewBox="0 0 20 20">
      <rect x="3.5" y="4" width="13" height="3" rx="0.8" />
      <path d="M4.5 7v7a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V7" />
      <path d="M8 10h4" />
    </svg>
  )
}

/*
TODO - Shermaine

Connect song status filters to backend data.
Wire delete/archive/select actions to the backend.
*/
export default function CreatorSongs() {
  const [songs, setSongs] = useState(creatorSongs)
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedSongId, setSelectedSongId] = useState(creatorSongs[0]?.id ?? null)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [checkedSongIds, setCheckedSongIds] = useState(new Set())

  const filteredSongs =
    activeFilter === 'All'
      ? songs.filter((song) => song.status !== 'Archived')
      : songs.filter((song) => song.status === songFilterStatusMap[activeFilter])

  const selectedSong = filteredSongs.find((song) => song.id === selectedSongId) ?? filteredSongs[0] ?? null

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

  function handleDeleteSelected() {
    if (checkedSongIds.size === 0) {
      return
    }

    setSongs((current) => current.filter((song) => !checkedSongIds.has(song.id)))
    setCheckedSongIds(new Set())
  }

  function handleArchiveSelected() {
    if (checkedSongIds.size === 0) {
      return
    }

    setSongs((current) =>
      current.map((song) =>
        checkedSongIds.has(song.id) ? { ...song, badge: 'Archived', status: 'Archived' } : song
      )
    )
    setCheckedSongIds(new Set())
  }

  return (
    <CreatorPageShell
      breadcrumbs={['My Songs']}
      className="creator-page--hero"
      description="Creator-only song management for drafts, published songs, and generation status."
      title="My Songs"
      actions={
        <>
          <Link className="studio-button studio-button--primary" to="/creator/studio">Add Song</Link>
          <button className="studio-button studio-button--secondary" onClick={toggleSelectMode} type="button">
            {isSelectMode ? 'Done' : 'Select Song'}
          </button>
          <button
            aria-label="Delete selected songs"
            className="creator-icon-button"
            disabled={!isSelectMode}
            onClick={handleDeleteSelected}
            type="button"
          >
            <TrashIcon />
          </button>
          <button
            aria-label="Archive selected songs"
            className="creator-icon-button"
            disabled={!isSelectMode}
            onClick={handleArchiveSelected}
            type="button"
          >
            <ArchiveIcon />
          </button>
        </>
      }
    >
      <section className="stats-grid stats-grid--two-col">
        <SectionCard title="Drafts"><strong>4</strong><p>Songs being prepared.</p></SectionCard>
        <SectionCard title="Published"><strong>8</strong><p>Live in the public library.</p></SectionCard>
      </section>

      <div className="dashboard-filter-bar" aria-label="Song filters">
        {songStatusFilters.map((filter) => (
          <button
            key={filter}
            className={`dashboard-filter-pill ${filter === activeFilter ? 'is-selected' : ''}`}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      {filteredSongs.length === 0 ? (
        <EmptyState description={`No ${activeFilter.toLowerCase()} songs yet.`} title="No songs found" />
      ) : (
        <div className="creator-song-browser">
          <div className="creator-song-browser__list">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                aria-pressed={song.id === selectedSong?.id}
                className={`dashboard-song-item creator-song-row ${isSelectMode ? 'is-select-mode' : ''} ${song.id === selectedSong?.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedSongId(song.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedSongId(song.id)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {isSelectMode && (
                  <button
                    aria-label={checkedSongIds.has(song.id) ? `Deselect ${song.title}` : `Select ${song.title}`}
                    className={`creator-select-circle ${checkedSongIds.has(song.id) ? 'is-checked' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleChecked(song.id)
                    }}
                    type="button"
                  >
                    {checkedSongIds.has(song.id) && <CheckIcon />}
                  </button>
                )}

                <div className="dashboard-song-art" aria-hidden="true">{song.initials}</div>

                <div className="dashboard-song-copy">
                  <h3>{song.title}</h3>
                  <p>{song.description}</p>
                  <span className={`dashboard-song-badge is-${song.status.toLowerCase()}`}>{song.badge}</span>

                  {song.progress ? (
                    <div className="dashboard-song-progress">
                      <div className="progress-track">
                        <span style={{ width: `${song.progress}%` }} />
                      </div>
                      <small>{song.progress}%</small>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {selectedSong && (
            <SectionCard className="creator-song-detail">
              <div className="creator-song-detail__header">
                <div className="dashboard-song-art" aria-hidden="true">{selectedSong.initials}</div>

                <div className="dashboard-song-copy">
                  <h3>{selectedSong.title}</h3>
                  <p>{selectedSong.description}</p>
                  <span className={`dashboard-song-badge is-${selectedSong.status.toLowerCase()}`}>
                    {selectedSong.badge}
                  </span>

                  {selectedSong.progress ? (
                    <div className="dashboard-song-progress">
                      <div className="progress-track">
                        <span style={{ width: `${selectedSong.progress}%` }} />
                      </div>
                      <small>{selectedSong.progress}%</small>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="creator-song-actions">
                <button type="button">Edit</button>
                <button type="button">Generate</button>
                <button type="button">Publish</button>
              </div>

              <div className="creator-song-detail__lyrics">
                <h4>Lyrics</h4>
                {selectedSong.lyrics ? (
                  <pre>{selectedSong.lyrics}</pre>
                ) : (
                  <p className="creator-song-detail__empty-lyrics">
                    No lyrics yet. Head to the Studio to write or extract some.
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
