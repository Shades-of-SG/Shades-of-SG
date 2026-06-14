import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const songs = ['All Songs', 'Stronger Together', 'Our Singapore Dream', 'Heartbeat of the Bay']

const reflections = [
  {
    author: 'Anonymous',
    age: '2h ago',
    body: 'This song brings me back to my childhood in Toa Payoh. So many memories with my family.',
    color: 'yellow',
    rotation: '-7deg',
    tape: 'pink',
    tags: ['Family', 'Home'],
    doodle: 'heart',
  },
  {
    author: 'Nurul',
    age: '3h ago',
    body: 'Reminds me of National Day celebrations with the whole neighbourhood!',
    color: 'rose',
    rotation: '-4deg',
    pin: 'red',
    tags: ['Nostalgia', 'Unity'],
    doodle: 'flower',
  },
  {
    author: 'Anonymous',
    age: '5h ago',
    body: 'This song gives me so much hope for our future generations.',
    color: 'blue',
    rotation: '-2deg',
    tape: 'blue',
    tags: ['Hope', 'Future'],
    doodle: 'lion',
  },
  {
    author: 'Marcus',
    age: '6h ago',
    body: 'Every time I hear this song, I think of home and the people I love.',
    color: 'lavender',
    rotation: '4deg',
    pin: 'purple',
    tags: ['Home', 'Love'],
    doodle: 'flag',
  },
  {
    author: 'Jia En',
    age: '4h ago',
    body: 'The melody makes me feel proud to be Singaporean. Thank you for this beautiful tribute!',
    color: 'lilac',
    rotation: '-3deg',
    pin: 'purple',
    tags: ['Pride'],
    doodle: 'corner',
  },
  {
    author: 'Wei Lin',
    age: '7h ago',
    body: 'The lyrics about heritage really spoke to me. Our roots, our identity.',
    color: 'green',
    rotation: '1deg',
    pin: 'green',
    tags: ['Heritage'],
    doodle: 'leaf',
  },
  {
    author: 'Anonymous',
    age: '8h ago',
    body: 'I used to sing this with my grandpa. He would be so proud today.',
    color: 'yellow',
    rotation: '-1deg',
    tape: 'orange',
    tags: ['Family'],
    doodle: 'big-heart',
  },
  {
    author: 'Shannon',
    age: '9h ago',
    body: 'Singapore is small, but it holds so many different stories like ours.',
    color: 'coral',
    rotation: '-2deg',
    pin: 'red',
    tags: ['Community', 'SG'],
    doodle: 'heart-stamp',
  },
  {
    author: 'Anonymous',
    age: '10h ago',
    body: 'Thank you for creating a song that brings us all together.',
    color: 'mint',
    rotation: '2deg',
    tags: ['Togetherness'],
    doodle: 'pressed-flower',
  },
]

const stats = [
  { label: 'Reflections Shared', value: '1,245', icon: 'people' },
  { label: 'Contributors', value: '892', icon: 'heart' },
  { label: 'Songs Inspiring Us', value: '23', icon: 'sparkle' },
]

function Icon({ name }) {
  const paths = {
    home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z',
    music: 'M9 18V5l10-2v13M9 18a3 3 0 1 1-2-2.83M19 16a3 3 0 1 1-2-2.83',
    compass: 'm14.5 9.5-2 5-5 2 2-5 5-2Z M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
    learn: 'm12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.9L12 3Z',
    play: 'M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z M10 9v6l5-3-5-3Z',
    heart: 'M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21.8 20.8 13a5.2 5.2 0 0 0 0-7.4Z',
    sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m14.36-6.36 1.42-1.42M4.22 19.78l1.42-1.42m12.72 0 1.42 1.42M4.22 4.22l1.42 1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
    bell: 'M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z M10 20a2 2 0 0 0 4 0',
    grid: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
    pen: 'M4 20h4l10.5-10.5-4-4L4 16v4Z M13.5 6.5l4 4',
    plus: 'M12 5v14M5 12h14',
    search: 'M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21',
    sliders: 'M4 7h10M18 7h2M6 17h14M4 17h2M8 5v4M16 15v4',
    send: 'M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z M9 12l2 2 4-5',
    people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    sparkle: 'm12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z',
  }

  return (
    <svg aria-hidden="true" className="rw-icon" viewBox="0 0 24 24">
      <path d={paths[name] || paths.heart} />
    </svg>
  )
}

function ReflectionPost({ post }) {
  return (
    <article
      className={`reflection-note note-${post.color}`}
      style={{ '--note-rotation': post.rotation }}
    >
      {post.tape && <span className={`note-tape tape-${post.tape}`} aria-hidden="true" />}
      {post.pin && <span className={`note-pin pin-${post.pin}`} aria-hidden="true" />}
      <div className="note-meta">
        <span className="note-avatar" aria-hidden="true" />
        <div>
          <strong>{post.author}</strong>
          <small>{post.age}</small>
        </div>
        <span>{post.age}</span>
      </div>
      <p>{post.body}</p>
      <div className="note-tags">
        {post.tags.map((tag) => (
          <span key={tag}># {tag}</span>
        ))}
      </div>
      <span className={`note-doodle doodle-${post.doodle}`} aria-hidden="true" />
    </article>
  )
}

