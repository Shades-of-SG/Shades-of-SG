import { NavLink } from 'react-router-dom'

const creatorLinks = [
  { label: 'Dashboard', to: '/creator/dashboard' },
  { label: 'Studio', to: '/creator/studio' },
  { label: 'Songs', to: '/creator/songs' },
  { label: 'Generation', to: '/creator/generation' },
  { label: 'Reflections', to: '/creator/reflections' },
]

export default function Sidebar() {
  return (
    <aside className="creator-sidebar">
      <div className="brand-mark">
        <span>SG</span>
        <strong>Creator</strong>
      </div>
      <nav aria-label="Creator navigation">
        {creatorLinks.map((item) => (
          <NavLink className={({ isActive }) => (isActive ? 'active' : undefined)} key={item.to} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
