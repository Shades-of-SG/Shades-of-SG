import { Award, BookOpen, Landmark, Music2 } from 'lucide-react'

const LANDMARK_ICONS = {
  Esplanade: Music2,
  Merlion: Landmark,
  'National Gallery': BookOpen,
}

export const BADGE_DEFINITIONS = {
  'Day One': { category: 'Consistency', description: 'Logged in for the first time.', landmark: 'Merlion' },
  '7-Day Streak': { category: 'Consistency', description: 'Logged in for 7 days in a row.', landmark: 'Merlion' },
  '30-Day Streak': { category: 'Consistency', description: 'Logged in for 30 days in a row.', landmark: 'Merlion' },
  'Consistency Champion': { category: 'Consistency', description: 'Logged in for 50 days in a row.', landmark: 'Merlion' },
  'Dedicated Learner': { category: 'Consistency', description: 'Logged in for 100 days in a row.', landmark: 'Merlion' },
  'Thought Starter': { category: 'Reflection', description: 'Submitted your first reflection.', landmark: 'National Gallery' },
  'Reflective Mind': { category: 'Reflection', description: 'Submitted 5 reflections.', landmark: 'National Gallery' },
  'Deep Thinker': { category: 'Reflection', description: 'Submitted 20 reflections.', landmark: 'National Gallery' },
  'Playground Virtuoso': { category: 'Instrument Playground', description: 'Completed every fun challenge in the Instrument Playground.', landmark: 'Esplanade' },
}

export const BADGE_CATEGORIES = ['Consistency', 'Reflection', 'Instrument Playground']

export function badgePresentation(name) {
  const meta = BADGE_DEFINITIONS[name] || { category: 'Journey', description: 'A keepsake collected during your Shades of SG journey.', landmark: 'Merlion' }
  return { ...meta, icon: LANDMARK_ICONS[meta.landmark] || Award }
}
