import { getNoteProgress } from '../utils/rhythmTiming'

export function getHoldRenderGeometry(note, songTimeMs, difficulty, noteSpeed, hitLineY) {
  const headProgress = getNoteProgress(note.startMs, songTimeMs, difficulty, noteSpeed)
  const tailProgress = getNoteProgress(note.endMs, songTimeMs, difficulty, noteSpeed)
  const headY = note.status === 'holding' ? hitLineY : headProgress * hitLineY
  const tailY = note.status === 'holding'
    ? Math.min(tailProgress * hitLineY, hitLineY)
    : tailProgress * hitLineY

  return {
    bodyHeight: Math.max(16, Math.abs(headY - tailY)),
    headY,
    tailY,
    top: Math.min(headY, tailY),
  }
}
