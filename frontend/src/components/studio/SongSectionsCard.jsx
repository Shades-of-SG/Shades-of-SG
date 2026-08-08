import { useState } from 'react'
import { recommendSongSections, saveSongSections } from '../../services/songService'

const SECTION_TYPES = [
  'intro', 'verse', 'pre_chorus', 'chorus', 'post_chorus', 'bridge',
  'instrumental', 'interlude', 'breakdown', 'solo', 'outro', 'other',
]

function displayType(value) {
  return value.split('_').map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(' ')
}

export default function SongSectionsCard({ onSaved, song, songId, token, transcriptionSegments }) {
  const [sections, setSections] = useState(song?.sectionRecommendations || [])
  const [confirmedAt, setConfirmedAt] = useState(song?.sectionRecommendationsConfirmedAt || null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ tone: '', text: '' })

  function updateSection(index, field, value) {
    setSections((current) => current.map((section, itemIndex) => itemIndex === index
      ? { ...section, [field]: ['startTime', 'endTime', 'confidence'].includes(field) ? Number(value) : value }
      : section))
  }

  function removeSection(index) {
    setSections((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setConfirmedAt(null)
  }

  function addSection() {
    const previousEnd = Number(sections.at(-1)?.endTime || 0)
    const duration = Number(song?.durationSecs || previousEnd + 10)
    if (previousEnd >= duration) {
      setMessage({ tone: 'error', text: 'The existing sections already reach the end of the song.' })
      return
    }
    const endTime = Math.min(duration, previousEnd + 10)
    setSections((current) => [...current, {
      type: 'other', label: `Other ${current.length + 1}`, startTime: previousEnd,
      endTime, lyrics: '', confidence: 0.5,
      reason: 'Creator-added section.',
    }])
    setConfirmedAt(null)
  }

  async function generateRecommendations() {
    if (!songId) return
    const replacingConfirmed = Boolean(confirmedAt)
    if (replacingConfirmed && !window.confirm('Replace your confirmed song sections with new AI recommendations?')) return
    setBusy(true)
    setMessage({ tone: '', text: '' })
    try {
      const result = await recommendSongSections(songId, token, { replaceConfirmed: replacingConfirmed })
      setSections(result.sections)
      setConfirmedAt(result.confirmedAt)
      setMessage({ tone: 'success', text: 'Recommendations ready. Review and edit them before confirming.' })
      onSaved?.({ lyrics: result.lyrics, sectionRecommendations: result.sections, sectionRecommendationsConfirmedAt: result.confirmedAt })
    } catch (error) {
      setMessage({ tone: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  async function confirmSections() {
    setBusy(true)
    setMessage({ tone: '', text: '' })
    try {
      const result = await saveSongSections(songId, sections, token)
      setSections(result.sections)
      setConfirmedAt(result.confirmedAt)
      setMessage({ tone: 'success', text: 'Song sections saved and confirmed.' })
      onSaved?.({ lyrics: result.lyrics, sectionRecommendations: result.sections, sectionRecommendationsConfirmedAt: result.confirmedAt })
    } catch (error) {
      setMessage({ tone: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  const canRecommend = Boolean(songId && transcriptionSegments?.length)

  return (
    <section className="studio-card studio-song-sections" aria-labelledby="song-sections-title">
      <header className="studio-card__header studio-card__header--spread">
        <div className="studio-card__title">
          <div>
            <h2 id="song-sections-title">Song Sections</h2>
            <p>Editable DeepSeek recommendations based only on Whisper timestamps.</p>
          </div>
        </div>
        <button className="studio-button studio-button--secondary" disabled={!canRecommend || busy} onClick={generateRecommendations} type="button">
          {busy ? 'Working…' : sections.length ? 'Regenerate' : 'Recommend Sections'}
        </button>
      </header>

      {!songId ? <p className="studio-song-sections__notice">Save the song draft before requesting section recommendations.</p> : null}
      {songId && !transcriptionSegments?.length ? <p className="studio-song-sections__notice">Extract timestamped lyrics first.</p> : null}
      {confirmedAt ? <p className="studio-song-sections__confirmed">Creator-confirmed {new Date(confirmedAt).toLocaleString()}.</p> : null}
      {message.text ? <p className={`studio-song-sections__message is-${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'}>{message.text}</p> : null}

      <div className="studio-song-sections__list">
        {sections.map((section, index) => (
          <fieldset disabled={busy} key={`${section.startTime}-${index}`}>
            <legend>{section.label || `Section ${index + 1}`}</legend>
            <label><span>Type</span><select onChange={(event) => updateSection(index, 'type', event.target.value)} value={section.type}>{SECTION_TYPES.map((type) => <option key={type} value={type}>{displayType(type)}</option>)}</select></label>
            <label><span>Label</span><input onChange={(event) => updateSection(index, 'label', event.target.value)} value={section.label} /></label>
            <div className="studio-song-sections__times">
              <label><span>Start (seconds)</span><input min="0" onChange={(event) => updateSection(index, 'startTime', event.target.value)} step="0.01" type="number" value={section.startTime} /></label>
              <label><span>End (seconds)</span><input min="0" onChange={(event) => updateSection(index, 'endTime', event.target.value)} step="0.01" type="number" value={section.endTime} /></label>
            </div>
            <label><span>Lyrics</span><textarea onChange={(event) => updateSection(index, 'lyrics', event.target.value)} rows="3" value={section.lyrics || ''} /></label>
            <label><span>Reason</span><input onChange={(event) => updateSection(index, 'reason', event.target.value)} value={section.reason || ''} /></label>
            <small>AI confidence: {Math.round(Number(section.confidence || 0) * 100)}%</small>
            <button className="studio-button studio-button--danger" onClick={() => removeSection(index)} type="button">Remove</button>
          </fieldset>
        ))}
      </div>

      {sections.length ? <div className="studio-song-sections__actions"><button className="studio-button studio-button--secondary" disabled={busy} onClick={addSection} type="button">Add Section</button><button className="studio-button studio-button--primary" disabled={busy} onClick={confirmSections} type="button">Save &amp; Confirm</button></div> : null}
    </section>
  )
}
