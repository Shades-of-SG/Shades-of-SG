// Small pure helpers for turning a song difficulty's step data + BPM into
// real millisecond durations. Kept separate from useSequencePlayer.js so the
// math (and its tests) don't depend on React/hooks at all.

export function getStepDurationMs(step, bpm) {
  return (step.beats * 60000) / bpm
}

export function getSequenceDurationMs(steps, bpm) {
  return steps.reduce((total, step) => total + getStepDurationMs(step, bpm), 0)
}

// Formats a millisecond duration as e.g. "0:42" for display on a difficulty
// picker card.
export function formatDuration(durationMs) {
  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
