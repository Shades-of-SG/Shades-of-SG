import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DIFFICULTIES, loadBeatmap } from '../game/beatmapLoader'
import { calculateAccuracy, createResult, storeResult } from '../game/results'
import { queuePendingScore, saveScore } from '../game/scoresApi'
import { fetchSongDetails } from '../game/songDetailsApi'
import { useAuth } from '../context/AuthContext'

const LANES = [
  { key: 'd', label: 'D', color: '#ff4d6d' },
  { key: 'f', label: 'F', color: '#f59e0b' },
  { key: 'j', label: 'J', color: '#22c55e' },
  { key: 'k', label: 'K', color: '#38bdf8' },
]
const TRAVEL_TIME = 1.85
const HIT_WINDOW = 0.18
const MISS_WINDOW = 0.24
const HIT_LINE_RATIO = 0.82

function getJudgement(offset) {
  const absoluteOffset = Math.abs(offset)

  if (absoluteOffset <= 0.06) {
    return { label: 'Perfect', points: 1000 }
  }

  if (absoluteOffset <= 0.12) {
    return { label: 'Great', points: 700 }
  }

  return { label: 'Good', points: 350 }
}

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

function drawGame(canvas, notes, currentTime, renderNotes = true) {
  if (!canvas) {
    return
  }

  const { context, height, width } = resizeCanvas(canvas)
  const laneWidth = width / LANES.length
  const hitLineY = height * HIT_LINE_RATIO

  context.clearRect(0, 0, width, height)
  context.fillStyle = 'rgba(0, 0, 0, 0.58)'
  context.fillRect(0, 0, width, height)

  LANES.forEach((lane, index) => {
    const x = index * laneWidth
    context.fillStyle = index % 2 === 0 ? 'rgba(0,0,0,0.54)' : 'rgba(10,10,10,0.68)'
    context.fillRect(x, 0, laneWidth, height)
    context.strokeStyle = 'rgba(255,255,255,0.18)'
    context.lineWidth = 1
    context.strokeRect(x, 0, laneWidth, height)

    context.fillStyle = '#ffffff'
    context.globalAlpha = 0.12
    context.fillRect(x + 12, hitLineY + 12, laneWidth - 24, 46)
    context.globalAlpha = 1

    context.fillStyle = 'rgba(255, 255, 255, 0.72)'
    context.font = '800 58px Inter, sans-serif'
    context.textAlign = 'center'
    context.shadowBlur = 12
    context.shadowColor = 'rgba(0,0,0,0.8)'
    context.fillText(lane.label, x + laneWidth / 2, hitLineY - 110)
    context.shadowBlur = 0
  })

  context.strokeStyle = 'rgba(255,255,255,0.78)'
  context.lineWidth = 6
  context.shadowBlur = 8
  context.shadowColor = 'rgba(255,255,255,0.5)'
  context.beginPath()
  context.moveTo(0, hitLineY)
  context.lineTo(width, hitLineY)
  context.stroke()
  context.shadowBlur = 0

  if (!renderNotes) {
    return
  }

  notes.forEach((note) => {
    if (note.status !== 'pending') {
      return
    }

    const timeUntilHit = note.time - currentTime
    const progress = 1 - timeUntilHit / TRAVEL_TIME

    if (progress < -0.05 || progress > 1.16) {
      return
    }

    const lane = LANES[note.lane]
    const laneX = note.lane * laneWidth
    const noteWidth = laneWidth * 0.76
    const noteX = laneX + laneWidth * 0.12
    const noteY = progress * hitLineY

    const gradient = context.createLinearGradient(noteX, noteY, noteX + noteWidth, noteY)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.18, lane.color)
    gradient.addColorStop(1, lane.color)
    context.fillStyle = gradient
    context.shadowBlur = 26
    context.shadowColor = lane.color
    context.fillRect(noteX, noteY, noteWidth, 26)
    context.strokeStyle = 'rgba(255,255,255,0.92)'
    context.lineWidth = 2
    context.strokeRect(noteX, noteY, noteWidth, 26)
    context.shadowBlur = 0
  })
}

