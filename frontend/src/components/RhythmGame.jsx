import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Maximize2, Pause, Play, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DIFFICULTIES, loadBeatmap } from '../game/beatmapLoader'
import { createResult, storeResult } from '../game/results'
import { fetchSongDetails } from '../game/songDetailsApi'
import { useAuth } from '../context/AuthContext'
import { publishBeatmap, saveBeatmapSettings } from '../services/beatmapService'
import { applyJudgement, calculateWeightedAccuracy, completeHold, createStats } from '../utils/rhythmScoring'
import { getNoteProgress, getSongTimeMs, getTimingJudgement, isMissed, JUDGEMENT_WINDOWS } from '../utils/rhythmTiming'

const LANES = [
  { key: 'd', label: 'D', color: '#ff4d8d' },
  { key: 'f', label: 'F', color: '#f59e0b' },
  { key: 'j', label: 'J', color: '#a855f7' },
  { key: 'k', label: 'K', color: '#38bdf8' },
]
const HIT_LINE_RATIO = 0.84
const BACKGROUND_MODE_KEY = 'rhythmBackgroundMode'

function resizeCanvas(canvas) {
  const parent = canvas.parentElement
  const width = parent.clientWidth
  const height = parent.clientHeight
  const scale = window.devicePixelRatio || 1
  canvas.width = Math.floor(width * scale)
  canvas.height = Math.floor(height * scale)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const context = canvas.getContext('2d')
  context.setTransform(scale, 0, 0, scale, 0, 0)
  return { context, height, width }
}

function drawGame(canvas, notes, songTimeMs, difficulty, pressedLanes, noteSpeed = 1) {
  if (!canvas) return
  const { context, height, width } = resizeCanvas(canvas)
  const laneWidth = width / 4
  const hitLineY = height * HIT_LINE_RATIO
  context.clearRect(0, 0, width, height)
  context.fillStyle = 'rgba(5, 4, 18, 0.8)'
  context.fillRect(0, 0, width, height)

  LANES.forEach((lane, index) => {
    const x = index * laneWidth
    context.fillStyle = pressedLanes.has(index) ? `${lane.color}2c` : index % 2 ? 'rgba(20,12,35,.48)' : 'rgba(7,8,24,.48)'
    context.fillRect(x, 0, laneWidth, height)
    context.strokeStyle = 'rgba(255,255,255,.14)'
    context.strokeRect(x, 0, laneWidth, height)
    context.fillStyle = pressedLanes.has(index) ? lane.color : 'rgba(255,255,255,.14)'
    context.shadowBlur = pressedLanes.has(index) ? 22 : 0
    context.shadowColor = lane.color
    context.fillRect(x + 9, hitLineY - 8, laneWidth - 18, 58)
    context.shadowBlur = 0
    context.fillStyle = '#fff'
    context.font = '900 24px Inter, sans-serif'
    context.textAlign = 'center'
    context.fillText(lane.label, x + laneWidth / 2, hitLineY + 29)
  })

  for (const note of notes) {
    if (!['pending', 'holding'].includes(note.status)) continue
    const progress = getNoteProgress(note.startMs, songTimeMs, difficulty, noteSpeed)
    if (progress < -0.1 || progress > 1.22) continue
    const lane = LANES[note.lane]
    const x = note.lane * laneWidth + laneWidth * 0.1
    const noteWidth = laneWidth * 0.8
    const headY = progress * hitLineY
    if (note.type === 'hold') {
      const tailProgress = getNoteProgress(note.endMs, songTimeMs, difficulty, noteSpeed)
      const tailY = tailProgress * hitLineY
      const top = Math.min(headY, tailY)
      const bodyHeight = Math.max(16, Math.abs(headY - tailY))
      context.fillStyle = `${lane.color}72`
      context.fillRect(x + noteWidth * 0.22, top, noteWidth * 0.56, bodyHeight)
      context.strokeStyle = `${lane.color}dd`
      context.lineWidth = 2
      context.strokeRect(x + noteWidth * 0.22, top, noteWidth * 0.56, bodyHeight)
      context.fillStyle = lane.color
      context.fillRect(x, tailY - 7, noteWidth, 14)
    }
    const gradient = context.createLinearGradient(x, headY, x + noteWidth, headY)
    gradient.addColorStop(0, '#fff')
    gradient.addColorStop(0.2, lane.color)
    gradient.addColorStop(1, lane.color)
    context.fillStyle = gradient
    context.shadowBlur = note.status === 'holding' ? 30 : 18
    context.shadowColor = lane.color
    context.fillRect(x, headY - 11, noteWidth, 22)
    context.shadowBlur = 0
  }
}

