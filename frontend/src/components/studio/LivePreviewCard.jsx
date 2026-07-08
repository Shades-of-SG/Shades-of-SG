import AudioPreviewCard from './AudioPreviewCard'

const emptyPreviewValue = '--'
const emptyTextValue = 'Not set'
const emptySelectedValue = 'Not selected'
const emptyDurationValue = 'Calculated after upload'
const defaultPlaceholderYoutubeLink = 'https://youtu.be/GaMS0F0_xMI?si=3d4MR7gyws6uxbl2'

function getPreviewValue(value, fallback = emptyPreviewValue) {
  return value?.trim() || fallback
}

function formatListValue(values, fallback = emptyPreviewValue) {
  return values.length ? values.join(' • ') : fallback
}

function formatMoodValue(value) {
  return value
    .split(' ')
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(' ')
}

function formatDurationValue(value) {
  if (!value) {
    return emptyDurationValue
  }

  const [minutes, seconds] = value.split(':').map((part) => Number(part))

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return value
  }

  const minuteLabel = minutes === 1 ? 'min' : 'min'
  const secondLabel = seconds === 1 ? 'sec' : 'sec'
  return `${minutes}${minuteLabel} ${seconds} ${secondLabel}`
}

export default function LivePreviewCard({
  artist = '',
  audioSrc = '',
  duration = '',
  languages = [],
  mediaType = '',
  moods = [],
  theme = '',
  title = '',
  status = 'draft',
  youtubeLink = '',
}) {
  const activeLanguages = languages.filter((language) => language !== 'Others')
  const isVideoMedia = mediaType === 'video'
  const previewMoods = moods.length ? moods : theme ? [theme] : []
  const moodValue = formatListValue(previewMoods.map(formatMoodValue), emptySelectedValue)
  const languageValue = formatListValue(activeLanguages, emptySelectedValue)
  const videoUrl = isVideoMedia ? audioSrc : ''
  const audioUrl = isVideoMedia ? '' : audioSrc
  const effectiveYoutubeLink = youtubeLink?.trim() || (!audioUrl && !videoUrl ? defaultPlaceholderYoutubeLink : '')
  const previewMediaKey = videoUrl || audioUrl || effectiveYoutubeLink || 'empty-preview'
  const previewDetails = [
    { label: 'Title', value: getPreviewValue(title, emptyTextValue) },
    { label: 'Artist', value: getPreviewValue(artist, emptyTextValue) },
    { label: 'Theme', value: getPreviewValue(theme, emptySelectedValue) },
    { label: 'Languages', value: languageValue },
    { label: 'Mood', value: moodValue },
    { label: 'Duration', value: formatDurationValue(duration) },
  ]

  return (
    <section className="studio-card studio-preview-card">
      <header className="studio-card__header studio-card__header--spread">
        <div>
          <p className="studio-card__eyebrow">Live Preview</p>
          <h2>See how the song will appear</h2>
        </div>
        <span className="studio-preview-card__status">DRAFT</span>
      </header>

      <AudioPreviewCard key={previewMediaKey} audioUrl={audioUrl} artist={artist} status={status} title={title} videoUrl={videoUrl} youtubeUrl={effectiveYoutubeLink} />

      <div className="studio-preview-card__body">
        <h3>Song Summary</h3>
        <dl className="studio-preview-card__details">
          {previewDetails.map((detail) => (
            <div key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="studio-preview-card__tip">
        <strong>Tip:</strong>
        <span>Complete all details and generate a video to make your song discoverable in the public library.</span>
      </div>
    </section>
  )
}
