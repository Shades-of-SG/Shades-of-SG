const INSTRUMENT_CHALLENGE_IDS = ['three-notes', 'lowest-note', 'highest-note'];

// Earning conditions only. Display metadata (description, category, sticker art) lives in the
// `badge_definitions` table (see migrations/026_badge_definitions.sql) so it isn't duplicated
// between backend and frontend code anymore.
const BADGE_CATALOG = [
    { name: 'Day One', isEarned: ({ loginStreak }) => loginStreak >= 1 },
    { name: '7-Day Streak', isEarned: ({ loginStreak }) => loginStreak >= 7 },
    { name: '30-Day Streak', isEarned: ({ loginStreak }) => loginStreak >= 30 },
    { name: 'Consistency Champion', isEarned: ({ loginStreak }) => loginStreak >= 50 },
    { name: 'Dedicated Learner', isEarned: ({ loginStreak }) => loginStreak >= 100 },
    { name: 'Thought Starter', isEarned: ({ reflectionCount }) => reflectionCount >= 1 },
    { name: 'Reflective Mind', isEarned: ({ reflectionCount }) => reflectionCount >= 5 },
    { name: 'Deep Thinker', isEarned: ({ reflectionCount }) => reflectionCount >= 20 },
    {
        name: 'Playground Virtuoso',
        isEarned: ({ instrumentChallengesCompleted }) => instrumentChallengesCompleted >= INSTRUMENT_CHALLENGE_IDS.length,
    },
    { name: 'First Song', isEarned: ({ songsExploredCount }) => songsExploredCount >= 1 },
    { name: 'Curious Bug', isEarned: ({ songsExploredCount }) => songsExploredCount >= 3 },
    { name: 'Song Explorer', isEarned: ({ songsExploredCount }) => songsExploredCount >= 5 },
];

module.exports = { BADGE_CATALOG, INSTRUMENT_CHALLENGE_IDS };
