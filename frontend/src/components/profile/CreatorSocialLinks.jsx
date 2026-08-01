import { AtSign, Globe2, Music2, Video } from 'lucide-react'

const PLATFORMS = [
  { icon: Globe2, key: 'website', label: 'Website' },
  { icon: AtSign, key: 'instagram', label: 'Instagram' },
  { icon: Video, key: 'youtube', label: 'YouTube' },
  { icon: Music2, key: 'tiktok', label: 'TikTok' },
]

function safeSocialUrl(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed || ['http://', 'https://'].includes(trimmed.toLowerCase())) return ''
  try {
    const parsed = new URL(trimmed)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''
  } catch {
    return ''
  }
}

export default function CreatorSocialLinks({ displayName, socialLinks }) {
  const links = PLATFORMS.flatMap(({ icon, key, label }) => {
    const url = safeSocialUrl(socialLinks?.[key])
    return url ? [{ icon, key, label, url }] : []
  })

  if (!links.length) return null

  return (
    <nav aria-label={`${displayName}'s social links`} className="creator-profile-socials">
      {links.map(({ icon: Icon, key, label, url }) => (
        <a aria-label={`Visit ${displayName}'s ${label}`} href={url} key={key} rel="noopener noreferrer" target="_blank" title={label}>
          <Icon aria-hidden="true" /><span>{label}</span>
        </a>
      ))}
    </nav>
  )
}
