export const INTEREST_TAG_CATEGORIES = Object.freeze([
  Object.freeze({ label: 'National moments', tags: Object.freeze(['National Day', 'Racial Harmony Day', 'Total Defence Day']) }),
  Object.freeze({ label: 'Singapore cultures', tags: Object.freeze(['Chinese Culture', 'Malay Culture', 'Indian Culture', 'Peranakan Heritage', 'Eurasian Heritage']) }),
  Object.freeze({ label: 'Music and memories', tags: Object.freeze(['National Songs', 'Folk & Traditional Music', 'Community Stories', 'Singapore History', 'Local Languages']) }),
])

export const ALLOWED_INTEREST_TAGS = new Set(INTEREST_TAG_CATEGORIES.flatMap((category) => category.tags))
export const MAX_INTEREST_TAGS = 6
