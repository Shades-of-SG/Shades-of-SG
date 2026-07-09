export default function StudioFooter({ activeStep = 1, canPublish = true, lastSavedLabel = 'Not saved yet', onNext, onPublish, onSaveDraft }) {
  const isPublishStep = activeStep === 3

  return (
    <footer className="studio-footer">
      <p className="studio-footer__status">{lastSavedLabel}</p>
      <div className="studio-footer__actions">
        {isPublishStep && !canPublish && (
          <button className="studio-button studio-button--secondary" onClick={onSaveDraft} type="button">
            Save Draft
          </button>
        )}
        <button className="studio-button studio-button--primary" onClick={isPublishStep ? onPublish : onNext} type="button">
          {isPublishStep ? 'Publish Song' : activeStep === 2 ? 'Next: Preview & Publish' : 'Next: Lyrics'}
        </button>
      </div>
    </footer>
  )
}