export default function RhythmGame() {
  const { songId } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const animationRef = useRef(null)
  const countdownTimeoutRef = useRef(null)
  const startTimeRef = useRef(0)
  const currentTimeRef = useRef(0)
  const notesRef = useRef([])
  const comboRef = useRef(0)
  const scoreRef = useRef(0)
  const hitsRef = useRef(0)
  const missesRef = useRef(0)
  const perfectHitsRef = useRef(0)
  const goodHitsRef = useRef(0)
  const maxComboRef = useRef(0)
  const finishedRef = useRef(false)
  const [beatmap, setBeatmap] = useState(null)
  const [songDetails, setSongDetails] = useState(null)
  const [videoLoadFailed, setVideoLoadFailed] = useState(false)
  const [difficulty, setDifficulty] = useState('medium')
  const [notes, setNotes] = useState([])
  const [loadingState, setLoadingState] = useState('loading')
  const [isPlaying, setIsPlaying] = useState(false)
  const [gamePhase, setGamePhase] = useState('ready')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [countdownValue, setCountdownValue] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [lastJudgement, setLastJudgement] = useState('Ready')

  const totalNotes = notes.length
  const accuracy = calculateAccuracy(hits, totalNotes)
  const mediaUrl = videoLoadFailed ? '' : songDetails?.videoUrl || songDetails?.audioUrl || ''
  const mediaIsVideo = Boolean(songDetails?.videoUrl)
  const progressPercent =
    totalNotes === 0 ? 0 : Math.min((currentTime / ((notes.at(-1)?.time || 0) + 0.7)) * 100, 100)

  const resetStats = useCallback((nextNotes) => {
    cancelAnimationFrame(animationRef.current)
    videoRef.current?.pause()
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.loop = false
    }
    notesRef.current = nextNotes
    comboRef.current = 0
    scoreRef.current = 0
    hitsRef.current = 0
    missesRef.current = 0
    perfectHitsRef.current = 0
    goodHitsRef.current = 0
    maxComboRef.current = 0
    finishedRef.current = false
    currentTimeRef.current = 0
    clearTimeout(countdownTimeoutRef.current)
    setNotes(nextNotes)
    setCurrentTime(0)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setHits(0)
    setMisses(0)
    setLastJudgement('Ready')
    setIsPlaying(false)
    setGamePhase('ready')
    setCountdownValue(null)
  }, [])

  useEffect(() => {
    let ignore = false
    fetchSongDetails(songId)
      .then(async (song) => ({ song, beatmap: await loadBeatmap(song, difficulty) }))
      .then(({ song, beatmap: nextBeatmap }) => {
        if (ignore) {
          return
        }
        setSongDetails(song)
        setVideoLoadFailed(false)
        setBeatmap(nextBeatmap)
        resetStats(nextBeatmap.notes)
        setLoadingState('ready')
      })
      .catch(() => {
        if (!ignore) {
          setSongDetails(null)
          setBeatmap(null)
          resetStats([])
          setLoadingState('error')
        }
      })

    return () => {
      ignore = true
    }
  }, [difficulty, resetStats, songId])

  useEffect(() => {
    notesRef.current = notes
    drawGame(canvasRef.current, notes, currentTime, gamePhase === 'playing')
  }, [currentTime, gamePhase, notes])

  useEffect(() => () => clearTimeout(countdownTimeoutRef.current), [])

  const finishGame = useCallback(async () => {
    if (finishedRef.current || totalNotes === 0) {
      return
    }

    finishedRef.current = true
    cancelAnimationFrame(animationRef.current)
    videoRef.current?.pause()
    if (videoRef.current) {
      videoRef.current.loop = false
    }
    setIsPlaying(false)
    setGamePhase('finished')

    const finalAccuracy = calculateAccuracy(hitsRef.current, totalNotes)
    const result = createResult({
      accuracy: finalAccuracy,
      difficulty,
      goodHits: goodHitsRef.current,
      maxCombo: maxComboRef.current,
      misses: missesRef.current,
      perfectHits: perfectHitsRef.current,
      score: scoreRef.current,
      songId,
      totalNotes,
    })

    storeResult(result)

    if (token && user?.role === 'REGISTERED') {
      try {
        await saveScore(result, token)
      } catch {
        queuePendingScore(result)
      }
    }

    navigate(`/game/${songId}/results`, { replace: true, state: { result } })
  }, [difficulty, navigate, songId, token, totalNotes, user?.role])

  useEffect(() => {
    if (!isPlaying) {
      return undefined
    }

    function tick() {
      const nextTime =
        videoRef.current && !videoLoadFailed
          ? videoRef.current.currentTime
          : (performance.now() - startTimeRef.current) / 1000
      const updatedNotes = notesRef.current.map((note) => {
        if (note.status === 'pending' && nextTime - note.time > MISS_WINDOW) {
          missesRef.current += 1
          comboRef.current = 0
          setMisses(missesRef.current)
          setCombo(0)
          setLastJudgement('Miss')
          return { ...note, status: 'missed' }
        }

        return note
      })

      notesRef.current = updatedNotes
      currentTimeRef.current = nextTime
      setNotes(updatedNotes)
      setCurrentTime(nextTime)
      drawGame(canvasRef.current, updatedNotes, nextTime, true)

      const lastNoteTime = updatedNotes.at(-1)?.time || 0
      const chartComplete = updatedNotes.every((note) => note.status !== 'pending')

      if (chartComplete && nextTime > lastNoteTime + 0.7) {
        finishGame()
        return
      }

      animationRef.current = requestAnimationFrame(tick)
    }

    animationRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationRef.current)
  }, [finishGame, isPlaying, videoLoadFailed])

  useEffect(() => {
    function handleKeyDown(event) {
      const laneIndex = LANES.findIndex((lane) => lane.key === event.key.toLowerCase())

      if (!isPlaying || laneIndex === -1) {
        return
      }

      const currentNotes = notesRef.current
      const candidate = currentNotes
        .filter((note) => note.status === 'pending' && note.lane === laneIndex)
        .map((note) => ({
          ...note,
          offset: currentTimeRef.current - note.time,
        }))
        .sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset))[0]

      if (!candidate || Math.abs(candidate.offset) > HIT_WINDOW) {
        missesRef.current += 1
        comboRef.current = 0
        setMisses(missesRef.current)
        setCombo(0)
        setLastJudgement('Miss')
        return
      }

      const judgement = getJudgement(candidate.offset)
      const nextCombo = comboRef.current + 1
      const nextScore = scoreRef.current + judgement.points + nextCombo * 12
      const nextMaxCombo = Math.max(maxComboRef.current, nextCombo)
      const nextNotes = currentNotes.map((note) =>
        note.id === candidate.id ? { ...note, status: 'hit' } : note,
      )

      comboRef.current = nextCombo
      scoreRef.current = nextScore
      hitsRef.current += 1
      if (judgement.label === 'Perfect') {
        perfectHitsRef.current += 1
      } else {
        goodHitsRef.current += 1
      }
      maxComboRef.current = nextMaxCombo
      notesRef.current = nextNotes

      setCombo(nextCombo)
      setScore(nextScore)
      setHits(hitsRef.current)
      setMaxCombo(nextMaxCombo)
      setLastJudgement(judgement.label)
      setNotes(nextNotes)
      drawGame(canvasRef.current, nextNotes, currentTimeRef.current, true)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying])

  const startPlayback = useCallback(async () => {
    if (loadingState !== 'ready' || notesRef.current.length === 0) {
      return
    }

    if (videoRef.current && !videoLoadFailed) {
      videoRef.current.loop = false
      videoRef.current.currentTime = currentTimeRef.current
      await videoRef.current.play().catch(() => {
        setVideoLoadFailed(true)
      })
    }

    startTimeRef.current = performance.now() - currentTimeRef.current * 1000
    setGamePhase('playing')
    setIsPlaying(true)
  }, [loadingState, videoLoadFailed])

  const startCountdown = useCallback(() => {
    if (loadingState !== 'ready' || notes.length === 0) {
      return
    }

    clearTimeout(countdownTimeoutRef.current)
    resetStats(notes.map((note) => ({ ...note, status: 'pending' })))
    setGamePhase('countdown')
    setCountdownValue('3')

    const sequence = ['2', '1', 'GO']

    function step(index) {
      countdownTimeoutRef.current = window.setTimeout(() => {
        if (index < sequence.length) {
          setCountdownValue(sequence[index])
          step(index + 1)
          return
        }

        setCountdownValue(null)
        startPlayback()
      }, 850)
    }

    step(0)
  }, [loadingState, notes, resetStats, startPlayback])

  const pauseGame = useCallback(() => {
    cancelAnimationFrame(animationRef.current)
    videoRef.current?.pause()
    setIsPlaying(false)
    setGamePhase('paused')
  }, [])

  const resumeGame = useCallback(() => {
    if (gamePhase !== 'paused') {
      return
    }

    startPlayback()
  }, [gamePhase, startPlayback])

  useEffect(() => {
    function handleSpacebar(event) {
      if (event.code !== 'Space') {
        return
      }

      event.preventDefault()

      if (gamePhase === 'playing') {
        pauseGame()
      } else if (gamePhase === 'paused') {
        resumeGame()
      }
    }

    window.addEventListener('keydown', handleSpacebar)
    return () => window.removeEventListener('keydown', handleSpacebar)
  }, [gamePhase, pauseGame, resumeGame])

  return (
    <main className={`rhythm-page ${videoLoadFailed ? 'video-fallback' : ''}`}>
      {mediaUrl && mediaIsVideo && (
        <video
          aria-hidden="true"
          className="rhythm-background-video"
          key={mediaUrl}
          muted
          onEnded={() => {
            if (isPlaying) {
              finishGame()
            }
          }}
          onError={() => setVideoLoadFailed(true)}
          playsInline
          preload="metadata"
          ref={videoRef}
          src={mediaUrl}
        />
      )}
      {mediaUrl && !mediaIsVideo && <audio key={mediaUrl} onError={() => setVideoLoadFailed(true)} preload="metadata" ref={videoRef} src={mediaUrl} />}
      <div className="rhythm-video-overlay" />
      <section className="rhythm-shell">
        <nav className="game-top-icons" aria-label="Gameplay navigation">
          <button aria-label="Back to songs" onClick={() => navigate('/songs')} type="button">
            Home
          </button>
          <button aria-label="Fullscreen" type="button">
            Fullscreen
          </button>
        </nav>

        <div className="game-layout">
          <aside className="side-panel stats-panel" aria-label="Game stats">
            <div>
              <span>Accuracy</span>
              <strong>{accuracy.toFixed(2)}%</strong>
            </div>
            <div>
              <span>Combo</span>
              <strong>{combo}</strong>
            </div>
            <div>
              <span>Score</span>
              <strong>{score.toLocaleString()}</strong>
            </div>
            <small>{maxCombo} max combo / {misses} misses</small>
          </aside>

          <div className="board-column">
            <section className="canvas-stage" aria-label="Rhythm lanes">
              <canvas aria-label="Falling notes canvas" ref={canvasRef} />
              {gamePhase === 'playing' && (
                <p className={`judgement judgement-${lastJudgement.toLowerCase()}`}>
                  {lastJudgement}
                </p>
              )}
            </section>
          </div>

          <aside className="side-panel settings-panel" aria-label="Game settings">
            <footer className="game-controls" aria-label="Game controls">
              <button disabled={!isPlaying} onClick={pauseGame} type="button">
                Pause
              </button>
              <button
                disabled={loadingState !== 'ready'}
                onClick={() => resetStats(beatmap.notes)}
                type="button"
              >
                Reset
              </button>
            </footer>
            <p>Difficulty</p>
            <div className="difficulty-control" aria-label="Difficulty">
              {DIFFICULTIES.map((level) => (
                <button
                  className={difficulty === level ? 'active' : ''}
                  disabled={isPlaying}
                  key={level}
                  onClick={() => setDifficulty(level)}
                  type="button"
                >
                  {level}
                </button>
              ))}
            </div>
            <button
              className="settings-toggle"
              onClick={() => setSettingsOpen((open) => !open)}
              type="button"
            >
              {settingsOpen ? 'Hide details' : 'Show details'}
            </button>
            {settingsOpen && (
              <div className="settings-details">
                <span>{songDetails?.title || beatmap?.title || 'Loading beatmap'}</span>
                <span>{beatmap ? `${beatmap.artist} | ${songId}` : 'Fetching chart data...'}</span>
                <span>D F J K</span>
                <span>{currentTime.toFixed(1)}s</span>
              </div>
            )}
          </aside>
        </div>

        {loadingState === 'error' && (
          <p className="game-message">No beatmap found for this song id yet.</p>
        )}

        {gamePhase === 'ready' && (
          <section className="pregame-overlay" aria-label="Pre-game setup">
            <p className="eyebrow">Ready</p>
            <h1>{songDetails?.title || beatmap?.title || 'Loading beatmap'}</h1>
            <span>{difficulty.toUpperCase()}</span>
            <button
              className="overlay-start-button"
              disabled={loadingState !== 'ready'}
              onClick={startCountdown}
              type="button"
            >
              <span aria-hidden="true" />
              Start
            </button>
          </section>
        )}

        {gamePhase === 'countdown' && (
          <section className="countdown-overlay" aria-live="assertive" aria-label="Countdown">
            {countdownValue}
          </section>
        )}

        {gamePhase === 'paused' && (
          <section className="pause-overlay" aria-label="Pause menu">
            <p className="eyebrow">Paused</p>
            <h1>Game paused</h1>
            <p>Press Space to resume.</p>
            <div>
              <button onClick={resumeGame} type="button">
                Resume
              </button>
              <button onClick={() => resetStats(beatmap.notes)} type="button">
                Restart
              </button>
            </div>
          </section>
        )}

        <div className="game-progress" aria-hidden="true">
          <span style={{ width: `${progressPercent}%` }} />
        </div>

        <p className="video-credit">Powered by AI generated video. Video copyright goes to the owner.</p>
      </section>
    </main>
  )
}
