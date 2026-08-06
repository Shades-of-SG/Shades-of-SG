// Fallback metadata for a badge name the catalog API doesn't know about (e.g. the catalog
// failed to load, or a badge was earned before its definition was seeded). Real metadata comes
// from GET /badges/catalog (backend/routes/badges.js) backed by the badge_definitions table —
// this is no longer duplicated hardcoded data, just a safety net.
const FALLBACK_META = {
  category: 'Journey',
  description: 'A keepsake collected during your Shades of SG journey.',
  imageKey: 'merlion',
}

export function badgePresentation(name, catalog = {}) {
  return catalog[name] || FALLBACK_META
}
