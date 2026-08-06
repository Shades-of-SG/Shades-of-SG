// Single source of truth for the Instrument Discovery Lab's 5 instruments.
// This used to be duplicated between InstrumentDiscoveryLab.jsx and
// songExperienceInstrumentFallbacks.js — adding instrument #6 now means
// appending one object here, nothing else needs to change structurally.
//
// No `samples` key is set here — real audio (where sourced) is hydrated onto
// these objects at runtime by hooks/useLabInstruments.js, which merges in
// whatever `GET /api/instruments/lab-samples` returns. Until that resolves
// (or for any note it doesn't cover), every note plays its synthesized
// oscillator tone via useInstrumentAudio.js — no loading state needed.
export const INSTRUMENTS = [
  {
    description:
      'A versatile keyboard instrument capable of playing full harmonies and melodies — a familiar starting point for musical exploration.',
    envelope: 'sustained',
    facts: {
      contribution: "A common thread across Singapore's diverse musical traditions and music education.",
      historicalFact: "The piano's name comes from 'pianoforte' — Italian for 'soft-loud' — describing its dynamic range.",
      origin: 'Originated in Italy around 1700; adopted worldwide.',
      role: 'Provides melody, harmony, and rhythm all at once.',
      whenPlayed: 'Used across nearly every genre, from classical to contemporary Singaporean pop.',
    },
    icon: '🎹',
    id: 'piano',
    melody: ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4'],
    name: 'Piano',
    notes: [
      { frequency: 261.63, key: 'a', label: 'C4' },
      { frequency: 293.66, key: 's', label: 'D4' },
      { frequency: 329.63, key: 'd', label: 'E4' },
      { frequency: 349.23, key: 'f', label: 'F4' },
      { frequency: 392, key: 'g', label: 'G4' },
      { frequency: 440, key: 'h', label: 'A4' },
      { frequency: 493.88, key: 'j', label: 'B4' },
      { frequency: 523.25, key: 'k', label: 'C5' },
    ],
    origin: 'Western / Global',
    waveform: 'triangle',
  },
  {
    description:
      'A bamboo instrument shaken to produce a note, traditionally played together in ensembles where each person holds just one pitch.',
    envelope: 'sustained',
    facts: {
      contribution: "A symbol of teamwork and harmony within Singapore's Malay community.",
      historicalFact: 'In 2010, UNESCO recognised the angklung as an Intangible Cultural Heritage of Humanity.',
      origin: 'Rooted in Malay and Indonesian-Malay musical traditions of Southeast Asia.',
      role: 'Each angklung produces one note; players work together to create a melody.',
      whenPlayed: 'Featured in school performances, cultural festivals, and community events.',
    },
    icon: '🎋',
    id: 'angklung',
    melody: ['C4', 'D4', 'F4', 'G4', 'A4', 'G4', 'F4'],
    name: 'Angklung',
    notes: [
      { frequency: 261.63, key: 'a', label: 'C4' },
      { frequency: 293.66, key: 's', label: 'D4' },
      { frequency: 349.23, key: 'd', label: 'F4' },
      { frequency: 392, key: 'f', label: 'G4' },
      { frequency: 440, key: 'g', label: 'A4' },
    ],
    origin: 'Malay heritage, Southeast Asia',
    waveform: 'triangle',
  },
  {
    description: 'A handheld frame drum played in lively ensembles at Malay weddings and festive processions.',
    envelope: 'percussive',
    facts: {
      contribution: "Brings energetic, communal rhythm to Singapore's multicultural celebrations.",
      historicalFact: 'Kompang ensembles traditionally perform to welcome a wedding couple as they arrive.',
      origin: 'A Malay hand drum found across Singapore, Malaysia, and Indonesia.',
      role: 'Played in rhythmic ensembles, often accompanying songs and processions.',
      whenPlayed: 'Weddings, National Day performances, and community celebrations.',
    },
    icon: '🥁',
    id: 'kompang',
    melody: ['Low', 'Mid', 'High', 'Slap', 'Mid', 'Low'],
    name: 'Kompang',
    notes: [
      { frequency: 110, key: 'a', label: 'Low' },
      { frequency: 146.83, key: 's', label: 'Mid' },
      { frequency: 196, key: 'd', label: 'High' },
      { frequency: 246.94, key: 'f', label: 'Slap' },
    ],
    origin: 'Malay heritage, Southeast Asia',
    waveform: 'square',
  },
  {
    description: 'A two-stringed bowed instrument known for its expressive, voice-like tone in Chinese music.',
    envelope: 'sustained',
    facts: {
      contribution: "Represents the Chinese community's musical heritage within Singapore's soundscape.",
      historicalFact: 'The erhu has only two strings, yet skilled players can mimic laughter, crying, and even birdsong.',
      origin: 'Originated in China over a thousand years ago.',
      role: 'Often carries the main melody, prized for its expressive, voice-like sound.',
      whenPlayed: 'Chinese orchestras, festivals, and Chinese New Year performances.',
    },
    icon: '🎻',
    id: 'erhu',
    melody: ['G4', 'B4', 'D5', 'E5', 'D5', 'B4', 'G4'],
    name: 'Erhu',
    notes: [
      { frequency: 392, key: 'a', label: 'G4' },
      { frequency: 440, key: 's', label: 'A4' },
      { frequency: 493.88, key: 'd', label: 'B4' },
      { frequency: 523.25, key: 'f', label: 'C5' },
      { frequency: 587.33, key: 'g', label: 'D5' },
      { frequency: 659.25, key: 'h', label: 'E5' },
    ],
    origin: 'Chinese heritage',
    waveform: 'sawtooth',
  },
  {
    description: 'A pair of hand drums central to Indian classical and devotional music, played with intricate finger and palm strokes.',
    envelope: 'percussive',
    facts: {
      contribution: "Adds the rhythmic heartbeat of Singapore's Indian community to its musical identity.",
      historicalFact: "Tabla players learn spoken rhythmic syllables, called 'bols', before ever touching the drums.",
      origin: 'A cornerstone of North Indian classical music.',
      role: 'Provides intricate rhythmic patterns that anchor a performance.',
      whenPlayed: 'Indian classical concerts, Deepavali celebrations, and devotional music.',
    },
    icon: '🪘',
    id: 'tabla',
    melody: ['Dha', 'Ge', 'Na', 'Tin', 'Na', 'Dha'],
    name: 'Tabla',
    notes: [
      { frequency: 130.81, key: 'a', label: 'Dha' },
      { frequency: 164.81, key: 's', label: 'Ge' },
      { frequency: 196, key: 'd', label: 'Na' },
      { frequency: 261.63, key: 'f', label: 'Tin' },
    ],
    origin: 'Indian heritage, South Asia',
    waveform: 'sine',
  },
]

export function getInstrumentById(id) {
  return INSTRUMENTS.find((instrument) => instrument.id === id)
}
