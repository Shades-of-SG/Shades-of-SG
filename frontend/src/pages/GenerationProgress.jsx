import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, ChevronDown, ChevronRight, AlertCircle, CheckCircle, RefreshCw, Sparkles, GripVertical, Pencil, Plus, Trash2, Check, X, Eye } from 'lucide-react'
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
    return str.toLowerCase().replace(/\[.*?\]/g, '').replace(/[^a-z0-9]/g, '').trim()
  }

  const syncChorusPrompts = useCallback((scenes) => {
    const chorusMap = new Map()
    scenes.forEach(s => {
      const lyrics = (s.pills.map(p => p.text).join(' ') || s.lyrics || '').trim()
      const key = normalizeKey(lyrics)
      if (key && key.length > 5 && s.visualPrompt && s.visualPrompt.trim() && !chorusMap.has(key)) {
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
    if (fromSceneIdx === targetSceneIdx) { setDragState(null); return }

    setEditingScenes(prev => {
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
        if (targetKey && targetKey.length > 5 && normalizeKey(sLyrics) === targetKey) {
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
        lyrics: '🎵 [Instrumental Breakdown]',
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
    const m = Math.floor(secs / 60)
    const s = (secs % 60).toFixed(1)
    return `${m}:${s.padStart(4, '0')}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} onClick={e => e.stopPropagation()}>
      {/* Header Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.75rem 1rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))',
        borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eye className="w-4 h-4" style={{ color: '#a78bfa' }} />
          <span style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 600 }}>
            Review & Edit Scene Plan
          </span>
          <span style={{
            fontSize: '0.7rem', padding: '2px 8px', borderRadius: '9999px',
            backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', fontWeight: 600,
          }}>
            {editingScenes.length} scenes
          </span>
        </div>
        <button
          onClick={handleConfirm}
          disabled={confirming || editingScenes.length === 0}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 600,
            fontSize: '0.875rem', border: 'none', cursor: confirming ? 'wait' : 'pointer',
            background: confirming
              ? 'rgba(100, 116, 139, 0.3)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            boxShadow: confirming ? 'none' : '0 4px 14px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {confirming ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {isGeneratingMissing ? 'Generating missing descriptions & saving...' : 'Submitting scenes...'}</>
          ) : (
            <><Check className="w-4 h-4" /> Confirm & Generate Images</>
          )}
        </button>
      </div>

      {/* Add Scene at the top */}
      <AddSceneButton onClick={() => addSceneAfter(-1)} />

      {/* Scene Blocks */}
      {editingScenes.map((scene, sceneIdx) => (
        <div key={scene._key}>
          <div
            onDragOver={(e) => handleDragOver(e, sceneIdx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, sceneIdx)}
            style={{
              backgroundColor: dropTarget === sceneIdx
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(30, 41, 59, 0.5)',
              border: dropTarget === sceneIdx
                ? '2px dashed rgba(129, 140, 248, 0.6)'
                : '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '12px',
              padding: '1rem',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Scene Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              {(() => {
                const currentLyrics = (scene.pills.map(p => p.text).join(' ') || scene.lyrics || '').trim()
                const currentKey = normalizeKey(currentLyrics)
                const isChorusRepeat = currentKey.length > 5 && editingScenes.some((s, idx) => {
                  if (idx === sceneIdx) return false
                  const otherLyrics = (s.pills.map(p => p.text).join(' ') || s.lyrics || '').trim()
                  return normalizeKey(otherLyrics) === currentKey
                })

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#818cf8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Scene {sceneIdx + 1}
                    </strong>
                    <span style={{
                      fontSize: '0.7rem', fontFamily: 'monospace',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#94a3b8',
                      padding: '2px 8px', borderRadius: '4px',
                    }}>
                      {formatTime(scene.startTime)} – {formatTime(scene.endTime)}
                    </span>
                    {isChorusRepeat && (
                      <span style={{
                        fontSize: '0.6875rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        🔁 Chorus Synced (Reuses Image)
                      </span>
                    )}
                  </div>
                )
              })()}
              <button
                onClick={() => deleteScene(sceneIdx)}
                disabled={scene.pills.length > 0}
                title={scene.pills.length > 0 ? 'Move all lyric pills out before deleting' : 'Delete empty scene'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem',
                  fontWeight: 600, border: 'none', cursor: scene.pills.length > 0 ? 'not-allowed' : 'pointer',
                  backgroundColor: scene.pills.length > 0
                    ? 'rgba(100, 116, 139, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: scene.pills.length > 0 ? '#475569' : '#f87171',
                  transition: 'all 0.15s',
                }}
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>

            {/* Lyric Pills Zone */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '6px',
              minHeight: '40px', padding: '0.5rem',
              backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px',
              border: '1px dashed rgba(99, 102, 241, 0.2)',
              marginBottom: '0.75rem',
            }}>
              {scene.pills.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.25rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#c084fc',
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    🎵 Instrumental / Visual-Only Scene
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    (No lyrics assigned — drag lyric pills here if needed)
                  </span>
                </div>
              )}
              {scene.pills.map(pill => (
                <LyricPill
                  key={pill._key}
                  pill={pill}
                  sceneIdx={sceneIdx}
                  isEditing={editingPillKey === pill._key}
                  editText={editingPillText}
                  onDragStart={handleDragStart}
                  onStartEdit={startEditPill}
                  onSaveEdit={saveEditPill}
                  onCancelEdit={cancelEditPill}
                  onChangeEditText={setEditingPillText}
                />
              ))}
            </div>

            {/* Visual Prompt Container */}
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem',
              borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)',
              height: 'fit-content',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{
                  fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: '#64748b', fontWeight: 700,
                }}>
                  Visual Prompt
                </span>
                <button
                  onClick={() => handleRegeneratePrompt(sceneIdx)}
                  disabled={regeneratingIdx === sceneIdx}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem',
                    fontWeight: 600, border: 'none',
                    cursor: regeneratingIdx === sceneIdx ? 'wait' : 'pointer',
                    backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc',
                    transition: 'all 0.15s',
                  }}
                >
                  {regeneratingIdx === sceneIdx ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Regenerating...</>
                  ) : (
                    <><Sparkles className="w-3 h-3" /> Regenerate</>
                  )}
                </button>
              </div>
              <textarea
                className="custom-scrollbar"
                value={scene.visualPrompt}
                onChange={(e) => updatePrompt(sceneIdx, e.target.value)}
                rows={3}
                style={{
                  width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc', fontSize: '0.8rem', lineHeight: 1.5,
                  padding: '0.5rem', borderRadius: '6px',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                  minHeight: 'auto',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  boxSizing: 'border-box',
                }}
                placeholder="Describe the visual scene for image generation..."
              />
            </div>
          </div>

          {/* Add Scene button & Instrumental Gap banner between scenes */}
          {(() => {
            const nextScene = editingScenes[sceneIdx + 1]
            const hasGap = nextScene && (nextScene.startTime - scene.endTime >= 0.5)
            const gapDuration = hasGap ? (nextScene.startTime - scene.endTime).toFixed(1) : 0

            return (
              <>
                {hasGap && (
                  <div style={{
                    margin: '0.5rem 0',
                    padding: '0.5rem 1rem',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px dashed rgba(168, 85, 247, 0.4)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 600 }}>
                      🎵 Instrumental Gap Detected: {formatTime(scene.endTime)} → {formatTime(nextScene.startTime)} ({gapDuration}s)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFillInstrumentalGap(sceneIdx, scene.endTime, nextScene.startTime)}
                      style={{
                        background: 'rgba(168, 85, 247, 0.2)',
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        color: '#e9d5ff',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus className="w-3 h-3" /> Fill Instrumental Gap
                    </button>
                  </div>
                )}
                <AddSceneButton onClick={() => addSceneAfter(sceneIdx)} />
              </>
            )
          })()}
        </div>
      ))}

      {/* ─── Bottom CTA Banner ─── */}
      <div style={{
        marginTop: '0.5rem', padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
        textAlign: 'center',
      }}>
        <div>
          <p style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
            Ready to generate images?
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
            Once confirmed, AI will generate cinematic frames for each scene. This cannot be undone.
          </p>
        </div>
        <button
          onClick={handleConfirm}
          disabled={confirming || editingScenes.length === 0}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 700,
            fontSize: '0.95rem', border: 'none',
            cursor: confirming ? 'wait' : 'pointer',
            background: confirming
              ? 'rgba(100, 116, 139, 0.3)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            boxShadow: confirming ? 'none' : '0 6px 20px rgba(99, 102, 241, 0.45)',
            transition: 'all 0.2s ease',
            letterSpacing: '0.01em',
          }}
        >
          {confirming ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {isGeneratingMissing ? 'Generating missing descriptions & saving...' : 'Submitting scenes...'}</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Approve Scenes & Start Image Generation</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Lyric Pill Atom ───
function LyricPill({ pill, sceneIdx, isEditing, editText, onDragStart, onStartEdit, onSaveEdit, onCancelEdit, onChangeEditText }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus()
  }, [isEditing])

  if (isEditing) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 6px', borderRadius: '6px',
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        border: '1px solid rgba(129, 140, 248, 0.5)',
      }}>
        <input
          ref={inputRef}
          value={editText}
          onChange={(e) => onChangeEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit()
            if (e.key === 'Escape') onCancelEdit()
          }}
          style={{
            backgroundColor: 'transparent', border: 'none', color: '#e2e8f0',
            fontSize: '0.75rem', outline: 'none', width: `${Math.max(editText.length * 7, 60)}px`,
            minWidth: '60px',
          }}
        />
        <button onClick={onSaveEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Check className="w-3 h-3" style={{ color: '#34d399' }} />
        </button>
        <button onClick={onCancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <X className="w-3 h-3" style={{ color: '#f87171' }} />
        </button>
      </span>
    )
  }

  return (
    <span
      draggable
      onDragStart={(e) => onDragStart(e, pill._key, sceneIdx)}
      onDoubleClick={() => onStartEdit(pill)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '4px 8px', borderRadius: '6px',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        color: '#cbd5e1', fontSize: '0.75rem',
        cursor: 'grab', userSelect: 'none',
        transition: 'all 0.15s',
      }}
      title="Drag to move • Double-click to edit"
    >
      <GripVertical className="w-3 h-3" style={{ color: '#475569', flexShrink: 0 }} />
      <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {pill.text}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onStartEdit(pill) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
      >
        <Pencil className="w-3 h-3" style={{ color: '#64748b' }} />
      </button>
    </span>
  )
}

// ─── Add Scene Button ───
function AddSceneButton({ onClick }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
      <button
        onClick={onClick}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '4px 12px', borderRadius: '9999px', fontSize: '0.7rem',
          fontWeight: 600, border: '1px dashed rgba(99, 102, 241, 0.3)',
          backgroundColor: 'transparent', color: '#64748b',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'
          e.currentTarget.style.color = '#818cf8'
          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#64748b'
          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'
        }}
      >
        <Plus className="w-3 h-3" /> Add Scene
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
      <CreatorPageShell breadcrumbs={['Generation Progress']} title="Generation Progress" description="Loading...">
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ margin: '0 auto', color: '#6366f1' }} />
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Fetching job details...</p>
        </div>
      </CreatorPageShell>
    )
  }

  if (error) {
    return (
      <CreatorPageShell breadcrumbs={['Generation Progress']} title="Generation Progress" description="Error loading job.">
        <section className="studio-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle className="w-12 h-12" style={{ margin: '0 auto', color: '#ef4444' }} />
          <h2 style={{ color: '#ef4444', marginTop: '1rem' }}>Unable to Load Job</h2>
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

  const status = jobData?.status || 'QUEUED'
  const sceneSegments = jobData?.song?.sceneSegments || []
  const isAwaitingReview = status === 'AWAITING_REVIEW'

  const renderStatusTag = (label, type = 'waiting') => {
    const styles = {
      completed: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', icon: <CheckCircle className="w-3 h-3" /> },
      processing: { bg: 'rgba(99, 102, 241, 0.1)', text: '#818cf8', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
      review: { bg: 'rgba(251, 191, 36, 0.1)', text: '#fbbf24', icon: <Pencil className="w-3 h-3" /> },
      waiting: { bg: 'rgba(100, 116, 139, 0.1)', text: '#94a3b8', icon: null },
      failed: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', icon: <AlertCircle className="w-3 h-3" /> },
    }
    const s = styles[type]
    return (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', 
        borderRadius: '9999px', backgroundColor: s.bg, color: s.text,
        marginLeft: '12px'
      }}>
        {s.icon}
        {label}
      </span>
    )
  }

  const getPhaseStatus = (phaseNum) => {
    const hasScenes = sceneSegments && sceneSegments.length > 0;
    const totalFrames = sceneSegments?.length || 0;
    const generatedFrames = sceneSegments?.filter(s => s.generatedFrames && s.generatedFrames.length > 0).length || 0;
    const framesDone = totalFrames > 0 && generatedFrames === totalFrames;

    if (phaseNum === 1) {
      if (status === 'FAILED') return renderStatusTag('Failed', 'failed');
      return renderStatusTag('Completed', 'completed');
    }
    if (phaseNum === 2) {
      if (isAwaitingReview) return renderStatusTag('Awaiting Review', 'review');
      if (hasScenes) return renderStatusTag('Completed', 'completed');
      if (status === 'FAILED') return renderStatusTag('Failed', 'failed');
      return renderStatusTag('Processing...', 'processing');
    }
    if (phaseNum === 3) {
      if (isAwaitingReview) return renderStatusTag('Waiting', 'waiting');
      if (framesDone) return renderStatusTag('Completed', 'completed');
      if (status === 'FAILED') return renderStatusTag('Failed', 'failed');
      if (hasScenes) return renderStatusTag(`${generatedFrames}/${totalFrames} Frames`, 'processing');
      return renderStatusTag('Waiting', 'waiting');
    }
    if (phaseNum === 4) {
      if (isAwaitingReview) return renderStatusTag('Waiting', 'waiting');
      if (status === 'COMPLETED') return renderStatusTag('Completed', 'completed');
      if (status === 'FAILED') return renderStatusTag('Failed', 'failed');
      if (framesDone) return renderStatusTag('Stitching...', 'processing');
      return renderStatusTag('Waiting', 'waiting');
    }
    if (phaseNum === 5) {
      if (isAwaitingReview) return renderStatusTag('Waiting', 'waiting');
      if (status === 'COMPLETED') return renderStatusTag('Completed', 'completed');
      if (status === 'FAILED') return renderStatusTag('Skipped', 'failed');
      if (framesDone) return renderStatusTag('Generating...', 'processing');
      return renderStatusTag('Waiting', 'waiting');
    }
    return null;
  }

  const handleScenesConfirmed = () => {
    // Smoothly transition: update local state to PROCESSING and restart the polling loop
    setJobData(prev => prev ? { ...prev, status: 'PROCESSING' } : prev)
    setPollTrigger(t => t + 1)
  }

  return (
    <CreatorPageShell
      breadcrumbs={['Generation Tasks', 'Progress']}
      description="Monitor the real-time compilation of your AI video."
      title="Generation Progress"
      actions={
        <button
          className="studio-button studio-button--secondary"
          onClick={() => navigate('/creator/generation')}
        >
          Back to Jobs
        </button>
      }
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-3xl font-bold text-white mb-1">{jobData?.song?.title || 'Unknown Project'}</h1>
        <p className="text-violet-400 font-medium text-lg">{jobData?.song?.artist || 'Unknown Artist'}</p>
      </div>

      {/* 1. Status Card */}
      <section style={{ 
        marginBottom: '1rem', 
        background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1.5rem 2rem', 
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>🎬</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Compilation Status</h2>
          </div>
          <GenerationStatusBadge status={status} errorMessage={jobData?.errorMessage} />
        </header>

        <div style={{ padding: '20px 30px' }}>
          {status === 'FAILED' && (
            <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '1rem' }}>
               {jobData?.errorMessage && (
                 <p style={{ color: '#f87171', fontSize: '0.875rem', fontFamily: 'monospace', marginBottom: '1rem' }}>{jobData.errorMessage}</p>
               )}
               <button
                 className="studio-button studio-button--primary"
                 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontWeight: 600 }}
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
               >
                 <RefreshCw className="w-4 h-4" />
                 Retry / Resume Generation
               </button>
            </div>
          )}

          {isAwaitingReview && (
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              borderRadius: '8px', marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <Pencil className="w-5 h-5" style={{ color: '#fbbf24', flexShrink: 0 }} />
              <div>
                <p style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
                  Scene plan is ready for your review
                </p>
                <p style={{ color: '#d4a017', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                  Expand Phase 2 below to review, edit, and confirm your scenes before image generation begins.
                </p>
              </div>
            </div>
          )}

          {status === 'COMPLETED' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ color: '#34d399', fontWeight: 500, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                ✨ Your cinematic video has been assembled successfully!
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link 
                  to={`/creator/editor/${jobData.id}`} 
                  className="studio-button studio-button--primary"
                  style={{ flex: '1 1 200px', textAlign: 'center', textDecoration: 'none', padding: '0.875rem 1.5rem', fontWeight: 600 }}
                >
                  Proceed to Video Editor
                </Link>
                <Link 
                  to={`/creator/curation/${jobData.songId}`} 
                  className="studio-button studio-button--secondary"
                  style={{ flex: '1 1 200px', textAlign: 'center', textDecoration: 'none', padding: '0.875rem 1.5rem', fontWeight: 600 }}
                >
                  Curate Song Details & Trivia
                </Link>
              </div>
            </div>
          ) : !isAwaitingReview ? (
            <p style={{ color: '#94a3b8' }}>Video is currently processing...</p>
          ) : null}
        </div>
      </section>

      {/* ─── Phases Group Container (12px gap) ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Phase 1 Accordion */}
        <section 
          className="studio-card studio-form-card" 
          style={{ cursor: 'pointer' }}
        >
          <header className="studio-card__header studio-card__header--spread" onClick={() => setIsPhase1Expanded(!isPhase1Expanded)}>
            <div className="studio-card__title" style={{ display: 'flex', alignItems: 'center' }}>
              <span aria-hidden="true">🎧</span>
              <h2>Phase 1: Audio & Lyric Extraction</h2>
              {getPhaseStatus(1)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{isPhase1Expanded ? 'Collapse' : 'Expand'}</span>
              {isPhase1Expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </header>

          {isPhase1Expanded && (
            <div style={{ padding: '20px 30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <div>
                  <h3 className="text-white font-bold text-lg">Audio & Lyric Extraction Complete</h3>
                  <p className="text-emerald-400 text-sm">Audio stream uploaded and timed lyric transcription segments successfully created.</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Phase 2 Accordion */}
        <section 
          className="studio-card studio-form-card"
          style={{
            ...(isAwaitingReview ? {
              border: '1px solid rgba(251, 191, 36, 0.3)',
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.08)',
            } : {})
          }}
        >
          <header className="studio-card__header studio-card__header--spread" style={{ cursor: 'pointer' }} onClick={() => setIsPhase2Expanded(!isPhase2Expanded)}>
            <div className="studio-card__title" style={{ display: 'flex', alignItems: 'center' }}>
              <span aria-hidden="true">📝</span>
              <h2>Phase 2: AI Scene Planning</h2>
              {getPhaseStatus(2)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{isPhase2Expanded ? 'Collapse' : 'Expand'}</span>
              {isPhase2Expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </header>

          {isPhase2Expanded && (
            <div style={{ padding: '20px 30px' }}>
              {/* ─── Scene Block Editor (AWAITING_REVIEW mode) ─── */}
              {isAwaitingReview && sceneSegments.length > 0 ? (
                <SceneBlockEditor
                  scenes={sceneSegments}
                  segments={jobData?.song?.transcriptionSegments}
                  songId={jobData?.songId || jobData?.song?.id}
                  jobId={jobData?.id}
                  token={token}
                  onConfirmed={handleScenesConfirmed}
                  onConfirming={() => { /* spinner state is managed internally */ }}
                />
              ) : sceneSegments && sceneSegments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sceneSegments.map((segment, idx) => (
                    <div key={segment.id} style={{ 
                      backgroundColor: 'rgba(30, 41, 59, 0.5)', 
                      border: '1px solid rgba(51, 65, 85, 0.5)', 
                      borderRadius: '12px', 
                      padding: '1rem' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#818cf8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Scene {idx + 1}
                        </strong>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontFamily: 'monospace', 
                          backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                          color: '#94a3b8', 
                          padding: '2px 8px', 
                          borderRadius: '4px' 
                        }}>
                          {segment.startTime}s - {segment.endTime}s
                        </span>
                      </div>

                      {segment.lyrics && (
                        <p style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.875rem', marginBottom: '0.75rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(99, 102, 241, 0.3)' }}>
                          "{segment.lyrics}"
                        </p>
                      )}

                      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                        <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.25rem', fontWeight: 700 }}>
                          Visual Prompt
                        </span>
                        <p style={{ color: '#f8fafc', fontSize: '0.875rem', lineHeight: 1.5 }}>
                          {segment.visualPrompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Waiting for AI Scene Generation...</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Phase 3 Accordion */}
        <section 
          className="studio-card studio-form-card"
          style={{ cursor: 'pointer' }}
        >
          <header className="studio-card__header studio-card__header--spread" onClick={() => setIsPhase3Expanded(!isPhase3Expanded)}>
            <div className="studio-card__title" style={{ display: 'flex', alignItems: 'center' }}>
              <span aria-hidden="true">🖼️</span>
              <h2>Phase 3: Image Generation</h2>
              {getPhaseStatus(3)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{isPhase3Expanded ? 'Collapse' : 'Expand'}</span>
              {isPhase3Expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </header>

          {isPhase3Expanded && (
            <div style={{ padding: '20px 30px' }}>
              {sceneSegments && sceneSegments.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  {sceneSegments.map((segment, idx) => {
                    const frames = segment.generatedFrames || [];
                    return (
                      <div key={`p3-${segment.id}`} style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(51, 65, 85, 0.5)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, letterSpacing: '0.05em' }}>
                            SCENE {idx + 1}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '2px 6px', borderRadius: '4px' }}>
                            {frames.length} Frame(s)
                          </span>
                        </div>
                        
                        {frames.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {frames.map(frame => (
                              <div key={frame.id} style={{
                                width: '100%',
                                aspectRatio: '16/9',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                backgroundColor: '#0f172a',
                                position: 'relative',
                                border: '1px solid rgba(139, 92, 246, 0.2)'
                              }}>
                                <img src={frame.imageUrl} alt={`Scene ${idx + 1} Frame`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px dashed rgba(99, 102, 241, 0.3)',
                            gap: '0.5rem'
                          }}>
                            {status === 'COMPLETED' || status === 'FAILED' ? (
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>No frames</span>
                            ) : (
                              <>
                                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Generating...</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Waiting for scenes before generating frames...</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Phase 4 Accordion */}
        <section 
          className="studio-card studio-form-card"
          style={{ cursor: 'pointer' }}
        >
          <header className="studio-card__header studio-card__header--spread" onClick={() => setIsPhase4Expanded(!isPhase4Expanded)}>
            <div className="studio-card__title" style={{ display: 'flex', alignItems: 'center' }}>
              <span aria-hidden="true">🎞️</span>
              <h2>Phase 4: Video Assembly</h2>
              {getPhaseStatus(4)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{isPhase4Expanded ? 'Collapse' : 'Expand'}</span>
              {isPhase4Expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </header>

          {isPhase4Expanded && (
            <div style={{ padding: '20px 30px' }}>
              {status === 'COMPLETED' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <div>
                    <h3 className="text-white font-bold text-lg">FFmpeg Assembly Complete</h3>
                    <p className="text-emerald-400 text-sm">Video has been successfully stitched and is ready.</p>
                  </div>
                </div>
              ) : status === 'FAILED' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <h3 className="text-white font-bold text-lg">Assembly Failed</h3>
                    <p className="text-red-400 text-sm">There was an error stitching the video.</p>
                  </div>
                </div>
              ) : (sceneSegments.length > 0 && sceneSegments.every(seg => seg.generatedFrames && seg.generatedFrames.length > 0)) ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', gap: '1rem' }}>
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Stitching MP4 with FFmpeg...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', gap: '1rem' }}>
                  <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Waiting for image generation to complete...</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Phase 5 Section */}
        <section 
          className="studio-card studio-form-card"
          style={{ cursor: 'pointer' }}
        >
          <header className="studio-card__header studio-card__header--spread" onClick={() => setIsPhase5Expanded(!isPhase5Expanded)}>
            <div className="studio-card__title" style={{ display: 'flex', alignItems: 'center' }}>
              <span aria-hidden="true"><Sparkles className="w-5 h-5" style={{ color: '#a78bfa', display: 'inline' }} /></span>
              <h2>Phase 5: Cultural Curation & Trivia</h2>
              {getPhaseStatus(5)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{isPhase5Expanded ? 'Collapse' : 'Expand'}</span>
              {isPhase5Expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </header>
          {isPhase5Expanded && (
            <div style={{ padding: '20px 30px' }}>
              {status === 'COMPLETED' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <div>
                    <h3 className="text-white font-bold text-lg">Curation Complete</h3>
                    <p className="text-emerald-400 text-sm">Cultural summary, trivia questions, and instrument matches have been generated.</p>
                  </div>
                </div>
              ) : status === 'FAILED' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                  <div>
                    <h3 className="text-white font-bold text-lg">Curation Skipped</h3>
                    <p className="text-amber-400 text-sm">Pipeline failed before curation could complete. Retry the generation to generate curation details.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', gap: '1rem' }}>
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Generating cultural summary, trivia, & instrument matches...</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </CreatorPageShell>
  )
}
