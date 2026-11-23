import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PlayCircle, Square, Loader2, AlertCircle, Sparkles, BookOpen, Music2, Check, ChevronRight, X } from 'lucide-react'
import CustomVideoPlayer from '../components/shared/CustomVideoPlayer'
import useInstrumentAudio from '../hooks/useInstrumentAudio'
import useLabInstruments from '../hooks/useLabInstruments'
import { getPublishedSong } from '../services/publicSongService'
import { trackAnalyticsEvent } from '../services/analyticsService'
import { useAuth } from '../context/AuthContext'
import './SongExperience.css'

export default function SongExperience() {
  const { id } = useParams()
  const { token } = useAuth()

  const labInstruments = useLabInstruments()
  const { playNote } = useInstrumentAudio()

  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Video playback & synthetic melody state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isArticleExpanded, setIsArticleExpanded] = useState(false)

  // Trivia state
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)

  // Instrument audio state
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
        trackAnalyticsEvent('SONG_PAGE_VIEWED', { songId: data.id }, token).catch(() => {})
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
  }, [id, token])

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
    const instKey = inst.id || inst.name
    if (playingInstrumentId === instKey) {
      stopAudioPlayback()
      return
    }

    stopAudioPlayback()
    setIsPlaying(false)
    setPlayingInstrumentId(instKey)

    // Hydrate target instrument with notes & melody definitions from labInstruments
    const labMatch = labInstruments.find(
      (l) => l.name.toLowerCase() === (inst.name || '').toLowerCase() || l.id === inst.id
    )
    const targetInst = { ...(labMatch || {}), ...inst }

    if (targetInst.notes && targetInst.notes.length > 0) {
      playNote(targetInst, targetInst.notes[0])
      const resetTimeout = setTimeout(() => {
        setPlayingInstrumentId((currentId) => (currentId === instKey ? null : currentId))
      }, 1200)
      melodyTimeouts.current.push(resetTimeout)
    } else if (targetInst.sampleUrl || targetInst.audioUrl) {
      const audio = new Audio(targetInst.sampleUrl || targetInst.audioUrl)
      activeAudioRef.current = audio
      audio.play().catch((err) => console.error('Instrument playback failed:', err))
      audio.onended = () => {
        setPlayingInstrumentId(null)
        activeAudioRef.current = null
      }
    } else {
      playNote(targetInst || {}, { frequency: 440, key: 'a', label: 'A4' })
      const resetTimeout = setTimeout(() => {
        setPlayingInstrumentId((currentId) => (currentId === instKey ? null : currentId))
      }, 1000)
      melodyTimeouts.current.push(resetTimeout)
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

  function optionClassName(opt) {
    if (selectedAnswer === null) return 'se-quiz-option'

    const isCorrect = opt.rawValue === currentQuestion.correctAnswer
    const isSelected = opt.id === selectedAnswer

    if (isSelected && isCorrect) return 'se-quiz-option is-correct'
    if (isSelected && !isCorrect) return 'se-quiz-option is-wrong'
    if (!isSelected && isCorrect) return 'se-quiz-option is-missed-correct'
    return 'se-quiz-option is-dimmed'
  }

  return (
    <div className="page-stack se-page">
      {/* ─── Vertical / Studio Grid (Main 1fr + Sidebar 360px) ─── */}
      <div className="song-experience-layout">
        {/* ═══ LEFT MAIN COLUMN (1fr): Video + Title + About ═══ */}
        <div className="se-left-col">
          {/* Custom Video Player */}
          <div className="section-card se-video-frame">
            <CustomVideoPlayer
              onPause={() => setIsPlaying(false)}
              onPlay={() => {
                setIsPlaying(true)
                stopAudioPlayback()
                trackAnalyticsEvent('SONG_PLAYBACK_STARTED', { songId: song.id }, token).catch(() => {})
              }}
              poster={song.coverImageUrl}
              src={song.videoUrl || song.audioUrl}
              transcriptionSegments={song.transcriptionSegments}
            />
          </div>

          {/* Title + Metadata Tags */}
          <div className="se-meta">
            <h1 className="se-meta__title">{song.title}</h1>
            <p className="se-meta__byline">
              <span>{song.artist || 'Singapore Artist'}</span> · {songYear} · Singapore
            </p>
            <div className="se-tags">
              {moodTags.map((tag, i) => (
                <span className="se-tag" key={i}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* About This Song & Cultural Story */}
          <div className="section-card">
            <h3 className="se-section-heading">
              <Sparkles aria-hidden="true" className="se-icon--amber" size={20} />
              About This Song & Cultural Story
            </h3>
            {(() => {
              const articleContent = song.aiSummary || song.description || ''
              if (!articleContent.trim()) {
                return (
                  <p className="se-story-copy se-story-copy--muted">
                    No cultural summary has been added for this song yet.
                  </p>
                )
              }

              const cleanText = articleContent.replace(/\s+/g, ' ').trim()
              const isLong = cleanText.length > 350

              if (!isArticleExpanded && isLong) {
                const truncated = cleanText.slice(0, 350).replace(/\s+\S*$/, '')
                return (
                  <p className="se-story-copy">
                    {truncated}...{' '}
                    <button
                      className="se-story-toggle"
                      onClick={() => setIsArticleExpanded(true)}
                      type="button"
                    >
                      See More
                    </button>
                  </p>
                )
              }

              const paragraphs = articleContent
                .split(/(?:\r?\n\s*){2,}/)
                .map((p) => p.trim())
                .filter((p) => p.length > 0)

              return (
                <div className="se-story-stack">
                  {paragraphs.map((para, index) => {
                    const isLast = index === paragraphs.length - 1

                    return (
                      <p className="se-story-copy" key={index}>
                        {para.replace(/\n+/g, ' ')}{' '}
                        {isLast && isLong && (
                          <button
                            className="se-story-toggle"
                            onClick={() => setIsArticleExpanded(false)}
                            type="button"
                          >
                            See Less
                          </button>
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
            <h3 className="se-section-heading">
              <Music2 aria-hidden="true" className="se-icon--violet" size={20} />
              Featured Heritage Instruments
            </h3>

            {(() => {
              const rawSongInstruments =
                song?.instruments && Array.isArray(song.instruments)
                  ? song.instruments
                  : song?.SongInstruments && Array.isArray(song.SongInstruments)
                  ? song.SongInstruments.map((si) => si.Instrument).filter(Boolean)
                  : null

              const hydratedSongInstruments = (rawSongInstruments || []).map((rawInst) => {
                const labMatch = labInstruments.find(
                  (lab) => lab.id === rawInst.id || lab.name?.toLowerCase() === rawInst.name?.toLowerCase()
                )
                return {
                  ...rawInst,
                  ...(labMatch || {}),
                }
              })

              const hasDbRecord = rawSongInstruments !== null
              const finalInstruments = hasDbRecord ? hydratedSongInstruments : []

              const displayInstruments = Array.from(
                new Map(finalInstruments.map((inst) => [inst.name?.toLowerCase() || inst.id, inst])).values()
              )

              return displayInstruments.length > 0 ? (
                <div className="se-instruments-list">
                  {displayInstruments.slice(0, 5).map((inst) => {
                    const instKey = inst.id || inst.name
                    const isInstPlaying = playingInstrumentId === instKey
                    const iconImage = inst.imageUrl || inst.iconUrl
                    const displayOrigin = (inst.origin || inst.culture || '').split(',')[0].trim()

                    return (
                      <div
                        className={`se-instrument-row${isInstPlaying ? ' is-playing' : ''}`}
                        key={instKey}
                      >
                        {iconImage ? (
                          <img
                            alt={inst.name}
                            className="se-instrument-thumb"
                            src={iconImage}
                          />
                        ) : (
                          <div aria-hidden="true" className="se-instrument-thumb se-instrument-thumb--fallback">
                            <Music2 size={18} />
                          </div>
                        )}

                        <div className="se-instrument-info">
                          <h4 title={inst.name}>
                            {inst.name}
                          </h4>
                          {displayOrigin && (
                            <span className="se-instrument-origin">
                              {displayOrigin}
                            </span>
                          )}
                        </div>

                        <button
                          aria-label={isInstPlaying ? `Stop ${inst.name}` : `Play ${inst.name} sample`}
                          className={`se-instrument-play${isInstPlaying ? ' is-playing' : ''}`}
                          onClick={() => handlePlayInstrument(inst)}
                          title={isInstPlaying ? 'Stop Instrument' : 'Play Sample'}
                          type="button"
                        >
                          {isInstPlaying ? <Square fill="currentColor" size={18} /> : <PlayCircle size={20} />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="se-story-copy se-story-copy--muted">
                  No heritage instruments currently associated with this song.
                </p>
              )
            })()}
          </div>

          {/* Knowledge Check */}
          <div className="section-card">
            <h3 className="se-section-heading se-section-heading--quiz">
              <BookOpen aria-hidden="true" className="se-icon--indigo" size={20} />
              Knowledge Check
            </h3>

            {triviaList.length === 0 ? (
              <p className="se-story-copy se-story-copy--muted">
                No trivia questions available for this song yet.
              </p>
            ) : quizCompleted ? (
              <div className="se-quiz-complete">
                <div aria-hidden="true" className="se-quiz-complete__badge">
                  <Check size={28} />
                </div>
                <div>
                  <h4>Quiz Completed!</h4>
                  <p>
                    You scored {score} out of {triviaList.length}
                  </p>
                </div>
                <button
                  className="se-quiz-retake"
                  onClick={() => {
                    setQuizCompleted(false)
                    setQuestionIndex(0)
                    setScore(0)
                  }}
                  type="button"
                >
                  Retake Quiz
                </button>
              </div>
            ) : (
              <>
                <p className="se-quiz-progress">
                  Question {questionIndex + 1} of {triviaList.length}
                </p>
                <h4 className="se-quiz-prompt">
                  {currentQuestion?.prompt}
                </h4>
                <div className="se-quiz-options">
                  {currentOptions.map((opt) => {
                    const isSelected = selectedAnswer === opt.id
                    const isCorrect = opt.rawValue === currentQuestion.correctAnswer

                    return (
                      <button
                        className={optionClassName(opt)}
                        disabled={selectedAnswer !== null}
                        key={opt.id}
                        onClick={() => handleAnswerClick(opt)}
                        type="button"
                      >
                        {selectedAnswer !== null ? (
                          (isSelected && isCorrect) || (!isSelected && isCorrect) ? (
                            <Check aria-hidden="true" className="se-icon--green" size={18} />
                          ) : isSelected && !isCorrect ? (
                            <X aria-hidden="true" className="se-icon--red" size={18} />
                          ) : (
                            <span aria-hidden="true" className="se-quiz-dot" />
                          )
                        ) : (
                          <span aria-hidden="true" className="se-quiz-dot" />
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
      <Link className="se-lessons-cta" to="/learning">
        <div className="se-lessons-cta__main">
          <div aria-hidden="true" className="se-lessons-cta__icon">
            <BookOpen className="se-icon--violet" size={22} />
          </div>
          <div>
            <h4>
              Guided Heritage Lessons
            </h4>
            <p>
              Explore interactive instrument sequences in the Learning Hub
            </p>
          </div>
        </div>

        <span className="se-lessons-cta__action">
          Take a Lesson <ChevronRight aria-hidden="true" size={18} />
        </span>
      </Link>
    </div>
  )
}
