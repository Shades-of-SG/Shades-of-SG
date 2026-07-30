import { Outlet } from 'react-router-dom'
import CreatorPageShell from '../components/CreatorPageShell'
import SettingsNav from '../components/SettingsNav'

export default function CreatorSettings() {
  return (
    <CreatorPageShell
      breadcrumbs={['Settings']}
      description="Manage your profile, account security, and data privacy."
      title="Settings"
    >
      <div className="settings-layout">
        <SettingsNav basePath="/creator/settings" />
        <div className="settings-layout__content">
          <Outlet />
        </div>
      </div>
    </CreatorPageShell>
  )
}
