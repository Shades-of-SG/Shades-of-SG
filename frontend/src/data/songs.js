// Single source of truth for the Guided Music Lessons song catalogue.
//
// Every song exposes the exact same shape — { id, title, subtitle,
// description, icon, keySignature, year, difficulties: { easy, medium, hard } }
// — so the page/player components never special-case an individual song.
// Adding song #8 later means appending one object built the same way as the
// ones below; nothing else in the feature needs to change.
//
// Note sequences are simplified, illustrative arrangements written for this
// learning demo, grounded in each song's real key/chords/tempo where that
// information was available — they are not verbatim transcriptions of the
// real recordings (same basis as this feature's original "Count On Me,
// Singapore" lesson). Any `isEstimate: true` BPM means no confirmed tempo
// was found at authoring time; a plausible value was chosen for the song's
// genre and mood instead.
//
// Each note is `{ label, frequency }` — a self-contained pitch, not a
// lookup key into the chosen instrument's own note list. That's what lets
// every song play on every instrument (piano's 8 notes, angklung's 5,
// kompang's unpitched hits, etc.) without any song depending on a specific
// instrument's range — see hooks/useInstrumentAudio.js's playNote(), which
// only ever needs a note's own frequency/label.
//
// --- How each difficulty is generated from one melody -----------------
// Every song is authored once, as 4 measures of 4 melody pitches each (the
// 4th slot of the last measure is `null`, a closing rest), plus the 4
// chords that harmonize those measures. The three difficulties are then
// built mechanically from that single definition:
//   - Easy   — one steady beat per pitch. Simplest possible melody.
//   - Medium — the same pitches, but one measure-per-measure passing note
//              is added by splitting a note into a repeated eighth-note
//              pair (odd measures split the 1st note, even measures split
//              the 2nd, for rhythmic variety) — more notes, harder rhythm,
//              same simple melody.
//   - Hard   — the same rhythm as Easy, but the downbeat (first note) of
//              every measure becomes a chord: the melody note plus that
//              measure's harmony triad, deduplicated by label — simple
//              melody, now with chords under it.
// This guarantees the three tiers stay musically consistent with each
// other and with the "Easy = simple melody / Medium = simple melody with
// harder rhythm / Hard = simple melody with chords" spec, for every song,
// without hand-writing ~340 note objects by hand.

// A small shared note dictionary — reused by reference across songs so
// every "D4" in this file is the exact same { label, frequency } values
// (frequencies are the standard 12-TET A4=440Hz table, matching the values
// already used in data/instruments.js). Sharp notes use an "s" in their key
// (Fs4) since "#" isn't a valid identifier char, but keep "#" in the label
// string that's actually shown/played.
const N = {
  A4: { frequency: 440.00, label: 'A4' },
  B4: { frequency: 493.88, label: 'B4' },
  Bb4: { frequency: 466.16, label: 'Bb4' },
  C4: { frequency: 261.63, label: 'C4' },
  C5: { frequency: 523.25, label: 'C5' },
  Cs5: { frequency: 554.37, label: 'C#5' },
  D4: { frequency: 293.66, label: 'D4' },
  D5: { frequency: 587.33, label: 'D5' },
  E4: { frequency: 329.63, label: 'E4' },
  E5: { frequency: 659.25, label: 'E5' },
  F4: { frequency: 349.23, label: 'F4' },
  F5: { frequency: 698.46, label: 'F5' },
  Fs4: { frequency: 369.99, label: 'F#4' },
  Fs5: { frequency: 739.99, label: 'F#5' },
  G4: { frequency: 392.00, label: 'G4' },
  G5: { frequency: 783.99, label: 'G5' },
}

// Major/minor triads built from the dictionary above, used to harmonize
// each song's Hard-difficulty chord steps.
const CHORDS = {
  A: [N.A4, N.Cs5, N.E5],
  Am: [N.A4, N.C5, N.E5],
  Bb: [N.Bb4, N.D5, N.F5],
  Bm: [N.B4, N.D5, N.Fs5],
  C: [N.C4, N.E4, N.G4],
  D: [N.D4, N.Fs4, N.A4],
  Em: [N.E4, N.G4, N.B4],
  F: [N.F4, N.A4, N.C5],
  G: [N.G4, N.B4, N.D5],
}

function note(measure, beats, notes, type = 'note') {
  return { beats, measure, notes, type }
}

