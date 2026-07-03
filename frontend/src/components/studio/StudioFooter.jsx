export default function StudioFooter({ activeStep = 1, onBack, onNext }) {
  const isLyricsStep = activeStep === 2

  return (
    <footer className="studio-footer">
      <p className="studio-footer__status">Auto-saved a few seconds ago</p>
      <div className="studio-footer__actions">
        <button className="studio-button studio-button--secondary" onClick={isLyricsStep ? onBack : undefined} type="button">
          {isLyricsStep ? 'Back: Metadata' : 'Cancel'}
        </button>
        <button className="studio-button studio-button--secondary" type="button">
          Save Draft
        </button>
        <button className="studio-button studio-button--primary" onClick={onNext} type="button">
          {isLyricsStep ? 'Next: Preview' : 'Next: Lyrics'}
        </button>
      </div>
    </footer>
  )
}
