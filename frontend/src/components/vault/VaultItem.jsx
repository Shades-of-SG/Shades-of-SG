import { useState } from 'react'

function PhotoItem({ item }) {
  return (
    <figure className="vault-item vault-item--photo">
      <div className="vault-photo" aria-hidden="true">
        <span>{item.icon || '\u{1F4F7}'}</span>
      </div>
      <figcaption>
        <strong>{item.title}</strong>
        <span>{item.caption}</span>
      </figcaption>
    </figure>
  )
}

function MapItem({ item }) {
  return (
    <figure className="vault-item vault-item--photo vault-item--map">
      <div className="vault-photo" aria-hidden="true">
        <span>{item.icon || '\u{1F4CD}'}</span>
      </div>
      <figcaption>
        <strong>{item.title}</strong>
        <span>{item.caption}</span>
      </figcaption>
    </figure>
  )
}

function VideoItem({ item }) {
  return (
    <figure className="vault-item vault-item--video">
      <div className="vault-video-frame">
        <span aria-hidden="true">{'\u{1F3A5}'}</span>
        <p>{item.title}</p>
      </div>
      <figcaption>{item.caption}</figcaption>
    </figure>
  )
}

function NewspaperItem({ item }) {
  return (
    <article className="vault-item vault-clipping">
      <p className="vault-clipping__masthead">{item.masthead}</p>
      <h4>{item.headline}</h4>
      <p>{item.excerpt}</p>
    </article>
  )
}

function QuoteItem({ item }) {
  return (
    <blockquote className="vault-item vault-quote">
      <p>&ldquo;{item.text}&rdquo;</p>
      <cite>&mdash; {item.attribution}</cite>
    </blockquote>
  )
}

function StoryItem({ item }) {
  return (
    <article className="vault-item vault-story">
      <h4>{item.title}</h4>
      <p>{item.text}</p>
    </article>
  )
}

function AudioItem({ item }) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <article className="vault-item vault-audio">
      <div className="vault-audio__header">
        <button
          aria-label={isPlaying ? `Pause ${item.title}` : `Play ${item.title}`}
          aria-pressed={isPlaying}
          className="vault-audio__toggle"
          onClick={() => setIsPlaying((current) => !current)}
          type="button"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div>
          <strong>{item.title}</strong>
          <span>{item.duration}</span>
        </div>
      </div>

      <div className={`vault-audio__wave ${isPlaying ? 'is-playing' : ''}`} aria-hidden="true">
        {Array.from({ length: 24 }).map((_, index) => (
          <span key={index} style={{ animationDelay: `${index * 45}ms` }} />
        ))}
      </div>

      <p className="vault-audio__caption">{item.caption}</p>
    </article>
  )
}

function FactItem({ item }) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <button
      aria-pressed={isFlipped}
      className={`vault-item vault-fact ${isFlipped ? 'is-flipped' : ''}`}
      onClick={() => setIsFlipped((current) => !current)}
      type="button"
    >
      <span className="vault-fact__inner">
        <span className="vault-fact__face vault-fact__face--front">
          <span aria-hidden="true">{'\u{1F4A1}'}</span>
          Did You Know?
        </span>
        <span className="vault-fact__face vault-fact__face--back">{item.text}</span>
      </span>
    </button>
  )
}

const ITEM_COMPONENTS = {
  audio: AudioItem,
  fact: FactItem,
  map: MapItem,
  newspaper: NewspaperItem,
  photo: PhotoItem,
  quote: QuoteItem,
  story: StoryItem,
  video: VideoItem,
}

export default function VaultItem({ item }) {
  const Component = ITEM_COMPONENTS[item.type]

  if (!Component) {
    return null
  }

  return <Component item={item} />
}
