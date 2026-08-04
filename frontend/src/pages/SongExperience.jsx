import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PlayCircle, Square, Loader2, AlertCircle, Sparkles, BookOpen, Music2 } from 'lucide-react'
import CustomVideoPlayer from '../components/shared/CustomVideoPlayer'
import PageHeader from '../components/PageHeader'
import useInstrumentAudio from '../hooks/useInstrumentAudio'
import { getPublishedSong } from '../services/publicSongService'
import { getBeatmapSummary } from '../services/beatmapService'
import { LEARNING_HUB_INSTRUMENTS } from '../data/learningHubInstruments'
import './SongExperience.css'

export default function SongExperience() {
  const { id } = useParams()

  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rhythmDifficulties, setRhythmDifficulties] = useState([])

  // Video playback & synthetic melody state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isArticleExpanded, setIsArticleExpanded] = useState(false)

  // Trivia state
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)

  // Instrument audio state
  const { playNote } = useInstrumentAudio()
  const [playingInstrumentId, setPlayingInstrumentId] = useState(null)
  const activeAudioRef = useRef(null)
  const melodyTimeouts = useRef([])

  useEffect(() => {
    let isMounted = true
    if (!id) return

    setLoading(true)
    setError('')

    getPublishedSong(id)
      .then((data) => {
        if (!isMounted) return
        setSong(data)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.message || 'Published song not found.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    if (!id) return
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

  function stopAudioPlayback() {
    melodyTimeouts.current.forEach(clearTimeout)
    melodyTimeouts.current = []
    if (activeAudioRef.current) {
      activeAudioRef.current.pause()
      activeAudioRef.current.currentTime = 0
      activeAudioRef.current = null
    }
    setPlayingInstrumentId(null)
  }

  useEffect(() => {
    return () => {
      stopAudioPlayback()
    }
  }, [])

  function handlePlayInstrument(inst) {
    if (playingInstrumentId === inst.id) {
      stopAudioPlayback()
      return
    }

    stopAudioPlayback()
    setIsPlaying(false)
    setPlayingInstrumentId(inst.id)

    // Match with Learning Hub instrument catalog to retrieve notes, melody, envelope, waveform, and samples
    const hubMatch = LEARNING_HUB_INSTRUMENTS.find(
      (h) => h.name.toLowerCase() === (inst.name || '').toLowerCase() || h.id === inst.id
    )
    const targetInst = { ...hubMatch, ...inst }

    if (targetInst.audioUrl) {
      const audio = new Audio(targetInst.audioUrl)
      activeAudioRef.current = audio
      audio.play().catch(() => {})
      audio.onended = () => {
        setPlayingInstrumentId(null)
        activeAudioRef.current = null
      }
    } else if (Array.isArray(targetInst.notes) && targetInst.notes.length > 0) {
      const melodySequence = targetInst.melody || targetInst.notes.map((n) => n.label)
      melodySequence.forEach((noteLabel, index) => {
        const note = targetInst.notes.find((candidate) => candidate.label === noteLabel) || targetInst.notes[0]
        if (!note) return

        const timeoutId = setTimeout(() => {
          playNote(targetInst, note)
          if (index === melodySequence.length - 1) {
            const resetTimeout = setTimeout(() => {
              setPlayingInstrumentId((currentId) => (currentId === inst.id ? null : currentId))
            }, 600)
            melodyTimeouts.current.push(resetTimeout)
          }
        }, index * 260)

        melodyTimeouts.current.push(timeoutId)
      })
    } else {
      // Fallback synthetic tone
      playNote(targetInst || {}, { frequency: 440, key: 'a', label: 'A4' })
      setTimeout(() => {
        setPlayingInstrumentId(null)
      }, 1000)
    }
  }

  if (loading) {
    return (
      <div className="page-stack" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ margin: '0 auto', color: '#818cf8' }} />
        <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Loading published song experience...</p>
      </div>
    )
  }

  if (error || !song) {
    return (
      <div className="page-stack">
        <div className="state-box" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span>{error || 'Published song not found.'}</span>
        </div>
        <Link to="/songs" className="inline-link" style={{ marginTop: '1rem' }}>
          ← Back to Songs Library
        </Link>
      </div>
    )
  }

  // Derive song metadata
  const songYear = song.publishedDate
    ? new Date(song.publishedDate).getFullYear()
    : song.createdAt
    ? new Date(song.createdAt).getFullYear()
    : new Date().getFullYear()

  const moodTags = Array.isArray(song.moodTags) && song.moodTags.length > 0
    ? song.moodTags
    : Array.isArray(song.languages) && song.languages.length > 0
    ? song.languages
    : ['Singaporean Heritage']

  const triviaList = Array.isArray(song.triviaQuestions) ? song.triviaQuestions : []
  const currentQuestion = triviaList[questionIndex] || null

  // Format options for current question
  const currentOptions = currentQuestion && Array.isArray(currentQuestion.options)
    ? currentQuestion.options.map((optText, index) => ({
        id: String.fromCharCode(65 + index),
        text: optText,
        rawValue: optText,
      }))
    : []

  function handleAnswerClick(opt) {
    if (selectedAnswer !== null) return
    setSelectedAnswer(opt.id)

    const isCorrect = opt.rawValue === currentQuestion.correctAnswer
    if (isCorrect) setScore((s) => s + 1)

    setTimeout(() => {
      setSelectedAnswer(null)
      if (questionIndex + 1 < triviaList.length) {
        setQuestionIndex((prev) => prev + 1)
      } else {
        setQuizCompleted(true)
      }
    }, 2200)
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
      cursor: selectedAnswer !== null ? 'default' : 'pointer',
      transition: 'all 150ms ease',
      textAlign: 'left',
    }

    if (selectedAnswer === null) return base

    const isCorrect = opt.rawValue === currentQuestion.correctAnswer
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

  return (
    <div className="page-stack" style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
      <PageHeader
        eyebrow="Song Experience"
        title={song.title}
        description={`${song.artist || 'Singapore Artist'} · ${songYear} · Singapore`}
      />

      {/* ─── YouTube-Style Grid (Main 1fr + Sidebar 360px) ─── */}
      <div className="song-experience-layout">
        {/* ═══ LEFT MAIN COLUMN (1fr): Video + Title + About ═══ */}
        <div className="se-left-col">
          {/* Custom Video Player */}
          <div className="section-card" style={{ padding: 0, overflow: 'hidden', width: '100%' }}>
            <CustomVideoPlayer
              src={song.videoUrl || song.audioUrl}
              transcriptionSegments={song.transcriptionSegments}
              poster={song.coverImageUrl}
              onPlay={() => {
                setIsPlaying(true)
                stopAudioPlayback()
              }}
              onPause={() => setIsPlaying(false)}
            />
          </div>

          {/* Title + Metadata Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc' }}>{song.title}</h1>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>
              <span>{song.artist || 'Singapore Artist'}</span> · {songYear} · Singapore
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              {moodTags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: 'var(--muted)',
                    fontSize: '0.75rem',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* About This Song & Cultural Story */}
          <div className="section-card">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
              <Sparkles className="w-5 h-5 text-amber-400" />
              About This Song & Cultural Story
            </h3>
            {(() => {
              const articleContent = song.aiSummary || song.description || ''
              if (!articleContent.trim()) {
                return (
                  <p style={{ margin: '0.75rem 0 0', color: 'var(--muted)', lineHeight: 1.7, fontSize: '0.925rem' }}>
                    No cultural summary has been added for this song yet.
                  </p>
                )
              }

              const cleanText = articleContent.replace(/\s+/g, ' ').trim()
              const isLong = cleanText.length > 350

              if (!isArticleExpanded && isLong) {
                // Truncate to ~320-350 characters at word boundary
                const truncated = cleanText.slice(0, 350).replace(/\s+\S*$/, '')
                return (
                  <p style={{ margin: '0.75rem 0 0', color: '#cbd5e1', lineHeight: 1.7, fontSize: '0.925rem' }}>
                    {truncated}...{' '}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => setIsArticleExpanded(true)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsArticleExpanded(true)}
                      style={{ color: '#94a3b8', fontWeight: 600, cursor: 'pointer', marginLeft: '4px' }}
                    >
                      See More
                    </span>
                  </p>
                )
              }

              const paragraphs = articleContent
                .split(/(?:\r?\n\s*){2,}/)
                .map((p) => p.trim())
                .filter((p) => p.length > 0)

              return (
                <div style={{ marginTop: '0.75rem' }}>
                  {paragraphs.map((para, index) => {
                    const isLast = index === paragraphs.length - 1

                    return (
                      <p
                        key={index}
                        style={{
                          margin: index === 0 ? 0 : '0.875rem 0 0',
                          color: '#cbd5e1',
                          lineHeight: 1.7,
                          fontSize: '0.925rem',
                        }}
                      >
                        {para.replace(/\n+/g, ' ')}{' '}
                        {isLast && isLong && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() => setIsArticleExpanded(false)}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsArticleExpanded(false)}
                            style={{ color: '#94a3b8', fontWeight: 600, cursor: 'pointer', marginLeft: '8px' }}
                          >
                            See Less
                          </span>
                        )}
                      </p>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>

        {/* ═══ RIGHT SIDEBAR (360px): Instruments + Quiz ═══ */}
        <div className="se-right-col">
          {/* Featured Instruments */}
          <div className="section-card">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontSize: '1.05rem' }}>
              <Music2 className="w-5 h-5 text-violet-400" />
              Featured Heritage Instruments
            </h3>

            {Array.isArray(song.instruments) && song.instruments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1rem' }}>
                {(song.instruments || []).slice(0, 5).map((inst) => {
                  const isInstPlaying = playingInstrumentId === inst.id
                  const hubMatch = LEARNING_HUB_INSTRUMENTS.find(
                    (h) => h.name.toLowerCase() === (inst.name || '').toLowerCase() || h.id === inst.id
                  )
                  const iconImage = inst.imageUrl || inst.iconUrl
                  const iconEmoji = hubMatch?.icon || '🎵'
                  const displayOrigin = (inst.origin || inst.culture || '').split(',')[0].trim()

                  return (
                    <div
                      key={inst.id}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: isInstPlaying ? '1px solid var(--violet)' : '1px solid var(--line)',
                        background: isInstPlaying ? 'rgba(124, 58, 237, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {iconImage ? (
                        <img
                          src={iconImage}
                          alt={inst.name}
                          style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            flexShrink: 0,
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                          }}
                        >
                          {iconEmoji}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#f8fafc',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={inst.name}
                        >
                          {inst.name}
                        </h4>
                        {displayOrigin && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#818cf8',
                              fontWeight: 500,
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {displayOrigin}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlayInstrument(inst)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isInstPlaying ? 'var(--violet)' : 'var(--muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                        title={isInstPlaying ? 'Stop Instrument' : 'Hear Instrument'}
                      >
                        {isInstPlaying ? <Square size={18} fill="currentColor" /> : <PlayCircle size={18} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.75rem' }}>
                No heritage instruments currently associated with this song.
              </p>
            )}
          </div>

          {/* Knowledge Check */}
          <div className="section-card">
            <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Knowledge Check
            </h3>

            {triviaList.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                No trivia questions available for this song yet.
              </p>
            ) : quizCompleted ? (
              <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: 'var(--green)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                  }}
                >
                  ✓
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: '#f8fafc' }}>Quiz Completed!</h4>
                  <p style={{ margin: 0, color: 'var(--muted)' }}>
                    You scored {score} out of {triviaList.length}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuizCompleted(false)
                    setQuestionIndex(0)
                    setScore(0)
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Retake Quiz
                </button>
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 0.5rem', color: 'var(--violet)', fontSize: '0.75rem', fontWeight: 600 }}>
                  Question {questionIndex + 1} of {triviaList.length}
                </p>
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', lineHeight: 1.5, color: '#f8fafc' }}>
                  {currentQuestion?.prompt}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentOptions.map((opt) => {
                    const isSelected = selectedAnswer === opt.id
                    const isCorrect = opt.rawValue === currentQuestion.correctAnswer

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAnswerClick(opt)}
                        disabled={selectedAnswer !== null}
                        style={optionStyle(opt)}
                      >
                        {selectedAnswer !== null ? (
                          (isSelected && isCorrect) || (!isSelected && isCorrect) ? (
                            <span style={{ color: 'var(--green)', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
                          ) : isSelected && !isCorrect ? (
                            <span style={{ color: 'var(--error)', fontSize: '1.1rem', fontWeight: 'bold' }}>✕</span>
                          ) : (
                            <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--line)', display: 'inline-block', flexShrink: 0 }} />
                          )
                        ) : (
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--muted)', display: 'inline-block', flexShrink: 0 }} />
                        )}
                        <span>
                          {opt.id}. {opt.text}
                        </span>
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
      >
        Take a Lesson in the Learning Hub →
      </Link>
    </div>
  )
}
