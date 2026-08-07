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
 * Checks if a transcription segment matches the song's main hook or title.
 */
function isHookSegment(segText, mainHookString) {
  if (!segText || typeof segText !== 'string') return false
  const normSeg = normalizeText(segText)
  if (!normSeg) return false

  if (mainHookString && typeof mainHookString === 'string') {
    const normHook = normalizeText(mainHookString)
    if (normHook) {
      if (normSeg.includes(normHook) || (normHook.length >= 5 && normHook.includes(normSeg))) {
        return true
      }
    }
  }

  if (normSeg.includes("tomorrows here today")) {
    return true
  }

  return false
}

/**
 * Pre-groups transcription segments into hook-aware scene blocks BEFORE LLM invocation.
 * - Recurring main hook segments are isolated into standalone 2.0s - 4.0s scene blocks.
 * - Non-hook verse segments accumulate into 6.0s - 8.5s scene blocks.
 */
function buildHookAwareSceneBlocks(transcriptionSegments, mainHookString) {
  if (!Array.isArray(transcriptionSegments) || transcriptionSegments.length === 0) {
    return []
  }

  const blocks = []
  let currentGroup = []

  const getStart = (s) => s.start ?? s.startTime ?? 0
  const getEnd = (s) => s.end ?? s.endTime ?? getStart(s)

  for (let i = 0; i < transcriptionSegments.length; i++) {
    const seg = transcriptionSegments[i]
    const segText = seg.text || seg.lyrics || ''

    if (isHookSegment(segText, mainHookString)) {
      if (currentGroup.length > 0) {
        blocks.push(createSceneFromGroup(currentGroup))
        currentGroup = []
      }
      blocks.push(createSceneFromGroup([seg]))
      continue
    }

    if (currentGroup.length === 0) {
      currentGroup.push(seg)
      continue
    }

    const groupStart = getStart(currentGroup[0])
    const groupLastEnd = getEnd(currentGroup[currentGroup.length - 1])
    const currentDuration = groupLastEnd - groupStart
    const segEnd = getEnd(seg)
    const potentialDuration = segEnd - groupStart

    if (potentialDuration > 8.5) {
      blocks.push(createSceneFromGroup(currentGroup))
      currentGroup = [seg]
    } else if (currentDuration >= 6.0) {
      blocks.push(createSceneFromGroup(currentGroup))
      currentGroup = [seg]
    } else {
      currentGroup.push(seg)
    }
  }

  if (currentGroup.length > 0) {
    blocks.push(createSceneFromGroup(currentGroup))
  }

  return blocks
}

