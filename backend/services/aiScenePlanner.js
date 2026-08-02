const { OpenAI } = require('openai')
const { Song, GenerationJob, SceneSegment } = require('../models')

/**
 * Deterministically groups transcription or scene segments into cinematic scene blocks
 * targeting minDuration (default 5.0s) and targetDuration (default 7.5s).
 * Ensures scene durations hit 6.0s - 9.0s and produces ~25-32 scenes for a 3-minute track.
 */
function groupSegmentsByTargetDuration(transcriptionSegments, minDuration = 5.0, targetDuration = 7.5) {
  if (!Array.isArray(transcriptionSegments) || transcriptionSegments.length === 0) {
    return []
  }

  const grouped = []
  let currentGroup = []

  for (let i = 0; i < transcriptionSegments.length; i++) {
    const seg = transcriptionSegments[i]
    const segStart = seg.start ?? seg.startTime ?? 0
    const segEnd = seg.end ?? seg.endTime ?? segStart

    if (currentGroup.length === 0) {
      currentGroup.push(seg)
      continue
    }

    const groupStart = currentGroup[0].start ?? currentGroup[0].startTime ?? 0
    const currentLastEnd = currentGroup[currentGroup.length - 1].end ?? currentGroup[currentGroup.length - 1].endTime ?? groupStart
    const currentDuration = currentLastEnd - groupStart
    const potentialDuration = segEnd - groupStart

    // If current group duration is under minDuration, keep adding segments
    if (currentDuration < minDuration) {
      currentGroup.push(seg)
    } 
    // If adding this segment keeps total duration <= 9.0s and current duration < targetDuration
    else if (currentDuration < targetDuration && potentialDuration <= 9.0) {
      currentGroup.push(seg)
    } 
    // Otherwise, finalize current group and start a new group with seg
    else {
      grouped.push(createSceneFromGroup(currentGroup))
      currentGroup = [seg]
    }
  }

  if (currentGroup.length > 0) {
    grouped.push(createSceneFromGroup(currentGroup))
  }

  return grouped
}

