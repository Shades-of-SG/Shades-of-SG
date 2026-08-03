const INSTRUMENT_CHALLENGE_IDS = ['three-notes', 'lowest-note', 'highest-note'];

const BADGE_CATALOG = [
    {
        name: 'Day One', category: 'Consistency', landmark: 'Merlion',
        description: 'Logged in for the first time.',
        isEarned: ({ loginStreak }) => loginStreak >= 1,
    },
    {
        name: '7-Day Streak', category: 'Consistency', landmark: 'Merlion',
        description: 'Logged in for 7 days in a row.',
        isEarned: ({ loginStreak }) => loginStreak >= 7,
    },
    {
        name: '30-Day Streak', category: 'Consistency', landmark: 'Merlion',
        description: 'Logged in for 30 days in a row.',
        isEarned: ({ loginStreak }) => loginStreak >= 30,
    },
    {
        name: 'Consistency Champion', category: 'Consistency', landmark: 'Merlion',
        description: 'Logged in for 50 days in a row.',
        isEarned: ({ loginStreak }) => loginStreak >= 50,
    },
    {
        name: 'Dedicated Learner', category: 'Consistency', landmark: 'Merlion',
        description: 'Logged in for 100 days in a row.',
        isEarned: ({ loginStreak }) => loginStreak >= 100,
    },
    {
        name: 'Thought Starter', category: 'Reflection', landmark: 'National Gallery',
        description: 'Submitted your first reflection.',
        isEarned: ({ reflectionCount }) => reflectionCount >= 1,
    },
    {
        name: 'Reflective Mind', category: 'Reflection', landmark: 'National Gallery',
        description: 'Submitted 5 reflections.',
        isEarned: ({ reflectionCount }) => reflectionCount >= 5,
    },
    {
        name: 'Deep Thinker', category: 'Reflection', landmark: 'National Gallery',
        description: 'Submitted 20 reflections.',
        isEarned: ({ reflectionCount }) => reflectionCount >= 20,
    },
    {
        name: 'Playground Virtuoso', category: 'Instrument Playground', landmark: 'Esplanade',
        description: 'Completed every fun challenge in the Instrument Playground.',
        isEarned: ({ instrumentChallengesCompleted }) => instrumentChallengesCompleted >= INSTRUMENT_CHALLENGE_IDS.length,
    },
];

module.exports = { BADGE_CATALOG, INSTRUMENT_CHALLENGE_IDS };
