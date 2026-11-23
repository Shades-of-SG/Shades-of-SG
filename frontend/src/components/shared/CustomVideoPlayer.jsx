import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Subtitles } from 'lucide-react'
import './CustomVideoPlayer.css'

/**
 * A reusable video player with custom controls, time-synced captions,
 * and fullscreen support. UI inspired by the VideoEditor's control bar.
 *
 * @param {Object} props
 * @param {string} props.src - Video source URL
 * @param {Array<{start:number, end:number, text:string}>|null} props.transcriptionSegments - Timed captions
 * @param {string} [props.poster] - Poster image URL
 * @param {() => void} [props.onPlay] - Called when video starts playing
 * @param {() => void} [props.onPause] - Called when video pauses
 */

function formatTime(secs) {
  if (!Number.isFinite(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function CustomVideoPlayer({ src, transcriptionSegments = null, poster, onPlay, onPause }) {
  const videoRef = useRef(null)
  const wrapperRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showCaptions, setShowCaptions] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Auto-hide controls in fullscreen
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef(null)

  const hasCaptions = Array.isArray(transcriptionSegments) && transcriptionSegments.length > 0

  // Find the active caption for the current playback time
  const activeCaption = useMemo(() => {
    if (!hasCaptions) return null
    return transcriptionSegments.find(s => currentTime >= s.start && currentTime <= s.end) || null
  }, [transcriptionSegments, currentTime, hasCaptions])

  // ── Fullscreen handling ──
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(err => {
        console.warn('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  // ── Auto-hide controls in fullscreen ──
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false)
      }
    }, 2500)
  }, [])

  useEffect(() => {
    if (!isPlaying) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      const timer = setTimeout(() => setShowControls(true), 0)
      return () => clearTimeout(timer)
    } else if (isFullscreen) {
      const timer = setTimeout(() => handleMouseMove(), 0)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, isFullscreen, handleMouseMove])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [])

  // ── Playback controls ──
  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return
    if (!videoRef.current.paused) {
      videoRef.current.pause()
    } else {
      try {
        await videoRef.current.play()
      } catch {
        // play() rejected (e.g. user hasn't interacted with the page yet)
      }
    }
  }, [])

  const handleSkipBack = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
  }, [])

  const handleSkipForward = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.min(
      videoRef.current.duration || 0,
      videoRef.current.currentTime + 5
    )
  }, [])

  const handleSeek = useCallback((e) => {
    const t = Number(e.target.value)
    if (!videoRef.current || !Number.isFinite(t)) return
    videoRef.current.currentTime = t
    setCurrentTime(t)
  }, [])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.isContentEditable ||
        e.target?.tagName === 'INPUT' ||
        e.target?.tagName === 'TEXTAREA' ||
        e.target?.isContentEditable

      if (isInput) return

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        handleSkipBack()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        handleSkipForward()
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        setShowCaptions((prev) => !prev)
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, handleSkipBack, handleSkipForward, toggleFullscreen])

  // Determine whether controls overlay should be visible
  const controlsVisible = !isFullscreen || showControls
  const cursorStyle = (isFullscreen && !showControls) ? 'none' : 'default'

  return (
    <div
      className="custom-video-player"
      onMouseMove={isFullscreen ? handleMouseMove : undefined}
      onPointerDown={isFullscreen ? handleMouseMove : undefined}
      ref={wrapperRef}
      style={{ cursor: cursorStyle }}
    >
      {/* ── Video Element ── */}
      <div className="custom-video-player__stage">
        <video
          className={`custom-video-player__video${isFullscreen ? ' is-fullscreen' : ''}`}
          onClick={togglePlay}
          onEnded={() => { setIsPlaying(false); setCurrentTime(0) }}
          onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); setCurrentTime(0) }}
          onPause={() => { setIsPlaying(false); onPause?.() }}
          onPlay={() => { setIsPlaying(true); onPlay?.() }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          playsInline
          poster={poster}
          ref={videoRef}
          src={src}
        />

        {/* ── Caption Overlay ── */}
        {showCaptions && activeCaption && (
          <div
            className={`custom-video-player__captions${isFullscreen && controlsVisible ? ' is-fullscreen-controls' : ''}`}
            style={{ opacity: controlsVisible || !isFullscreen ? 1 : 0.9 }}
          >
            <p className="custom-video-player__caption-text">
              {activeCaption.text}
            </p>
          </div>
        )}

        {/* ── Fullscreen Toggle (top-right) ── */}
        <button
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          className="custom-video-player__fs-toggle"
          onClick={toggleFullscreen}
          style={{
            opacity: controlsVisible ? 1 : 0,
            pointerEvents: controlsVisible ? 'auto' : 'none',
          }}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          type="button"
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* ── Controls Bar ── */}
      <div
        className={`custom-video-player__controls${isFullscreen ? ' is-fullscreen' : ''}`}
        style={isFullscreen ? {
          opacity: controlsVisible ? 1 : 0,
          transform: controlsVisible ? 'translateY(0)' : 'translateY(100%)',
          pointerEvents: controlsVisible ? 'auto' : 'none',
        } : undefined}
      >
        {/* Skip Back */}
        <button
          aria-label="Back 5s"
          className="custom-video-player__btn"
          onClick={handleSkipBack}
          title="Back 5s"
          type="button"
        >
          <SkipBack size={18} />
        </button>

        {/* Play / Pause */}
        <button
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="custom-video-player__play"
          onClick={togglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
          type="button"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
        </button>

        {/* Skip Forward */}
        <button
          aria-label="Forward 5s"
          className="custom-video-player__btn"
          onClick={handleSkipForward}
          title="Forward 5s"
          type="button"
        >
          <SkipForward size={18} />
        </button>

        {/* CC Toggle (only if we have caption data) */}
        {hasCaptions && (
          <button
            aria-label={showCaptions ? 'Hide Captions' : 'Show Captions'}
            aria-pressed={showCaptions}
            className={`custom-video-player__btn${showCaptions ? '' : ' is-captions-off'}`}
            onClick={() => setShowCaptions(prev => !prev)}
            title={showCaptions ? 'Hide Captions' : 'Show Captions'}
            type="button"
          >
            <Subtitles size={18} />
          </button>
        )}

        {/* Time */}
        <span className="custom-video-player__time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Scrubber Container */}
        <div className="custom-video-player__scrubber-wrap">
          <input
            aria-label="Video progress"
            className="custom-video-scrubber"
            max={duration || 0}
            min="0"
            onChange={handleSeek}
            step="0.1"
            style={{
              background: `linear-gradient(90deg, #7c3aed ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.2) ${duration ? (currentTime / duration) * 100 : 0}%)`,
            }}
            type="range"
            value={currentTime}
          />
        </div>

        {/* Fullscreen (inline, for non-fullscreen mode) */}
        {!isFullscreen && (
          <button
            aria-label="Fullscreen"
            className="custom-video-player__btn"
            onClick={toggleFullscreen}
            title="Fullscreen"
            type="button"
          >
            <Maximize size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
