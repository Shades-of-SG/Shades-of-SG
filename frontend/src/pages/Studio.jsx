import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LyricsCard from '../components/studio/LyricsCard'
import LivePreviewCard from '../components/studio/LivePreviewCard'
import MetadataStepper from '../components/studio/MetadataStepper'
import PreviewPublishPanel from '../components/studio/PreviewPublishPanel'
import SongInformationCard from '../components/studio/SongInformationCard'
import StudioFooter from '../components/studio/StudioFooter'
import StudioHeader from '../components/studio/StudioHeader'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../services/apiConfig'
import { createDraft, getCreatorSong, getPublishReadiness, publishSong, startGeneration, updateDraft, uploadAudio, uploadCover } from '../services/songService'

const emptyForm = { artist: '', description: '', otherLanguage: '', theme: '', title: '', youtubeLink: '' }

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || '').split(',').pop())
    reader.onerror = () => reject(new Error('Unable to read media file.'))
    reader.readAsDataURL(file)
  })
}

function mimeType(file) {
  if (file.type) return file.type
  return file.name.toLowerCase().endsWith('.mp4') ? 'video/mp4' : 'audio/mpeg'
}

export default function Studio() {
  const { songId: routeSongId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [songId, setSongId] = useState(routeSongId || '')
  const [song, setSong] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [selectedLanguages, setSelectedLanguages] = useState([])
  const [selectedMoods, setSelectedMoods] = useState([])
  const [lyrics, setLyrics] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [pendingCover, setPendingCover] = useState(null)
  const [selectedMediaFile, setSelectedMediaFile] = useState(null)
  const [audioFileName, setAudioFileName] = useState('')
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [studioStep, setStudioStep] = useState(1)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [readiness, setReadiness] = useState({ ready: false, missing: [] })
  const [isLoading, setIsLoading] = useState(Boolean(routeSongId))
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [extractionStatus, setExtractionStatus] = useState('idle')
  const [extractionError, setExtractionError] = useState('')
  const [transcriptionStatus, setTranscriptionStatus] = useState({ configured: null, error: '' })

  useEffect(() => {
    if (!routeSongId) return undefined
    let active = true
    Promise.all([getCreatorSong(routeSongId, token), getPublishReadiness(routeSongId, token)])
      .then(([loadedSong, loadedReadiness]) => {
        if (!active) return
        const otherLanguages = loadedSong.otherLanguages || []
        setSong(loadedSong)
        setSongId(loadedSong.id)
        setFormData({
          artist: loadedSong.artist || '', description: loadedSong.description || '',
          otherLanguage: otherLanguages.join(', '), theme: loadedSong.theme || '',
          title: loadedSong.title || '', youtubeLink: loadedSong.sourceYoutubeUrl || '',
        })
        setSelectedLanguages([...(loadedSong.languages || []), ...(otherLanguages.length ? ['Others'] : [])])
        setSelectedMoods(loadedSong.moodTags || [])
        setLyrics(loadedSong.rawLyrics || '')
        setCoverImageUrl(loadedSong.coverImageUrl || '')
        setAudioPreviewUrl(loadedSong.videoUrl || loadedSong.audioUrl || '')
        setMediaType(loadedSong.videoUrl ? 'video' : loadedSong.audioUrl ? 'audio' : '')
        setReadiness(loadedReadiness)
        setLastSavedAt(new Date(loadedSong.updatedAt))
      })
      .catch((error) => active && setMessage({ type: 'error', text: error.message }))
      .finally(() => active && setIsLoading(false))
    return () => { active = false }
  }, [routeSongId, token])

  useEffect(() => () => {
    if (audioPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(audioPreviewUrl)
    if (coverImageUrl?.startsWith('blob:')) URL.revokeObjectURL(coverImageUrl)
  }, [audioPreviewUrl, coverImageUrl])

  useEffect(() => {
    if (studioStep !== 2 || transcriptionStatus.configured !== null) return undefined
    fetch(`${API_URL}/transcriptions/status`)
      .then((response) => response.json())
      .then((data) => setTranscriptionStatus({ configured: Boolean(data.configured), error: data.configured ? '' : 'AI transcription is not configured.' }))
      .catch(() => setTranscriptionStatus({ configured: false, error: 'Unable to reach the transcription backend.' }))
    return undefined
  }, [studioStep, transcriptionStatus.configured])

  const otherLanguages = formData.otherLanguage.split(',').map((value) => value.trim()).filter(Boolean)
  const languages = selectedLanguages.filter((value) => value !== 'Others')
  const previewLanguages = [...languages, ...otherLanguages]
  const audioDuration = song?.durationSecs
    ? `${Math.floor(song.durationSecs / 60)}:${String(song.durationSecs % 60).padStart(2, '0')}`
    : ''
  const lastSavedLabel = useMemo(() => lastSavedAt
    ? `Draft last saved at ${lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : 'Draft not saved yet', [lastSavedAt])

  function values() {
    return {
      artist: formData.artist, description: formData.description, languages,
      moodTags: selectedMoods, otherLanguages, rawLyrics: lyrics,
      sourceYoutubeUrl: formData.youtubeLink, theme: formData.theme, title: formData.title,
    }
  }

  async function saveDraft({ quiet = false } = {}) {
    if (!formData.title.trim()) throw new Error('Add a title before saving the draft.')
    setIsBusy(true)
    setMessage({ type: '', text: '' })
    try {
      let saved = songId
        ? await updateDraft(songId, values(), token)
        : await createDraft(values(), token, selectedMediaFile)
      const stableId = saved.id
      if (songId && selectedMediaFile) {
        saved = await uploadAudio(stableId, selectedMediaFile, token)
        setSelectedMediaFile(null)
      }
      if (pendingCover) {
        const coverResult = await uploadCover(stableId, pendingCover, token)
        saved = coverResult.song
        setCoverImageUrl(coverResult.coverImageUrl)
        setPendingCover(null)
      }
      setSong(saved)
      setSongId(stableId)
      setLastSavedAt(new Date(saved.updatedAt || Date.now()))
      const nextReadiness = await getPublishReadiness(stableId, token)
      setReadiness(nextReadiness)
      if (!routeSongId) navigate(`/creator/studio/${stableId}`, { replace: true })
      if (!quiet) setMessage({ type: 'success', text: 'Draft saved.' })
      return saved
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
      throw error
    } finally { setIsBusy(false) }
  }

  async function handleGenerateVideo() {
    try {
      const saved = await saveDraft({ quiet: true })
      await startGeneration(saved.id, token)
      setMessage({ type: 'success', text: 'Draft saved and video generation queued.' })
      navigate(`/creator/generation`)
    } catch { /* saveDraft/startGeneration already provides user-visible failure */ }
  }

  async function handlePublishSong() {
    setIsBusy(true)
    setMessage({ type: '', text: '' })
    try {
      await saveDraft({ quiet: true })
      const refreshed = await getPublishReadiness(songId, token)
      setReadiness(refreshed)
      if (!refreshed.ready) throw new Error(`Not ready to publish: ${refreshed.missing.join(', ')}`)
      const published = await publishSong(songId, token)
      setSong(published)
      setMessage({ type: 'success', text: 'Song published successfully.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally { setIsBusy(false) }
  }

  async function extractLyrics() {
    setExtractionStatus('loading'); setExtractionError('')
    try {
      if (transcriptionStatus.configured === false) throw new Error(transcriptionStatus.error)
      const payload = selectedMediaFile
        ? { fileName: selectedMediaFile.name, mediaBase64: await readFileAsBase64(selectedMediaFile), mimeType: mimeType(selectedMediaFile) }
        : { youtubeUrl: formData.youtubeLink }
      const response = await fetch(`${API_URL}/transcriptions/lyrics`, { body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' }, method: 'POST' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Unable to extract lyrics.')
      setLyrics(data.lyrics || ''); setExtractionStatus('success')
    } catch (error) { setExtractionError(error.message); setExtractionStatus('error') }
  }

  function handleMedia(event) {
    const file = event.target.files?.[0] || null
    setSelectedMediaFile(file); setAudioFileName(file?.name || '')
    if (!file) return setAudioPreviewUrl(song?.videoUrl || song?.audioUrl || '')
    setMediaType(file.type === 'video/mp4' ? 'video' : 'audio')
    setAudioPreviewUrl(URL.createObjectURL(file))
  }

  function handleCover(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setPendingCover(file)
    setCoverImageUrl(URL.createObjectURL(file))
  }

  if (isLoading) return <div className="studio-page"><p role="status">Loading saved draft…</p></div>

  return <div className="studio-page">
    <StudioHeader activeStep={studioStep} isBusy={isBusy} publishDisabled={!readiness.ready} onBackToLyrics={() => setStudioStep(2)} onGenerateVideo={handleGenerateVideo} onPublishSong={handlePublishSong} onSaveDraft={() => saveDraft().catch(() => {})} />
    {message.text && <div className={`studio-workflow-message is-${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</div>}
    {studioStep === 3 ? <section className="studio-form-column">
      <MetadataStepper activeStep={studioStep} compact onStepChange={setStudioStep} />
      <PreviewPublishPanel audioSrc={song?.videoUrl || song?.audioUrl || audioPreviewUrl} artist={formData.artist} description={formData.description} duration={audioDuration} languages={previewLanguages} lastSavedLabel={lastSavedLabel} lyrics={lyrics} mediaType={song?.videoUrl ? 'video' : mediaType} moods={selectedMoods} theme={formData.theme} title={formData.title} youtubeLink={formData.youtubeLink} />
      {!readiness.ready && <p className="studio-workflow-message is-error">Publishing requirements remaining: {readiness.missing.join(', ') || 'Save the draft to check readiness.'}</p>}
    </section> : <section className="studio-main-grid"><div className="studio-form-column">
      <MetadataStepper activeStep={studioStep} onStepChange={setStudioStep} />
      {studioStep === 1 ? <SongInformationCard audioFileName={audioFileName} coverImageUrl={coverImageUrl} descriptionLength={formData.description.length} formData={formData} onAudioFileChange={handleMedia} onAudioFileClear={() => { setSelectedMediaFile(null); setAudioFileName(''); setAudioPreviewUrl(song?.audioUrl || '') }} onCoverImageChange={handleCover} onFieldChange={(field, value) => setFormData((current) => ({ ...current, [field]: value }))} onLanguageToggle={(language) => setSelectedLanguages((current) => current.includes(language) ? current.filter((item) => item !== language) : [...current, language])} onMoodToggle={(mood) => setSelectedMoods((current) => current.includes(mood) ? current.filter((item) => item !== mood) : [...current, mood].slice(0, 5))} onOtherLanguageChange={(value) => { setFormData((current) => ({ ...current, otherLanguage: value })); if (value.trim()) setSelectedLanguages((current) => current.includes('Others') ? current : [...current, 'Others']) }} onYouTubeLinkChange={(value) => setFormData((current) => ({ ...current, youtubeLink: value }))} selectedLanguages={selectedLanguages} selectedMoods={selectedMoods} />
        : <LyricsCard canExtractLyrics={Boolean(selectedMediaFile || formData.youtubeLink.trim())} extractionError={extractionError} extractionStatus={extractionStatus} lyrics={lyrics} onExtractLyrics={extractLyrics} onLyricsChange={setLyrics} transcriptionStatus={transcriptionStatus} youtubeLink={formData.youtubeLink} />}
    </div><LivePreviewCard artist={formData.artist} audioSrc={song?.audioUrl || audioPreviewUrl} description={formData.description} duration={audioDuration} languages={previewLanguages} mediaType={mediaType} moods={selectedMoods} theme={formData.theme} title={formData.title} youtubeLink={formData.youtubeLink} /></section>}
    <StudioFooter activeStep={studioStep} disabled={isBusy || (studioStep === 3 && !readiness.ready)} lastSavedLabel={lastSavedLabel} onNext={() => setStudioStep((step) => Math.min(step + 1, 3))} onPublish={handlePublishSong} />
  </div>
}
