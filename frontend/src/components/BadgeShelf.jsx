import { Award } from 'lucide-react'

export default function BadgeShelf({ badges }) {
  const isLoading = badges === null
  const list = badges || []

  return (
    <div className="badge-shelf">
      <div className="badge-shelf-board">
        {isLoading ? (
          <p className="badge-shelf-placeholder">Loading…</p>
        ) : list.length === 0 ? (
          <p className="badge-shelf-placeholder">No badges yet. Go explore!</p>
        ) : (
          list.map((badge) => (
            <div className="badge-shelf-item" key={badge.id}>
              <span aria-hidden="true" className="badge-shelf-icon"><Award size={20} /></span>
              <span className="badge-shelf-name">{badge.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
