import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import SongCard from '../components/SongCard'
import { sampleSongs } from './pageData'

/*
TODO - Shermaine

Implement song statistics.
Implement creator song grid.
Implement quick actions.
*/
export default function Dashboard() {
  return (
    <div className="page-stack">
      <PageHeader description="Creator overview for song health, moderation needs, and publishing actions." eyebrow="Creator Portal" title="Dashboard" />
      <section className="stats-grid">
        <SectionCard title="Song Statistics"><strong>12</strong><p>Total placeholder songs</p></SectionCard>
        <SectionCard title="Reflection Queue"><strong>8</strong><p>Pending moderation</p></SectionCard>
        <SectionCard title="Game Plays"><strong>240</strong><p>Demo rhythm plays</p></SectionCard>
      </section>
      <section className="responsive-grid">{sampleSongs.map((song) => <SongCard key={song.id} song={song} />)}</section>
      <SectionCard title="Quick Actions"><div className="button-row"><button type="button">New Song</button><button type="button">Review Reflections</button></div></SectionCard>
    </div>
  )
}
