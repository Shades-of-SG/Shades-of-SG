import { useEffect, useMemo, useState } from 'react'
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import LyricsCard from '../components/studio/LyricsCard'
import LivePreviewCard from '../components/studio/LivePreviewCard'
import MetadataStepper from '../components/studio/MetadataStepper'
import PreviewPublishPanel from '../components/studio/PreviewPublishPanel'
import PublishReadinessModal from '../components/studio/PublishReadinessModal'
import RhythmBeatmapPanel from '../components/studio/RhythmBeatmapPanel'
import SongInformationCard from '../components/studio/SongInformationCard'
import StudioFooter from '../components/studio/StudioFooter'
import StudioHeader from '../components/studio/StudioHeader'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../services/apiConfig'
import {
  createDraft,
  getCreatorSong,
  getPublishReadiness,
  publishSong,
  startGeneration,
  updateDraft,
  uploadAudio,
  uploadCover,
  uploadVideo,
} from '../services/songService'

const emptyForm = {
  artist: '',
  description: '',
  otherLanguage: '',
  theme: '',
  title: '',
  youtubeLink: '',
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',').pop() : result)
    }

    reader.onerror = () => {
      reject(new Error('Unable to read media file.'))
    }

    reader.readAsDataURL(file)
  })
}

function getMimeType(file) {
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
    webm: 'video/webm',
  }

  return mimeTypes[extension] || 'audio/mpeg'
}

function isVideoFile(file) {
  const fileName = file.name.toLowerCase()

  return (
    file.type.startsWith('video/') ||
    fileName.endsWith('.mp4') ||
    fileName.endsWith('.webm')
  )
}

function friendlyActionError(error, action = 'save your draft') {
  const message = String(error?.message || '')

  if (/title before saving|song title is required|add a title/i.test(message)) {
    return 'Add a song title before saving your draft.'
  }

  if (/file type|MP3|WAV|MP4|WebM|cover image/i.test(message)) {
    return message
  }

  if (
    /network|failed to fetch|internal server|ENOTFOUND|ECONNREFUSED/i.test(
      message
    )
  ) {
    return `We couldn’t ${action} right now. Check your connection and try again.`
  }

  return message || `We couldn’t ${action}. Please try again.`
}