function rest(measure, beats = 1) {
  return { beats, measure, notes: [], type: 'rest' }
}

// Easy: one steady beat per melody pitch. `measures` is 4 groups of 4
// pitches (the last slot of the last measure is `null` for a closing rest).
function buildEasySteps(measures) {
  return measures.flatMap((pitches, index) => {
    const measure = index + 1
    return pitches.map((pitch) => (pitch ? note(measure, 1, [pitch]) : rest(measure)))
  })
}

// Medium: the same 4 pitches per measure, but one note is split into a
// repeated eighth-note pair (odd measures split the 1st note, even measures
// split the 2nd) — one extra note per measure, a harder subdivision to
// count, the same simple melody.
function buildMediumSteps(measures) {
  return measures.flatMap((pitches, index) => {
    const measure = index + 1
    const [p1, p2, p3, p4] = pitches
    const tail = p4 ? [note(measure, 1, [p4])] : [rest(measure)]

    return measure % 2 === 1
      ? [note(measure, 0.5, [p1]), note(measure, 0.5, [p1]), note(measure, 1, [p2]), note(measure, 1, [p3]), ...tail]
      : [note(measure, 1, [p1]), note(measure, 0.5, [p2]), note(measure, 0.5, [p2]), note(measure, 1, [p3]), ...tail]
  })
}

// Hard: same rhythm as Easy, but every measure's downbeat becomes a chord —
// the melody note plus that measure's harmony triad, deduplicated by label
// so a melody note that's already in the triad doesn't play twice.
function buildHardSteps(measures, chords) {
  return measures.flatMap((pitches, index) => {
    const measure = index + 1
    const [p1, p2, p3, p4] = pitches
    const triad = chords[index]
    const chordNotes = [p1, ...triad].filter(
      (candidate, candidateIndex, all) => all.findIndex((other) => other.label === candidate.label) === candidateIndex
    )
    const tail = p4 ? [note(measure, 1, [p4])] : [rest(measure)]

    return [note(measure, 1, chordNotes, 'chord'), note(measure, 1, [p2]), note(measure, 1, [p3]), ...tail]
  })
}

// Builds the { easy, medium, hard } trio for one song from its melody,
// harmony, tempo, and per-difficulty practice tips.
function buildDifficulties({ bpm, chords, isEstimate, measures, tips }) {
  const shared = { beatsPerMeasure: 4, bpm, isEstimate, timeSignature: '4/4', totalMeasures: measures.length }

  return {
    easy: { ...shared, difficulty: 'easy', label: 'Easy', practiceTips: tips.easy, steps: buildEasySteps(measures) },
    hard: { ...shared, difficulty: 'hard', label: 'Hard', practiceTips: tips.hard, steps: buildHardSteps(measures, chords) },
    medium: { ...shared, difficulty: 'medium', label: 'Medium', practiceTips: tips.medium, steps: buildMediumSteps(measures) },
  }
}

