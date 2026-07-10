import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'

/*
TODO - Lia

Implement account settings.
Implement notification settings.
Implement accessibility preferences.
*/
export default function Settings() {
  return (
    <CreatorPageShell
      breadcrumbs={['Settings']}
      description="Preference sections for account, accessibility, and future notifications."
      title="Settings"
    >
      <section className="two-column">
        <SectionCard title="Account"><p>Profile visibility and password controls placeholder.</p></SectionCard>
        <SectionCard title="Preferences"><p>Language, motion, and notification preferences placeholder.</p></SectionCard>
      </section>
    </CreatorPageShell>
  )
}
