import { Award, BookOpen, Flag, Heart, Landmark, Music2 } from 'lucide-react'

export const BADGE_DEFINITIONS = {
  'First Memory': { category: 'Reflection', description: 'Shared your first reflection.', icon: Heart },
  'Rhythm Rookie': { category: 'Rhythm', description: 'Completed your first rhythm game.', icon: Music2 },
  'Heritage Explorer': { category: 'Learning', description: 'Explored Singapore’s musical heritage.', icon: BookOpen },
  'Chinatown Storyteller': { category: 'Culture', description: 'Discovered a Chinatown-inspired story.', icon: Landmark },
  'National Day Contributor': { category: 'Community', description: 'Joined a National Day memory experience.', icon: Flag },
}

export function badgePresentation(name) {
  return BADGE_DEFINITIONS[name] || { category: 'Journey', description: 'A keepsake collected during your Shades of SG journey.', icon: Award }
}