export const SONGS = [
  {
    description: 'A bright, unifying anthem — its opening phrase rises steadily through a simple D major scale.',
    difficulties: buildDifficulties({
      bpm: 105,
      chords: [CHORDS.D, CHORDS.G, CHORDS.A, CHORDS.D],
      isEstimate: false,
      measures: [
        [N.D4, N.D4, N.E4, N.Fs4],
        [N.G4, N.Fs4, N.E4, N.D4],
        [N.A4, N.A4, N.G4, N.Fs4],
        [N.E4, N.D4, N.D4, null],
      ],
      tips: {
        easy: [
          "Hold each note for a full beat at this song's 105 BPM — there's no rush.",
          'Notice the melody rises from D up to F#, then settles back down — that upward shape is the hopeful opening phrase.',
        ],
        hard: [
          'The first note of every measure is now a full chord — practice just those four chords (D, G, A, D) before adding the rest of the phrase.',
          "D-G-A-D is one of the most common progressions in pop and folk music — once it's under your fingers here, you'll recognise it everywhere.",
        ],
        medium: [
          'Listen for the quick two-note pickup at the start of measures 1 and 3 — that eighth-note pair is what makes this trickier than Easy.',
          'Count the pickup beats under your breath for those measures until the split feels natural.',
        ],
      },
    }),
    icon: '🎆',
    id: 'our-singapore',
    keySignature: 'D major',
    subtitle: 'NDP 2019 Theme Song',
    title: 'Our Singapore',
    year: 2019,
  },
  {
    description: 'An energetic march that looks ahead with hope — practice the four-chord motif that drives its chorus.',
    difficulties: buildDifficulties({
      bpm: 129,
      chords: [CHORDS.D, CHORDS.G, CHORDS.Bm, CHORDS.A],
      isEstimate: false,
      measures: [
        [N.D4, N.Fs4, N.A4, N.A4],
        [N.B4, N.A4, N.G4, N.G4],
        [N.B4, N.D5, N.D5, N.B4],
        [N.Cs5, N.B4, N.A4, null],
      ],
      tips: {
        easy: [
          'This one moves quickly at 129 BPM — start slower than you think you need to, then build up to speed.',
          'The phrase climbs from D up toward D5 before settling on A — that rise is the looking-ahead feeling in the title.',
        ],
        hard: [
          "D-G-Bm-A is this song's real chorus progression — practice it as plain chords first, away from the melody.",
          'The Bm chord (measure 3) is the only minor chord here — notice how it briefly shifts the mood before A brings it back up.',
        ],
        medium: [
          'The eighth-note pickups land on beat 2 in the even measures this time — listen closely to where they sit.',
          'Keep the tempo steady even through the subdivided notes — a march never rushes.',
        ],
      },
    }),
    icon: '🌅',
    id: 'tomorrows-here-today',
    keySignature: 'D major (recorded in E; shown here transposed for easier fingering)',
    subtitle: 'NDP 2016 Theme Song',
    title: "Tomorrow's Here Today",
    year: 2016,
  },
  {
    description: 'A gentle, reassuring anthem — a calm, repeating melody built for steady, unhurried practice.',
    difficulties: buildDifficulties({
      bpm: 96,
      chords: [CHORDS.F, CHORDS.C, CHORDS.G, CHORDS.Am],
      isEstimate: true,
      measures: [
        [N.A4, N.A4, N.C5, N.C5],
        [N.G4, N.G4, N.E4, N.E4],
        [N.D5, N.D5, N.B4, N.B4],
        [N.C5, N.B4, N.A4, null],
      ],
      tips: {
        easy: [
          'Every pair of notes here repeats — let each repeated note breathe instead of rushing to the next pair.',
          'The melody settles down step by step in the final measure, like a reassuring exhale.',
        ],
        hard: [
          'F-C-G-Am is a very common pop progression — once these four chords feel comfortable, try humming the melody over them.',
          'Each downbeat chord shares a note with the melody above it — that shared note is why they sound so settled together.',
        ],
        medium: [
          'The repeated-note pairs from Easy now split unevenly — some measures split the first note, some the second. Listen before you play.',
          'This is a calmer song, so keep the added notes soft rather than punchy.',
        ],
      },
    }),
    icon: '🌤️',
    id: 'youll-be-okay',
    keySignature: 'C major',
    subtitle: 'NDP 2026 Theme Song',
    title: "You'll Be Okay",
    year: 2026,
  },
  {
    description: 'A story of growth from self-doubt to confidence — its melody climbs steadily from a small opening to a soaring finish.',
    difficulties: buildDifficulties({
      bpm: 100,
      chords: [CHORDS.G, CHORDS.D, CHORDS.Em, CHORDS.C],
      isEstimate: true,
      measures: [
        [N.D4, N.D4, N.E4, N.G4],
        [N.A4, N.A4, N.B4, N.D5],
        [N.B4, N.D5, N.E5, N.G5],
        [N.G5, N.E5, N.C5, null],
      ],
      tips: {
        easy: [
          "The melody starts low and climbs measure by measure, all the way up to G5 — that rise mirrors the song's growing-into-a-giant idea.",
          "Don't strain for the high notes in measure 3 — a lighter touch carries just as well.",
        ],
        hard: [
          "Each measure's chord (G, D, Em, C) lifts the melody higher than the one before it — play the four chords alone first to feel that lift.",
          "The final chord's melody note sits a full octave above the chord underneath it — that's the soaring moment of the phrase.",
        ],
        medium: [
          'The extra note in each measure adds momentum as the melody climbs — think of it as a small push upward, not a pause.',
          'Measures 3 and 4 reach the highest notes in this whole lesson — take them slowly at first.',
        ],
      },
    }),
    icon: '🏔️',
    id: 'giants-2026',
    keySignature: 'G major (recorded in Ab; shown here transposed for easier fingering)',
    subtitle: 'NDP 2026 Theme Song',
    title: 'Giants (2026)',
    year: 2026,
  },
  {
    description: 'A beloved anthem of unity — learn its opening phrase, chorus motif, and closing line.',
    difficulties: buildDifficulties({
      bpm: 92,
      chords: [CHORDS.C, CHORDS.G, CHORDS.C, CHORDS.G],
      isEstimate: true,
      measures: [
        [N.C4, N.C4, N.D4, N.E4],
        [N.G4, N.A4, N.G4, N.E4],
        [N.C4, N.E4, N.F4, N.G4],
        [N.G4, N.F4, N.E4, null],
      ],
      tips: {
        easy: [
          'Notice how each note feels bright and resolved — that upward, hopeful feeling comes from a major scale.',
          'Play C, E, and G together once you know the melody — that chord is the foundation beneath this whole phrase.',
        ],
        hard: [
          'Every downbeat chord here is either C or G, alternating — that back-and-forth is one of the oldest, most recognisable progressions in music.',
          'This closing phrase echoes a pattern from earlier in the song — repetition is what makes a melody feel familiar.',
        ],
        medium: [
          'The opening two notes now split into a quick pair — same melody, just with a livelier bounce.',
          'Keep the subdivided notes light and even, not rushed.',
        ],
      },
    }),
    icon: '🎵',
    id: 'count-on-me',
    keySignature: 'C major',
    subtitle: 'A National Day favourite',
    title: 'Count On Me, Singapore',
    year: null,
  },
  {
    description: 'A heartfelt tribute to Singapore as home, written by Dick Lee.',
    difficulties: buildDifficulties({
      bpm: 74,
      chords: [CHORDS.F, CHORDS.Bb, CHORDS.C, CHORDS.F],
      isEstimate: true,
      measures: [
        [N.F4, N.F4, N.G4, N.A4],
        [N.Bb4, N.A4, N.G4, N.F4],
        [N.C5, N.Bb4, N.A4, N.G4],
        [N.F4, N.E4, N.D4, null],
      ],
      tips: {
        easy: [
          'This is a slow, warm ballad — let each note ring out fully rather than clipping it short.',
          'The melody gently rises then descends across the four measures, like a long, comfortable breath.',
        ],
        hard: [
          "F-Bb-C-F is a warm, homely progression — try playing just the chords slowly while picturing the song's gentle mood.",
          'The C chord in measure 3 briefly brightens the melody before it settles back home on F — notice that lift.',
        ],
        medium: [
          'Even with the added notes, keep this one soft and unhurried — a ballad never feels rushed, even when the rhythm gets busier.',
          'The eighth-note pairs here should feel like a gentle sway, not a sharp accent.',
        ],
      },
    }),
    icon: '🏠',
    id: 'home',
    keySignature: 'F major',
    subtitle: 'A National Day favourite',
    title: 'Home',
    year: null,
  },
  {
    description: 'A rousing march that calls on every Singaporean to stand up for the nation.',
    difficulties: buildDifficulties({
      bpm: 126,
      chords: [CHORDS.C, CHORDS.F, CHORDS.G, CHORDS.C],
      isEstimate: true,
      measures: [
        [N.C4, N.E4, N.G4, N.C5],
        [N.C5, N.A4, N.F4, N.A4],
        [N.G4, N.B4, N.D5, N.B4],
        [N.C5, N.G4, N.C4, null],
      ],
      tips: {
        easy: [
          'The opening measure is a rising C major chord played one note at a time — a classic, confident march opening.',
          'Play with a strong, steady beat, like a marching band keeping time.',
        ],
        hard: [
          'C-F-G-C is a march-band staple — practice the four downbeat chords on their own with a firm, even attack.',
          "Notice how the melody often jumps between notes of the same chord rather than stepping smoothly — that's a classic march technique.",
        ],
        medium: [
          'At this tempo, the added subdivisions go by fast — practice slower than 126 BPM first, then build up speed.',
          'Keep every note crisp and even, the way a marching band would.',
        ],
      },
    }),
    icon: '🇸🇬',
    id: 'stand-up-for-singapore',
    keySignature: 'C major',
    subtitle: 'A National Day favourite',
    title: 'Stand Up for Singapore',
    year: null,
  },
]

export function getSongById(id) {
  return SONGS.find((song) => song.id === id)
}

export function getDifficultyVariant(song, difficultyKey) {
  return song?.difficulties?.[difficultyKey]
}
