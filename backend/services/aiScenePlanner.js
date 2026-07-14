const { OpenAI } = require('openai')
const { Song, GenerationJob, SceneSegment } = require('../models')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function generateScenePlan(jobId, songId) {
  try {
    const job = await GenerationJob.findByPk(jobId)
    if (!job) {
      throw new Error(`GenerationJob with ID ${jobId} not found.`)
    }
    if (job.status !== 'IN_PROGRESS') {
      throw new Error(`GenerationJob is in state '${job.status}', expected 'IN_PROGRESS'.`)
    }

    const song = await Song.findByPk(songId)
    if (!song) throw new Error(`Song with ID ${songId} not found.`)
    
    // Read pre-extracted timings instead of re-transcribing audio on the fly!
    let rawSegments = song.transcriptionSegments || []
    
    let systemPrompt, userMessage;
    
    if (rawSegments.length > 0) {
      systemPrompt = `You are an expert cinematic music video director and visual storyteller. 
Your task is to analyze the provided chronological audio transcription segments for a song, logically group them into coherent lyrical blocks (e.g., full sentences, complete thoughts, or chorus sections), and generate a cinematic scene description for each block.

This project, "Shades of SG", is focused on Singapore's rich heritage and community history. Please keep local context in mind if the theme calls for it.

Rules for grouping:
1. Group the provided transcript segments into coherent lyrical phrases or sentences. Do not arbitrarily cut off mid-sentence.
2. If a section is a repeating chorus, group it exactly the same way each time so the lyrics match perfectly.
3. The starting time of your block must match the start time of the first segment you included.
4. The ending time of your block must match the end time of the last segment you included.
5. All provided segments must be accounted for chronologically. Do not skip segments.
6. KEEP SCENES SHORT: Each scene should ideally be 5 to 10 seconds long. DO NOT let any scene exceed 15 seconds. If a lyrical block spans a long duration because of a slow tempo, you MUST split it into multiple scenes so that the visual pacing matches the music.

For each scene block, your visualPrompt must specify:
- Subject matter and key elements.
- Lighting, atmosphere, and mood.
- Camera angle or cinematic style.
- Integration of the song's theme: ${song.theme || 'Singaporean Heritage'}.

    You must return ONLY a JSON object with a "scenes" array following this exact schema:
    {
      "scenes": [
        {
          "startTime": <number, the exact start time of the first segment in the group>,
          "endTime": <number, the exact end time of the last segment in the group>,
          "lyrics": "<string, the EXACT corresponding lyrics from True Lyrics>",
          "visualPrompt": "<string, detailed DALL-E 3 image generation prompt. DO NOT USE NEWLINES IN THIS STRING>"
        }
      ]
    }
    CRITICAL: The entire output must be valid, parseable JSON. Do not include unescaped quotes or literal newline characters inside strings.`

      let segmentsStr = rawSegments.map((s, i) => 
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

This project, "Shades of SG", is focused on Singapore's rich heritage and community history. Please keep local context in mind if the theme calls for it.

KEEP SCENES SHORT: Each scene should ideally be 5 to 10 seconds long. DO NOT let any scene exceed 15 seconds. If a section of the song is slow, you MUST split it into multiple scenes so that the visual pacing matches the music.

For each scene, you must generate a rich, highly detailed imagePrompt optimized for DALL-E 3. 
Each imagePrompt must specify:
- Subject matter and key elements.
- Lighting, atmosphere, and mood.
- Camera angle or cinematic style.
- Integration of the song's theme: ${song.theme || 'Singaporean Heritage'}.

You must return ONLY a JSON object. The root must have a property "scenes" which is an array of objects.
The JSON schema must strictly follow this structure:
{
  "scenes": [
    {
      "startTime": <number, starting second of the scene>,
      "endTime": <number, ending second of the scene>,
      "lyrics": "<string, the EXACT corresponding lyrics for this scene>",
      "visualPrompt": "<string, detailed DALL-E 3 image generation prompt. DO NOT USE NEWLINES IN THIS STRING>"
    }
  ]
}
CRITICAL: The entire output must be valid, parseable JSON. Do not include unescaped quotes or literal newline characters inside strings.`

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