function ReflectionForm({ onClose }) {
  return (
    <div className="reflection-overlay" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="reflection-form-title"
        className="reflection-form-card"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label="Close reflection form" className="form-close" onClick={onClose} type="button">
          x
        </button>
        <div className="form-title-row">
          <h2 id="reflection-form-title">Share your reflection</h2>
          <Icon name="heart" />
        </div>
        <p>What does this song mean to you?</p>

        <label>
          Display name <span>(optional)</span>
          <input maxLength="20" placeholder="e.g. Jia En" type="text" />
        </label>

        <label className="anonymous-row">
          <span className="incognito-mark" aria-hidden="true" />
          Post anonymously
          <input defaultChecked type="checkbox" />
        </label>

        <label>
          Your reflection
          <textarea
            maxLength="500"
            placeholder="Write your reflection here...&#10;(Your words may inspire others.)"
            rows="5"
          />
        </label>

        <label>
          Song <span>(optional)</span>
          <select defaultValue="">
            <option value="" disabled>
              Choose a song
            </option>
            <option>Stronger Together</option>
            <option>Our Singapore Dream</option>
            <option>Heartbeat of the Bay</option>
          </select>
        </label>

        <button className="submit-reflection" type="button">
          <Icon name="send" />
          Post Reflection
          <span aria-hidden="true">+</span>
        </button>

        <p className="review-note">
          <Icon name="shield" />
          All reflections will be reviewed before appearing on the wall.
        </p>
      </section>
    </div>
  )
}

export default function ReflectionWall() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeSong, setActiveSong] = useState('All Songs')
  const [query, setQuery] = useState('')

  const visibleReflections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return reflections
    }

    return reflections.filter((post) =>
      [post.author, post.body, ...post.tags].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    )
  }, [query])

  return (
    <div className="reflection-wall-page">
      <header className="reflection-nav">
        <Link className="reflection-brand" to="/">
          <span aria-hidden="true" className="brand-clef">
            S
          </span>
          <strong>
            Shades
            <br />
            of SG
          </strong>
        </Link>
        <nav aria-label="Reflection wall navigation">
          <Link to="/">
            <Icon name="home" />
            Home
          </Link>
          <Link to="/songs">
            <Icon name="music" />
            Songs
          </Link>
          <Link to="/songs">
            <Icon name="compass" />
            Explore
          </Link>
          <Link to="/learning">
            <Icon name="learn" />
            Learn
          </Link>
          <Link to="/rhythm-game">
            <Icon name="play" />
            Play
          </Link>
          <Link className="active" to="/reflections">
            <Icon name="heart" />
            Reflections
          </Link>
        </nav>
        <div className="nav-utility">
          <Icon name="sun" />
          <span className="nav-divider" />
          <span className="bell-wrap">
            <Icon name="bell" />
            <b>3</b>
          </span>
          <span className="guest-avatar" aria-hidden="true" />
          <span>Guest</span>
        </div>
      </header>

      <main className="reflection-wall">
        <section className="reflection-hero" aria-labelledby="reflection-title">
          <div>
            <h1 id="reflection-title">Reflection Wall</h1>
            <p>
              A space for all of us to share our <strong>memories</strong> and{' '}
              <strong>emotions</strong> inspired by Singapore's songs.
            </p>
          </div>
          <p className="hero-note">Every story matters. Every memory lives on.</p>
          <div className="pinned-quote">
            <span className="note-pin pin-red" aria-hidden="true" />
            Music is the soundtrack of our stories.
          </div>
          <button className="add-reflection-button" onClick={() => setIsFormOpen(true)} type="button">
            <Icon name="pen" />
            <Icon name="plus" />
            Add Reflection
          </button>
        </section>

        <section className="reflection-toolbar" aria-label="Reflection filters">
          <div className="song-pills">
            {songs.map((song) => (
              <button
                className={song === activeSong ? 'active' : ''}
                key={song}
                onClick={() => setActiveSong(song)}
                type="button"
              >
                {song === 'All Songs' ? <Icon name="grid" /> : <Icon name="music" />}
                {song}
              </button>
            ))}
            <button type="button">More</button>
          </div>
          <label className="search-box">
            <span className="sr-only">Search reflections</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reflections..."
              type="search"
              value={query}
            />
            <Icon name="search" />
          </label>
          <button className="sort-button" type="button">
            Sort: Latest
          </button>
          <button aria-label="Open filters" className="filter-button" type="button">
            <Icon name="sliders" />
          </button>
        </section>

        <section className="wall-content" aria-label="Community reflections">
          <div className="post-grid">
            {visibleReflections.map((post) => (
              <ReflectionPost key={`${post.author}-${post.body}`} post={post} />
            ))}
          </div>
          <aside className="wall-side-panel" aria-label="Reflection prompt">
            <button className="side-add-button" onClick={() => setIsFormOpen(true)} type="button">
              <Icon name="plus" />
              Add your reflection
            </button>
            <div className="side-paper">
              Thank you for being part of our community. Your story matters.
            </div>
            <div className="skyline-card" aria-hidden="true" />
          </aside>
        </section>

        <p className="approval-strip">New reflections appear here once approved by the creator.</p>

        <section className="reflection-stats" aria-label="Reflection statistics">
          {stats.map((stat) => (
            <div key={stat.label}>
              <span className={`stat-icon stat-${stat.icon}`}>
                <Icon name={stat.icon} />
              </span>
              <strong>{stat.value}</strong>
              <small>{stat.label}</small>
            </div>
          ))}
        </section>
      </main>

      {isFormOpen && <ReflectionForm onClose={() => setIsFormOpen(false)} />}
    </div>
  )
}
