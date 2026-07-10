export default function GuestThankYouModal({ onClose, onRegister }) {
  return (
    <div className="rw-modal-backdrop" onMouseDown={onClose} role="presentation">
      <section aria-labelledby="guest-thanks-title" className="rw-auth-modal rw-guest-thanks" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <span aria-hidden="true" className="rw-auth-modal-icon">🎉</span>
        <h2 id="guest-thanks-title">Thank you for sharing your memory!</h2>
        <p>Your reflection is pending moderation. Want to keep track of future reflections, edit them, and earn badges?</p>
        <div className="rw-auth-modal-actions">
          <button className="rw-text-button" onClick={onClose} type="button">Maybe Later</button>
          <button className="rw-primary-button" onClick={onRegister} type="button">Create Account</button>
        </div>
      </section>
    </div>
  )
}
