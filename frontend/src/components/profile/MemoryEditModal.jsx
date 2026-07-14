import { useEffect, useRef, useState } from 'react'

export default function MemoryEditModal({ memory, onClose, onSave, saving }) {
  const [content, setContent] = useState(memory.content)
  const textareaRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
    function onKeyDown(event) { if (event.key === 'Escape' && !saving) onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  return <div aria-labelledby="memory-edit-title" aria-modal="true" className="profile-modal" role="dialog" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <form onSubmit={(event) => { event.preventDefault(); onSave(content) }}>
      <h2 id="memory-edit-title">Edit memory</h2>
      <label><span>Reflection</span><textarea maxLength="2000" onChange={(event) => setContent(event.target.value)} ref={textareaRef} required rows="7" value={content} /></label>
      <div><button disabled={saving} onClick={onClose} type="button">Cancel</button><button className="profile-button" disabled={saving || !content.trim()} type="submit">{saving ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  </div>
}
