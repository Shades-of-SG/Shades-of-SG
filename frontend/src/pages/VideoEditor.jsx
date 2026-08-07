import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, Play, Pause, Square, SkipBack, SkipForward, Maximize, Minimize, RefreshCw, Subtitles, X, Edit3, Sparkles, MessageSquare, Send, Zap, Save } from 'lucide-react'
import WaveSurfer from 'wavesurfer.js'
import CreatorPageShell from '../components/CreatorPageShell'
import { API_URL } from '../services/apiConfig'
import { editFrameAdvanced, sendAssistantCommand, updateSegmentLyrics } from '../services/songService'

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
          visualPrompt: segment.visualPrompt || frame.visualPrompt || '',
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
    height: 'calc(100vh - 120px)',
    minHeight: '500px',
    width: '100%',
    maxWidth: '100%',
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
    width: '100%',
    height: '100%',
    minHeight: 0, // critical for grid/flex shrinking
    aspectRatio: '16 / 9',
  },
  previewImg: {
    display: 'block',
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  lyricsOverlay: {
    position: 'absolute',
    bottom: '20px',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    padding: '0 16px',
    pointerEvents: 'none',
  },
  lyricsText: {
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: '8px 20px',
    borderRadius: '10px',
    fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
    fontWeight: 700,
    letterSpacing: '0.025em',
    textShadow: '0 2px 6px rgba(0, 0, 0, 0.95)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    textAlign: 'center',
    maxWidth: '90%',
    margin: 0,
    lineHeight: 1.4,
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
  const framesRef = useRef(frames)

  useEffect(() => {
    framesRef.current = frames
  }, [frames])

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [audioUrl, setAudioUrl] = useState('')
  const [transcriptionSegments, setTranscriptionSegments] = useState([])
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
  // ── Edit Scene Modal state ──
  const [showEditModal, setShowEditModal] = useState(false)
  const [editVisualPrompt, setEditVisualPrompt] = useState('')
  const [editLyrics, setEditLyrics] = useState('')
  const [editPropagateToChorus, setEditPropagateToChorus] = useState(false)
  const [editSceneInfo, setEditSceneInfo] = useState(null) // { sceneNumber, startTime, endTime, sceneId }
  const [editBlocks, setEditBlocks] = useState([]) // [{ id, startTime, endTime, text }]
  const [isSavingLyrics, setIsSavingLyrics] = useState(false)
  // ── AI Copilot Drawer state ──
  const [showCopilotDrawer, setShowCopilotDrawer] = useState(false)
  const [copilotInput, setCopilotInput] = useState('')
  const [copilotLog, setCopilotLog] = useState([]) // [{ role: 'user'|'assistant', text, patch? }]
  const [copilotLoading, setCopilotLoading] = useState(false)
  const [pendingPatch, setPendingPatch] = useState(null)
  const [highlightedSceneIds, setHighlightedSceneIds] = useState({}) // { [sceneSegmentId]: true }
  const [isApplyingPatch, setIsApplyingPatch] = useState(false)
  const copilotLogRef = useRef(null)
  const copilotHighlightTimerRef = useRef(null)
  // ── legacy state kept for compatibility ──
  const [showCaptions, setShowCaptions] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)

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
    fetch(`${API_URL}/generation/${id}/status`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          setJobData(result.data)
          setFrames(extractFrames(result.data.song))
          setAudioUrl(result.data.song?.audioUrl || '')
          setTranscriptionSegments(result.data.song?.transcriptionSegments || [])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const syncFrameToTime = useCallback((time) => {
    const currentFrames = framesRef.current || []
    if (currentFrames.length === 0) return
    let idx = 0
    for (let i = currentFrames.length - 1; i >= 0; i--) {
      if (time >= currentFrames[i].startTime) {
        idx = i
        break
      }
    }
    setCurrentFrameIndex(prev => prev !== idx ? idx : prev)
  }, [])

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
        handlePlayPause()
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
      } else if ((e.key === 'a' || e.key === 'A') && e.shiftKey) {
        e.preventDefault()
        setShowCopilotDrawer(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSkipBack, handleSkipForward])

  /**
   * Opens the Edit Scene modal pre-filled with the current frame's data and atomic lyric blocks.
   */
  const handleOpenEditModal = useCallback(() => {
    if (frames.length === 0) return
    const currentFrame = frames[currentFrameIndex]
    const sceneStartTime = currentFrame.startTime ?? 0
    const sceneEndTime = currentFrame.endTime ?? 0

    setEditVisualPrompt(currentFrame.visualPrompt || '')
    setEditLyrics(currentFrame.lyrics || '')
    setEditPropagateToChorus(false)
    setEditSceneInfo({
      sceneNumber: currentFrameIndex + 1,
      startTime: sceneStartTime,
      endTime: sceneEndTime,
      sceneId: currentFrame.sceneSegmentId || currentFrame.id,
    })

    // Extract matching atomic lyric blocks from transcriptionSegments
    const matchingSegs = Array.isArray(transcriptionSegments) ? transcriptionSegments.filter(seg => {
      const start = seg.start ?? seg.startTime ?? 0
      const end = seg.end ?? seg.endTime ?? 0
      return (start >= sceneStartTime && end <= sceneEndTime) ||
             (start <= sceneEndTime && end >= sceneStartTime)
    }) : []

    let initialBlocks = []
    if (matchingSegs.length > 0) {
      initialBlocks = matchingSegs.map((seg, i) => ({
        id: seg.id || `seg-${i}-${seg.start ?? seg.startTime}`,
        startTime: seg.start ?? seg.startTime ?? sceneStartTime,
        endTime: seg.end ?? seg.endTime ?? sceneEndTime,
        text: seg.text || seg.lyrics || '',
      }))
    } else {
      // Fallback: split frame lyrics by newline and subdivide scene time range
      const rawLyrics = currentFrame.lyrics || ''
      const lines = rawLyrics.split('\n').map(l => l.trim()).filter(Boolean)
      const count = lines.length || 1
      const totalDuration = Math.max(0.1, sceneEndTime - sceneStartTime)
      const lineDuration = totalDuration / count

      initialBlocks = (lines.length > 0 ? lines : [rawLyrics]).map((line, i) => ({
        id: `fallback-block-${i}-${Date.now()}`,
        startTime: sceneStartTime + (i * lineDuration),
        endTime: i === count - 1 ? sceneEndTime : sceneStartTime + ((i + 1) * lineDuration),
        text: line,
      }))
    }

    setEditBlocks(initialBlocks)
    setShowEditModal(true)
  }, [frames, currentFrameIndex, transcriptionSegments])

  const handleUpdateBlockText = (index, newText) => {
    setEditBlocks(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], text: newText }
      setEditLyrics(updated.map(b => b.text).filter(Boolean).join('\n'))
      return updated
    })
  }

  /**
   * Submits the edit-advanced request, then hot-swaps updated image URLs
   * in React state without re-initializing WaveSurfer or touching audio.
   */
  const handleEditFrameAdvanced = async (forceRegenerate = false) => {
    if (!editSceneInfo?.sceneId) return
    setIsRegenerating(true)
    try {
      const token = localStorage.getItem('authToken')
      const result = await editFrameAdvanced(
        editSceneInfo.sceneId,
        {
          visualPrompt: editVisualPrompt,
          lyrics: editLyrics,
          propagateToChorus: editPropagateToChorus,
          forceRegenerate,
        },
        token
      )

      if (result.success && Array.isArray(result.updatedScenes)) {
        const updatesMap = new Map(result.updatedScenes.map(s => [s.id, s]))
        setFrames(prevFrames =>
          prevFrames.map(frame => {
            const matchId = frame.sceneSegmentId || frame.id
            const update = updatesMap.get(matchId)
            if (!update) return frame
            return {
              ...frame,
              imageUrl: update.imageUrl,
              visualPrompt: update.visualPrompt,
              lyrics: update.lyrics,
            }
          })
        )

        // Live-sync video subtitle captions overlay state with atomic block precision
        setTranscriptionSegments(prevSegments => {
          if (!prevSegments || prevSegments.length === 0) return prevSegments
          const updatedLyrics = editLyrics.trim()
          const currentLyrics = (frames[currentFrameIndex]?.lyrics || '').trim()

          return prevSegments.map(seg => {
            const start = seg.start ?? seg.startTime ?? 0
            const end = seg.end ?? seg.endTime ?? 0

            // 1. Direct block id match
            const matchedBlockById = editBlocks.find(b => b.id && b.id === seg.id)
            if (matchedBlockById) {
              return { ...seg, text: matchedBlockById.text, lyrics: matchedBlockById.text }
            }

            // 2. Direct timestamp overlap match with a specific block in editBlocks
            const matchedBlockByTime = editBlocks.find(b => (
              (start >= b.startTime && end <= b.endTime) ||
              (start <= b.endTime && end >= b.startTime)
            ))
            if (matchedBlockByTime) {
              return { ...seg, text: matchedBlockByTime.text, lyrics: matchedBlockByTime.text }
            }

            // 3. Chorus propagation match
            if (editPropagateToChorus && (seg.text || seg.lyrics || '').trim() === currentLyrics) {
              return { ...seg, text: updatedLyrics, lyrics: updatedLyrics }
            }

            return seg
          })
        })

        setHasEdits(true)
        setShowEditModal(false)
      } else {
        alert('Edit failed: ' + (result.message || 'Unknown error'))
      }
    } catch (e) {
      console.error('[EditFrameAdvanced]', e)
      alert('Error editing frame: ' + (e.message || 'Unknown error'))
    } finally {
      setIsRegenerating(false)
    }
  }

  /**
   * Smart submit for Edit Scene modal:
   * - If ONLY lyrics were changed (prompt unchanged), updates lyrics directly via updateSegmentLyrics API
   *   without running expensive AI image generation.
   * - If prompt was changed (or forced), triggers AI image re-generation.
   */
  const handleEditFrameSubmit = async () => {
    if (!editSceneInfo?.sceneId) return
    const currentFrame = frames[currentFrameIndex]
    const originalPrompt = (currentFrame?.visualPrompt || '').trim()
    const originalLyrics = (currentFrame?.lyrics || '').trim()

    const promptChanged = editVisualPrompt.trim() !== originalPrompt
    const lyricsChanged = editLyrics.trim() !== originalLyrics

    // 1. If prompt changed (or user requested chorus propagation), run AI generation
    if (promptChanged || editPropagateToChorus) {
      return handleEditFrameAdvanced(promptChanged)
    }

    // 2. If ONLY lyrics changed, update lyrics directly via PUT /api/songs/:songId/segment/:segmentId
    if (lyricsChanged) {
      const songId = jobData?.song?.id || currentFrame?.songId
      if (!songId) {
        return handleEditFrameAdvanced(false)
      }

      setIsSavingLyrics(true)
      try {
        const token = localStorage.getItem('authToken')
        const result = await updateSegmentLyrics(songId, editSceneInfo.sceneId, editLyrics.trim(), token)

        if (result.success) {
          const updatedLyrics = editLyrics.trim()
          setFrames(prevFrames =>
            prevFrames.map(frame => {
              const matchId = frame.sceneSegmentId || frame.id
              if (matchId !== editSceneInfo.sceneId) return frame
              return { ...frame, lyrics: updatedLyrics }
            })
          )

          // Live-sync video subtitle captions overlay state with atomic block precision
          setTranscriptionSegments(prevSegments => {
            if (!prevSegments || prevSegments.length === 0) return prevSegments
            return prevSegments.map(seg => {
              const start = seg.start ?? seg.startTime ?? 0
              const end = seg.end ?? seg.endTime ?? 0

              const matchedBlockById = editBlocks.find(b => b.id && b.id === seg.id)
              if (matchedBlockById) {
                return { ...seg, text: matchedBlockById.text, lyrics: matchedBlockById.text }
              }

              const matchedBlockByTime = editBlocks.find(b => (
                (start >= b.startTime && end <= b.endTime) ||
                (start <= b.endTime && end >= b.startTime)
              ))
              if (matchedBlockByTime) {
                return { ...seg, text: matchedBlockByTime.text, lyrics: matchedBlockByTime.text }
              }

              return seg
            })
          })

          setHasEdits(true)
          setShowEditModal(false)
        } else {
          alert('Failed to update lyrics: ' + (result.message || 'Unknown error'))
        }
      } catch (e) {
        console.error('[UpdateSegmentLyrics]', e)
        alert('Error updating lyrics: ' + (e.message || 'Unknown error'))
      } finally {
        setIsSavingLyrics(false)
      }
      return
    }

    // 3. If neither changed, just close modal
    setShowEditModal(false)
  }

  // ── AI Copilot Handlers ──

  /**
   * Sends the natural language command to DeepSeek, appends to log,
   * highlights affected filmstrip thumbnails, sets the pending patch for preview.
   */
  const handleSendCopilotCommand = useCallback(async () => {
    const command = copilotInput.trim()
    if (!command || copilotLoading) return

    const token = localStorage.getItem('authToken')
    const activeFrame = frames[currentFrameIndex]
    const activeSceneSegmentId = activeFrame ? (activeFrame.sceneSegmentId || activeFrame.id || null) : null

    setCopilotLog(prev => [...prev, { role: 'user', text: command }])
    setCopilotInput('')
    setCopilotLoading(true)
    setPendingPatch(null)

    try {
      const result = await sendAssistantCommand(id, { command, activeSceneSegmentId }, token)

      if (result.success && result.patch) {
        const { patch } = result
        setCopilotLog(prev => [...prev, { role: 'assistant', text: patch.explanation, patch }])
        setPendingPatch(patch)

        if (patch.targetSceneSegmentIds?.length > 0) {
          const highlightMap = {}
          patch.targetSceneSegmentIds.forEach(sid => { highlightMap[sid] = true })
          setHighlightedSceneIds(highlightMap)
          if (copilotHighlightTimerRef.current) clearTimeout(copilotHighlightTimerRef.current)
          copilotHighlightTimerRef.current = setTimeout(() => setHighlightedSceneIds({}), 8000)
        }
      } else {
        setCopilotLog(prev => [...prev, { role: 'assistant', text: result.message || 'No patch returned from AI.' }])
      }
    } catch (e) {
      setCopilotLog(prev => [...prev, { role: 'assistant', text: `Error: ${e.message || 'Failed to reach AI Copilot.'}` }])
    } finally {
      setCopilotLoading(false)
      setTimeout(() => { if (copilotLogRef.current) copilotLogRef.current.scrollTop = copilotLogRef.current.scrollHeight }, 50)
    }
  }, [copilotInput, copilotLoading, frames, currentFrameIndex, id])

  /**
   * Applies the pending AI patch by calling editFrameAdvanced for each target scene.
   * Hot-swaps frame state without re-initializing WaveSurfer.
   */
  const handleApplyPatch = useCallback(async () => {
    if (!pendingPatch || isApplyingPatch) return
    const token = localStorage.getItem('authToken')
    setIsApplyingPatch(true)

    try {
      const { targetSceneSegmentIds, newPrompt, newLyrics, action } = pendingPatch
      const propagateToChorus = action === 'PROPAGATE_CHORUS'
      const allUpdatedScenes = []

      for (const sceneId of targetSceneSegmentIds) {
        const matchedFrame = frames.find(f => (f.sceneSegmentId || f.id) === sceneId)
        const payload = {
          visualPrompt: newPrompt || matchedFrame?.visualPrompt || 'Cinematic scene',
          lyrics: newLyrics !== null ? newLyrics : (matchedFrame?.lyrics || ''),
          propagateToChorus,
        }
        try {
          const result = await editFrameAdvanced(sceneId, payload, token)
          if (result.success && Array.isArray(result.updatedScenes)) {
            allUpdatedScenes.push(...result.updatedScenes)
          }
        } catch (sceneErr) {
          console.error(`[Copilot Apply] Failed for scene ${sceneId}:`, sceneErr)
        }
      }

      if (allUpdatedScenes.length > 0) {
        const updatesMap = new Map(allUpdatedScenes.map(s => [s.id, s]))
        setFrames(prevFrames =>
          prevFrames.map(frame => {
            const matchId = frame.sceneSegmentId || frame.id
            const update = updatesMap.get(matchId)
            if (!update) return frame
            return { ...frame, imageUrl: update.imageUrl, visualPrompt: update.visualPrompt, lyrics: update.lyrics }
          })
        )

        // Live-sync video subtitle captions overlay state
        setTranscriptionSegments(prevSegments => {
          if (!prevSegments || prevSegments.length === 0) return prevSegments
          return prevSegments.map(seg => {
            const start = seg.start ?? seg.startTime ?? 0
            const end = seg.end ?? seg.endTime ?? 0
            const matchedScene = allUpdatedScenes.find(s => (
              (start >= s.startTime && end <= s.endTime) ||
              (start <= s.endTime && end >= s.startTime)
            ))
            if (matchedScene && matchedScene.lyrics) {
              return { ...seg, text: matchedScene.lyrics, lyrics: matchedScene.lyrics }
            }
            return seg
          })
        })

        setHasEdits(true)
      }

      setCopilotLog(prev => [...prev, { role: 'assistant', text: `✓ Applied to ${allUpdatedScenes.length} scene(s) successfully. Thumbnails updated.` }])
      setPendingPatch(null)
      setHighlightedSceneIds({})
      if (copilotHighlightTimerRef.current) clearTimeout(copilotHighlightTimerRef.current)
      setTimeout(() => { if (copilotLogRef.current) copilotLogRef.current.scrollTop = copilotLogRef.current.scrollHeight }, 50)
    } catch (e) {
      console.error('[Copilot Apply]', e)
      setCopilotLog(prev => [...prev, { role: 'assistant', text: `Apply failed: ${e.message}` }])
    } finally {
      setIsApplyingPatch(false)
    }
  }, [pendingPatch, isApplyingPatch, frames])

  const handleClearPatch = useCallback(() => {
    setPendingPatch(null)
    setHighlightedSceneIds({})
    if (copilotHighlightTimerRef.current) clearTimeout(copilotHighlightTimerRef.current)
  }, [])

  const handlePublishToStudio = async () => {
    const songId = jobData?.song?.id
    if (!songId) {
      alert('Song metadata is missing. Cannot navigate to Studio.')
      return
    }
    setIsPublishing(true);
    try {
      let finalVideoUrl = jobData?.song?.videoUrl || '';

      // Heavy Lane: Run export API if edits exist or if no video is compiled yet
      if (hasEdits || !finalVideoUrl) {
        const res = await fetch(`${API_URL}/generation/${id}/export`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          body: JSON.stringify({ burnCaptions: false }) 
        });
        const result = await res.json();
        if (result.success && result.videoUrl) {
          finalVideoUrl = result.videoUrl;
        } else {
          alert('Failed to prepare clean video: ' + (result.message || 'Unknown error'));
          setIsPublishing(false);
          return;
        }
      }

      // Fast Lane / Completion: Instantly navigate
      const rawLyrics = jobData?.song?.rawLyrics || jobData?.song?.sceneSegments?.map(s => s.lyrics).filter(Boolean).join('\n\n') || jobData?.song?.lyrics;
      const currentCoverImage = frames[currentFrameIndex]?.imageUrl || jobData?.song?.coverImageUrl || frames[0]?.imageUrl || '';
      
      navigate(`/creator/studio/${encodeURIComponent(songId)}`, {
        state: { 
          videoUrl: finalVideoUrl,
          lyrics: rawLyrics,
          transcriptionSegments: jobData?.song?.transcriptionSegments || [],
          coverImageUrl: currentCoverImage,
          jobId: id,
          originalSongId: songId,
          songData: jobData?.song
        } 
      });
    } catch (e) {
      console.error(e);
      alert('Error preparing clean video for Studio');
    } finally {
      setIsPublishing(false);
    }
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (!hasEdits && !showCaptions && jobData?.song?.videoUrl) {
        // Fast Lane: Trigger download instantly
        const a = document.createElement('a');
        a.href = jobData.song.videoUrl;
        a.download = `KindMaster_Export_${id}.mp4`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsExporting(false);
        return;
      }

      // Heavy Lane: Request compilation from backend
      const res = await fetch(`${API_URL}/generation/${id}/export`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ burnCaptions: showCaptions })
      });
      const result = await res.json();
      if (result.success && result.videoUrl) {
        setHasEdits(false);
        if (!showCaptions) {
          setJobData(prev => ({
            ...prev,
            song: {
              ...(prev?.song || {}),
              videoUrl: result.videoUrl
            }
          }));
        }

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
      className="px-2 md:px-4"
      actions={
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            id="copilot-toggle-btn"
            onClick={() => setShowCopilotDrawer(prev => !prev)}
            title="AI Copilot (Shift+A)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: showCopilotDrawer
                ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
                : 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(139,92,246,0.4)',
              borderRadius: '8px',
              color: showCopilotDrawer ? '#fff' : '#a78bfa',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: showCopilotDrawer ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
            }}
          >
            <Sparkles size={15} />
            AI Copilot
          </button>
          <button
            className="studio-button studio-button--secondary"
            onClick={() => navigate(`/creator/generation/${id}`)}
          >
            Back to Job
          </button>
          <button
            className="studio-button studio-button--secondary"
            onClick={handlePublishToStudio}
            disabled={isPublishing || isExporting}
          >
            {isPublishing ? 'Exporting Clean Video...' : 'Publish to Studio'}
          </button>
          <button
            className="studio-button studio-button--primary"
            onClick={handleExport}
            disabled={isExporting || isPublishing}
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
            {/* Edit Scene Button — opens the advanced modal */}
            {frames.length > 0 && (
              <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
                <button
                  onClick={handleOpenEditModal}
                  title="Edit Scene / Regenerate Frame"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backdropFilter: 'blur(4px)',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(124,58,237,0.75)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                >
                  <Edit3 size={16} />
                  Edit Scene
                </button>
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
                <button 
                  onClick={() => setShowCaptions(!showCaptions)} 
                  style={{...styles.controlBtn, color: showCaptions ? '#e2e8f0' : '#64748b'}} 
                  title={showCaptions ? 'Hide Captions' : 'Show Captions'}
                >
                  <Subtitles size={20} />
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

          {/* Lyrics / Granular Whisper Captions Overlay */}
          {(() => {
            const activeWhisperSeg = Array.isArray(transcriptionSegments) && transcriptionSegments.find((seg) => {
              const start = seg.start ?? seg.startTime ?? 0
              const end = seg.end ?? seg.endTime ?? 0
              return currentTime >= start && currentTime <= end
            })
            const captionText = activeWhisperSeg ? activeWhisperSeg.text : frames[currentFrameIndex]?.lyrics

            return showCaptions && captionText ? (
              <div style={{ 
                ...styles.lyricsOverlay, 
                bottom: (isFullscreen && showControls) ? '80px' : '20px',
                transition: 'bottom 0.3s ease' 
              }}>
                <p style={styles.lyricsText}>
                  {captionText}
                </p>
              </div>
            ) : null
          })()}
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
            <button 
              onClick={() => setShowCaptions(!showCaptions)} 
              style={{...styles.controlBtn, color: showCaptions ? '#e2e8f0' : '#64748b'}} 
              title={showCaptions ? 'Hide Captions' : 'Show Captions'}
            >
              <Subtitles size={16} />
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
                style={(() => {
                  const sceneId = frame.sceneSegmentId || frame.id
                  const isHighlighted = Boolean(highlightedSceneIds[sceneId])
                  const base = thumbnailStyle(index === currentFrameIndex)
                  if (!isHighlighted) return base
                  return {
                    ...base,
                    outline: '2px solid #f59e0b',
                    outlineOffset: '2px',
                    boxShadow: '0 0 12px rgba(245,158,11,0.6)',
                    animation: 'copilot-pulse 1.2s ease-in-out infinite',
                  }
                })()}
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

      {/* ═══════ AI COPILOT PULSE KEYFRAMES ═══════ */}
      <style>{`@keyframes copilot-pulse { 0%,100%{box-shadow:0 0 8px rgba(245,158,11,.5)} 50%{box-shadow:0 0 20px rgba(245,158,11,.9)} }`}</style>

      {/* ═══════ AI COPILOT DRAWER ═══════ */}
      <div style={{
        position:'fixed',top:0,right:0,bottom:0,width:'380px',zIndex:900,
        transform:showCopilotDrawer?'translateX(0)':'translateX(100%)',
        transition:'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display:'flex',flexDirection:'column',
        background:'linear-gradient(180deg,#0d1117 0%,#0f172a 100%)',
        borderLeft:'1px solid rgba(139,92,246,0.25)',
        boxShadow:showCopilotDrawer?'-8px 0 40px rgba(0,0,0,.6)':'none',
      }}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px 14px',borderBottom:'1px solid rgba(51,65,85,.6)',background:'rgba(124,58,237,.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(124,58,237,.4)'}}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <h3 style={{margin:0,color:'#e2e8f0',fontSize:'0.9375rem',fontWeight:700}}>AI Copilot</h3>
              <p style={{margin:0,color:'#64748b',fontSize:'0.6875rem'}}>Natural language scene editor</p>
            </div>
          </div>
          <button onClick={()=>setShowCopilotDrawer(false)} style={{background:'transparent',border:'none',color:'#64748b',cursor:'pointer',padding:'4px',borderRadius:'6px',display:'flex'}} onMouseOver={e=>e.currentTarget.style.color='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.color='#64748b'} aria-label="Close AI Copilot"><X size={18}/></button>
        </div>

        {/* Quick Action Chips */}
        <div style={{padding:'12px 16px 10px',borderBottom:'1px solid rgba(51,65,85,.4)',display:'flex',flexWrap:'wrap',gap:'6px'}}>
          <p style={{margin:'0 0 8px 0',color:'#64748b',fontSize:'0.6875rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',width:'100%'}}>Quick Actions</p>
          {[
            {label:'🌅 Warmer lighting',cmd:'Make the active scene warmer with golden sunset lighting'},
            {label:'🔁 Propagate chorus',cmd:'Propagate the active scene prompt to all repeated chorus scenes'},
            {label:'✏️ Fix active typo',cmd:'Fix any typos in the lyrics of the active scene'},
          ].map(chip=>(
            <button key={chip.label} onClick={()=>setCopilotInput(chip.cmd)}
              style={{padding:'5px 10px',borderRadius:'20px',fontSize:'0.75rem',fontWeight:500,background:'rgba(30,41,59,.8)',border:'1px solid rgba(71,85,105,.5)',color:'#94a3b8',cursor:'pointer',transition:'all .15s'}}
              onMouseOver={e=>{e.currentTarget.style.background='rgba(124,58,237,.2)';e.currentTarget.style.color='#c4b5fd';e.currentTarget.style.borderColor='rgba(139,92,246,.5)'}}
              onMouseOut={e=>{e.currentTarget.style.background='rgba(30,41,59,.8)';e.currentTarget.style.color='#94a3b8';e.currentTarget.style.borderColor='rgba(71,85,105,.5)'}}
            >{chip.label}</button>
          ))}
        </div>

        {/* Command/Response Log */}
        <div ref={copilotLogRef} style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>
          {copilotLog.length===0&&(
            <div style={{textAlign:'center',padding:'40px 20px',color:'#334155'}}>
              <MessageSquare size={32} style={{margin:'0 auto 12px',display:'block',opacity:.4}}/>
              <p style={{margin:0,fontSize:'0.875rem',lineHeight:1.5}}>Ask the Copilot to modify scenes.<br/><span style={{fontSize:'0.75rem'}}>e.g. "Make Scene 3 a rainy street at night"</span></p>
            </div>
          )}
          {copilotLog.map((entry,i)=>(
            <div key={i} style={{display:'flex',flexDirection:'column',alignItems:entry.role==='user'?'flex-end':'flex-start',gap:'6px'}}>
              <div style={{maxWidth:'88%',padding:'10px 14px',borderRadius:entry.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',background:entry.role==='user'?'linear-gradient(135deg,#5b21b6,#4338ca)':'rgba(30,41,59,.9)',border:entry.role==='user'?'none':'1px solid rgba(51,65,85,.6)',color:'#e2e8f0',fontSize:'0.8125rem',lineHeight:1.5}}>
                {entry.role==='assistant'&&(
                  <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
                    <Sparkles size={11} color="#a78bfa"/>
                    <span style={{color:'#a78bfa',fontSize:'0.6875rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Copilot</span>
                    {entry.patch&&<span style={{marginLeft:'auto',background:'rgba(124,58,237,.25)',color:'#c4b5fd',fontSize:'0.625rem',fontWeight:700,padding:'1px 6px',borderRadius:'4px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{entry.patch.action?.replace('_',' ')}</span>}
                  </div>
                )}
                {entry.text}
              </div>
              {entry.role==='assistant'&&entry.patch&&pendingPatch===entry.patch&&(
                <div style={{width:'88%',background:'rgba(124,58,237,.08)',border:'1px solid rgba(139,92,246,.3)',borderRadius:'10px',padding:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',color:'#94a3b8',fontSize:'0.75rem'}}>
                    <Zap size={12} color="#f59e0b"/>
                    <span style={{color:'#f59e0b',fontWeight:600}}>{entry.patch.targetSceneSegmentIds?.length||0} scene(s)</span>
                    <span>will be updated</span>
                  </div>
                  {entry.patch.newPrompt&&<p style={{margin:0,color:'#64748b',fontSize:'0.7rem',fontStyle:'italic',borderLeft:'2px solid rgba(139,92,246,.4)',paddingLeft:'8px',lineHeight:1.4}}>{entry.patch.newPrompt.substring(0,120)}{entry.patch.newPrompt.length>120?'…':''}</p>}
                  <div style={{display:'flex',gap:'8px'}}>
                    <button id="copilot-apply-btn" onClick={handleApplyPatch} disabled={isApplyingPatch}
                      style={{flex:1,padding:'8px 12px',background:isApplyingPatch?'#4c1d95':'linear-gradient(135deg,#7c3aed,#6d28d9)',border:'none',borderRadius:'7px',color:'#fff',fontSize:'0.8125rem',fontWeight:700,cursor:isApplyingPatch?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',boxShadow:isApplyingPatch?'none':'0 4px 12px rgba(124,58,237,.4)',transition:'all .2s'}}>
                      {isApplyingPatch?(<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>Applying...</>):(<><Zap size={14}/>1-Click Apply AI Edits</>)}
                    </button>
                    <button onClick={handleClearPatch} disabled={isApplyingPatch}
                      style={{padding:'8px 10px',background:'transparent',border:'1px solid rgba(71,85,105,.5)',borderRadius:'7px',color:'#64748b',fontSize:'0.75rem',cursor:'pointer',transition:'all .2s'}}
                      onMouseOver={e=>e.currentTarget.style.borderColor='rgba(100,116,139,.8)'}
                      onMouseOut={e=>e.currentTarget.style.borderColor='rgba(71,85,105,.5)'}
                    >Dismiss</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {copilotLoading&&(
            <div style={{display:'flex',alignItems:'center',gap:'8px',color:'#64748b',fontSize:'0.75rem'}}>
              <Loader2 size={14} style={{animation:'spin 1s linear infinite',color:'#7c3aed'}}/>
              Copilot is thinking...
            </div>
          )}
        </div>

        {/* Pinned Input Row */}
        <div style={{padding:'12px 16px 16px',borderTop:'1px solid rgba(51,65,85,.5)',background:'rgba(15,23,42,.8)',display:'flex',flexDirection:'column',gap:'8px'}}>
          <div style={{display:'flex',gap:'8px'}}>
            <input
              id="copilot-command-input"
              type="text"
              value={copilotInput}
              onChange={e=>setCopilotInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSendCopilotCommand()}}}
              disabled={copilotLoading}
              placeholder="Tell the AI what to change..."
              style={{flex:1,background:'rgba(15,23,42,.9)',border:'1px solid rgba(71,85,105,.5)',borderRadius:'8px',padding:'10px 12px',color:'#e2e8f0',fontSize:'0.875rem',outline:'none',transition:'border-color .2s'}}
              onFocus={e=>e.target.style.borderColor='rgba(139,92,246,.7)'}
              onBlur={e=>e.target.style.borderColor='rgba(71,85,105,.5)'}
            />
            <button
              id="copilot-send-btn"
              onClick={handleSendCopilotCommand}
              disabled={copilotLoading||!copilotInput.trim()}
              style={{padding:'10px 14px',background:(!copilotLoading&&copilotInput.trim())?'linear-gradient(135deg,#7c3aed,#6d28d9)':'rgba(51,65,85,.6)',border:'none',borderRadius:'8px',color:'#fff',cursor:(!copilotLoading&&copilotInput.trim())?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s',boxShadow:(!copilotLoading&&copilotInput.trim())?'0 4px 12px rgba(124,58,237,.35)':'none'}}
            >
              {copilotLoading?<Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/>:<Send size={18}/>}
            </button>
          </div>
          <p style={{margin:0,color:'#334155',fontSize:'0.6875rem',textAlign:'center'}}>Enter to send · Shift+A to toggle · Previewed before applying</p>
        </div>
      </div>

      {/* ═══════ EDIT SCENE / FRAME MODAL ═══════ */}
      {showEditModal && (
        <div
          id="edit-scene-modal-backdrop"
          onClick={e => { if (e.target.id === 'edit-scene-modal-backdrop') setShowEditModal(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="custom-scrollbar"
            style={{
              background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)',
              border: '1px solid rgba(139,92,246,0.35)',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 32px 64px -12px rgba(0,0,0,.7), 0 0 0 1px rgba(139,92,246,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Edit Scene {editSceneInfo?.sceneNumber}
                </h2>
                <p style={{ margin: '4px 0 0', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'monospace' }}>
                  {editSceneInfo ? `${formatTime(editSceneInfo.startTime)} → ${formatTime(editSceneInfo.endTime)}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleEditFrameAdvanced(true)}
                  disabled={isRegenerating || isSavingLyrics || !editVisualPrompt.trim()}
                  title="Force new DALL-E image generation"
                  style={{
                    background: 'rgba(124,58,237,0.2)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    color: '#c4b5fd',
                    cursor: (isRegenerating || isSavingLyrics || !editVisualPrompt.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => { if (!isRegenerating && !isSavingLyrics && editVisualPrompt.trim()) e.currentTarget.style.background = 'rgba(124,58,237,0.35)' }}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
                >
                  {isRegenerating ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}
                  ↻ Force New Image
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isRegenerating || isSavingLyrics}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}
                  onMouseOver={e => e.currentTarget.style.color = '#e2e8f0'}
                  onMouseOut={e => e.currentTarget.style.color = '#64748b'}
                  aria-label="Close edit modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(51,65,85,0.7)' }} />

            {/* Visual Prompt */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="edit-visual-prompt" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Visual Prompt
              </label>
              <textarea
                id="edit-visual-prompt"
                className="custom-scrollbar"
                value={editVisualPrompt}
                onChange={e => setEditVisualPrompt(e.target.value)}
                disabled={isRegenerating}
                placeholder="Describe the cinematic scene to generate..."
                rows={6}
                style={{
                  width: '100%',
                  background: 'rgba(15,23,42,0.8)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(100,116,139,0.4)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.7)'}
                onBlur={e => e.target.style.borderColor = 'rgba(100,116,139,0.4)'}
              />
            </div>

            {/* Atomic Lyric Block Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Lyrics &amp; Subtitle Lines ({editBlocks.length} Block{editBlocks.length !== 1 ? 's' : ''})
                </label>
                <span style={{ color: '#475569', fontSize: '0.6875rem' }}>
                  Atomic timestamps
                </span>
              </div>

              <div
                className="custom-scrollbar"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {editBlocks.map((block, idx) => (
                  <div
                    key={block.id || idx}
                    style={{
                      background: 'rgba(15,23,42,0.8)',
                      border: '1px solid rgba(71,85,105,0.4)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        background: 'rgba(124,58,237,0.2)',
                        color: '#c4b5fd',
                        border: '1px solid rgba(139,92,246,0.3)',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                      }}>
                        [{formatTime(block.startTime)} - {formatTime(block.endTime)}] Block #{idx + 1}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={block.text}
                      onChange={e => handleUpdateBlockText(idx, e.target.value)}
                      disabled={isRegenerating || isSavingLyrics}
                      placeholder={`Line ${idx + 1} lyrics...`}
                      style={{
                        width: '100%',
                        background: 'rgba(30,41,59,0.7)',
                        border: '1px solid rgba(100,116,139,0.3)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#e2e8f0',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.7)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(100,116,139,0.3)'}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Chorus Propagation Checkbox */}
            <label
              htmlFor="edit-propagate-chorus"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: isRegenerating ? 'not-allowed' : 'pointer',
                padding: '12px 14px',
                background: editPropagateToChorus ? 'rgba(124,58,237,0.12)' : 'rgba(30,41,59,0.5)',
                border: `1px solid ${editPropagateToChorus ? 'rgba(139,92,246,0.5)' : 'rgba(51,65,85,0.6)'}`,
                borderRadius: '10px',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                id="edit-propagate-chorus"
                type="checkbox"
                checked={editPropagateToChorus}
                onChange={e => setEditPropagateToChorus(e.target.checked)}
                disabled={isRegenerating}
                style={{ display: 'none' }}
              />
              {/* Custom checkbox visual */}
              <div style={{
                flexShrink: 0,
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                background: editPropagateToChorus ? '#7c3aed' : 'transparent',
                border: `2px solid ${editPropagateToChorus ? '#7c3aed' : '#475569'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '1px',
                transition: 'all 0.15s ease',
              }}>
                {editPropagateToChorus && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div>
                <div style={{ color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 }}>
                  Apply to all repeated chorus scenes
                </div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px', lineHeight: 1.4 }}>
                  Re-links the new image &amp; prompt to every scene with matching lyrics — no duplicate generation.
                </div>
              </div>
            </label>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isRegenerating || isSavingLyrics}
                style={{
                  flex: '0 0 auto',
                  padding: '11px 20px',
                  background: 'rgba(51,65,85,0.6)',
                  border: '1px solid rgba(100,116,139,0.3)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: (isRegenerating || isSavingLyrics) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => { if (!isRegenerating && !isSavingLyrics) e.currentTarget.style.background = 'rgba(71,85,105,0.6)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.6)' }}
              >
                Cancel
              </button>

              {(() => {
                const currentFrame = frames[currentFrameIndex]
                const originalPrompt = (currentFrame?.visualPrompt || '').trim()
                const originalLyrics = (currentFrame?.lyrics || '').trim()
                const promptChanged = editVisualPrompt.trim() !== originalPrompt
                const lyricsChanged = editLyrics.trim() !== originalLyrics
                const isBusy = isRegenerating || isSavingLyrics

                let buttonLabel = '💾 Save Lyrics & Changes'
                let buttonIcon = <Save size={16} />

                if (isRegenerating) {
                  buttonLabel = `Generating${editPropagateToChorus ? ' & Syncing' : ''}...`
                  buttonIcon = <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                } else if (isSavingLyrics) {
                  buttonLabel = 'Saving Lyrics...'
                  buttonIcon = <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                } else if (promptChanged || editPropagateToChorus) {
                  buttonLabel = '✨ Re-generate Image & Save'
                  buttonIcon = <RefreshCw size={16} />
                } else {
                  buttonLabel = '💾 Save Lyrics & Changes'
                  buttonIcon = <Save size={16} />
                }

                return (
                  <button
                    id="edit-scene-submit-btn"
                    onClick={handleEditFrameSubmit}
                    disabled={isBusy || !editVisualPrompt.trim()}
                    style={{
                      flex: 1,
                      padding: '11px 20px',
                      background: (isBusy || !editVisualPrompt.trim()) ? '#4c1d95' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: (isBusy || !editVisualPrompt.trim()) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: (!editVisualPrompt.trim() && !isBusy) ? 0.6 : 1,
                      boxShadow: (!isBusy && editVisualPrompt.trim()) ? '0 4px 15px -3px rgba(124,58,237,0.5)' : 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { if (!isBusy && editVisualPrompt.trim()) e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    {buttonIcon}
                    {buttonLabel}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </CreatorPageShell>
  )
}
