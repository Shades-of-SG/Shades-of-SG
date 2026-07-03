import { useEffect, useState } from 'react'
import LivePreviewCard from '../components/studio/LivePreviewCard'
import MetadataStepper from '../components/studio/MetadataStepper'
import SongInformationCard from '../components/studio/SongInformationCard'
import StudioFooter from '../components/studio/StudioFooter'
import StudioHeader from '../components/studio/StudioHeader'

const initialFormData = {
  artist: '',
  description: '',
  otherLanguage: '',
  theme: '',
  title: '',
  youtubeLink: '',
}

const initialLanguages = ['English', 'Chinese']
const initialMoods = ['joyful', 'nostalgic', 'hopeful']

export default function Studio() {
  const [formData, setFormData] = useState(initialFormData)
  const [selectedLanguages, setSelectedLanguages] = useState(initialLanguages)
  const [selectedMoods, setSelectedMoods] = useState(initialMoods)
  const [audioFileName, setAudioFileName] = useState('')
  const [audioDuration, setAudioDuration] = useState('')
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('')
  const [mediaType, setMediaType] = useState('')

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl)
      }
    }
  }, [audioPreviewUrl])

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function toggleLanguage(language) {
    setSelectedLanguages((current) => {
      if (current.includes(language)) {
        return current.filter((item) => item !== language)
      }

      return [...current, language]
    })
  }

  function toggleMood(tag) {
    setSelectedMoods((current) => {
      if (current.includes(tag)) {
        return current.filter((item) => item !== tag)
      }

      if (current.length >= 5) {
        return current
      }

      return [...current, tag]
    })
  }

  function handleAudioFileChange(event) {
    const file = event.target.files?.[0]
    setAudioFileName(file ? file.name : '')

    if (!file) {
      setAudioDuration('')
      setAudioPreviewUrl('')
      setMediaType('')
      return
    }

    const isVideo = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4')
    const media = document.createElement(isVideo ? 'video' : 'audio')
    const objectUrl = URL.createObjectURL(file)
    setMediaType(isVideo ? 'video' : 'audio')
    setAudioPreviewUrl(objectUrl)

    media.preload = 'metadata'
    media.src = objectUrl
    media.onloadedmetadata = () => {
      if (Number.isFinite(media.duration)) {
        const minutes = Math.floor(media.duration / 60)
        const seconds = Math.floor(media.duration % 60)
        setAudioDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }
    }
    media.onerror = () => {
      setAudioDuration('')
    }
  }

  function clearAudioFile() {
    setAudioFileName('')
    setAudioDuration('')
    setAudioPreviewUrl('')
    setMediaType('')
  }

  function updateOtherLanguage(value) {
    updateField('otherLanguage', value)

    if (value.trim() && !selectedLanguages.includes('Others')) {
      setSelectedLanguages((current) => [...current, 'Others'])
    }
  }

  const previewLanguages = selectedLanguages
    .filter((language) => language !== 'Others')
    .concat(selectedLanguages.includes('Others') && formData.otherLanguage.trim() ? [formData.otherLanguage.trim()] : [])

  return (
    <div className="studio-page">
      <StudioHeader />

      <section className="studio-main-grid">
        <div className="studio-form-column">
          <MetadataStepper activeStep={1} />

          <SongInformationCard
            audioFileName={audioFileName}
            descriptionLength={formData.description.length}
            formData={formData}
            onAudioFileChange={handleAudioFileChange}
            onAudioFileClear={clearAudioFile}
            onFieldChange={updateField}
            onLanguageToggle={toggleLanguage}
            onMoodToggle={toggleMood}
            onOtherLanguageChange={updateOtherLanguage}
            onYouTubeLinkChange={(value) => updateField('youtubeLink', value)}
            selectedLanguages={selectedLanguages}
            selectedMoods={selectedMoods}
          />
        </div>

        <LivePreviewCard
          artist={formData.artist}
          audioSrc={audioPreviewUrl}
          description={formData.description}
          duration={audioDuration}
          languages={previewLanguages}
          mediaType={mediaType}
          moods={selectedMoods}
          theme={formData.theme}
          title={formData.title}
          youtubeLink={formData.youtubeLink}
        />
      </section>

      <StudioFooter />
    </div>
  )
}

