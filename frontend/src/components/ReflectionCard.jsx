import { useEffect, useRef, useState } from 'react'

const formatter = new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'short' })
const noteColors = ['lavender', 'rose', 'sage', 'teal', 'mustard', 'periwinkle', 'terracotta']
const pinColors = ['purple', 'red', 'gold']
const decorations = ['pin', 'tape', 'clip']
const doodles = ['music', 'heart', 'star', 'flower', 'none']

function noteStyle(id = '') {
  const hash = [...id].reduce((total, character) => total + character.charCodeAt(0), 0)
  return {
    color: noteColors[hash % noteColors.length],
    decoration: decorations[hash % decorations.length],
    doodle: doodles[hash % doodles.length],
    pin: pinColors[hash % pinColors.length],
    rotation: `${((hash % 7) - 3) * 0.7}deg`,
  }
}

export default function ReflectionCard({ reflection, onEdit, onDelete }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const style = noteStyle(reflection.id)

  useEffect(() => {
    if (!isMenuOpen) return undefined
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [isMenuOpen])

  return (
    <article className={`rw-card rw-note-${style.color}${reflection.isPending ? ' is-pending' : ''}`} style={{ '--note-rotation': style.rotation }}>
      {style.decoration === 'pin' && <span aria-hidden="true" className={`rw-pin rw-pin-${style.pin}`} />}
      {style.decoration === 'tape' && <span aria-hidden="true" className="rw-note-tape" />}
      {style.decoration === 'clip' && <span aria-hidden="true" className="rw-note-clip" />}
      <div className="rw-card-topline">
        <span className="rw-song-chip"><span aria-hidden="true">&#9835;</span> {reflection.song?.title || 'Song'}</span>
        {reflection.isOwner && !reflection.isPending && (
          <div className="rw-card-menu" ref={menuRef}>
            <button aria-expanded={isMenuOpen} aria-label="Reflection actions" onClick={() => setIsMenuOpen((value) => !value)} type="button">&#8942;</button>
            {isMenuOpen && (
              <div role="menu">
                <button onClick={() => { setIsMenuOpen(false); onEdit(reflection) }} role="menuitem" type="button">Edit</button>
                <button className="danger" onClick={() => { setIsMenuOpen(false); onDelete(reflection) }} role="menuitem" type="button">Delete</button>
              </div>
            )}
          </div>
        )}
      </div>
      <span className="rw-memory-label">A memory pinned to the wall</span>
      <p className="rw-card-content">{reflection.content}</p>
      {style.doodle !== 'none' && <span aria-hidden="true" className={`rw-note-doodle rw-doodle-${style.doodle}`} />}
      <div className="rw-card-footer">
        <div>
          <strong>&mdash; {reflection.displayName}</strong>
          {reflection.isAnonymous && <span className="rw-anonymous-badge">Anonymous</span>}
        </div>
        <time dateTime={reflection.createdAt}>{reflection.isPending ? 'Saving...' : formatter.format(new Date(reflection.createdAt))}</time>
      </div>
    </article>
  )
}
