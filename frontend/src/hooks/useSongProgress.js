import { useCallback, useState } from 'react'

const EMPTY_PROGRESS = { easy: { isComplete: false }, hard: { isComplete: false }, medium: { isComplete: false } }

function readProgress(songId) {
  const stored = localStorage.getItem(`songLessonProgress:${songId}`)
  if (!stored) return EMPTY_PROGRESS

  try {
    return { ...EMPTY_PROGRESS, ...JSON.parse(stored) }
  } catch {
    return EMPTY_PROGRESS
  }
}

function writeProgress(songId, progress) {
  localStorage.setItem(`songLessonProgress:${songId}`, JSON.stringify(progress))
}

// Tracks per-song, per-difficulty completion in localStorage under
// `songLessonProgress:<songId>`. Deliberately a new key prefix rather than
// the old lessonProgress:<id> shape — that one tracked completed
// call-and-response sections, which has no meaningful mapping onto "which
// difficulty tiers has this song's playback lesson been completed at".
export default function useSongProgress(songId) {
  const [progress, setProgress] = useState(() => readProgress(songId))

  // Completion is monotonic — replaying an already-completed difficulty
  // doesn't unmark it, there's no "un-complete" affordance by design.
  const markDifficultyComplete = useCallback(
    (difficulty) => {
      setProgress((current) => {
        if (current[difficulty]?.isComplete) return current

        const next = { ...current, [difficulty]: { completedAt: new Date().toISOString(), isComplete: true } }
        writeProgress(songId, next)
        return next
      })
    },
    [songId]
  )

  return { markDifficultyComplete, progress }
}
