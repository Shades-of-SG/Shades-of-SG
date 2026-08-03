export const AUTH_EXPIRED_EVENT = 'auth-session-expired'

export function notifyAuthExpired() {
  window.dispatchEvent(
    new CustomEvent(AUTH_EXPIRED_EVENT)
  )
}