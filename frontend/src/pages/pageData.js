export const sampleSongs = [
  {
    description: 'A bright placeholder track for food courts, festivals, and familiar evening walks.',
    id: 'demo-song',
    initials: 'DS',
    theme: 'Heritage',
    title: 'Demo Song',
  },
  {
    description: 'A reflective song space for memory, language, and neighborhood stories.',
    id: 'kampong-light',
    initials: 'KL',
    theme: 'Memory',
    title: 'Kampong Light',
  },
  {
    description: 'A rhythmic sample for instruments, movement, and playful cultural learning.',
    id: 'city-pulse',
    initials: 'CP',
    theme: 'Rhythm',
    title: 'City Pulse',
  },
]

export const creatorSongs = [
  {
    badge: 'Published',
    description: 'Violet Tay',
    id: 'demo-song',
    initials: 'DS',
    lyrics:
      "[Verse 1]\nMorning light spills over shophouse tin roofs,\nCoffee shop uncles trading yesterday's news.\nThe MRT hums a low familiar tune,\nHome sounds the same under a heartland moon.\n\n[Chorus]\nThis is my island, my kampong of steel and green,\nEvery corner holds a memory I've seen.\nFrom Toa Payoh to the Singapore River bend,\nThis is home, from the start to the end.",
    status: 'Published',
    title: 'Song #1',
  },
  {
    badge: 'Processing video generation',
    description: 'Violet Tay',
    id: 'kampong-light',
    initials: 'KL',
    lyrics:
      "[Verse 1]\nLantern glow on a five-foot way,\nGrandma's stories keep the dark at bay.\nDialect words I'm slowly learning still,\nEchoes of a kampong on the hill.\n\n[Verse 2]\nCity lights replaced the old kelong,\nBut in my chest the old tune plays along.\nKampong light, don't fade away,\nHold the stories for another day.",
    progress: 50,
    status: 'Processing',
    title: 'Song #2',
  },
  {
    badge: 'Published',
    description: 'Violet Tay',
    id: 'city-pulse',
    initials: 'CP',
    lyrics:
      "[Verse 1]\nDrumbeats bounce off the hawker stalls,\nRhythm bouncing down shopping mall halls.\nEvery language mixing in the air,\nCity pulse beating everywhere.\n\n[Chorus]\nFeel the rhythm, feel the drive,\nThis little red dot is so alive.\nFrom Chinatown to Kampong Glam,\nWe move as one, however we can.",
    status: 'Published',
    title: 'Song #3',
  },
  {
    badge: 'Draft',
    description: 'Violet Tay',
    id: 'sunset-ferry',
    initials: 'SF',
    lyrics: '',
    status: 'Draft',
    title: 'Song #4',
  },
]

export const songStatusFilters = ['All', 'Published', 'Drafts', 'Processing', 'Archived']

export const songFilterStatusMap = {
  Archived: 'Archived',
  Drafts: 'Draft',
  Processing: 'Processing',
  Published: 'Published',
}

export const placeholderCards = {
  achievements: ['First Reflection', 'Rhythm Starter', 'Culture Explorer'],
  logs: ['Frame generation queued', 'Audio analysis pending', 'Review required before publish'],
  moderation: ['Pending reflections', 'Approved reflections', 'Flagged reflections'],
  resources: ['Oral history notes', 'Instrument guide', 'Timeline references'],
}
