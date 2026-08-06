import { useEffect, useState } from 'react'
import BadgeSticker from './profile/badgeStickers'
import { useAuth } from '../context/AuthContext'
import { getBadgeCatalog } from '../services/badgeService'

export default function BadgeShelf({ badges }) {
  const { token } = useAuth()
  const [imageKeyByName, setImageKeyByName] = useState({})
  const isLoading = badges === null
  const list = badges || []

  useEffect(() => {
    let active = true
    getBadgeCatalog(token)
      .then((definitions) => {
        if (!active) return
        setImageKeyByName(Object.fromEntries(definitions.map((definition) => [definition.name, definition.imageKey])))
      })
      .catch(() => {})
    return () => { active = false }
  }, [token])

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
              <span aria-hidden="true" className="badge-shelf-icon"><BadgeSticker imageKey={imageKeyByName[badge.name]} /></span>
              <span className="badge-shelf-name">{badge.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
