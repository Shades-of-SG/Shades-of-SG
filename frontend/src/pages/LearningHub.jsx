import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import useReveal from '../hooks/useReveal'

const milestones = [
  {
    description: 'On 9 August 1965, Singapore became a sovereign nation — the day modern Singapore was born.',
    icon: '🇸🇬',
    title: 'Singapore Gains Independence',
    year: '1965',
  },
  {
    description: 'A year later, the first National Day Parade brought citizens together to celebrate unity and pride.',
    icon: '🎉',
    title: 'First National Day Parade',
    year: '1966',
  },
  {
    description: 'Chinese, Malay, Indian, and other communities wove their traditions into one shared national identity.',
    icon: '🤝',
    title: 'A Multicultural Identity Grows',
    year: '1970s–80s',
  },
  {
    description: 'Anthems like "Stand Up for Singapore" turned celebration into song, uniting generations through music.',
    icon: '🎶',
    title: 'National Day Songs Take Root',
    year: '1980s–90s',
  },
  {
    description: 'Every August, Singaporeans continue to honour this journey through parades, music, and shared memory.',
    icon: '🏙️',
    title: 'A Nation Still Growing',
    year: 'Today',
  },
]

const learningModules = [
  {
    cta: 'Explore',
    description: "Discover how Singapore's journey shaped today's National Day celebrations.",
    icon: '🏛️',
    id: 'explorer',
    title: 'The Heritage Vault',
    to: '/learning/heritage-vault',
  },
  {
    cta: 'Discover',
    description: "Listen to and interact with traditional instruments from Singapore's multicultural heritage.",
    icon: '🥁',
    id: 'playground',
    title: 'Instrument Discovery Lab',
    to: '/learning/instrument-lab',
  },
  {
    cta: 'Start Learning',
    description: 'Learn to perform iconic National Day songs with guided lessons.',
    icon: '🎼',
    id: 'lessons',
    title: 'Guided Music Lessons',
    to: '/learning/guided-lessons',
  },
]

const funFacts = [
  "Singapore's National Day is celebrated on 9 August every year.",
  '"Majulah Singapura", the national anthem, means "Onward Singapore" in Malay.',
  'The National Day Parade has been held at the Padang, Marina Bay, and the National Stadium over the years.',
  'Singapore has four official languages: English, Malay, Mandarin, and Tamil.',
  '"Home", one of the best-loved National Day songs, was written by Singaporean singer-songwriter Dick Lee.',
]

const quizQuestions = [
  {
    correctIndex: 2,
    explanation: 'Singapore became an independent nation on 9 August 1965.',
    options: ['1959', '1963', '1965', '1971'],
    question: 'When did Singapore gain independence?',
  },
  {
    correctIndex: 0,
    explanation: '"Majulah Singapura" is Malay for "Onward Singapore".',
    options: ['Onward Singapore', 'United We Stand', 'Rise Singapore', 'Forward Together'],
    question: 'What does the national anthem "Majulah Singapura" mean?',
  },
  {
    correctIndex: 2,
    explanation: "Singapore's four official languages are English, Malay, Mandarin, and Tamil.",
    options: ['2', '3', '4', '5'],
    question: 'How many official languages does Singapore have?',
  },
  {
    correctIndex: 1,
    explanation: 'The first National Day Parade was held in 1966, a year after independence.',
    options: ['1965', '1966', '1968', '1970'],
    question: 'What year was the first National Day Parade held?',
  },
  {
    correctIndex: 0,
    explanation: 'Dick Lee wrote "Home", one of Singapore\'s best-loved National Day songs.',
    options: ['Dick Lee', 'JJ Lin', 'Kit Chan', 'Stefanie Sun'],
    question: 'Who wrote the National Day song "Home"?',
  },
]

function TimelineItem({ index, isOpen, milestone, onToggle }) {
  const panelId = `timeline-panel-${index}`
  const { isVisible, nodeRef } = useReveal()

  return (
    <li
      className={`learning-timeline__item reveal ${isVisible ? 'is-visible' : ''} ${isOpen ? 'is-open' : ''}`}
      ref={nodeRef}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <span className="learning-timeline__icon" aria-hidden="true">{milestone.icon}</span>

      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="learning-timeline__toggle"
        onClick={() => onToggle(index)}
        type="button"
      >
        <span className="learning-timeline__year">{milestone.year}</span>
        <span className="learning-timeline__title">{milestone.title}</span>
        <span className="learning-timeline__chevron" aria-hidden="true">{isOpen ? '−' : '+'}</span>
      </button>

      <div className={`learning-timeline__body ${isOpen ? 'is-open' : ''}`} id={panelId}>
        <div className="learning-timeline__body-inner">
          <p>{milestone.description}</p>
        </div>
      </div>
    </li>
  )
}

