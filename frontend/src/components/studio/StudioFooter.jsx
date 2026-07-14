export default function StudioFooter({ activeStep = 1, lastSavedLabel = 'Not saved yet', onNext, onPublish }) {
  const isPublishStep = activeStep === 3

  return (
    <footer className="studio-footer">
      <p className="studio-footer__status">{lastSavedLabel}</p>
      <div className="studio-footer__actions">
        <button className="studio-button studio-button--primary" onClick={isPublishStep ? onPublish : onNext} type="button">
          {isPublishStep ? 'Publish Song' : activeStep === 2 ? 'Next: Preview & Publish' : 'Next: Lyrics'}
        </button>
      </div>
    </footer>
  )
}
