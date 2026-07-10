import { useEffect, useState } from 'react'

export default function ReflectionModal({ draft, reflection, songs, onClose, onDraftChange, onSave }) {
  const [content, setContent] = useState(reflection?.content || draft?.content || '')
  const [isAnonymous, setIsAnonymous] = useState(reflection?.isAnonymous ?? draft?.isAnonymous ?? false)
  const [songId, setSongId] = useState(reflection?.songId || draft?.songId || songs[0]?.id || '')

  useEffect(() => {
    const close = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [onClose])

  useEffect(() => {
    if (!songId && songs[0]?.id) setSongId(songs[0].id)
  }, [songId, songs])

  useEffect(() => {
    if (!reflection) onDraftChange?.({ content, isAnonymous, songId })
  }, [content, isAnonymous, onDraftChange, reflection, songId])

  function submit(event) {
    event.preventDefault()
    onSave({ content: content.trim(), isAnonymous, songId })
  }

  return (
    <div className="rw-modal-backdrop" onMouseDown={onClose} role="presentation">
      <form aria-labelledby="rw-modal-title" className="rw-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit} role="dialog">
        <div className="rw-modal-header">
          <div><p>Community Memory Wall</p><h2 id="rw-modal-title">{reflection ? 'Edit reflection' : 'Add reflection'}</h2></div>
          <button aria-label="Close" onClick={onClose} type="button">×</button>
        </div>
        <label><span>Song</span><select onChange={(event) => setSongId(event.target.value)} required value={songId}><option disabled value="">Choose a song</option>{songs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}</select></label>
        <label><span>Reflection</span><textarea autoFocus maxLength="1000" onChange={(event) => setContent(event.target.value)} placeholder="Share the memory, feeling, or story this song brings back..." required rows="8" value={content} /><small>{content.length}/1000</small></label>
        <label className="rw-toggle"><input checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} type="checkbox" /><span>Post anonymously</span></label>
        <div className="rw-modal-actions"><button onClick={onClose} type="button">Cancel</button><button className="rw-primary-button" disabled={!content.trim() || !songId} type="submit">{reflection ? 'Save changes' : 'Post reflection'}</button></div>
      </form>
    </div>
  )
}
