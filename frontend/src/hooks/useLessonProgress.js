import { useCallback, useState } from 'react'

function readProgress(lessonId) {
  const stored = localStorage.getItem(`lessonProgress:${lessonId}`)
  return stored ? JSON.parse(stored) : { completedSections: 0, isComplete: false }
}

function writeProgress(lessonId, progress) {
  localStorage.setItem(`lessonProgress:${lessonId}`, JSON.stringify(progress))
}

export default function useLessonProgress(lessonId) {
  const [progress, setProgress] = useState(() => readProgress(lessonId))

  const markSectionComplete = useCallback(
    (sectionIndex, totalSections) => {
      setProgress((current) => {
        const completedSections = Math.max(current.completedSections, sectionIndex + 1)
        const next = { completedSections, isComplete: completedSections >= totalSections }
        writeProgress(lessonId, next)
        return next
      })
    },
    [lessonId]
  )

  const resetProgress = useCallback(() => {
    const next = { completedSections: 0, isComplete: false }
    writeProgress(lessonId, next)
    setProgress(next)
  }, [lessonId])

  return { markSectionComplete, progress, resetProgress }
}
