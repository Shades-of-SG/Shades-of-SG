export default function AuthRequiredModal({ onCancel, onLogin, onRegister }) {
  return (
    <div className="rw-modal-backdrop" onMouseDown={onCancel} role="presentation">
      <section aria-labelledby="auth-required-title" className="rw-auth-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <span aria-hidden="true" className="rw-auth-modal-icon">♡</span>
        <p className="eyebrow">Community Memory Wall</p>
        <h2 id="auth-required-title">Share Your Memory</h2>
        <p>Creating a reflection requires a free account so your memories can be safely saved and managed.</p>
        <div className="rw-auth-modal-actions">
          <button className="rw-primary-button" onClick={onLogin} type="button">Login</button>
          <button className="rw-secondary-button" onClick={onRegister} type="button">Register</button>
          <button className="rw-text-button" onClick={onCancel} type="button">Cancel</button>
        </div>
      </section>
    </div>
  )
}
