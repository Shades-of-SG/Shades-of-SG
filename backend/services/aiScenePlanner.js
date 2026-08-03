const { OpenAI } = require('openai')
const { Song, GenerationJob, SceneSegment } = require('../models')

/**
 * Normalizes text for canonical chorus matching and cache key alignment.
 */
function normalizeText(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .toLowerCase()
    .replace(/\[.*?\]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Deterministically pre-groups transcription segments into 6.0s - 7.5s scene blocks
 * (Hard Max: 8.5s, Hard Min: 5.0s).
 * Identifies identical/repeating lyric phrases (choruses) and locks them into exact
 * segment splits every time they appear.
 * For a 3-minute track (180s), this produces between 25 and 30 scene blocks (~6.5s average).
 */
function buildDeterministicSceneBlocks(transcriptionSegments) {
  if (!Array.isArray(transcriptionSegments) || transcriptionSegments.length === 0) {
    return []
  }

  const canonicalChorusPatterns = new Map()
  const blocks = []
  let currentGroup = []

  const getStart = (s) => s.start ?? s.startTime ?? 0
  const getEnd = (s) => s.end ?? s.endTime ?? getStart(s)

  for (let i = 0; i < transcriptionSegments.length; i++) {
    const seg = transcriptionSegments[i]
    const segStart = getStart(seg)
    const segEnd = getEnd(seg)

    if (currentGroup.length === 0) {
      currentGroup.push(seg)
      continue
    }

    const groupStart = getStart(currentGroup[0])
    const groupLastEnd = getEnd(currentGroup[currentGroup.length - 1])
    const currentDuration = groupLastEnd - groupStart
    const potentialDuration = segEnd - groupStart

    // Hard max limit check: 8.5 seconds
    if (potentialDuration > 8.5) {
      blocks.push(createSceneFromGroup(currentGroup))
      currentGroup = [seg]
      continue
    }

    // Chorus pattern matching: check if starting line matches a known canonical chorus
    const firstLineKey = normalizeText(currentGroup[0].text || currentGroup[0].lyrics || '')
    const knownPattern = canonicalChorusPatterns.get(firstLineKey)

    if (knownPattern && currentGroup.length < knownPattern.length) {
      currentGroup.push(seg)
      if (currentGroup.length === knownPattern.length) {
        blocks.push(createSceneFromGroup(currentGroup))
        currentGroup = []
      }
      continue
    }

    // Pacing accumulator logic: target 6.0s - 7.5s (min 5.0s, max 8.5s)
    if (currentDuration < 5.0) {
      currentGroup.push(seg)
    } else if (currentDuration < 6.5 && potentialDuration <= 8.5) {
      currentGroup.push(seg)
    } else {
      // Save canonical pattern if this group starts a repeating line
      if (firstLineKey && currentGroup.length > 1 && !canonicalChorusPatterns.has(firstLineKey)) {
        const pattern = currentGroup.map((s) => normalizeText(s.text || s.lyrics || ''))
        canonicalChorusPatterns.set(firstLineKey, pattern)
      }

      blocks.push(createSceneFromGroup(currentGroup))
      currentGroup = [seg]
    }
  }

  if (currentGroup.length > 0) {
    blocks.push(createSceneFromGroup(currentGroup))
  }

  return blocks
}

// Backward compatibility alias for groupSegmentsByTargetDuration
const groupSegmentsByTargetDuration = (segments) => buildDeterministicSceneBlocks(segments)

function createSceneFromGroup(group) {
  const first = group[0]
  const last = group[group.length - 1]
  const startTime = Number((first.start ?? first.startTime ?? 0).toFixed(2))
  const endTime = Number((last.end ?? last.endTime ?? startTime).toFixed(2))

  const lyricsParts = group
    .map((s) => (s.text || s.lyrics || '').trim())
    .filter(Boolean)

  const lyrics = lyricsParts.join(' ').replace(/\s+/g, ' ')

  const promptParts = group
    .map((s) => (s.visualPrompt || s.visual_prompt || '').trim())
    .filter(Boolean)

  const visualPrompt = promptParts.length > 0 ? promptParts.join(' ') : null

  return {
    startTime,
    endTime,
    lyrics,
    ...(visualPrompt ? { visualPrompt } : {}),
  }
}

function buildDefaultVisualPrompt(song, lyrics) {
  const theme = song.theme || 'Singaporean Heritage'
  const lyricSnippet = lyrics ? ` depicting: "${lyrics}"` : ''
  return `Cinematic music video scene${lyricSnippet}. Theme: ${theme}, vibrant cultural atmosphere, dramatic lighting, shot on 35mm lens, 8k resolution.`
}

const sanitizeLyrics = (raw) => {
  if (!raw || typeof raw !== 'string') return null
  const cleaned = raw.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim()
  return cleaned.length > 0 ? cleaned : null
}

async function generateScenePlan(jobId, songId) {
  try {
    const job = await GenerationJob.findByPk(jobId)
    if (!job) {
      throw new Error(`GenerationJob with ID ${jobId} not found.`)
    }
    if (job.status !== 'PROCESSING') {
      throw new Error(`GenerationJob is in state '${job.status}', expected 'PROCESSING'.`)
    }

    const song = await Song.findByPk(songId)
    if (!song) throw new Error(`Song with ID ${songId} not found.`)

    let rawSegments = song.transcriptionSegments || []

    // 1. Programmatic Pre-Grouping: Build deterministic 6.0s - 7.5s scene blocks (~25-30 for 3 min track)
    const deterministicBlocks = buildDeterministicSceneBlocks(rawSegments)
    console.log(`[aiScenePlanner] Pre-grouped ${rawSegments.length} raw segments into ${deterministicBlocks.length} deterministic scene blocks (target 25-30).`)

    let llmScenes = []
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY

    if (apiKey && deterministicBlocks.length > 0) {
      try {
        const baseURL = process.env.DEEPSEEK_API_KEY
          ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com')
          : undefined
        const model = process.env.DEEPSEEK_API_KEY
          ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat')
          : 'gpt-4o-mini'

        const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })

        const systemPrompt = `You are an expert cinematic music video director and visual storyteller.
You are provided with PRE-PARTITIONED scene blocks averaging 6 to 7 seconds each.
CRITICAL MANDATE: You MUST preserve the exact number (${deterministicBlocks.length}) of scene blocks provided in the user message.
DO NOT combine, merge, or split these pre-partitioned scene blocks.
Your ONLY job is to generate a detailed, cinematic DALL-E 3 visual prompt for each scene block based on its lyrics and the song's theme.

<project_context>
Theme: ${song.theme || 'Singaporean Heritage'}
Focus: Singapore's rich heritage, community history, and local context.
</project_context>

<output_format>
You must return ONLY a JSON object with a "scenes" array matching the exact count (${deterministicBlocks.length}):
{
  "scenes": [
    {
      "startTime": <number, exact start time of the block>,
      "endTime": <number, exact end time of the block>,
      "lyrics": "<string, exact lyrics of the block>",
      "visualPrompt": "<string, detailed DALL-E 3 image generation prompt. NO NEWLINES>"
    }
  ]
}
CRITICAL SYNTAX: Never use literal newlines or line breaks inside string values.
Return ONLY raw valid JSON. Do not wrap in markdown or code blocks.
</output_format>`

        const blocksStr = deterministicBlocks.map((b, idx) =>
          `Block ${idx + 1} [${b.startTime.toFixed(2)}s - ${b.endTime.toFixed(2)}s]: ${b.lyrics}`
        ).join('\n')

        const userMessage = `Title: ${song.title}
Artist: ${song.artist}
Theme: ${song.theme || 'N/A'}
True Lyrics:
${song.rawLyrics || song.lyrics || 'No lyrics provided.'}

Pre-Partitioned Scene Blocks (DO NOT MODIFY COUNT OR BOUNDARIES):
${blocksStr}`

        const response = await openai.chat.completions.create({
          model,
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 8192,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        })

        const responseText = (response.choices[0]?.message?.content || '').trim()
        let cleanedText = responseText.replace(/```json|```/g, '').trim()
        cleanedText = cleanedText.replace(/[\r\n\t]+/g, ' ')

        if (cleanedText) {
          const parsedData = JSON.parse(cleanedText)
          if (parsedData.scenes && Array.isArray(parsedData.scenes)) {
            llmScenes = parsedData.scenes
          }
        }
      } catch (llmError) {
        console.warn(`[aiScenePlanner] LLM prompt generation failed. Falling back to deterministic blocks:`, llmError.message)
      }
    }

    // 3. Fallback & Validation: If LLM alters scene count or returns scenes > 8.5s, fall back directly to deterministic blocks
    let finalScenes = []
    if (llmScenes.length === deterministicBlocks.length) {
      const isValidPacing = llmScenes.slice(0, -1).every((s) => {
        const dur = Number(s.endTime) - Number(s.startTime)
        return dur >= 4.5 && dur <= 8.5
      })

      if (isValidPacing) {
        finalScenes = llmScenes
      } else {
        console.warn(`[aiScenePlanner] LLM scenes exceeded duration limits (>8.5s). Attaching LLM prompts to deterministic block timestamps.`)
        finalScenes = deterministicBlocks.map((block, idx) => ({
          ...block,
          visualPrompt: llmScenes[idx]?.visualPrompt || buildDefaultVisualPrompt(song, block.lyrics),
        }))
      }
    } else {
      if (llmScenes.length > 0) {
        console.warn(`[aiScenePlanner] LLM returned ${llmScenes.length} scenes instead of expected ${deterministicBlocks.length}. Falling back to deterministic blocks.`)
      }
      finalScenes = deterministicBlocks
    }

    // Map to final SceneSegment model objects
    const sceneRecords = finalScenes.map((scene) => {
      const lyrics = sanitizeLyrics(scene.lyrics || scene.text)
      return {
        jobId: jobId,
        songId: songId,
        startTime: Number(Number(scene.startTime).toFixed(2)),
        endTime: Number(Number(scene.endTime).toFixed(2)),
        lyrics: lyrics,
        visualPrompt: scene.visualPrompt || buildDefaultVisualPrompt(song, lyrics),
      }
    })

    // Wipe out existing SceneSegments for this song to ensure clean state
    await SceneSegment.destroy({ where: { songId: songId } })
    await SceneSegment.bulkCreate(sceneRecords)
    console.log(`[aiScenePlanner] Saved ${sceneRecords.length} scene segments (averaging 6-7s) to PostgreSQL for Job ${jobId}.`)
    return sceneRecords
  } catch (error) {
    console.error(`[aiScenePlanner] Critical error during scene generation for Job ${jobId}:`, error)
    try {
      const failedJob = await GenerationJob.findByPk(jobId)
      if (failedJob) {
        failedJob.status = 'FAILED'
        failedJob.errorMessage = error.message.substring(0, 1000)
        await failedJob.save()
      }
    } catch (dbError) {
      console.error(`[aiScenePlanner] Failsafe: Could not update job to FAILED.`, dbError)
    }
    throw error
  }
}

module.exports = {
  generateScenePlan,
  buildDeterministicSceneBlocks,
  groupSegmentsByTargetDuration,
}
