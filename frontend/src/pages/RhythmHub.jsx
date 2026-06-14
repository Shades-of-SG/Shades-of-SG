import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'

/*
TODO - Ferlyn

Preserve existing RhythmGame logic.
Connect song selection to playable charts.
Add rhythm onboarding content.
*/
export default function RhythmHub() {
  return (
    <div className="page-stack">
      <PageHeader
        actions={<Link className="primary-link" to="/game/demo-song">Play Demo Song</Link>}
        description="Choose a song chart, practise rhythm, and save scores through the existing game flow."
        eyebrow="Rhythm Game"
        title="Rhythm Game"
      />
      <section className="two-column">
        <SectionCard title="Playable Charts">
          <p>The existing game remains available at /game/:songId and is not rewritten by this shell.</p>
        </SectionCard>
        <SectionCard title="How It Fits">
          <p>Scores can connect back to song experiences, reflection prompts, and profile achievements.</p>
        </SectionCard>
      </section>
    </div>
  )
}
