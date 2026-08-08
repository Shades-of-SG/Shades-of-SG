import InstrumentCard from '../lab/InstrumentCard'
import Reveal from '../Reveal'
import useInstrumentAudio, { preloadInstrument } from '../../hooks/useInstrumentAudio'
import useLabInstruments from '../../hooks/useLabInstruments'

// Stage 1 of the guided lesson flow: every song in data/songs.js is
// instrument-agnostic (each note carries its own frequency, see that
// file's header comment), so any of these can lead into any song.
export default function InstrumentPicker({ onSelect }) {
  const instruments = useLabInstruments()
  const { playNote } = useInstrumentAudio()

  function handlePreview(instrument) {
    const previewNote = instrument.notes[0]
    if (previewNote) playNote(instrument, previewNote)
  }

  return (
    <section aria-label="Choose an instrument" className="lesson-instrument-picker">
      <div className="learning-section-heading">
        <h2>Choose Your Instrument</h2>
        <p>Every song here can be played on any instrument — pick whichever voice you would like to learn with.</p>
      </div>

      <div className="lesson-instrument-picker__grid">
        {instruments.map((instrument, index) => (
          <Reveal delay={index * 80} key={instrument.id}>
            <InstrumentCard
              instrument={instrument}
              onPreloadFull={preloadInstrument}
              onPreview={handlePreview}
              onSelect={onSelect}
            />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
