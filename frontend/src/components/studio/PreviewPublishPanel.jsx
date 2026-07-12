import { useMemo, useRef, useState } from 'react'

function getValue(value) {
  return value?.trim() || '--'
}

function formatPlaybackTime(value) {
  if (!Number.isFinite(value)) {
    return '0:00'
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function Chip({ children, tone = 'default' }) {
  return <span className={`studio-publish-chip studio-publish-chip--${tone}`}>{children}</span>
}

function getYoutubeEmbedUrl(value) {
  if (!value?.trim()) {
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

function ChecklistIcon({ done }) {
  return <span aria-hidden="true" className={`studio-publish-checklist__icon ${done ? 'is-done' : 'is-pending'}`}>{done ? '✓' : '!'}</span>
}

export default function PreviewPublishPanel({
  audioSrc = '',
  artist = '',
  description = '',
  duration = '',
  lastSavedLabel = 'Draft not saved yet',
  languages = [],
  lyrics = '',
  mediaType = '',
  moods = [],
  theme = '',
  title = '',
  youtubeLink = '',
}) {
  const audioRef = useRef(null)
  const [publishMode, setPublishMode] = useState('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const languageLabel = languages.length ? languages.join(', ') : '--'
  const moodLabel = moods.length ? moods.join(', ') : '--'
  const hasTheme = Boolean(theme.trim())
  const hasDescription = Boolean(description.trim())
  const hasLyrics = Boolean(lyrics.trim())
  const isVideoMedia = mediaType === 'video'
  const effectiveYoutubeLink = youtubeLink?.trim() || ''
  const youtubeEmbedUrl = audioSrc ? '' : getYoutubeEmbedUrl(effectiveYoutubeLink)
  const audioProgress = audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0
  const hasMediaPreview = Boolean(audioSrc || youtubeEmbedUrl)
  const isAiPreviewReady = Boolean(isVideoMedia && audioSrc)
  const visibilityLabel = publishMode === 'now' ? 'Public on publish' : 'Scheduled public release'
  const publishDateHelp = useMemo(() => {
    if (publishMode === 'scheduled' && scheduledAt) {
      const parsedDate = new Date(scheduledAt)

      if (!Number.isNaN(parsedDate.getTime())) {
        return `The song will go live on ${parsedDate.toLocaleString([], {
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          month: 'short',
          year: 'numeric',
        })}.`
      }
    }

    if (publishMode === 'scheduled') {
      return 'Choose a release date and time for this song.'
    }

    return 'The song will go live immediately.'
  }, [publishMode, scheduledAt])

  const checklist = [
    { label: 'Metadata', status: title.trim() && artist.trim() && hasDescription ? 'Ready' : 'Needs details', done: Boolean(title.trim() && artist.trim() && hasDescription) },
    { label: 'Lyrics', status: hasLyrics ? 'Ready' : 'Missing', done: hasLyrics },
    { label: 'Audio', status: hasMediaPreview ? 'Uploaded' : 'Missing', done: hasMediaPreview },
    { label: 'Theme', status: hasTheme ? 'Selected' : 'Missing', done: hasTheme },
    { label: 'AI Video', status: isAiPreviewReady ? 'Preview ready' : 'Pending', done: isAiPreviewReady },
  ]
  const completeCount = checklist.filter((item) => item.done).length
  const incompleteCount = checklist.filter((item) => !item.done).length

  async function toggleAudioPreview() {
    if (!audioRef.current) {
      return
    }

    if (!audioRef.current.paused) {
      audioRef.current.pause()
      setIsAudioPlaying(false)
      return
    }

    try {
      await audioRef.current.play()
      setIsAudioPlaying(true)
    } catch {
      setIsAudioPlaying(false)
    }
  }

  function handleAudioSeek(event) {
    const nextTime = Number(event.target.value)

    if (!audioRef.current || !Number.isFinite(nextTime)) {
      return
    }

    audioRef.current.currentTime = nextTime
    setAudioCurrentTime(nextTime)
  }

  return (
    <section className="studio-publish-layout">
      <aside className="studio-card studio-publish-settings">
        <header className="studio-card__header">
          <h2>Publish Settings</h2>
        </header>

        <div className="studio-publish-status-card">
          <div className="studio-publish-status-card__row">
            <span>Status</span>
            <Chip tone="draft">Draft</Chip>
          </div>
          <div className="studio-publish-status-card__row">
            <span>Last edited</span>
            <strong>{lastSavedLabel}</strong>
          </div>
          <div className="studio-publish-status-card__row">
            <span>Visibility</span>
            <strong>{visibilityLabel}</strong>
          </div>
          <div className="studio-publish-status-card__row">
            <span>AI Generation</span>
            <strong>{isAiPreviewReady ? 'Ready' : 'Pending'}</strong>
          </div>
          <div className="studio-publish-status-card__row">
            <span>Estimated duration</span>
            <strong>{duration || '--'}</strong>
          </div>
        </div>

        <div className="studio-publish-settings__section">
          <p className="studio-publish-settings__label">Publish</p>
          <label className="studio-publish-settings__immediate">
            <input
              checked={publishMode === 'now'}
              onChange={(event) => setPublishMode(event.target.checked ? 'now' : 'scheduled')}
              type="checkbox"
            />
            <span>Publish immediately</span>
          </label>
          <button
            className={`studio-publish-settings__schedule-button ${publishMode === 'scheduled' ? 'is-active' : ''}`}
            onClick={() => setPublishMode('scheduled')}
            type="button"
          >
            Schedule for later
          </button>
          {publishMode === 'scheduled' && (
            <label className="studio-publish-settings__datetime">
              <span>Release time</span>
              <input onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" value={scheduledAt} />
            </label>
          )}
          <p className="studio-publish-settings__subtext">{publishDateHelp}</p>
        </div>

        <div className="studio-publish-settings__section">
          <div className="studio-publish-settings__heading-row">
            <p className="studio-publish-settings__label">Checklist</p>
            <span className="studio-publish-settings__summary">{completeCount} / {checklist.length} complete</span>
          </div>
          <div className="studio-publish-checklist studio-publish-checklist--compact">
            {checklist.map((item) => (
              <div className={`studio-publish-checklist__item ${item.done ? 'is-done' : 'is-pending'}`} key={item.label}>
                <ChecklistIcon done={item.done} />
                <strong>{item.label}</strong>
                <span>{item.status}</span>
              </div>
            ))}
          </div>
          {incompleteCount > 0 && (
            <p className="studio-publish-settings__subtext">{incompleteCount} item{incompleteCount === 1 ? '' : 's'} need attention before publishing.</p>
          )}
        </div>
      </aside>

      <div className="studio-publish-main">
        <section className="studio-card studio-publish-preview">
          <header className="studio-card__header studio-card__header--spread">
            <div>
              <p className="studio-card__eyebrow">Public Preview</p>
              <h2>This is how users will see your song</h2>
            </div>
          </header>

          <div className="studio-publish-preview__frame">
            <div className="studio-publish-preview__media-shell">
              <div className="studio-publish-preview__media">
                <div className="studio-publish-preview__badge">Official Music Video</div>
                {isVideoMedia && audioSrc ? (
                  <video className="studio-publish-preview__video" src={audioSrc} controls playsInline />
                ) : youtubeEmbedUrl ? (
                  <iframe
                    className="studio-publish-preview__youtube"
                    src={youtubeEmbedUrl}
                    title="Public preview video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <svg viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" role="presentation">
                      <defs>
                        <linearGradient id="publish-sky" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#9c63d8" />
                          <stop offset="45%" stopColor="#5a377f" />
                          <stop offset="100%" stopColor="#11162d" />
                        </linearGradient>
                      </defs>
                      <rect width="960" height="540" fill="url(#publish-sky)" />
                      <circle cx="742" cy="114" r="20" fill="#ffd7a3" />
                      <path d="M0 390 L120 340 L198 360 L296 288 L372 344 L456 300 L548 342 L646 282 L732 328 L844 300 L960 338 L960 540 L0 540 Z" fill="#2b1d4b" />
                      <path d="M0 430 L138 414 L228 452 L320 416 L412 460 L504 420 L600 462 L694 426 L790 452 L882 418 L960 440 L960 540 L0 540 Z" fill="#111628" />
                      <rect x="178" y="208" width="42" height="176" rx="4" fill="#43346f" />
                      <rect x="226" y="186" width="42" height="198" rx="4" fill="#43346f" />
                      <rect x="274" y="196" width="42" height="188" rx="4" fill="#43346f" />
                      <rect x="676" y="224" width="24" height="160" rx="4" fill="#6c5a9b" />
                      <rect x="706" y="204" width="24" height="180" rx="4" fill="#6c5a9b" />
                      <rect x="736" y="224" width="24" height="160" rx="4" fill="#6c5a9b" />
                    </svg>
                    {audioSrc && (
                      <>
                        <button
                          className={`studio-publish-preview__audio-play ${isAudioPlaying ? 'is-playing' : ''}`}
                          onClick={toggleAudioPreview}
                          type="button"
                          aria-label={isAudioPlaying ? 'Pause song audio preview' : 'Play song audio preview'}
                        >
                          <span />
                        </button>
                        <div className="studio-publish-preview__audio-strip">
                          <div className="studio-publish-preview__audio-time">
                            <strong>{formatPlaybackTime(audioCurrentTime)}</strong>
                            <span>{formatPlaybackTime(audioDuration)}</span>
                          </div>
                          <input
                            aria-label="Public preview audio progress"
                            max={audioDuration || 0}
                            min="0"
                            onChange={handleAudioSeek}
                            step="0.1"
                            style={{ '--publish-audio-progress': `${audioProgress}%` }}
                            type="range"
                            value={audioCurrentTime}
                          />
                        </div>
                        <audio
                          ref={audioRef}
                          src={audioSrc}
                          onEnded={() => {
                            setIsAudioPlaying(false)
                            setAudioCurrentTime(0)
                          }}
                          onLoadedMetadata={(event) => {
                            setAudioDuration(event.currentTarget.duration)
                            setAudioCurrentTime(0)
                          }}
                          onPause={() => setIsAudioPlaying(false)}
                          onPlay={() => setIsAudioPlaying(true)}
                          onTimeUpdate={(event) => setAudioCurrentTime(event.currentTarget.currentTime)}
                        />
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="studio-publish-preview__content">
                <div className="studio-publish-preview__copy">
                  <h3>{getValue(title)}</h3>
                  <p>{getValue(artist)}</p>
                </div>

                <div className="studio-publish-preview__meta">
                  <span>{duration || '--'}</span>
                  <span>0 Views</span>
                  <span>Public preview</span>
                </div>

                <div className="studio-publish-preview__chips">
                  <Chip tone="theme">{getValue(theme)}</Chip>
                  <Chip tone="language">{languageLabel}</Chip>
                  <Chip tone="mood">{moodLabel}</Chip>
                </div>

                <p className="studio-publish-preview__description">{getValue(description)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="studio-card studio-publish-explore">
          <header className="studio-card__header">
            <h2>Explore & Learn</h2>
          </header>

          <div className="studio-publish-explore__grid">
            <article className="studio-publish-feature studio-publish-feature--violet">
              <h3>Instruments</h3>
              <p>Discover the instruments in this song and their cultural significance.</p>
              <button className="studio-button studio-button--ghost" type="button">
                Explore Instruments
              </button>
            </article>

            <article className="studio-publish-feature studio-publish-feature--rose">
              <h3>Trivia Quiz</h3>
              <p>Test your knowledge about Singapore&apos;s culture and the stories behind it.</p>
              <button className="studio-button studio-button--ghost" type="button">
                Start Quiz
              </button>
            </article>

            <article className="studio-publish-feature studio-publish-feature--blue">
              <h3>Rhythm Game</h3>
              <p>Play along to the beat and improve your timing and reflexes.</p>
              <button className="studio-button studio-button--ghost" type="button">
                Play Game
              </button>
            </article>

            <article className="studio-publish-feature studio-publish-feature--gold studio-publish-feature--wide">
              <h3>Reflection Wall</h3>
              <p>What does this song remind you of in Singapore? Share a memory, a place, or a feeling, then browse what others contributed.</p>
              <div className="studio-publish-feature__actions">
                <button className="studio-button studio-button--ghost" type="button">
                  Share Reflection
                </button>
                <button className="studio-button studio-button--ghost" type="button">
                  View Reflections
                </button>
              </div>
            </article>
          </div>
        </section>

      </div>
    </section>
  )
}
