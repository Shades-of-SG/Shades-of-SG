import { useEffect, useRef, useState } from 'react'

const emptyPreviewValue = '--'
const defaultPlaceholderYoutubeLink = 'https://youtu.be/HhxKClOx4PQ?si=Abw0g-Phmso2QK_x'

function getPreviewValue(value) {
  return value?.trim() || emptyPreviewValue
}

function getYoutubeEmbedUrl(value) {
  if (!value.trim()) {
    return ''
  }

  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^www\./, '')

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.split('/').filter(Boolean)[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
    }

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      const videoId = url.searchParams.get('v')

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }

      const pathParts = url.pathname.split('/').filter(Boolean)
      const embedIndex = pathParts.findIndex((part) => part === 'embed' || part === 'shorts')
      const pathVideoId = embedIndex >= 0 ? pathParts[embedIndex + 1] : ''
      return pathVideoId ? `https://www.youtube.com/embed/${pathVideoId}` : ''
    }
  } catch {
    return ''
  }

  return ''
}

function PreviewTagIcon({ type }) {
  if (type === 'language') {
    return (
      <svg aria-hidden="true" viewBox="0 -960 960 960">
        <path d="M325-111.5q-73-31.5-127.5-86t-86-127.5Q80-398 80-480.5t31.5-155q31.5-72.5 86-127t127.5-86Q398-880 480.5-880t155 31.5q72.5 31.5 127 86t86 127Q880-563 880-480.5T848.5-325q-31.5 73-86 127.5t-127 86Q563-80 480.5-80T325-111.5ZM480-162q26-36 45-75t31-83H404q12 44 31 83t45 75Zm-104-16q-18-33-31.5-68.5T322-320H204q29 50 72.5 87t99.5 55Zm208 0q56-18 99.5-55t72.5-87H638q-9 38-22.5 73.5T584-178ZM170-400h136q-3-20-4.5-39.5T300-480q0-21 1.5-40.5T306-560H170q-5 20-7.5 39.5T160-480q0 21 2.5 40.5T170-400Zm216 0h188q3-20 4.5-39.5T580-480q0-21-1.5-40.5T574-560H386q-3 20-4.5 39.5T380-480q0 21 1.5 40.5T386-400Zm268 0h136q5-20 7.5-39.5T800-480q0-21-2.5-40.5T790-560H654q3 20 4.5 39.5T660-480q0 21-1.5 40.5T654-400Zm-16-240h118q-29-50-72.5-87T584-782q18 33 31.5 68.5T638-640Zm-234 0h152q-12-44-31-83t-45-75q-26 36-45 75t-31 83Zm-200 0h118q9-38 22.5-73.5T376-782q-56 18-99.5 55T204-640Z" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 -960 960 960">
      <path d="M620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm263.5 221.5Q659-337 684-400H276q25 63 80.5 101.5T480-260q68 0 123.5-38.5ZM324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM480-480Zm227 227q93-93 93-227t-93-227q-93-93-227-93t-227 93q-93 93-93 227t93 227q93 93 227 93t227-93Z" />
    </svg>
  )
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
  youtubeLink = '',
}) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackMessage, setPlaybackMessage] = useState('')
  const activeLanguages = languages.filter((language) => language !== 'Others')
  const isVideoMedia = mediaType === 'video'
  const previewMoods = moods.length ? moods : theme ? [theme] : []
  const effectiveYoutubeLink = youtubeLink?.trim() || defaultPlaceholderYoutubeLink
  const youtubeEmbedUrl = audioSrc ? '' : getYoutubeEmbedUrl(effectiveYoutubeLink)
  const moodValue = previewMoods.length ? previewMoods.join(', ') : emptyPreviewValue
  const languageValue = activeLanguages.length ? activeLanguages.join(', ') : emptyPreviewValue
  const previewDetails = [
    { label: 'Theme', value: getPreviewValue(theme) },
    { label: 'Mood', value: moodValue },
    { label: 'Languages', value: languageValue },
    { label: 'Status', value: 'Draft' },
    { label: 'Duration', value: duration || emptyPreviewValue },
    { label: 'Views', value: 'Draft' },
  ]

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [audioSrc])

  async function handlePreviewPlayback() {
    if (!audioSrc || !audioRef.current) {
      setPlaybackMessage('Upload an audio file or paste a valid YouTube link to preview playback.')
      return
    }

    setPlaybackMessage('')

    if (!audioRef.current.paused) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch {
      setPlaybackMessage('Unable to play this audio file in the browser.')
      setIsPlaying(false)
    }
  }

  function enableVideoAudio(event) {
    event.currentTarget.muted = false
    event.currentTarget.volume = 1
  }

  return (
    <section className="studio-card studio-preview-card">
      <header className="studio-card__header studio-card__header--spread">
        <div>
          <p className="studio-card__eyebrow">Live Preview</p>
          <h2>See how the song will appear</h2>
        </div>
        <span className="studio-preview-card__status">DRAFT</span>
      </header>

      <div className="studio-preview-art" aria-hidden={youtubeEmbedUrl || isVideoMedia ? undefined : true}>
        {isVideoMedia && audioSrc ? (
          <video
            className="studio-preview-art__video"
            src={audioSrc}
            controls
            playsInline
            onEnded={() => setIsPlaying(false)}
            onLoadedMetadata={enableVideoAudio}
            onPause={() => setIsPlaying(false)}
            onPlay={(event) => {
              enableVideoAudio(event)
              setIsPlaying(true)
            }}
          />
        ) : youtubeEmbedUrl ? (
          <iframe
            className="studio-preview-art__youtube"
            src={youtubeEmbedUrl}
            title="YouTube song preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <>
            <svg className="studio-preview-art__svg" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" role="presentation">
              <defs>
                <linearGradient id="studio-sky" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7f5fb8" />
                  <stop offset="48%" stopColor="#2c2f6d" />
                  <stop offset="100%" stopColor="#0e1326" />
                </linearGradient>
                <linearGradient id="studio-haze" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f5c8ff" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#f5c8ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect fill="url(#studio-sky)" height="540" width="960" />
              <circle cx="784" cy="114" fill="#f8e7a8" opacity="0.88" r="30" />
              <ellipse cx="480" cy="126" fill="url(#studio-haze)" rx="420" ry="130" />
              <path d="M0 394 L98 352 L164 368 L242 326 L320 370 L392 332 L464 354 L520 322 L594 356 L666 314 L740 350 L816 326 L960 364 L960 540 L0 540 Z" fill="#241b45" />
              <path d="M0 422 L140 398 L218 432 L302 404 L386 436 L462 410 L550 442 L642 404 L724 430 L820 394 L960 420 L960 540 L0 540 Z" fill="#111628" />
              <g fill="#6a5a9b" opacity="0.92">
                <rect x="168" y="272" width="46" height="144" rx="3" />
                <rect x="220" y="248" width="46" height="168" rx="3" />
                <rect x="272" y="260" width="46" height="156" rx="3" />
                <rect x="700" y="286" width="32" height="130" rx="3" />
                <rect x="736" y="262" width="32" height="154" rx="3" />
                <rect x="772" y="286" width="32" height="130" rx="3" />
              </g>
              <g fill="none" opacity="0.92" stroke="#e9ddff" strokeLinecap="round">
                <circle cx="874" cy="336" r="58" strokeWidth="8" />
                <path d="M874 278 L874 394 M816 336 L932 336 M836 298 L912 374 M836 374 L912 298" strokeWidth="5" />
              </g>
              <path d="M120 414 C180 368 248 362 306 402" fill="none" stroke="#efe2ff" strokeOpacity="0.45" strokeWidth="6" />
              <path d="M640 438 C692 386 750 378 820 414" fill="none" stroke="#efe2ff" strokeOpacity="0.3" strokeWidth="6" />
            </svg>

            <div className="studio-preview-art__overlay studio-preview-art__overlay--top">
              <div className="studio-preview-art__channel">
                <span className="studio-preview-art__avatar" />
                <div>
                  <strong>{getPreviewValue(title)}</strong>
                  <span>{getPreviewValue(artist)}</span>
                </div>
              </div>
              <div className="studio-preview-art__icons">
                <span />
                <span />
                <span />
              </div>
            </div>

            <button
              className={`studio-preview-art__play ${isPlaying ? 'is-playing' : ''}`}
              onClick={handlePreviewPlayback}
              type="button"
              aria-label={isPlaying ? 'Pause song preview' : 'Play song preview'}
            >
              <span />
            </button>

            <div className="studio-preview-art__overlay studio-preview-art__overlay--bottom">
              <div className="studio-preview-art__time">
                <strong>0:00</strong>
                <span>/ {duration || '--'}</span>
              </div>
              <div className="studio-preview-art__progress">
                <span />
              </div>
              <div className="studio-preview-art__controls">
                <span />
                <span />
                <span className="studio-preview-art__brand">YouTube</span>
              </div>
            </div>
          </>
        )}
        {audioSrc && !isVideoMedia && (
          <audio
            ref={audioRef}
            src={audioSrc}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
        )}
      </div>
      {playbackMessage && <p className="studio-preview-card__playback-message">{playbackMessage}</p>}

      <div className="studio-preview-card__body">
        <dl className="studio-preview-card__details">
          {previewDetails.map((detail) => (
            <div key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>

        <div className="studio-preview-card__tags">
          {previewMoods.length ? (
            previewMoods.map((mood) => (
              <span key={mood}>
                <PreviewTagIcon type="theme" />
                {getPreviewValue(mood)}
              </span>
            ))
          ) : (
            <span>
              <PreviewTagIcon type="theme" />
              {emptyPreviewValue}
            </span>
          )}
          <span>
            <PreviewTagIcon type="language" />
            {activeLanguages.length ? activeLanguages.join(', ') : emptyPreviewValue}
          </span>
        </div>
      </div>

      <div className="studio-preview-card__tip">
        <strong>Tip:</strong>
        <span>Complete all details and generate a video to make your song discoverable in the public library.</span>
      </div>
    </section>
  )
}
