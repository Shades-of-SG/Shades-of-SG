import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Eye,
  FileText,
  Film,
  GripVertical,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Music2,
  Pencil,
  Plus,
  RefreshCw,
  Repeat,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import CreatorPageShell from '../components/CreatorPageShell'
import GenerationStatusBadge from '../components/GenerationStatusBadge'
import { useAuth } from '../context/AuthContext'
import { getGenerationJob, retryGenerationJob, confirmGenerationScenes, regenerateScenePrompt } from '../services/songService'

/*
TODO - Htet

Implement generation status polling.
Implement progress timeline.
Implement logs view.
*/

// ─────────────────────────────────────────
// Scene Block Editor Sub-Component
// ─────────────────────────────────────────

function SceneBlockEditor({ scenes: initialScenes, segments: initialSegments, songId, jobId, token, onConfirmed, onConfirming }) {
  const [editingScenes, setEditingScenes] = useState(() => {
    const segments = (initialSegments || []).map((seg, i) => ({ ...seg, _key: `seg-${i}-${Date.now()}` }))
    const scenes = initialScenes.map((s, i) => ({
      _key: `scene-${i}-${Date.now()}`,
      startTime: s.startTime,
      endTime: s.endTime,
      lyrics: s.lyrics || '',
      visualPrompt: s.visualPrompt || '',
      blocks: s.blocks || [],
      pills: [],
    }))

    // Assign segments (pills) to scenes based on time overlap during initialization
    if (segments.length > 0 && scenes.length > 0) {
      const assigned = new Set()
      scenes.forEach((scene, sceneIdx) => {
        const sceneOrig = initialScenes[sceneIdx]
        if (Array.isArray(sceneOrig?.blocks) && sceneOrig.blocks.length > 0) {
          const blockIds = new Set(sceneOrig.blocks.map(b => b.id))
          scene.pills = segments.filter(seg => {
            if (assigned.has(seg._key)) return false
            if (seg.id && blockIds.has(seg.id)) return true
            const segStart = seg.start ?? seg.startTime ?? 0
            const segEnd = seg.end ?? seg.endTime ?? segStart
            return segStart < scene.endTime && segEnd > scene.startTime
          })
        } else {
          scene.pills = segments.filter(seg => {
            if (assigned.has(seg._key)) return false
            const segStart = seg.start ?? seg.startTime ?? 0
            const segEnd = seg.end ?? seg.endTime ?? segStart
            return segStart < scene.endTime && segEnd > scene.startTime
          })
        }
        scene.pills.forEach(p => assigned.add(p._key))
      })

      // Any unassigned segments go to the last scene
      const unassigned = segments.filter(seg => !assigned.has(seg._key))
      if (unassigned.length > 0) {
        scenes[scenes.length - 1].pills = [...scenes[scenes.length - 1].pills, ...unassigned]
      }
    }

    return scenes
  })
  const [editingSegments, setEditingSegments] = useState(() =>
    (initialSegments || []).map((seg, i) => ({ ...seg, _key: `seg-${i}-${Date.now()}` }))
  )
  const [editingPillKey, setEditingPillKey] = useState(null)
  const [editingPillText, setEditingPillText] = useState('')
  const [regeneratingIdx, setRegeneratingIdx] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [isGeneratingMissing, setIsGeneratingMissing] = useState(false)
  const [dragState, setDragState] = useState(null) // { pillKey, fromSceneIdx }
  const [dropTarget, setDropTarget] = useState(null)

  const normalizeKey = (str) => {
    if (!str || typeof str !== 'string') return ''
    return str
      .toLowerCase()
      .replace(/\[.*?\]/g, '')       // Remove bracketed headers like [Chorus] or [Music]
      .replace(/[\r\n]+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')   // Strip all punctuation and unicode symbols/emojis
      .replace(/\s+/g, ' ')          // Collapse whitespace
      .trim()
  }

  const syncChorusPrompts = useCallback((scenes) => {
    const chorusMap = new Map()
    scenes.forEach(s => {
      const lyrics = (s.pills.map(p => p.text).join(' ') || s.lyrics || '').trim()
      const key = normalizeKey(lyrics)
      if (key && key.length > 0 && s.visualPrompt && s.visualPrompt.trim() && !chorusMap.has(key)) {
        chorusMap.set(key, s.visualPrompt.trim())
      }
    })

    return scenes.map(scene => {
      const lyrics = (scene.pills.map(p => p.text).join(' ') || scene.lyrics || '').trim()
      const key = normalizeKey(lyrics)
      if (key && chorusMap.has(key)) {
        const syncedPrompt = chorusMap.get(key)
        return { ...scene, visualPrompt: syncedPrompt }
      }
      return scene
    })
  }, [])

  // ─── Recalculate scene start/end times from pills ───
  const recalcTimes = useCallback((scenes) => {
    const updated = scenes.map(scene => {
      if (scene.pills.length === 0) return scene
      const starts = scene.pills.map(p => p.start)
      const ends = scene.pills.map(p => p.end)
      return { ...scene, startTime: Math.min(...starts), endTime: Math.max(...ends) }
    })
    return syncChorusPrompts(updated)
  }, [syncChorusPrompts])

  const movePill = useCallback((pillKey, fromSceneIdx, targetSceneIdx) => {
    if (fromSceneIdx === targetSceneIdx) return
    setEditingScenes(prev => {
      if (targetSceneIdx < 0 || targetSceneIdx >= prev.length) return prev
      const updated = prev.map((scene, idx) => {
        if (idx === fromSceneIdx) {
          return { ...scene, pills: scene.pills.filter(p => p._key !== pillKey) }
        }
        if (idx === targetSceneIdx) {
          const pill = prev[fromSceneIdx].pills.find(p => p._key === pillKey)
          if (!pill) return scene
          // Insert in time order
          const newPills = [...scene.pills, pill].sort((a, b) => a.start - b.start)
          return { ...scene, pills: newPills }
        }
        return scene
      })
      return recalcTimes(updated)
    })
  }, [recalcTimes])

  // ─── Drag Handlers ───
  const handleDragStart = (e, pillKey, sceneIdx) => {
    setDragState({ pillKey, fromSceneIdx: sceneIdx })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', pillKey)
  }

  const handleDragOver = (e, targetIdx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(targetIdx)
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = (e, targetSceneIdx) => {
    e.preventDefault()
    setDropTarget(null)
    if (!dragState) return
    const { pillKey, fromSceneIdx } = dragState
    movePill(pillKey, fromSceneIdx, targetSceneIdx)
    setDragState(null)
  }

  // ─── Inline Lyric Editing ───
  const startEditPill = (pill) => {
    setEditingPillKey(pill._key)
    setEditingPillText(pill.text)
  }

  const saveEditPill = () => {
    const key = editingPillKey
    const newText = editingPillText

    // Update in segments state
    setEditingSegments(prev => prev.map(seg =>
      seg._key === key ? { ...seg, text: newText } : seg
    ))

    // Update in scene pills
    setEditingScenes(prev => {
      const updated = prev.map(scene => ({
        ...scene,
        pills: scene.pills.map(p => p._key === key ? { ...p, text: newText } : p)
      }))
      return syncChorusPrompts(updated)
    })

    setEditingPillKey(null)
    setEditingPillText('')
  }

  const cancelEditPill = () => {
    setEditingPillKey(null)
    setEditingPillText('')
  }

  // ─── Visual Prompt Editing ───
  const updatePrompt = (sceneIdx, newPrompt) => {
    setEditingScenes(prev => {
      const targetScene = prev[sceneIdx]
      const targetLyrics = (targetScene.pills.map(p => p.text).join(' ') || targetScene.lyrics || '').trim()
      const targetKey = normalizeKey(targetLyrics)

      return prev.map((s, i) => {
        if (i === sceneIdx) return { ...s, visualPrompt: newPrompt }
        const sLyrics = (s.pills.map(p => p.text).join(' ') || s.lyrics || '').trim()
        if (targetKey && targetKey.length > 0 && normalizeKey(sLyrics) === targetKey) {
          return { ...s, visualPrompt: newPrompt }
        }
        return s
      })
    })
  }

  // ─── Regenerate Single Prompt ───
  const handleRegeneratePrompt = async (sceneIdx) => {
    const scene = editingScenes[sceneIdx]
    const lyrics = scene.pills.map(p => p.text).join(' ') || scene.lyrics
    if (!lyrics?.trim()) return

    setRegeneratingIdx(sceneIdx)
    try {
      const result = await regenerateScenePrompt(songId, lyrics, token)
      updatePrompt(sceneIdx, result.visualPrompt)
    } catch (err) {
      console.error('Regenerate prompt failed:', err)
      alert('Failed to regenerate prompt. Please try again.')
    } finally {
      setRegeneratingIdx(null)
    }
  }

  // ─── Add Scene ───
  const addSceneAfter = (afterIdx) => {
    setEditingScenes(prev => {
      const newScene = {
        _key: `scene-new-${Date.now()}`,
        startTime: afterIdx >= 0 ? prev[afterIdx].endTime : 0,
        endTime: afterIdx >= 0 ? prev[afterIdx].endTime : 0,
        lyrics: '',
        visualPrompt: '',
        pills: [],
      }
      const updated = [...prev]
      updated.splice(afterIdx + 1, 0, newScene)
      return updated
    })
  }

  // ─── Fill Instrumental Gap ───
  const handleFillInstrumentalGap = (afterIdx, gapStart, gapEnd) => {
    setEditingScenes(prev => {
      const newScene = {
        _key: `scene-inst-${Date.now()}`,
        startTime: Number(gapStart.toFixed(2)),
        endTime: Number(gapEnd.toFixed(2)),
        lyrics: '[Instrumental Breakdown]',
        visualPrompt: 'Cinematic wide shot of Singapore urban landscape with atmospheric lighting, camera slowly panning across architectural landmarks.',
        blocks: [],
        pills: [],
      }
      const updated = [...prev]
      updated.splice(afterIdx + 1, 0, newScene)
      return updated
    })
  }

  // ─── Delete Scene (only if empty) ───
  const deleteScene = (sceneIdx) => {
    const scene = editingScenes[sceneIdx]
    if (scene.pills.length > 0) return
    setEditingScenes(prev => prev.filter((_, i) => i !== sceneIdx))
  }

  // ─── Confirm & Send ───
  const handleConfirm = async () => {
    const hasEmptyPrompt = editingScenes.some(s => !s.visualPrompt || !s.visualPrompt.trim())
    setIsGeneratingMissing(hasEmptyPrompt)
    setConfirming(true)
    if (onConfirming) onConfirming(true)
    try {
      const scenesPayload = editingScenes.map(scene => ({
        start_time: scene.startTime,
        end_time: scene.endTime,
        lyrics: scene.pills.map(p => p.text).join(' ') || scene.lyrics,
        visual_prompt: scene.visualPrompt,
      }))

      const segmentsPayload = editingSegments.map(seg => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
      }))

      await confirmGenerationScenes(jobId, scenesPayload, segmentsPayload, token)
      onConfirmed()
    } catch (err) {
      console.error('Confirm scenes failed:', err)
      alert('Failed to confirm scenes. Please try again.')
      if (onConfirming) onConfirming(false)
    } finally {
      setConfirming(false)
      setIsGeneratingMissing(false)
    }
  }

  const formatTime = (secs) => {
    const val = Number(secs) || 0
    const m = Math.floor(val / 60)
    const s = (val % 60).toFixed(2)
    return `${m}:${s.padStart(5, '0')}`
  }

  return (
    <div className="gp-editor-stack" onClick={e => e.stopPropagation()}>
      {/* Header Bar */}
      <div className="gp-editor-bar">
        <div className="gp-editor-bar__meta">
          <Eye aria-hidden="true" className="gp-icon-violet" size={18} />
          <span className="gp-editor-bar__title">Review &amp; Edit Scene Plan</span>
          <span className="gp-scene-count-badge">{editingScenes.length} scenes</span>
        </div>
        <button
          className="gp-confirm-btn gp-confirm-btn--header"
          disabled={confirming || editingScenes.length === 0}
          onClick={handleConfirm}
          type="button"
        >
          {confirming ? (
            <>
              <Loader2 aria-hidden="true" className="gp-spin" size={18} />
              {isGeneratingMissing ? 'Generating missing descriptions & saving...' : 'Submitting scenes...'}
            </>
          ) : (
            <>
              <Check aria-hidden="true" size={18} /> Confirm &amp; Generate Images
            </>
          )}
        </button>
      </div>

      {/* Add Scene at the top */}
      <AddSceneButton onClick={() => addSceneAfter(-1)} />

      {/* Scene Blocks */}
      {editingScenes.map((scene, sceneIdx) => (
        <div key={scene._key}>
          <div
            className={`gp-scene-card ${dropTarget === sceneIdx ? 'is-drop-target' : ''}`}
            onDragOver={(e) => handleDragOver(e, sceneIdx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, sceneIdx)}
          >
            {/* Scene Header */}
            <div className="gp-scene-card__header">
              {(() => {
                const currentLyrics = (scene.pills.map(p => p.text).join(' ') || scene.lyrics || '').trim()
                const currentKey = normalizeKey(currentLyrics)
                const isChorusRepeat = currentKey.length > 0 && editingScenes.some((s, idx) => {
                  if (idx === sceneIdx) return false
                  const otherLyrics = (s.pills.map(p => p.text).join(' ') || s.lyrics || '').trim()
                  return normalizeKey(otherLyrics) === currentKey
                })

                return (
                  <div className="gp-scene-card__badges">
                    <strong className="gp-scene-card__label">Scene {sceneIdx + 1}</strong>
                    <span className="gp-time-pill">
                      {Number(scene?.startTime || 0).toFixed(2)}s – {Number(scene?.endTime || 0).toFixed(2)}s
                    </span>
                    {isChorusRepeat && (
                      <span className="gp-chorus-badge">
                        <Repeat aria-hidden="true" size={13} /> Chorus Synced (Reuses Image)
                      </span>
                    )}
                  </div>
                )
              })()}
              <button
                className="gp-delete-scene-btn"
                disabled={scene.pills.length > 0}
                onClick={() => deleteScene(sceneIdx)}
                title={scene.pills.length > 0 ? 'Move all lyric pills out before deleting' : 'Delete empty scene'}
                type="button"
              >
                <Trash2 aria-hidden="true" size={15} /> Delete
              </button>
            </div>

            {/* Lyric Pills Zone */}
            <div className="gp-pills-zone">
              {scene.pills.length === 0 && (
                <div className="gp-empty-pills">
                  <span className="gp-instrumental-badge">
                    <Music2 aria-hidden="true" size={15} /> Instrumental / Visual-Only Scene
                  </span>
                  <span className="gp-empty-pills__hint">
                    No lyrics assigned — move lyric blocks here if needed
                  </span>
                </div>
              )}
              {scene.pills.map(pill => (
                <LyricPill
                  canMoveNext={sceneIdx < editingScenes.length - 1}
                  canMovePrev={sceneIdx > 0}
                  editText={editingPillText}
                  isEditing={editingPillKey === pill._key}
                  key={pill._key}
                  onCancelEdit={cancelEditPill}
                  onChangeEditText={setEditingPillText}
                  onDragStart={handleDragStart}
                  onMoveNext={() => movePill(pill._key, sceneIdx, sceneIdx + 1)}
                  onMovePrev={() => movePill(pill._key, sceneIdx, sceneIdx - 1)}
                  onSaveEdit={saveEditPill}
                  onStartEdit={startEditPill}
                  pill={pill}
                  sceneIdx={sceneIdx}
                />
              ))}
            </div>

            {/* Visual Prompt Container */}
            <div className="gp-prompt-box">
              <div className="gp-prompt-box__header">
                <span className="gp-prompt-box__label">Visual Prompt</span>
                <button
                  className="gp-regen-btn"
                  disabled={regeneratingIdx === sceneIdx}
                  onClick={() => handleRegeneratePrompt(sceneIdx)}
                  type="button"
                >
                  {regeneratingIdx === sceneIdx ? (
                    <>
                      <Loader2 aria-hidden="true" className="gp-spin" size={14} /> Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles aria-hidden="true" size={14} /> Regenerate
                    </>
                  )}
                </button>
              </div>
              <textarea
                className="custom-scrollbar gp-prompt-textarea"
                onChange={(e) => updatePrompt(sceneIdx, e.target.value)}
                placeholder="Describe the visual scene for image generation..."
                rows={3}
                value={scene.visualPrompt}
              />
            </div>
          </div>

          {/* Add Scene button & Instrumental Gap banner between scenes */}
          {(() => {
            const nextScene = editingScenes[sceneIdx + 1]
            const hasGap = nextScene && (nextScene.startTime - scene.endTime >= 0.5)
            const gapDuration = hasGap ? Number(nextScene.startTime - scene.endTime).toFixed(2) : 0

            return (
              <>
                {hasGap && (
                  <div className="gp-gap-banner">
                    <span className="gp-gap-banner__label">
                      <Music2 aria-hidden="true" size={16} /> Instrumental Gap Detected: {formatTime(scene.endTime)} → {formatTime(nextScene.startTime)} ({gapDuration}s)
                    </span>
                    <button
                      className="gp-gap-banner__btn"
                      onClick={() => handleFillInstrumentalGap(sceneIdx, scene.endTime, nextScene.startTime)}
                      type="button"
                    >
                      <Plus aria-hidden="true" size={15} /> Fill Instrumental Gap
                    </button>
                  </div>
                )}
                <AddSceneButton onClick={() => addSceneAfter(sceneIdx)} />
              </>
            )
          })()}
        </div>
      ))}

      {/* ─── Sticky Bottom CTA Bar (AWAITING_REVIEW) ─── */}
      <div className="gp-review-sticky-bar">
        <div className="gp-review-sticky-bar__copy">
          <p className="gp-review-sticky-bar__title">Ready to generate images?</p>
          <p className="gp-review-sticky-bar__sub">
            Once confirmed, AI will generate frames for each scene. This cannot be undone.
          </p>
        </div>
        <button
          className="gp-confirm-btn gp-confirm-btn--sticky"
          disabled={confirming || editingScenes.length === 0}
          onClick={handleConfirm}
          type="button"
        >
          {confirming ? (
            <>
              <Loader2 aria-hidden="true" className="gp-spin" size={18} />
              {isGeneratingMissing ? 'Generating missing descriptions & saving...' : 'Submitting scenes...'}
            </>
          ) : (
            <>
              <Sparkles aria-hidden="true" size={18} /> Confirm &amp; Generate Images
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Lyric Pill Atom ───
function LyricPill({
  canMoveNext,
  canMovePrev,
  editText,
  isEditing,
  onCancelEdit,
  onChangeEditText,
  onDragStart,
  onMoveNext,
  onMovePrev,
  onSaveEdit,
  onStartEdit,
  pill,
  sceneIdx,
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus()
  }, [isEditing])

  if (isEditing) {
    return (
      <span className="gp-lyric-pill gp-lyric-pill--editing">
        <input
          className="gp-lyric-pill__input"
          onChange={(e) => onChangeEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit()
            if (e.key === 'Escape') onCancelEdit()
          }}
          ref={inputRef}
          style={{ width: `${Math.max(editText.length * 8, 120)}px` }}
          value={editText}
        />
        <button aria-label="Save lyric block" className="gp-pill-btn gp-pill-btn--save" onClick={onSaveEdit} type="button">
          <Check aria-hidden="true" size={16} />
        </button>
        <button aria-label="Cancel editing lyric block" className="gp-pill-btn gp-pill-btn--cancel" onClick={onCancelEdit} type="button">
          <X aria-hidden="true" size={16} />
        </button>
      </span>
    )
  }

  return (
    <span
      className="gp-lyric-pill"
      draggable
      onDoubleClick={() => onStartEdit(pill)}
      onDragStart={(e) => onDragStart(e, pill._key, sceneIdx)}
      title="Drag or tap arrows to move • Tap pencil to edit"
    >
      <GripVertical aria-hidden="true" className="gp-lyric-pill__grip" size={16} />
      <span className="gp-lyric-pill__text">{pill.text}</span>
      <span className="gp-lyric-pill__actions">
        <button
          aria-label="Move lyric block to previous scene"
          className="gp-pill-btn"
          disabled={!canMovePrev}
          onClick={(e) => { e.stopPropagation(); onMovePrev() }}
          title="Move to previous scene"
          type="button"
        >
          <ArrowUp aria-hidden="true" size={15} />
        </button>
        <button
          aria-label="Move lyric block to next scene"
          className="gp-pill-btn"
          disabled={!canMoveNext}
          onClick={(e) => { e.stopPropagation(); onMoveNext() }}
          title="Move to next scene"
          type="button"
        >
          <ArrowDown aria-hidden="true" size={15} />
        </button>
        <button
          aria-label="Edit lyric block"
          className="gp-pill-btn"
          onClick={(e) => { e.stopPropagation(); onStartEdit(pill) }}
          title="Edit lyric block"
          type="button"
        >
          <Pencil aria-hidden="true" size={15} />
        </button>
      </span>
    </span>
  )
}

// ─── Add Scene Button ───
function AddSceneButton({ onClick }) {
  return (
    <div className="gp-add-scene-row">
      <button className="gp-add-scene-btn" onClick={onClick} type="button">
        <Plus aria-hidden="true" size={16} /> Add Scene
      </button>
    </div>
  )
}


// ─────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────

export default function GenerationProgress() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  
  const [jobData, setJobData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pollTrigger, setPollTrigger] = useState(0)
  
  const [isPhase1Expanded, setIsPhase1Expanded] = useState(false)
  const [isPhase2Expanded, setIsPhase2Expanded] = useState(false)
  const [isPhase3Expanded, setIsPhase3Expanded] = useState(false)
  const [isPhase4Expanded, setIsPhase4Expanded] = useState(false)
  const [isPhase5Expanded, setIsPhase5Expanded] = useState(false)

  // Auto-expand Phase 2 when AWAITING_REVIEW is first detected
  const hasAutoExpandedPhase2 = useRef(false)

  useEffect(() => {
    let timeoutId
    let isMounted = true

    const fetchStatus = async () => {
      try {
        const data = await getGenerationJob(id, token)
        if (!isMounted) return

        setJobData(data)
        setError(null)
        // Auto-expand Phase 2 when AWAITING_REVIEW is first detected
        if (data.status === 'AWAITING_REVIEW' && !hasAutoExpandedPhase2.current) {
          hasAutoExpandedPhase2.current = true
          setIsPhase2Expanded(true)
        }
        // Stop polling when complete, failed, or awaiting user review
        if (data.status !== 'COMPLETED' && data.status !== 'FAILED' && data.status !== 'AWAITING_REVIEW') {
          if (isMounted) {
            timeoutId = window.setTimeout(fetchStatus, 3000)
          }
        }
      } catch (err) {
        if (!isMounted) return
        setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchStatus()

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [id, token, pollTrigger])

  if (loading) {
    return (
      <CreatorPageShell breadcrumbs={['Generation Progress']} className="gp-page" description="Loading..." title="Generation Progress">
        <div className="gp-loading-state">
          <Loader2 aria-hidden="true" className="gp-spin gp-spinner" size={32} />
          <p className="gp-loading-copy">Fetching job details...</p>
        </div>
      </CreatorPageShell>
    )
  }

  if (error) {
    return (
      <CreatorPageShell breadcrumbs={['Generation Progress']} className="gp-page" description="Error loading job." title="Generation Progress">
        <section className="studio-card gp-error-card" role="alert">
          <AlertCircle aria-hidden="true" className="gp-error-icon" size={48} />
          <h2 className="gp-error-title">Unable to Load Job</h2>
          <p className="gp-error-copy">{error}</p>
          <button
            className="studio-button studio-button--secondary gp-error-btn"
            onClick={() => navigate('/creator/generation')}
            type="button"
          >
            Back to Generation Jobs
          </button>
        </section>
      </CreatorPageShell>
    )
  }

  const status = jobData?.status || 'QUEUED'
  const sceneSegments = jobData?.song?.sceneSegments || []
  const isAwaitingReview = status === 'AWAITING_REVIEW'

  const renderStatusTag = (label, type = 'waiting') => {
    const icons = {
      completed: <CheckCircle aria-hidden="true" size={14} />,
      failed: <AlertCircle aria-hidden="true" size={14} />,
      processing: <Loader2 aria-hidden="true" className="gp-spin" size={14} />,
      review: <Pencil aria-hidden="true" size={14} />,
      waiting: null,
    }
    return (
      <span className={`gp-status-tag gp-status-tag--${type}`}>
        {icons[type]}
        {label}
      </span>
    )
  }

  const getPhaseStatus = (phaseNum) => {
    const hasScenes = sceneSegments && sceneSegments.length > 0
    const totalFrames = sceneSegments?.length || 0
    const generatedFrames = sceneSegments?.filter(s => (s.generatedFrames && s.generatedFrames.length > 0) || Boolean(s.imageUrl)).length || 0
    const framesDone = totalFrames > 0 && generatedFrames === totalFrames

    if (phaseNum === 1) {
      if (status === 'FAILED') return renderStatusTag('Failed', 'failed')
      return renderStatusTag('Completed', 'completed')
    }
    if (phaseNum === 2) {
      if (isAwaitingReview) return renderStatusTag('Awaiting Review', 'review')
      if (hasScenes) return renderStatusTag('Completed', 'completed')
      if (status === 'FAILED') return renderStatusTag('Failed', 'failed')
      return renderStatusTag('Processing...', 'processing')
    }
    if (phaseNum === 3) {
      if (isAwaitingReview) return renderStatusTag('Waiting', 'waiting')
      if (framesDone) return renderStatusTag('Completed', 'completed')
      if (status === 'FAILED') return renderStatusTag('Failed', 'failed')
      if (hasScenes) return renderStatusTag(`${generatedFrames}/${totalFrames} Frames`, 'processing')
      return renderStatusTag('Waiting', 'waiting')
    }
    if (phaseNum === 4) {
      if (isAwaitingReview) return renderStatusTag('Waiting', 'waiting')
      if (status === 'COMPLETED') return renderStatusTag('Completed', 'completed')
      if (status === 'FAILED') return renderStatusTag('Failed', 'failed')
      if (framesDone) return renderStatusTag('Stitching...', 'processing')
      return renderStatusTag('Waiting', 'waiting')
    }
    if (phaseNum === 5) {
      if (isAwaitingReview) return renderStatusTag('Waiting', 'waiting')
      if (status === 'COMPLETED') return renderStatusTag('Completed', 'completed')
      if (status === 'FAILED') return renderStatusTag('Skipped', 'failed')
      if (framesDone) return renderStatusTag('Generating...', 'processing')
      return renderStatusTag('Waiting', 'waiting')
    }
    return null
  }

  const handleScenesConfirmed = () => {
    // Smoothly transition: update local state to PROCESSING and restart the polling loop
    setJobData(prev => prev ? { ...prev, status: 'PROCESSING' } : prev)
    setPollTrigger(t => t + 1)
  }

  return (
    <CreatorPageShell
      actions={
        <button
          className="studio-button studio-button--secondary"
          onClick={() => navigate('/creator/generation')}
          type="button"
        >
          Back to Jobs
        </button>
      }
      breadcrumbs={['Generation Tasks', 'Progress']}
      className="gp-page"
      description="Monitor the real-time compilation of your AI video."
      title="Generation Progress"
    >
      <div className="gp-project-header">
        <h2 className="gp-project-title">{jobData?.song?.title || 'Unknown Project'}</h2>
        <p className="gp-project-artist">{jobData?.song?.artist || 'Unknown Artist'}</p>
      </div>

      {/* 1. Status Card */}
      <section className="gp-status-card">
        <header className="gp-status-card__header">
          <div className="gp-status-card__title">
            <Clapperboard aria-hidden="true" className="gp-icon-violet" size={22} />
            <h2>Compilation Status</h2>
          </div>
          <GenerationStatusBadge errorMessage={jobData?.errorMessage} status={status} />
        </header>

        <div className="gp-status-card__body">
          {status === 'FAILED' && (
            <div className="gp-failed-box">
              {jobData?.errorMessage && (
                <p className="gp-failed-box__msg">{jobData.errorMessage}</p>
              )}
              <button
                className="studio-button studio-button--primary gp-retry-btn"
                onClick={async () => {
                  try {
                    await retryGenerationJob(jobData.id, token)
                    setJobData(prev => prev ? { ...prev, status: 'PROCESSING', errorMessage: null } : prev)
                    setPollTrigger(t => t + 1)
                  } catch (err) {
                    console.error('Retry failed:', err)
                    alert('Failed to retry generation. Please try again.')
                  }
                }}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={16} />
                Retry / Resume Generation
              </button>
            </div>
          )}

          {isAwaitingReview && (
            <div className="gp-review-banner">
              <Pencil aria-hidden="true" className="gp-review-banner__icon" size={20} />
              <div>
                <p className="gp-review-banner__title">Scene plan is ready for your review</p>
                <p className="gp-review-banner__copy">
                  Expand Phase 2 below to review, edit, and confirm your scenes before image generation begins.
                </p>
              </div>
            </div>
          )}

          {status === 'COMPLETED' ? (
            <div className="gp-completed-box">
              <p className="gp-completed-box__title">
                <Sparkles aria-hidden="true" size={18} />
                Your cinematic video has been assembled successfully!
              </p>
              <div className="gp-completed-box__actions">
                <Link
                  className="studio-button studio-button--primary gp-completed-cta"
                  to={`/creator/editor/${jobData.id}`}
                >
                  Proceed to Video Editor
                </Link>
                <Link
                  className="studio-button studio-button--secondary gp-completed-cta"
                  to={`/creator/curation/${jobData.songId}`}
                >
                  Curate Song Details &amp; Trivia
                </Link>
              </div>
            </div>
          ) : !isAwaitingReview ? (
            <p className="gp-processing-copy">Video is currently processing...</p>
          ) : null}
        </div>
      </section>

      {/* ─── Phases Group Container ─── */}
      <div className="gp-phases-stack">
        {/* Phase 1 Accordion */}
        <section className="studio-card studio-form-card gp-phase-card">
          <header className="studio-card__header studio-card__header--spread gp-phase-card__header">
            <button
              aria-expanded={isPhase1Expanded}
              className="gp-phase-header"
              onClick={() => setIsPhase1Expanded(!isPhase1Expanded)}
              type="button"
            >
              <span className="gp-phase-header__title">
                <Headphones aria-hidden="true" className="gp-icon-violet" size={20} />
                <span>Phase 1: Audio &amp; Lyric Extraction</span>
                {getPhaseStatus(1)}
              </span>
              <span className="gp-phase-header__toggle">
                <span>{isPhase1Expanded ? 'Collapse' : 'Expand'}</span>
                {isPhase1Expanded ? <ChevronDown aria-hidden="true" size={20} /> : <ChevronRight aria-hidden="true" size={20} />}
              </span>
            </button>
          </header>

          {isPhase1Expanded && (
            <div className="gp-phase-body">
              <div className="gp-phase-outcome">
                <CheckCircle aria-hidden="true" className="gp-outcome-icon is-success" size={32} />
                <div>
                  <h3 className="gp-outcome-title">Audio &amp; Lyric Extraction Complete</h3>
                  <p className="gp-outcome-copy is-success">Audio stream uploaded and timed lyric transcription segments successfully created.</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Phase 2 Accordion */}
        <section className={`studio-card studio-form-card gp-phase-card ${isAwaitingReview ? 'is-awaiting-review' : ''}`}>
          <header className="studio-card__header studio-card__header--spread gp-phase-card__header">
            <button
              aria-expanded={isPhase2Expanded}
              className="gp-phase-header"
              onClick={() => setIsPhase2Expanded(!isPhase2Expanded)}
              type="button"
            >
              <span className="gp-phase-header__title">
                <FileText aria-hidden="true" className="gp-icon-violet" size={20} />
                <span>Phase 2: AI Scene Planning</span>
                {getPhaseStatus(2)}
              </span>
              <span className="gp-phase-header__toggle">
                <span>{isPhase2Expanded ? 'Collapse' : 'Expand'}</span>
                {isPhase2Expanded ? <ChevronDown aria-hidden="true" size={20} /> : <ChevronRight aria-hidden="true" size={20} />}
              </span>
            </button>
          </header>

          {isPhase2Expanded && (
            <div className="gp-phase-body">
              {/* ─── Scene Block Editor (AWAITING_REVIEW mode) ─── */}
              {isAwaitingReview && sceneSegments.length > 0 ? (
                <SceneBlockEditor
                  jobId={jobData?.id}
                  onConfirmed={handleScenesConfirmed}
                  onConfirming={() => { /* spinner state is managed internally */ }}
                  scenes={sceneSegments}
                  segments={jobData?.song?.transcriptionSegments}
                  songId={jobData?.songId || jobData?.song?.id}
                  token={token}
                />
              ) : sceneSegments && sceneSegments.length > 0 ? (
                <div className="gp-readonly-scenes">
                  {sceneSegments.map((segment, idx) => (
                    <div className="gp-scene-card" key={segment.id}>
                      <div className="gp-scene-card__header">
                        <strong className="gp-scene-card__label">Scene {idx + 1}</strong>
                        <span className="gp-time-pill">
                          {Number(segment?.startTime || 0).toFixed(2)}s - {Number(segment?.endTime || 0).toFixed(2)}s
                        </span>
                      </div>

                      {segment.lyrics && (
                        <p className="gp-scene-lyrics">&ldquo;{segment.lyrics}&rdquo;</p>
                      )}

                      <div className="gp-prompt-box">
                        <span className="gp-prompt-box__label gp-prompt-box__label--spaced">Visual Prompt</span>
                        <p className="gp-prompt-readonly">{segment.visualPrompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="gp-phase-waiting">
                  <Loader2 aria-hidden="true" className="gp-spin gp-spinner" size={32} />
                  <p>Waiting for AI Scene Generation...</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Phase 3 Accordion */}
        <section className="studio-card studio-form-card gp-phase-card">
          <header className="studio-card__header studio-card__header--spread gp-phase-card__header">
            <button
              aria-expanded={isPhase3Expanded}
              className="gp-phase-header"
              onClick={() => setIsPhase3Expanded(!isPhase3Expanded)}
              type="button"
            >
              <span className="gp-phase-header__title">
                <ImageIcon aria-hidden="true" className="gp-icon-violet" size={20} />
                <span>Phase 3: Image Generation</span>
                {getPhaseStatus(3)}
              </span>
              <span className="gp-phase-header__toggle">
                <span>{isPhase3Expanded ? 'Collapse' : 'Expand'}</span>
                {isPhase3Expanded ? <ChevronDown aria-hidden="true" size={20} /> : <ChevronRight aria-hidden="true" size={20} />}
              </span>
            </button>
          </header>

          {isPhase3Expanded && (
            <div className="gp-phase-body">
              {sceneSegments && sceneSegments.length > 0 ? (
                <div className="gp-frames-grid">
                  {sceneSegments.map((segment, idx) => {
                    const frames = segment.generatedFrames || []
                    return (
                      <div className="gp-frame-card" key={`p3-${segment.id}`}>
                        <div className="gp-frame-card__head">
                          <span className="gp-scene-card__label">SCENE {idx + 1}</span>
                          <span className="gp-frame-count-pill">{frames.length} Frame(s)</span>
                        </div>

                        {frames.length > 0 ? (
                          <div className="gp-frame-card__thumbs">
                            {frames.map(frame => (
                              <div className="gp-frame-thumb" key={frame.id}>
                                <img alt={`Scene ${idx + 1} Frame`} src={frame.imageUrl} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="gp-frame-placeholder">
                            {status === 'COMPLETED' || status === 'FAILED' ? (
                              <span>No frames</span>
                            ) : (
                              <>
                                <Loader2 aria-hidden="true" className="gp-spin gp-icon-violet" size={18} />
                                <span>Generating...</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="gp-phase-waiting">
                  <Loader2 aria-hidden="true" className="gp-spin gp-spinner" size={32} />
                  <p>Waiting for scenes before generating frames...</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Phase 4 Accordion */}
        <section className="studio-card studio-form-card gp-phase-card">
          <header className="studio-card__header studio-card__header--spread gp-phase-card__header">
            <button
              aria-expanded={isPhase4Expanded}
              className="gp-phase-header"
              onClick={() => setIsPhase4Expanded(!isPhase4Expanded)}
              type="button"
            >
              <span className="gp-phase-header__title">
                <Film aria-hidden="true" className="gp-icon-violet" size={20} />
                <span>Phase 4: Video Assembly</span>
                {getPhaseStatus(4)}
              </span>
              <span className="gp-phase-header__toggle">
                <span>{isPhase4Expanded ? 'Collapse' : 'Expand'}</span>
                {isPhase4Expanded ? <ChevronDown aria-hidden="true" size={20} /> : <ChevronRight aria-hidden="true" size={20} />}
              </span>
            </button>
          </header>

          {isPhase4Expanded && (
            <div className="gp-phase-body">
              {status === 'COMPLETED' ? (
                <div className="gp-phase-outcome">
                  <CheckCircle aria-hidden="true" className="gp-outcome-icon is-success" size={32} />
                  <div>
                    <h3 className="gp-outcome-title">FFmpeg Assembly Complete</h3>
                    <p className="gp-outcome-copy is-success">Video has been successfully stitched and is ready.</p>
                  </div>
                </div>
              ) : status === 'FAILED' ? (
                <div className="gp-phase-outcome">
                  <AlertCircle aria-hidden="true" className="gp-outcome-icon is-error" size={32} />
                  <div>
                    <h3 className="gp-outcome-title">Assembly Failed</h3>
                    <p className="gp-outcome-copy is-error">There was an error stitching the video.</p>
                  </div>
                </div>
              ) : (sceneSegments.length > 0 && sceneSegments.every(seg => (seg.generatedFrames && seg.generatedFrames.length > 0) || Boolean(seg.imageUrl))) ? (
                <div className="gp-phase-waiting">
                  <Loader2 aria-hidden="true" className="gp-spin gp-spinner" size={32} />
                  <p>Stitching MP4 with FFmpeg...</p>
                </div>
              ) : (
                <div className="gp-phase-waiting">
                  <Loader2 aria-hidden="true" className="gp-spin gp-spinner-muted" size={32} />
                  <p>Waiting for image generation to complete...</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Phase 5 Accordion */}
        <section className="studio-card studio-form-card gp-phase-card">
          <header className="studio-card__header studio-card__header--spread gp-phase-card__header">
            <button
              aria-expanded={isPhase5Expanded}
              className="gp-phase-header"
              onClick={() => setIsPhase5Expanded(!isPhase5Expanded)}
              type="button"
            >
              <span className="gp-phase-header__title">
                <Sparkles aria-hidden="true" className="gp-icon-violet" size={20} />
                <span>Phase 5: Cultural Curation &amp; Trivia</span>
                {getPhaseStatus(5)}
              </span>
              <span className="gp-phase-header__toggle">
                <span>{isPhase5Expanded ? 'Collapse' : 'Expand'}</span>
                {isPhase5Expanded ? <ChevronDown aria-hidden="true" size={20} /> : <ChevronRight aria-hidden="true" size={20} />}
              </span>
            </button>
          </header>

          {isPhase5Expanded && (
            <div className="gp-phase-body">
              {status === 'COMPLETED' ? (
                <div className="gp-phase-outcome">
                  <CheckCircle aria-hidden="true" className="gp-outcome-icon is-success" size={32} />
                  <div>
                    <h3 className="gp-outcome-title">Curation Complete</h3>
                    <p className="gp-outcome-copy is-success">Cultural summary, trivia questions, and instrument matches have been generated.</p>
                  </div>
                </div>
              ) : status === 'FAILED' ? (
                <div className="gp-phase-outcome">
                  <AlertCircle aria-hidden="true" className="gp-outcome-icon is-warning" size={32} />
                  <div>
                    <h3 className="gp-outcome-title">Curation Skipped</h3>
                    <p className="gp-outcome-copy is-warning">Pipeline failed before curation could complete. Retry the generation to generate curation details.</p>
                  </div>
                </div>
              ) : (
                <div className="gp-phase-waiting">
                  <Loader2 aria-hidden="true" className="gp-spin gp-spinner" size={32} />
                  <p>Generating cultural summary, trivia, &amp; instrument matches...</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </CreatorPageShell>
  )
}
