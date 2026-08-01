import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import ProfileEmptyState from './ProfileEmptyState'
import ProfileSectionHeader from './ProfileSectionHeader'
import { formatProfileDate } from './profileUtils'

export default function ProfileMemories({
  error,
  loading,
  memories,
  onDelete,
  onEdit,
  onRetry,
  subtitle = 'Reflections I have shared',
  title = 'My Memories',
}) {
  const carouselRef = useRef(null)

  function scrollMemories(direction) {
    const container = carouselRef.current
    if (!container) return

    const card = container.querySelector('.profile-note')
    const cardWidth = card?.getBoundingClientRect().width || 320
    const gap = 24

    container.scrollBy({
      behavior: 'smooth',
      left: direction === 'next'
        ? cardWidth + gap
        : -(cardWidth + gap),
    })
  }

  const carouselActions = memories.length > 4 ? (
    <div className="profile-memory-controls">
      <button
        aria-label="View previous memories"
        onClick={() => scrollMemories('previous')}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>

      <button
        aria-label="View next memories"
        onClick={() => scrollMemories('next')}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </div>
  ) : null

  return (
    <section className="profile-section">
      <ProfileSectionHeader
        action={carouselActions}
        subtitle={subtitle}
        title={title}
      />

      {loading ? (
        <div className="profile-note-grid">
          {[1, 2, 3, 4].map((value) => (
            <span
              className="profile-skeleton profile-skeleton--card"
              key={value}
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="profile-error" role="alert">
          <p>{error}</p>
          <button onClick={onRetry} type="button">
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && !memories.length ? (
        <ProfileEmptyState
          actionLabel="Explore songs"
          description="Experience a published song, then share the memory it brings back."
          title="No memories shared yet"
          to="/songs"
        />
      ) : null}

      {!loading && !error && memories.length ? (
        <div
          className="profile-note-carousel"
          ref={carouselRef}
        >
          {memories.map((memory) => (
            <article className="profile-note" key={memory.id}>
              <span
                aria-hidden="true"
                className="profile-note__pin"
              />

              <p>{memory.content}</p>

              <div className="profile-note__meta">
                <span>{memory.song?.title || 'Song unavailable'}</span>
                <span>{formatProfileDate(memory.createdAt)}</span>
              </div>

              {memory.isAnonymous || memory.displayMode === 'ANONYMOUS' ? (
                <small>Posted anonymously</small>
              ) : null}

              {memory.tags?.length ? (
                <div className="profile-note__tags">
                  {memory.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              ) : null}

              {memory.isOwner && onEdit && onDelete ? (
                <div className="profile-note__actions">
                  <button
                    aria-label="Edit memory"
                    onClick={() => onEdit(memory)}
                    type="button"
                  >
                    <Pencil aria-hidden="true" size={15} />
                  </button>

                  <button
                    aria-label="Delete memory"
                    onClick={() => onDelete(memory)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}