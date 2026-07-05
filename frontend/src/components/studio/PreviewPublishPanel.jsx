import { useMemo, useState } from 'react'

function getValue(value) {
  return value?.trim() || '--'
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
  languages = [],
  mediaType = '',
  moods = [],
  theme = '',
  title = '',
  youtubeLink = '',
}) {
  const [publishMode, setPublishMode] = useState('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const languageLabel = languages.length ? languages.join(', ') : '--'
  const moodLabel = moods.length ? moods.join(', ') : '--'
  const hasTheme = Boolean(theme.trim())
  const hasDescription = Boolean(description.trim())
  const youtubeEmbedUrl = audioSrc ? '' : getYoutubeEmbedUrl(youtubeLink)
  const isVideoMedia = mediaType === 'video'
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
    { label: 'Lyrics', status: 'Ready', done: true },
    { label: 'Audio File', status: duration ? 'Uploaded' : 'Missing', done: Boolean(duration) },
    { label: 'Theme', status: hasTheme ? 'Selected' : 'Missing', done: hasTheme },
    { label: 'AI Video', status: 'Placeholder preview', done: false },
    { label: 'Reflection Prompt', status: 'Can be added later', done: false },
  ]
  const incompleteCount = checklist.filter((item) => !item.done).length

  return (
    <section className="studio-publish-layout">
      <aside className="studio-card studio-publish-settings">
        <header className="studio-card__header">
          <h2>Publish Settings</h2>
        </header>

        <div className="studio-publish-settings__section">
          <p className="studio-publish-settings__label">Status</p>
          <div className="studio-publish-settings__status-pills">
            <Chip tone="draft">Draft</Chip>
            <Chip tone="publish">Ready to publish</Chip>
          </div>
          <p className="studio-publish-settings__hint">Only published songs will be visible to the public in the Songs Library.</p>
        </div>

        <div className="studio-publish-settings__section">
          <p className="studio-publish-settings__label">Visibility</p>
          <div className="studio-publish-settings__select">Public</div>
          <p className="studio-publish-settings__subtext">Anyone can discover and play this song.</p>
        </div>

        <div className="studio-publish-settings__section">
          <p className="studio-publish-settings__label">Publish Date</p>
          <div className="studio-publish-settings__publish-modes" role="tablist" aria-label="Publish date mode">
            <button
              className={publishMode === 'now' ? 'is-active' : ''}
              onClick={() => setPublishMode('now')}
              type="button"
            >
              Publish now
            </button>
            <button
              className={publishMode === 'scheduled' ? 'is-active' : ''}
              onClick={() => setPublishMode('scheduled')}
              type="button"
            >
              Schedule
            </button>
          </div>
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
            <p className="studio-publish-settings__label">Content Checklist</p>
            <span className="studio-publish-settings__summary">{incompleteCount} pending</span>
          </div>
          <div className="studio-publish-checklist">
            {checklist.map((item) => (
              <div className={`studio-publish-checklist__item ${item.done ? 'is-done' : 'is-pending'}`} key={item.label}>
                <ChecklistIcon done={item.done} />
                <strong>{item.label}</strong>
                <span>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="studio-publish-tip">
          <strong>Tip:</strong>
          <span>A complete song provides a richer experience for learners and earns more engagement.</span>
        </div>
      </aside>

      <div className="studio-publish-main">
        <section className="studio-card studio-publish-preview">
          <header className="studio-card__header studio-card__header--spread">
            <div>
              <p className="studio-card__eyebrow">Public Preview</p>
              <h2>This is how users will see your song</h2>
            </div>
            <div className="studio-publish-preview__devices">
              <button className="is-active" type="button">
                Desktop
              </button>
              <button type="button">Tablet</button>
              <button type="button">Mobile</button>
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
                    <circle cx="502" cy="280" r="72" fill="rgba(18, 12, 31, 0.42)" />
                    <polygon points="486,244 486,316 544,280" fill="#ffffff" />
                  </svg>
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
