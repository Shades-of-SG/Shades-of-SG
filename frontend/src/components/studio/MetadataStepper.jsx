const steps = [
  { id: 'metadata', label: 'Metadata', description: 'Song details' },
  { id: 'lyrics', label: 'Lyrics', description: 'Write and organize' },
  { id: 'publish', label: 'Preview & Publish', description: 'Review and publish' },
]

export default function MetadataStepper({ activeStep = 1, compact = false, onStepChange }) {
  return (
    <section className={`studio-stepper ${compact ? 'studio-stepper--compact' : ''}`} aria-label="Studio progress">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === activeStep
        const isComplete = stepNumber < activeStep
        const isAvailable = stepNumber <= 3

        return (
          <button
            aria-current={isActive ? 'step' : undefined}
            className={`studio-stepper__item ${isActive ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''}`}
            disabled={!isAvailable}
            key={step.id}
            onClick={() => {
              if (isAvailable) {
                onStepChange?.(stepNumber)
              }
            }}
            type="button"
          >
            <div className="studio-stepper__number">{stepNumber}</div>
            <div className="studio-stepper__text">
              <strong>{step.label}</strong>
              {!compact && <span>{step.description}</span>}
            </div>
          </button>
        )
      })}
    </section>
  )
}
