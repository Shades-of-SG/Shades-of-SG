import { Heart, MessageCircle, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createReflectionComment, deleteReflectionComment, getReflectionComments,
  likeReflection, unlikeReflection,
} from '../services/reflectionService'
import { MAX_COMMENT_LENGTH, validateCommentContent } from '../utils/commentValidation'

const formatter = new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'short' })

function Avatar({ author, anonymous = false }) {
  const name = anonymous ? 'Anonymous' : author?.displayName || 'Community member'
  if (author?.avatarUrl) return <img alt={`${name}'s profile`} className="rw-discussion-avatar" src={author.avatarUrl} />
  return <span aria-hidden="true" className="rw-discussion-avatar rw-discussion-avatar--fallback">{name.charAt(0).toUpperCase()}</span>
}

function Author({ author, anonymous = false }) {
  if (anonymous || !author) return <span className="rw-discussion-author"><Avatar anonymous /><strong>Anonymous</strong></span>
  return (
    <Link className="rw-discussion-author" to={`/users/${author.id}`}>
      <Avatar author={author} /><strong>{author.displayName}</strong>
    </Link>
  )
}

export default function ReflectionDiscussionModal({ reflection, onClose, onLogin, onReflectionChange, token, user }) {
  const dialogRef = useRef(null)
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    getReflectionComments(reflection.id, token)
      .then((items) => { if (active) setComments(items) })
      .catch((nextError) => { if (active) setError(nextError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reflection.id, token])

  useEffect(() => {
    const previousFocus = document.activeElement
    const dialog = dialogRef.current
    window.requestAnimationFrame(() => dialog?.querySelector('[data-autofocus]')?.focus())
    function handleKeyDown(event) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) { event.preventDefault(); dialog.focus(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); previousFocus?.focus?.() }
  }, [onClose])

  async function toggleLike() {
    if (!token || !user) { onLogin(); return }
    setLikeBusy(true); setError('')
    try {
      const result = reflection.isLiked
        ? await unlikeReflection(reflection.id, token)
        : await likeReflection(reflection.id, token)
      onReflectionChange({ ...reflection, isLiked: result.liked, likeCount: result.likeCount })
    } catch (nextError) { setError(nextError.message) }
    finally { setLikeBusy(false) }
  }

  async function submitComment(event) {
    event.preventDefault()
    if (!token || !user) { onLogin(); return }
    const parsed = validateCommentContent(comment)
    if (parsed.error) { setError(parsed.error); return }
    setSubmitting(true); setError(''); setSuccess('')
    try {
      const result = await createReflectionComment(reflection.id, parsed.content, token)
      setComments((items) => [...items, result.comment])
      setComment('')
      setSuccess('Comment posted.')
      onReflectionChange({ ...reflection, commentCount: result.commentCount })
    } catch (nextError) { setError(nextError.message) }
    finally { setSubmitting(false) }
  }

  async function removeComment(item) {
    setError(''); setSuccess('')
    try {
      await deleteReflectionComment(reflection.id, item.id, token)
      setComments((items) => items.filter((entry) => entry.id !== item.id))
      const commentCount = Math.max(0, reflection.commentCount - 1)
      onReflectionChange({ ...reflection, commentCount })
      setSuccess('Comment removed.')
    } catch (nextError) { setError(nextError.message) }
  }

  const remaining = MAX_COMMENT_LENGTH - [...comment].length

  return (
    <div className="rw-modal-backdrop rw-discussion-backdrop" onMouseDown={onClose} role="presentation">
      <section aria-labelledby="rw-discussion-title" aria-modal="true" className="rw-discussion" onMouseDown={(event) => event.stopPropagation()} ref={dialogRef} role="dialog" tabIndex="-1">
        <header className="rw-discussion__header">
          <div><p>Reflection Wall</p><h2 id="rw-discussion-title">Discussion</h2></div>
          <button aria-label="Close discussion" data-autofocus onClick={onClose} type="button"><X aria-hidden="true" /></button>
        </header>

        <div className="rw-discussion__scroll">
          <article className="rw-discussion__reflection">
            <div className="rw-discussion__meta">
              <Author anonymous={reflection.isAnonymous} author={reflection.author} />
              <time dateTime={reflection.createdAt}>{formatter.format(new Date(reflection.createdAt))}</time>
            </div>
            <p>{reflection.content}</p>
            <div className="rw-discussion__actions">
              <button aria-pressed={reflection.isLiked} className={reflection.isLiked ? 'is-liked' : ''} disabled={likeBusy} onClick={toggleLike} type="button">
                <Heart aria-hidden="true" fill={reflection.isLiked ? 'currentColor' : 'none'} /> {reflection.isLiked ? 'Liked' : 'Like'} <span>{reflection.likeCount}</span>
              </button>
              <span><MessageCircle aria-hidden="true" /> {reflection.commentCount} {reflection.commentCount === 1 ? 'comment' : 'comments'}</span>
            </div>
          </article>

          <section aria-labelledby="rw-comments-title" className="rw-comments">
            <h3 id="rw-comments-title">Comments</h3>
            {error ? <div className="rw-comment-message is-error" role="alert">{error}</div> : null}
            {success ? <div className="rw-comment-message is-success" role="status">{success}</div> : null}
            {loading ? <p className="rw-comments-state" role="status">Loading comments…</p> : null}
            {!loading && comments.length === 0 ? <p className="rw-comments-state">No comments yet. Start the conversation.</p> : null}
            {!loading && comments.length > 0 ? (
              <ol className="rw-comment-list">
                {comments.map((item) => (
                  <li key={item.id}>
                    <div className="rw-comment-heading">
                      <Author author={item.author} />
                      <time dateTime={item.createdAt}>{formatter.format(new Date(item.createdAt))}</time>
                      {item.canDelete ? <button aria-label={`Delete comment by ${item.author?.displayName || 'community member'}`} onClick={() => removeComment(item)} type="button"><Trash2 aria-hidden="true" /></button> : null}
                    </div>
                    <p>{item.content}</p>
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        </div>

        <footer className="rw-discussion__composer">
          {token && user ? (
            <form onSubmit={submitComment}>
              <label htmlFor="rw-comment">Add a comment</label>
              <textarea id="rw-comment" maxLength={MAX_COMMENT_LENGTH} onChange={(event) => { setComment(event.target.value); setError(''); setSuccess('') }} placeholder="Add to the conversation…" rows="3" value={comment} />
              <div><output aria-live="polite">{remaining} characters remaining</output><button className="rw-primary-button" disabled={submitting || !comment.trim()} type="submit">{submitting ? 'Posting…' : 'Post comment'}</button></div>
            </form>
          ) : (
            <div className="rw-discussion__login"><span>Log in to like or join the discussion.</span><button className="rw-primary-button" onClick={onLogin} type="button">Log in</button></div>
          )}
        </footer>
      </section>
    </div>
  )
}
