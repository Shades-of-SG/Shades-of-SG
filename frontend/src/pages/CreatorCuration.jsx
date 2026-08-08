import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Plus, Trash2, CheckCircle2, Music2, Sparkles, BookOpen, Play, Pause } from 'lucide-react'
import CreatorPageShell from '../components/CreatorPageShell'
import { useAuth } from '../context/AuthContext'
import { getSongCuration, updateSongCuration, generateSongArticle, generateSongTrivia } from '../services/songService'
import { INSTRUMENTS } from '../data/instruments'

function prepareDeduplicatedInstruments(apiInstruments = []) {
  const seenMap = new Map()

  // 1. Prioritize database-driven instruments
  apiInstruments.forEach((inst) => {
    const rawKey = inst.id || inst.name || ''
    const canonicalKey = rawKey.toString().toLowerCase().trim()

    const matchingStatic = INSTRUMENTS.find(
      (s) => s.id === canonicalKey || s.name.toLowerCase() === (inst.name || '').toLowerCase()
    )

    const finalId = inst.id || matchingStatic?.id || canonicalKey
    const finalKey = (matchingStatic?.id || canonicalKey).toLowerCase()

    seenMap.set(finalKey, {
      id: finalId,
      name: inst.name || matchingStatic?.name || 'Instrument',
      origin: inst.origin || matchingStatic?.origin || 'Heritage Instrument',
      description: inst.description || matchingStatic?.description || '',
      icon: inst.icon || matchingStatic?.icon || '🎵',
      audioUrl: inst.audioUrl || matchingStatic?.audioUrl || `/audio/instruments/${finalKey}.mp3`,
      audioSampleUrl: inst.audioSampleUrl || matchingStatic?.audioSampleUrl || `/audio/instruments/${finalKey}.mp3`,
    })
  })

  // 2. Fallback: add remaining static instruments if not yet in map
  INSTRUMENTS.forEach((inst) => {
    const canonicalKey = (inst.id || inst.name).toString().toLowerCase().trim()
    if (!seenMap.has(canonicalKey)) {
      seenMap.set(canonicalKey, {
        ...inst,
        audioUrl: inst.audioUrl || `/audio/instruments/${canonicalKey}.mp3`,
        audioSampleUrl: inst.audioSampleUrl || `/audio/instruments/${canonicalKey}.mp3`,
      })
    }
  })

  return Array.from(seenMap.values())
}

