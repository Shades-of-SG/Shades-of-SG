import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LyricsCard from '../components/studio/LyricsCard'
import LivePreviewCard from '../components/studio/LivePreviewCard'
import MetadataStepper from '../components/studio/MetadataStepper'
import PreviewPublishPanel from '../components/studio/PreviewPublishPanel'
import PublishReadinessModal from '../components/studio/PublishReadinessModal'
import SongInformationCard from '../components/studio/SongInformationCard'
import StudioFooter from '../components/studio/StudioFooter'
import StudioHeader from '../components/studio/StudioHeader'
import RhythmBeatmapPanel from '../components/studio/RhythmBeatmapPanel'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../services/apiConfig'
import { createDraft, getCreatorSong, getPublishReadiness, publishSong, startGeneration, updateDraft, uploadAudio, uploadCover, uploadVideo } from '../services/songService'

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

function isVideoFile(file) {
  if (!file) return false
  return ['video/mp4', 'video/webm'].includes(file.type)
    || /\.(mp4|webm)$/i.test(file.name || '')
}

function isUploadedVideoMedia(song) {
  if (song?.videoUrl) return true
  return [song?.audioFileName, song?.audioUrl]
    .filter(Boolean)
    .some((value) => /\.(mp4|webm)(?:[?#].*)?$/i.test(String(value)))
}

function savedMediaName(audioFileName, audioUrl) {
  if (audioFileName) return audioFileName
  if (!audioUrl) return ''

  try {
    return decodeURIComponent(new URL(audioUrl).pathname.split('/').pop()) || 'Uploaded song media'
  } catch {
    return 'Uploaded song media'
  }
}

function friendlyActionError(error, action = 'save your draft') {
  const message = String(error?.message || '')
  if (/title before saving|song title is required/i.test(message)) return 'Add a song title before saving your draft.'
  if (/file type|MP3|WAV|MP4|WebM|cover image/i.test(message)) return message
  if (/network|failed to fetch|internal server|ENOTFOUND/i.test(message)) return `We couldn’t ${action} right now. Check your connection and try again.`
  return message || `We couldn’t ${action}. Please try again.`
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
  const [coverFileName, setCoverFileName] = useState('')
  const [pendingCover, setPendingCover] = useState(null)
  const [selectedMediaFile, setSelectedMediaFile] = useState(null)
  const [audioFileName, setAudioFileName] = useState('')
  const [savedAudioFileName, setSavedAudioFileName] = useState('')
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [studioStep, setStudioStep] = useState(1)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(routeSongId))
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [publishPrompt, setPublishPrompt] = useState(null)
  const [extractionStatus, setExtractionStatus] = useState('idle')
  const [extractionError, setExtractionError] = useState('')
  const [transcriptionStatus, setTranscriptionStatus] = useState({ configured: null, error: '' })

  useEffect(() => {
    if (!message.text) return undefined
    const timer = window.setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    return () => window.clearTimeout(timer)
  }, [message.text])

  useEffect(() => {
    if (!routeSongId) return undefined
    let active = true
    getCreatorSong(routeSongId, token)
      .then((loadedSong) => {
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
        setCoverFileName('')
        setSavedAudioFileName(savedMediaName(loadedSong.audioFileName, loadedSong.videoUrl || loadedSong.audioUrl))
        setAudioPreviewUrl(loadedSong.videoUrl || loadedSong.audioUrl || '')
        setMediaType(isUploadedVideoMedia(loadedSong) ? 'video' : loadedSong.audioUrl ? 'audio' : '')
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

  function visiblePublishTasks() {
    const missing = []
    if (!formData.title.trim()) missing.push('title')
    if (!formData.artist.trim()) missing.push('artist')
    if (!formData.description.trim()) missing.push('description')
    if (!formData.theme.trim()) missing.push('theme')
    if (!previewLanguages.length) missing.push('languages')
    if (!lyrics.trim()) missing.push('rawLyrics')
    if (!coverImageUrl && !pendingCover) missing.push('coverImageUrl')
    if (!song?.audioUrl && !selectedMediaFile) missing.push('audioUrl')
    if (!isUploadedVideoMedia(song) && !isVideoFile(selectedMediaFile)) missing.push('videoUrl', 'status READY')
    return missing
  }

  async function saveDraft({ quiet = false } = {}) {
    setIsBusy(true)
    setMessage({ type: '', text: '' })
    try {
      if (!formData.title.trim()) throw new Error('Add a title before saving the draft.')
      let saved = songId
        ? await updateDraft(songId, values(), token)
        : await createDraft(values(), token)
      const stableId = saved.id
      if (selectedMediaFile) {
        const uploadedFile = selectedMediaFile
        saved = isVideoFile(uploadedFile)
          ? await uploadVideo(stableId, uploadedFile, token)
          : await uploadAudio(stableId, uploadedFile, token)
        setSavedAudioFileName(uploadedFile.name)
        setSelectedMediaFile(null)
      }
      if (pendingCover) {
        const coverResult = await uploadCover(stableId, pendingCover, token)
        saved = coverResult.song
        setCoverImageUrl(coverResult.coverImageUrl)
        setPendingCover(null)
        setCoverFileName('')
      }
      setSong(saved)
      setSavedAudioFileName((current) => current || savedMediaName(saved.audioFileName, saved.videoUrl || saved.audioUrl))
      setAudioFileName('')
      setSongId(stableId)
      setLastSavedAt(new Date(saved.updatedAt || Date.now()))
      if (!routeSongId) navigate(`/creator/studio/${stableId}`, { replace: true })
      if (!quiet) setMessage({ type: 'success', text: 'Draft saved.' })
      return saved
    } catch (error) {
      setMessage({ type: 'error', text: friendlyActionError(error) })
      error.userMessageShown = true
      throw error
    } finally { setIsBusy(false) }
  }

  async function handleGenerateVideo() {
    setPublishPrompt(null)
    try {
      const saved = await saveDraft({ quiet: true })
      await startGeneration(saved.id, token)
      setMessage({ type: 'success', text: 'Draft saved and video generation queued.' })
      navigate(`/creator/generation`)
    } catch (error) {
      if (!error.userMessageShown) setMessage({ type: 'error', text: friendlyActionError(error, 'start video generation') })
    }
  }

  async function handlePublishSong() {
    const visibleMissing = visiblePublishTasks()
    if (visibleMissing.length) {
      setMessage({ type: '', text: '' })
      setPublishPrompt({ missing: visibleMissing, ready: false })
      return
    }
    setIsBusy(true)
    setMessage({ type: '', text: '' })
    try {
      const saved = await saveDraft({ quiet: true })
      const refreshed = await getPublishReadiness(saved.id, token)
      if (!refreshed.ready) { setPublishPrompt(refreshed); return }
      const published = await publishSong(saved.id, token)
      setSong(published)
      setMessage({ type: 'success', text: 'Song published successfully.' })
    } catch (error) {
      if (!error.userMessageShown) setMessage({ type: 'error', text: friendlyActionError(error, 'publish your song') })
    } finally { setIsBusy(false) }
  }

  async function handleUploadVideo(file) {
    setIsBusy(true)
    setMessage({ type: '', text: '' })
    try {
      const saved = await saveDraft({ quiet: true })
      const uploaded = await uploadVideo(saved.id, file, token)
      setSong(uploaded)
      setAudioPreviewUrl(uploaded.videoUrl || uploaded.audioUrl || '')
      setMediaType('video')
      const refreshed = await getPublishReadiness(uploaded.id, token)
      if (refreshed.ready) {
        const published = await publishSong(uploaded.id, token)
        setSong(published)
        setPublishPrompt(null)
        setMessage({ type: 'success', text: 'Video uploaded and song published successfully.' })
      } else {
        setPublishPrompt(refreshed)
        setMessage({ type: 'success', text: 'Video uploaded. Complete the remaining song details to publish.' })
      }
    } catch (error) {
      if (!error.userMessageShown) setMessage({ type: 'error', text: friendlyActionError(error, 'upload your video') })
    } finally { setIsBusy(false) }
  }

  function goToIncompleteTask(step) {
    setPublishPrompt(null)
    setStudioStep(step)
    window.scrollTo({ behavior: 'smooth', top: 0 })
  }

  async function extractLyrics() {
    setExtractionStatus('loading'); setExtractionError('')
    try {
      if (transcriptionStatus.configured === false) throw new Error(transcriptionStatus.error)
      const payload = selectedMediaFile
        ? { fileName: selectedMediaFile.name, mediaBase64: await readFileAsBase64(selectedMediaFile), mimeType: mimeType(selectedMediaFile) }
        : formData.youtubeLink.trim()
          ? { youtubeUrl: formData.youtubeLink }
          : { songId }
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const response = await fetch(`${API_URL}/transcriptions/lyrics`, { body: JSON.stringify(payload), headers, method: 'POST' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Unable to extract lyrics.')
      setLyrics(data.lyrics || ''); setExtractionStatus('success')
    } catch (error) { setExtractionError(error.message); setExtractionStatus('error') }
  }

  function handleMedia(event) {
    const file = event.target.files?.[0] || null
    const maxBytes = isVideoFile(file) ? 100 * 1024 * 1024 : 50 * 1024 * 1024
    if (file && file.size > maxBytes) {
      event.target.value = ''
      setSelectedMediaFile(null); setAudioFileName('')
      setMessage({
        type: 'error',
        text: isVideoFile(file)
          ? 'The video is too large. Upload an MP4 or WebM file up to 100MB.'
          : 'The audio file is too large. Upload a file up to 50MB.',
      })
      return
    }
    setSelectedMediaFile(file); setAudioFileName(file?.name || '')
    if (!file) return setAudioPreviewUrl(song?.videoUrl || song?.audioUrl || '')
    setMediaType(isVideoFile(file) ? 'video' : 'audio')
    setAudioPreviewUrl(URL.createObjectURL(file))
  }

  function handleCover(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setPendingCover(file)
    setCoverFileName(file.name)
    setCoverImageUrl(URL.createObjectURL(file))
  }

  function clearCoverSelection() {
    setPendingCover(null)
    setCoverFileName('')
    setCoverImageUrl(song?.coverImageUrl || '')
  }

  if (isLoading) return <div className="studio-page"><p role="status">Loading saved draft…</p></div>

  return <div className="studio-page">
    <StudioHeader activeStep={studioStep} isBusy={isBusy} onBackToLyrics={() => setStudioStep(2)} onGenerateVideo={handleGenerateVideo} onPublishSong={handlePublishSong} onSaveDraft={() => saveDraft().catch(() => {})} />
    {message.text && <div className={`studio-workflow-message studio-action-toast is-${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</div>}
    {studioStep === 3 ? <section className="studio-form-column">
      <MetadataStepper activeStep={studioStep} compact onStepChange={setStudioStep} />
      <PreviewPublishPanel audioSrc={audioPreviewUrl || song?.videoUrl || song?.audioUrl} artist={formData.artist} description={formData.description} duration={audioDuration} languages={previewLanguages} lastSavedLabel={lastSavedLabel} lyrics={lyrics} mediaType={mediaType || (song?.videoUrl ? 'video' : 'audio')} moods={selectedMoods} theme={formData.theme} title={formData.title} youtubeLink={formData.youtubeLink} />
    </section> : <section className="studio-main-grid"><div className="studio-form-column">
      <MetadataStepper activeStep={studioStep} onStepChange={setStudioStep} />
      {studioStep === 1 ? <SongInformationCard audioFileName={audioFileName} coverFileName={coverFileName} coverImageUrl={coverImageUrl} descriptionLength={formData.description.length} formData={formData} onAudioFileChange={handleMedia} onAudioFileClear={() => { setSelectedMediaFile(null); setAudioFileName(''); setAudioPreviewUrl(song?.videoUrl || song?.audioUrl || '') }} onCoverImageChange={handleCover} onCoverImageClear={clearCoverSelection} onFieldChange={(field, value) => setFormData((current) => ({ ...current, [field]: value }))} onLanguageToggle={(language) => setSelectedLanguages((current) => current.includes(language) ? current.filter((item) => item !== language) : [...current, language])} onMoodToggle={(mood) => setSelectedMoods((current) => current.includes(mood) ? current.filter((item) => item !== mood) : [...current, mood].slice(0, 5))} onOtherLanguageChange={(value) => { setFormData((current) => ({ ...current, otherLanguage: value })); if (value.trim()) setSelectedLanguages((current) => current.includes('Others') ? current : [...current, 'Others']) }} onYouTubeLinkChange={(value) => setFormData((current) => ({ ...current, youtubeLink: value }))} savedAudioFileName={savedAudioFileName} savedAudioUrl={song?.videoUrl || song?.audioUrl || ''} selectedLanguages={selectedLanguages} selectedMoods={selectedMoods} />
        : <LyricsCard canExtractLyrics={Boolean(selectedMediaFile || formData.youtubeLink.trim() || song?.videoUrl || song?.audioUrl)} extractionError={extractionError} extractionStatus={extractionStatus} lyrics={lyrics} onExtractLyrics={extractLyrics} onLyricsChange={setLyrics} transcriptionStatus={transcriptionStatus} youtubeLink={formData.youtubeLink} />}
      <RhythmBeatmapPanel songId={songId} songStatus={song?.status} token={token} />
    </div><LivePreviewCard artist={formData.artist} audioSrc={audioPreviewUrl || song?.audioUrl} description={formData.description} duration={audioDuration} languages={previewLanguages} mediaType={mediaType} moods={selectedMoods} theme={formData.theme} title={formData.title} youtubeLink={formData.youtubeLink} /></section>}
    <StudioFooter activeStep={studioStep} disabled={isBusy} lastSavedLabel={lastSavedLabel} onNext={() => setStudioStep((step) => Math.min(step + 1, 3))} onPublish={handlePublishSong} />
    {publishPrompt ? <PublishReadinessModal busy={isBusy} missing={publishPrompt.missing} onClose={() => setPublishPrompt(null)} onGenerateVideo={handleGenerateVideo} onGoToStep={goToIncompleteTask} onUploadVideo={handleUploadVideo} /> : null}
  </div>
}
