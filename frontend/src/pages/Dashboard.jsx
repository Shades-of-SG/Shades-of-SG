import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'
import SongCard from '../components/SongCard'
import { Link } from 'react-router-dom'
import { sampleSongs } from './pageData'

/*
TODO - Shermaine

Implement song statistics.
Implement creator song grid.
Implement quick actions.
*/
export default function Dashboard() {
  return (
    <CreatorPageShell
      breadcrumbs={['Dashboard']}
      description="Creator overview for song health, moderation needs, and publishing actions."
      title="Dashboard"
      actions={
        <>
          <button className="studio-button studio-button--secondary" type="button">Review Reflections</button>
          <button className="studio-button studio-button--primary" type="button">New Song</button>
        </>
      }
    >
      <section className="stats-grid">
        <SectionCard title="Song Statistics"><strong>12</strong><p>Total placeholder songs</p><Link className="inline-link" to="/creator/songs">Open songs <span aria-hidden="true">→</span></Link></SectionCard>
        <SectionCard title="Reflection Queue"><strong>8</strong><p>Pending moderation</p><Link className="inline-link" to="/creator/reflections">Review reflections <span aria-hidden="true">→</span></Link></SectionCard>
        <SectionCard title="Processing Video Generation"><strong>3</strong><p>Videos currently rendering</p><Link className="inline-link" to="/creator/generation">View generation <span aria-hidden="true">→</span></Link></SectionCard>
        <SectionCard title="Total Plays"><strong>240</strong><p>All-time song plays</p><Link className="inline-link" to="/creator/plays">View plays <span aria-hidden="true">→</span></Link></SectionCard>
      </section>
      <section className="responsive-grid">{sampleSongs.map((song) => <SongCard key={song.id} song={song} />)}</section>
      <SectionCard title="Quick Actions"><div className="button-row"><button type="button">New Song</button><button type="button">Review Reflections</button></div></SectionCard>
    </CreatorPageShell>
  )
}