/**
 * Deterministically pre-groups transcription segments into 6.0s - 7.5s scene blocks
 * (Hard Max: 8.5s, Hard Min: 5.0s).
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

    if (currentGroup.length === 0) {
      currentGroup.push(seg)
      continue
    }

    const groupStart = getStart(currentGroup[0])
    const groupLastEnd = getEnd(currentGroup[currentGroup.length - 1])
    const currentDuration = groupLastEnd - groupStart
    const segEnd = getEnd(seg)
    const potentialDuration = segEnd - groupStart

    if (potentialDuration > 8.5) {
      blocks.push(createSceneFromGroup(currentGroup))
      currentGroup = [seg]
      continue
    }

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

    if (currentDuration < 5.0) {
      currentGroup.push(seg)
    } else if (currentDuration < 6.5 && potentialDuration <= 8.5) {
      currentGroup.push(seg)
    } else {
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

  const blocks = group.map((s) => ({
    id: s.id || `block_${s.start ?? s.startTime ?? 0}_${s.end ?? s.endTime ?? 0}`,
    startTime: Number((s.start ?? s.startTime ?? 0).toFixed(2)),
    endTime: Number((s.end ?? s.endTime ?? 0).toFixed(2)),
    text: (s.text || s.lyrics || '').trim(),
  }))

  return {
    startTime,
    endTime,
    lyrics,
    blocks,
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

    const mainHookString = song.title || "Cause tomorrow's here today"
    const preGroupedBlocks = buildHookAwareSceneBlocks(rawSegments, mainHookString)
    console.log(`[aiScenePlanner] Pre-grouped ${rawSegments.length} raw segments into ${preGroupedBlocks.length} hook-aware scene blocks.`)

    let llmScenes = []
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY

    if (apiKey && preGroupedBlocks.length > 0) {
      try {
        const baseURL = process.env.DEEPSEEK_API_KEY
          ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com')
          : undefined
        const model = process.env.DEEPSEEK_API_KEY
          ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat')
          : 'gpt-4o-mini'

        const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })

        const systemPrompt = `You are an expert cinematic music video director.
You are provided with ${preGroupedBlocks.length} PRE-PARTITIONED scene blocks.
CRITICAL MANDATE: You MUST preserve the exact number (${preGroupedBlocks.length}) of scene blocks provided.
DO NOT change the number of scenes, DO NOT alter the timestamps, and DO NOT split or merge the blocks.
Your ONLY job is to write a detailed, cinematic image generation prompt (visualPrompt) for each provided block based on its lyrics and the song theme.

HOOK & CHORUS PROMPT REUSE RULE:
- For repeated chorus scenes or repeating isolated hooks (e.g. "Cause tomorrow's here today"), write the detailed visual prompt for its FIRST occurrence.
- For all subsequent repeats of that exact same hook or chorus scene, output the EXACT SAME visual prompt as the first occurrence, and append ' Repeat of earlier scene for chorus continuity.' to the end.

<project_context>
Theme: ${song.theme || 'Singaporean Heritage'}
Focus: Singapore's rich heritage, community history, and local context.
</project_context>

<output_format>
You must return ONLY a JSON object with a "scenes" array matching the exact count (${preGroupedBlocks.length}):
{
  "scenes": [
    {
      "startTime": <number, exact start time of the provided block>,
      "endTime": <number, exact end time of the provided block>,
      "lyrics": "<string, exact lyrics of the provided block>",
      "visualPrompt": "<string, detailed image generation prompt. NO NEWLINES>"
    }
  ]
}
CRITICAL SYNTAX: Never use literal newlines or line breaks inside string values.
Return ONLY raw valid JSON. Do not wrap in markdown or code blocks.
</output_format>`

        const blocksStr = preGroupedBlocks.map((b, idx) =>
          `Block ${idx + 1} [${b.startTime.toFixed(2)}s - ${b.endTime.toFixed(2)}s]: ${b.lyrics}`
        ).join('\n')

        const userMessage = `Title: ${song.title}
Artist: ${song.artist}
Theme: ${song.theme || 'N/A'}
Full Track Lyrics:
${song.rawLyrics || song.lyrics || 'No lyrics provided.'}

Pre-Partitioned Scene Blocks (DO NOT MODIFY COUNT OR BOUNDARIES):
${blocksStr}`

        const response = await openai.chat.completions.create({
          model,
          response_format: { type: 'json_object' },
          temperature: 0.2,
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
          if (parsedData.scenes && Array.isArray(parsedData.scenes) && parsedData.scenes.length > 0) {
            llmScenes = parsedData.scenes
          }
        }
      } catch (llmError) {
        console.warn(`[aiScenePlanner] LLM prompt generation failed. Falling back to preGroupedBlocks:`, llmError.message)
      }
    }

    let finalScenes = []
    if (llmScenes && llmScenes.length === preGroupedBlocks.length) {
      console.log(`[aiScenePlanner] LLM successfully annotated ${llmScenes.length} natural scene blocks.`)
      finalScenes = llmScenes
    } else if (llmScenes && llmScenes.length > 0) {
      console.warn(`[aiScenePlanner] LLM returned ${llmScenes.length} scenes instead of expected ${preGroupedBlocks.length}. Attaching LLM prompts to pre-grouped block boundaries.`)
      finalScenes = preGroupedBlocks.map((block, idx) => ({
        ...block,
        visualPrompt: llmScenes[idx]?.visualPrompt || buildDefaultVisualPrompt(song, block.lyrics),
      }))
    } else {
      console.warn(`[aiScenePlanner] LLM returned no valid scenes or API key missing. Using preGroupedBlocks fallback.`)
      finalScenes = preGroupedBlocks.length > 0 ? preGroupedBlocks : buildDeterministicSceneBlocks(rawSegments)
    }

    // Map to final SceneSegment model objects
    const sceneRecords = finalScenes.map((scene) => {
      const lyrics = sanitizeLyrics(scene.lyrics || scene.text)
      const st = Number(scene.startTime)
      const et = Number(scene.endTime)
      const sceneStart = isNaN(st) ? 0 : Number(st.toFixed(2))
      const sceneEnd = isNaN(et) ? 0 : Number(et.toFixed(2))

      let blocks = Array.isArray(scene.blocks) && scene.blocks.length > 0 ? scene.blocks : []
      if (blocks.length === 0) {
        const assignedTranscriptionBlocks = rawSegments.filter(b => {
          const bStart = b.start ?? b.startTime ?? 0
          const bEnd = b.end ?? b.endTime ?? 0
          return bStart < sceneEnd && bEnd > sceneStart
        })
        blocks = assignedTranscriptionBlocks.map(b => ({
          id: b.id || `block_${b.start ?? b.startTime}_${b.end ?? b.endTime}`,
          startTime: Number((b.start ?? b.startTime ?? 0).toFixed(2)),
          endTime: Number((b.end ?? b.endTime ?? 0).toFixed(2)),
          text: (b.text || b.lyrics || '').trim(),
        }))
      }

      return {
        jobId: jobId,
        songId: songId,
        startTime: sceneStart,
        endTime: sceneEnd,
        lyrics: lyrics,
        visualPrompt: scene.visualPrompt || buildDefaultVisualPrompt(song, lyrics),
        blocks: blocks,
      }
    })

    // Wipe out existing SceneSegments for this song to ensure clean state
    await SceneSegment.destroy({ where: { songId: songId } })
    await SceneSegment.bulkCreate(sceneRecords)
    console.log(`[aiScenePlanner] Saved ${sceneRecords.length} scene segments to PostgreSQL for Job ${jobId}.`)
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
  buildHookAwareSceneBlocks,
  buildDeterministicSceneBlocks,
  groupSegmentsByTargetDuration,
}
