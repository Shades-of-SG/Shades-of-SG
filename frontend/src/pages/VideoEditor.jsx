import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, Play, Pause, Square, SkipBack, SkipForward, Maximize, Minimize, RefreshCw } from 'lucide-react'
import WaveSurfer from 'wavesurfer.js'
import CreatorPageShell from '../components/CreatorPageShell'

/**
 * Extracts and flattens all frames from sceneSegments,
 * enriching each frame with its parent segment's startTime/endTime.
 */
function extractFrames(songData) {
  if (!songData?.sceneSegments) return []
  const allFrames = []
  const segments = [...songData.sceneSegments].sort((a, b) => a.startTime - b.startTime)

  segments.forEach(segment => {
    if (segment.generatedFrames && segment.generatedFrames.length > 0) {
      const sortedFrames = [...segment.generatedFrames].sort((a, b) => a.frameOrder - b.frameOrder)
      sortedFrames.forEach(frame => {
        allFrames.push({
          ...frame,
          startTime: segment.startTime,
          endTime: segment.endTime,
          lyrics: segment.lyrics,
        })
      })
    }
  })
  return allFrames
}

/* ── inline style objects ── */
const styles = {
  editorShell: {
    display: 'grid',
    gridTemplateRows: '1fr auto auto',
    height: 'calc(100vh - 140px)',
    minHeight: '480px',
    background: '#0a0a1a',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #1e293b',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,.5)',
  },
  canvasRow: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    minHeight: 0, // critical for grid/flex shrinking
  },
  previewImg: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
  },
  lyricsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent)',
    padding: '16px 24px',
    pointerEvents: 'none',
  },
  lyricsText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: '0.875rem',
    fontWeight: 500,
    letterSpacing: '0.025em',
    textShadow: '0 2px 4px rgba(0,0,0,.5)',
    margin: 0,
  },
  controlsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '8px 16px',
    background: 'rgba(15,23,42,.8)',
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
  },
  playBtn: {
    padding: '12px',
    borderRadius: '50%',
    background: '#7c3aed',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 15px -3px rgba(124,58,237,.25)',
  },
  timeDisplay: {
    marginLeft: '16px',
    fontSize: '0.75rem',
    color: '#64748b',
    fontFamily: 'monospace',
    fontVariantNumeric: 'tabular-nums',
  },
  frameDisplay: {
    marginLeft: '8px',
    fontSize: '0.75rem',
    color: '#475569',
  },
  bottomStrip: {
    background: '#0f172a',
    borderTop: '1px solid #1e293b',
    padding: '12px',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  sectionLabel: {
    color: '#94a3b8',
    fontWeight: 500,
    textTransform: 'uppercase',
    fontSize: '10px',
    letterSpacing: '0.05em',
    margin: 0,
  },
  sceneBadge: {
    color: '#8b5cf6',
    fontSize: '10px',
    fontWeight: 700,
  },
  filmstrip: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    overflowX: 'auto',
    overflowY: 'hidden',
    gap: '8px',
    padding: '8px',
    alignItems: 'center',
    background: 'rgba(30,41,59,.3)',
    borderRadius: '8px',
    border: '1px solid rgba(51,65,85,.5)',
    height: '5rem',
  },
  waveformSection: {
    marginTop: '8px',
  },
  waveformContainer: {
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'rgba(30,41,59,.5)',
    border: '1px solid #334155',
    height: '64px',
  },
  emptyCanvas: {
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#64748b',
    fontWeight: 700,
    fontSize: '1.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '8px',
  },
  emptySub: {
    color: '#475569',
    fontSize: '0.875rem',
    margin: 0,
  },
}

function thumbnailStyle(isActive) {
  return {
    flexShrink: 0,
    height: '3.5rem',
    aspectRatio: '16/9',
    borderRadius: '6px',
    objectFit: 'cover',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    outline: isActive ? '2px solid #8b5cf6' : '1px solid rgba(51,65,85,.5)',
    outlineOffset: isActive ? '2px' : '0',
    opacity: isActive ? 1 : 0.5,
    transform: isActive ? 'scale(1.08)' : 'scale(1)',
    boxShadow: isActive ? '0 10px 15px -3px rgba(139,92,246,.25)' : 'none',
    border: 'none',
    padding: 0,
    background: 'none',
    display: 'block',
  }
}

