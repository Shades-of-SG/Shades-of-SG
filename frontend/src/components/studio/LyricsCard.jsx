import { useEffect, useRef, useState } from 'react'

function LyricsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 -960 960 960">
      <path d="M400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 43.5 6.5T480-415v-305q0-25 17.5-42.5T540-780h180v80H560v420q0 66-47 113t-113 47Z" />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 -960 960 960">
      <path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z" />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 -960 960 960">
      <path d="M396-200q-97 0-166.5-63T160-420q0-94 69.5-157T396-640h252L544-744l56-56 200 200-200 200-56-56 104-104H396q-63 0-109.5 40T240-420q0 60 46.5 100T396-280h284v80H396Z" />
    </svg>
  )
}

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
  const textareaRef = useRef(null)
  const [history, setHistory] = useState([lyrics])
  const [historyIndex, setHistoryIndex] = useState(0)
  const skipHistoryRef = useRef(false)
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

  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false
      return
    }

    setHistory([lyrics])
    setHistoryIndex(0)
  }, [lyrics])

  function focusTextarea(selectionStart, selectionEnd = selectionStart) {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current

      if (!textarea) {
        return
      }

      textarea.focus()
      textarea.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  function applyLyricsChange(nextLyrics, selectionStart, selectionEnd = selectionStart) {
    skipHistoryRef.current = true
    setHistory((currentHistory) => {
      const baseHistory = currentHistory.slice(0, historyIndex + 1)
      const lastValue = baseHistory[baseHistory.length - 1]

      if (lastValue === nextLyrics) {
        return currentHistory
      }

      const nextHistory = [...baseHistory, nextLyrics].slice(-80)
      const nextIndex = nextHistory.length - 1
      setHistoryIndex(nextIndex)
      return nextHistory
    })

    onLyricsChange(nextLyrics)
    focusTextarea(selectionStart, selectionEnd)
  }

  function updateLyricsSelection(formatter) {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const before = lyrics.slice(0, selectionStart)
    const selected = lyrics.slice(selectionStart, selectionEnd)
    const after = lyrics.slice(selectionEnd)
    const nextSelected = formatter(selected)
    const nextLyrics = `${before}${nextSelected}${after}`

    applyLyricsChange(nextLyrics, selectionStart, selectionStart + nextSelected.length)
  }

  function applyInlineStyle(type) {
    if (type === 'bold') {
      updateLyricsSelection((selected) => `**${selected || 'bold text'}**`)
      return
    }

    if (type === 'italic') {
      updateLyricsSelection((selected) => `_${selected || 'italic text'}_`)
      return
    }

    updateLyricsSelection((selected) => `<u>${selected || 'underlined text'}</u>`)
  }

  function insertLyricsSection(label) {
    updateLyricsSelection((selected) => {
      const prefix = selected || !lyrics.trim() ? '' : '\n'
      const suffix = selected ? '\n' : '\n\n'
      return `${prefix}[${label}]\n${selected}${suffix}`
    })
  }

  function handleLyricsInput(nextLyrics) {
    applyLyricsChange(nextLyrics, nextLyrics.length, nextLyrics.length)
  }

  function navigateHistory(direction) {
    const nextIndex =
      direction === 'undo'
        ? Math.max(0, historyIndex - 1)
        : Math.min(history.length - 1, historyIndex + 1)

    if (nextIndex === historyIndex) {
      return
    }

    skipHistoryRef.current = true
    setHistoryIndex(nextIndex)
    onLyricsChange(history[nextIndex])
    focusTextarea(history[nextIndex].length, history[nextIndex].length)
  }

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <section className="studio-card studio-lyrics-card">
      <header className="studio-card__header studio-card__header--spread">
        <div className="studio-card__title">
          <LyricsIcon />
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
        Editable AI draft from uploaded media or YouTube. Review unclear vocals before publishing.
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

      {hasYoutubeLink && <p className="studio-lyrics-card__notice">YouTube links are extracted automatically before transcription.</p>}

      {transcriptionStatus?.error && <p className="studio-lyrics-card__error">{transcriptionStatus.error}</p>}

      {extractionError && <p className="studio-lyrics-card__error">{extractionError}</p>}

      <label className="studio-field studio-lyrics-card__field">
        <span>Lyrics draft</span>
        <div className="studio-lyrics-editor__toolbar" aria-label="Lyrics editor tools">
          <button aria-label="Undo lyrics edit" type="button" disabled={!canUndo} onClick={() => navigateHistory('undo')}>
            <UndoIcon />
          </button>
          <button aria-label="Redo lyrics edit" type="button" disabled={!canRedo} onClick={() => navigateHistory('redo')}>
            <RedoIcon />
          </button>
          <span />
          <button aria-label="Bold selected lyrics" type="button" onClick={() => applyInlineStyle('bold')}>
            B
          </button>
          <button aria-label="Italicize selected lyrics" type="button" onClick={() => applyInlineStyle('italic')}>
            I
          </button>
          <button aria-label="Underline selected lyrics" type="button" onClick={() => applyInlineStyle('underline')}>
            U
          </button>
          <span />
          <button type="button" onClick={() => insertLyricsSection('Verse')}>
            Verse
          </button>
          <button type="button" onClick={() => insertLyricsSection('Chorus')}>
            Chorus
          </button>
        </div>
        <textarea
          onChange={(event) => handleLyricsInput(event.target.value)}
          onKeyDown={(event) => {
            const key = event.key.toLowerCase()
            const hasModifier = event.ctrlKey || event.metaKey

            if (hasModifier && !event.shiftKey && key === 'b') {
              event.preventDefault()
              applyInlineStyle('bold')
            }

            if (hasModifier && !event.shiftKey && key === 'i') {
              event.preventDefault()
              applyInlineStyle('italic')
            }

            if (hasModifier && !event.shiftKey && key === 'u') {
              event.preventDefault()
              applyInlineStyle('underline')
            }

            if (hasModifier && !event.shiftKey && key === 'z') {
              event.preventDefault()
              navigateHistory('undo')
            }

            if (hasModifier && ((event.shiftKey && key === 'z') || key === 'y')) {
              event.preventDefault()
              navigateHistory('redo')
            }
          }}
          placeholder="Extract lyrics from uploaded media or write them here..."
          ref={textareaRef}
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
