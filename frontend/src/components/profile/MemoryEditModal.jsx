import { useEffect, useRef, useState } from 'react'

export default function MemoryEditModal({ error, memory, onClose, onSave, saving }) {
  const [content, setContent] = useState(memory.content)
  const formRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose()
      if (event.key !== 'Tab') return
      const focusable = [...(formRef.current?.querySelectorAll('button:not([disabled]), textarea:not([disabled])') || [])]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  return <div aria-labelledby="memory-edit-title" aria-modal="true" className="profile-modal" role="dialog" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <form onSubmit={(event) => { event.preventDefault(); onSave(content) }} ref={formRef}>
      <h2 id="memory-edit-title">Edit memory</h2>
      <label><span>Reflection</span><textarea maxLength="2000" onChange={(event) => setContent(event.target.value)} ref={textareaRef} required rows="7" value={content} /></label>
      {error ? <p className="profile-modal__error" role="alert">{error}</p> : null}
      <div><button disabled={saving} onClick={onClose} type="button">Cancel</button><button className="profile-button" disabled={saving || !content.trim()} type="submit">{saving ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  </div>
}