export default function RhythmGame() {
  const { songId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { token, user } = useAuth()
  const preview = searchParams.get('preview') === '1' && user?.role === 'CREATOR' && Boolean(token)
  const requestedDifficulty = String(searchParams.get('difficulty') || '').toLowerCase()
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const animationRef = useRef(null)
  const timersRef = useRef([])
  const notesRef = useRef([])
  const statsRef = useRef(createStats())
  const songTimeRef = useRef(0)
  const pressedKeysRef = useRef(new Set())
  const activeHoldsRef = useRef(new Map())
  const finishedRef = useRef(false)
  const judgementTimerRef = useRef(null)
  const seekingRef = useRef(false)
  const [song, setSong] = useState(null)
  const [beatmap, setBeatmap] = useState(null)
  const [difficulty, setDifficulty] = useState(() => DIFFICULTIES.includes(requestedDifficulty) ? requestedDifficulty : 'medium')
  const [loadingState, setLoadingState] = useState('loading')
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('ready')
  const [countdown, setCountdown] = useState(null)
  const [stats, setStats] = useState(createStats())
  const [songTimeMs, setSongTimeMs] = useState(0)
  const [judgement, setJudgement] = useState('READY')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [noteSpeed, setNoteSpeed] = useState(() => Number(localStorage.getItem('rhythmNoteSpeed') || 1))
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('rhythmVolume') || 0.8))
  const [backgroundMode, setBackgroundMode] = useState(() => localStorage.getItem(BACKGROUND_MODE_KEY) === 'purple' ? 'purple' : 'video')
  const [previewOffsetMs, setPreviewOffsetMs] = useState(0)
  const [savedPreviewOffsetMs, setSavedPreviewOffsetMs] = useState(0)
  const [previewMessage, setPreviewMessage] = useState('')
  const [previewBusy, setPreviewBusy] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = canvas?.parentElement
    if (!canvas || !stage) return undefined

    const redraw = () => {
      const pressedLanes = new Set([...pressedKeysRef.current].map((key) => (
        typeof key === 'number' ? key : LANES.findIndex((lane) => lane.key === key)
      )))
      drawGame(canvas, notesRef.current, songTimeRef.current, difficulty, pressedLanes, noteSpeed)
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(redraw)

    observer?.observe(stage)
    window.addEventListener('resize', redraw)
    document.addEventListener('fullscreenchange', redraw)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', redraw)
      document.removeEventListener('fullscreenchange', redraw)
    }
  }, [difficulty, noteSpeed])

  const totalNotes = beatmap?.notes.length || 0
  const accuracy = calculateWeightedAccuracy(stats.earnedAccuracyPoints, stats.maximumAccuracyPoints)
  const progress = Math.min(100, (songTimeMs / Math.max(beatmap?.durationMs || 1, 1)) * 100)
  const showVideoBackground = backgroundMode === 'video' && Boolean(song?.videoUrl)

  const syncStats = useCallback((next) => { statsRef.current = next; setStats(next) }, [])
  const showJudgement = useCallback((label) => {
    clearTimeout(judgementTimerRef.current)
    setJudgement(label)
    judgementTimerRef.current = window.setTimeout(() => setJudgement(''), 650)
  }, [])

  const resetRun = useCallback((sourceBeatmap) => {
    cancelAnimationFrame(animationRef.current)
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    audioRef.current?.pause()
    videoRef.current?.pause()
    if (audioRef.current) {
      seekingRef.current = true
      audioRef.current.currentTime = 0
      window.setTimeout(() => { seekingRef.current = false }, 0)
    }
    if (videoRef.current) videoRef.current.currentTime = 0
    const freshNotes = (sourceBeatmap?.notes || []).map((note) => ({ ...note, status: 'pending' }))
    notesRef.current = freshNotes
    pressedKeysRef.current.clear()
    activeHoldsRef.current.clear()
    finishedRef.current = false
    songTimeRef.current = 0
    syncStats(createStats(freshNotes.length))
    setSongTimeMs(0)
    setCountdown(null)
    setJudgement('READY')
    setPhase('ready')
    drawGame(canvasRef.current, freshNotes, 0, difficulty, pressedKeysRef.current, noteSpeed)
  }, [difficulty, noteSpeed, syncStats])

  useEffect(() => {
    const controller = new AbortController()
    fetchSongDetails(songId, { preview, signal: controller.signal, token }).then(async (details) => [details, await loadBeatmap(details, difficulty, { preview, signal: controller.signal, token })])
      .then(([details, nextBeatmap]) => {
        if (controller.signal.aborted) return
        setSong(details)
        setBeatmap(nextBeatmap)
        setPreviewOffsetMs(nextBeatmap.offsetMs || 0)
        setSavedPreviewOffsetMs(nextBeatmap.offsetMs || 0)
        setError('')
        resetRun(nextBeatmap)
        setLoadingState('ready')
      })
      .catch((nextError) => {
        if (!controller.signal.aborted && nextError.name !== 'AbortError') { setBeatmap(null); setError(nextError.message); setLoadingState('error'); resetRun(null) }
      })
    return () => controller.abort()
  }, [difficulty, preview, resetRun, songId, token])

  const finishGame = useCallback(() => {
    if (finishedRef.current || !totalNotes || statsRef.current.processed < 1) return
    finishedRef.current = true
    cancelAnimationFrame(animationRef.current)
    audioRef.current?.pause()
    videoRef.current?.pause()
    const finalStats = statsRef.current
    const finalAccuracy = calculateWeightedAccuracy(finalStats.earnedAccuracyPoints, finalStats.maximumAccuracyPoints)
    const result = createResult({
      accuracy: finalAccuracy, difficulty, score: finalStats.score, maxCombo: finalStats.maxCombo,
      perfectHits: finalStats.judgements.PERFECT, greatHits: finalStats.judgements.GREAT,
      goodHits: finalStats.judgements.GOOD, badHits: finalStats.judgements.BAD,
      misses: finalStats.judgements.MISS, holdCompletions: finalStats.holdCompletions,
      earlyReleases: finalStats.earlyReleases, processedNotes: finalStats.processed, preview, songId, totalNotes,
    })
    if (!preview) storeResult(result)
    setPhase('finished')
    navigate(`/game/${songId}/results`, { replace: true, state: { result } })
  }, [difficulty, navigate, preview, songId, totalNotes])

  const finishAtAudioEnd = useCallback(() => {
    notesRef.current = notesRef.current.map((note) => {
      if (note.status === 'pending') {
        statsRef.current = applyJudgement(statsRef.current, 'MISS')
        return { ...note, status: 'missed' }
      } else if (note.status === 'holding') {
        const hold = activeHoldsRef.current.get(note.lane)
        statsRef.current = completeHold(statsRef.current, { startJudgement: hold?.startJudgement || 'MISS', releaseJudgement: 'MISS', sustainedRatio: 1 })
        return { ...note, status: 'missed' }
      }
      return note
    })
    setStats(statsRef.current)
    finishGame()
  }, [finishGame])

  const updateNote = useCallback((id, update) => {
    notesRef.current = notesRef.current.map((note) => note.id === id ? { ...note, ...update } : note)
  }, [])

  const releaseLane = useCallback((laneIndex) => {
    pressedKeysRef.current.delete(laneIndex)
    const hold = activeHoldsRef.current.get(laneIndex)
    if (!hold || phase !== 'playing') return
    const note = notesRef.current.find((item) => item.id === hold.id)
    if (!note) return
    const releaseError = songTimeRef.current - note.endMs
    const early = releaseError < -JUDGEMENT_WINDOWS.BAD
    const releaseJudgement = early ? 'MISS' : getTimingJudgement(releaseError)
    const sustainedRatio = (songTimeRef.current - note.startMs) / note.durationMs
    const next = completeHold(statsRef.current, { startJudgement: hold.startJudgement, releaseJudgement, sustainedRatio })
    syncStats(next)
    activeHoldsRef.current.delete(laneIndex)
    updateNote(note.id, { status: releaseJudgement === 'MISS' || sustainedRatio < 0.85 ? 'missed' : 'hit' })
    showJudgement(early ? 'EARLY RELEASE' : `${releaseJudgement} HOLD`)
  }, [phase, showJudgement, syncStats, updateNote])

  const pressLane = useCallback((laneIndex) => {
    if (phase !== 'playing' || pressedKeysRef.current.has(laneIndex)) return
    pressedKeysRef.current.add(laneIndex)
    if (activeHoldsRef.current.has(laneIndex)) return
    const candidate = notesRef.current
      .filter((note) => note.status === 'pending' && note.lane === laneIndex)
      .map((note) => ({ note, error: songTimeRef.current - note.startMs }))
      .filter(({ error: timingError }) => Math.abs(timingError) <= JUDGEMENT_WINDOWS.BAD)
      .sort((a, b) => Math.abs(a.error) - Math.abs(b.error))[0]
    if (!candidate) return
    const result = getTimingJudgement(candidate.error)
    if (candidate.note.type === 'hold') {
      activeHoldsRef.current.set(laneIndex, { id: candidate.note.id, startJudgement: result })
      updateNote(candidate.note.id, { status: 'holding' })
      showJudgement(`${result} HOLD`)
    } else {
      const next = applyJudgement(statsRef.current, result)
      syncStats(next)
      updateNote(candidate.note.id, { status: 'hit' })
      showJudgement(result)
    }
  }, [phase, showJudgement, syncStats, updateNote])

  useEffect(() => {
    if (phase !== 'playing') return undefined
    function tick() {
      if (!audioRef.current) return
      const effectiveOffset = preview ? previewOffsetMs : (beatmap?.offsetMs || 0)
      const now = getSongTimeMs(audioRef.current.currentTime, effectiveOffset, 0)
      songTimeRef.current = now
      let changed = false
      for (const note of notesRef.current) {
        if (note.status === 'pending' && isMissed(note.startMs, now)) {
          updateNote(note.id, { status: 'missed' })
          syncStats(applyJudgement(statsRef.current, 'MISS'))
          showJudgement('MISS')
          changed = true
        } else if (note.status === 'holding' && now - note.endMs > JUDGEMENT_WINDOWS.BAD) {
          const hold = activeHoldsRef.current.get(note.lane)
          const next = completeHold(statsRef.current, { startJudgement: hold?.startJudgement || 'MISS', releaseJudgement: 'MISS', sustainedRatio: 1 })
          syncStats(next)
          activeHoldsRef.current.delete(note.lane)
          updateNote(note.id, { status: 'missed' })
          showJudgement('MISS HOLD')
          changed = true
        }
      }
      if (changed) setSongTimeMs(now)
      else setSongTimeMs(now)
      drawGame(canvasRef.current, notesRef.current, now, difficulty, new Set([...pressedKeysRef.current].map((key) => typeof key === 'number' ? key : LANES.findIndex((lane) => lane.key === key))), noteSpeed)
      if (videoRef.current && Math.abs(videoRef.current.currentTime - audioRef.current.currentTime) > 0.2) {
        videoRef.current.currentTime = audioRef.current.currentTime
      }
      animationRef.current = requestAnimationFrame(tick)
    }
    animationRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationRef.current)
  }, [beatmap?.offsetMs, difficulty, finishGame, noteSpeed, phase, preview, previewOffsetMs, showJudgement, syncStats, updateNote])

  const pauseGame = useCallback(() => {
    if (phase !== 'playing') return
    audioRef.current?.pause()
    videoRef.current?.pause()
    cancelAnimationFrame(animationRef.current)
    pressedKeysRef.current.clear()
    setPhase('paused')
  }, [phase])

  const resumeGame = useCallback(async () => {
    if (phase !== 'paused' || !audioRef.current) return
    await audioRef.current.play()
    if (videoRef.current) { videoRef.current.currentTime = audioRef.current.currentTime; videoRef.current.play().catch(() => {}) }
    setPhase('playing')
  }, [phase])

  const startPlayback = useCallback(async () => {
    if (!audioRef.current) { setError('This song has no playable audio source.'); return }
    audioRef.current.currentTime = 0
    if (videoRef.current) videoRef.current.currentTime = 0
    try {
      await audioRef.current.play()
      videoRef.current?.play().catch(() => {})
      setPhase('playing')
    } catch { setError('Playback was blocked. Press Start again to allow audio.'); setPhase('ready') }
  }, [])

  const startCountdown = useCallback(async () => {
    if (loadingState !== 'ready' || !beatmap) return
    if (!audioRef.current) { setError('This song has no playable audio source.'); return }
    try {
      audioRef.current.muted = true
      await audioRef.current.play()
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    } catch {
      setError('Playback was blocked. Press Start again to allow audio.')
      return
    } finally {
      if (audioRef.current) audioRef.current.muted = false
    }
    resetRun(beatmap)
    setPhase('countdown')
    const values = ['3', '2', '1', 'Go']
    setCountdown(values[0])
    values.slice(1).forEach((value, index) => timersRef.current.push(window.setTimeout(() => setCountdown(value), (index + 1) * 700)))
    timersRef.current.push(window.setTimeout(() => { setCountdown(null); startPlayback() }, values.length * 700))
  }, [beatmap, loadingState, resetRun, startPlayback])

  const requestRestart = useCallback(() => {
    if (phase === 'playing' && !window.confirm('Restart this run? Your current score will be lost.')) return
    resetRun(beatmap)
  }, [beatmap, phase, resetRun])

  const requestExit = useCallback(() => {
    if (phase === 'playing' && !window.confirm('Exit this run? Your current score will be lost.')) return
    navigate(preview ? `/creator/studio/${songId}` : '/rhythm-game')
  }, [navigate, phase, preview, songId])

  useEffect(() => {
    function keyDown(event) {
      const key = event.key.toLowerCase()
      const laneIndex = LANES.findIndex((lane) => lane.key === key)
      if (laneIndex >= 0) { event.preventDefault(); if (!event.repeat) pressLane(laneIndex); return }
      if (event.code === 'Space' || event.key === 'Escape') { event.preventDefault(); if (!event.repeat) phase === 'playing' ? pauseGame() : resumeGame(); return }
      if (key === 'r' && !event.repeat && (phase === 'paused' || phase === 'playing')) { event.preventDefault(); requestRestart() }
    }
    function keyUp(event) { const laneIndex = LANES.findIndex((lane) => lane.key === event.key.toLowerCase()); if (laneIndex >= 0) { event.preventDefault(); releaseLane(laneIndex) } }
    function blur() { if (phase === 'playing') pauseGame(); pressedKeysRef.current.clear() }
    function visibilityChange() { if (document.hidden && phase === 'playing') pauseGame() }
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', blur)
    document.addEventListener('visibilitychange', visibilityChange)
    return () => { window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibilityChange) }
  }, [pauseGame, phase, pressLane, releaseLane, requestRestart, resumeGame])

  useEffect(() => () => { cancelAnimationFrame(animationRef.current); timersRef.current.forEach(clearTimeout); clearTimeout(judgementTimerRef.current) }, [])

  const details = useMemo(() => `${beatmap?.generationSource || '—'} map · ${totalNotes} notes · D F J K`, [beatmap, totalNotes])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volume))
  }, [song, volume])

  useEffect(() => {
    const video = videoRef.current
    const audio = audioRef.current
    if (!showVideoBackground || !video || !audio) return
    video.currentTime = audio.currentTime
    if (phase === 'playing') video.play().catch(() => {})
  }, [phase, showVideoBackground])

  const selectBackground = useCallback((mode) => {
    setBackgroundMode(mode)
    localStorage.setItem(BACKGROUND_MODE_KEY, mode)
  }, [])

  const protectPlaybackPosition = useCallback(() => {
    const audio = audioRef.current
    if (!audio || phase !== 'playing' || seekingRef.current) return
    const effectiveOffset = preview ? previewOffsetMs : (beatmap?.offsetMs || 0)
    const expectedSeconds = Math.max(0, (songTimeRef.current - effectiveOffset) / 1000)
    if (Math.abs(audio.currentTime - expectedSeconds) <= 0.25) return
    seekingRef.current = true
    audio.currentTime = expectedSeconds
    window.setTimeout(() => { seekingRef.current = false }, 0)
  }, [beatmap?.offsetMs, phase, preview, previewOffsetMs])

  const savePreviewOffset = useCallback(async () => {
    if (!preview || beatmap?.status !== 'DRAFT') return
    setPreviewBusy(true); setPreviewMessage('')
    try { await saveBeatmapSettings(songId, difficulty, previewOffsetMs, token); setSavedPreviewOffsetMs(previewOffsetMs); setPreviewMessage('Draft timing saved.') }
    catch (nextError) { setPreviewMessage(nextError.message) }
    finally { setPreviewBusy(false) }
  }, [beatmap?.status, difficulty, preview, previewOffsetMs, songId, token])

  const publishPreview = useCallback(async () => {
    if (!preview || beatmap?.status !== 'DRAFT') return
    setPreviewBusy(true); setPreviewMessage('')
    try { if (previewOffsetMs !== savedPreviewOffsetMs) await saveBeatmapSettings(songId, difficulty, previewOffsetMs, token); await publishBeatmap(songId, difficulty, token); setBeatmap((current) => ({ ...current, status: 'PUBLISHED', offsetMs: previewOffsetMs })); setPreviewMessage('Beatmap published.') }
    catch (nextError) { setPreviewMessage(nextError.message) }
    finally { setPreviewBusy(false) }
  }, [beatmap?.status, difficulty, preview, previewOffsetMs, savedPreviewOffsetMs, songId, token])

  return (
    <main className={`rhythm-page ${showVideoBackground ? 'has-video-background' : 'video-fallback'}`}>
      {showVideoBackground && <video aria-hidden="true" className="rhythm-background-video" loop muted playsInline ref={videoRef} src={song.videoUrl} />}
      {song?.audioUrl && <audio onEnded={finishAtAudioEnd} onSeeking={protectPlaybackPosition} preload="auto" ref={audioRef} src={song.audioUrl} />}
      <div className="rhythm-video-overlay" />
      <section className="rhythm-shell">
        <nav className="game-top-icons" aria-label="Gameplay navigation">
          <button aria-label={preview ? 'Back to Studio' : 'Exit to rhythm song selection'} data-tooltip={preview ? 'Back to Studio' : 'Exit game'} onClick={requestExit} title={preview ? 'Back to Studio' : 'Exit game'} type="button"><ArrowLeft aria-hidden="true" /><span>{preview ? 'Studio' : 'Exit'}</span></button>
          <button aria-label="Enter fullscreen" data-tooltip="Fullscreen" onClick={() => document.documentElement.requestFullscreen?.()} title="Fullscreen" type="button"><Maximize2 aria-hidden="true" /><span>Fullscreen</span></button>
        </nav>
        <div className="game-layout">
          <aside className="side-panel stats-panel" aria-label="Game stats">
            <p className="panel-kicker">Live performance</p>
            <div><span>Accuracy</span><strong>{accuracy.toFixed(2)}%</strong></div>
            <div><span>Combo</span><strong>{stats.combo}<small>x</small></strong></div>
            <div><span>Score</span><strong>{stats.score.toLocaleString()}</strong></div>
            <div className="mini-stat"><span>Max combo</span><b>{stats.maxCombo}</b></div>
            <div className="mini-stat"><span>Misses</span><b>{stats.judgements.MISS}</b></div>
            <p className="current-summary">{judgement || 'Keep the rhythm'}</p>
          </aside>
          <div className="board-column">
            <section className="canvas-stage" aria-label="Four rhythm lanes">
              <canvas aria-label="Falling tap and hold notes" ref={canvasRef} />
              {judgement && phase === 'playing' && <p className={`judgement judgement-${judgement.toLowerCase().replaceAll(' ', '-')}`}>{judgement}</p>}
              <div className="touch-lanes" aria-label="Touch lane controls">{LANES.map((lane, index) => <button aria-label={`Lane ${index + 1}, ${lane.label}`} key={lane.key} onPointerCancel={() => releaseLane(index)} onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); pressLane(index) }} onPointerUp={(event) => { event.preventDefault(); releaseLane(index) }} type="button" />)}</div>
            </section>
          </div>
          <aside className="side-panel settings-panel" aria-label="Game controls">
            <p className="panel-kicker">Run controls</p>
            <div className="game-controls">
              <button disabled={phase !== 'playing'} onClick={pauseGame} type="button"><Pause aria-hidden="true" /> Pause</button>
              <button disabled={!beatmap} onClick={requestRestart} type="button"><RotateCcw aria-hidden="true" /> Restart</button>
            </div>
            <p>Difficulty</p>
            <div className="difficulty-control">{DIFFICULTIES.map((level) => <button className={difficulty === level ? 'active' : ''} disabled={!['ready'].includes(phase) || loadingState === 'loading'} key={level} onClick={() => { setLoadingState('loading'); setError(''); setDifficulty(level) }} type="button">{level}</button>)}</div>
            <fieldset className="background-control">
              <legend>Background</legend>
              <div className="background-options">
                <button aria-pressed={!showVideoBackground} className={!showVideoBackground ? 'is-active' : ''} onClick={() => selectBackground('purple')} type="button">Purple</button>
                <button aria-pressed={showVideoBackground} className={showVideoBackground ? 'is-active' : ''} disabled={!song?.videoUrl} onClick={() => selectBackground('video')} title={song?.videoUrl ? 'Use the song music video as the background' : 'No music video is available for this song'} type="button">Music video</button>
              </div>
              {!song?.videoUrl && loadingState !== 'loading' ? <small>Music video unavailable for this song.</small> : null}
            </fieldset>
            <button className="settings-toggle" onClick={() => setDetailsOpen((open) => !open)} type="button"><SlidersHorizontal aria-hidden="true" /> {detailsOpen ? 'Hide details' : 'Show details'}</button>
            {detailsOpen && <div className="settings-details"><span>{details}</span><label>Note speed <output>{noteSpeed.toFixed(2)}x</output><input aria-label="Visual note speed" max="1.5" min="0.75" onChange={(event) => { const value = Number(event.target.value); setNoteSpeed(value); localStorage.setItem('rhythmNoteSpeed', value) }} step="0.05" type="range" value={noteSpeed} /></label><label>Volume <output>{Math.round(volume * 100)}%</output><input aria-label="Game volume" max="1" min="0" onChange={(event) => { const value = Number(event.target.value); setVolume(value); localStorage.setItem('rhythmVolume', value) }} step="0.05" type="range" value={volume} /></label><span>Space / Esc pauses · R restarts</span></div>}
            {preview && <div className="preview-calibration" aria-label="Draft beatmap controls"><strong>Draft Preview</strong><p>Adjust timing if notes appear slightly early or late during preview.</p><label>Timing offset <output>{previewOffsetMs}ms</output><input aria-label="Draft preview timing offset" disabled={beatmap?.status !== 'DRAFT' || previewBusy} max="500" min="-500" onChange={(event) => setPreviewOffsetMs(Number(event.target.value))} step="5" type="range" value={previewOffsetMs} /></label><div><button disabled={beatmap?.status !== 'DRAFT' || previewBusy || previewOffsetMs === savedPreviewOffsetMs} onClick={savePreviewOffset} type="button">Save Offset</button><button disabled={beatmap?.status !== 'DRAFT' || previewBusy} onClick={publishPreview} type="button">Publish</button></div>{previewMessage && <span role="status">{previewMessage}</span>}</div>}
          </aside>
        </div>
        {error && <p className="game-message" role="alert">{error}</p>}
        {phase === 'ready' && <section className="pregame-overlay"><p className="eyebrow">{loadingState === 'loading' ? 'Loading stored chart' : loadingState === 'error' ? 'Chart unavailable' : preview ? 'Draft Preview' : 'Ready'}</p><h1>{song?.title || 'Rhythm game'}</h1><span>{difficulty.toUpperCase()}</span><button className="overlay-start-button" disabled={loadingState !== 'ready'} onClick={startCountdown} type="button"><Play aria-hidden="true" /> Start</button></section>}
        {phase === 'countdown' && <section aria-live="assertive" className="countdown-overlay">{countdown}</section>}
        {phase === 'paused' && <section className="pause-overlay"><p className="eyebrow">Paused</p><h1>Take a breath</h1><p>Press Space or Escape to resume.</p><div><button onClick={resumeGame} type="button"><Play aria-hidden="true" /> Resume</button><button onClick={requestRestart} type="button"><RotateCcw aria-hidden="true" /> Restart</button></div></section>}
        <div aria-label={`${Math.round(progress)}% through song`} aria-valuemax="100" aria-valuemin="0" aria-valuenow={Math.round(progress)} className="game-progress" role="progressbar"><span style={{ width: `${progress}%` }} /></div>
      </section>
    </main>
  )
}
