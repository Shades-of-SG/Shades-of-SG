import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LyricsCard from '../components/studio/LyricsCard'
import LivePreviewCard from '../components/studio/LivePreviewCard'
import MetadataStepper from '../components/studio/MetadataStepper'
import PreviewPublishPanel from '../components/studio/PreviewPublishPanel'
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

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const initialLanguages = ['English', 'Chinese']
const initialMoods = ['joyful', 'nostalgic', 'hopeful']

function getApiErrorMessage(data, fallback) {
  return data?.message || data?.error?.message || fallback
}

function getMediaMimeType(file) {
  if (file.type) {
    return file.type
  }

  const extension = file.name.toLowerCase().split('.').pop()
  const mimeTypes = {
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    mpeg: 'audio/mpeg',
    mpga: 'audio/mpeg',
    wav: 'audio/wav',
    webm: 'audio/webm',
  }

  return mimeTypes[extension] || 'audio/mpeg'
}

export default function Studio() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialFormData)
  const [selectedLanguages, setSelectedLanguages] = useState(initialLanguages)
  const [selectedMoods, setSelectedMoods] = useState(initialMoods)
  const [audioFileName, setAudioFileName] = useState('')
  const [audioDuration, setAudioDuration] = useState('')
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [selectedMediaFile, setSelectedMediaFile] = useState(null)
  const [studioStep, setStudioStep] = useState(1)
  const [lyrics, setLyrics] = useState('')
  const [extractionStatus, setExtractionStatus] = useState('idle')
  const [extractionError, setExtractionError] = useState('')
  const [transcriptionStatus, setTranscriptionStatus] = useState({
    configured: null,
    error: '',
  })
  const [lastSavedAt, setLastSavedAt] = useState(null)

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl)
      }
    }
  }, [audioPreviewUrl])

  useEffect(() => {
    if (studioStep !== 2 || transcriptionStatus.configured !== null) {
      return
    }

    let isMounted = true

    fetch(`${API_BASE_URL}/transcriptions/status`)
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) {
          return
        }

        setTranscriptionStatus({
          configured: Boolean(data.configured),
          error: data.configured ? '' : 'AI transcription is not configured. Add OPENAI_API_KEY to backend/.env and restart the backend.',
        })
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setTranscriptionStatus({
          configured: false,
          error: 'Unable to reach the transcription backend. Start the backend and check VITE_API_URL.',
        })
      })

    return () => {
      isMounted = false
    }
  }, [studioStep, transcriptionStatus.configured])

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function resetLyricsExtraction() {
    setLyrics('')
    setExtractionError('')
    setExtractionStatus('idle')
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
    resetLyricsExtraction()
    setAudioFileName(file ? file.name : '')

    if (!file) {
      setAudioDuration('')
      setAudioPreviewUrl('')
      setMediaType('')
      setSelectedMediaFile(null)
      return
    }

    const isVideo = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4')
    const media = document.createElement(isVideo ? 'video' : 'audio')
    const objectUrl = URL.createObjectURL(file)
    setMediaType(isVideo ? 'video' : 'audio')
    setSelectedMediaFile(file)
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
    resetLyricsExtraction()
    setAudioFileName('')
    setAudioDuration('')
    setAudioPreviewUrl('')
    setMediaType('')
    setSelectedMediaFile(null)
  }

  function updateOtherLanguage(value) {
    updateField('otherLanguage', value)

    if (value.trim() && !selectedLanguages.includes('Others')) {
      setSelectedLanguages((current) => [...current, 'Others'])
    }
  }

  function updateYouTubeLink(value) {
    resetLyricsExtraction()
    updateField('youtubeLink', value)
  }

  const previewLanguages = selectedLanguages
    .filter((language) => language !== 'Others')
    .concat(selectedLanguages.includes('Others') && formData.otherLanguage.trim() ? [formData.otherLanguage.trim()] : [])

  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) {
      return 'Draft not saved yet'
    }

    return `Draft last saved at ${lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  }, [lastSavedAt])

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        const result = String(reader.result || '')
        resolve(result.includes(',') ? result.split(',')[1] : result)
      }

      reader.onerror = () => reject(new Error('Unable to read media file.'))
      reader.readAsDataURL(file)
    })
  }

  async function extractLyrics() {
    setExtractionError('')
    setExtractionStatus('loading')

    try {
      if (transcriptionStatus.configured === false) {
        throw new Error(transcriptionStatus.error || 'AI transcription is not configured.')
      }

      if (!selectedMediaFile) {
        if (!formData.youtubeLink.trim()) {
          throw new Error('Upload an MP3, WAV, or MP4 file or paste a YouTube link before extracting lyrics.')
        }

        const response = await fetch(`${API_BASE_URL}/transcriptions/lyrics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtubeUrl: formData.youtubeLink }),
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, 'Unable to extract lyrics from this YouTube link.'))
        }

        setLyrics(data.lyrics || '')
        setExtractionStatus('success')
        return
      }

      if (selectedMediaFile.size > 25 * 1024 * 1024) {
        throw new Error('AI transcription supports files up to 25MB. Please upload a smaller media file.')
      }

      const mediaBase64 = await readFileAsBase64(selectedMediaFile)
      const response = await fetch(`${API_BASE_URL}/transcriptions/lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedMediaFile.name,
          mediaBase64,
          mimeType: getMediaMimeType(selectedMediaFile),
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, 'Unable to extract lyrics from this media.'))
      }

      setLyrics(data.lyrics || '')
      setExtractionStatus('success')
    } catch (error) {
      setExtractionError(error.message)
      setExtractionStatus('error')
    }
  }

  function handleSaveDraft() {
    const now = new Date()
    setLastSavedAt(now)
    window.alert('Draft saved')
  }

  function handleGenerateVideo() {
    navigate('/creator/generation')
  }

  function handlePublishSong() {
    window.alert('Song published successfully')
    navigate('/creator/songs')
  }

  function handleNextStep() {
    setStudioStep((current) => Math.min(current + 1, 3))
  }

  return (
    <div className="studio-page">
      <StudioHeader
        activeStep={studioStep}
        onBackToLyrics={() => setStudioStep(2)}
        onGenerateVideo={handleGenerateVideo}
        onPublishSong={handlePublishSong}
        onSaveDraft={handleSaveDraft}
      />

      {studioStep === 3 ? (
        <section className="studio-form-column">
          <MetadataStepper activeStep={studioStep} onStepChange={setStudioStep} />
          <PreviewPublishPanel
            audioSrc={audioPreviewUrl}
            artist={formData.artist}
            description={formData.description}
            duration={audioDuration}
            lastSavedLabel={lastSavedLabel}
            languages={previewLanguages}
            lyrics={lyrics}
            mediaType={mediaType}
            moods={selectedMoods}
            theme={formData.theme}
            title={formData.title}
            youtubeLink={formData.youtubeLink}
          />
        </section>
      ) : (
        <section className="studio-main-grid">
          <div className="studio-form-column">
            <MetadataStepper activeStep={studioStep} onStepChange={setStudioStep} />

            {studioStep === 1 ? (
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
                onYouTubeLinkChange={updateYouTubeLink}
                selectedLanguages={selectedLanguages}
                selectedMoods={selectedMoods}
              />
            ) : (
              <LyricsCard
                canExtractLyrics={Boolean(selectedMediaFile || formData.youtubeLink.trim())}
                extractionError={extractionError}
                extractionStatus={extractionStatus}
                lyrics={lyrics}
                onExtractLyrics={extractLyrics}
                onLyricsChange={setLyrics}
                transcriptionStatus={transcriptionStatus}
                youtubeLink={formData.youtubeLink}
              />
            )}
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
      )}

      <StudioFooter
        activeStep={studioStep}
        lastSavedLabel={lastSavedLabel}
        onNext={handleNextStep}
        onPublish={handlePublishSong}
      />
    </div>
  )
}
