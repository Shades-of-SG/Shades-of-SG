import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'

/*
TODO - Lia

Implement account settings.
Implement notification settings.
Implement accessibility preferences.
*/
/*
export default function Settings() {
  return (
    <CreatorPageShell
      breadcrumbs={['Settings']}
      description="Preference sections for account, accessibility, and future notifications."
      title="Settings"
    >
      <section className="two-column">
        <SectionCard title="Profile"><p>Manage username and email.</p></SectionCard>
        <SectionCard title="Account & Security"><p>Manage password and enable 2FA.</p></SectionCard>
        <SectionCard title="Data & Privacy"><p>Delete your account.</p></SectionCard>
      </section>
    </div>
  )
}
*/

import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { Link } from 'react-router-dom'

export default function Settings() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Preference sections for account, accessibility, and future notifications."
        eyebrow="Settings"
        title="Settings"
      />
      <section className="two-column">
        <Link to="/settings/profile" style={{ textDecoration: 'none' }}>
          <SectionCard title="Profile"><p>Manage username and email.</p></SectionCard>
        </Link>
        <Link to="/settings/account-security" style={{ textDecoration: 'none' }}>
          <SectionCard title="Account & Security"><p>Manage password and enable 2FA.</p></SectionCard>
        </Link>
        <Link to="/settings/data-privacy" style={{ textDecoration: 'none' }}>
          <SectionCard title="Data & Privacy"><p>Delete your account.</p></SectionCard>
        </Link>
      </section>
    </CreatorPageShell>
  )
}