export default function VideoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [jobData, setJobData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [frames, setFrames] = useState([])
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [audioUrl, setAudioUrl] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const waveformRef = useRef(null)
  const wavesurferRef = useRef(null)
  
  const canvasRowRef = useRef(null)
  const filmstripRef = useRef(null)
  const autoScrollPausedRef = useRef(false)
  const autoScrollTimeoutRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showRegenerateInput, setShowRegenerateInput] = useState(false)
  const [userFeedback, setUserFeedback] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Fullscreen UI State
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef(null)

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (wavesurferRef.current?.isPlaying()) {
        setShowControls(false)
      }
    }, 2500)
  }, [])

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    } else {
      handleMouseMove()
    }
  }, [isPlaying, handleMouseMove])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRowRef.current?.requestFullscreen().catch(err => {
        console.warn('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  // Auto-scroll filmstrip to the active frame
  useEffect(() => {
    if (!filmstripRef.current) return;
    if (autoScrollPausedRef.current) return; // do not auto-scroll if user is interacting
    const activeThumb = filmstripRef.current.children[currentFrameIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentFrameIndex])

  const handleManualScrollIntent = () => {
    autoScrollPausedRef.current = true;
    if (autoScrollTimeoutRef.current) clearTimeout(autoScrollTimeoutRef.current);
    autoScrollTimeoutRef.current = setTimeout(() => {
      autoScrollPausedRef.current = false;
    }, 4000);
  }

  useEffect(() => {
    fetch(`/api/generation/${id}/status`)
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          setJobData(result.data)
          setFrames(extractFrames(result.data.song))
          setAudioUrl(result.data.song?.audioUrl || '')
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const syncFrameToTime = useCallback((time) => {
    if (frames.length === 0) return
    let idx = 0
    for (let i = frames.length - 1; i >= 0; i--) {
      if (time >= frames[i].startTime) {
        idx = i
        break
      }
    }
    setCurrentFrameIndex(prev => prev !== idx ? idx : prev)
  }, [frames])

  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#6d28d9',
      progressColor: '#a78bfa',
      cursorColor: '#c4b5fd',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 64,
      responsive: true,
      backend: 'WebAudio',
    })

    ws.load(audioUrl)
    wavesurferRef.current = ws

    ws.on('ready', () => setDuration(ws.getDuration()))
    ws.on('audioprocess', (time) => { setCurrentTime(time); syncFrameToTime(time) })
    ws.on('seeking', (time) => { setCurrentTime(time); syncFrameToTime(time) })
    ws.on('play', () => setIsPlaying(true))
    ws.on('pause', () => setIsPlaying(false))
    ws.on('finish', () => setIsPlaying(false))

    return () => { ws.destroy(); wavesurferRef.current = null }
  }, [audioUrl, syncFrameToTime])

  const handlePlayPause = () => wavesurferRef.current?.playPause()

  const handleStop = () => {
    wavesurferRef.current?.stop()
    setCurrentTime(0)
    setCurrentFrameIndex(0)
  }

  const handleSkipBack = useCallback(() => {
    if (wavesurferRef.current) {
      const newTime = Math.max(0, wavesurferRef.current.getCurrentTime() - 5)
      wavesurferRef.current.seekTo(newTime / duration)
    }
  }, [duration])

  const handleSkipForward = useCallback(() => {
    if (wavesurferRef.current) {
      const newTime = Math.min(duration, wavesurferRef.current.getCurrentTime() + 5)
      wavesurferRef.current.seekTo(newTime / duration)
    }
  }, [duration])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in the feedback input
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkipBack();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkipForward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkipBack, handleSkipForward]);

  const handleRegenerateFrame = async () => {
    if (frames.length === 0) return;
    const currentFrame = frames[currentFrameIndex];
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/generation/frame/${currentFrame.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userFeedback })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const newFrames = [...frames];
        newFrames[currentFrameIndex].imageUrl = result.data.imageUrl;
        setFrames(newFrames);
        setShowRegenerateInput(false);
        setUserFeedback('');
      } else {
        alert('Failed to regenerate: ' + result.message);
      }
    } catch(e) {
      console.error(e);
      alert('Error regenerating frame');
    } finally {
      setIsRegenerating(false);
    }
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/generation/${id}/export`, { method: 'POST' });
      const result = await res.json();
      if (result.success && result.videoUrl) {
        // Trigger download directly in the browser
        const a = document.createElement('a');
        a.href = result.videoUrl;
        a.download = `KindMaster_Export_${id}.mp4`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('Export failed: ' + result.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error starting export');
    } finally {
      setIsExporting(false);
    }
  }

  const handleThumbnailClick = (index) => {
    setCurrentFrameIndex(index)
    if (wavesurferRef.current && duration > 0) {
      wavesurferRef.current.seekTo(frames[index].startTime / duration)
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <CreatorPageShell breadcrumbs={['Video Editor']} title="Editor" description="Loading workspace...">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
          <Loader2 style={{ width: '2rem', height: '2rem', animation: 'spin 1s linear infinite', color: '#8b5cf6' }} />
        </div>
      </CreatorPageShell>
    )
  }

  return (
    <CreatorPageShell
      breadcrumbs={['Generation Tasks', 'Video Editor']}
      title="Timeline Editor"
      description="Refine your scenes, adjust timings, and export the final masterpiece."
      actions={
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            className="studio-button studio-button--secondary"
            onClick={() => navigate(`/creator/generation/${id}`)}
          >
            Back to Job
          </button>
          <button
            className="studio-button studio-button--secondary"
            onClick={() => navigate('/creator/studio', { state: { songData: jobData?.song } })}
          >
            Publish to Studio
          </button>
          <button
            className="studio-button studio-button--primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Final Video'}
          </button>
        </div>
      }
    >
      {/* ═══════ EDITOR SHELL — CSS Grid, 3 rows ═══════ */}
      <div style={styles.editorShell}>

        {/* ═══════ ROW 1: Video Preview Canvas ═══════ */}
        <div 
          style={{
            ...styles.canvasRow,
            cursor: (isFullscreen && !showControls) ? 'none' : 'default'
          }} 
          ref={canvasRowRef}
          onMouseMove={isFullscreen ? handleMouseMove : undefined}
          onClick={isFullscreen ? handleMouseMove : undefined}
        >
          {frames.length > 0 ? (
            <img
              src={frames[currentFrameIndex]?.imageUrl}
              alt={`Frame ${currentFrameIndex + 1}`}
              width={1792}
              height={1024}
              style={styles.previewImg}
            />
          ) : (
            <div style={styles.emptyCanvas}>
              <h3 style={styles.emptyTitle}>Video Preview Canvas</h3>
              <p style={styles.emptySub}>Main viewer will mount here</p>
            </div>
          )}

          {/* Overlays Wrapper (fades out when inactive in fullscreen) */}
          <div style={{ 
            opacity: (isFullscreen && !showControls) ? 0 : 1, 
            transition: 'opacity 0.3s ease',
            pointerEvents: (isFullscreen && !showControls) ? 'none' : 'auto'
          }}>
            {/* Regenerate Button & Input Overlay */}
            {frames.length > 0 && (
              <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
                {showRegenerateInput ? (
                  <div style={{ background: 'rgba(0,0,0,0.8)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', backdropFilter: 'blur(4px)' }}>
                    <textarea 
                      placeholder="What should change? (Optional)" 
                      value={userFeedback}
                      onChange={e => setUserFeedback(e.target.value)}
                      style={{ width: '250px', height: '60px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '8px', fontSize: '14px', resize: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleRegenerateFrame} disabled={isRegenerating} style={{ flex: 1, background: '#8b5cf6', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                        {isRegenerating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirm'}
                      </button>
                      <button onClick={() => setShowRegenerateInput(false)} disabled={isRegenerating} style={{ flex: 1, background: '#334155', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowRegenerateInput(true)}
                    title="Regenerate Frame"
                    style={{
                      background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '8px', padding: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                  >
                    <RefreshCw size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Fullscreen Button */}
            <button 
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Maximize Video"}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
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
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>

            {/* Fullscreen Overlay Controls */}
            {isFullscreen && (
              <div style={{ ...styles.controlsBar, position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.8)', borderTop: 'none', padding: '16px', zIndex: 20 }}>
                <button onClick={handleSkipBack} style={styles.controlBtn} title="Previous Frame">
                  <SkipBack size={20} />
                </button>
                <button onClick={handlePlayPause} style={styles.playBtn} title={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '2px' }} />}
                </button>
                <button onClick={handleStop} style={styles.controlBtn} title="Stop">
                  <Square size={20} />
                </button>
                <button onClick={handleSkipForward} style={styles.controlBtn} title="Next Frame">
                  <SkipForward size={20} />
                </button>
                <span style={{ ...styles.timeDisplay, color: '#fff' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <span style={{ ...styles.frameDisplay, color: '#e2e8f0' }}>
                  Frame {currentFrameIndex + 1} / {frames.length}
                </span>
              </div>
            )}
          </div>

          {/* Lyrics overlay */}
          {frames[currentFrameIndex]?.lyrics && (
            <div style={{ 
              ...styles.lyricsOverlay, 
              bottom: (isFullscreen && showControls) ? '70px' : '0px',
              transition: 'bottom 0.3s ease' 
            }}>
              <p style={styles.lyricsText}>
                {frames[currentFrameIndex].lyrics}
              </p>
            </div>
          )}
        </div>

        {/* ═══════ ROW 2: Playback Controls ═══════ */}
        {!isFullscreen && (
          <div style={styles.controlsBar}>
            <button onClick={handleSkipBack} style={styles.controlBtn} title="Previous Frame">
              <SkipBack size={16} />
            </button>
            <button onClick={handlePlayPause} style={styles.playBtn} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
            </button>
            <button onClick={handleStop} style={styles.controlBtn} title="Stop">
              <Square size={16} />
            </button>
            <button onClick={handleSkipForward} style={styles.controlBtn} title="Next Frame">
              <SkipForward size={16} />
            </button>
            <span style={styles.timeDisplay}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <span style={styles.frameDisplay}>
              Frame {currentFrameIndex + 1} / {frames.length}
            </span>
          </div>
        )}

        {/* ═══════ ROW 3: Filmstrip + Waveform ═══════ */}
        <div style={styles.bottomStrip}>

          {/* Filmstrip Header */}
          <div style={styles.sectionHeader}>
            <h4 style={styles.sectionLabel}>Filmstrip</h4>
            <span style={styles.sceneBadge}>{jobData?.song?.sceneSegments?.length || 0} Scenes</span>
          </div>

          {/* Horizontal Filmstrip — strict single row, horizontal scroll only */}
          <div 
            style={styles.filmstrip} 
            ref={filmstripRef} 
            className="custom-scrollbar"
            onWheel={handleManualScrollIntent}
            onTouchMove={handleManualScrollIntent}
          >
            {frames.map((frame, index) => (
              <img
                key={frame.id}
                src={frame.imageUrl}
                alt={`Frame ${index + 1}`}
                width={142}
                height={80}
                loading="lazy"
                onClick={() => handleThumbnailClick(index)}
                style={thumbnailStyle(index === currentFrameIndex)}
              />
            ))}
          </div>

          {/* Audio Waveform */}
          <div style={styles.waveformSection}>
            <div style={{ ...styles.sectionHeader, marginBottom: '4px' }}>
              <h4 style={styles.sectionLabel}>Audio Waveform</h4>
            </div>
            <div ref={waveformRef} style={styles.waveformContainer} />
          </div>
        </div>

      </div>
    </CreatorPageShell>
  )
}
