import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'
import { placeholderCards } from './pageData'

/*
TODO - Htet

Implement generation status polling.
Implement progress timeline.
Implement logs view.
*/
export default function GenerationProgress() {
  return (
    <CreatorPageShell
      breadcrumbs={['Generation Jobs']}
      description="Track AI-assisted asset generation without implementing the pipeline yet."
      title="Generation Progress"
    >
      <section className="three-column">
        <SectionCard title="Generation Status"><div className="progress-track"><span style={{ width: '62%' }} /></div><p>Placeholder status: processing.</p></SectionCard>
        <SectionCard title="Progress Timeline"><ol className="timeline-list"><li>Queued</li><li>Processing</li><li>Review</li></ol></SectionCard>
        <SectionCard title="Logs"><ul className="clean-list">{placeholderCards.logs.map((item) => <li key={item}>{item}</li>)}</ul></SectionCard>
      </section>
    </CreatorPageShell>
  )
}
