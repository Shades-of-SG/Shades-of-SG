const {
  Song,
  GenerationJob,
  SceneSegment,
} = require('../models')
const { getOpenAIClient } = require('./openaiClient')

const MAX_SCENE_DURATION_SECONDS = 15

function stripCodeFence(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

function sanitizeLyrics(raw) {
  if (!raw || typeof raw !== 'string') {
    return null
  }

  const cleaned = raw
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || null
}

function normalizeTranscriptionSegments(value) {
  if (!value) {
    return []
  }

  let parsed = value

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .map((segment) => {
      const start = Number(
        segment.start
        ?? segment.startTime
        ?? segment.start_time,
      )

      const end = Number(
        segment.end
        ?? segment.endTime
        ?? segment.end_time,
      )

      const text = String(
        segment.text
        ?? segment.lyrics
        ?? '',
      ).trim()

      if (
        !Number.isFinite(start)
        || !Number.isFinite(end)
        || end <= start
      ) {
        return null
      }

      return {
        start,
        end,
        text,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)
}

function validateScenes(scenes) {
  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error(
      'OpenAI response did not contain a valid, non-empty "scenes" array.',
    )
  }

  return scenes.map((scene, index) => {
    const startTime = Number(scene.startTime)
    const endTime = Number(scene.endTime)

    if (
      !Number.isFinite(startTime)
      || !Number.isFinite(endTime)
      || endTime <= startTime
    ) {
      throw new Error(
        `Scene ${index + 1} contains invalid timing.`,
      )
    }

    if (
      endTime - startTime
      > MAX_SCENE_DURATION_SECONDS + 0.5
    ) {
      throw new Error(
        `Scene ${index + 1} exceeds the ${MAX_SCENE_DURATION_SECONDS}-second maximum.`,
      )
    }

    const visualPrompt = String(
      scene.visualPrompt || '',
    ).trim()

    if (!visualPrompt) {
      throw new Error(
        `Scene ${index + 1} is missing visualPrompt.`,
      )
    }

    return {
      startTime,
      endTime,
      lyrics: sanitizeLyrics(
        scene.lyrics || scene.text,
      ),
      visualPrompt: visualPrompt
        .replace(/\s+/g, ' ')
        .trim(),
    }
  })
}

function buildTimestampedPrompt(song, rawSegments) {
  const systemPrompt = `You are an expert cinematic music video director and visual storyteller.

Analyze the provided chronological transcription segments and group them into coherent lyrical blocks for a cinematic music video.

The project, "Shades of SG", focuses on Singapore's heritage, culture, and community history. Reflect this local context where appropriate.

Rules:
1. Group segments into complete lyrical phrases, sentences, or coherent chorus sections.
2. Do not omit any provided transcription segment.
3. Keep all scenes chronological.
4. Each scene startTime must match the first included segment's start time.
5. Each scene endTime must match the last included segment's end time.
6. Repeated chorus sections should be grouped consistently.
7. Scenes should ideally last 5 to 10 seconds.
8. No scene may exceed 15 seconds. Split long sections when necessary.
9. Lyrics must use the supplied true lyrics where possible.
10. visualPrompt must be a single-line cinematic image-generation prompt.

Each visualPrompt must specify:
- subject and key visual elements
- lighting, atmosphere, and mood
- camera angle or cinematic style
- integration of the song theme: ${song.theme || 'Singaporean Heritage'}

Return only valid JSON in this exact structure:

{
  "scenes": [
    {
      "startTime": 0,
      "endTime": 8,
      "lyrics": "Exact corresponding lyrics",
      "visualPrompt": "Detailed single-line cinematic image prompt"
    }
  ]
}`

  const segmentsText = rawSegments
    .map(
      (segment, index) =>
        `${index + 1}. [${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s] ${segment.text}`,
    )
    .join('\n')

  const userMessage = `Title: ${song.title}
Artist: ${song.artist || 'Unknown'}
Theme: ${song.theme || 'N/A'}

True Lyrics:
${song.rawLyrics || 'No verified lyrics provided.'}

Timestamped Transcription Segments:
${segmentsText}`

  return {
    systemPrompt,
    userMessage,
  }
}

function buildFallbackPrompt(song) {
  const systemPrompt = `You are an expert cinematic music video director and visual storyteller.

Break the supplied song lyrics into a chronological sequence of short cinematic scenes.

The project, "Shades of SG", focuses on Singapore's heritage, culture, and community history. Reflect this local context where appropriate.

Rules:
1. Scenes should ideally last 5 to 10 seconds.
2. No scene may exceed 15 seconds.
3. Keep scenes chronological.
4. Do not omit major lyrical sections.
5. visualPrompt must be a single-line cinematic image-generation prompt.

Each visualPrompt must specify:
- subject and key visual elements
- lighting, atmosphere, and mood
- camera angle or cinematic style
- integration of the song theme: ${song.theme || 'Singaporean Heritage'}

Return only valid JSON in this exact structure:

{
  "scenes": [
    {
      "startTime": 0,
      "endTime": 8,
      "lyrics": "Exact corresponding lyrics",
      "visualPrompt": "Detailed single-line cinematic image prompt"
    }
  ]
}`

  const userMessage = `Title: ${song.title}
Artist: ${song.artist || 'Unknown'}
Theme: ${song.theme || 'N/A'}

Lyrics:
${song.rawLyrics || song.lyrics || 'No lyrics provided.'}`

  return {
    systemPrompt,
    userMessage,
  }
}

/**
 * Generates and stores the chronological scene plan for a generation job.
 *
 * @param {string|number} jobId
 * @param {string|number} songId
 * @returns {Promise<Array>}
 */
async function generateScenePlan(jobId, songId) {
  const job = await GenerationJob.findByPk(jobId)

  if (!job) {
    throw new Error(
      `GenerationJob with ID ${jobId} not found.`,
    )
  }

  if (job.status !== 'PROCESSING') {
    throw new Error(
      `GenerationJob is in state '${job.status}', expected 'PROCESSING'.`,
    )
  }

  const song = await Song.findByPk(songId)

  if (!song) {
    throw new Error(
      `Song with ID ${songId} not found.`,
    )
  }

  try {
    const rawSegments =
      normalizeTranscriptionSegments(
        song.transcriptionSegments,
      )

    const {
      systemPrompt,
      userMessage,
    } = rawSegments.length > 0
      ? buildTimestampedPrompt(
          song,
          rawSegments,
        )
      : buildFallbackPrompt(song)

    const response =
      await getOpenAIClient()
        .chat.completions.create({
          model:
            process.env.OPENAI_SCENE_MODEL
            || 'gpt-4o',
          response_format: {
            type: 'json_object',
          },
          temperature: 0.7,
          max_tokens: 4096,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
        })

    const responseText = stripCodeFence(
      response.choices?.[0]?.message?.content,
    )

    if (!responseText) {
      throw new Error(
        'OpenAI returned an empty scene-plan response.',
      )
    }

    let parsedData

    try {
      parsedData = JSON.parse(responseText)
    } catch (parseError) {
      throw new Error(
        `Failed to parse OpenAI scene-plan JSON: ${parseError.message}`,
        {
          cause: parseError,
        },
      )
    }

    const scenes = validateScenes(
      parsedData.scenes,
    )

    const sceneRecords = scenes.map(
      (scene) => ({
        songId,
        startTime: scene.startTime,
        endTime: scene.endTime,
        lyrics: scene.lyrics,
        visualPrompt:
          scene.visualPrompt,
      }),
    )

    // Prevent duplicate scenes when retrying the same job.
    await SceneSegment.destroy({
      where: {
        songId,
      },
    })

    await SceneSegment.bulkCreate(
      sceneRecords,
    )

    return sceneRecords
  } catch (error) {
    console.error(
      `[aiScenePlanner] Scene generation failed for job ${jobId}:`,
      error,
    )

    // Do not update the job here. The generation controller owns
    // FAILED/COMPLETED lifecycle transitions for the whole pipeline.
    throw error
  }
}

module.exports = {
  generateScenePlan,
}