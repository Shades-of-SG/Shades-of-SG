import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PlayCircle, Square } from 'lucide-react'
import CustomVideoPlayer from '../components/shared/CustomVideoPlayer'
import PageHeader from '../components/PageHeader'
import useInstrumentAudio from '../hooks/useInstrumentAudio'
import {
  enrichInstrumentForPlayback,
  getSongInstruments,
  TEMPORARY_SONG_INSTRUMENT_FALLBACKS,
} from '../data/songExperienceInstrumentFallbacks'
import { getSongTrivia, TEMPORARY_SONG_TRIVIA_FALLBACKS } from '../data/songExperienceTriviaFallbacks'
import { getPublishedSong } from '../services/publicSongService'
import { getBeatmapSummary } from '../services/beatmapService'
import { trackAnalyticsEvent } from '../services/analyticsService'
import { useAuth } from '../context/AuthContext'
import './SongExperience.css'

const MOCK_SONG_DATA = {
  title: "Tomorrow's Here Today",
  artist: '53A',
  year: '2016',
  location: 'Singapore',
  tags: ['National Day', 'English Pop', 'Upbeat'],
  videoUrl: 'https://res.cloudinary.com/dep1fjics/video/upload/v1783863489/shades-of-sg/compiled-videos/nrpqc4kifmwdirz2h2xe.mp4',
  culturalSummary:
    '"Tomorrow\'s Here Today" is an upbeat, forward-looking anthem released for Singapore\'s National Day Parade in 2016. It embodies a modern, energetic vision of Singapore\'s future, encouraging unity and celebrating the diverse voices that make up the nation\'s fabric. The song resonates with a youthful energy and optimism.',
  instruments: TEMPORARY_SONG_INSTRUMENT_FALLBACKS,
  trivia: TEMPORARY_SONG_TRIVIA_FALLBACKS,
}


