import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'

/*
TODO - Htet

Implement video player.
Implement subtitles.
Implement cultural summary.
*/
export default function SongExperience() {
  const { id = 'demo-song' } = useParams()

  return (
    <div className="page-stack">
      <PageHeader
        description="A song detail workspace for media, metadata, cultural context, and connected activities."
        eyebrow="Song Experience"
        title={`Song: ${id}`}
      />
      <section className="song-experience-grid">
        <SectionCard className="media-placeholder" title="Video Player Placeholder">
          <div className="video-frame">Video Preview</div>
        </SectionCard>
        <SectionCard title="Song Metadata">
          <dl className="detail-list">
            <div><dt>Theme</dt><dd>Heritage</dd></div>
            <div><dt>Language</dt><dd>Multilingual</dd></div>
            <div><dt>Era</dt><dd>Contemporary</dd></div>
          </dl>
        </SectionCard>
        <SectionCard title="Cultural Summary">
          <p>Placeholder space for story notes, lyric context, and Singapore cultural references.</p>
        </SectionCard>
        <SectionCard title="Instruments Section">
          <p>Feature teams can add instrument callouts, samples, and links to the playground.</p>
          <div className="button-row">
            <Link className="inline-link" to={`/songs/${id}/playground`}>Open Playground</Link>
            <Link className="inline-link" to={`/songs/${id}/trivia`}>Start Trivia</Link>
          </div>
        </SectionCard>
      </section>
    </div>
  )
}
