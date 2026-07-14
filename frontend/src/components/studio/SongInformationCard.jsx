import LanguageSelector from './LanguageSelector'
import MoodTagSelector from './MoodTagSelector'
import SongMediaUpload from './SongMediaUpload'
import CoverImageUpload from './CoverImageUpload'

const themeOptions = ['Select a theme', 'National Identity', 'Unity & Harmony', 'Home & Belonging', 'History & Journey', 'Community']
const htmlTagPattern = /<[^>]*>/

function getDescriptionValidationMessage(description) {
  if (htmlTagPattern.test(description)) {
    return 'Please remove HTML tags from this song description.'
  }

  return ''
}

export default function SongInformationCard({
  audioFileName,
  coverImageUrl,
  coverFileName,
  descriptionLength,
  formData,
  onAudioFileChange,
  onAudioFileClear,
  onCoverImageChange,
  onCoverImageClear,
  onFieldChange,
  onLanguageToggle,
  onMoodToggle,
  onOtherLanguageChange,
  onYouTubeLinkChange,
  savedAudioFileName,
  savedAudioUrl,
  selectedLanguages,
  selectedMoods,
}) {
  const descriptionValidationMessage = getDescriptionValidationMessage(formData.description)

  return (
    <section className="studio-card studio-form-card">
      <header className="studio-card__header">
        <div className="studio-card__title">
          <span aria-hidden="true">♫</span>
          <h2>Song Information</h2>
        </div>
      </header>

      <div className="studio-form-grid">
        <div className="studio-form-column studio-form-column--left">
          <label className="studio-field">
            <span>
              Title <strong>*</strong>
            </span>
            <div className="studio-input-shell">
              <input maxLength={120} onChange={(event) => onFieldChange('title', event.target.value)} placeholder="Song Title" value={formData.title} />
              <small>{formData.title.length} / 120</small>
            </div>
          </label>

          <label className="studio-field">
            <span>Artist</span>
            <div className="studio-input-shell">
              <input maxLength={120} onChange={(event) => onFieldChange('artist', event.target.value)} placeholder="Artist Name" value={formData.artist} />
              <small>{formData.artist.length} / 120</small>
            </div>
          </label>

          <label className="studio-field">
            <span>Theme</span>
            <select onChange={(event) => onFieldChange('theme', event.target.value)} value={formData.theme}>
              {themeOptions.map((theme) => (
                <option key={theme} value={theme === 'Select a theme' ? '' : theme}>
                  {theme}
                </option>
              ))}
            </select>
          </label>

          <label className={`studio-field studio-description-field ${descriptionValidationMessage ? 'has-error' : ''}`}>
            <span>
              Description <strong>*</strong>
            </span>
            <textarea
              maxLength={300}
              onChange={(event) => onFieldChange('description', event.target.value)}
              placeholder="Write a short description about your song..."
              rows={7}
              value={formData.description}
            />
            <div className="studio-field__meta">
              {descriptionValidationMessage && <strong>{descriptionValidationMessage}</strong>}
              <small>{descriptionLength} / 300</small>
            </div>
          </label>
        </div>

        <div className="studio-form-column studio-form-column--right">
          <CoverImageUpload coverFileName={coverFileName} coverImageUrl={coverImageUrl} onChange={onCoverImageChange} onClear={onCoverImageClear} />
          <LanguageSelector
            onOtherLanguageChange={onOtherLanguageChange}
            onToggleLanguage={onLanguageToggle}
            otherLanguage={formData.otherLanguage}
            selectedLanguages={selectedLanguages}
          />

          <MoodTagSelector onToggleTag={onMoodToggle} selectedTags={selectedMoods} />

          <SongMediaUpload
            audioFileName={audioFileName}
            onAudioFileChange={onAudioFileChange}
            onAudioFileClear={onAudioFileClear}
            onYoutubeLinkChange={onYouTubeLinkChange}
            savedAudioFileName={savedAudioFileName}
            savedAudioUrl={savedAudioUrl}
            youtubeLink={formData.youtubeLink}
          />
        </div>
      </div>
    </section>
  )
}