function ModuleCard({ module }) {
  return (
    <article className="learning-module-card">
      <span className="learning-module-card__icon" aria-hidden="true">{module.icon}</span>
      <h3>{module.title}</h3>
      <p>{module.description}</p>
      {module.to ? (
        <Link className="learning-module-card__cta" to={module.to}>{module.cta}</Link>
      ) : (
        <button className="learning-module-card__cta" type="button">{module.cta}</button>
      )}
    </article>
  )
}

export default function LearningHub() {
  const [openMilestones, setOpenMilestones] = useState(() => new Set([0]))
  const [factIndex, setFactIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [quizChoice, setQuizChoice] = useState(null)
  const timelineRef = useRef(null)
  const currentQuestion = quizQuestions[questionIndex]

  function toggleMilestone(index) {
    setOpenMilestones((current) => {
      const next = new Set(current)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  function handleBeginExploring() {
    timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleNextFact() {
    setFactIndex((current) => (current + 1) % funFacts.length)
  }

  function handleQuizChoice(index) {
    setQuizChoice(index)
  }

  function handleQuizRetry() {
    setQuizChoice(null)
  }

  function handleNextQuestion() {
    setQuestionIndex((current) => (current + 1) % quizQuestions.length)
    setQuizChoice(null)
  }

  return (
    <div className="learning-hub">
      <section className="learning-hero">
        <p className="learning-hero__badge">🇸🇬 National Day Special</p>
        <h1>Discover Singapore's Story, One Song at a Time</h1>
        <p className="learning-hero__intro">
          Every 9 August, Singapore celebrates the journey of a young nation that grew into a
          united, multicultural home. Explore the milestones, sounds, and stories behind it.
        </p>
        <button className="learning-hero__cta" onClick={handleBeginExploring} type="button">
          Begin Exploring <span aria-hidden="true">&darr;</span>
        </button>
      </section>

      <section className="learning-timeline" id="learning-timeline" ref={timelineRef}>
        <Reveal as="div" className="learning-section-heading">
          <h2>Singapore's National Day Journey</h2>
          <p>Tap a milestone to see how the story unfolded.</p>
        </Reveal>

        <ol className="learning-timeline__track">
          {milestones.map((milestone, index) => (
            <TimelineItem
              index={index}
              isOpen={openMilestones.has(index)}
              key={milestone.year}
              milestone={milestone}
              onToggle={toggleMilestone}
            />
          ))}
        </ol>
      </section>

      <section className="learning-modules">
        <Reveal as="div" className="learning-section-heading">
          <h2>Choose Your Adventure</h2>
          <p>Three ways to explore &mdash; come back to any of them, any time.</p>
        </Reveal>

        <div className="learning-modules__grid">
          {learningModules.map((module, index) => (
            <Reveal as="div" delay={index * 100} key={module.id}>
              <ModuleCard module={module} />
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal as="section" className="learning-fact">
        <div className="learning-fact__card">
          <p className="learning-fact__eyebrow">Did You Know?</p>
          <p className="learning-fact__text" key={factIndex}>{funFacts[factIndex]}</p>
          <button className="learning-fact__next" onClick={handleNextFact} type="button">
            Next Fact <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </Reveal>

      <Reveal as="section" className="learning-quiz">
        <h2>Quick Quiz</h2>
        <div className="learning-quiz__body" key={questionIndex}>
          <p className="learning-quiz__question">{currentQuestion.question}</p>

          <div className="learning-quiz__options">
            {currentQuestion.options.map((option, index) => {
              const isSelected = quizChoice === index
              const isCorrect = index === currentQuestion.correctIndex
              const showState = quizChoice !== null

              return (
                <button
                  className={`learning-quiz__option ${showState && isCorrect ? 'is-correct' : ''} ${showState && isSelected && !isCorrect ? 'is-incorrect' : ''}`}
                  disabled={quizChoice !== null}
                  key={option}
                  onClick={() => handleQuizChoice(index)}
                  type="button"
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>

        {quizChoice !== null && (
          <div className={`learning-quiz__feedback ${quizChoice === currentQuestion.correctIndex ? 'is-correct' : 'is-incorrect'}`}>
            <p>
              {quizChoice === currentQuestion.correctIndex
                ? 'Correct! 🎉'
                : `Not quite — the answer is ${currentQuestion.options[currentQuestion.correctIndex]}.`}
              {' '}
              {currentQuestion.explanation}
            </p>
            <button className="learning-quiz__retry" onClick={handleQuizRetry} type="button">
              Try Again
            </button>
          </div>
        )}

        <button className="learning-quiz__next" onClick={handleNextQuestion} type="button">
          Next Question <span aria-hidden="true">&rarr;</span>
        </button>
      </Reveal>
    </div>
  )
}
