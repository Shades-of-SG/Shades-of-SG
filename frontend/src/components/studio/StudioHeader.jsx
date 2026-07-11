import CreatorAccountWidget from '../CreatorAccountWidget'

const stepContent = {
  1: {
    breadcrumb: 'Edit Song',
    primaryAction: 'Save Draft',
    secondaryAction: 'Generate Video',
    subtitle: 'Create and curate your song details. Save as draft or generate your AI music video.',
    title: 'Studio',
  },
  2: {
    breadcrumb: 'Edit Song',
    primaryAction: 'Save Draft',
    secondaryAction: 'Generate Video',
    subtitle: 'Write and organize your lyrics. AI will help extract and shape your song draft.',
    title: 'Studio - Lyrics',
  },
  3: {
    breadcrumb: 'Preview & Publish',
    primaryAction: 'Publish Song',
    secondaryAction: 'Save Draft',
    subtitle: 'This is how your song will appear to the community. Review all details before publishing.',
    title: 'Preview & Publish',
  },
}

export default function StudioHeader({
  activeStep = 1,
  onBackToLyrics,
  onGenerateVideo,
  onMenuToggle,
  onPublishSong,
  onSaveDraft,
  showMenuButton = false,
  isBusy = false,
  publishDisabled = false,
}) {
  const content = stepContent[activeStep] || stepContent[1]
  const handleSecondaryAction = activeStep === 3 ? onSaveDraft : onGenerateVideo
  const handlePrimaryAction = activeStep === 3 ? onPublishSong : onSaveDraft

  return (
    <header className="studio-header">
      <div className="studio-header__copy">
        <div className="studio-breadcrumbs" aria-label="Breadcrumb">
          <span>Creator Portal</span>
          <span>Studio</span>
          <span>{content.breadcrumb}</span>
        </div>
        <div className="studio-header__title-row">
          {showMenuButton && (
            <button aria-label="Open Studio navigation" className="studio-header__menu-button" onClick={onMenuToggle} type="button">
              Menu
            </button>
          )}
          <div>
            <h1>{content.title}</h1>
            <p>{content.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="studio-header__actions">
        <CreatorAccountWidget />
        <div className="studio-header__button-row">
          {activeStep === 3 && (
            <button className="studio-button studio-button--ghost" onClick={onBackToLyrics} type="button">
              Back to Lyrics
            </button>
          )}
          <button className="studio-button studio-button--secondary" disabled={isBusy} onClick={handleSecondaryAction} type="button">
            {content.secondaryAction}
          </button>
          <button className="studio-button studio-button--primary" disabled={isBusy || (activeStep === 3 && publishDisabled)} onClick={handlePrimaryAction} type="button">
            {content.primaryAction}
          </button>
        </div>
      </div>
    </header>
  )
}
