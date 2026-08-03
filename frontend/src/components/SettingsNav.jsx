import { LockKeyhole, ShieldAlert, ShieldCheck, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { Icon: UserRound, label: 'Profile', slug: 'profile' },
  { Icon: LockKeyhole, label: 'Account & Security', slug: 'account-security' },
  { Icon: ShieldCheck, label: 'Data & Privacy', slug: 'data-privacy' },
  { Icon: ShieldAlert, label: 'Safety & Status', slug: 'safety' },
]

export default function SettingsNav({ basePath = '/settings' }) {
  return (
    <nav aria-label="Settings sections" className="settings-nav">
      {tabs.map(({ Icon, label, slug }) => <NavLink className={({ isActive }) => `settings-nav__link${isActive ? ' is-active' : ''}`} key={slug} to={`${basePath}/${slug}`}>
        <Icon aria-hidden="true" /><span>{label}</span>
      </NavLink>)}
    </nav>
  )
}
