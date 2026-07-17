import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Subtitles } from 'lucide-react'

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

/* ── Inline style objects (mirroring VideoEditor dark-panel aesthetic) ── */
const styles = {
  wrapper: {
    position: 'relative',
    background: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #1e293b',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,.5)',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
  },
  video: {
    display: 'block',
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    cursor: 'pointer',
    background: '#000',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent)',
    padding: '32px 24px 16px',
    pointerEvents: 'none',
    transition: 'bottom 0.3s ease',
  },
  captionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: '0.9rem',
    fontWeight: 500,
    letterSpacing: '0.025em',
    textShadow: '0 2px 4px rgba(0,0,0,.5)',
    margin: 0,
    lineHeight: 1.5,
  },
  controlsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    background: 'rgba(15,23,42,.9)',
    borderTop: '1px solid #1e293b',
  },
  controlBtn: {
    padding: '8px',
    borderRadius: '8px',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 150ms ease',
  },
  playBtn: {
    padding: '10px',
    borderRadius: '50%',
    background: '#7c3aed',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 15px -3px rgba(124,58,237,.25)',
    transition: 'transform 100ms ease',
  },
  scrubber: {
    flex: 1,
    accentColor: '#7c3aed',
    cursor: 'pointer',
    height: '4px',
  },
  timeDisplay: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontFamily: 'monospace',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
}

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
      setShowControls(true)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    } else if (isFullscreen) {
      handleMouseMove()
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
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        handleSkipBack()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        handleSkipForward()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, handleSkipBack, handleSkipForward])

  // Determine whether controls overlay should be visible
  const controlsVisible = !isFullscreen || showControls
  const cursorStyle = (isFullscreen && !showControls) ? 'none' : 'default'

  return (
    <div
      ref={wrapperRef}
      style={{ ...styles.wrapper, cursor: cursorStyle }}
      onMouseMove={isFullscreen ? handleMouseMove : undefined}
    >
      {/* ── Video Element ── */}
      <div style={styles.videoContainer}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          onClick={togglePlay}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); setCurrentTime(0) }}
          onPlay={() => { setIsPlaying(true); onPlay?.() }}
          onPause={() => { setIsPlaying(false); onPause?.() }}
          onEnded={() => { setIsPlaying(false); setCurrentTime(0) }}
          style={{
            ...styles.video,
            ...(isFullscreen ? { height: '100vh', objectFit: 'contain' } : {}),
          }}
        />

        {/* ── Caption Overlay ── */}
        {showCaptions && activeCaption && (
          <div style={{
            ...styles.captionOverlay,
            bottom: (isFullscreen && controlsVisible) ? '70px' : '0px',
            opacity: controlsVisible || !isFullscreen ? 1 : 0.9,
          }}>
            <p style={styles.captionText}>
              {activeCaption.text}
            </p>
          </div>
        )}

        {/* ── Fullscreen Toggle (top-right) ── */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px',
            color: '#fff',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            transition: 'opacity 0.3s ease',
            opacity: controlsVisible ? 1 : 0,
            pointerEvents: controlsVisible ? 'auto' : 'none',
          }}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* ── Controls Bar ── */}
      <div style={{
        ...styles.controlsBar,
        ...(isFullscreen ? {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: 'rgba(0,0,0,0.85)',
          borderTop: 'none',
          padding: '14px 16px',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          opacity: controlsVisible ? 1 : 0,
          transform: controlsVisible ? 'translateY(0)' : 'translateY(100%)',
          pointerEvents: controlsVisible ? 'auto' : 'none',
        } : {}),
      }}>
        {/* Skip Back */}
        <button onClick={handleSkipBack} style={styles.controlBtn} title="Back 5s">
          <SkipBack size={18} />
        </button>

        {/* Play / Pause */}
        <button onClick={togglePlay} style={styles.playBtn} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
        </button>

        {/* Skip Forward */}
        <button onClick={handleSkipForward} style={styles.controlBtn} title="Forward 5s">
          <SkipForward size={18} />
        </button>

        {/* CC Toggle (only if we have caption data) */}
        {hasCaptions && (
          <button
            onClick={() => setShowCaptions(prev => !prev)}
            style={{ ...styles.controlBtn, color: showCaptions ? '#e2e8f0' : '#64748b' }}
            title={showCaptions ? 'Hide Captions' : 'Show Captions'}
          >
            <Subtitles size={18} />
          </button>
        )}

        {/* Time */}
        <span style={styles.timeDisplay}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Scrubber */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          aria-label="Video progress"
          style={styles.scrubber}
        />

        {/* Fullscreen (inline, for non-fullscreen mode) */}
        {!isFullscreen && (
          <button onClick={toggleFullscreen} style={styles.controlBtn} title="Fullscreen">
            <Maximize size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