export default function Studio() {
  const { songId: routeSongId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuth()

  const [songId, setSongId] = useState(routeSongId || '')
  const [song, setSong] = useState(null)

  const [formData, setFormData] = useState(emptyForm)
  const [selectedLanguages, setSelectedLanguages] = useState([])
  const [selectedMoods, setSelectedMoods] = useState([])
  const [lyrics, setLyrics] = useState('')
  const [transcriptionSegments, setTranscriptionSegments] = useState([])

  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverFileName, setCoverFileName] = useState('')
  const [pendingCover, setPendingCover] = useState(null)

  const [selectedMediaFile, setSelectedMediaFile] = useState(null)
  const [audioFileName, setAudioFileName] = useState('')
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('')
  const [mediaType, setMediaType] = useState('')

  const [studioStep, setStudioStep] = useState(1)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(routeSongId))
  const [isBusy, setIsBusy] = useState(false)

  const [message, setMessage] = useState({
    type: '',
    text: '',
  })

  const [publishPrompt, setPublishPrompt] = useState(null)

  const [extractionStatus, setExtractionStatus] = useState('idle')
  const [extractionError, setExtractionError] = useState('')

  const [transcriptionStatus, setTranscriptionStatus] = useState({
    configured: null,
    error: '',
  })

  useEffect(() => {
    if (!message.text) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setMessage({
        type: '',
        text: '',
      })
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [message.text])

  /*
   * Support navigation from another page that passes temporary Studio data.
   * The song route and backend remain the primary source of truth.
   */
  useEffect(() => {
    if (routeSongId || !location.state) {
      return
    }

    const {
      songData,
      videoUrl,
      lyrics: passedLyrics,
      transcriptionSegments: passedSegments,
    } = location.state

    const passedSong = songData || {}

    setFormData((current) => ({
      ...current,
      artist: passedSong.artist || current.artist,
      description: passedSong.description || current.description,
      otherLanguage:
        passedSong.otherLanguages?.join(', ') ||
        current.otherLanguage,
      theme: passedSong.theme || current.theme,
      title: passedSong.title || current.title,
      youtubeLink:
        passedSong.sourceYoutubeUrl ||
        passedSong.youtubeUrl ||
        current.youtubeLink,
    }))

    setSelectedLanguages([
      ...(passedSong.languages || []),
      ...(passedSong.otherLanguages?.length ? ['Others'] : []),
    ])

    setSelectedMoods(passedSong.moodTags || [])

    if (passedLyrics || passedSong.rawLyrics || passedSong.lyrics) {
      setLyrics(
        passedLyrics ||
          passedSong.rawLyrics ||
          passedSong.lyrics ||
          ''
      )
    }

    setTranscriptionSegments(
      passedSegments ||
        passedSong.transcriptionSegments ||
        []
    )

    const mediaUrl =
      videoUrl ||
      passedSong.videoUrl ||
      passedSong.audioUrl ||
      ''

    if (mediaUrl) {
      setAudioPreviewUrl(mediaUrl)
      setMediaType(
        videoUrl || passedSong.videoUrl ? 'video' : 'audio'
      )
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    })
  }, [
    location.pathname,
    location.state,
    navigate,
    routeSongId,
  ])

  /*
   * Load an existing song when visiting /creator/studio/:songId.
   */
  useEffect(() => {
    if (!routeSongId) {
      return undefined
    }

    let active = true

    setIsLoading(true)

    getCreatorSong(routeSongId, token)
      .then((loadedSong) => {
        if (!active) {
          return
        }

        const loadedOtherLanguages =
          loadedSong.otherLanguages || []

        setSong(loadedSong)
        setSongId(loadedSong.id)

        setFormData({
          artist: loadedSong.artist || '',
          description: loadedSong.description || '',
          otherLanguage: loadedOtherLanguages.join(', '),
          theme: loadedSong.theme || '',
          title: loadedSong.title || '',
          youtubeLink:
            loadedSong.sourceYoutubeUrl ||
            loadedSong.youtubeUrl ||
            '',
        })

        setSelectedLanguages([
          ...(loadedSong.languages || []),
          ...(loadedOtherLanguages.length ? ['Others'] : []),
        ])

        setSelectedMoods(loadedSong.moodTags || [])
        setLyrics(loadedSong.rawLyrics || '')
        setTranscriptionSegments(
          loadedSong.transcriptionSegments || []
        )

        setCoverImageUrl(loadedSong.coverImageUrl || '')
        setCoverFileName('')
        setPendingCover(null)

        setAudioPreviewUrl(
          loadedSong.videoUrl ||
            loadedSong.audioUrl ||
            ''
        )

        setMediaType(
          loadedSong.videoUrl
            ? 'video'
            : loadedSong.audioUrl
              ? 'audio'
              : ''
        )

        setLastSavedAt(
          new Date(loadedSong.updatedAt || Date.now())
        )
      })
      .catch((error) => {
        if (active) {
          setMessage({
            type: 'error',
            text: friendlyActionError(
              error,
              'load this saved draft'
            ),
          })
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [routeSongId, token])

  /*
   * Release local object URLs when files are changed or the page unmounts.
   */
  useEffect(() => {
    return () => {
      if (audioPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(audioPreviewUrl)
      }

      if (coverImageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(coverImageUrl)
      }
    }
  }, [audioPreviewUrl, coverImageUrl])

  /*
   * Check whether transcription is available when opening the Lyrics step.
   */
  useEffect(() => {
    if (
      studioStep !== 2 ||
      transcriptionStatus.configured !== null
    ) {
      return undefined
    }

    let active = true

    fetch(`${API_URL}/transcriptions/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to check transcription status.'
          )
        }

        return data
      })
      .then((data) => {
        if (!active) {
          return
        }

        setTranscriptionStatus({
          configured: Boolean(data.configured),
          error: data.configured
            ? ''
            : 'AI transcription is not configured. Add OPENAI_API_KEY to the backend environment and restart it.',
        })
      })
      .catch(() => {
        if (!active) {
          return
        }

        setTranscriptionStatus({
          configured: false,
          error:
            'Unable to reach the transcription backend. Check the backend server and VITE_API_URL.',
        })
      })

    return () => {
      active = false
    }
  }, [
    studioStep,
    token,
    transcriptionStatus.configured,
  ])

  const otherLanguages = formData.otherLanguage
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const languages = selectedLanguages.filter(
    (language) => language !== 'Others'
  )

  const previewLanguages = [
    ...languages,
    ...otherLanguages,
  ]

  const audioDuration = song?.durationSecs
    ? `${Math.floor(song.durationSecs / 60)}:${String(
        Math.floor(song.durationSecs % 60)
      ).padStart(2, '0')}`
    : ''

  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) {
      return 'Draft not saved yet'
    }

    return `Draft last saved at ${lastSavedAt.toLocaleTimeString(
      [],
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    )}`
  }, [lastSavedAt])

  function draftValues() {
    return {
      artist: formData.artist,
      description: formData.description,
      languages,
      moodTags: selectedMoods,
      otherLanguages,
      rawLyrics: lyrics,
      sourceYoutubeUrl: formData.youtubeLink,
      theme: formData.theme,
      title: formData.title,
      transcriptionSegments,
    }
  }

  function visiblePublishTasks() {
    const missing = []

    if (!formData.title.trim()) {
      missing.push('title')
    }

    if (!formData.artist.trim()) {
      missing.push('artist')
    }

    if (!formData.description.trim()) {
      missing.push('description')
    }

    if (!formData.theme.trim()) {
      missing.push('theme')
    }

    if (!previewLanguages.length) {
      missing.push('languages')
    }

    if (!lyrics.trim()) {
      missing.push('rawLyrics')
    }

    if (!coverImageUrl && !pendingCover) {
      missing.push('coverImageUrl')
    }

    if (!song?.audioUrl && !selectedMediaFile) {
      missing.push('audioUrl')
    }

    if (!song?.videoUrl) {
      missing.push('videoUrl', 'status READY')
    }

    return missing
  }

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function toggleLanguage(language) {
    setSelectedLanguages((current) => {
      if (current.includes(language)) {
        return current.filter(
          (item) => item !== language
        )
      }

      return [...current, language]
    })
  }

  function toggleMood(mood) {
    setSelectedMoods((current) => {
      if (current.includes(mood)) {
        return current.filter((item) => item !== mood)
      }

      if (current.length >= 5) {
        return current
      }

      return [...current, mood]
    })
  }

  function updateOtherLanguage(value) {
    updateField('otherLanguage', value)

    if (value.trim()) {
      setSelectedLanguages((current) =>
        current.includes('Others')
          ? current
          : [...current, 'Others']
      )
    }
  }

  function resetExtractionState() {
    setExtractionStatus('idle')
    setExtractionError('')
  }

  function handleMediaChange(event) {
    const file = event.target.files?.[0] || null

    resetExtractionState()
    setSelectedMediaFile(file)
    setAudioFileName(file?.name || '')

    if (!file) {
      setAudioPreviewUrl(
        song?.videoUrl || song?.audioUrl || ''
      )

      setMediaType(
        song?.videoUrl
          ? 'video'
          : song?.audioUrl
            ? 'audio'
            : ''
      )

      return
    }

    setMediaType(isVideoFile(file) ? 'video' : 'audio')
    setAudioPreviewUrl(URL.createObjectURL(file))
  }

  function clearMediaSelection() {
    resetExtractionState()
    setSelectedMediaFile(null)
    setAudioFileName('')

    setAudioPreviewUrl(
      song?.videoUrl || song?.audioUrl || ''
    )

    setMediaType(
      song?.videoUrl
        ? 'video'
        : song?.audioUrl
          ? 'audio'
          : ''
    )
  }

  function handleCoverChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setPendingCover(file)
    setCoverFileName(file.name)
    setCoverImageUrl(URL.createObjectURL(file))
  }

  function clearCoverSelection() {
    setPendingCover(null)
    setCoverFileName('')
    setCoverImageUrl(song?.coverImageUrl || '')
  }

  async function saveDraft({ quiet = false } = {}) {
    setIsBusy(true)
    setMessage({
      type: '',
      text: '',
    })

    try {
      if (!formData.title.trim()) {
        throw new Error(
          'Add a title before saving the draft.'
        )
      }

      let savedSong = songId
        ? await updateDraft(
            songId,
            draftValues(),
            token
          )
        : await createDraft(
            draftValues(),
            token,
            selectedMediaFile
          )

      const stableId = savedSong.id

      /*
       * createDraft handles initial media.
       * Existing songs upload newly selected media separately.
       */
      if (songId && selectedMediaFile) {
        savedSong = await uploadAudio(
          stableId,
          selectedMediaFile,
          token
        )
      }

      if (pendingCover) {
        const coverResult = await uploadCover(
          stableId,
          pendingCover,
          token
        )

        savedSong = coverResult.song
        setCoverImageUrl(coverResult.coverImageUrl)
      }

      setSong(savedSong)
      setSongId(stableId)
      setSelectedMediaFile(null)
      setAudioFileName('')
      setPendingCover(null)
      setCoverFileName('')

      setLastSavedAt(
        new Date(savedSong.updatedAt || Date.now())
      )

      if (!routeSongId) {
        navigate(`/creator/studio/${stableId}`, {
          replace: true,
        })
      }

      if (!quiet) {
        setMessage({
          type: 'success',
          text: 'Draft saved.',
        })
      }

      return savedSong
    } catch (error) {
      setMessage({
        type: 'error',
        text: friendlyActionError(error),
      })

      error.userMessageShown = true
      throw error
    } finally {
      setIsBusy(false)
    }
  }

  async function handleGenerateVideo() {
    setPublishPrompt(null)

    try {
      const savedSong = await saveDraft({
        quiet: true,
      })

      const job = await startGeneration(savedSong.id, token)

      setMessage({
        type: 'success',
        text:
          'Draft saved and video generation queued.',
      })

      navigate(`/creator/generation/${job.id}`)
    } catch (error) {
      if (!error.userMessageShown) {
        setMessage({
          type: 'error',
          text: friendlyActionError(
            error,
            'start video generation'
          ),
        })
      }
    }
  }

  async function handlePublishSong() {
    const visibleMissing = visiblePublishTasks()

    if (visibleMissing.length) {
      setMessage({
        type: '',
        text: '',
      })

      setPublishPrompt({
        missing: visibleMissing,
        ready: false,
      })

      return
    }

    setIsBusy(true)
    setMessage({
      type: '',
      text: '',
    })

    try {
      const savedSong = await saveDraft({
        quiet: true,
      })

      const readiness = await getPublishReadiness(
        savedSong.id,
        token
      )

      if (!readiness.ready) {
        setPublishPrompt(readiness)
        return
      }

      const publishedSong = await publishSong(
        savedSong.id,
        token
      )

      setSong(publishedSong)

      setMessage({
        type: 'success',
        text: 'Song published successfully.',
      })
    } catch (error) {
      if (!error.userMessageShown) {
        setMessage({
          type: 'error',
          text: friendlyActionError(
            error,
            'publish your song'
          ),
        })
      }
    } finally {
      setIsBusy(false)
    }
  }

  async function handleUploadVideo(file) {
    setIsBusy(true)
    setMessage({
      type: '',
      text: '',
    })

    try {
      const savedSong = await saveDraft({
        quiet: true,
      })

      const uploadedSong = await uploadVideo(
        savedSong.id,
        file,
        token
      )

      setSong(uploadedSong)
      setAudioPreviewUrl(
        uploadedSong.videoUrl ||
          uploadedSong.audioUrl ||
          ''
      )
      setMediaType('video')

      const readiness = await getPublishReadiness(
        uploadedSong.id,
        token
      )

      setPublishPrompt(
        readiness.ready ? null : readiness
      )

      setMessage({
        type: 'success',
        text:
          'Video uploaded. Your draft is ready for another review.',
      })
    } catch (error) {
      if (!error.userMessageShown) {
        setMessage({
          type: 'error',
          text: friendlyActionError(
            error,
            'upload your video'
          ),
        })
      }
    } finally {
      setIsBusy(false)
    }
  }

  async function extractLyrics() {
    setExtractionStatus('loading')
    setExtractionError('')

    try {
      if (transcriptionStatus.configured === false) {
        throw new Error(
          transcriptionStatus.error ||
            'AI transcription is not configured.'
        )
      }

      if (
        !selectedMediaFile &&
        !formData.youtubeLink.trim()
      ) {
        throw new Error(
          'Upload an audio or video file, or paste a YouTube link before extracting lyrics.'
        )
      }

      if (
        selectedMediaFile &&
        selectedMediaFile.size > 25 * 1024 * 1024
      ) {
        throw new Error(
          'AI transcription supports files up to 25MB. Please upload a smaller file.'
        )
      }

      const payload = selectedMediaFile
        ? {
            fileName: selectedMediaFile.name,
            mediaBase64:
              await readFileAsBase64(
                selectedMediaFile
              ),
            mimeType:
              getMimeType(selectedMediaFile),
          }
        : {
            youtubeUrl:
              formData.youtubeLink.trim(),
          }

      const response = await fetch(
        `${API_URL}/transcriptions/lyrics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await response
        .json()
        .catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            'Unable to extract lyrics.'
        )
      }

      setLyrics(data.lyrics || '')
      setTranscriptionSegments(data.segments || [])
      setExtractionStatus('success')
    } catch (error) {
      setExtractionError(error.message)
      setExtractionStatus('error')
    }
  }

  function goToIncompleteTask(step) {
    setPublishPrompt(null)
    setStudioStep(step)

    window.scrollTo({
      behavior: 'smooth',
      top: 0,
    })
  }

  function handleNextStep() {
    setStudioStep((current) =>
      Math.min(current + 1, 3)
    )
  }

  if (isLoading) {
    return (
      <div className="studio-page">
        <p role="status">Loading saved draft…</p>
      </div>
    )
  }

  return (
    <div className="studio-page">
      <StudioHeader
        activeStep={studioStep}
        isBusy={isBusy}
        onBackToLyrics={() => setStudioStep(2)}
        onGenerateVideo={handleGenerateVideo}
        onPublishSong={handlePublishSong}
        onSaveDraft={() =>
          saveDraft().catch(() => {})
        }
      />

      {message.text && (
        <div
          className={`studio-workflow-message studio-action-toast is-${message.type}`}
          role={
            message.type === 'error'
              ? 'alert'
              : 'status'
          }
        >
          {message.text}
        </div>
      )}

      {studioStep === 3 ? (
        <section className="studio-form-column">
          <MetadataStepper
            activeStep={studioStep}
            compact
            onStepChange={setStudioStep}
          />

          <PreviewPublishPanel
            audioSrc={
              audioPreviewUrl ||
              song?.videoUrl ||
              song?.audioUrl
            }
            artist={formData.artist}
            description={formData.description}
            duration={audioDuration}
            languages={previewLanguages}
            lastSavedLabel={lastSavedLabel}
            lyrics={lyrics}
            mediaType={
              mediaType ||
              (song?.videoUrl
                ? 'video'
                : song?.audioUrl
                  ? 'audio'
                  : '')
            }
            moods={selectedMoods}
            theme={formData.theme}
            title={formData.title}
            youtubeLink={formData.youtubeLink}
          />
        </section>
      ) : (
        <section className="studio-main-grid">
          <div className="studio-form-column">
            <MetadataStepper
              activeStep={studioStep}
              onStepChange={setStudioStep}
            />

            {studioStep === 1 ? (
              <SongInformationCard
                audioFileName={audioFileName}
                coverFileName={coverFileName}
                coverImageUrl={coverImageUrl}
                descriptionLength={
                  formData.description.length
                }
                formData={formData}
                onAudioFileChange={handleMediaChange}
                onAudioFileClear={clearMediaSelection}
                onCoverImageChange={handleCoverChange}
                onCoverImageClear={
                  clearCoverSelection
                }
                onFieldChange={updateField}
                onLanguageToggle={toggleLanguage}
                onMoodToggle={toggleMood}
                onOtherLanguageChange={
                  updateOtherLanguage
                }
                onYouTubeLinkChange={(value) => {
                  resetExtractionState()
                  updateField('youtubeLink', value)
                }}
                selectedLanguages={
                  selectedLanguages
                }
                selectedMoods={selectedMoods}
              />
            ) : (
              <LyricsCard
                canExtractLyrics={Boolean(
                  selectedMediaFile ||
                    formData.youtubeLink.trim()
                )}
                extractionError={extractionError}
                extractionStatus={extractionStatus}
                lyrics={lyrics}
                onExtractLyrics={extractLyrics}
                onLyricsChange={setLyrics}
                transcriptionStatus={
                  transcriptionStatus
                }
                youtubeLink={formData.youtubeLink}
              />
            )}

            <RhythmBeatmapPanel
              onBeforeGenerate={() => saveDraft({ quiet: true })}
              songId={songId}
              songStatus={song?.status}
              token={token}
            />
          </div>

          <LivePreviewCard
            artist={formData.artist}
            audioSrc={
              audioPreviewUrl || song?.audioUrl
            }
            description={formData.description}
            duration={audioDuration}
            languages={previewLanguages}
            mediaType={
              mediaType ||
              (song?.videoUrl
                ? 'video'
                : song?.audioUrl
                  ? 'audio'
                  : '')
            }
            moods={selectedMoods}
            theme={formData.theme}
            title={formData.title}
            youtubeLink={formData.youtubeLink}
          />
        </section>
      )}

      <StudioFooter
        activeStep={studioStep}
        disabled={isBusy}
        lastSavedLabel={lastSavedLabel}
        onNext={handleNextStep}
        onPublish={handlePublishSong}
      />

      {publishPrompt && (
        <PublishReadinessModal
          busy={isBusy}
          missing={publishPrompt.missing || []}
          onClose={() => setPublishPrompt(null)}
          onGenerateVideo={handleGenerateVideo}
          onGoToStep={goToIncompleteTask}
          onUploadVideo={handleUploadVideo}
        />
      )}
    </div>
  )
}
