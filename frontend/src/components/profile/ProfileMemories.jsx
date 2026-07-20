import { Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProfileEmptyState from './ProfileEmptyState'
import ProfileSectionHeader from './ProfileSectionHeader'
import { formatProfileDate } from './profileUtils'

export default function ProfileMemories({ error, loading, memories, onDelete, onEdit, onRetry }) {
  return (
    <section className="profile-section">
      <ProfileSectionHeader action={memories.length > 4 ? <Link to="/reflections">View all →</Link> : null} subtitle="Reflections I’ve shared" title="My Memories" />
      {loading ? <div className="profile-note-grid">{[1, 2, 3, 4].map((value) => <span className="profile-skeleton profile-skeleton--card" key={value} />)}</div> : null}
      {error ? <div className="profile-error" role="alert"><p>{error}</p><button onClick={onRetry} type="button">Retry</button></div> : null}
      {!loading && !error && !memories.length ? <ProfileEmptyState actionLabel="Explore songs" description="Experience a published song, then share the memory it brings back." title="No memories shared yet" to="/songs" /> : null}
      {!loading && !error && memories.length ? (
        <div className="profile-note-grid">
          {memories.slice(0, 4).map((memory) => (
            <article className="profile-note" key={memory.id}>
              <span aria-hidden="true" className="profile-note__pin" />
              <p>{memory.content}</p>
              <div className="profile-note__meta"><span>{memory.song?.title || 'Song unavailable'}</span><span>{formatProfileDate(memory.createdAt)}</span></div>
              {memory.isAnonymous || memory.displayMode === 'ANONYMOUS' ? <small>Posted anonymously</small> : null}
              {memory.tags?.length ? <div className="profile-note__tags">{memory.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div> : null}
              {memory.isOwner ? <div className="profile-note__actions"><button aria-label="Edit memory" onClick={() => onEdit(memory)} type="button"><Pencil aria-hidden="true" size={15} /></button><button aria-label="Delete memory" onClick={() => onDelete(memory)} type="button"><Trash2 aria-hidden="true" size={15} /></button></div> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
