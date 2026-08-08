const { requestDeepSeekJson } = require('./deepseekJsonService')

const SECTION_TYPES = Object.freeze([
  'intro', 'verse', 'pre_chorus', 'chorus', 'post_chorus', 'bridge',
  'instrumental', 'interlude', 'breakdown', 'solo', 'outro', 'other',
])
const SECTION_TYPE_SET = new Set(SECTION_TYPES)

function sectionValidationError(message) {
  const error = new Error(message)
  error.name = 'SongSectionValidationError'
  return error
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function cleanLyrics(value) {
  return String(value || '').replace(/\r\n?/g, '\n').trim()
}

function transcriptDuration(segments) {
  return Math.max(0, ...segments.map((segment) => Number(segment.end) || 0))
}

function resolveDurationSecs(durationSecs, segments) {
  const configured = Number(durationSecs)
  const inferred = transcriptDuration(segments)
  if (Number.isFinite(configured) && configured > 0) return Math.max(configured, inferred)
  if (inferred > 0) return inferred
  throw sectionValidationError('A valid audio duration is required for song-section analysis.')
}

function normalizeForComparison(value) {
  return cleanText(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function defaultLabel(type) {
  return type.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')
}

function validateSongSections(input, {
  durationSecs,
  enforceTranscriptLyrics = true,
  transcriptSegments = [],
} = {}) {
  const rawSections = Array.isArray(input) ? input : input?.sections
  if (!Array.isArray(rawSections) || rawSections.length === 0) {
    throw sectionValidationError('Song-section JSON must contain a non-empty sections array.')
  }

  const resolvedDuration = resolveDurationSecs(durationSecs, transcriptSegments)
  const transcriptText = normalizeForComparison(
    transcriptSegments.map((segment) => cleanText(segment.text)).filter(Boolean).join(' ')
  )
  const sections = rawSections.map((raw, index) => {
    const type = String(raw?.type || '').toLowerCase()
    const startTime = Number(raw?.startTime)
    const endTime = Number(raw?.endTime)
    const confidence = Number(raw?.confidence)
    const lyrics = cleanLyrics(raw?.lyrics)
    const reason = cleanText(raw?.reason)

    if (!SECTION_TYPE_SET.has(type)) throw sectionValidationError(`Section ${index + 1} has an unsupported type.`)
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime < 0 || startTime >= endTime) {
      throw sectionValidationError(`Section ${index + 1} has invalid timestamps.`)
    }
    if (endTime > resolvedDuration + 0.01) throw sectionValidationError(`Section ${index + 1} exceeds the audio duration.`)
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw sectionValidationError(`Section ${index + 1} has invalid confidence.`)
    }
    if (!reason) throw sectionValidationError(`Section ${index + 1} must explain the recommendation.`)
    if (enforceTranscriptLyrics && lyrics) {
      const normalizedLyrics = normalizeForComparison(lyrics)
      if (!normalizedLyrics || !transcriptText.includes(normalizedLyrics)) {
        throw sectionValidationError(`Section ${index + 1} contains lyrics that are not present in the transcript.`)
      }
    }

    return {
      type,
      label: cleanText(raw?.label) || defaultLabel(type),
      startTime,
      endTime,
      lyrics,
      confidence,
      reason,
    }
  }).sort((left, right) => left.startTime - right.startTime)

  for (let index = 1; index < sections.length; index += 1) {
    if (sections[index].startTime < sections[index - 1].endTime) {
      throw sectionValidationError(`Section ${index + 1} overlaps the previous section.`)
    }
  }

  const chorusCount = sections.filter((section) => section.type === 'chorus').length
  let chorusNumber = 0
  return sections.map((section) => {
    if (section.type !== 'chorus' || chorusCount < 2) return section
    chorusNumber += 1
    return { ...section, label: `Chorus ${chorusNumber}` }
  })
}

function formatSongSectionsLyrics(sections = []) {
  return sections.map((section) => {
    const label = cleanText(section?.label) || defaultLabel(section?.type || 'other')
    const lyrics = cleanLyrics(section?.lyrics)
    return lyrics ? `[${label}]\n${lyrics}` : `[${label}]`
  }).join('\n\n').trim()
}

function sectionPrompt({ durationSecs, segments }) {
  return {
    system: `You recommend editable song sections from Whisper transcript timestamps. Allowed section types: ${SECTION_TYPES.join(', ')}. Preserve timestamps in seconds, keep sections ordered and non-overlapping, and keep every endTime within the supplied audio duration. Do not invent or paraphrase lyrics: lyrics must be copied exactly from the supplied transcript, or be an empty string for non-vocal sections. Repeated choruses must be labelled Chorus 1, Chorus 2, and so on. Use type other with lower confidence when uncertain. Return a JSON object shaped as {"sections":[{"type":"chorus","label":"Chorus 1","startTime":42.5,"endTime":68.2,"lyrics":"exact transcript text","confidence":0.86,"reason":"Repeated lyrics and return of the main hook"}]}. These are recommendations for creator review, not authoritative classifications.`,
    user: JSON.stringify({
      audioDurationSecs: durationSecs,
      transcriptSegments: segments.map((segment) => ({
        startTime: Number(segment.start),
        endTime: Number(segment.end),
        text: cleanText(segment.text),
      })),
    }),
  }
}

async function recommendSongSections({ durationSecs, segments = [], client } = {}) {
  const usableSegments = segments
    .filter((segment) => Number.isFinite(Number(segment.start)) && Number.isFinite(Number(segment.end)) && Number(segment.end) > Number(segment.start))
    .map((segment) => ({ start: Number(segment.start), end: Number(segment.end), text: cleanText(segment.text) }))
  const resolvedDuration = resolveDurationSecs(durationSecs, usableSegments)

  if (usableSegments.length === 0) {
    return [{
      type: 'other', label: 'Unclassified 1', startTime: 0, endTime: resolvedDuration,
      lyrics: '', confidence: 0.1, reason: 'No timestamped vocal transcript was available for classification.',
    }]
  }

  const prompt = sectionPrompt({ durationSecs: resolvedDuration, segments: usableSegments })
  return requestDeepSeekJson({
    ...(client ? { client } : {}),
    purpose: 'song-section recommendation',
    system: prompt.system,
    user: prompt.user,
    validate: (value) => validateSongSections(value, {
      durationSecs: resolvedDuration,
      enforceTranscriptLyrics: true,
      transcriptSegments: usableSegments,
    }),
  })
}

async function ensureSongSectionRecommendations(song, { force = false, client } = {}) {
  const existing = Array.isArray(song.sectionRecommendations) ? song.sectionRecommendations : []
  if (song.sectionRecommendationsConfirmedAt && force) {
    const error = new Error('Creator-confirmed song sections cannot be regenerated without first clearing confirmation.')
    error.status = 409
    throw error
  }
  if (existing.length && (!force || song.sectionRecommendationsConfirmedAt)) return existing

  const recommendations = await recommendSongSections({
    client,
    durationSecs: song.durationSecs,
    segments: song.transcriptionSegments || [],
  })
  await song.update({
    rawLyrics: formatSongSectionsLyrics(recommendations),
    sectionRecommendations: recommendations,
    sectionRecommendationsConfirmedAt: null,
  })
  return recommendations
}

module.exports = {
  SECTION_TYPES,
  ensureSongSectionRecommendations,
  formatSongSectionsLyrics,
  recommendSongSections,
  validateSongSections,
}
