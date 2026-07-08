import { useRef, useState } from 'react'
import LessonCard from '../components/lessons/LessonCard'
import LessonPlayer from '../components/lessons/LessonPlayer'
import Reveal from '../components/Reveal'

/*
TODO - Shermaine

The note sequences below are simplified, illustrative arrangements written for this
learning demo — not verbatim transcriptions of the real songs. Replace with an
accurate arrangement (and real recordings, see hooks/useInstrumentAudio.js) when
available.
Build out "Home" and "Stand Up for Singapore" the same way once ready.
*/

const notePool = [
  { frequency: 261.63, label: 'C4' },
  { frequency: 293.66, label: 'D4' },
  { frequency: 329.63, label: 'E4' },
  { frequency: 349.23, label: 'F4' },
  { frequency: 392, label: 'G4' },
  { frequency: 440, label: 'A4' },
]

const lessons = [
  {
    description: 'A beloved anthem of unity — learn its opening phrase, chorus motif, and closing line.',
    difficulty: 'Beginner',
    duration: '10 min',
    icon: '🎵',
    id: 'count-on-me',
    isBuilt: true,
    sections: [
      {
        insight: {
          demoSequence: ['C4', 'D4', 'E4', 'F4', 'G4'],
          explanation: 'Notice how each note feels bright and resolved — that upward, hopeful feeling comes from a major scale.',
          icon: '🎵',
          prompt: 'Why does this melody sound uplifting?',
        },
        notes: notePool,
        sequence: ['C4', 'C4', 'D4', 'E4'],
        title: 'Opening Phrase',
      },
      {
        insight: {
          chord: ['C4', 'E4', 'G4'],
          explanation: 'Play C, E, and G together and you get a warm, complete-sounding chord — the foundation beneath this phrase.',
          icon: '🎹',
          prompt: 'These notes form a chord.',
        },
        notes: notePool,
        sequence: ['G4', 'A4', 'G4', 'E4', 'C4'],
        title: 'Chorus Motif',
      },
      {
        insight: {
          demoSequence: ['E4', 'F4', 'G4', 'G4'],
          explanation: "This closing rhythm echoes a pattern from earlier in the song — repetition is what makes a melody feel familiar.",
          icon: '🥁',
          prompt: 'Notice the repeating rhythm pattern.',
        },
        notes: notePool,
        sequence: ['E4', 'F4', 'G4', 'G4'],
        title: 'Closing Phrase',
      },
    ],
    title: 'Count On Me, Singapore',
  },
  {
    description: 'A heartfelt tribute to Singapore as home, written by Dick Lee.',
    difficulty: 'Intermediate',
    icon: '🎵',
    id: 'home',
    isBuilt: false,
    title: 'Home',
  },
  {
    description: 'A rousing march that calls on every Singaporean to stand up for the nation.',
    difficulty: 'Intermediate',
    icon: '🎵',
    id: 'stand-up-for-singapore',
    isBuilt: false,
    title: 'Stand Up for Singapore',
  },
]

export default function GuidedMusicLessons() {
  const [selectedLessonId, setSelectedLessonId] = useState(null)
  const libraryRef = useRef(null)

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId)

  function handleStartLearning() {
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleSelectLesson(id) {
    setSelectedLessonId(id)
    window.scrollTo({ behavior: 'smooth', top: 0 })
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

      {selectedLesson ? (
        <LessonPlayer lesson={selectedLesson} onBack={() => setSelectedLessonId(null)} />
      ) : (
        <section className="lesson-library" id="lesson-library" ref={libraryRef}>
          <Reveal as="div" className="learning-section-heading">
            <h2>The Lesson Library</h2>
            <p>Pick a song to begin — completed lessons stay open for you to replay anytime.</p>
          </Reveal>

          <div className="lesson-library__grid">
            {lessons.map((lesson, index) => (
              <Reveal delay={index * 80} key={lesson.id}>
                <LessonCard lesson={lesson} onSelect={handleSelectLesson} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
