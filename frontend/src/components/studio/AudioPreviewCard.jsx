import { useRef, useState } from 'react'

function getDisplayValue(value, fallback) {
  return value?.trim() || fallback
}

function formatPlaybackTime(value) {
  if (!Number.isFinite(value)) {
    return '0:00'
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getYoutubeEmbedUrl(value) {
  if (!value.trim()) {
    return ''
  }

  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^www\./, '')

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.split('/').filter(Boolean)[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
    }

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      const videoId = url.searchParams.get('v')

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }

      const pathParts = url.pathname.split('/').filter(Boolean)
      const embedIndex = pathParts.findIndex((part) => part === 'embed' || part === 'shorts')
      const pathVideoId = embedIndex >= 0 ? pathParts[embedIndex + 1] : ''
      return pathVideoId ? `https://www.youtube.com/embed/${pathVideoId}` : ''
    }
  } catch {
    return ''
  }

  return ''
}

export default function AudioPreviewCard({ title = '', artist = '', audioUrl = '', videoUrl = '', youtubeUrl = '', status = 'draft' }) {
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const displayTitle = getDisplayValue(title, 'Song Title')
  const displayArtist = getDisplayValue(artist, 'Artist Name')
  const progress = duration ? (currentTime / duration) * 100 : 0
  const youtubeEmbedUrl = getYoutubeEmbedUrl(youtubeUrl)

  async function togglePlayback() {
    if (!audioRef.current) {
      return
    }

    if (!audioRef.current.paused) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  function handleSeek(event) {
    const nextTime = Number(event.target.value)

    if (!audioRef.current || !Number.isFinite(nextTime)) {
      return
    }

    audioRef.current.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  if (videoUrl) {
    return (
      <div className="studio-audio-card studio-audio-card--video" data-status={status}>
        <video className="studio-audio-card__video" src={videoUrl} controls playsInline />
      </div>
    )
  }

  if (!audioUrl) {
    if (youtubeEmbedUrl) {
      return (
        <div className="studio-audio-card studio-audio-card--video" data-status={status}>
          <iframe
            className="studio-audio-card__video"
            src={youtubeEmbedUrl}
            title="YouTube song preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )
    }

    if (youtubeUrl.trim()) {
      return (
        <div className="studio-audio-card studio-audio-card--linked" data-status={status}>
          <div className="studio-audio-card__empty-icon" aria-hidden="true">
            {'\u266a'}
          </div>
          <div className="studio-audio-card__linked-copy">
            <strong>YouTube link added</strong>
            <p>Lyrics can be extracted from this link. Upload an MP3 for in-browser playback preview.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="studio-audio-card studio-audio-card--empty" data-status={status}>
        <div className="studio-audio-card__empty-icon" aria-hidden="true">
          {'\u266a'}
        </div>
        <p>Upload an MP3 or YouTube link to preview your song.</p>
      </div>
    )
  }

  return (
    <div className="studio-audio-card" data-status={status}>
      <div className={`studio-vinyl ${isPlaying ? 'is-playing' : ''}`} aria-label={`${displayTitle} by ${displayArtist}`}>
        <div className="studio-vinyl__disc">
          <span className="studio-vinyl__highlight studio-vinyl__highlight--top" />
          <span className="studio-vinyl__highlight studio-vinyl__highlight--side" />
          <div className="studio-vinyl__label">
            <span className="studio-vinyl__bars" aria-hidden="true" />
            <strong>{displayTitle}</strong>
            <small>{displayArtist}</small>
            <span className="studio-vinyl__spindle" aria-hidden="true" />
          </div>
        </div>

        <button
          className={`studio-audio-card__play ${isPlaying ? 'is-playing' : ''}`}
          onClick={togglePlayback}
          type="button"
          aria-label={isPlaying ? 'Pause audio preview' : 'Play audio preview'}
        >
          <span />
        </button>
      </div>

      <div className="studio-audio-card__controls">
        <div className="studio-audio-card__time">
          <strong>{formatPlaybackTime(currentTime)}</strong>
          <span>{formatPlaybackTime(duration)}</span>
        </div>
        <input
          aria-label="Audio preview progress"
          max={duration || 0}
          min="0"
          onChange={handleSeek}
          step="0.1"
          style={{ '--audio-progress': `${progress}%` }}
          type="range"
          value={currentTime}
        />
      </div>

      <audio
        key={audioUrl}
        ref={audioRef}
        src={audioUrl}
        onEmptied={() => {
          setCurrentTime(0)
          setDuration(0)
          setIsPlaying(false)
        }}
        onEnded={() => {
          setCurrentTime(0)
          setIsPlaying(false)
        }}
        onLoadedMetadata={(event) => {
          setCurrentTime(0)
          setDuration(event.currentTarget.duration)
          setIsPlaying(false)
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      />
    </div>
  )
}
