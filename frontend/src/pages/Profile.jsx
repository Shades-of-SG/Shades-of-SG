import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { placeholderCards } from './pageData'

/*
TODO - Ferlyn

Implement user information.
Implement reflection history.
Implement game scores and achievements.
*/
export default function Profile() {
  return (
    <div className="page-stack">
      <PageHeader description="User activity, reflections, rhythm scores, and achievement badges." eyebrow="Profile" title="Profile" />
      <section className="responsive-grid">
        <SectionCard title="User Information"><p>Name, class, and account details placeholder.</p></SectionCard>
        <SectionCard title="Reflection History"><p>Submitted reflections will be listed here.</p></SectionCard>
        <SectionCard title="Game Scores"><p>Recent rhythm game scores will be shown here.</p></SectionCard>
        <SectionCard title="Achievements"><ul className="clean-list">{placeholderCards.achievements.map((item) => <li key={item}>{item}</li>)}</ul></SectionCard>
      </section>
    </div>
  )
}
