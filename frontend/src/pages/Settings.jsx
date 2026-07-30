import { Outlet } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SettingsNav from '../components/SettingsNav'

export default function Settings() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Manage your profile, account security, and data privacy."
        eyebrow="Settings"
        title="Settings"
      />

      <div className="settings-layout">
        <SettingsNav basePath="/settings" />
        <div className="settings-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
