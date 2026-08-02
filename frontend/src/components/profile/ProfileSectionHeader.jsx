export default function ProfileSectionHeader({ action, subtitle, title }) {
  return <header className="profile-section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</header>
}
