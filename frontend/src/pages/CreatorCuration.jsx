import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, AlertCircle, Plus, Trash2, CheckCircle2, Music2, Sparkles, BookOpen, Volume2 } from 'lucide-react'
import CreatorPageShell from '../components/CreatorPageShell'
import InstrumentIcon from '../components/shared/InstrumentIcon'
import { useAuth } from '../context/AuthContext'
import { getSongCuration, updateSongCuration, generateSongArticle, generateSongTrivia } from '../services/songService'
import { API_URL } from '../services/apiConfig'
import useLabInstruments from '../hooks/useLabInstruments'
import useInstrumentAudio from '../hooks/useInstrumentAudio'

export default function CreatorCuration() {
  const { songId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuth()

  const labInstruments = useLabInstruments()
  const { playNote } = useInstrumentAudio()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ type: '', message: '' })

  const [song, setSong] = useState(null)
  const [aiSummary, setAiSummary] = useState('')
  const [description, setDescription] = useState('')
  const [triviaQuestions, setTriviaQuestions] = useState([])
  const [allInstruments, setAllInstruments] = useState([])
  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState([])
  const [latestJobId, setLatestJobId] = useState(null)

  const activeJobId = location.state?.jobId || location.state?.job?.id || latestJobId || (song?.generationJobs?.[0]?.id) || null
  const canonicalSongId = song?.id || songId
  const backRoute = activeJobId ? `/creator/generation/${activeJobId}` : '/creator/generation'
  
  const [generatingArticle, setGeneratingArticle] = useState(false)
  const [generatingTrivia, setGeneratingTrivia] = useState(false)

  // Derive display instruments strictly from labInstruments (the exact set on /learning/instrument-lab)
  const curatedInstruments = labInstruments.map((labInst) => {
    // Find matching backend DB record if available to get the proper UUID for form submission
    const dbMatch = allInstruments.find(
      (db) => db.id === labInst.id || db.name?.toLowerCase() === labInst.name?.toLowerCase()
    )
    return {
      ...labInst,
      dbId: dbMatch ? dbMatch.id : labInst.id,
    }
  })

  const handlePreviewInstrument = (e, inst) => {
    e.stopPropagation()
    if (inst.notes && inst.notes.length > 0) {
      playNote(inst, inst.notes[0])
    }
  }

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getSongCuration(songId, token)
        if (!isMounted) return

        setSong(data.song)
        setAiSummary(data.aiSummary || data.song?.aiSummary || data.description || data.song?.description || '')
        setDescription(data.description || data.song?.description || '')
        setTriviaQuestions(
          Array.isArray(data.triviaQuestions) && data.triviaQuestions.length > 0
            ? data.triviaQuestions.map((q) => ({
                id: q.id,
                prompt: q.prompt || '',
                options: Array.isArray(q.options) && q.options.length === 4
                  ? q.options
                  : [
                      q.options?.[0] || '',
                      q.options?.[1] || '',
                      q.options?.[2] || '',
                      q.options?.[3] || '',
                    ],
                correctAnswer: q.correctAnswer || q.options?.[0] || '',
              }))
            : []
        )
        setAllInstruments(data.allInstruments || [])
        const associatedIds = (data.associatedInstruments || []).map((inst) => inst.id)
        setSelectedInstrumentIds(associatedIds)
        if (data.latestJobId) setLatestJobId(data.latestJobId)
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load curation details.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [songId, token])

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast({ type: '', message: '' })
    }, 4000)
  }

  const handleAddQuestion = () => {
    const newQuestion = {
      prompt: '',
      options: ['', '', '', ''],
      correctAnswer: '',
    }
    setTriviaQuestions([...triviaQuestions, newQuestion])
  }

  const handleDeleteQuestion = (index) => {
    const updated = triviaQuestions.filter((_, i) => i !== index)
    setTriviaQuestions(updated)
  }

  const handleQuestionPromptChange = (index, value) => {
    setTriviaQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, prompt: value } : q))
    )
  }

  const handleOptionChange = (qIndex, optIndex, value) => {
    setTriviaQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const nextOptions = [...q.options]
        const currentOptVal = nextOptions[optIndex]
        const isCorrect = q.correctAnswer === currentOptVal
        nextOptions[optIndex] = value
        return {
          ...q,
          options: nextOptions,
          correctAnswer: isCorrect || !q.correctAnswer ? value : q.correctAnswer,
        }
      })
    )
  }

  const handleCorrectAnswerSelect = (qIndex, optionValue) => {
    setTriviaQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, correctAnswer: optionValue } : q))
    )
  }

  const getInstrumentKeys = (inst) => {
    if (!inst) return []
    const keys = new Set()
    if (inst.dbId) keys.add(String(inst.dbId))
    if (inst.id) keys.add(String(inst.id))
    if (inst.slug) keys.add(String(inst.slug))
    if (inst.name) keys.add(inst.name.toLowerCase())
    return Array.from(keys)
  }

  const isInstSelected = (inst, selectedIds) => {
    const keys = getInstrumentKeys(inst)
    return selectedIds.some((selectedId) => keys.includes(String(selectedId).toLowerCase()))
  }

  const handleToggleInstrument = (inst) => {
    if (!inst) return
    const keys = getInstrumentKeys(typeof inst === 'object' ? inst : { id: inst })
    setSelectedInstrumentIds((prev) => {
      const isCurrentlySelected = prev.some((selectedId) =>
        keys.includes(String(selectedId).toLowerCase())
      )
      if (isCurrentlySelected) {
        return prev.filter((selectedId) => !keys.includes(String(selectedId).toLowerCase()))
      } else {
        const canonicalId = inst.dbId || inst.id || inst
        return [...prev, canonicalId]
      }
    })
  }

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    try {
      setSaving(true)

      const resolvedInstrumentIds = selectedInstrumentIds
        .map((id) => {
          const match = allInstruments.find(
            (db) => db.id === id || db.name?.toLowerCase() === String(id).toLowerCase() || (db.slug && db.slug.toLowerCase() === String(id).toLowerCase())
          )
          return match ? match.id : id
        })
        .filter(Boolean)

      const uniqueResolvedIds = Array.from(new Set(resolvedInstrumentIds))

      const payload = {
        aiSummary,
        description,
        triviaQuestions: triviaQuestions.map((q) => ({
          prompt: q.prompt,
          type: 'MULTIPLE_CHOICE',
          options: q.options,
          correctAnswer: q.correctAnswer || q.options[0] || '',
        })),
        instrumentIds: uniqueResolvedIds,
      }

      const res = await updateSongCuration(canonicalSongId, payload, token)
      if (res?.song) setSong(res.song)
      showToast('success', 'Song curation saved successfully!')
    } catch (err) {
      showToast('error', err.message || 'Failed to save curation changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateArticle = async () => {
    try {
      setGeneratingArticle(true)
      const res = await generateSongArticle(canonicalSongId, token)
      setAiSummary(res.aiSummary || '')
      if (res.matchedInstrumentIds) {
        setSelectedInstrumentIds(res.matchedInstrumentIds)
      }
      showToast('success', 'Article regenerated successfully!')
    } catch (err) {
      showToast('error', err.message || 'Failed to regenerate article.')
    } finally {
      setGeneratingArticle(false)
    }
  }

  const handleRegenerateTrivia = async () => {
    try {
      setGeneratingTrivia(true)
      const res = await generateSongTrivia(canonicalSongId, token)
      setTriviaQuestions(
        Array.isArray(res.trivia) && res.trivia.length > 0
          ? res.trivia.map((q, idx) => ({
              id: q.id || idx,
              prompt: q.prompt || '',
              options: Array.isArray(q.options) && q.options.length === 4
                ? q.options
                : [
                    q.options?.[0] || '',
                    q.options?.[1] || '',
                    q.options?.[2] || '',
                    q.options?.[3] || '',
                  ],
              correctAnswer: q.correctAnswer || q.options?.[0] || '',
            }))
          : []
      )
      showToast('success', 'Trivia regenerated successfully!')
    } catch (err) {
      showToast('error', err.message || 'Failed to regenerate trivia.')
    } finally {
      setGeneratingTrivia(false)
    }
  }

  if (loading) {
    return (
      <CreatorPageShell
        breadcrumbs={['Songs', 'Curation']}
        className="cc-page"
        description="Loading song details..."
        title="Curate Song Experience"
      >
        <div className="cc-loading-state">
          <Loader2 aria-hidden="true" className="cc-spin cc-spinner" size={40} />
          <p className="cc-loading-copy">Fetching AI curation data...</p>
        </div>
      </CreatorPageShell>
    )
  }

  if (error) {
    return (
      <CreatorPageShell
        breadcrumbs={['Songs', 'Curation']}
        className="cc-page"
        description="Error loading curation."
        title="Curate Song Experience"
      >
        <section className="studio-card cc-error-card" role="alert">
          <AlertCircle aria-hidden="true" className="cc-error-icon" size={48} />
          <h2 className="cc-error-title">Unable to Load Curation</h2>
          <p className="cc-error-copy">{error}</p>
          <button
            className="studio-button studio-button--secondary cc-error-btn"
            onClick={() => navigate(backRoute)}
            type="button"
          >
            Back to Job
          </button>
        </section>
      </CreatorPageShell>
    )
  }

  const handleProceedToStudio = async () => {
    const songData = song || {}
    let firstFrameUrl = songData.coverImageUrl || ''

    if (!firstFrameUrl) {
      try {
        let fetchedSong = null
        if (latestJobId) {
          const jobRes = await fetch(`${API_URL}/generation/${latestJobId}/status`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
          if (jobRes.ok) {
            const jobJson = await jobRes.json()
            fetchedSong = jobJson.data?.song || jobJson.song
          }
        }
        if (!fetchedSong) {
          const songRes = await fetch(`${API_URL}/songs/creator/${encodeURIComponent(canonicalSongId)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
          if (songRes.ok) {
            const songJson = await songRes.json()
            fetchedSong = songJson.song || songJson.data
          }
        }

        const firstScene = fetchedSong?.sceneSegments?.[0]
        firstFrameUrl = firstScene?.imageUrl || firstScene?.generatedFrames?.[0]?.imageUrl || fetchedSong?.coverImageUrl || ''
      } catch (fetchErr) {
        console.warn('[handleProceedToStudio] Failed fetching first frame:', fetchErr)
      }
    }

    if (firstFrameUrl) {
      try {
        await fetch(`${API_URL}/songs/${encodeURIComponent(canonicalSongId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ coverImageUrl: firstFrameUrl })
        })
      } catch (putErr) {
        console.warn('[handleProceedToStudio] Failed updating cover image:', putErr)
      }
    }

    const updatedSongData = { ...songData, coverImageUrl: firstFrameUrl }
    navigate(`/creator/studio/${encodeURIComponent(canonicalSongId)}`, {
      state: {
        videoUrl: songData?.videoUrl,
        lyrics: songData?.rawLyrics,
        coverImageUrl: firstFrameUrl,
        songData: updatedSongData
      }
    })
  }

  return (
    <CreatorPageShell
      actions={
        <div className="cc-header-actions">
          <button
            className="studio-button studio-button--secondary"
            onClick={() => navigate(backRoute)}
            type="button"
          >
            Back to Job
          </button>
          <button
            className="studio-button studio-button--secondary"
            onClick={handleProceedToStudio}
            type="button"
          >
            Proceed to Studio
          </button>
        </div>
      }
      breadcrumbs={['Songs', 'Curation']}
      className="cc-page"
      description="Review and edit AI-generated cultural summary, trivia questions, and featured heritage instruments."
      title="Curate Song Experience"
    >
      {/* Toast Notification */}
      {toast.message && (
        <div className={`cc-toast ${toast.type === 'success' ? 'is-success' : 'is-error'}`} role={toast.type === 'error' ? 'alert' : 'status'}>
          {toast.type === 'success' ? (
            <CheckCircle2 aria-hidden="true" className="cc-toast__icon" size={20} />
          ) : (
            <AlertCircle aria-hidden="true" className="cc-toast__icon" size={20} />
          )}
          <span className="cc-toast__text">{toast.message}</span>
        </div>
      )}

      {/* Song Header Summary */}
      <div className="cc-summary-banner">
        <div>
          <h2 className="cc-summary-banner__title">{song?.title || 'Untitled Song'}</h2>
          <p className="cc-summary-banner__meta">
            {song?.artist || 'Unknown Artist'} · <span>{song?.theme || 'Singaporean Heritage'}</span>
          </p>
        </div>
        <button
          className="studio-button studio-button--primary cc-save-btn"
          disabled={saving}
          onClick={handleSave}
          type="button"
        >
          {saving ? (
            <>
              <Loader2 aria-hidden="true" className="cc-spin" size={18} /> Saving...
            </>
          ) : (
            'Save Curation Changes'
          )}
        </button>
      </div>

      <form className="cc-form" onSubmit={handleSave}>
        {/* Section 0: Public Song Description */}
        <section className="studio-card studio-form-card">
          <header className="studio-card__header">
            <div className="studio-card__title">
              <BookOpen aria-hidden="true" className="cc-icon-sky" size={20} />
              <h2>Public Song Description</h2>
            </div>
          </header>
          <div className="cc-section-body">
            <label className="cc-field-label" htmlFor="cc-public-description">
              Overview and description presented to listeners in the public catalog:
            </label>
            <textarea
              className="studio-field cc-textarea cc-textarea--sky"
              id="cc-public-description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a public description for this song..."
              rows={4}
              value={description}
            />
          </div>
        </section>

        {/* Section A: AI Cultural Mini-Article */}
        <section className="studio-card studio-form-card">
          <header className="studio-card__header studio-card__header--spread">
            <div className="studio-card__title">
              <Sparkles aria-hidden="true" className="cc-icon-heritage" size={20} />
              <h2>AI Cultural Mini-Article</h2>
            </div>
            <button
              className="studio-button studio-button--secondary cc-regen-btn"
              disabled={generatingArticle}
              onClick={handleRegenerateArticle}
              type="button"
            >
              {generatingArticle ? (
                <Loader2 aria-hidden="true" className="cc-spin" size={16} />
              ) : (
                <Sparkles aria-hidden="true" className="cc-icon-heritage" size={16} />
              )}
              {generatingArticle ? 'Regenerating...' : 'Regenerate Article'}
            </button>
          </header>
          <div className="cc-section-body">
            <label className="cc-field-label" htmlFor="cc-ai-summary">
              Educational mini-article (3-4 paragraphs) covering historical era, Singapore heritage context, and musical background:
            </label>
            <textarea
              className="studio-field cc-textarea"
              id="cc-ai-summary"
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder="DeepSeek generated educational mini-article..."
              rows={8}
              value={aiSummary}
            />
          </div>
        </section>

        {/* Section B: Trivia Questions Manager */}
        <section className="studio-card studio-form-card">
          <header className="studio-card__header studio-card__header--spread">
            <div className="studio-card__title">
              <BookOpen aria-hidden="true" className="cc-icon-violet" size={20} />
              <h2>Interactive Trivia Questions ({triviaQuestions.length})</h2>
            </div>
            <div className="cc-trivia-toolbar">
              <button
                className="studio-button studio-button--secondary cc-regen-btn"
                disabled={generatingTrivia}
                onClick={handleRegenerateTrivia}
                type="button"
              >
                {generatingTrivia ? (
                  <Loader2 aria-hidden="true" className="cc-spin" size={16} />
                ) : (
                  <Sparkles aria-hidden="true" className="cc-icon-violet" size={16} />
                )}
                {generatingTrivia ? 'Regenerating...' : 'Regenerate Trivia'}
              </button>
              <button
                className="studio-button studio-button--secondary cc-regen-btn"
                onClick={handleAddQuestion}
                type="button"
              >
                <Plus aria-hidden="true" size={16} /> Add Question
              </button>
            </div>
          </header>

          <div className="cc-trivia-list">
            {triviaQuestions.length === 0 ? (
              <div className="cc-trivia-empty">
                <p>No trivia questions created yet. Tap &ldquo;Add Question&rdquo; to start.</p>
              </div>
            ) : (
              triviaQuestions.map((q, qIndex) => (
                <div className="cc-question-card" key={q.id || `q-${qIndex}`}>
                  <div className="cc-question-card__header">
                    <span className="cc-question-card__number">Question #{qIndex + 1}</span>
                    <button
                      className="cc-delete-question-btn"
                      onClick={() => handleDeleteQuestion(qIndex)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} /> Delete
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <div className="cc-question-card__field">
                    <label className="cc-field-label" htmlFor={`cc-question-prompt-${qIndex}`}>
                      Question Prompt:
                    </label>
                    <input
                      className="studio-field cc-question-input"
                      id={`cc-question-prompt-${qIndex}`}
                      onChange={(e) => handleQuestionPromptChange(qIndex, e.target.value)}
                      placeholder="e.g. What cultural event does this song commemorate?"
                      type="text"
                      value={q.prompt}
                    />
                  </div>

                  {/* Options List */}
                  <div>
                    <span className="cc-field-label">Answer Options (Select radio for correct answer):</span>
                    <div className="cc-options-grid">
                      {q.options.map((opt, optIndex) => {
                        const isCorrect = q.correctAnswer === opt && opt.trim() !== ''
                        return (
                          <label className={`cc-option-row ${isCorrect ? 'is-correct' : ''}`} key={`q-${qIndex}-opt-${optIndex}`}>
                            <input
                              checked={isCorrect}
                              className="cc-radio"
                              name={`correct-ans-${qIndex}`}
                              onChange={() => handleCorrectAnswerSelect(qIndex, opt)}
                              title="Set as correct answer"
                              type="radio"
                            />
                            <span className="cc-option-letter">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <input
                              aria-label={`Question ${qIndex + 1} Option ${String.fromCharCode(65 + optIndex)}`}
                              className="cc-option-input"
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              type="text"
                              value={opt}
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Section C: Featured Instrument Selector */}
        <section className="studio-card studio-form-card">
          <header className="studio-card__header">
            <div className="studio-card__title">
              <Music2 aria-hidden="true" className="cc-icon-violet" size={20} />
              <h2>Featured Heritage Instruments ({curatedInstruments.filter((inst) => isInstSelected(inst, selectedInstrumentIds)).length} Selected)</h2>
            </div>
          </header>

          <div className="cc-section-body">
            <p className="cc-instruments-hint">
              Select the Singaporean/Regional heritage instruments associated with this song:
            </p>

            {curatedInstruments.length === 0 ? (
              <p className="cc-instruments-empty">No instruments available in catalog.</p>
            ) : (
              <div className="cc-instruments-grid">
                {curatedInstruments.map((inst) => {
                  const isSelected = isInstSelected(inst, selectedInstrumentIds)

                  return (
                    <div
                      className={`cc-instrument-card ${isSelected ? 'is-selected' : ''}`}
                      key={inst.dbId || inst.id}
                      onClick={() => handleToggleInstrument(inst)}
                    >
                      <input
                        aria-label={`Select ${inst.name}`}
                        checked={isSelected}
                        className="cc-checkbox"
                        onChange={() => handleToggleInstrument(inst)}
                        onClick={(e) => e.stopPropagation()}
                        type="checkbox"
                      />
                      <div className="cc-instrument-card__body">
                        <div className="cc-instrument-card__top">
                          <div className="cc-instrument-card__identity">
                            <span aria-hidden="true" className="cc-instrument-card__icon">
                              <InstrumentIcon instrumentId={inst.id} instrumentName={inst.name} size={22} />
                            </span>
                            <h4 className="cc-instrument-card__name">{inst.name}</h4>
                          </div>
                          <button
                            aria-label={`Preview ${inst.name}`}
                            className="cc-preview-btn"
                            onClick={(e) => handlePreviewInstrument(e, inst)}
                            type="button"
                          >
                            <Volume2 aria-hidden="true" size={18} /> Preview
                          </button>
                        </div>
                        <span className="cc-instrument-card__origin">
                          {inst.origin || 'Heritage Instrument'}
                        </span>
                        {inst.description && (
                          <p className="cc-instrument-card__desc">{inst.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Pinned Bottom Form Footer Action */}
        <div className="cc-sticky-actions">
          <button
            className="studio-button studio-button--secondary"
            onClick={() => navigate(backRoute)}
            type="button"
          >
            Back to Job
          </button>
          <button
            className="studio-button studio-button--primary cc-save-btn"
            disabled={saving}
            type="submit"
          >
            {saving ? (
              <>
                <Loader2 aria-hidden="true" className="cc-spin" size={18} /> Saving Changes...
              </>
            ) : (
              'Save Curation Changes'
            )}
          </button>
          <button
            className="studio-button studio-button--secondary"
            onClick={handleProceedToStudio}
            type="button"
          >
            Proceed to Studio
          </button>
        </div>
      </form>
    </CreatorPageShell>
  )
}
