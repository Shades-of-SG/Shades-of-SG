const REGISTRATION_RETURN_KEY = 'shades-of-sg:registration-return'
const NEW_ACCOUNT_CLAIM_KEY = 'shades-of-sg:new-account-score-claim'
export const RHYTHM_SCORE_CLAIM_PATH = '/rhythm-game/claim'

export function safeReturnPath(value) {
  const candidate = typeof value === 'string'
    ? value
    : value?.pathname
      ? `${value.pathname}${value.search || ''}${value.hash || ''}`
      : ''
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return ''
  return candidate
}

export function readRegistrationReturn() {
  try { return safeReturnPath(sessionStorage.getItem(REGISTRATION_RETURN_KEY)) }
  catch { return '' }
}

export function storeRegistrationReturn(value) {
  const path = safeReturnPath(value)
  try {
    if (path) sessionStorage.setItem(REGISTRATION_RETURN_KEY, path)
  } catch {
    // Authentication can continue when session storage is unavailable.
  }
  return path
}

export function markNewAccountScoreClaim(returnPath) {
  const isClaim = safeReturnPath(returnPath) === RHYTHM_SCORE_CLAIM_PATH
  try {
    if (isClaim) sessionStorage.setItem(NEW_ACCOUNT_CLAIM_KEY, 'true')
    else sessionStorage.removeItem(NEW_ACCOUNT_CLAIM_KEY)
  } catch {
    // Claiming still works when the tailored success label cannot be stored.
  }
  return isClaim
}

export function isNewAccountScoreClaim() {
  try { return sessionStorage.getItem(NEW_ACCOUNT_CLAIM_KEY) === 'true' }
  catch { return false }
}

export function clearScoreClaimReturn() {
  clearRegistrationReturn()
  try { sessionStorage.removeItem(NEW_ACCOUNT_CLAIM_KEY) } catch { /* no-op */ }
}

export function clearRegistrationReturn() {
  try { sessionStorage.removeItem(REGISTRATION_RETURN_KEY) } catch { /* no-op */ }
}
