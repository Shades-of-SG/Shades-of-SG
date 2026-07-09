import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { placeholderCards } from './pageData'

/*
TODO - Shermaine

Implement lessons.
Implement timeline.
Implement cultural resources.
*/
export default function LearningHub() {
  return (
    <div className="page-stack">
      <PageHeader
        description="A learning space for lessons, timelines, and cultural resources connected to the song library."
        eyebrow="Learning Hub"
        title="Learning Hub"
      />
      <section className="three-column">
        <SectionCard title="Lessons">
          <ul className="clean-list">{placeholderCards.resources.map((item) => <li key={item}>{item}</li>)}</ul>
        </SectionCard>
        <SectionCard title="Timeline">
          <ol className="timeline-list"><li>Origins</li><li>Community stories</li><li>Modern performance</li></ol>
        </SectionCard>
        <SectionCard title="Cultural Resources">
          <p>Reference cards, citations, and classroom materials can be added here.</p>
        </SectionCard>
      </section>
    </div>
  )
}
