import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PlayCircle, Square } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import useInstrumentAudio from '../hooks/useInstrumentAudio'
import { getPublishedSong } from '../services/publicSongService'
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
  instruments: [
    {
      description: 'A bamboo instrument shaken to produce a note, traditionally played together in ensembles where each person holds just one pitch.',
      envelope: 'sustained',
      facts: {
        contribution: "A symbol of teamwork and harmony within Singapore's Malay community.",
        historicalFact: 'In 2010, UNESCO recognised the angklung as an Intangible Cultural Heritage of Humanity.',
        origin: 'Rooted in Malay and Indonesian-Malay musical traditions of Southeast Asia.',
        role: 'Each angklung produces one note; players work together to create a melody.',
        whenPlayed: 'Featured in school performances, cultural festivals, and community events.',
      },
      icon: '🎋',
      id: 'angklung',
      melody: ['C4', 'D4', 'F4', 'G4', 'A4', 'G4', 'F4'],
      name: 'Angklung',
      notes: [
        { frequency: 261.63, key: 'a', label: 'C4' },
        { frequency: 293.66, key: 's', label: 'D4' },
        { frequency: 349.23, key: 'd', label: 'F4' },
        { frequency: 392, key: 'f', label: 'G4' },
        { frequency: 440, key: 'g', label: 'A4' },
      ],
      origin: 'Malay heritage, Southeast Asia',
      waveform: 'triangle',
    },
    {
      description: 'A handheld frame drum played in lively ensembles at Malay weddings and festive processions.',
      envelope: 'percussive',
      facts: {
        contribution: "Brings energetic, communal rhythm to Singapore's multicultural celebrations.",
        historicalFact: 'Kompang ensembles traditionally perform to welcome a wedding couple as they arrive.',
        origin: 'A Malay hand drum found across Singapore, Malaysia, and Indonesia.',
        role: 'Played in rhythmic ensembles, often accompanying songs and processions.',
        whenPlayed: 'Weddings, National Day performances, and community celebrations.',
      },
      icon: '🥁',
      id: 'kompang',
      melody: ['Low', 'Mid', 'High', 'Slap', 'Mid', 'Low'],
      name: 'Kompang',
      notes: [
        { frequency: 110, key: 'a', label: 'Low' },
        { frequency: 146.83, key: 's', label: 'Mid' },
        { frequency: 196, key: 'd', label: 'High' },
        { frequency: 246.94, key: 'f', label: 'Slap' },
      ],
      origin: 'Malay heritage, Southeast Asia',
      waveform: 'square',
    },
    {
      description: 'A two-stringed bowed instrument known for its expressive, voice-like tone in Chinese music.',
      envelope: 'sustained',
      facts: {
        contribution: "Represents the Chinese community's musical heritage within Singapore's soundscape.",
        historicalFact: 'The erhu has only two strings, yet skilled players can mimic laughter, crying, and even birdsong.',
        origin: 'Originated in China over a thousand years ago.',
        role: 'Often carries the main melody, prized for its expressive, voice-like sound.',
        whenPlayed: 'Chinese orchestras, festivals, and Chinese New Year performances.',
      },
      icon: '🎻',
      id: 'erhu',
      melody: ['G4', 'B4', 'D5', 'E5', 'D5', 'B4', 'G4'],
      name: 'Erhu',
      notes: [
        { frequency: 392, key: 'a', label: 'G4' },
        { frequency: 440, key: 's', label: 'A4' },
        { frequency: 493.88, key: 'd', label: 'B4' },
        { frequency: 523.25, key: 'f', label: 'C5' },
        { frequency: 587.33, key: 'g', label: 'D5' },
        { frequency: 659.25, key: 'h', label: 'E5' },
      ],
      origin: 'Chinese heritage',
      waveform: 'sawtooth',
    },
    {
      description: 'A pair of hand drums central to Indian classical and devotional music, played with intricate finger and palm strokes.',
      envelope: 'percussive',
      facts: {
        contribution: "Adds the rhythmic heartbeat of Singapore's Indian community to its musical identity.",
        historicalFact: "Tabla players learn spoken rhythmic syllables, called 'bols', before ever touching the drums.",
        origin: 'A cornerstone of North Indian classical music.',
        role: 'Provides intricate rhythmic patterns that anchor a performance.',
        whenPlayed: 'Indian classical concerts, Deepavali celebrations, and devotional music.',
      },
      icon: '🪘',
      id: 'tabla',
      melody: ['Dha', 'Ge', 'Na', 'Tin', 'Na', 'Dha'],
      name: 'Tabla',
      notes: [
        { frequency: 130.81, key: 'a', label: 'Dha' },
        { frequency: 164.81, key: 's', label: 'Ge' },
        { frequency: 196, key: 'd', label: 'Na' },
        { frequency: 261.63, key: 'f', label: 'Tin' },
      ],
      origin: 'Indian heritage, South Asia',
      waveform: 'sine',
    },
  ],
  trivia: [
    {
      question: "Which band performed the 2016 NDP theme song 'Tomorrow's Here Today'?",
      options: [
        { id: 'A', text: 'The Sam Willows' },
        { id: 'B', text: '53A' },
        { id: 'C', text: 'Electrico' },
        { id: 'D', text: 'ShiGGa Shay' },
      ],
      correctAnswerId: 'B',
    },
    {
      question: 'Who wrote and composed the song?',
      options: [
        { id: 'A', text: 'Dick Lee' },
        { id: 'B', text: 'Don Richmond' },
        { id: 'C', text: 'JJ Lin' },
        { id: 'D', text: 'Corrinne May' },
      ],
      correctAnswerId: 'B',
    },
    {
      question: 'What is the core message of the song?',
      options: [
        { id: 'A', text: 'Reflecting on past struggles' },
        { id: 'B', text: 'Looking forward to a bright future' },
        { id: 'C', text: 'A romantic love story' },
        { id: 'D', text: 'Celebrating traditional food' },
      ],
      correctAnswerId: 'B',
    },
    {
      question: 'Which music genre best describes the track?',
      options: [
        { id: 'A', text: 'Classical Orchestra' },
        { id: 'B', text: 'Indie Pop/Rock' },
        { id: 'C', text: 'Heavy Metal' },
        { id: 'D', text: 'Electronic Dance Music' },
      ],
      correctAnswerId: 'B',
    },
    {
      question: "What year was 'Tomorrow's Here Today' used for the National Day Parade?",
      options: [
        { id: 'A', text: '2014' },
        { id: 'B', text: '2015' },
        { id: 'C', text: '2016' },
        { id: 'D', text: '2017' },
      ],
      correctAnswerId: 'C',
    },
  ],
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function SongExperience() {
  const { id = 'demo-song' } = useParams()
  
  const [dbSong, setDbSong] = useState(null)
  const [loadingDbSong, setLoadingDbSong] = useState(id !== 'demo-song')
  const [dbError, setDbError] = useState('')

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

  const songData = dbSong ? {
    ...MOCK_SONG_DATA,
    title: dbSong.title || MOCK_SONG_DATA.title,
    artist: dbSong.artist || MOCK_SONG_DATA.artist,
    videoUrl: dbSong.videoUrl || MOCK_SONG_DATA.videoUrl,
    culturalSummary: dbSong.description || MOCK_SONG_DATA.culturalSummary,
    coverImageUrl: dbSong.coverImageUrl || undefined,
  } : MOCK_SONG_DATA

  // Video state
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

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

    // pause main video if it's playing
    if (isPlaying) {
      videoRef.current?.pause()
      setIsPlaying(false)
    }
    
    setPlayingInstrumentId(instrument.id)
    // Mimic the sequence logic from InstrumentPlayer
    instrument.melody.forEach((noteLabel, index) => {
      const note = instrument.notes.find((candidate) => candidate.label === noteLabel)
      if (!note) return
      
      const timeoutId = setTimeout(() => {
        playNote(instrument, note)
        
        // Clear active state when the melody finishes
        if (index === instrument.melody.length - 1) {
          const resetTimeout = setTimeout(() => {
            setPlayingInstrumentId((currentId) => currentId === instrument.id ? null : currentId)
          }, 500)
          melodyTimeouts.current.push(resetTimeout)
        }
      }, index * 260)
      
      melodyTimeouts.current.push(timeoutId)
    })
  }

  const currentQuestion = songData.trivia[questionIndex]

  async function togglePlay() {
    if (!videoRef.current) return
    if (!videoRef.current.paused) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        await videoRef.current.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      }
    }
  }

  function handleSeek(e) {
    const t = Number(e.target.value)
    if (!videoRef.current || !Number.isFinite(t)) return
    videoRef.current.currentTime = t
    setCurrentTime(t)
  }

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
            <div style={{ position: 'relative', width: '100%' }}>
              <video
                ref={videoRef}
                src={songData.videoUrl}
                playsInline
                onClick={togglePlay}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); setCurrentTime(0) }}
                onEnded={() => { setIsPlaying(false); setCurrentTime(0) }}
                onPause={() => setIsPlaying(false)}
                onPlay={() => {
                  setIsPlaying(true)
                  stopSyntheticMelody()
                }}
                style={{ display: 'block', width: '100%', aspectRatio: '16/9', objectFit: 'cover', cursor: 'pointer', background: '#000' }}
              />
            </div>

            {/* Controls Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderTop: '1px solid var(--line)', background: 'var(--panel)', fontSize: '0.8rem' }}>
              {/* Play */}
              <button onClick={togglePlay} style={iconBtnStyle}>
                {isPlaying ? pauseIcon : playIcon}
              </button>
              {/* Volume */}
              <button style={iconBtnStyle}>{volumeIcon}</button>
              {/* Time */}
              <span style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
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
                style={{ flex: 1, accentColor: 'var(--violet)', cursor: 'pointer' }}
              />
              {/* CC */}
              <button style={iconBtnStyle} title="Captions burned into video">{ccIcon}</button>
              {/* Fullscreen */}
              <button
                onClick={() => {
                  if (!document.fullscreenElement) videoRef.current?.requestFullscreen()
                  else document.exitFullscreen()
                }}
                style={iconBtnStyle}
              >
                {fullscreenIcon}
              </button>
            </div>
          </div>

          {/* Title + Tags (below player) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{songData.title}</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
              {songData.artist} · {songData.year} · {songData.location}
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
                return (
                  <button
                    key={i}
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
                    <span style={{ fontSize: '2rem' }}>{inst.icon}</span>
                    <span>{inst.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Knowledge Check */}
          <div className="section-card">
            {quizCompleted ? (
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

/* ── Inline SVG icons (avoiding Lucide dependency issues) ── */

const iconBtnStyle = {
  background: 'none',
  border: 'none',
  padding: '4px',
  cursor: 'pointer',
  color: 'var(--muted)',
  display: 'flex',
  alignItems: 'center',
}

const playIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
)
const pauseIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
)
const volumeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
)
const ccIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h4m-4-3h2m6 3h2m-4-3h4"/></svg>
)
const fullscreenIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
)
