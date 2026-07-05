import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'
import { placeholderCards } from './pageData'

/*
TODO - Ferlyn

Implement pending reflection list.
Implement approval and rejection actions.
Implement flagged reflection workflow.
*/
export default function ReflectionModeration() {
  return (
    <CreatorPageShell
      breadcrumbs={['Reflections']}
      description="Creator moderation space for reviewing reflection submissions."
      title="Reflection Moderation"
    >
      <section className="three-column">
        {placeholderCards.moderation.map((item) => (
          <SectionCard key={item} title={item}><p>Moderation list placeholder for {item.toLowerCase()}.</p></SectionCard>
        ))}
      </section>
    </CreatorPageShell>
  )
}
