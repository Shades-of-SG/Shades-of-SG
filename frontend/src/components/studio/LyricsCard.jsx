export default function LyricsCard({
  canExtractLyrics,
  extractionError,
  extractionStatus,
  lyrics,
  onExtractLyrics,
  onLyricsChange,
  transcriptionStatus,
  youtubeLink,
}) {
  const isExtracting = extractionStatus === 'loading'
  const hasYoutubeLink = Boolean(youtubeLink?.trim())
  const hasYoutubeOnly = hasYoutubeLink && !canExtractLyrics
  const isCheckingTranscription = transcriptionStatus?.configured === null && !transcriptionStatus?.error
  const isTranscriptionUnavailable = transcriptionStatus?.configured === false
  const hasLyrics = Boolean(lyrics.trim())
  const generationStatus = getGenerationStatus({
    canExtractLyrics,
    extractionStatus,
    hasLyrics,
    hasYoutubeLink,
    hasYoutubeOnly,
    isCheckingTranscription,
    isTranscriptionUnavailable,
  })

  return (
    <section className="studio-card studio-lyrics-card">
      <header className="studio-card__header studio-card__header--spread">
        <div className="studio-card__title">
          <span aria-hidden="true">♪</span>
          <h2>Lyrics</h2>
        </div>
        <button
          className="studio-button studio-button--primary"
          disabled={isExtracting || isCheckingTranscription || isTranscriptionUnavailable || (!canExtractLyrics && !hasYoutubeOnly)}
          onClick={onExtractLyrics}
          type="button"
        >
          {isExtracting ? 'Extracting...' : isCheckingTranscription ? 'Checking...' : 'Extract Lyrics'}
        </button>
      </header>

      <p className="studio-lyrics-card__hint">
        Generate an editable lyrics draft from uploaded MP3, WAV, M4A, WEBM, or MP4 media. Review and correct the draft before publishing.
      </p>
      <p className="studio-lyrics-card__hint">
        AI transcription may miss unclear or overlapping vocals, so treat this as a formatted draft and check it against the song.
      </p>

      <div className={`studio-ai-status studio-ai-status--${generationStatus.tone}`} aria-live="polite">
        <div className="studio-ai-status__header">
          <span className="studio-ai-status__pulse" aria-hidden="true" />
          <div>
            <strong>{generationStatus.label}</strong>
            <span>{generationStatus.description}</span>
          </div>
        </div>
        <div className="studio-ai-status__track" aria-hidden="true">
          <span style={{ width: `${generationStatus.progress}%` }} />
        </div>
      </div>

      {hasYoutubeLink && (
        <p className="studio-lyrics-card__notice">
          YouTube links will be extracted on the backend before AI transcription starts.
        </p>
      )}

      {transcriptionStatus?.error && <p className="studio-lyrics-card__error">{transcriptionStatus.error}</p>}

      {extractionError && <p className="studio-lyrics-card__error">{extractionError}</p>}

      <label className="studio-field studio-lyrics-card__field">
        <span>Lyrics draft</span>
        <textarea
          onChange={(event) => onLyricsChange(event.target.value)}
          placeholder="Extract lyrics from uploaded media or write them here..."
          rows={14}
          value={lyrics}
        />
      </label>
    </section>
  )
}

function getGenerationStatus({
  canExtractLyrics,
  extractionStatus,
  hasLyrics,
  hasYoutubeLink,
  hasYoutubeOnly,
  isCheckingTranscription,
  isTranscriptionUnavailable,
}) {
  if (isCheckingTranscription) {
    return {
      description: 'Checking whether the backend can run AI transcription.',
      label: 'Checking AI transcription',
      progress: 18,
      tone: 'checking',
    }
  }

  if (isTranscriptionUnavailable) {
    return {
      description: 'Add OPENAI_API_KEY in backend/.env, then restart the backend.',
      label: 'AI transcription not configured',
      progress: 8,
      tone: 'error',
    }
  }

  if (extractionStatus === 'loading') {
    return {
      description: 'Uploading media and asking the transcription model to draft lyrics.',
      label: 'Extracting lyrics',
      progress: 68,
      tone: 'active',
    }
  }

  if (extractionStatus === 'error') {
    return {
      description: 'Review the message below, then retry after fixing the issue.',
      label: 'Extraction needs attention',
      progress: 28,
      tone: 'error',
    }
  }

  if (extractionStatus === 'success' || hasLyrics) {
    return {
      description: 'Lyrics draft is ready for creator review and edits.',
      label: 'Lyrics draft ready',
      progress: 100,
      tone: 'success',
    }
  }

  if (hasYoutubeOnly || hasYoutubeLink) {
    return {
      description: 'The backend will extract audio from the YouTube link before transcription.',
      label: 'Ready to extract from YouTube',
      progress: 42,
      tone: 'ready',
    }
  }

  if (canExtractLyrics) {
    return {
      description: 'Uploaded media is ready. Click Extract Lyrics to start.',
      label: 'Ready to extract',
      progress: 42,
      tone: 'ready',
    }
  }

  return {
    description: 'Upload a supported song file before starting AI transcription.',
    label: 'Waiting for media',
    progress: 12,
    tone: 'waiting',
  }
}
