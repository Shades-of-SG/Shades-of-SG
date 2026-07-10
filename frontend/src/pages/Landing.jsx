import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import SongCard from '../components/SongCard'
import { sampleSongs } from './pageData'

/*
TODO - Lia

Implement final landing copy.
Connect featured songs to backend data.
Add production-ready media assets.
*/
export default function Landing() {
  return (
    <div className="page-stack landing-page">
      <section className="hero-panel">
        <PageHeader
          description="Explore Singapore stories through songs, rhythm play, cultural notes, and shared reflections."
          eyebrow="Public Experience"
          title="Shades of SG"
        />
        <div className="hero-actions">
          <Link className="primary-link" to="/songs">Browse Songs</Link>
          <Link className="secondary-link" to="/rhythm-game">Play Rhythm Game</Link>
        </div>
      </section>

      <section className="content-section">
        <h2>Featured Songs</h2>
        <div className="responsive-grid">
          {sampleSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>

      <section className="content-section two-column">
        <SectionCard title="Why Shades of SG" description="A shared base for music-led cultural discovery.">
          <p>Placeholder modules will support song stories, playable learning moments, and reflection prompts.</p>
        </SectionCard>
        <SectionCard title="Call To Action" description="Start with a song, then follow the cultural thread.">
          <Link className="inline-link" to="/learning">Open Learning Hub</Link>
        </SectionCard>
      </section>
    </div>
  )
}
