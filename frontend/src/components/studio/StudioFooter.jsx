export default function StudioFooter({
  activeStep = 1,
  disabled = false,
  lastSavedLabel = 'Not saved yet',
  onNext,
  onPublish,
}) {
  const isPublishStep = activeStep === 4

  const nextLabel = {
    1: 'Next: Lyrics',
    2: 'Next: Beatmap',
    3: 'Next: Preview & Publish',
  }[activeStep]

  return (
    <footer className="studio-footer">
      <p className="studio-footer__status">
        {lastSavedLabel}
      </p>

      <div className="studio-footer__actions">
        <button
          className="studio-button studio-button--primary"
          disabled={disabled}
          onClick={isPublishStep ? onPublish : onNext}
          type="button"
        >
          {isPublishStep ? 'Publish Song' : nextLabel}
        </button>
      </div>
    </footer>
  )
}

