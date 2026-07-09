import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const reflections = [
  {
    author: 'Jia En',
    color: 'coral',
    content:
      'This song reminds me of walking through Bugis with my grandmother, hearing different languages blend into one familiar sound.',
    location: 'Bugis',
    song: 'Demo Song',
    title: 'Evening Walks',
  },
  {
    author: 'Marcus',
    color: 'gold',
    content:
      'The rhythm feels like the void deck after school. Someone playing music, someone laughing, someone rushing home for dinner.',
    location: 'Tampines',
    song: 'City Pulse',
    title: 'After School Noise',
  },
  {
    author: 'Nurul',
    color: 'violet',
    content:
      'My favourite part is how small memories can become part of something bigger. It feels like writing a postcard to Singapore.',
    location: 'Kampong Glam',
    song: 'Kampong Light',
    title: 'Postcard Memory',
  },
  {
    author: 'Sarah',
    color: 'cyan',
    content:
      'The instruments made me think of National Day rehearsals, but softer. Less parade, more personal.',
    location: 'Marina Bay',
    song: 'Demo Song',
    title: 'Soft Fireworks',
  },
  {
    author: 'Wei Ming',
    color: 'green',
    content:
      'I used to hear songs like this from a shop radio while buying snacks. It made the whole street feel alive.',
    location: 'Chinatown',
    song: 'Kampong Light',
    title: 'Shop Radio',
  },
  {
    author: 'Asha',
    color: 'rose',
    content:
      'It sounds like a place where everyone is passing through, but somehow everyone belongs.',
    location: 'Little India',
    song: 'City Pulse',
    title: 'Passing Through',
  },
]

const songFilters = ['All Songs', 'Demo Song', 'City Pulse', 'Kampong Light']

/*
TODO - Ferlyn

Connect reflection feed to approved backend posts.
Implement reflection submission persistence.
Connect song filters to live song data.
*/
export default function ReflectionWall() {
  const [searchParams] = useSearchParams()
  const [isComposerOpen, setIsComposerOpen] = useState(() => searchParams.get('compose') === '1')
  const [selectedSong, setSelectedSong] = useState('All Songs')

  const visibleReflections =
    selectedSong === 'All Songs'
      ? reflections
      : reflections.filter((reflection) => reflection.song === selectedSong)

  return (
    <div className="reflection-wall-page">
      <section className="reflection-hero">
        <div>
          <p className="eyebrow">Reflection Wall</p>
          <h1>Every memory adds a new shade.</h1>
          <p>
            Read stories from the community and leave a reflection after listening, learning, or
            playing through a song.
          </p>
        </div>
        <button
          aria-expanded={isComposerOpen}
          aria-label={isComposerOpen ? 'Close add post card' : 'Open add post card'}
          className="add-reflection-button"
          onClick={() => setIsComposerOpen((current) => !current)}
          type="button"
        >
          <span aria-hidden="true">{isComposerOpen ? 'x' : '+'}</span>
        </button>
      </section>

      <section className="reflection-toolbar" aria-label="Reflection filters">
        <div>
          <span>Song Filter</span>
          <div className="reflection-filter-chips">
            {songFilters.map((song) => (
              <button
                className={selectedSong === song ? 'active' : undefined}
                key={song}
                onClick={() => setSelectedSong(song)}
                type="button"
              >
                {song}
              </button>
            ))}
          </div>
        </div>
        <p>{visibleReflections.length} reflections showing</p>
      </section>

      {isComposerOpen && (
        <section className="reflection-composer-card" aria-label="Add a reflection post">
          <div>
            <p className="eyebrow">Add Post</p>
            <h2>Share your Singapore memory</h2>
          </div>
          <form className="reflection-form">
            <label className="field-stack">
              <span>Title</span>
              <input placeholder="Give your reflection a title" />
            </label>
            <label className="field-stack">
              <span>Song</span>
              <select defaultValue="Demo Song">
                <option>Demo Song</option>
                <option>City Pulse</option>
                <option>Kampong Light</option>
              </select>
            </label>
            <label className="field-stack reflection-form-wide">
              <span>Your Reflection</span>
              <textarea placeholder="Write about a place, person, sound, or memory..." rows="5" />
            </label>
            <div className="reflection-form-actions">
              <button type="button">Save Draft</button>
              <button type="submit">Submit for Review</button>
            </div>
          </form>
        </section>
      )}

      <section className="padlet-board" aria-label="Community reflections">
        {visibleReflections.map((reflection, index) => (
          <article
            className={`padlet-card padlet-card-${reflection.color}`}
            key={`${reflection.title}-${reflection.author}`}
            style={{ '--card-offset': `${(index % 3) * 14}px` }}
          >
            <div className="pin-dot" aria-hidden="true" />
            <p className="eyebrow">{reflection.song}</p>
            <h2>{reflection.title}</h2>
            <p>{reflection.content}</p>
            <footer>
              <span>{reflection.author}</span>
              <span>{reflection.location}</span>
            </footer>
          </article>
        ))}
      </section>
    </div>
  )
}
