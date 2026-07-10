const STORAGE_KEY = 'shades-of-sg:post-login-intent'

export function savePostLoginIntent(intent) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent))
}

export function getPostLoginIntent() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function updatePostLoginIntent(updates) {
  const current = getPostLoginIntent()
  if (current) savePostLoginIntent({ ...current, ...updates })
}

export function clearPostLoginIntent() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function getPostLoginDestination(fallbackPath) {
  return getPostLoginIntent()?.returnTo || fallbackPath
}
