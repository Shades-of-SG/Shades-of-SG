const { OpenAI } = require('openai')
const { Song, GenerationJob, SceneSegment } = require('../models')

async function generateScenePlan(jobId, songId) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is missing in process.env.')
    }

    const openai = new OpenAI({
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      apiKey,
    })

    const job = await GenerationJob.findByPk(jobId)
    if (!job) {
      throw new Error(`GenerationJob with ID ${jobId} not found.`)
    }
    if (job.status !== 'PROCESSING') {
      throw new Error(`GenerationJob is in state '${job.status}', expected 'PROCESSING'.`)
    }

    const song = await Song.findByPk(songId)
    if (!song) throw new Error(`Song with ID ${songId} not found.`)
    
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
- TARGET PACING: Aim for scenes between 6 to 9 seconds long.
- THE SEGMENT COUNT RULE: To hit this target pacing, NEVER group more than 2 to 3 Whisper segments into a single scene block. If you group 4 or more segments together, YOU ARE FAILING.
- CACHE SYNCING (CRITICAL): If you encounter repeating lyrics (like a chorus), you MUST split them using the EXACT same lyrical chunks every single time they occur. If you split a chorus into "Part A" and "Part B" at the 1:00 mark, you MUST split it into "Part A" and "Part B" at the 3:00 mark. Do NOT combine them into "Part A + B" later, or you will break the video caching engine!
</pacing_and_duration_rules>

<lyrical_grouping_rules>
- SPLITTING: Split at natural pauses (end of a line, comma, or clear pause). If a sentence or chorus exceeds 9 seconds, you MUST split it into multiple scenes. It is perfectly fine to split a long sentence if necessary to obey the 9-second limit.
- The starting time of your block must match the start time of the first segment you included.
- The ending time of your block must match the end time of the last segment you included.
- All provided segments must be accounted for chronologically. Do not skip any segments.
- MISSING LYRICS: The "True Lyrics" are the absolute source of truth. If the provided Whisper segments missed lines (e.g., an instrumental intro with faint vocals), YOU MUST STILL include those missing lyrics. Create a scene starting at 0.00s and estimate the duration up to the first valid Whisper segment.
</lyrical_grouping_rules>

<example_split>
Given a chorus consisting of 4 Whisper segments:
[49.44s - 52.40s]: Cause tomorrow's here today
[52.40s - 55.40s]: Dream away
[55.40s - 61.40s]: Take the world by the hand
[61.40s - 66.94s]: Cause tomorrow's here today

CORRECT (Grouped by 1-2 segments, ~6s-9s each):
Scene 1 (49.44 - 55.40s): Cause tomorrow's here today Dream away
Scene 2 (55.40 - 61.40s): Take the world by the hand
Scene 3 (61.40 - 66.94s): Cause tomorrow's here today (Exact lyric match triggers cache!)

INCORRECT (Grouped 4 segments, violates rules):
Scene 1 (49.44 - 66.94s): Cause tomorrow's here today Dream away Take the world by the hand Cause tomorrow's here today
</example_split>

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
Return ONLY raw valid JSON. Do not wrap in markdown or code blocks.
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
- TARGET PACING: Aim for scenes between 6 to 9 seconds long.
- THE SEGMENT COUNT RULE: To hit this target pacing, NEVER group more than 2 to 3 Whisper segments into a single scene block. If you group 4 or more segments together, YOU ARE FAILING.
- CACHE SYNCING (CRITICAL): If you encounter repeating lyrics (like a chorus), you MUST split them using the EXACT same lyrical chunks every single time they occur. If you split a chorus into "Part A" and "Part B" at the 1:00 mark, you MUST split it into "Part A" and "Part B" at the 3:00 mark. Do NOT combine them into "Part A + B" later, or you will break the video caching engine!
</pacing_and_duration_rules>

<lyrical_grouping_rules>
- SPLITTING: Split at natural pauses (end of a line, comma, or clear pause). If a sentence or chorus exceeds 9 seconds, you MUST split it into multiple scenes. It is perfectly fine to split a long sentence if necessary to obey the 9-second limit.
</lyrical_grouping_rules>

<example_split>
Given a chorus consisting of 4 Whisper segments:
[49.44s - 52.40s]: Cause tomorrow's here today
[52.40s - 55.40s]: Dream away
[55.40s - 61.40s]: Take the world by the hand
[61.40s - 66.94s]: Cause tomorrow's here today

CORRECT (Grouped by 1-2 segments, ~6s-9s each):
Scene 1 (49.44 - 55.40s): Cause tomorrow's here today Dream away
Scene 2 (55.40 - 61.40s): Take the world by the hand
Scene 3 (61.40 - 66.94s): Cause tomorrow's here today (Exact lyric match triggers cache!)

INCORRECT (Grouped 4 segments, violates rules):
Scene 1 (49.44 - 66.94s): Cause tomorrow's here today Dream away Take the world by the hand Cause tomorrow's here today
</example_split>

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
Return ONLY raw valid JSON. Do not wrap in markdown or code blocks.
</output_format>`

      userMessage = `Title: ${song.title}
Artist: ${song.artist}
Theme: ${song.theme || 'N/A'}
Lyrics:
${song.rawLyrics || song.lyrics || 'No lyrics provided.'}`
    }

    const response = await openai.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    let responseText = (response.choices[0]?.message?.content || '').trim()

    // Strip markdown codeblocks if they exist
    responseText = responseText.replace(/```json|```/g, '').trim()

    if (!responseText) {
      throw new Error('AI completion returned empty response.')
    }

    let parsedData
    try {
      parsedData = JSON.parse(responseText)
    } catch (parseError) {
      throw new Error(`Failed to parse AI JSON response: ${parseError.message}`, { cause: parseError })
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
