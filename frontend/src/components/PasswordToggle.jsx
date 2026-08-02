import { Eye, EyeOff } from 'lucide-react'

export default function PasswordToggle({ isVisible, label = 'password', onToggle }) {
  const action = isVisible ? 'Hide' : 'Show'
  const Icon = isVisible ? EyeOff : Eye

  return (
    <button
      aria-label={`${action} ${label}`}
      aria-pressed={isVisible}
      onClick={onToggle}
      type="button"
    >
      <Icon aria-hidden="true" size={19} />
      <span>{action}</span>
    </button>
  )
}