function createSceneFromGroup(group) {
  const first = group[0]
  const last = group[group.length - 1]
  const startTime = Number((first.start ?? first.startTime ?? 0).toFixed(2))
  const endTime = Number((last.end ?? last.endTime ?? startTime).toFixed(2))

  const lyricsParts = group
    .map(s => (s.text || s.lyrics || '').trim())
    .filter(Boolean)

  const lyrics = lyricsParts.join(' ').replace(/\s+/g, ' ')

  const promptParts = group
    .map(s => (s.visualPrompt || s.visual_prompt || '').trim())
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
    let scenesToSave = []

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
    if (apiKey) {
      try {
        const baseURL = process.env.DEEPSEEK_API_KEY
          ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com')
          : undefined
        const model = process.env.DEEPSEEK_API_KEY
          ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat')
          : 'gpt-4o-mini'

        const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })

        let systemPrompt, userMessage

        if (rawSegments.length > 0) {
          systemPrompt = `You are an expert cinematic music video director and visual storyteller.
Your task is to analyze chronological audio transcription segments and group them into cinematic scenes.

<project_context>
Theme: ${song.theme || 'Singaporean Heritage'}
Focus: Singapore's rich heritage, community history, and local context.
</project_context>

<canonical_chorus_rules>
- CANONICAL CHORUS RULE (HIGHEST PRIORITY):
  1. Before grouping segments into scenes, scan the song's True Lyrics to identify all repeating stanzas/choruses.
  2. Establish a CANONICAL LINE GROUPING for the first occurrence of a chorus (e.g., Line 1 + Line 2 = Scene Block Alpha, Line 3 + Line 4 = Scene Block Beta).
  3. FOR EVERY SUBSEQUENT REPEAT OF THIS CHORUS, YOU MUST USE THE EXACT SAME LYRICAL LINE GROUPINGS. Do NOT change line splits between Chorus 1, Chorus 2, or Chorus 3.
  4. Require exact string matching between True Lyrics and segment outputs for repeated sections.
- PACING EXEMPTION FOR REPEATED CHORUS UNITS:
  The 6.0s - 9.0s target pacing rule is strictly secondary to the Canonical Chorus Rule. If a locked chorus line grouping evaluates to 4.5s or 10.0s in a repeated section, ACCEPT THE TIMING VARIANCE. Maintaining identical lyric string outputs across choruses is MANDATORY for video frame caching.
</canonical_chorus_rules>

<pacing_and_duration_rules>
- TARGET PACING: Aim for scenes between 6.0 to 9.0 seconds long.
- STRICT DURATION RULE: NEVER output a scene with a total duration shorter than 5.0 seconds unless it is the final trailing silence/outro of the song or a locked canonical chorus unit.
- GROUPING RULE: You MUST group 2 to 3 consecutive Whisper segments into a single scene block to hit the 6.0s to 9.0s duration per scene. Do NOT output a separate scene for every single Whisper segment!
</pacing_and_duration_rules>

<visual_prompt_requirements>
For each scene block, your visualPrompt must specify:
1. Subject matter and key elements.
2. Lighting, atmosphere, and mood.
3. Camera angle or cinematic style.
4. Integration of the song's theme.
</visual_prompt_requirements>

<output_format>
You must return ONLY a JSON object with a "scenes" array following this exact schema:
{
  "scenes": [
    {
      "startTime": <number, exact start time of first segment in block, 2 decimal places>,
      "endTime": <number, exact end time of last segment in block, 2 decimal places>,
      "lyrics": "<string, corresponding lyrics>",
      "visualPrompt": "<string, detailed DALL-E 3 image generation prompt. NO NEWLINES>"
    }
  ]
}
CRITICAL: Every scene (except the last scene or locked chorus repeats) MUST have (endTime - startTime) >= 5.0.
CRITICAL SYNTAX: Never use literal newlines or line breaks inside string values.
Return ONLY raw valid JSON. Do not wrap in markdown or code blocks.
</output_format>`

          let segmentsStr = rawSegments.map((s) =>
            `[${(s.start ?? s.startTime ?? 0).toFixed(2)}s - ${(s.end ?? s.endTime ?? 0).toFixed(2)}s]: ${(s.text || s.lyrics || '').trim()}`
          ).join('\n')

          userMessage = `Title: ${song.title}
Artist: ${song.artist}
Theme: ${song.theme || 'N/A'}
True Lyrics:
${song.rawLyrics || song.lyrics || 'No lyrics provided.'}

Raw Whisper Transcription Segments:
${segmentsStr}`
        } else {
          systemPrompt = `You are an expert cinematic music video director and visual storyteller.
Your task is to analyze the provided song's lyrics, theme, title, and artist, and break the song down into a chronological sequence of highly visual scenes.

<canonical_chorus_rules>
- CANONICAL CHORUS RULE (HIGHEST PRIORITY):
  1. Before grouping segments into scenes, scan the song's True Lyrics to identify all repeating stanzas/choruses.
  2. Establish a CANONICAL LINE GROUPING for the first occurrence of a chorus (e.g., Line 1 + Line 2 = Scene Block Alpha, Line 3 + Line 4 = Scene Block Beta).
  3. FOR EVERY SUBSEQUENT REPEAT OF THIS CHORUS, YOU MUST USE THE EXACT SAME LYRICAL LINE GROUPINGS. Do NOT change line splits between Chorus 1, Chorus 2, or Chorus 3.
  4. Require exact string matching between True Lyrics and segment outputs for repeated sections.
- PACING EXEMPTION FOR REPEATED CHORUS UNITS:
  The 6.0s - 9.0s target pacing rule is strictly secondary to the Canonical Chorus Rule. If a locked chorus line grouping evaluates to 4.5s or 10.0s in a repeated section, ACCEPT THE TIMING VARIANCE. Maintaining identical lyric string outputs across choruses is MANDATORY for video frame caching.
</canonical_chorus_rules>

<pacing_and_duration_rules>
- TARGET PACING: Aim for scenes between 6.0 to 9.0 seconds long.
- STRICT DURATION RULE: NEVER output a scene with a total duration shorter than 5.0 seconds unless it is the final trailing silence/outro of the song or a locked canonical chorus unit.
</pacing_and_duration_rules>

<output_format>
{
  "scenes": [
    {
      "startTime": <number, starting second of the scene>,
      "endTime": <number, ending second of the scene>,
      "lyrics": "<string, lyrics for this scene>",
      "visualPrompt": "<string, detailed image generation prompt. NO NEWLINES>"
    }
  ]
}
</output_format>`

          userMessage = `Title: ${song.title}
Artist: ${song.artist}
Theme: ${song.theme || 'N/A'}
Lyrics:
${song.rawLyrics || song.lyrics || 'No lyrics provided.'}`
        }

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
          if (parsedData.scenes && Array.isArray(parsedData.scenes) && parsedData.scenes.length > 0) {
            scenesToSave = parsedData.scenes
          }
        }
      } catch (llmError) {
        console.warn(`[aiScenePlanner] LLM scene planning failed or unavailable. Falling back to programmatic grouping:`, llmError.message)
      }
    }

    // Check if LLM output scenes need duration enforcement / grouping
    if (scenesToSave.length > 0) {
      const hasShortScenes = scenesToSave.slice(0, -1).some(s => (s.endTime - s.startTime) < 5.0)
      if (hasShortScenes) {
        console.log(`[aiScenePlanner] LLM generated short scenes (<5.0s). Applying groupSegmentsByTargetDuration...`)
        scenesToSave = groupSegmentsByTargetDuration(scenesToSave, 5.0, 7.5)
      }
    }

    // Fallback: If no scenes from LLM, use raw Whisper segments through groupSegmentsByTargetDuration
    if (scenesToSave.length === 0) {
      console.log(`[aiScenePlanner] Applying deterministic fallback grouping on raw transcription segments...`)
      scenesToSave = groupSegmentsByTargetDuration(rawSegments, 5.0, 7.5)
    }

    // Map to final SceneSegment model objects
    const sceneRecords = scenesToSave.map((scene) => {
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

    // Wipe out existing SceneSegments for this song to ensure no old micro-scenes remain
    await SceneSegment.destroy({ where: { songId: songId } })
    await SceneSegment.bulkCreate(sceneRecords)
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

module.exports = { generateScenePlan, groupSegmentsByTargetDuration }
