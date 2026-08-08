// Renders a song difficulty's ordered steps as note chips, grouped by
// measure, with the step currently playing highlighted and everything
// already played marked done. Purely presentational — all playback state
// (currentStepIndex) comes from useSequencePlayer.
export default function SequenceProgress({ currentStepIndex, steps }) {
  const measureNumbers = [...new Set(steps.map((step) => step.measure))]

  return (
    <div aria-label="Note sequence" className="lesson-sequence">
      {measureNumbers.map((measureNumber) => (
        <div className="lesson-sequence__measure" key={measureNumber}>
          <span className="lesson-sequence__measure-label">Measure {measureNumber}</span>
          <div className="lesson-sequence__notes">
            {steps.map((step, index) => {
              if (step.measure !== measureNumber) return null

              const stateClass = index === currentStepIndex ? 'is-active' : index < currentStepIndex ? 'is-played' : ''
              const label = step.type === 'rest' ? 'rest' : step.notes.map((n) => n.label).join(' + ')

              return (
                <span className={`lesson-sequence__note lesson-sequence__note--${step.type} ${stateClass}`} key={index}>
                  {label}
                </span>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