export default function CreatorCuration() {
  const { songId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()

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
  
  const [generatingArticle, setGeneratingArticle] = useState(false)
  const [generatingTrivia, setGeneratingTrivia] = useState(false)

  const [activePreviewId, setActivePreviewId] = useState(null)
  const currentAudioRef = useRef(null)

  const playAudioPreview = (audioUrl, instId) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }

    if (activePreviewId === instId) {
      setActivePreviewId(null)
      return
    }

    const audio = new Audio(audioUrl)
    currentAudioRef.current = audio
    setActivePreviewId(instId)

    audio.play().catch(() => {
      setActivePreviewId(null)
    })

    audio.onended = () => {
      setActivePreviewId(null)
      currentAudioRef.current = null
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
        const loadedInsts = prepareDeduplicatedInstruments(data.allInstruments || [])
        setAllInstruments(loadedInsts)
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

  const handleToggleInstrument = (instId) => {
    setSelectedInstrumentIds((prev) =>
      prev.includes(instId) ? prev.filter((id) => id !== instId) : [...prev, instId]
    )
  }

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    try {
      setSaving(true)
      const payload = {
        aiSummary,
        description,
        triviaQuestions: triviaQuestions.map((q) => ({
          prompt: q.prompt,
          type: 'MULTIPLE_CHOICE',
          options: q.options,
          correctAnswer: q.correctAnswer || q.options[0] || '',
        })),
        instrumentIds: selectedInstrumentIds,
      }

      const res = await updateSongCuration(songId, payload, token)
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
      const res = await generateSongArticle(songId, token)
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
      const res = await generateSongTrivia(songId, token)
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
        title="Curate Song Experience"
        description="Loading song details..."
      >
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <Loader2 className="w-10 h-10 animate-spin" style={{ margin: '0 auto', color: '#818cf8' }} />
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Fetching AI curation data...</p>
        </div>
      </CreatorPageShell>
    )
  }

  if (error) {
    return (
      <CreatorPageShell
        breadcrumbs={['Songs', 'Curation']}
        title="Curate Song Experience"
        description="Error loading curation."
      >
        <section className="studio-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle className="w-12 h-12" style={{ margin: '0 auto', color: '#ef4444' }} />
          <h2 style={{ color: '#ef4444', marginTop: '1rem' }}>Unable to Load Curation</h2>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>{error}</p>
          <button
            onClick={() => navigate('/creator/generation')}
            className="studio-button studio-button--secondary"
            style={{ marginTop: '2rem' }}
          >
            Back to Dashboard
          </button>
        </section>
      </CreatorPageShell>
    )
  }

  return (
    <CreatorPageShell
      breadcrumbs={['Songs', 'Curation']}
      description="Review and edit AI-generated cultural summary, trivia questions, and featured heritage instruments."
      title="Curate Song Experience"
      actions={
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="studio-button studio-button--secondary"
            onClick={() => navigate('/creator/generation')}
          >
            Back to Jobs
          </button>
          <button
            className="studio-button studio-button--secondary"
            onClick={() => navigate(`/creator/studio/${songId}`, { state: { lyrics: song?.rawLyrics, coverImageUrl: song?.coverImageUrl, songData: song } })}
          >
            Proceed to Studio
          </button>
        </div>
      }
    >
      {/* Toast Notification */}
      {toast.message && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          backgroundColor: toast.type === 'success' ? '#065f46' : '#991b1b',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          border: `1px solid ${toast.type === 'success' ? '#34d399' : '#f87171'}`
        }}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <AlertCircle className="w-5 h-5 text-red-300" />}
          <span style={{ fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      {/* Song Header Summary */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem 2rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            SONG CURATION CONTROL HUB
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">{song?.title || 'Untitled Song'}</h1>
          <p className="text-violet-300 text-sm mt-0.5">{song?.artist || 'Unknown Artist'} • <span className="text-slate-400">{song?.theme || 'Singaporean Heritage'}</span></p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="studio-button studio-button--primary"
          style={{ padding: '0.875rem 2rem', fontSize: '1rem', fontWeight: 600 }}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Saving...
            </>
          ) : (
            'Save Curation Changes'
          )}
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section 0: Public Song Description */}
        <section className="studio-card studio-form-card">
          <header className="studio-card__header">
            <div className="studio-card__title">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <h2>Public Song Description</h2>
            </div>
          </header>
          <div style={{ padding: '1.5rem 2rem' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>
              Overview and description presented to listeners in the public catalog:
            </label>
            <textarea
              className="studio-field"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a public description for this song..."
              style={{
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#f8fafc',
                borderRadius: '10px',
                padding: '1rem',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                lineHeight: 1.6,
                fontSize: '0.95rem'
              }}
            />
          </div>
        </section>

        {/* Section A: AI Cultural Mini-Article */}
        <section className="studio-card studio-form-card">
          <header className="studio-card__header studio-card__header--spread">
            <div className="studio-card__title">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2>AI Cultural Mini-Article</h2>
            </div>
            <button
              type="button"
              onClick={handleRegenerateArticle}
              disabled={generatingArticle}
              className="studio-button studio-button--secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              {generatingArticle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
              {generatingArticle ? 'Regenerating...' : 'Regenerate Article'}
            </button>
          </header>
          <div style={{ padding: '1.5rem 2rem' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>
              Educational mini-article (3-4 paragraphs) covering historical era, Singapore heritage context, and musical background:
            </label>
            <textarea
              className="studio-field"
              rows={8}
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder="DeepSeek generated educational mini-article..."
              style={{
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#f8fafc',
                borderRadius: '10px',
                padding: '1rem',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                lineHeight: 1.6,
                fontSize: '0.95rem'
              }}
            />
          </div>
        </section>

        {/* Section B: Trivia Questions Manager */}
        <section className="studio-card studio-form-card">
          <header className="studio-card__header studio-card__header--spread">
            <div className="studio-card__title">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h2>Interactive Trivia Questions ({triviaQuestions.length})</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleRegenerateTrivia}
                disabled={generatingTrivia}
                className="studio-button studio-button--secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
              >
                {generatingTrivia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                {generatingTrivia ? 'Regenerating...' : 'Regenerate Trivia'}
              </button>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="studio-button studio-button--secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>
          </header>

          <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {triviaQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                <p>No trivia questions created yet. Click "Add Question" to start!</p>
              </div>
            ) : (
              triviaQuestions.map((q, qIndex) => (
                <div
                  key={q.id || `q-${qIndex}`}
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(51, 65, 85, 0.6)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Question #{qIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(qIndex)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.35rem', fontWeight: 500 }}>
                      Question Prompt:
                    </label>
                    <input
                      type="text"
                      className="studio-field"
                      value={q.prompt}
                      onChange={(e) => handleQuestionPromptChange(qIndex, e.target.value)}
                      placeholder="e.g. What cultural event does this song commemorate?"
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        border: '1px solid rgba(139, 92, 246, 0.25)'
                      }}
                    />
                  </div>

                  {/* Options List */}
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Answer Options (Select radio for correct answer):
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                      {q.options.map((opt, optIndex) => {
                        const isCorrect = q.correctAnswer === opt && opt.trim() !== ''
                        return (
                          <div
                            key={`q-${qIndex}-opt-${optIndex}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              backgroundColor: isCorrect ? 'rgba(52, 211, 153, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                              border: `1px solid ${isCorrect ? 'rgba(52, 211, 153, 0.5)' : 'rgba(51, 65, 85, 0.4)'}`,
                              borderRadius: '8px',
                              padding: '0.5rem 0.75rem'
                            }}
                          >
                            <input
                              type="radio"
                              name={`correct-ans-${qIndex}`}
                              checked={isCorrect}
                              onChange={() => handleCorrectAnswerSelect(qIndex, opt)}
                              style={{ accentColor: '#10b981', width: '18px', height: '18px', cursor: 'pointer' }}
                              title="Set as correct answer"
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              style={{
                                flex: 1,
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: isCorrect ? '#34d399' : '#f8fafc',
                                outline: 'none',
                                fontSize: '0.9rem',
                                fontWeight: isCorrect ? 600 : 400
                              }}
                            />
                          </div>
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
              <Music2 className="w-5 h-5 text-violet-400" />
              <h2>Featured Heritage Instruments ({selectedInstrumentIds.length} Selected)</h2>
            </div>
          </header>

          <div style={{ padding: '1.5rem 2rem' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Select the Singaporean/Regional heritage instruments associated with this song:
            </p>

            {allInstruments.length === 0 ? (
              <p style={{ color: '#64748b' }}>No instruments available in catalog.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {allInstruments.map((inst) => {
                  const isSelected = selectedInstrumentIds.includes(inst.id)
                  const audioPath = inst.audioUrl || inst.audioSampleUrl || inst.sampleUrl || `/audio/instruments/${inst.id || inst.name.toLowerCase()}.mp3`

                  return (
                    <div
                      key={inst.id || inst.name}
                      onClick={() => handleToggleInstrument(inst.id)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                        border: `1.5px solid ${isSelected ? '#8b5cf6' : 'rgba(51, 65, 85, 0.5)'}`,
                        borderRadius: '12px',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent onClick
                        style={{ accentColor: '#8b5cf6', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.25rem' }}>{inst.icon || '🎵'}</span>
                          <h4 style={{ color: isSelected ? '#a78bfa' : '#f8fafc', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                            {inst.name}
                          </h4>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                          {inst.origin || 'Heritage Instrument'}
                        </span>
                        {inst.description && (
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {inst.description}
                          </p>
                        )}
                        {audioPath && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              playAudioPreview(audioPath, inst.id)
                            }}
                            style={{
                              marginTop: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: activePreviewId === inst.id ? 'rgba(168, 85, 247, 0.3)' : 'rgba(15, 23, 42, 0.6)',
                              border: '1px solid rgba(139, 92, 246, 0.4)',
                              color: '#c084fc',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {activePreviewId === inst.id ? (
                              <><Pause className="w-3 h-3 text-purple-300" /> Playing Sample</>
                            ) : (
                              <><Play className="w-3 h-3 text-purple-400" /> Preview Sample</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Form Footer Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', marginBottom: '3rem' }}>
          <button
            type="button"
            className="studio-button studio-button--secondary"
            onClick={() => navigate('/creator/generation')}
          >
            Back to Jobs
          </button>
          <button
            type="submit"
            disabled={saving}
            className="studio-button studio-button--primary"
            style={{ padding: '0.875rem 2.5rem', fontSize: '1rem', fontWeight: 600 }}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Saving Changes...
              </>
            ) : (
              'Save Curation Changes'
            )}
          </button>
        </div>
      </form>
    </CreatorPageShell>
  )
}
