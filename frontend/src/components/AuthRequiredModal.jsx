export default function AuthRequiredModal({ onCancel, onGuest, onLogin }) {
  return (
    <div className="rw-modal-backdrop" onMouseDown={onCancel} role="presentation">
      <section aria-labelledby="auth-required-title" className="rw-auth-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <span aria-hidden="true" className="rw-auth-modal-icon">♡</span>
        <p className="eyebrow">Community Memory Wall</p>
        <h2 id="auth-required-title">Share Your Memory</h2>
        <p>Everyone is welcome to contribute. Choose how you would like to share.</p>
        <div className="rw-share-options">
          <section>
            <h3>👤 Continue as Guest</h3>
            <p>Share anonymously with no account required. You won&apos;t be able to edit or delete it later.</p>
            <button className="rw-primary-button" onClick={onGuest} type="button">Continue as Guest</button>
          </section>
          <section>
            <h3>⭐ Sign In</h3>
            <p>Show your username, edit later, and earn profile badges and milestones.</p>
            <button className="rw-secondary-button" onClick={onLogin} type="button">Login / Register</button>
          </section>
        </div>
        <div className="rw-auth-modal-actions">
          <button className="rw-text-button" onClick={onCancel} type="button">Cancel</button>
        </div>
      </section>
    </div>
  )
}
