const { OpenAI } = require('openai')
const { Song, GenerationJob, SceneSegment } = require('../models')

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

async function generateScenePlan(jobId, songId) {
  try {
    const openai = getOpenAI()
    const job = await GenerationJob.findByPk(jobId)
    if (!job) {
      throw new Error(`GenerationJob with ID ${jobId} not found.`)
    }
    if (job.status !== 'PROCESSING') {
      throw new Error(`GenerationJob is in state '${job.status}', expected 'PROCESSING'.`)
    }

    const song = await Song.findByPk(songId)
    if (!song) throw new Error(`Song with ID ${songId} not found.`)
    if (job.songId !== song.id) {
      throw new Error('Generation job does not belong to the requested song.')
    }
    
    // Read pre-extracted timings instead of re-transcribing audio on the fly!
    let rawSegments = song.transcriptionSegments || []
    
    let systemPrompt, userMessage;
    
    if (rawSegments.length > 0) {
      systemPrompt = `You are an expert cinematic music video director and visual storyteller.
Your task is to analyze chronological audio transcription segments and group them into cinematic scenes.

<project_context>
Theme: ${song.theme || 'Singaporean Heritage'}
Focus: Singapore's rich heritage, community history, and local context.
</project_context>

<pacing_and_duration_rules>
- TARGET PACING: Aim for approximately 1 scene every 9 seconds.
- HARD LIMITS: Each scene MUST be between 6 and 12 seconds long.
- MATHEMATICAL STRICTNESS: You must calculate the duration (endTime - startTime). If a verse or chorus exceeds 12 seconds, you MUST split it into multiple scenes, even if it breaks a sentence in half. NEVER create a scene longer than 12 seconds.
</pacing_and_duration_rules>

<lyrical_grouping_rules>
- Do not cut line-by-line (e.g., 2-3 seconds). Group lines until you reach the ~9 second target.
- The starting time of your block must match the start time of the first segment you included.
- The ending time of your block must match the end time of the last segment you included.
- All provided segments must be accounted for chronologically. Do not skip any segments.
- MISSING LYRICS: The "True Lyrics" are the absolute source of truth. If the provided Whisper segments missed lines (e.g., an instrumental intro with faint vocals), YOU MUST STILL include those missing lyrics. Create a scene starting at 0.00s and estimate the duration up to the first valid Whisper segment.
</lyrical_grouping_rules>

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
      "startTime": <number, exact start time of the first segment, 2 decimal places>,
      "endTime": <number, exact end time of the last segment, 2 decimal places>,
      "lyrics": "<string, the EXACT corresponding lyrics from True Lyrics>",
      "visualPrompt": "<string, detailed DALL-E 3 image generation prompt. NO NEWLINES>"
    }
  ]
}
CRITICAL: The output must be valid JSON. Do not round timestamps.
</output_format>`

      let segmentsStr = rawSegments.map((s) => 
        `[${s.start.toFixed(2)}s - ${s.end.toFixed(2)}s]: ${s.text.trim()}`
      ).join('\n');

      userMessage = `Title: ${song.title}
Artist: ${song.artist}
Theme: ${song.theme || 'N/A'}
True Lyrics:
${song.rawLyrics || song.lyrics || 'No lyrics provided.'}

Raw Whisper Transcription Segments (USE THESE ONLY FOR TIMING, THEY MAY CONTAIN ERRORS):
${segmentsStr}`
    } else {
      // Legacy prompt fallback
      systemPrompt = `You are an expert cinematic music video director and visual storyteller. 
Your task is to analyze the provided song's lyrics, theme, title, and artist, and break the song down into a chronological sequence of highly visual scenes.

<project_context>
Theme: ${song.theme || 'Singaporean Heritage'}
Focus: Singapore's rich heritage, community history, and local context.
</project_context>

<pacing_and_duration_rules>
- TARGET PACING: Aim for approximately 1 scene every 9 seconds.
- HARD LIMITS: Each scene MUST be between 6 and 12 seconds long.
- MATHEMATICAL STRICTNESS: If a verse or chorus takes longer than 12 seconds, you MUST split it into multiple scenes. NEVER create a scene longer than 12 seconds.
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
      "startTime": <number, starting second of the scene>,
      "endTime": <number, ending second of the scene>,
      "lyrics": "<string, lyrics for this scene>",
      "visualPrompt": "<string, detailed DALL-E 3 image generation prompt. NO NEWLINES>"
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
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    let responseText = response.choices[0].message.content
    // Strip markdown codeblocks if they exist
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }
    
    // Fix literal newlines inside strings using a regex (replace literal newlines with space)
    // Wait, regex for literal newlines in JSON is complex, but the prompt should fix it.

    let parsedData
    try {
      parsedData = JSON.parse(responseText)
    } catch (parseError) {
      throw new Error(`Failed to parse OpenAI JSON: ${parseError.message}`, { cause: parseError })
    }

    if (!parsedData.scenes || !Array.isArray(parsedData.scenes)) {
      throw new Error('OpenAI response did not contain a valid "scenes" array.')
    }

    // The LLM will now provide the true lyrics directly based on the True Lyrics passed in the prompt.

    const sanitizeLyrics = (raw) => {
      if (!raw || typeof raw !== 'string') return null
      const cleaned = raw.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim()
      return cleaned.length > 0 ? cleaned : null
    }

    const sceneRecords = parsedData.scenes.map((scene) => ({
      jobId: jobId,
      songId: songId,
      startTime: scene.startTime,
      endTime: scene.endTime,
      lyrics: sanitizeLyrics(scene.lyrics || scene.text),
      visualPrompt: scene.visualPrompt,
    }))

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

module.exports = { generateScenePlan }
