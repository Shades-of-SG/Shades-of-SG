import { useRef } from 'react'

export default function Carousel({ items, renderItem, ariaLabel }) {
  const trackRef = useRef(null)
  const itemRefs = useRef([])
  const displayItems = items.slice(0, 5)
  const count = displayItems.length

  function getStep() {
    const track = trackRef.current
    const first = itemRefs.current[0]
    const second = itemRefs.current[1]
    if (first && second) {
      return second.getBoundingClientRect().left - first.getBoundingClientRect().left
    }
    return track?.clientWidth || 0
  }

  function handleNext() {
    const track = trackRef.current
    if (!track) return
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1
    if (atEnd) {
      track.scrollTo({ left: 0, behavior: 'smooth' })
      return
    }
    track.scrollBy({ left: getStep(), behavior: 'smooth' })
  }

  function handlePrev() {
    const track = trackRef.current
    if (!track) return
    const atStart = track.scrollLeft <= 1
    if (atStart) {
      track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' })
      return
    }
    track.scrollBy({ left: -getStep(), behavior: 'smooth' })
  }

  if (count === 0) return null

  return (
    <div aria-label={ariaLabel} className="carousel" role="group">
      <button
        aria-label="Previous"
        className="carousel-btn carousel-btn--prev"
        onClick={handlePrev}
        type="button"
      >
        ‹
      </button>
      <div className="carousel-track" ref={trackRef}>
        {displayItems.map((item, itemIndex) => (
          <div
            className="carousel-item"
            key={item.id ?? itemIndex}
            ref={(el) => { itemRefs.current[itemIndex] = el }}
          >
            {renderItem(item, itemIndex)}
          </div>
        ))}
      </div>
      <button
        aria-label="Next"
        className="carousel-btn carousel-btn--next"
        onClick={handleNext}
        type="button"
      >
        ›
      </button>
    </div>
  )
}