export default function SongExperience() {
  const { id = 'demo-song' } = useParams()
  const { token } = useAuth()

  const [dbSong, setDbSong] = useState(null)
  const [loadingDbSong, setLoadingDbSong] = useState(id !== 'demo-song')
  const [dbError, setDbError] = useState('')
  const [rhythmDifficulties, setRhythmDifficulties] = useState([])

  useEffect(() => {
    if (id === 'demo-song') {
      return
    }
    let active = true
    getPublishedSong(id)
      .then((data) => active && setDbSong(data))
      .catch((err) => active && setDbError(err.message))
      .finally(() => active && setLoadingDbSong(false))
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!dbSong?.id) return
    trackAnalyticsEvent('SONG_PAGE_VIEWED', { songId: dbSong.id }, token).catch(() => {})
  }, [dbSong?.id, token])

  useEffect(() => {
    if (id === 'demo-song') return
    let active = true
    getBeatmapSummary(id)
      .then((beatmaps) => {
        if (!active) return
        setRhythmDifficulties(
          beatmaps
            .filter((beatmap) => beatmap.status === 'PUBLISHED')
            .map((beatmap) => beatmap.difficulty)
        )
      })
      .catch(() => active && setRhythmDifficulties([]))
    return () => { active = false }
  }, [id])

  const songData = dbSong ? {
    title: dbSong.title,
    artist: dbSong.artist || 'Unknown artist',
    year: dbSong.publishedDate ? new Date(dbSong.publishedDate).getFullYear() : '',
    location: 'Singapore',
    tags: [...(dbSong.moodTags || []), ...(dbSong.languages || [])],
    videoUrl: dbSong.videoUrl,
    culturalSummary: dbSong.description || 'No cultural summary has been added yet.',
    coverImageUrl: dbSong.coverImageUrl || undefined,
    transcriptionSegments: dbSong.transcriptionSegments || null,
    instruments: getSongInstruments(dbSong),
    trivia: getSongTrivia(dbSong),
  } : MOCK_SONG_DATA

  // Trivia state
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)

  // Instrument audio state
  const { playNote } = useInstrumentAudio()
  const [playingInstrumentId, setPlayingInstrumentId] = useState(null)
  const melodyTimeouts = useRef([])

  function stopSyntheticMelody() {
    melodyTimeouts.current.forEach(clearTimeout)
    melodyTimeouts.current = []
    setPlayingInstrumentId(null)
  }

  useEffect(() => {
    return () => {
      melodyTimeouts.current.forEach(clearTimeout)
    }
  }, [])

  function handlePlayMelody(instrument) {
    if (playingInstrumentId === instrument.id) {
      stopSyntheticMelody()
      return
    }

    stopSyntheticMelody()

    // The CustomVideoPlayer will be paused by the user; here we just track state

    const playableInstrument = enrichInstrumentForPlayback(instrument)
    const notes = Array.isArray(playableInstrument.notes) ? playableInstrument.notes : []
    const melody = Array.isArray(playableInstrument.melody) && playableInstrument.melody.length > 0
      ? playableInstrument.melody
      : notes.map((note) => note.label)

    setPlayingInstrumentId(instrument.id)

    if (melody.length === 0) {
      playNote(playableInstrument, { frequency: 440, key: 'a', label: 'A4' })
      const resetTimeout = setTimeout(() => setPlayingInstrumentId(null), 600)
      melodyTimeouts.current.push(resetTimeout)
      return
    }

    // Mimic the sequence logic from InstrumentPlayer
    melody.forEach((noteLabel, index) => {
      const note = notes.find((candidate) => candidate.label === noteLabel) || notes[0]
      if (!note) return

      const timeoutId = setTimeout(() => {
        playNote(playableInstrument, note)

        // Clear active state when the melody finishes
        if (index === melody.length - 1) {
          const resetTimeout = setTimeout(() => {
            setPlayingInstrumentId((currentId) => currentId === instrument.id ? null : currentId)
          }, 500)
          melodyTimeouts.current.push(resetTimeout)
        }
      }, index * 260)

      melodyTimeouts.current.push(timeoutId)
    })
  }

  const currentQuestion = songData.trivia[questionIndex] || { options: [], question: '' }



  function handleAnswerClick(optionId) {
    if (selectedAnswer) return
    setSelectedAnswer(optionId)

    const isCorrect = optionId === currentQuestion.correctAnswerId
    if (isCorrect) setScore((s) => s + 1)

    setTimeout(() => {
      setSelectedAnswer(null)
      if (questionIndex + 1 < songData.trivia.length) {
        setQuestionIndex((prev) => prev + 1)
      } else {
        setQuizCompleted(true)
      }
    }, 2500)
  }

  function optionStyle(opt) {
    const base = {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      padding: '14px 16px',
      border: '1px solid var(--line)',
      borderRadius: '8px',
      background: 'rgba(30, 41, 59, 0.5)',
      color: 'var(--text)',
      fontSize: '0.875rem',
      cursor: selectedAnswer ? 'default' : 'pointer',
      transition: 'all 150ms ease',
      textAlign: 'left',
    }

    if (!selectedAnswer) return base

    const isCorrect = opt.id === currentQuestion.correctAnswerId
    const isSelected = opt.id === selectedAnswer

    if (isSelected && isCorrect) {
      return { ...base, borderColor: 'var(--green)', background: 'rgba(34, 197, 94, 0.12)', color: 'var(--green)' }
    }
    if (isSelected && !isCorrect) {
      return { ...base, borderColor: 'var(--error)', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--error)' }
    }
    if (!isSelected && isCorrect) {
      return { ...base, borderColor: 'var(--green)', background: 'rgba(34, 197, 94, 0.08)', color: 'rgba(34, 197, 94, 0.8)' }
    }
    return { ...base, opacity: 0.4 }
  }

  if (loadingDbSong) return <div className="page-stack"><p role="status">Loading published song…</p></div>
  if (dbError || (!dbSong && id !== 'demo-song')) return <div className="page-stack"><div className="state-box" role="alert">{dbError || 'Published song not found.'}</div><Link to="/songs">Back to Songs</Link></div>

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Song Experience"
        title={songData.title}
        description={`${songData.artist} · ${songData.year} · ${songData.location}`}
      />

      {/* ─── Main Two-Column Layout ─── */}
      <div className="song-experience-layout">

        {/* ═══ LEFT COLUMN: Video + About ═══ */}
        <div className="se-left-col">

          {/* Video Player */}
          <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
            <CustomVideoPlayer
              src={songData.videoUrl}
              transcriptionSegments={songData.transcriptionSegments}
              poster={songData.coverImageUrl}
              onPlay={() => {
                stopSyntheticMelody()
                if (dbSong?.id) trackAnalyticsEvent('SONG_PLAYBACK_STARTED', { songId: dbSong.id }, token).catch(() => {})
              }}
              onEnded={() => { if (dbSong?.id) trackAnalyticsEvent('SONG_PLAYBACK_COMPLETED', { songId: dbSong.id }, token).catch(() => {}) }}
            />
          </div>

          {/* Title + Tags (below player) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{songData.title}</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
              <span>{songData.artist}</span> · {songData.year} · {songData.location}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              {songData.tags.map((tag, i) => (
                <span key={i} style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid var(--line)', background: 'rgba(30, 41, 59, 0.6)', color: 'var(--muted)', fontSize: '0.75rem' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* About This Song */}
          <div className="section-card">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span aria-hidden>✨</span>
              About This Song
            </h3>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              {songData.culturalSummary}
            </p>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN: Instruments + Quiz ═══ */}
        <div className="se-right-col">

          {/* Featured Instruments */}
          <div className="section-card">
            <h3 style={{ margin: 0, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
              Featured Instruments
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {songData.instruments.map((inst, i) => {
                const isInstPlaying = playingInstrumentId === inst.id
                const iconImage = inst.imageUrl || inst.iconUrl
                const icon = inst.icon || enrichInstrumentForPlayback(inst).icon || '🎵'
                return (
                  <button
                    aria-label={`${isInstPlaying ? 'Stop' : 'Play'} ${inst.name}${inst.description ? `: ${inst.description}` : ''}`}
                    id={`instrument-${inst.id || i}`}
                    key={inst.id || inst.name || i}
                    onClick={() => handlePlayMelody(inst)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '20px 12px',
                      borderRadius: '10px',
                      border: isInstPlaying ? '1px solid var(--violet)' : '1px solid var(--line)',
                      background: isInstPlaying ? 'rgba(124, 58, 237, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      color: isInstPlaying ? 'var(--violet)' : 'var(--text)',
                      fontSize: '0.85rem',
                    }}
                    onMouseOver={(e) => { if (!isInstPlaying) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)' }}
                    onMouseOut={(e) => { if (!isInstPlaying) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)' }}
                  >
                    {/* Play icon top-right */}
                    <span style={{ position: 'absolute', top: '8px', right: '8px', color: isInstPlaying ? 'var(--violet)' : 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                      {isInstPlaying ? <Square size={16} fill="currentColor" /> : <PlayCircle size={16} />}
                    </span>
                    {iconImage ? (
                      <img
                        alt={inst.name}
                        src={iconImage}
                        style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    ) : (
                      <span aria-hidden="true" style={{ fontSize: '2rem' }}>{icon}</span>
                    )}
                    <span>{inst.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Knowledge Check */}
          <div className="section-card">
            {!songData.trivia.length ? (
              <p style={{ margin: 0, color: 'var(--muted)' }}>No knowledge check has been published for this song yet.</p>
            ) : quizCompleted ? (
              <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--green)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                  ✓
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>Quiz Completed!</h3>
                  <p style={{ margin: 0, color: 'var(--muted)' }}>You scored {score} out of {songData.trivia.length}</p>
                </div>
                <button
                  onClick={() => { setQuizCompleted(false); setQuestionIndex(0); setScore(0); }}
                  style={{ marginTop: '8px', padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--line)', background: 'rgba(30, 41, 59, 0.8)', color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--panel)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)')}
                >
                  Retake Quiz
                </button>
              </div>
            ) : (
              <>
                <p style={{ margin: 0, color: 'var(--violet)', fontSize: '0.75rem', fontWeight: 600 }}>
                  Knowledge Check ({questionIndex + 1}/{songData.trivia.length})
                </p>
                <h3 style={{ margin: 0, fontSize: '1rem', lineHeight: 1.5 }}>
                  {currentQuestion.question}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedAnswer === opt.id
                const isCorrect = opt.id === currentQuestion.correctAnswerId
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswerClick(opt.id)}
                    disabled={selectedAnswer !== null}
                    style={optionStyle(opt)}
                    onMouseOver={(e) => { if (!selectedAnswer) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)' }}
                    onMouseOut={(e) => { if (!selectedAnswer) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)' }}
                  >
                    {/* Radio / result icon */}
                    {selectedAnswer ? (
                      (isSelected && isCorrect) || (!isSelected && isCorrect) ? (
                        <span style={{ color: 'var(--green)', fontSize: '1.1rem' }}>✓</span>
                      ) : isSelected && !isCorrect ? (
                        <span style={{ color: 'var(--error)', fontSize: '1.1rem' }}>✕</span>
                      ) : (
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--line)', display: 'inline-block', flexShrink: 0 }} />
                      )
                    ) : (
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--muted)', display: 'inline-block', flexShrink: 0 }} />
                    )}
                    <span>{opt.id}. {opt.text}</span>
                  </button>
                )
              })}
            </div>
            </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Learning Hub CTA ─── */}
      <section className="section-card">
        <h2>Explore This Song</h2>
        <div className="button-row">
          <Link className="inline-link" to={`/songs/${id}/playground`}>Open Playground</Link>
          <Link className="inline-link" to={`/songs/${id}/trivia`}>Start Trivia</Link>
          {rhythmDifficulties.length
            ? rhythmDifficulties.map((difficulty) => {
                const label = difficulty[0] + difficulty.slice(1).toLowerCase()
                return <Link className="inline-link" key={difficulty} to={`/game/${id}?difficulty=${difficulty}`}>Play {label} Rhythm</Link>
              })
            : <span className="inline-link is-disabled" title="This rhythm game is not available yet.">Rhythm game unavailable</span>}
          <Link className="inline-link" to={`/reflections?song_id=${encodeURIComponent(id)}`}>Share a Reflection</Link>
        </div>
      </section>

      <Link
        to={`/learning`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--primary), var(--violet))',
          textDecoration: 'none',
          color: '#fff',
          fontWeight: 600,
          fontSize: '1.05rem',
          transition: 'filter 200ms',
          boxShadow: '0 0 30px rgba(91, 75, 138, 0.3)',
        }}
        onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.15)')}
        onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        Take a Lesson in the Learning Hub →
      </Link>
    </div>
  )
}
