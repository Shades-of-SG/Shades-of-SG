import { useState } from 'react'
import { ArrowRight, Gamepad2, Music2, RefreshCw, X } from 'lucide-react'
import { Link } from 'react-router-dom'

function PreviewArtwork({ song }) {
  return song?.coverImageUrl ? (
    <img alt={`${song.title} cover artwork`} src={song.coverImageUrl} />
  ) : (
    <span aria-label="Music preview placeholder" className="song-preview-art__fallback" role="img"><Music2 aria-hidden="true" size={40} /></span>
  )
}

function PreviewSkeleton() {
  return (
    <div aria-label="Loading song preview" className="song-preview-skeleton" role="status">
      <span className="song-preview-skeleton__media" />
      <span className="song-preview-skeleton__line song-preview-skeleton__line--title" />
      <span className="song-preview-skeleton__line" />
      <span className="sr-only">Loading song preview</span>
    </div>
  )
}

export default function SongPreviewPanel({ loading, mobileOpen, onClose, onPause, onPlay, rhythmDifficulties = [], song, sticky = false }) {
  const [videoError, setVideoError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  if (loading) return <aside className="song-preview-shell"><PreviewSkeleton /></aside>

  if (!song) {
    return (
      <aside className="song-preview-shell">
        <div className="song-preview-empty"><Music2 aria-hidden="true" size={32} /><h3>Select a song</h3><p>Choose a song from the catalogue to see its music video preview.</p></div>
      </aside>
    )
  }

  const tags = [song.theme, ...(song.moodTags || [])].filter(Boolean).slice(0, 4)
  const hasVideo = Boolean(song.videoUrl?.trim())
  const difficulty = rhythmDifficulties[0]

  return (
    <aside aria-label={`Preview for ${song.title}`} className={`song-preview-shell${mobileOpen ? ' is-mobile-open' : ''}${sticky ? ' is-sticky' : ''}`}>
      <div className="song-preview-panel">
        <div className="song-preview-panel__topline">
          <span>AI-generated music video preview</span>
          <button aria-label="Close song preview" className="song-preview-panel__close" onClick={onClose} type="button"><X aria-hidden="true" size={20} /></button>
        </div>

        <div className="song-preview-media">
          {hasVideo && !videoError ? (
            <video
              aria-label={`${song.title} video preview`}
              controls
              key={`${song.id}-${retryKey}`}
              onError={() => setVideoError(true)}
              onPause={onPause}
              onPlay={onPlay}
              playsInline
              poster={song.coverImageUrl || undefined}
              preload="metadata"
              src={song.videoUrl}
            />
          ) : (
            <div className="song-preview-media__fallback">
              <PreviewArtwork song={song} />
              <div>
                <strong>{videoError ? 'Preview couldn’t be loaded' : 'Video preview unavailable'}</strong>
                <p>{videoError ? 'The video could not be loaded right now.' : 'This song does not currently have an AI-generated music video.'}</p>
                {videoError ? <button onClick={() => { setVideoError(false); setRetryKey((current) => current + 1) }} type="button"><RefreshCw aria-hidden="true" size={15} /> Retry</button> : null}
              </div>
            </div>
          )}
        </div>

        <div aria-live="polite" className="song-preview-panel__content">
          <h3>{song.title}</h3>
          <p className="song-preview-panel__artist">{song.artist || 'Artist unavailable'}</p>
          {tags.length > 0 ? <div aria-label="Song details" className="song-preview-panel__tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
          {song.description ? <p className="song-preview-panel__description">{song.description}</p> : null}
          <div className="song-preview-panel__actions">
            <Link className="songs-primary-action" to={`/songs/${song.id}`}>Explore Song <ArrowRight aria-hidden="true" size={16} /></Link>
            {difficulty ? <Link className="song-preview-panel__rhythm" to={`/game/${song.id}?difficulty=${difficulty}`}><Gamepad2 aria-hidden="true" size={17} /> Play Rhythm Game</Link> : null}
          </div>
        </div>
      </div>
    </aside>
  )
}
