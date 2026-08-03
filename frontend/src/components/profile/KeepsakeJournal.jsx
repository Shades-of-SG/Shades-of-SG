import { useState } from 'react'
import { BADGE_CATEGORIES, BADGE_DEFINITIONS, badgePresentation } from './badgeDefinitions'
import { formatProfileDate } from './profileUtils'

const STICKER_TILTS = [-6, 4, -3, 6, -4, 3]

function KeepsakeSticker({ badge, index, name }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const meta = badgePresentation(name)
  const Icon = meta.icon
  const earned = Boolean(badge)

  if (!earned) {
    return (
      <div aria-label={`${name}: not yet collected`} className="keepsake-sticker keepsake-sticker--locked" style={{ '--tilt': `${STICKER_TILTS[index % STICKER_TILTS.length]}deg` }}>
        <div className="keepsake-sticker__face keepsake-sticker__face--locked">
          <Icon aria-hidden="true" />
          <span>{name}</span>
        </div>
      </div>
    )
  }

  const description = badge.description || meta.description
  return (
    <button
      aria-label={`${name}: ${description}`}
      aria-pressed={isFlipped}
      className="keepsake-sticker"
      onClick={() => setIsFlipped((current) => !current)}
      style={{ '--tilt': `${STICKER_TILTS[index % STICKER_TILTS.length]}deg` }}
      type="button"
    >
      <div className={`keepsake-sticker__inner ${isFlipped ? 'is-flipped' : ''}`}>
        <div className="keepsake-sticker__face keepsake-sticker__face--front">
          <Icon aria-hidden="true" />
          <span>{meta.landmark}</span>
        </div>
        <div className="keepsake-sticker__face keepsake-sticker__face--back">
          <strong>{name}</strong>
          <p>{description}</p>
          <small>{formatProfileDate(badge.earnedAt)}</small>
        </div>
      </div>
    </button>
  )
}

export default function KeepsakeJournal({ badges }) {
  const [pageIndex, setPageIndex] = useState(0)
  const category = BADGE_CATEGORIES[pageIndex]
  const badgesByName = new Map(badges.map((badge) => [badge.name, badge]))
  const namesInCategory = Object.keys(BADGE_DEFINITIONS).filter((name) => BADGE_DEFINITIONS[name].category === category)

  return (
    <div className="keepsake-journal">
      <div className="keepsake-journal__page" key={pageIndex}>
        <p className="keepsake-journal__heading">{category}</p>
        <div className="keepsake-journal__stickers">
          {namesInCategory.map((name, index) => (
            <KeepsakeSticker badge={badgesByName.get(name)} index={index} key={name} name={name} />
          ))}
        </div>
      </div>
      <div className="keepsake-journal__nav">
        <button
          aria-label="Previous page"
          disabled={pageIndex === 0}
          onClick={() => setPageIndex((current) => current - 1)}
          type="button"
        >‹</button>
        <span>Page {pageIndex + 1} of {BADGE_CATEGORIES.length}</span>
        <button
          aria-label="Next page"
          disabled={pageIndex === BADGE_CATEGORIES.length - 1}
          onClick={() => setPageIndex((current) => current + 1)}
          type="button"
        >›</button>
      </div>
    </div>
  )
}
