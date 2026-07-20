import { getNoteProgress } from '../utils/rhythmTiming'

export const RHYTHM_LANES = [
  { key: 'd', label: 'D', color: '#ff4d8d' },
  { key: 'f', label: 'F', color: '#f59e0b' },
  { key: 'j', label: 'J', color: '#a855f7' },
  { key: 'k', label: 'K', color: '#38bdf8' },
]

const HIT_LINE_RATIO = 0.84

function resizeCanvas(canvas) {
  const parent = canvas.parentElement
  const width = parent.clientWidth
  const height = parent.clientHeight
  const scale = window.devicePixelRatio || 1
  canvas.width = Math.floor(width * scale)
  canvas.height = Math.floor(height * scale)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const context = canvas.getContext('2d')
  context.setTransform(scale, 0, 0, scale, 0, 0)
  return { context, height, width }
}

export function drawGame(canvas, notes, songTimeMs, difficulty, pressedLanes, noteSpeed = 1) {
  if (!canvas) return
  const { context, height, width } = resizeCanvas(canvas)
  const laneWidth = width / RHYTHM_LANES.length
  const hitLineY = height * HIT_LINE_RATIO
  context.clearRect(0, 0, width, height)
  context.fillStyle = 'rgba(5, 4, 18, 0.8)'
  context.fillRect(0, 0, width, height)

  RHYTHM_LANES.forEach((lane, index) => {
    const x = index * laneWidth
    context.fillStyle = pressedLanes.has(index) ? `${lane.color}2c` : index % 2 ? 'rgba(20,12,35,.48)' : 'rgba(7,8,24,.48)'
    context.fillRect(x, 0, laneWidth, height)
    context.strokeStyle = 'rgba(255,255,255,.14)'
    context.strokeRect(x, 0, laneWidth, height)
    context.fillStyle = pressedLanes.has(index) ? lane.color : 'rgba(255,255,255,.14)'
    context.shadowBlur = pressedLanes.has(index) ? 22 : 0
    context.shadowColor = lane.color
    context.fillRect(x + 9, hitLineY - 8, laneWidth - 18, 58)
    context.shadowBlur = 0
    context.fillStyle = '#fff'
    context.font = '900 24px Inter, sans-serif'
    context.textAlign = 'center'
    context.fillText(lane.label, x + laneWidth / 2, hitLineY + 29)
  })

  for (const note of notes) {
    if (!['pending', 'holding'].includes(note.status)) continue
    const holding = note.status === 'holding'
    const progress = getNoteProgress(note.startMs, songTimeMs, difficulty, noteSpeed)
    if (progress < -0.1 || (!holding && progress > 1.22)) continue
    const lane = RHYTHM_LANES[note.lane]
    const x = note.lane * laneWidth + laneWidth * 0.1
    const noteWidth = laneWidth * 0.8
    // Once caught, the hold head stays on the hit line while the remaining
    // body travels toward it instead of being culled below the play field.
    const headY = holding ? hitLineY : progress * hitLineY
    if (note.type === 'hold') {
      const tailProgress = getNoteProgress(note.endMs, songTimeMs, difficulty, noteSpeed)
      const tailY = holding ? Math.min(tailProgress * hitLineY, hitLineY) : tailProgress * hitLineY
      const top = Math.min(headY, tailY)
      const bodyHeight = Math.max(16, Math.abs(headY - tailY))
      context.fillStyle = `${lane.color}72`
      context.fillRect(x + noteWidth * 0.22, top, noteWidth * 0.56, bodyHeight)
      context.strokeStyle = `${lane.color}dd`
      context.lineWidth = 2
      context.strokeRect(x + noteWidth * 0.22, top, noteWidth * 0.56, bodyHeight)
      context.fillStyle = lane.color
      context.fillRect(x, tailY - 7, noteWidth, 14)
    }
    const gradient = context.createLinearGradient(x, headY, x + noteWidth, headY)
    gradient.addColorStop(0, '#fff')
    gradient.addColorStop(0.2, lane.color)
    gradient.addColorStop(1, lane.color)
    context.fillStyle = gradient
    context.shadowBlur = holding ? 30 : 18
    context.shadowColor = lane.color
    context.fillRect(x, headY - 11, noteWidth, 22)
    context.shadowBlur = 0
  }
}
