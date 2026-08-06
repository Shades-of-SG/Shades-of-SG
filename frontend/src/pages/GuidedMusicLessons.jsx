import { useRef, useState } from 'react'
import DifficultyPicker from '../components/lessons/DifficultyPicker'
import InstrumentPicker from '../components/lessons/InstrumentPicker'
import LessonPlayer from '../components/lessons/LessonPlayer'
import Reveal from '../components/Reveal'
import SongCard from '../components/lessons/SongCard'
import { SONGS, getSongById } from '../data/songs'
import useLabInstruments from '../hooks/useLabInstruments'

// The guided lesson flow is a strictly linear 4-stage machine:
// instrument -> song -> difficulty -> lesson. Each stage's data comes from
// the previous choice; going back is just a fixed prior-stage map, no
// history stack needed. Songs (data/songs.js) and instruments
// (data/instruments.js) are both plain data modules the page merely reads
// from — adding song #8 or instrument #6 never requires touching this file.
export default function GuidedMusicLessons() {
  const [stage, setStage] = useState('instrument')
  const [instrumentId, setInstrumentId] = useState(null)
  const [songId, setSongId] = useState(null)
  const [difficultyKey, setDifficultyKey] = useState(null)
  const stageRef = useRef(null)

  const instruments = useLabInstruments()
  const instrument = instruments.find((candidate) => candidate.id === instrumentId)
  const song = getSongById(songId)

  function goToStage(nextStage) {
    setStage(nextStage)
    window.scrollTo({ behavior: 'smooth', top: 0 })
  }

  function handleStartLearning() {
    stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleSelectInstrument(id) {
    setInstrumentId(id)
    goToStage('song')
  }

  function handleSelectSong(id) {
    setSongId(id)
    goToStage('difficulty')
  }

  function handleSelectDifficulty(key) {
    setDifficultyKey(key)
    goToStage('lesson')
  }

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <p className="lesson-hero__badge">Guided Music Lessons</p>
        <h1>Music Brings People Together</h1>
        <p className="lesson-hero__intro">
          Learn to play iconic National Day songs while discovering the musical ideas behind
          them through interactive practice.
        </p>
        <button className="lesson-hero__cta" onClick={handleStartLearning} type="button">
          Start Learning <span aria-hidden="true">↓</span>
        </button>
      </section>

      <div id="lesson-library" ref={stageRef}>
        {stage === 'instrument' && <InstrumentPicker onSelect={handleSelectInstrument} />}

        {stage === 'song' && (
          <section aria-label="Choose a song" className="lesson-library">
            <button className="lesson-player__back" onClick={() => goToStage('instrument')} type="button">
              <span aria-hidden="true">←</span> Back to Instruments
            </button>

            <Reveal as="div" className="learning-section-heading">
              <h2>Choose a Song</h2>
              <p>Pick a song to begin — completed lessons stay open for you to replay anytime.</p>
            </Reveal>

            <div className="lesson-library__grid">
              {SONGS.map((candidate, index) => (
                <Reveal delay={index * 80} key={candidate.id}>
                  <SongCard onSelect={handleSelectSong} song={candidate} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {stage === 'difficulty' && song && (
          <DifficultyPicker onBack={() => goToStage('song')} onSelect={handleSelectDifficulty} song={song} />
        )}

        {stage === 'lesson' && song && instrument && difficultyKey && (
          <LessonPlayer
            difficultyKey={difficultyKey}
            instrument={instrument}
            onBack={() => goToStage('difficulty')}
            song={song}
          />
        )}
      </div>
    </div>
  )
}
