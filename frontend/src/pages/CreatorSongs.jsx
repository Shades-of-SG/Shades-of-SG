import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import SongCard from '../components/SongCard'
import { sampleSongs } from './pageData'

/*
TODO - Shermaine

Implement creator song management.
Connect song status filters to backend data.
Add edit, publish, and archive actions.
*/
export default function CreatorSongs() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Creator-only song management for drafts, published songs, and generation status."
        eyebrow="Creator Songs"
        title="Songs"
      />
      <section className="stats-grid">
        <SectionCard title="Drafts"><strong>4</strong><p>Songs being prepared.</p></SectionCard>
        <SectionCard title="Published"><strong>8</strong><p>Live in the public library.</p></SectionCard>
        <SectionCard title="Needs Review"><strong>2</strong><p>Waiting for creator checks.</p></SectionCard>
      </section>
      <section className="responsive-grid" aria-label="Creator song grid">
        {sampleSongs.map((song) => (
          <article className="creator-song-item" key={song.id}>
            <SongCard song={song} />
            <div className="creator-song-actions">
              <button type="button">Edit</button>
              <button type="button">Generate</button>
              <button type="button">Publish</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
