import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, Play, Pause, Square, SkipBack, SkipForward, Maximize, Minimize, RefreshCw, Subtitles, X, Edit3, Sparkles, MessageSquare, Send, Zap, Save, Sun, Repeat, Pencil } from 'lucide-react'
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
      
      // Safely parse blocks if returned as a JSON string
      let segBlocks = []
      if (segment.blocks) {
        segBlocks = typeof segment.blocks === 'string' ? JSON.parse(segment.blocks) : segment.blocks
      }

      sortedFrames.forEach(frame => {
        let frameBlocks = []
        if (frame.blocks) {
          frameBlocks = typeof frame.blocks === 'string' ? JSON.parse(frame.blocks) : frame.blocks
        }

        allFrames.push({
          ...frame,
          startTime: segment.startTime,
          endTime: segment.endTime,
          lyrics: segment.lyrics,
          visualPrompt: segment.visualPrompt || frame.visualPrompt || '',
          blocks: segBlocks.length > 0 ? segBlocks : frameBlocks,
        })
      })
    }
  })
  return allFrames
}

export default function VideoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [jobData, setJobData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
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
    let active = true
    setLoading(true)
    setLoadError('')
    fetch(`${API_URL}/generation/${id}/status`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
      .then(async res => {
        const result = await res.json()
        if (!res.ok || !result.success || !result.data) {
          throw new Error(result.message || 'The requested generation job could not be loaded.')
        }
        return result
      })
      .then(result => {
        if (active) {
          setJobData(result.data)
          setFrames(extractFrames(result.data.song))
          setAudioUrl(result.data.song?.audioUrl || '')
          setTranscriptionSegments(result.data.song?.transcriptionSegments || [])
        }
      })
      .catch(error => {
        if (active) setLoadError(error.message || 'The requested generation job could not be loaded.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
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

    let initialBlocks = []

    // 1. Prefer explicit frame.blocks if present
    if (Array.isArray(currentFrame.blocks) && currentFrame.blocks.length > 0) {
      initialBlocks = currentFrame.blocks.map((b, i) => ({
        id: b.id || `block-${i}-${b.startTime}`,
        startTime: b.startTime ?? sceneStartTime,
        endTime: b.endTime ?? sceneEndTime,
        text: b.text || b.lyrics || '',
      }))
    } else {
      // 2. Fall back to transcriptionSegments using strict interior overlap (< and >)
      const matchingSegs = Array.isArray(transcriptionSegments) ? transcriptionSegments.filter(seg => {
        const start = seg.start ?? seg.startTime ?? 0
        const end = seg.end ?? seg.endTime ?? 0
        return start < sceneEndTime && end > sceneStartTime
      }) : []

      if (matchingSegs.length > 0) {
        initialBlocks = matchingSegs.map((seg, i) => ({
          id: seg.id || `seg-${i}-${seg.start ?? seg.startTime}`,
          startTime: seg.start ?? seg.startTime ?? sceneStartTime,
          endTime: seg.end ?? seg.endTime ?? sceneEndTime,
          text: seg.text || seg.lyrics || '',
        }))
      } else {
        // 3. Fallback: split frame lyrics by newline and subdivide scene time range
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
          blocks: editBlocks,
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
            const isTarget = matchId === editSceneInfo?.sceneId
            return {
              ...frame,
              imageUrl: update.imageUrl,
              visualPrompt: update.visualPrompt,
              lyrics: update.lyrics,
              blocks: isTarget ? editBlocks : (update.blocks || frame.blocks),
            }
          })
        )

        // Live-sync video subtitle captions overlay state with atomic block precision
        setTranscriptionSegments(prevSegments => {
          if (!prevSegments || prevSegments.length === 0) return prevSegments
          return prevSegments.map(seg => {
            const segStart = seg.start ?? seg.startTime ?? 0
            const segEnd = seg.end ?? seg.endTime ?? 0

            const matchingBlock = editBlocks.find(b =>
              (b.id && b.id === seg.id) ||
              (b.startTime === segStart && b.endTime === segEnd) ||
              (segStart < b.endTime && segEnd > b.startTime)
            )

            if (matchingBlock) {
              return { ...seg, text: matchingBlock.text, lyrics: matchingBlock.text }
            }
            return seg
          })
        })

        setHasEdits(true)
        setJobData(prev => (prev ? { ...prev, song: { ...prev.song, videoUrl: null } } : prev))
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
              return { ...frame, lyrics: updatedLyrics, blocks: editBlocks }
            })
          )

          // Live-sync video subtitle captions overlay state with atomic block precision
          setTranscriptionSegments(prevSegments => {
            if (!prevSegments || prevSegments.length === 0) return prevSegments
            return prevSegments.map(seg => {
              const segStart = seg.start ?? seg.startTime ?? 0
              const segEnd = seg.end ?? seg.endTime ?? 0

              const matchingBlock = editBlocks.find(b =>
                (b.id && b.id === seg.id) ||
                (b.startTime === segStart && b.endTime === segEnd) ||
                (segStart < b.endTime && segEnd > b.startTime)
              )

              if (matchingBlock) {
                return { ...seg, text: matchingBlock.text, lyrics: matchingBlock.text }
              }
              return seg
            })
          })

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
        
        const isActionable = patch.action !== 'CHAT_RESPONSE' && (Boolean(patch.newPrompt) || Boolean(patch.newLyrics))
        if (isActionable) {
          setPendingPatch(patch)
        } else {
          setPendingPatch(null)
        }

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
        setJobData(prev => (prev ? { ...prev, song: { ...prev.song, videoUrl: null } } : prev))
      }

      setCopilotLog(prev => [...prev, { role: 'assistant', text: `Applied to ${allUpdatedScenes.length} scene(s) successfully. Thumbnails updated.` }])
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
      const isPlaceholderVideo = Boolean(finalVideoUrl && (finalVideoUrl.includes('placeholder') || finalVideoUrl.includes('unsplash.com')));
      const activeFrameImage = frames[currentFrameIndex]?.imageUrl || frames[0]?.imageUrl || '';
      let updatedSong = jobData?.song ? { ...jobData.song, coverImageUrl: activeFrameImage } : { coverImageUrl: activeFrameImage };

      // Heavy Lane: Run export API if edits exist, no video is compiled yet, or if video is a placeholder
      if (hasEdits || !finalVideoUrl || isPlaceholderVideo) {
        const res = await fetch(`${API_URL}/generation/${id}/export`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          body: JSON.stringify({ burnCaptions: false }) 
        });
        const result = await res.json();
        if (result.success && result.videoUrl) {
          finalVideoUrl = result.videoUrl;
          if (updatedSong) {
            updatedSong = { ...updatedSong, videoUrl: result.videoUrl };
          }
          setJobData(prev => (prev ? { ...prev, song: updatedSong } : prev));
          setHasEdits(false);
        } else {
          alert('Failed to prepare clean video: ' + (result.message || 'Unknown error'));
          setIsPublishing(false);
          return;
        }
      }

      // Persist current active frame as song cover image
      if (activeFrameImage) {
        try {
          await fetch(`${API_URL}/songs/${songId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ coverImageUrl: activeFrameImage })
          });
        } catch (coverErr) {
          console.warn('[handlePublishToStudio] Failed updating cover image:', coverErr);
        }
      }

      // Fast Lane / Completion: Instantly navigate
      const rawLyrics = updatedSong?.rawLyrics || updatedSong?.sceneSegments?.map(s => s.lyrics).filter(Boolean).join('\n\n') || updatedSong?.lyrics;
      
      navigate(`/creator/studio/${encodeURIComponent(songId)}`, {
        state: { 
          videoUrl: finalVideoUrl,
          lyrics: rawLyrics,
          transcriptionSegments: updatedSong?.transcriptionSegments || [],
          coverImageUrl: activeFrameImage,
          jobId: id,
          originalSongId: songId,
          songData: updatedSong
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
      <CreatorPageShell breadcrumbs={['Video Editor']} className="ve-page" description="Loading workspace..." title="Editor">
        <div className="ve-loading-state">
          <Loader2 aria-hidden="true" className="ve-spinner" size={32} />
        </div>
      </CreatorPageShell>
    )
  }

  if (loadError || !jobData) {
    return (
      <CreatorPageShell breadcrumbs={['Generation Tasks', 'Video Editor']} className="ve-page" description="The requested workspace could not be opened." title="Video Editor">
        <section className="studio-card ve-error-card" role="alert">
          <h2 className="ve-error-title">Video Editor Unavailable</h2>
          <p className="ve-error-copy">{loadError || 'The requested generation job could not be loaded.'}</p>
          <button
            className="studio-button studio-button--secondary ve-error-btn"
            onClick={() => navigate('/creator/generation')}
            type="button"
          >
            Exit to Generation Jobs
          </button>
        </section>
      </CreatorPageShell>
    )
  }

  return (
    <CreatorPageShell
      breadcrumbs={['Generation Tasks', 'Video Editor']}
      className="ve-page"
      description="Refine your scenes, adjust timings, and export the final masterpiece."
      title="Timeline Editor"
    >
      <div className="ve-workspace">
        {/* ═══════ EDITOR SHELL — CSS Grid, 3 rows ═══════ */}
        <div className="ve-shell">
          {/* ═══════ ROW 1: Video Preview Canvas ═══════ */}
          <div
            className={`ve-canvas-row ${isFullscreen && !showControls ? 'is-idle' : ''}`}
            onClick={isFullscreen ? handleMouseMove : undefined}
            onMouseMove={isFullscreen ? handleMouseMove : undefined}
            ref={canvasRowRef}
          >
            {frames.length > 0 ? (
              <img
                alt={`Frame ${currentFrameIndex + 1}`}
                className="ve-preview-img"
                height={1024}
                src={frames[currentFrameIndex]?.imageUrl}
                width={1792}
              />
            ) : (
              <div className="ve-empty-canvas">
                <h3 className="ve-empty-title">Video Preview Canvas</h3>
                <p className="ve-empty-sub">Main viewer will mount here</p>
              </div>
            )}

            {/* Overlays Wrapper (fades out when inactive in fullscreen) */}
            <div className={`ve-overlays ${isFullscreen && !showControls ? 'is-hidden' : ''}`}>
              {/* Edit Scene Button — opens the advanced modal */}
              {frames.length > 0 && (
                <div className="ve-overlay-edit-wrap">
                  <button
                    className="ve-overlay-btn"
                    onClick={handleOpenEditModal}
                    title="Edit Scene / Regenerate Frame"
                    type="button"
                  >
                    <Edit3 aria-hidden="true" size={18} />
                    Edit Scene
                  </button>
                </div>
              )}

              {/* Fullscreen Button */}
              <button
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Maximize Video'}
                className="ve-fullscreen-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Maximize Video'}
                type="button"
              >
                {isFullscreen ? <Minimize aria-hidden="true" size={20} /> : <Maximize aria-hidden="true" size={20} />}
              </button>

              {/* Fullscreen Overlay Controls */}
              {isFullscreen && (
                <div className="ve-controls-bar ve-controls-bar--fullscreen">
                  <button aria-label="Previous Frame" className="ve-control-btn" onClick={handleSkipBack} title="Previous Frame" type="button">
                    <SkipBack aria-hidden="true" size={20} />
                  </button>
                  <button aria-label={isPlaying ? 'Pause' : 'Play'} className="ve-play-btn" onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'} type="button">
                    {isPlaying ? <Pause aria-hidden="true" size={24} /> : <Play aria-hidden="true" className="ve-play-icon-offset" size={24} />}
                  </button>
                  <button aria-label="Stop" className="ve-control-btn" onClick={handleStop} title="Stop" type="button">
                    <Square aria-hidden="true" size={20} />
                  </button>
                  <button aria-label="Next Frame" className="ve-control-btn" onClick={handleSkipForward} title="Next Frame" type="button">
                    <SkipForward aria-hidden="true" size={20} />
                  </button>
                  <button
                    aria-label={showCaptions ? 'Hide Captions' : 'Show Captions'}
                    className={`ve-control-btn ${showCaptions ? 'is-active' : ''}`}
                    onClick={() => setShowCaptions(!showCaptions)}
                    title={showCaptions ? 'Hide Captions' : 'Show Captions'}
                    type="button"
                  >
                    <Subtitles aria-hidden="true" size={20} />
                  </button>
                  <span className="ve-time-display ve-time-display--fullscreen">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <span className="ve-frame-display ve-frame-display--fullscreen">
                    Frame {currentFrameIndex + 1} / {frames.length}
                  </span>
                </div>
              )}
            </div>

            {/* Lyrics / Granular Whisper Captions Overlay */}
            {(() => {
              const currentFrame = frames[currentFrameIndex]
              let captionText = ''

              if (currentFrame?.blocks && currentFrame.blocks.length > 0) {
                // 1. Check frame's explicit atomic blocks
                const exactBlock = currentFrame.blocks.find(
                  (b) => currentTime >= b.startTime && currentTime <= b.endTime
                )
                if (exactBlock) {
                  captionText = exactBlock.text
                } else if (currentTime >= (currentFrame.startTime ?? 0) && currentTime <= (currentFrame.endTime ?? Infinity)) {
                  // Smooth gap handling within frame boundaries: retain active block across micro-gaps
                  const pastBlocks = currentFrame.blocks.filter((b) => currentTime >= b.startTime)
                  if (pastBlocks.length > 0) {
                    captionText = pastBlocks[pastBlocks.length - 1].text
                  } else {
                    captionText = currentFrame.blocks[0].text
                  }
                }
              } else {
                // 2. Check transcriptionSegments if frame has no explicit blocks
                const activeWhisperSeg =
                  Array.isArray(transcriptionSegments) &&
                  transcriptionSegments.find((seg) => {
                    const start = seg.start ?? seg.startTime ?? 0
                    const end = seg.end ?? seg.endTime ?? 0
                    const isMatchingTime = currentTime >= start && currentTime <= end
                    const text = seg.text || seg.lyrics || ''
                    // If text has newlines, it is a concatenated parent scene segment; ignore during atomic gaps
                    return isMatchingTime && !text.includes('\n')
                  })

                if (activeWhisperSeg) {
                  captionText = activeWhisperSeg.text || activeWhisperSeg.lyrics || ''
                } else {
                  // 3. Fallback: only show full frame lyrics if single line (no newlines)
                  const rawLyrics = currentFrame?.lyrics || ''
                  if (!rawLyrics.includes('\n')) {
                    captionText = rawLyrics
                  }
                }
              }

              return showCaptions && captionText ? (
                <div className={`ve-lyrics-overlay ${isFullscreen && showControls ? 'is-raised' : ''}`}>
                  <p className="ve-lyrics-text">{captionText}</p>
                </div>
              ) : null
            })()}
          </div>

          {/* ═══════ ROW 2: Playback Controls ═══════ */}
          {!isFullscreen && (
            <div className="ve-controls-bar">
              <button aria-label="Previous Frame" className="ve-control-btn" onClick={handleSkipBack} title="Previous Frame" type="button">
                <SkipBack aria-hidden="true" size={18} />
              </button>
              <button aria-label={isPlaying ? 'Pause' : 'Play'} className="ve-play-btn" onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'} type="button">
                {isPlaying ? <Pause aria-hidden="true" size={22} /> : <Play aria-hidden="true" className="ve-play-icon-offset" size={22} />}
              </button>
              <button aria-label="Stop" className="ve-control-btn" onClick={handleStop} title="Stop" type="button">
                <Square aria-hidden="true" size={18} />
              </button>
              <button aria-label="Next Frame" className="ve-control-btn" onClick={handleSkipForward} title="Next Frame" type="button">
                <SkipForward aria-hidden="true" size={18} />
              </button>
              <button
                aria-label={showCaptions ? 'Hide Captions' : 'Show Captions'}
                className={`ve-control-btn ${showCaptions ? 'is-active' : ''}`}
                onClick={() => setShowCaptions(!showCaptions)}
                title={showCaptions ? 'Hide Captions' : 'Show Captions'}
                type="button"
              >
                <Subtitles aria-hidden="true" size={18} />
              </button>
              <div className="ve-transport-readout">
                <span className="ve-time-display">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <span className="ve-frame-display">
                  Frame {currentFrameIndex + 1} / {frames.length}
                </span>
              </div>
            </div>
          )}

          {/* ═══════ ROW 3: Filmstrip + Waveform ═══════ */}
          <div className="ve-bottom-strip">
            {/* Filmstrip Header */}
            <div className="ve-section-header">
              <h4 className="ve-section-label">Filmstrip</h4>
              <span className="ve-scene-badge">{jobData?.song?.sceneSegments?.length || 0} Scenes</span>
            </div>

            {/* Horizontal Filmstrip — strict single row, horizontal scroll only */}
            <div
              className="custom-scrollbar ve-filmstrip"
              onTouchMove={handleManualScrollIntent}
              onWheel={handleManualScrollIntent}
              ref={filmstripRef}
            >
              {frames.map((frame, index) => {
                const sceneId = frame.sceneSegmentId || frame.id
                const isActive = index === currentFrameIndex
                const isHighlighted = Boolean(highlightedSceneIds[sceneId])

                return (
                  <button
                    aria-label={`Jump to Frame ${index + 1}`}
                    className={`ve-thumb ${isActive ? 'is-active' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
                    key={frame.id}
                    onClick={() => handleThumbnailClick(index)}
                    type="button"
                  >
                    <img
                      alt={`Frame ${index + 1}`}
                      height={80}
                      loading="lazy"
                      src={frame.imageUrl}
                      width={142}
                    />
                  </button>
                )
              })}
            </div>

            {/* Audio Waveform */}
            <div className="ve-waveform-section">
              <div className="ve-section-header ve-section-header--compact">
                <h4 className="ve-section-label">Audio Waveform</h4>
              </div>
              <div className="ve-waveform-container" ref={waveformRef} />
            </div>
          </div>
        </div>

        {/* ═══════ TOOLBAR ACTIONS (Top on Desktop via CSS order; Lower Zone on Portrait 9:16) ═══════ */}
        <div className="ve-toolbar-actions">
          <button
            className={`studio-button ve-copilot-toggle ${showCopilotDrawer ? 'is-open' : ''}`}
            id="copilot-toggle-btn"
            onClick={() => setShowCopilotDrawer(prev => !prev)}
            title="Shades Assistant (Shift+A)"
            type="button"
          >
            <Sparkles aria-hidden="true" size={16} />
            Shades Assistant
          </button>
          <button
            className="studio-button studio-button--secondary"
            disabled={isPublishing || isExporting}
            onClick={handlePublishToStudio}
            type="button"
          >
            {isPublishing ? 'Exporting Clean Video...' : 'Publish to Studio'}
          </button>
          <button
            className="studio-button studio-button--primary"
            disabled={isExporting || isPublishing}
            onClick={handleExport}
            type="button"
          >
            {isExporting ? 'Exporting...' : 'Export Final Video'}
          </button>
          <button
            className="studio-button studio-button--secondary"
            onClick={() => navigate(`/creator/generation/${id}`)}
            type="button"
          >
            Exit Editor
          </button>
        </div>
      </div>

      {/* ═══════ AI COPILOT DRAWER / BOTTOM SHEET ═══════ */}
      <aside aria-label="Shades Assistant" className={`ve-copilot-drawer ${showCopilotDrawer ? 'is-open' : ''}`}>
        {/* Header */}
        <div className="ve-copilot-header">
          <div className="ve-copilot-header__identity">
            <div className="ve-copilot-header__badge" aria-hidden="true">
              <Sparkles color="#fff" size={16} />
            </div>
            <div>
              <h3>Shades Assistant</h3>
              <p>Natural language scene editor</p>
            </div>
          </div>
          <button
            aria-label="Close Shades Assistant"
            className="ve-copilot-close"
            onClick={() => setShowCopilotDrawer(false)}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        {/* Quick Action Chips */}
        <div className="ve-copilot-chips">
          <p className="ve-copilot-chips__heading">Quick Actions</p>
          {[
            { Icon: Sun, cmd: 'Make the active scene warmer with golden sunset lighting', label: 'Warmer lighting' },
            { Icon: Repeat, cmd: 'Propagate the active scene prompt to all repeated chorus scenes', label: 'Propagate chorus' },
            { Icon: Pencil, cmd: 'Fix any typos in the lyrics of the active scene', label: 'Fix active typo' },
          ].map(({ Icon, cmd, label }) => (
            <button
              className="ve-copilot-chip"
              key={label}
              onClick={() => setCopilotInput(cmd)}
              type="button"
            >
              <Icon aria-hidden="true" size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Command/Response Log */}
        <div className="custom-scrollbar ve-copilot-log" ref={copilotLogRef}>
          {copilotLog.length === 0 && (
            <div className="ve-copilot-empty">
              <MessageSquare aria-hidden="true" size={32} />
              <p>Ask Shades Assistant to modify scenes.<br /><span>e.g. &ldquo;Make Scene 3 a rainy street at night&rdquo;</span></p>
            </div>
          )}
          {copilotLog.map((entry, i) => (
            <div className={`ve-copilot-msg ${entry.role === 'user' ? 'is-user' : 'is-assistant'}`} key={i}>
              <div className="ve-copilot-bubble">
                {entry.role === 'assistant' && (
                  <div className="ve-copilot-bubble__meta">
                    <Sparkles aria-hidden="true" size={12} />
                    <span>Shades</span>
                    {entry.patch && entry.patch.action !== 'CHAT_RESPONSE' && (
                      <span className="ve-copilot-action-tag">
                        {entry.patch.action?.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                )}
                {entry.text}
              </div>
              {entry.role === 'assistant' && entry.patch && entry.patch.action !== 'CHAT_RESPONSE' && (entry.patch.newPrompt || entry.patch.newLyrics) && pendingPatch === entry.patch && (
                <div className="ve-copilot-patch">
                  <div className="ve-copilot-patch__summary">
                    <Zap aria-hidden="true" size={14} />
                    <strong>{entry.patch.targetSceneSegmentIds?.length || 0} scene(s)</strong>
                    <span>will be updated</span>
                  </div>
                  {entry.patch.newPrompt && (
                    <div className="custom-scrollbar ve-copilot-patch__prompt">
                      {entry.patch.newPrompt}
                    </div>
                  )}
                  <div className="ve-copilot-patch__actions">
                    <button
                      className="ve-copilot-apply"
                      disabled={isApplyingPatch}
                      id="copilot-apply-btn"
                      onClick={handleApplyPatch}
                      type="button"
                    >
                      {isApplyingPatch ? (
                        <>
                          <Loader2 aria-hidden="true" className="ve-spinner" size={16} /> Applying...
                        </>
                      ) : (
                        <>
                          <Zap aria-hidden="true" size={16} /> 1-Click Apply AI Edits
                        </>
                      )}
                    </button>
                    <button
                      className="ve-copilot-dismiss"
                      disabled={isApplyingPatch}
                      onClick={handleClearPatch}
                      type="button"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {copilotLoading && (
            <div className="ve-copilot-thinking">
              <Loader2 aria-hidden="true" className="ve-spinner" size={16} />
              Shades is thinking...
            </div>
          )}
        </div>

        {/* Pinned Input Row */}
        <div className="ve-copilot-input-bar">
          <div className="ve-copilot-input-row">
            <input
              disabled={copilotLoading}
              id="copilot-command-input"
              onChange={e => setCopilotInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendCopilotCommand() } }}
              placeholder="Tell the AI what to change..."
              type="text"
              value={copilotInput}
            />
            <button
              aria-label="Send command"
              className="ve-copilot-send"
              disabled={copilotLoading || !copilotInput.trim()}
              id="copilot-send-btn"
              onClick={handleSendCopilotCommand}
              type="button"
            >
              {copilotLoading ? <Loader2 aria-hidden="true" className="ve-spinner" size={18} /> : <Send aria-hidden="true" size={18} />}
            </button>
          </div>
          <p className="ve-copilot-hint">Enter to send · Shift+A to toggle · Previewed before applying</p>
        </div>
      </aside>

      {/* ═══════ EDIT SCENE / FRAME MODAL ═══════ */}
      {showEditModal && (
        <div
          className="ve-edit-modal-backdrop"
          id="edit-scene-modal-backdrop"
          onClick={e => { if (e.target.id === 'edit-scene-modal-backdrop') setShowEditModal(false) }}
        >
          <div aria-labelledby="ve-edit-modal-title" aria-modal="true" className="custom-scrollbar ve-edit-modal" role="dialog">
            {/* Modal Header */}
            <div className="ve-edit-modal__header">
              <div>
                <h2 id="ve-edit-modal-title">
                  Edit Scene {editSceneInfo?.sceneNumber}
                </h2>
                <p className="ve-edit-modal__time">
                  {editSceneInfo ? `${formatTime(editSceneInfo.startTime)} → ${formatTime(editSceneInfo.endTime)}` : ''}
                </p>
              </div>
              <div className="ve-edit-modal__header-actions">
                <button
                  className="ve-force-regen-btn"
                  disabled={isRegenerating || isSavingLyrics || !editVisualPrompt.trim()}
                  onClick={() => handleEditFrameAdvanced(true)}
                  title="Force new GPT Image generation"
                  type="button"
                >
                  {isRegenerating ? <Loader2 aria-hidden="true" className="ve-spinner" size={14} /> : <RefreshCw aria-hidden="true" size={14} />}
                  Force New Image
                </button>
                <button
                  aria-label="Close edit modal"
                  className="ve-edit-modal__close"
                  disabled={isRegenerating || isSavingLyrics}
                  onClick={() => setShowEditModal(false)}
                  type="button"
                >
                  <X aria-hidden="true" size={20} />
                </button>
              </div>
            </div>

            <div className="ve-edit-modal__divider" />

            {/* Visual Prompt */}
            <div className="ve-edit-field">
              <label className="ve-edit-field__label" htmlFor="edit-visual-prompt">
                Visual Prompt
              </label>
              <textarea
                className="custom-scrollbar ve-edit-textarea"
                disabled={isRegenerating}
                id="edit-visual-prompt"
                onChange={e => setEditVisualPrompt(e.target.value)}
                placeholder="Describe the cinematic scene to generate..."
                rows={6}
                value={editVisualPrompt}
              />
            </div>

            {/* Atomic Lyric Block Cards */}
            <div className="ve-edit-field">
              <div className="ve-edit-blocks-header">
                <label className="ve-edit-field__label">
                  Lyrics &amp; Subtitle Lines ({editBlocks.length} Block{editBlocks.length !== 1 ? 's' : ''})
                </label>
                <span className="ve-edit-blocks-meta">Atomic timestamps</span>
              </div>

              <div className="custom-scrollbar ve-edit-blocks-list">
                {editBlocks.map((block, idx) => (
                  <div className="ve-edit-block-card" key={block.id || idx}>
                    <div className="ve-edit-block-card__head">
                      <span className="ve-edit-block-card__badge">
                        [{formatTime(block.startTime)} - {formatTime(block.endTime)}] Block #{idx + 1}
                      </span>
                    </div>
                    <input
                      className="ve-edit-block-card__input"
                      disabled={isRegenerating || isSavingLyrics}
                      onChange={e => handleUpdateBlockText(idx, e.target.value)}
                      placeholder={`Line ${idx + 1} lyrics...`}
                      type="text"
                      value={block.text}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Chorus Propagation Checkbox */}
            <label
              className={`ve-chorus-toggle ${editPropagateToChorus ? 'is-checked' : ''} ${isRegenerating ? 'is-disabled' : ''}`}
              htmlFor="edit-propagate-chorus"
            >
              <input
                checked={editPropagateToChorus}
                className="ve-chorus-toggle__input"
                disabled={isRegenerating}
                id="edit-propagate-chorus"
                onChange={e => setEditPropagateToChorus(e.target.checked)}
                type="checkbox"
              />
              <div>
                <div className="ve-chorus-toggle__title">Apply to all repeated chorus scenes</div>
                <div className="ve-chorus-toggle__sub">
                  Re-links the new image &amp; prompt to every scene with matching lyrics — no duplicate generation.
                </div>
              </div>
            </label>

            {/* Action Buttons */}
            <div className="ve-edit-modal__actions">
              <button
                className="studio-button studio-button--secondary ve-edit-cancel"
                disabled={isRegenerating || isSavingLyrics}
                onClick={() => setShowEditModal(false)}
                type="button"
              >
                Cancel
              </button>

              {(() => {
                const currentFrame = frames[currentFrameIndex]
                const originalPrompt = (currentFrame?.visualPrompt || '').trim()
                const promptChanged = editVisualPrompt.trim() !== originalPrompt
                const isBusy = isRegenerating || isSavingLyrics

                let buttonLabel = 'Save Lyrics & Changes'
                let buttonIcon = <Save aria-hidden="true" size={16} />

                if (isRegenerating) {
                  buttonLabel = `Generating${editPropagateToChorus ? ' & Syncing' : ''}...`
                  buttonIcon = <Loader2 aria-hidden="true" className="ve-spinner" size={16} />
                } else if (isSavingLyrics) {
                  buttonLabel = 'Saving Lyrics...'
                  buttonIcon = <Loader2 aria-hidden="true" className="ve-spinner" size={16} />
                } else if (promptChanged || editPropagateToChorus) {
                  buttonLabel = 'Re-generate Image & Save'
                  buttonIcon = <RefreshCw aria-hidden="true" size={16} />
                }

                return (
                  <button
                    className="studio-button studio-button--primary ve-edit-submit"
                    disabled={isBusy || !editVisualPrompt.trim()}
                    id="edit-scene-submit-btn"
                    onClick={handleEditFrameSubmit}
                    type="button"
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
