import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import InstrumentCard from '../components/lab/InstrumentCard'
import InstrumentPlayer from '../components/lab/InstrumentPlayer'
import Reveal from '../components/Reveal'
import useInstrumentAudio, { preloadInstrument } from '../hooks/useInstrumentAudio'
import useLabInstruments from '../hooks/useLabInstruments'

export default function InstrumentDiscoveryLab() {
  const instruments = useLabInstruments()
  const { playNote } = useInstrumentAudio()
  const [selectedInstrumentId, setSelectedInstrumentId] = useState(null)
  const galleryRef = useRef(null)

  const selectedInstrument = instruments.find((instrument) => instrument.id === selectedInstrumentId)

  // Idle-time preload: warm one representative note per instrument so the
  // gallery's preview buttons feel instant, without competing with anything
  // the page actually needs on first paint.
  useEffect(() => {
    const schedule = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 200))
    const cancel = window.cancelIdleCallback || window.clearTimeout
    const handle = schedule(() => {
      instruments.forEach((instrument) => {
        preloadInstrument(instrument, { noteLabels: [instrument.notes[0].label] })
      })
    })
    return () => cancel(handle)
  }, [instruments])

  function handleStartExploring() {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handlePreviewInstrument(instrument) {
    playNote(instrument, instrument.notes[0])
  }

  function handleSelectInstrument(id) {
    const instrument = instruments.find((candidate) => candidate.id === id)
    // Full preload so by the time InstrumentPlayer finishes mounting, every
    // note is already warm — this is what keeps the very first key-tap
    // responsive, especially on mobile.
    if (instrument) preloadInstrument(instrument)
    setSelectedInstrumentId(id)
    window.scrollTo({ behavior: 'smooth', top: 0 })
  }

  return (
    <div className="lab-page">
      <section className="lab-hero">
        <p className="lab-hero__badge">Instrument Discovery Lab</p>
        <h1>Every Instrument Tells a Story</h1>
        <p className="lab-hero__intro">
          Explore the sounds that have shaped Singapore's multicultural musical heritage. Tap,
          play, and discover how each instrument brings its own voice to the nation's celebrations.
        </p>
        <button className="lab-hero__cta" onClick={handleStartExploring} type="button">
          Start Exploring <span aria-hidden="true">↓</span>
        </button>
      </section>

      {selectedInstrument ? (
        <InstrumentPlayer
          instrument={selectedInstrument}
          instruments={instruments}
          key={selectedInstrument.id}
          onBack={() => setSelectedInstrumentId(null)}
          onSelectInstrument={handleSelectInstrument}
        />
      ) : (
        <section className="lab-gallery" id="lab-gallery" ref={galleryRef}>
          <Reveal as="div" className="learning-section-heading">
            <h2>The Instrument Gallery</h2>
            <p>There are no right or wrong answers here — just tap and explore.</p>
          </Reveal>

          <div className="lab-gallery__grid">
            {instruments.map((instrument, index) => (
              <Reveal delay={index * 80} key={instrument.id}>
                <InstrumentCard
                  instrument={instrument}
                  onPreloadFull={() => preloadInstrument(instrument)}
                  onPreview={handlePreviewInstrument}
                  onSelect={handleSelectInstrument}
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <Reveal as="section" className="lab-continue">
        <p className="lab-continue__lead">
          You've explored the sounds behind Singapore's multicultural heritage.
        </p>
        <p className="lab-continue__lead">
          Now discover how these sounds come together to create the songs that unite the nation.
        </p>
        <Link className="lab-continue__cta" to="/learning/guided-lessons">
          Continue to Guided Music Lessons <span aria-hidden="true">→</span>
        </Link>
      </Reveal>
    </div>
  )
}
