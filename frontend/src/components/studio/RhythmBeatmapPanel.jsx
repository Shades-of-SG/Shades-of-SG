import { Music4, Play, Sparkles, Trash2, Upload, VolumeX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteBeatmapDraft, generateAllBeatmaps, getBeatmapSummary, publishBeatmap, saveBeatmapSettings, unpublishBeatmap } from '../../services/beatmapService'

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD']
const EMPTY = DIFFICULTIES.map((difficulty) => ({ difficulty, bpm: null, draft: null, failed: null, generatedAt: null, generationSource: null, holdNoteCount: 0, noteCount: 0, offsetMs: 0, published: null, status: 'NOT_CREATED', version: 0 }))
const STATUS_LABELS = { DRAFT: 'Draft', FAILED: 'Failed', GENERATING: 'Generating', NOT_CREATED: 'Not created', PUBLISHED: 'Published' }

function formatDate(value) {
  if (!value) return 'Never'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function RhythmBeatmapPanel({ onBeforeGenerate, songId, songStatus = 'DRAFT', token }) {
  const [beatmaps, setBeatmaps] = useState(EMPTY)
  const [selectedDifficulty, setSelectedDifficulty] = useState('MEDIUM')
  const [offsets, setOffsets] = useState({})
  const [loading, setLoading] = useState(Boolean(songId))
  const [activeRequest, setActiveRequest] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refresh = useCallback(async (signal) => {
    if (!songId) { setBeatmaps(EMPTY); setLoading(false); return }
    const rows = await getBeatmapSummary(songId, { signal, token })
    const normalized = DIFFICULTIES.map((difficulty) => rows.find((row) => row.difficulty === difficulty) || EMPTY.find((row) => row.difficulty === difficulty))
    setBeatmaps(normalized)
    setOffsets((current) => Object.fromEntries(normalized.map((row) => [row.difficulty, current[row.difficulty] ?? row.draft?.offsetMs ?? 0])))
  }, [songId, token])

  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => {
      if (controller.signal.aborted) return undefined
      setLoading(Boolean(songId)); setError(''); return refresh(controller.signal)
    }).catch((nextError) => { if (nextError.name !== 'AbortError') setError(nextError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [refresh, songId])

  const selected = useMemo(() => beatmaps.find((row) => row.difficulty === selectedDifficulty) || EMPTY[1], [beatmaps, selectedDifficulty])
  const selectedMap = selected.draft || (selected.status === 'FAILED' ? selected.failed : selected.published) || selected.failed || selected
  const busy = Boolean(activeRequest)
  const draftOffset = offsets[selectedDifficulty] ?? selected.draft?.offsetMs ?? 0

  async function perform(label, action) {
    if (!songId || busy) return
    setActiveRequest(label); setError(''); setMessage('')
    try { await action(); await refresh(); setMessage('Beatmap status updated.') }
    catch (nextError) { setError(nextError.message); await refresh().catch(() => {}) }
    finally { setActiveRequest('') }
  }

  function saveOffset(offsetMs = draftOffset) {
    return perform(`${selectedDifficulty}:SETTINGS`, () => saveBeatmapSettings(songId, selectedDifficulty, offsetMs, token))
  }

  async function generateAll() {
    if (onBeforeGenerate) await onBeforeGenerate()
    return generateAllBeatmaps(songId, token, 'AI')
  }

  return (
    <section className="studio-card studio-beatmap-panel" aria-labelledby="rhythm-beatmap-title">
      <header className="studio-card__header studio-card__header--spread">
        <div className="studio-card__title"><Music4 aria-hidden="true" /><div><h2 id="rhythm-beatmap-title">Rhythm Game</h2><p>Create an optional interactive beatmap for this song.</p></div></div>
        <button className="studio-button studio-button--secondary" disabled={!songId || busy} onClick={() => perform('ALL', generateAll)} type="button"><Sparkles aria-hidden="true" /> {activeRequest === 'ALL' ? 'Generating all…' : 'Start Generating'}</button>
      </header>

      {!songId ? <p className="studio-beatmap-panel__notice">Save this song draft before creating its optional rhythm game.</p> : null}
      {!loading && songId && beatmaps.every((row) => row.status === 'NOT_CREATED') ? <p className="studio-beatmap-panel__notice">No rhythm game has been created for this song.</p> : null}
      {!loading && beatmaps.some((row) => row.published) && songStatus !== 'PUBLISHED' ? <p className="studio-beatmap-panel__notice">Published beatmaps remain private until this song is fully published.</p> : null}
      {loading ? <p role="status">Loading beatmap status…</p> : null}
      {error ? <div className="studio-beatmap-panel__error" role="alert"><strong>Beatmap action could not be completed.</strong><span>{error}</span></div> : null}
      {message ? <p className="studio-beatmap-panel__success" role="status">{message}</p> : null}

      <div className="studio-beatmap-difficulties" aria-label="Beatmap difficulty" role="tablist">
        {beatmaps.map((row) => {
          const status = activeRequest.startsWith(`${row.difficulty}:`) || activeRequest === 'ALL' ? 'GENERATING' : row.status
          return <button aria-selected={selectedDifficulty === row.difficulty} className={selectedDifficulty === row.difficulty ? 'is-selected' : ''} disabled={busy} key={row.difficulty} onClick={() => setSelectedDifficulty(row.difficulty)} role="tab" type="button"><strong>{row.difficulty[0]}{row.difficulty.slice(1).toLowerCase()}</strong><span className={`studio-beatmap-status is-${status.toLowerCase().replace('_', '-')}`}>{STATUS_LABELS[status]}</span>{row.published && (row.draft || row.failed) ? <small>Published version remains live</small> : null}</button>
        })}
      </div>

      {!loading && <div className="studio-beatmap-detail">
        <div><span>Status</span><strong>{STATUS_LABELS[selected.status]}</strong></div>
        <div><span>Notes</span><strong>{selectedMap.noteCount || 0}</strong></div>
        <div><span>Hold notes</span><strong>{selectedMap.holdNoteCount || 0}</strong></div>
        <div><span>BPM</span><strong>{selectedMap.bpm || '—'}</strong></div>
        <div><span>Source</span><strong>{selectedMap.generationSource || '—'}</strong></div>
        <div><span>Last generated</span><strong>{formatDate(selectedMap.generatedAt)}</strong></div>
      </div>}

      {selected.failed?.errorMessage ? <p className="studio-beatmap-panel__warning">{selected.failed.errorMessage}</p> : null}

      <fieldset className="studio-beatmap-offset" disabled={!selected.draft || busy}>
        <legend>Draft timing</legend>
        <p>Adjust timing if notes appear slightly early or late during preview.</p>
        <label><span>Timing offset</span><output>{draftOffset}ms</output><input aria-label="Draft timing offset" max="500" min="-500" onChange={(event) => setOffsets((current) => ({ ...current, [selectedDifficulty]: Number(event.target.value) }))} step="5" type="range" value={draftOffset} /></label>
        <div><button className="studio-button studio-button--ghost" onClick={() => setOffsets((current) => ({ ...current, [selectedDifficulty]: 0 }))} type="button"><VolumeX aria-hidden="true" /> Reset offset</button><button className="studio-button studio-button--secondary" disabled={draftOffset === selected.draft?.offsetMs} onClick={() => saveOffset()} type="button"><Upload aria-hidden="true" /> Save draft settings</button></div>
      </fieldset>

      <div className="studio-beatmap-actions">
        {(selected.draft || selected.published) ? <Link className="studio-button studio-button--ghost" to={`/game/${encodeURIComponent(songId)}?difficulty=${selectedDifficulty}&preview=1`}><Play aria-hidden="true" /> Preview</Link> : <button className="studio-button studio-button--ghost" disabled type="button"><Play aria-hidden="true" /> Preview</button>}
        {selected.draft ? <button className="studio-button studio-button--primary" disabled={busy} onClick={() => perform(`${selectedDifficulty}:PUBLISH`, () => publishBeatmap(songId, selectedDifficulty, token))} type="button">Publish beatmap</button> : null}
        {selected.published ? <button className="studio-button studio-button--secondary" disabled={busy} onClick={() => perform(`${selectedDifficulty}:UNPUBLISH`, () => unpublishBeatmap(songId, selectedDifficulty, token))} type="button">Unpublish beatmap</button> : null}
        {(selected.draft || selected.failed) ? <button className="studio-button studio-button--danger" disabled={busy} onClick={() => perform(`${selectedDifficulty}:DELETE`, () => deleteBeatmapDraft(songId, selectedDifficulty, token))} type="button"><Trash2 aria-hidden="true" /> Delete draft</button> : null}
      </div>
    </section>
  )
}
