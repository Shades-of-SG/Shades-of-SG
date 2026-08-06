import { useState } from 'react'
import BadgeSticker from './badgeStickers'
import { formatProfileDate } from './profileUtils'

const STICKER_TILTS = [-6, 4, -3, 6, -4, 3, -5, 5]

function KeepsakeSticker({ badge, definition, index }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const earned = Boolean(badge)
  const description = (badge && badge.description) || definition.description
  const style = { '--tilt': `${STICKER_TILTS[index % STICKER_TILTS.length]}deg` }

  if (!earned) {
    return (
      <div aria-label={`${definition.name}: not yet collected`} className="keepsake-sticker keepsake-sticker--locked" style={style}>
        <div className="keepsake-sticker__face keepsake-sticker__face--locked">
          <BadgeSticker imageKey={definition.imageKey} />
          <span>{definition.name}</span>
        </div>
      </div>
    )
  }

  return (
    <button
      aria-label={`${definition.name}: ${description}`}
      aria-pressed={isFlipped}
      className="keepsake-sticker"
      onClick={() => setIsFlipped((current) => !current)}
      style={style}
      type="button"
    >
      <div className={`keepsake-sticker__inner ${isFlipped ? 'is-flipped' : ''}`}>
        <div className="keepsake-sticker__face keepsake-sticker__face--front">
          <BadgeSticker imageKey={definition.imageKey} />
          <span>{definition.name}</span>
        </div>
        <div className="keepsake-sticker__face keepsake-sticker__face--back">
          <p>{description}</p>
          <small>Earned {formatProfileDate(badge.earnedAt)}</small>
        </div>
      </div>
    </button>
  )
}

export default function KeepsakeJournal({ badges, definitions }) {
  const badgesByName = new Map(badges.map((badge) => [badge.name, badge]))
  const categories = []
  definitions.forEach((definition) => {
    if (!categories.includes(definition.category)) categories.push(definition.category)
  })

  return (
    <div className="keepsake-journal">
      <div className="keepsake-journal__page">
        {categories.map((category) => (
          <section className="keepsake-journal__section" key={category}>
            <p className="keepsake-journal__heading">{category}</p>
            <div className="keepsake-journal__stickers">
              {definitions
                .filter((definition) => definition.category === category)
                .map((definition, index) => (
                  <KeepsakeSticker badge={badgesByName.get(definition.name)} definition={definition} index={index} key={definition.name} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
