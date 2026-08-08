import { API_URL } from './apiConfig'

// Fetched exactly once per page load (module-level cache), regardless of how
// many components call this — mirrors the module-level audioBufferCache
// pattern in hooks/useInstrumentAudio.js. Never throws: any network/parse
// failure just resolves to an empty list, which leaves every instrument on
// its synthesized fallback.
let cachedPromise = null

export function getInstrumentLabSamples() {
  if (!cachedPromise) {
    cachedPromise = fetch(`${API_URL}/instruments/lab-samples`)
      .then((response) => (response.ok ? response.json() : { instruments: [] }))
      .then((data) => data.instruments || [])
      .catch(() => [])
  }
  return cachedPromise
}
