import FilterBar from '../components/FilterBar'
import PageHeader from '../components/PageHeader'
import SongCard from '../components/SongCard'
import { sampleSongs } from './pageData'

/*
TODO - Lia

Implement search behavior.
Connect filters to song metadata.
Load song grid from API.
*/
export default function SongsLibrary() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Search and filter the songs that power experiences across learning, trivia, playground, and rhythm."
        eyebrow="Songs Library"
        title="Songs Library"
      />
      <FilterBar />
      <section className="responsive-grid" aria-label="Song grid">
        {sampleSongs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </section>
    </div>
  )
}
