const { SceneSegment } = require('../models')
const { DIFFICULTY_CONFIG } = require('../config/rhythm')
const { parseAndNormalizeBeatmap } = require('./beatmapValidator')
const { generateFallbackBeatmap } = require('./fallbackBeatmapGenerator')
const { getOpenAIClient } = require('./openaiClient')

const TARGET_NOTE_INTERVAL_MS = Object.freeze({ EASY: 4000, MEDIUM: 3000, HARD: 2000 })

function requireFullSongCoverage(beatmap, { difficulty, durationMs }) {
  const notes = beatmap.notes || []
  const minimumNotes = Math.max(4, Math.ceil(durationMs / TARGET_NOTE_INTERVAL_MS[difficulty]))
  const lastNoteMs = Math.max(...notes.map((note) => note.endMs || note.startMs), 0)
  if (notes.length < minimumNotes || lastNoteMs < durationMs * 0.9) {
    throw new Error(`Beatmap must cover the full song with at least ${minimumNotes} notes and activity through the final 10%.`)
  }
  return beatmap
}

function parseAiBeatmap(raw, options) {
  return requireFullSongCoverage(parseAndNormalizeBeatmap(raw, options), options)
}

function buildPrompt(song, difficulty, segments) {
  const config = DIFFICULTY_CONFIG[difficulty]
  return {
    system: `You design playable four-lane rhythm charts from supplied timing metadata. Return only JSON with difficulty, bpm, offsetMs, and notes. Each note has lane 0-3, integer startMs, type tap or hold; holds also have integer endMs. Do not imply waveform analysis. The chart must span the complete supplied duration, with notes distributed throughout the song and activity in its final 10%. Keep same-lane notes non-overlapping, at most ${config.maxSimultaneous} simultaneous notes, minimum pattern spacing about ${config.minGapMs}ms, hold duration ${config.holdMinMs}-${config.holdMaxMs}ms, and hold share about ${Math.round(config.holdChance * 100)}%.`,
    user: JSON.stringify({
      title: song.title,
      artist: song.artist || null,
      durationMs: song.durationSecs * 1000,
      bpm: song.bpm || null,
      difficulty,
      laneCount: 4,
      lyrics: song.rawLyrics || null,
      timingSource: segments.length ? 'scene-segment timestamps' : 'duration metadata',
      segments: segments.map((segment) => ({ startMs: Math.round(segment.startTime * 1000), endMs: Math.round(segment.endTime * 1000), lyrics: segment.lyrics || null })),
    }),
  }
}

async function requestAiBeatmap(song, difficulty, repair = null) {
  const segments = await SceneSegment.findAll({ where: { songId: song.id }, order: [['startTime', 'ASC']], attributes: ['startTime', 'endTime', 'lyrics'] })
  const prompt = buildPrompt(song, difficulty, segments)
  const response = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_BEATMAP_MODEL || 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.35,
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: repair ? `${prompt.user}\nThe prior response failed validation: ${repair.error}. Return a corrected complete JSON object.` : prompt.user },
    ],
  })
  return response.choices?.[0]?.message?.content
}

async function generateBeatmap(song, difficulty, { aiRequest = requestAiBeatmap } = {}) {
  const durationMs = Math.round(Number(song.durationSecs) * 1000)
  try {
    let raw = await aiRequest(song, difficulty)
    try {
      return { beatmap: parseAiBeatmap(raw, { difficulty, durationMs }), source: 'AI', aiError: null }
    } catch (firstError) {
      raw = await aiRequest(song, difficulty, { repair: true, error: firstError.message })
      return { beatmap: parseAiBeatmap(raw, { difficulty, durationMs }), source: 'AI', aiError: null }
    }
  } catch (error) {
    return {
      beatmap: generateFallbackBeatmap({ songId: song.id, difficulty, durationMs, bpm: song.bpm }),
      source: 'FALLBACK',
      aiError: String(error?.message || error).slice(0, 1000),
    }
  }
}

module.exports = { buildPrompt, generateBeatmap, requestAiBeatmap }
