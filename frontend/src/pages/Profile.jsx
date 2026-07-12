import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'

/*
TODO - Ferlyn

Implement user information.
Implement reflection history.
Implement game scores and achievements.
*/
export default function Profile() {
  return (
    <CreatorPageShell
      breadcrumbs={['Profile']}
      description="Creator account details, reflections, rhythm scores, and achievement badges."
      title="Profile"
      actions={<button className="studio-button studio-button--secondary" type="button">Edit Profile</button>}
    >
      <section className="responsive-grid">
        <SectionCard title="User Information"><p>Name, class, and account details placeholder.</p></SectionCard>
        <SectionCard title="Reflection History"><p>Submitted reflections will be listed here.</p></SectionCard>
        <SectionCard title="Game Scores"><p>Recent rhythm game scores will be shown here.</p></SectionCard>
        <SectionCard title="Achievements"><p>Achievement data is not available yet.</p></SectionCard>
      </section>
    </CreatorPageShell>
  )
}
