/**
 * Eye / eye-slash toggle that sits inside a password field.
 * The slash is drawn over the 👁 glyph in CSS so both states share one icon.
 */
export default function PasswordToggle({ isVisible, label = 'password', onToggle }) {
  return (
    <button
      aria-label={`${isVisible ? 'Hide' : 'Show'} ${label}`}
      aria-pressed={isVisible}
      className={`field-action field-action--icon ${isVisible ? 'is-slashed' : ''}`}
      onClick={onToggle}
      title={isVisible ? 'Hide' : 'Show'}
      type="button"
    >
      {/* U+FE0F forces emoji presentation — the bare glyph falls back to a
          faint monochrome eye that is hard to see on the dark chip. */}
      <span aria-hidden="true">👁️</span>
    </button>
  )
}
