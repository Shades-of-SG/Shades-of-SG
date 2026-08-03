import { useEffect, useRef, useState } from 'react'
import { Heart, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

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

export default function ReflectionCard({ reflection, onEdit, onDelete, onOpen }) {
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
    <article className={`rw-card reflection-card rw-note-${style.color}${reflection.isPending ? ' is-pending' : ''}`} style={{ '--note-rotation': style.rotation }}>
      {!reflection.isPending ? <button aria-label={`View discussion for reflection by ${reflection.displayName}`} className="rw-card-open" onClick={() => onOpen(reflection)} type="button" /> : null}
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
        <div className="rw-card-author-wrap">
          {reflection.isAnonymous || !reflection.author ? (
            <span className="rw-card-author"><span aria-hidden="true" className="rw-card-avatar">A</span><strong>{reflection.displayName}</strong></span>
          ) : (
            <Link className="rw-card-author" to={`/users/${reflection.author.id}`}>
              {reflection.author.avatarUrl ? <img alt={`${reflection.author.displayName}'s profile`} className="rw-card-avatar" src={reflection.author.avatarUrl} /> : <span aria-hidden="true" className="rw-card-avatar">{reflection.author.displayName.charAt(0).toUpperCase()}</span>}
              <strong>{reflection.author.displayName}</strong>
            </Link>
          )}
          {reflection.isAnonymous && <span className="rw-anonymous-badge">Anonymous</span>}
        </div>
        <time dateTime={reflection.createdAt}>{reflection.isPending ? 'Saving...' : formatter.format(new Date(reflection.createdAt))}</time>
      </div>
      {!reflection.isPending ? (
        <div className="rw-card-discussion-summary">
          <span className={reflection.isLiked ? 'is-liked' : ''}><Heart aria-hidden="true" fill={reflection.isLiked ? 'currentColor' : 'none'} /> {reflection.likeCount}</span>
          <span><MessageCircle aria-hidden="true" /> {reflection.commentCount}</span>
          <button onClick={() => onOpen(reflection)} type="button">View discussion</button>
        </div>
      ) : null}
    </article>
  )
}
